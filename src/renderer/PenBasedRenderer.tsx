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
  // const [width, height] = [450, 510];
  // 3.27.387 paper size
  const [yMax, yMin] = [121.608635, 3.4970238];
  const [xMax, xMin] = [94.6116, 3.4970238];
  const [yLen, xLen] = [yMax-yMin, xMax-xMin];

  useEffect(() => {
    setCanvasFb(initCanvas());
  }, []);

  // Initialize Canvas
  const initCanvas = () => { 
    const canvas = new fabric.Canvas('sampleCanvas')
    setCtx(canvas.getContext())
    return canvas
  }

  useEffect(() => {
    PenHelper.dotCallback = async (mac, dot) => {
      strokeProcess(dot);
    }
  });

  const strokeProcess = (dot) => {
    // Calculate dot ratio
    const dx = (dot.x * canvasFb.getWidth()) / xLen;
    const dy = (dot.y * canvasFb.getHeight()) / yLen;

    // Pen Down
    try {
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
    } catch {
      console.log('ctx : ' + ctx);
    }
  }
  
  const setCanvasWidth = (width) => {
    canvasFb.setWidth(width);
  }

  const setCanvasHeight = (height) => {
    canvasFb.setHeight(height);
  }

  return (
    <div className={classes.mainBackground}>
      <div>
        <label>Width: </label>
        <input
          id="width-input"
          type="number"
          disabled={false}
          onChange={(e) => setCanvasWidth(parseInt(e.target.value))}
        />
      </div>
      <div>
        <label>Height: </label>
        <input
          id="height-input"
          type="number"
          disabled={false}
          onChange={(e) => setCanvasHeight(parseInt(e.target.value))}
        />
      </div>
      <div>
        <canvas id="sampleCanvas"></canvas>
      </div>
    </div>
  );
};

export default PenBasedRenderer;
