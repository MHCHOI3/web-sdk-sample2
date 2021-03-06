import { makeStyles } from '@material-ui/core';
import { PenHelper, PenMessageType, PenController } from 'web_pen_sdk';
import React, { useEffect, useReducer, useRef, useState } from "react";
import { Dot, VersionInfo, SettingInfo } from 'web_pen_sdk/dist/Util/type';
import Header from '../component/Header';
import PenManager from 'web_view_sdk_test/dist/common/neopen/PenManager';
import { INeoSmartpen } from 'web_view_sdk_test/dist/common/neopen/INeoSmartpen';
import { IPageSOBP } from 'web_view_sdk_test/dist/common/structures/Structures';
import { InkStorage } from 'web_view_sdk_test/dist/common/penstorage/InkStorage';
import RenderHelper from 'web_view_sdk_test/dist/helper/RenderHelper';
import MainViewFC from 'web_view_sdk_test/dist/renderer/view/MainView';
import appendPdfToStorage from 'web_view_sdk_test/dist/renderer/appendPdfToStorage';
import ViewMessageType from 'web_view_sdk_test/dist/common/structures/ViewMessageType';
import { OuterRendererProps } from 'web_view_sdk_test/dist/renderer';
import {savePDF} from "web_view_sdk_test/dist/savePdf/SavePdf";

const useStyle = makeStyles(() => ({
  mainBackground: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    alignItems: 'center',
    position: 'relative',
    height: window.innerHeight-163.25,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  hoverCanvasContainer: {
    position: 'absolute',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  inputStyle: {
    margin: 20,
  },
}));

const ViewBasic = () => {
  console.error("[ViewBasic] Init");
  const classes = useStyle();
  
  const [passwordPen, setPasswordPen] = useState<boolean>(false);
  const [penVersionInfo, setPenVersionInfo] = useState<VersionInfo>();
  const [penSettingInfo, setPenSettingInfo] = useState<SettingInfo>();
  const [controller, setController] = useState<PenController>();
  const [authorized, setAuthorized] = useState<boolean>(false);
  
  const penManager = new PenManager();
  const renderHelper = useRef({} as RenderHelper);

  const [pens, setPens] = useState([] as INeoSmartpen[]);
  const [pageInfos, setPageInfos] = useState([] as IPageSOBP[]);
  const [activePage, setActivePage] = useState({ section: 3, owner: 1012, book: 3001, page: 3 } as IPageSOBP);
  const [options, setOptions] = useState({} as OuterRendererProps)
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    console.error("[renderHelper] init!!!!!!!!!!!!!!!!!!")

    renderHelper.current = new RenderHelper();
    setOption();
  }, []);
  
  /**
   * This callback type is called `dotCallback`.
   * 
   * @callback dotCallback
   */
  useEffect(() => {
    PenHelper.dotCallback = async (mac, dot) => {
      penManager.passingDot(dot);
      // strokeProcess(dot);
    }
  });
  
  /**
   * This callback type is called `messageCallback`. (Pen Event Callback)
   * 
   * @callback messageCallback
   */
  useEffect(() => {
    PenHelper.messageCallback = async (mac, type, args) => {
      messageProcess(mac, type, args);
    }
  });
  
  
  /**
   * This callback type is called `messageCallback`. (View Event Callback)
   * 
   * @callback messageCallback
   */
  useEffect(() => {
    renderHelper.current.messageCallback = async (type, args) => {
      viewMessage(type, args);
    }
  });

  /**
   * Process ncode dot.
   * 
   * @param {Dot} dot
   */
  // const strokeProcess = (dot: Dot) => {
  //   penManager.passingDot(dot);
  // }

  //region ViewSDK
  const registPen = (controller) => {
    penManager.registerPen(controller);
    setPens(penManager.getPens());
  }
  //endRegion

  /**
   * Message callback process. (Pen Event Processing)
   * 
   * @param mac 
   * @param type 
   * @param args 
   */
  const messageProcess = (mac, type, args) => {
    // console.log(mac, type, args);
    PenHelper.debugMode(false);

    switch (type) {
      case PenMessageType.PEN_SETTING_INFO:
        const _controller = PenHelper.pens.filter((c) => c.info.MacAddress === mac)[0];
        setController(_controller);  // ?????? ?????? controller??? ???????????????.
        setPenSettingInfo(args);  // ?????? Setting ?????? ??????
        setPenVersionInfo(_controller.RequestVersionInfo());  // ?????? versionInfo ?????? ??????
        break;
      case PenMessageType.PEN_SETUP_SUCCESS:
        controller?.RequestPenStatus();
        break;
      case PenMessageType.PEN_DISCONNECTED:
        console.log('Pen disconnted');
        setController(undefined);  // ??? ??????????????? ??? controller ?????????.
        setPenVersionInfo(undefined);  // ??? ??????????????? ??? ???????????? ?????????.
        setPenSettingInfo(undefined);  // ??? ??????????????? Setting ?????? ?????????
        setAuthorized(false);  // ??????????????? ???????????? ?????????
        break;
      case PenMessageType.PEN_PASSWORD_REQUEST:
        setPasswordPen(true);
        onPasswordRequired(args);  // ???????????? ????????? process
        break;
      case PenMessageType.PASSWORD_SETUP_SUCCESS:
        const usingPassword = args.UsingPassword;
        if(usingPassword){
          setPasswordPen(true);
        }else{
          setPasswordPen(false);
        }
        break;
      case PenMessageType.PEN_AUTHORIZED:
        setAuthorized(true);  // Pen ?????? ????????? authorized trigger ??? true ??????
        registPen(controller);
        break;
      case PenMessageType.PEN_USING_NOTE_SET_RESULT:
        controller?.SetHoverEnable(true);
        break;
      default:
        break;
    }
  }
  const viewMessage = (type, args) => {
    switch(type){
      case ViewMessageType.MOUSE_DOWN:
        console.log("MOUSEDOWN");
        console.log(args);
        break;
      case ViewMessageType.VIEW_PAGE_CHANGE:
        console.log("VIEWCHANGE");
        console.log(args);
        break;
      default:
        break;
    }
  }

  /**
   * Request Password Process.
   * 
   * @param args 
   */
  const onPasswordRequired = (args: SettingInfo) => {
    const password = prompt(`??????????????? ??????????????????. (4??????) (${args.RetryCount}??? ??????)\n???????????? ${args.ResetCount}??? ?????? ??? ?????????????????? ????????? ?????????. `);
    if (password === null) return;
    
    if (password.length !== 4) {
      alert('??????????????? 4?????? ?????????.')
    }
    
    if (args.RetryCount >= 10) {
      alert('?????? ??????????????? ????????? ?????????.');
    }

    controller?.InputPassword(password);
  }
  const fileOpen = () => {
    return new Promise(res => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = false;
      input.accept = ".pdf";
      
      let files;
      let fileName;
      let dataUrl;
      input.onchange = () => {
        files = input.files;
        fileName = files[0].name;
        const fileReader = new FileReader();
        fileReader.readAsDataURL(files[0]);
        fileReader.onload = (e) => {
          dataUrl = e.target?.result;
          res(appendPdfToStorage(dataUrl, fileName, undefined));
        }
      }
      input.click();
    })
  }
  const zoomIn = () => {
    renderHelper.current.handleZoomIn();
    setOption();
  }
  const zoomOut = () => {
    renderHelper.current.handleZoomOut();
    setOption();
  }
  const showGrid = () => {
    renderHelper.current.toggleShowGrid();
    setOption();
  }
  const cropMode = () => {
    renderHelper.current.toggleIsCropMode();
    setOption();
  }
  const erase = (e) => {
    const penName = e.target.value;
    const penType = penName==="???" ? 0 : penName==="?????????" ? 1 : 2
    penManager.setPenRendererType(penType);
  }
  const changeColor = () => {
    const penColorNum = Math.floor(Math.random() * 9);
    penManager.setColor(penColorNum);
  }
  const setOption = () => {
    setOptions(renderHelper.current.sendingOptions());
    forceUpdate();
  }
  const pdfSave = () => {
    savePDF("testPDF");
  }
  const writerChange = () => {
    renderHelper.current.handleWriterChanged("");
  }
  const onwerChange = () => {
    renderHelper.current.handleSurfaceOwnerChanged("");
  }
  const wrowChange = () => {
    renderHelper.current.handlePageChangerWriterChanged("");
  }


  return (
    <>
      <Header controller={controller} penVersionInfo={penVersionInfo} penSettingInfo={penSettingInfo} passwordPen={passwordPen} authorized={authorized} />
      <div id="abc" className={classes.mainBackground}>
        <MainViewFC/>
      </div>
      <div id="efg" className={classes.mainBackground}>
        <button onClick={fileOpen}>????????????</button>
        <button onClick={pdfSave}>PDF??????</button>
        <button onClick={zoomIn}>??????</button> : {options.zoom}
        <button onClick={zoomOut}>?????????</button> : {options.zoom}
        <button onClick={showGrid}>?????????</button> : {options.showGrid+""}
        <button onClick={cropMode}>????????????</button>
        <button onClick={writerChange}>?????????</button>
        <button onClick={onwerChange}>??????</button>
        <button onClick={wrowChange}>??????</button>
        <select onChange={erase}>
          <option value={"???"}>???</option>
          <option value={"?????????"}>?????????</option>
          <option value={"??????"}>??????</option>
        </select>
        <button onClick={changeColor}>?????????</button>
        <span>?????????????????? : {options.laserPointer+""}</span>
        <span>??????????????????????????? : {options.disableAutoPageChange+""}</span>
      </div>
    </>
  );
};

export default ViewBasic;