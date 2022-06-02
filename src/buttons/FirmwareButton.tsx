import React, { useState } from 'react';
import { Button, makeStyles } from '@material-ui/core';

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

const ConnectButton = ({ controller }) => {
  const classes = useStyle();

  const [fileName, setFileName] = useState("");
  const [fwFile, setFwFile] = useState();
  

  const input = document.getElementById("inputFile");

  const handleFile = (e) => {
    setFwFile(e.target.files[0]);
    setFileName(e.target.files[0].name);
  }

  const update = () => {
      if(fileName === ""){
          alert("파일부터 선택해주세요.")
          return;
      }
      controller.RequestFirmwareInstallation(fwFile, "1.10", true)
  }

  return (
      <>
        <input type="file" id="inputFile" onChange={handleFile} style={{display:'none'}} />
        <Button onClick={() => input?.click()} className={classes.caption}>펌웨어파일선택<br/>{fileName}</Button>
        <Button onClick={update} className={classes.caption}>업데이트 시작</Button>
      </>
  );
};

export default ConnectButton;
