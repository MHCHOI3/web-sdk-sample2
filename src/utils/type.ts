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

export type { 
  PageInfo,
  PaperBase,
};