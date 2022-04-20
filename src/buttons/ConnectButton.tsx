import React from 'react';
import { Button, makeStyles } from '@material-ui/core';
import PenHelper from '../utils/PenHelper2';

const useStyle = makeStyles((theme) => ({
  caption: {
    padding: '4px',
    color: '#121212',
    fontFamily: 'Noto Sans CJK KR',
    fontStyle: 'normal',
    fontWeight: 'bold',
    fontSize: '13px',
    lineHeight: '16px',
    letterSpacing: '0.25px',
    width: '120px',
    marginRight: '16px',
    border: '1px solid #CED3E2'
  },
}));

const ConnectButton = () => {
  const classes = useStyle();

  const scanPen = () => {
    PenHelper.scanPen();
  };

  return (
    <Button onClick={scanPen} className={classes.caption}>
      connect
    </Button>
  );
};

export default ConnectButton;
