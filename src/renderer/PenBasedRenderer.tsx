import { makeStyles, TextField } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import PenHelper from '../utils/PenHelper';
import { fabric } from 'fabric';
import api from '../server/NoteServer';
import { Dot, PageInfo, PaperBase, PdfDot } from '../utils/type';

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
       * Canvas width 를 note image 비율에 맞춰 재설정 하는 로직
       * 추가, Canvas height 는 기본적으로 'window.innerHeight - 81(Header의 높이)'로 되어있음.
       * 
       * noteWidth: note의 가로길이
       * noteHeight: note의 세로길이
       * 
       * CanvasFb.height : CanvasFb.width = noteHeight : noteWidth;
       * CanvasFb.width(=refactorCanvasWidth) = (CanvasFb.height * noteWidth) / noteHeight;
       * 
       */
      const refactorCanvasWidth = canvasFb.height * noteWidth / noteHeight;
      canvasFb.setWidth(refactorCanvasWidth);
      hoverCanvasFb.setWidth(refactorCanvasWidth);

      // NoteImage를 canvas 크기에 맞춰 보여지게 하기위한 scaling 작업
      canvasFb.setBackgroundImage(noteImage, canvasFb.renderAll.bind(canvasFb), {
        scaleX: canvasFb.width / noteWidth,
        scaleY: canvasFb.height / noteHeight,
     });
    }
  }, [canvasFb, noteImage]);
 
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

    // ncode dot을 뷰(Canvas)에 보여지게 하기위해 좌표값을 변환시켜 줌.
    const pdfDot = ncodeToPdf(dot);

    try {
      if (dot.dotType === 0) { // Pen Down
        ctx.beginPath();
        hoverPoint.set({ opacity: 0 });
        hoverCanvasFb.requestRenderAll();      
      } else if (dot.dotType === 1) { // Pen Move
        // dot 좌표가 너무 큰 값이 들어와버리면 이상 dot으로 취급하여 처리하지 않음.
        if (dot.x > 1000 || dot.y > 1000) { 
          return
        }
        ctx.lineWidth = 2;
        ctx.lineTo(pdfDot.x, pdfDot.y);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(pdfDot.x, pdfDot.y);
      } else if (dot.dotType === 2) { // Pen Up
        ctx.closePath();
      } else if (dot.dotType === 3) { // Hover 
        hoverProcess(pdfDot);
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

  const hoverProcess = (pdfDot: PdfDot) => {
    hoverPoint.set({ left: pdfDot.x, top: pdfDot.y, opacity: 0.5 });
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

  const ncodeToPdf = (dot: Dot) => {
    /**
     * paperBase: paper의 margin 값
     * ncodeWidth: ncode의 가로길이 / ncodeHeight: ncode의 세로길이
     * dot: ncode의 좌표값
     * pdfDot: 뷰(Canvas) 사이즈에 맞춰 변환된 dot 좌표값
     * 
     * 뷰(Canvas)에 보여질수 있는 좌표값을 구하기 위해 ncode dot 좌표를 계산하는 로직
     * ncode_size : ncode_dot_position = canvas_size : canvas_dot_position
     * canvas_dot_position = (ncode_dot_position * canvas_size) / ncode_size
     * 
     */
    const x = ((dot.x - paperBase.Xmin) * canvasFb.width) / ncodeWidth;
    const y = ((dot.y - paperBase.Ymin) * canvasFb.height) / ncodeHeight;
    return { x, y }
  }

  return (
    <div className={classes.mainBackground}>
      <canvas id="mainCanvas" className={classes.mainCanvas} width={window.innerWidth} height={window.innerHeight-81}></canvas>
      <div className={classes.hoverCanvasContainer}>
        <canvas id="hoverCanvas" className={classes.hoverCanvas} width={window.innerWidth} height={window.innerHeight-81}></canvas>
      </div>
      {/* <div className={classes.inputContainer}>
        <div className={classes.inputStyle}>
          <TextField id="width-input" label="Width" variant="outlined" type="number" size="small"
              onChange={(e) => setCanvasWidth(parseInt(e.target.value))} />
        </div>
        <div className={classes.inputStyle}>
          <TextField id="height-input" label="Height" variant="outlined" type="number" size="small"
              onChange={(e) => setCanvasHeight(parseInt(e.target.value))} />
        </div>
      </div> */}
    </div>
  );
};

export default PenBasedRenderer;