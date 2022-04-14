import { makeStyles } from '@material-ui/core';
import React from 'react';
import PenBasedRenderer from '../renderer/PenBasedRenderer';
import Header from './Header';

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

const Main = () => {
  const classes = useStyle();
  
  return (
    <div className={classes.mainBackground}>
      <Header />
      <PenBasedRenderer />
    </div>
  );
};

export default Main;
