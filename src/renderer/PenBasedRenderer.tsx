import { makeStyles, TextField } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { PenHelper, NoteServer } from 'web_pen_sdk';

import { fabric } from 'fabric';
import { Dot, PageInfo, ScreenDot, PaperSize } from 'web_pen_sdk/dist/Util/type';
import { NULL_PageInfo, PlateNcode_3 } from '../utils/constants';

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

  const [noteWidth, setNoteWidth] = useState<number>(0);
  const [noteHeight, setNoteHeight] = useState<number>(0);

  const [hoverPoint, setHoverPoint] = useState<any>();
  const [angle, setAngle] = useState<number>(0);

  const [imageBlobUrl, setImageBlobUrl] = useState<any>();

  const [paperSize, setPaperSize] = useState<PaperSize>();

  useEffect(() => {
    const { canvas, hoverCanvas } = initCanvas();
    setCanvasFb(canvas);
    setHoverCanvasFb(hoverCanvas);
  }, []);

  // Note Image와 PaperSize를 설정하기 위한 부분
  useEffect(() => {
    async function getNoteImageUsingAPI(pageInfo) {
      await NoteServer.getNoteImage(pageInfo, setImageBlobUrl);
      const paperSize: any = await NoteServer.extractMarginInfo(pageInfo);
      setPaperSize(paperSize);
    }

    if (pageInfo) {
      getNoteImageUsingAPI(pageInfo);
    }
  }, [pageInfo]);

  useEffect(() => {
    if (hoverCanvasFb) {
      createHoverPoint();
    }
  }, [hoverCanvasFb]);

  useEffect(() => {
    if (imageBlobUrl) {
      const image = new Image();
      image.src = imageBlobUrl;
      image.onload = () => {
        setNoteWidth(image.width);
        setNoteHeight(image.height);
      }
    }
  }, [imageBlobUrl])

  useEffect(() => {
    if (noteWidth > 0 && noteHeight > 0) {
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
      canvasFb.setBackgroundImage(imageBlobUrl, canvasFb.renderAll.bind(canvasFb), {
        // noteImage를 Canvas의 크기에 맞게 resizing
        scaleX: canvasFb.width / noteWidth,
        scaleY: canvasFb.height / noteHeight,
        // backgroundImage angle 설정에 따른 top, left 값 수정
        angle: angle,
        top: [180, 270].includes(angle) ? canvasFb.height : 0,
        left: [90, 180].includes(angle) ? canvasFb.width : 0,
      });      
    }
  }, [noteWidth, noteHeight, angle]);
 
  // Ncode Dot을 받아오기 위한 dotCallback 설정
  useEffect(() => {
    PenHelper.dotCallback = async (mac, dot) => {
      strokeProcess(dot);
    }
  });

  // Initialize Canvas, hoverCanvas
  const initCanvas = () => { 
    const canvas = new fabric.Canvas('mainCanvas');
    const hoverCanvas = new fabric.Canvas('hoverCanvas');

    setCtx(canvas.getContext());

    return { canvas, hoverCanvas }
  }

  /**
   * Ncode dot을 사용하기 위해 처리하는 로직
   * @param dot { Dot }
   */
  const strokeProcess = (dot: Dot) => {
    /**
     * pageInfo란, Ncode 노트의 정보를 { section, owner, book, page }로 나타내는 값이며 어떤 Note를 사용하는지 파악하기 위해 사용한다
     * pageInfo 값이 존재하고, NULL_PageInfo({-1, -1, -1, -1})이 아닐 경우에만 pageInfo 상태를 갱신시켜준다.
     */ 
     if (!pageInfo && !PenHelper.isSamePage(dot.pageInfo, NULL_PageInfo)) {
      setPageInfo(dot.pageInfo);
    }

    if (imageBlobUrl === undefined) {
      return;
    }

    if (!paperSize) {
      return;
    }

    // Ncode Dot을 view(Canvas) size 에 맞춰 좌표값을 변환시켜준다.
    const view = { width: canvasFb.width, height: canvasFb.height };
    let screenDot: ScreenDot;
    if (PenHelper.isSamePage(dot.pageInfo, PlateNcode_3)) { // Smart Plate
      screenDot = PenHelper.ncodeToScreen_smartPlate(dot, view, angle, paperSize);
    } else {  // Default
      screenDot = PenHelper.ncodeToScreen(dot, view, paperSize);
    }

    try {
      if (dot.dotType === 0) { // Pen Down
        ctx.beginPath();
        // PenDown 일때는 hoverPoint가 보일 필요가 없으므로 opacity 0으로 설정
        hoverPoint.set({ opacity: 0 });
        hoverCanvasFb.requestRenderAll();      
      } else if (dot.dotType === 1) { // Pen Move
        // dot 좌표가 너무 큰 값이 들어와버리면 이상 dot으로 취급하여 처리하지 않음.
        if (dot.x > 1000 || dot.y > 1000) { 
          return
        }
        ctx.lineWidth = 2;
        ctx.lineTo(screenDot.x, screenDot.y);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(screenDot.x, screenDot.y);
      } else if (dot.dotType === 2) { // Pen Up
        ctx.closePath();
      } else if (dot.dotType === 3) { // Hover 
        hoverProcess(screenDot);
      }
    } catch {
      console.log('ctx : ' + ctx);
    }
  }

  /**
   * Canvas의 각도를 설정하는 로직, SmartPlate에서만 동작하도록 완성
   * @param rotate { number }
   */
  const setCanvasAngle = (rotate: number) => {
    if (![0, 90, 180, 270].includes(rotate)) return
    if (!pageInfo || !PenHelper.isSamePage(pageInfo, PlateNcode_3)) return

    // 90', 270' 일 경우 note의 width <-> height를 swap 시켜준다. 
    if (Math.abs(angle-rotate)/90 === 1 || Math.abs(angle-rotate)/90 === 3) {
      const tmp = noteWidth;
      setNoteWidth(noteHeight);
      setNoteHeight(tmp); 
    }
    setAngle(rotate);
  }

  /**
   * Hover Point를 이동시키기 위한 로직
   * @param screenDot { ScreenDot }
   */
  const hoverProcess = (screenDot: ScreenDot) => {
    hoverPoint.set({ left: screenDot.x, top: screenDot.y, opacity: 0.5 });
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
          <TextField id="angle" label="Angle" variant="outlined" type="number" size="small"
              onChange={(e) => setCanvasAngle(parseInt(e.target.value))} />
        </div>
      </div>
    </div>
  );
};

export default PenBasedRenderer;