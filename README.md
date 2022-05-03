# Neo smartpen SDK Sample Page
Web sdk sample page using 'NeoSmart Pen'

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

### 1. Pen Connection
![MainPage](./src/assets/1.png)
```typescript
/** ./src/buttons/ConnectButton.tsx */
const scanPen = () => {
  PenHelper.scanPen();
}
```

### 2. **(Default)** Touch your ncode paper and then use it.
![DefaultPage](./src/assets/2.png)


### 3. **(SmartPlate)**  Change the plate mode to on and set the view size.
![SmartPlatePage](./src/assets/3.png)

#### [Landscape]
- SmartPlate default setting is landscape 

![SmartPlateLandscape](./src/assets/4.png)

#### [portrait]
- If you want to use it portrait mode -> set angle value

![SmartPlatePortrait](./src/assets/5.png)

