# web-sdk-sample
Web sdk sample project using 'NeoSmart Pen'

## Installation 
``` sh
# web_pen_sdk setting
$ npm install web_pen_sdk

# Sample project setting
$ git clone https://github.com/MHCHOI3/web-sdk-sample2
$ cd web-sdk-sample2
$ npm install
$ npm start
```


## Usage
### Library Set
```typescript
import { PenHelper } from 'web_pen_sdk';
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

### Step3: Extract from .nproj file to the ncode Note's margin info
```typescript
// paperSize type { Xmin, Xmax, Ymin, Ymax }
const paperSize = await api.extractMarginInfo(pageInfo);
```

### Step4: Draw on Canvas with SmartPen
```typescript
// Coordinate Transformation with ncode_dot based on view_size, ncode_size
const view = { width: canvasFb.width, height: canvasFb.height };

// case Default:
const screenDot = PenHelper.ncodeToScreen(dot, view, paperSize);
// case SmartPlate:
const screenDot = PenHelper.ncodeToScreen_smartPlate(dot, view, angle, paperSize) // angle <- [0', 90', 180', 270']

// Create path data using screenDot
const path = new Path(screenDot.x, screenDot.y);
```
