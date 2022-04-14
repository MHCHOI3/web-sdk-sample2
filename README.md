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
// Draw stroke using dot data

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