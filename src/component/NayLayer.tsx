import React from 'react';
import { IconButton, makeStyles } from '@material-ui/core';
import ConnectButton from '../buttons/ConnectButton';

const useStyle = makeStyles((theme) => ({
  navStyle: {
    height: '50px',
    backgroundColor: 'rgba(255,255,255,1)',
    display: 'flex',
  },
  sectionDesktop: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'flex',
    },
  },
  sectionMobile: {
    display: 'flex',
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
}));

const NavLayer = () => {
  const classes = useStyle();
  return (
    <div className={classes.navStyle}>
      <ConnectButton />
    </div>
  );
};

export default NavLayer;
