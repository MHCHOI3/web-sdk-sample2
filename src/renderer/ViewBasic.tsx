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
        setController(_controller);  // 해당 펜의 controller를 등록해준다.
        setPenSettingInfo(args);  // 펜의 Setting 정보 저장
        setPenVersionInfo(_controller.RequestVersionInfo());  // 펜의 versionInfo 정보 저장
        break;
      case PenMessageType.PEN_SETUP_SUCCESS:
        controller?.RequestPenStatus();
        break;
      case PenMessageType.PEN_DISCONNECTED:
        console.log('Pen disconnted');
        setController(undefined);  // 펜 연결해제시 펜 controller 초기화.
        setPenVersionInfo(undefined);  // 펜 연결해제시 펜 상태정보 초기화.
        setPenSettingInfo(undefined);  // 펜 연결해제시 Setting 정보 초기화
        setAuthorized(false);  // 연결해제시 인증상태 초기화
        break;
      case PenMessageType.PEN_PASSWORD_REQUEST:
        setPasswordPen(true);
        onPasswordRequired(args);  // 패스워드 요청시 process
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
        setAuthorized(true);  // Pen 인증 성공시 authorized trigger 값 true 변경
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
    const password = prompt(`비밀번호를 입력해주세요. (4자리) (${args.RetryCount}회 시도)\n비밀번호 ${args.ResetCount}회 오류 시 필기데이터가 초기화 됩니다. `);
    if (password === null) return;
    
    if (password.length !== 4) {
      alert('패스워드는 4자리 입니다.')
    }
    
    if (args.RetryCount >= 10) {
      alert('펜의 모든정보가 초기화 됩니다.');
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
    const penType = penName==="펜" ? 0 : penName==="지우개" ? 1 : 2
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
        <button onClick={fileOpen}>파일열기</button>
        <button onClick={pdfSave}>PDF저장</button>
        <button onClick={zoomIn}>줌인</button> : {options.zoom}
        <button onClick={zoomOut}>줌아웃</button> : {options.zoom}
        <button onClick={showGrid}>그리드</button> : {options.showGrid+""}
        <button onClick={cropMode}>크롭모드</button>
        <button onClick={writerChange}>라이터</button>
        <button onClick={onwerChange}>오너</button>
        <button onClick={wrowChange}>라오</button>
        <select onChange={erase}>
          <option value={"펜"}>펜</option>
          <option value={"지우개"}>지우개</option>
          <option value={"마커"}>마커</option>
        </select>
        <button onClick={changeColor}>색변경</button>
        <span>레이저포인터 : {options.laserPointer+""}</span>
        <span>페이지자동변환금지 : {options.disableAutoPageChange+""}</span>
      </div>
    </>
  );
};

export default ViewBasic;