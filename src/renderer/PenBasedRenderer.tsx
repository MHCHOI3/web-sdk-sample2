import { makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import PenHelper from '../utils/PenHelper';
import { fabric } from 'fabric';

const useStyle = makeStyles(() => ({
  mainBackground: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center'
  },
}));

const PenBasedRenderer = () => {
  const classes = useStyle();
  const [canvasFb, setCanvasFb] = useState<any>();
  const [ctx, setCtx] = useState<any>();
  // canvas size
  const [width, height] = [940, 510];
  // 3.27.387 paper size
  const [yMax, yMin] = [121.608635, 3.4970238];
  const [xMax, xMin] = [94.6116, 3.4970238];
  const [yLen, xLen] = [yMax-yMin, xMax-xMin];

  useEffect(() => {
    setCanvasFb(initCanvas());
  }, []);

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
    // Calculate dot ratio
    const dx = (dot.x * width) / xLen;
    const dy = (dot.y * height) / yLen;

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
      <canvas id="sampleCanvas" width={width} height={height}></canvas>
    </div>
  );
};

export default PenBasedRenderer;
