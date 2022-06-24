import { makeStyles } from '@material-ui/core';
import React from 'react';
import ViewBasic from '../renderer/ViewBasic';

const useStyle = makeStyles((theme) => ({
  mainBackground: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
  },
  title: {
    margin: '15px',
  }
}));

const Render = () => {
  const classes = useStyle();
  
  return (
    <div className={classes.mainBackground}>
      <ViewBasic />
    </div>
  );
};

export default Render;
