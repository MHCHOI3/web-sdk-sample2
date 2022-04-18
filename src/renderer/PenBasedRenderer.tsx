import { makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import PenHelper from '../utils/PenHelper';
import { fabric } from 'fabric';
import api from '../server/NoteServer';
import { PageInfo } from '../utils/type';

const useStyle = makeStyles(() => ({
  mainBackground: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center'
  }
}));

const PenBasedRenderer = () => {
  const classes = useStyle();
  const [canvasFb, setCanvasFb] = useState<any>();
  const [ctx, setCtx] = useState<any>();

  const [pageInfo, setPageInfo] = useState<PageInfo>();
  const [noteImage, setNoteImage] = useState<string>();

  const [noteWidth, setNoteWidth] = useState(0);
  const [noteHeight, setNoteHeight] = useState(0);

  const [ncodeWidth, setNcodeWidth] = useState(0);
  const [ncodeHeight, setNcodeHeight] = useState(0); 

  // canvas size
  useEffect(() => {
    setCanvasFb(initCanvas());
  }, []);

  useEffect(() => {
    if (pageInfo) {
      // Ncode Info
      const ncodeSize = api.extractMarginInfo(pageInfo);
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
    if (noteImage) {
      /**
       * Canvas width 재설정
       * CanvasFb.height : CanvasFb.width = noteHeight : noteWidth;
       * CanvasFb.width = (CanvasFb.height * noteWidth) / noteHeight;
       */
      // Canvas width 재설
      const refactorCanvasWidth = canvasFb.height * noteWidth / noteHeight;
      canvasFb.setWidth(refactorCanvasWidth);

      canvasFb.setBackgroundImage(noteImage, canvasFb.renderAll.bind(canvasFb), {
        scaleX: canvasFb.width / noteWidth,
        scaleY: canvasFb.height / noteHeight,
     });
    }
  }, [canvasFb, noteImage]);

  useEffect(() => {
    console.log(noteWidth, noteHeight);
  }, [noteWidth, noteHeight]);
 
  useEffect(() => {
    PenHelper.dotCallback = (mac, dot) => {
      setCtx(canvasFb.getContext());
      strokeProcess(dot);
    }
  });

  // Initialize Canvas
  const initCanvas = () => { 
    const canvas = new fabric.Canvas('sampleCanvas');
  
    return canvas
  }

  const strokeProcess = (dot) => {
    /**
     * Calculate dot ratio // 
     * ncodeSize : ncodeDotPosition = canvasSize : canvasDotPosition
     * canvasDotPosition = (ncodeDotPosition * canvasSize) / ncodeSize
     * dot: ncodeDotPosition
     * dx/dy: canvasDotPosition
     * 
     */
    // Calculate dot ratio
    if (!pageInfo) {
      setPageInfo(dot.pageInfo);
    }

    const dx = (dot.x * canvasFb.width) / ncodeWidth;
    const dy = (dot.y * canvasFb.height) / ncodeHeight;

    // Pen Down
    if (dot.dotType === 0) {
      ctx.beginPath();
    } else if (dot.dotType === 1) { // Pen Move
      if (dot.x > 1000 || dot.y > 1000) {
        return
      }
      ctx.lineWidth = 2;
      ctx.lineTo(dx, dy);
      ctx.stroke();
      ctx.closePath();
      ctx.beginPath();
      ctx.moveTo(dx, dy);
    } else {  // Pen Up
      ctx.closePath();
    }
  }

  return (
    <div className={classes.mainBackground}>
      <canvas id="sampleCanvas" width={window.innerWidth} height={window.innerHeight-81}></canvas>
    </div>
  );
};

export default PenBasedRenderer;