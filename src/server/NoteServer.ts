import { PageInfo } from '../utils/type';
import data from './note_308/note_308.nproj';
import imageSrc from '../server/note_308/3_27_308_15.jpg';

// Ncode Formula
const NCODE_SIZE_IN_INCH = 8 * 7 / 600;
const POINT_72DPI_SIZE_IN_INCH = 1 / 72;

const point72ToNcode = (p) => {
  const ratio = NCODE_SIZE_IN_INCH / POINT_72DPI_SIZE_IN_INCH;
  return p / ratio;
}

/**
 * GET local xml file
 */
const xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  if (xhttp.readyState == 4 && xhttp.status == 200) {
    fetchData(xhttp);
  }
};
xhttp.open('GET', data, true);
xhttp.send();

const fetchData = (xmlData) => {
  return xmlData.responseText;
}


/**
 * Calculate page margin info 
 * -> define X(min/max), Y(min,max)
 */
const extractMarginInfo = (pageInfo: PageInfo) => {
  const xmlRaw = fetchData(xhttp);
  if (!xmlRaw) return

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlRaw, 'text/xml');
  console.log(xmlDoc);

  // SOBP
  const section = xmlDoc.children[0].getElementsByTagName('section')[0]?.innerHTML;
  const owner = xmlDoc.children[0].getElementsByTagName('owner')[0]?.innerHTML;
  const book = xmlDoc.children[0].getElementsByTagName('code')[0]?.innerHTML;
  const page = pageInfo.page;
  console.log(`Target SOBP: ${section}(section) ${owner}(owner) ${book}(book) ${page}(page)`);

  // Specify page item
  const page_item = xmlDoc.children[0].getElementsByTagName('page_item')[10];

  let x1, x2, y1, y2, crop_margin, l, t, r, b;

  try {
    x1 = page_item.getAttribute('x1');
    x2 = page_item.getAttribute('x2');
    y1 = page_item.getAttribute('y1');
    y2 = page_item.getAttribute('y2');

    crop_margin = page_item.getAttribute('crop_margin');
    const margins = crop_margin.split(',');
    l = parseFloat(margins[0]);
    t = parseFloat(margins[1]);
    r = parseFloat(margins[2]);
    b = parseFloat(margins[3]);
  } catch (err) {
    console.log(err);
  }

  const Xmin = point72ToNcode(x1) + point72ToNcode(l);
  const Ymin = point72ToNcode(y1) + point72ToNcode(t);
  const Xmax = point72ToNcode(x2) - point72ToNcode(r);
  const Ymax = point72ToNcode(y2) - point72ToNcode(b);

  return { Xmin, Xmax, Ymin, Ymax }
}


/**
 * GET note image function
 */
const getNoteImage = (pageInfo: PageInfo) => {
  return imageSrc
}

const getNoteSize = (pageInfo: PageInfo) => {
  const image = new Image();
  image.src = imageSrc;
  image.onload = () => {
    console.log(image.width);
    console.log(image.height);
  }
  return { width: 1182, height: 1616 }
}

const api = {
  fetchData,
  extractMarginInfo,
  getNoteImage,
  getNoteSize,
}

export default api;

