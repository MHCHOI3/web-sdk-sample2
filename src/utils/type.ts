type PageInfo = {
  section: number;
  owner: number;
  book: number;
  page: number;
};

type PaperBase = {
  Xmin: number;
  Ymin: number;
}

type Dot = {
  angle: object;
  color: number;
  dotType: number;
  f: number;
  pageInfo: PageInfo;
  penTipType: number;
  timestamp: number;
  x: number;
  y: number;
}

export type { 
  PageInfo,
  PaperBase,
  Dot
};