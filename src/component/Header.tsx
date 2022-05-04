import React from 'react';
import { makeStyles, Typography } from '@material-ui/core';
import LogoTextImage from '../assets/pwa152.png';
import ConnectButton from '../buttons/ConnectButton';

const useStyle = makeStyles((theme) => ({
  wrap: {
    background: 'rgba(255,255,255,1)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backdropFilter: 'blur(4px)',
    borderBottom: '1px solid #E7E7E7',
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    display: 'flex'
  },
  imgStyle: {
    width: '80px',
  },
  title: {
    fontFamily: 'Noto Sans CJK KR',
    fontStyle: 'normal',
    fontWeight: 'bold',
    fontSize: '30px',
    color: 'black',
  },
  navStyle: {
    height: '50px',
    backgroundColor: 'rgba(255,255,255,1)',
    display: 'flex',
  },
}));

const Header = ({ controller, penInfo }) => {
  const classes = useStyle();
  return (
    <div className={classes.wrap}>
      <div className={classes.logoContainer}>
        <img src={LogoTextImage} className={classes.imgStyle} alt="logo" />
        <Typography className={classes.title}>WEB SDK SAMPLE</Typography>
      </div>
      <span>{penInfo ? `Battery: ${penInfo.Battery}` : ''}</span>
      <div className={classes.navStyle}>
        <ConnectButton controller={controller} penInfo={penInfo} />
      </div> 
    </div>
  );
};

export default Header;
