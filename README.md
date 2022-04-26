# web-sdk-sample
Web sdk sample project using 'NeoSmart Pen'

## Installation 
``` sh
$ git clone https://github.com/MHCHOI3/web-sdk-sample2
$ cd web-sdk-sample
$ npm install
$ npm start
```


## Usage
### Library Set
```typescript
import PenHelper from '../utils/PenHelper';
```

### Step1: Connect SmartPen to Web service
```typescript
// Connect pen 
const scanPen = () => {
  PenHelper.scanPen();
};
```

### Step2: Data Parsing from SmartPen
```typescript
// Using PenHelper dotCallback function
useEffect(() => {
  PenHelper.dotCallback = (mac, dot) => {
    strokeProcess(dot);
  }
});
```

### Step3: Draw on Canvas with SmartPen
```typescript
// Coordinate Transformation with ncode_dot based on view_size
const view = { width: canvasFb.width, height: canvasFb.height };

// case Default:
const screenDot = PenHelper.ncodeToScreen(dot, view);
// case SmartPlate:
const screenDot = PenHelper.ncodeToScreen_smartPlate(dot, view, angle); // angle <- [0', 90', 180', 270']

// Create path data using screenDot
const path = new Path(screenDot.x, screenDot.y);
```

### Step4: Hover mode setting
```typescript
// PenController.js
PenController.prototype.SetHoverEnable = function (enable) {
  var _this = this;
  this.Request(function () { return _this.mClientV1.SetHoverEnable(enable); }, function () { return _this.mClientV2.ReqSetupHoverMode(enable); });
};


// PenHelper.js
characteristicBinding = (read, write, device) => {    
  ... // after write 
  controller.SetHoverEnable(true);
  ...
};


// PenClientParserV2.js - line 500
* before
if (this.penSettingInfo.HoverMode && !this.state.IsStartWithDown && this.state.IsStartWithPaperInfo) {
  ...
}
* after
if (this.penSettingInfo.HoverMode && !this.state.IsStartWithDown) {
  ...
}
```


## Debug Settings
```typescript
// webpack.config.js
devtool: 'cheap-module-source-map',

// vscode launch.json
"sourceMap": true,
"trace": true,

// package.json
"dev": "webpack-dev-server --host 0.0.0.0 --config ./webpack.config.js",

// Dev run
$ npm run dev
```


## Additional settings (to use PenHelper2.ts)
```typescript
// add 'device: any' in Class PenController
export default class PenController {
  ...
  device: any;
  ...
}
```