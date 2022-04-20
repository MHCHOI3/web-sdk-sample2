import { makeStyles, TextField } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import PenHelper from '../utils/PenHelper';
import { fabric } from 'fabric';
import api from '../server/NoteServer';
import { Dot, PageInfo, PaperBase } from '../utils/type';

const useStyle = makeStyles(() => ({
  mainBackground: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  hoverCanvasContainer: {
    position: 'absolute',
  },
  mainCanvas: {
    position: 'absolute',
  },
  hoverCanvas: {
    position: 'absolute',
  },
  inputContainer: {
    position: 'absolute',
  },
  inputStyle: {
    display: 'inline-block', 
    margin: 20,
  },
}));

const PenBasedRenderer = () => {
  const classes = useStyle();

  const [canvasFb, setCanvasFb] = useState<any>();
  const [hoverCanvasFb, setHoverCanvasFb] = useState<any>();
  const [ctx, setCtx] = useState<any>();

  const [pageInfo, setPageInfo] = useState<PageInfo>();
  const [noteImage, setNoteImage] = useState<string>();

  const [noteWidth, setNoteWidth] = useState<number>(0);
  const [noteHeight, setNoteHeight] = useState<number>(0);

  const [ncodeWidth, setNcodeWidth] = useState<number>(0);
  const [ncodeHeight, setNcodeHeight] = useState<number>(0); 

  const [paperBase, setPaperBase] = useState<PaperBase>({Xmin: 0, Ymin: 0});

  const [hoverPoint, setHoverPoint] = useState<any>();
  
  // canvas size
  useEffect(() => {
    const { canvas, hoverCanvas } = initCanvas();
    setCanvasFb(canvas);
    setHoverCanvasFb(hoverCanvas);
  }, []);

  useEffect(() => {
    if (pageInfo) {
      // Ncode Info
      const ncodeSize = api.extractMarginInfo(pageInfo);
      if (ncodeSize !== undefined) {
        setPaperBase({Xmin: ncodeSize.Xmin, Ymin: ncodeSize.Ymin})
      }

      let ncodeWidth, ncodeHeight;
      if (ncodeSize) {
        ncodeWidth = ncodeSize.Xmax - ncodeSize.Xmin;
        ncodeHeight = ncodeSize.Ymax - ncodeSize.Ymin;
      }
      setNcodeWidth(ncodeWidth);
      setNcodeHeight(ncodeHeight);

      // Note Info
      const imageSrc = api.getNoteImage(pageInfo);
      const { width, height } = api.getNoteSize(pageInfo);
      setNoteImage(imageSrc);
      setNoteWidth(width);
      setNoteHeight(height); 
    }
  }, [pageInfo]);

  useEffect(() => {
    if (hoverCanvasFb) {
      createHoverPoint();
    }
  }, [hoverCanvasFb]);

  useEffect(() => {
    if (noteImage) {
      /**
       * Canvas width 재설정
       * CanvasFb.height : CanvasFb.width = noteHeight : noteWidth;
       * CanvasFb.width = (CanvasFb.height * noteWidth) / noteHeight;
       */
      const refactorCanvasWidth = canvasFb.height * noteWidth / noteHeight;
      canvasFb.setWidth(refactorCanvasWidth);
      hoverCanvasFb.setWidth(refactorCanvasWidth);

      // CanvasFb noteImage에 맞춘 scaling 작업
      canvasFb.setBackgroundImage(noteImage, canvasFb.renderAll.bind(canvasFb), {
        scaleX: canvasFb.width / noteWidth,
        scaleY: canvasFb.height / noteHeight,
     });
    }
  }, [canvasFb, noteImage, noteWidth, noteHeight]);

  useEffect(() => {
    console.log(noteWidth, noteHeight);
  }, [noteWidth, noteHeight]);
 
  useEffect(() => {
    PenHelper.dotCallback = async (mac, dot) => {
      strokeProcess(dot);
    }
  });

  // Initialize Canvas
  const initCanvas = () => { 
    const canvas = new fabric.Canvas('mainCanvas');
    const hoverCanvas = new fabric.Canvas('hoverCanvas');

    setCtx(canvas.getContext());

    return { canvas, hoverCanvas }
  }

  const strokeProcess = (dot: Dot) => {
    if (!pageInfo) {
      setPageInfo(dot.pageInfo);
    }

    /**
     * Calculate dot ratio // 
     * ncodeSize : ncodeDotPosition = canvasSize : canvasDotPosition
     * canvasDotPosition = (ncodeDotPosition * canvasSize) / ncodeSize
     * dot: ncodeDotPosition
     * dx/dy: canvasDotPosition
     * 
     */
    // Calculate dot ratio
    const dx = ((dot.x - paperBase.Xmin) * canvasFb.width) / ncodeWidth;
    const dy = ((dot.y - paperBase.Ymin) * canvasFb.height) / ncodeHeight;

    try {
      if (dot.dotType === 0) { // Pen Down
        ctx.beginPath();
        hoverPoint.set({ opacity: 0 });
        hoverCanvasFb.requestRenderAll();      
      } else if (dot.dotType === 1) { // Pen Move
        // dot이 너무 큰 값이 들어와버리면 이상 dot으로 취급하여 종료시켜줌
        if (dot.x > 1000 || dot.y > 1000) { 
          return
        }
        ctx.lineWidth = 2;
        ctx.lineTo(dx, dy);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(dx, dy);
      } else if (dot.dotType === 2) {  // Pen Up
        ctx.closePath();
      } else if (dot.dotType === 3) {
        hoverProcess(dx, dy);
      }
    } catch {
      console.log('ctx : ' + ctx);
    }
  }
  
  const setCanvasWidth = (width: number) => {
    canvasFb.setWidth(width);
    hoverCanvasFb.setWidth(width);
  }

  const setCanvasHeight = (height: number) => {
    canvasFb.setHeight(height);
    hoverCanvasFb.setHeight(height);
  }

  const hoverProcess = (dx: number, dy: number) => {
    hoverPoint.set({ left: dx, top: dy, opacity: 0.5 });
    hoverCanvasFb.requestRenderAll();
  }

  const createHoverPoint = () => {
    const hoverPoint = new fabric.Circle({ 
      radius: 10, 
      fill: '#ff2222',
      stroke: '#ff2222',
      opacity: 0,
      top: 0, 
      left: 0,
    });
    
    setHoverPoint(hoverPoint);
    hoverCanvasFb.add(hoverPoint);
  }

  return (
    <div className={classes.mainBackground}>
      <canvas id="mainCanvas" className={classes.mainCanvas} width={window.innerWidth} height={window.innerHeight-81}></canvas>
      <div className={classes.hoverCanvasContainer}>
        <canvas id="hoverCanvas" className={classes.hoverCanvas} width={window.innerWidth} height={window.innerHeight-81}></canvas>
      </div>
      <div className={classes.inputContainer}>
        <div className={classes.inputStyle}>
          <TextField id="width-input" label="Width" variant="outlined" type="number" size="small"
              onChange={(e) => setCanvasWidth(parseInt(e.target.value))} />
        </div>
        <div className={classes.inputStyle}>
          <TextField id="height-input" label="Height" variant="outlined" type="number" size="small"
              onChange={(e) => setCanvasHeight(parseInt(e.target.value))} />
        </div>
      </div>
    </div>
  );
};

export default PenBasedRenderer;