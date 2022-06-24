import { Button, makeStyles, TextField } from '@material-ui/core';
import { PenHelper, NoteServer, PenMessageType, PenController } from 'web_pen_sdk';
import React, { useEffect, useState } from "react";
import { fabric } from 'fabric';
import { Dot, PageInfo, ScreenDot, PaperSize, VersionInfo, SettingInfo } from 'web_pen_sdk/dist/Util/type';
import { NULL_PageInfo } from '../utils/constants';
import Header from '../component/Header';
import { isPlatePaper, isSamePage } from 'web_view_sdk_test/dist/common';

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
  mainCanvas: {
    position: 'absolute',
    boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.2)',
  },
  hoverCanvas: {
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

const PenBasic = () => {
  const classes = useStyle();

  const [canvasFb, setCanvasFb] = useState<any>();
  const [hoverCanvasFb, setHoverCanvasFb] = useState<any>();
  const [ctx, setCtx] = useState<any>();

  const [pageInfo, setPageInfo] = useState<PageInfo>();

  const [noteWidth, setNoteWidth] = useState<number>(0);
  const [noteHeight, setNoteHeight] = useState<number>(0);

  const [hoverPoint, setHoverPoint] = useState<any>();
  const [angle, setAngle] = useState<number>(0);

  const [imageBlobUrl, setImageBlobUrl] = useState<any>();

  const [paperSize, setPaperSize] = useState<PaperSize>();

  const [plateMode, setPlateMode] = useState<boolean>(false);

  const [passwordPen, setPasswordPen] = useState<boolean>(false);

  const [penVersionInfo, setPenVersionInfo] = useState<VersionInfo>();
  const [penSettingInfo, setPenSettingInfo] = useState<SettingInfo>();
  const [controller, setController] = useState<PenController>();

  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const { canvas, hoverCanvas } = createCanvas();
    setCanvasFb(canvas);
    setHoverCanvasFb(hoverCanvas);
  }, []);

  /** Setting Ncode noteImage/paperSize */ 
  useEffect(() => {
    async function getNoteImageUsingAPI(pageInfo) {
      if (pageInfo.section === 0) {  // pageInfo.section === 0 -> abnormal pageInfo
        return;
      } 
      await NoteServer.getNoteImage(pageInfo, setImageBlobUrl);
      const paperSize: any = await NoteServer.extractMarginInfo(pageInfo);
      setPaperSize(paperSize);
      
      if (isPlatePaper(pageInfo)) {
        // SmartPlate Case, 서버에서 가져온 이미지를 사용하지 않으므로 0으로 설정해주고, canvasFb의 backgroundColor를 white로 만들어준다.
        setImageBlobUrl(0);
        canvasFb.backgroundColor = 'white';
        canvasFb.renderAll();
      }
    }

    if (pageInfo) {
      getNoteImageUsingAPI(pageInfo);
    }
  }, [pageInfo]);

  useEffect(() => {
    if (hoverCanvasFb) {
      createHoverPoint();
    }
  }, [hoverCanvasFb]);

  /** Get noteImage size */
  useEffect(() => {
    if (imageBlobUrl) {
      const image = new Image();
      image.src = imageBlobUrl;
      image.onload = () => {
        setNoteWidth(image.width);
        setNoteHeight(image.height);
      }
    }
  }, [imageBlobUrl])

  useEffect(() => {
    if (noteWidth > 0 && noteHeight > 0) {
      if (pageInfo && pageInfo.section === 0) {  // pageInfo.section === 0 -> abnormal pageInfo
        return 
      }

      if (pageInfo && isPlatePaper(pageInfo)) {  // In case of SmartPlate, not required bottom process.
        return
      }

      if (imageBlobUrl === 0) {  // In case of 'imageBlobUrl === 0', not required bottom process.
        return
      }
      
      setCanvasInitialize();

      /**
       * Refactoring canvas width based on noteImage.
       * 
       * Canvas(View) default height = 'window.innerHeight - 81(Header) - 82.25(input container)'
       * CanvasFb.height : CanvasFb.width = noteHeight : noteWidth;
       * CanvasFb.width(=refactorCanvasWidth) = (CanvasFb.height * noteWidth) / noteHeight;
       */
      const refactorCanvasWidth = canvasFb.height * noteWidth / noteHeight;
      canvasFb.setWidth(refactorCanvasWidth);
      hoverCanvasFb.setWidth(refactorCanvasWidth);

      canvasFb.setBackgroundImage(imageBlobUrl, canvasFb.renderAll.bind(canvasFb), {  // Resizing noteImage to fit canvas size
        scaleX: canvasFb.width / noteWidth,
        scaleY: canvasFb.height / noteHeight,
        // backgroundImage angle setting
        angle: angle,
        top: [180, 270].includes(angle) ? canvasFb.height : 0,
        left: [90, 180].includes(angle) ? canvasFb.width : 0,
      });      
    }
  }, [noteWidth, noteHeight, angle, pageInfo]);
 
  /**
   * This callback type is called `dotCallback`.
   * 
   * @callback dotCallback
   */
  useEffect(() => {
    PenHelper.dotCallback = async (mac, dot) => {
      strokeProcess(dot);
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
  
  /** Create mainCanvas, hoverCanvas */
  const createCanvas = () => { 
    const canvas = new fabric.Canvas('mainCanvas');
    const hoverCanvas = new fabric.Canvas('hoverCanvas');

    setCtx(canvas.getContext());

    return { canvas, hoverCanvas }
  }

  /**
   * Process ncode dot.
   * 
   * @param {Dot} dot
   */
  const strokeProcess = (dot: Dot) => {
    if (isPlatePaper(dot.pageInfo) && !plateMode) {  // SmartPlate를 터치했는데 plateMode가 on으로 설정되지 않으면 사용하지 못하도록 함.
      if (dot.dotType === 0) {  // Show alert message only if penDown
        alert('Plate Mode를 on으로 설정한 후, 캔버스를 생성해주세요.');
      }
      return
    }

    /** Update pageInfo either pageInfo !== NULL_PageInfo or pageInfo changed */ 
    if ((!pageInfo && !isSamePage(dot.pageInfo, NULL_PageInfo)) || 
        (pageInfo && !isSamePage(pageInfo, dot.pageInfo))) {
        setPageInfo(dot.pageInfo);
    }

    if (imageBlobUrl === undefined) {
      return;
    }

    if (!paperSize) {
      return;
    }

    /** Convert SmartPlate ncode dot coordinate values ​​according to the view size */
    const view = { width: canvasFb.width, height: canvasFb.height };
    let screenDot: ScreenDot;
    if (isPlatePaper(dot.pageInfo)) {  // Smart Plate
      screenDot = PenHelper.ncodeToScreen_smartPlate(dot, view, angle, paperSize);
    } else {  // Default
      screenDot = PenHelper.ncodeToScreen(dot, view, paperSize);
    }

    try {
      if (dot.dotType === 0) {  // Pen Down
        ctx.beginPath();
        hoverPoint.set({ opacity: 0 });  // In case of PenDown, hoverPoint dont need to look
        hoverCanvasFb.requestRenderAll();
      } else if (dot.dotType === 1) {  // Pen Move
        ctx.lineWidth = 2;
        ctx.lineTo(screenDot.x, screenDot.y);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(screenDot.x, screenDot.y);
      } else if (dot.dotType === 2) {  // Pen Up
        ctx.closePath();
      } else if (dot.dotType === 3) {  // Hover 
        hoverProcess(screenDot);
      }
    } catch {
      console.log('ctx : ' + ctx);
    }
  }

  /**
   * Message callback process. (Pen Event Processing)
   * 
   * @param mac 
   * @param type 
   * @param args 
   */
  const messageProcess = (mac, type, args) => {
    // console.log(mac, type, args);

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
        break;
      case PenMessageType.PEN_USING_NOTE_SET_RESULT:
        controller?.SetHoverEnable(true);
        break;
      case PenMessageType.EVENT_DOT_PUI:
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
  
  /**
   * Set canvas angle.
   * 
   * @param {number} rotate
   */
  const setCanvasAngle = (rotate: number) => {
    if (![0, 90, 180, 270].includes(rotate)) return
    if (!pageInfo || !isPlatePaper(pageInfo)) return

    if (Math.abs(angle-rotate)/90 === 1 || Math.abs(angle-rotate)/90 === 3) {  // 90', 270' - swap noteWidth <-> noteHeight
      const tmp = noteWidth;
      setNoteWidth(noteHeight);
      setNoteHeight(tmp); 
    }
    setAngle(rotate);
  }

  /**
   * Set canvas width.
   * 
   * @param {number} width
   */
  const setCanvasWidth = (width: number) => {
    canvasFb.setWidth(width);
    hoverCanvasFb.setWidth(width);
    canvasFb.setBackgroundImage(0, canvasFb.renderAll.bind(canvasFb))
  }

  /**
   * Set canvas height.
   * 
   * @param {number} height
   */
  const setCanvasHeight = (height: number) => {
    canvasFb.setHeight(height);
    hoverCanvasFb.setHeight(height);
    canvasFb.setBackgroundImage(0, canvasFb.renderAll.bind(canvasFb))
  }

  /** Initialize Canvas width, height, angle and plateMode */
  const setCanvasInitialize = () => {
    setPlateMode(false);
    canvasFb.setHeight(window.innerHeight-163.25-20);  // header(81) + inputContainer(82.25) + margin value(20)
    hoverCanvasFb.setHeight(window.innerHeight-163.25-20);
    setAngle(0);
  }

  /**
   * Hover Point Process.
   * 
   * @param {ScreenDot} screenDot
   */
  const hoverProcess = (screenDot: ScreenDot) => {
    hoverPoint.set({ left: screenDot.x, top: screenDot.y, opacity: 0.5 });
    hoverCanvasFb.requestRenderAll();
  }

  const createHoverPoint = () => {
    const hoverPoint = new fabric.Circle({ 
      radius: 10, 
      fill: '#ff2222',
      stroke: '#ff2222',
      opacity: 0,
      top: 0, 
      left: 0,
    });
    
    setHoverPoint(hoverPoint);
    hoverCanvasFb.add(hoverPoint);
  }
  
  return (
    <>
      <Header controller={controller} penVersionInfo={penVersionInfo} penSettingInfo={penSettingInfo} passwordPen={passwordPen} authorized={authorized} />
      <div id="abc" className={classes.mainBackground}>
        <canvas id="mainCanvas" className={classes.mainCanvas} width={window.innerWidth} height={window.innerHeight-163.25}></canvas>
        <div className={classes.hoverCanvasContainer}>
          <canvas id="hoverCanvas" className={classes.hoverCanvas} width={window.innerWidth} height={window.innerHeight-163.25}></canvas>
        </div>
      </div>
      <div id = "def"  className={classes.mainBackground}>
      </div> 
      <div className={classes.inputContainer}>
        <div className={classes.inputStyle}>
          <Button variant="contained" color="primary" size="large" onClick={() => setPlateMode(!plateMode)}>
            { plateMode ? 'Plate mode off' : 'Plate mode on' }
          </Button>
        </div>
        { plateMode ? 
          <div className={classes.inputContainer}>
            <div className={classes.inputStyle}>
              <TextField id="width" label="Width" variant="outlined" type="number" size="small"
                  onChange={(e) => setCanvasWidth(parseInt(e.target.value))} 
                  />
            </div>
            <div className={classes.inputStyle}>
              <TextField id="height" label="Height" variant="outlined" type="number" size="small"
                  onChange={(e) => setCanvasHeight(parseInt(e.target.value))} 
                  />
            </div>
            <div className={classes.inputStyle}>
              <TextField id="angle" label="Angle" variant="outlined" type="number" size="small"
                  onChange={(e) => setCanvasAngle(parseInt(e.target.value))} />
            </div>
          </div> : ''
        }
      </div>
    </>
  );
};

export default PenBasic;