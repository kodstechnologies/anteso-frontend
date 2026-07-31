import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { createCanvas, DOMMatrix, ImageData, Path2D, loadImage } = require("@napi-rs/canvas");
globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const pdfPath = process.argv[2];
const data = new Uint8Array(fs.readFileSync(pdfPath));
const pdf = await (await pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true, isEvalSupported: false })).promise;
const page = await pdf.getPage(1);
const ops = await page.getOperatorList();
const { OPS } = pdfjs;

// Track CTM for image paints
function multiply(a,b){
  return [
    a[0]*b[0]+a[2]*b[1],
    a[1]*b[0]+a[3]*b[1],
    a[0]*b[2]+a[2]*b[3],
    a[1]*b[2]+a[3]*b[3],
    a[0]*b[4]+a[2]*b[5]+a[4],
    a[1]*b[4]+a[3]*b[5]+a[5],
  ];
}
let ctm = [1,0,0,1,0,0];
const stack = [];
const images = [];
for (let i=0;i<ops.fnArray.length;i++){
  const fn = ops.fnArray[i];
  const args = ops.argsArray[i];
  if (fn === OPS.save) stack.push(ctm.slice());
  else if (fn === OPS.restore) ctm = stack.pop() || ctm;
  else if (fn === OPS.transform) ctm = multiply(ctm, args);
  else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
    // Image is drawn in unit square transformed by CTM: width=ctm[0], height=ctm[3], x=ctm[4], y=ctm[5]
    images.push({
      name: args[0],
      wPdf: Math.abs(ctm[0]),
      hPdf: Math.abs(ctm[3]),
      xPdf: ctm[4],
      yPdf: ctm[5],
      // bottom-left origin in PDF; if h positive image goes up
      ctm: ctm.slice(),
      nativeW: args[1],
      nativeH: args[2],
    });
  }
}
const vp = page.getViewport({scale:1});
console.log("page size", vp.width, vp.height);
for (const im of images) {
  const topFromTop = vp.height - (im.yPdf + (im.ctm[3] > 0 ? im.hPdf : 0));
  console.log(JSON.stringify({
    name: im.name,
    native: `${im.nativeW}x${im.nativeH}`,
    placed: `${im.wPdf.toFixed(1)}x${im.hPdf.toFixed(1)} pt`,
    bottomLeft: `(${im.xPdf.toFixed(1)}, ${im.yPdf.toFixed(1)})`,
    approxTopLeftFromTop: `(${im.xPdf.toFixed(1)}, ${topFromTop.toFixed(1)})`,
    rightEdge: (im.xPdf + im.wPdf).toFixed(1),
  }, null, 0));
}

// Analyze QR close crop for center logo (non-B&W center)
const qr = await loadImage("d:/PRAJWALA/anteso/temp-qr-close.png");
const c = createCanvas(qr.width, qr.height);
const ctx = c.getContext("2d");
ctx.drawImage(qr,0,0);
const id = ctx.getImageData(0,0,qr.width,qr.height);
const cx = Math.floor(qr.width/2), cy = Math.floor(qr.height/2);
function regionStats(x0,y0,x1,y1){
  let r=0,g=0,b=0,n=0,colorful=0,dark=0;
  for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){
    const i=(y*qr.width+x)*4;
    r+=id.data[i]; g+=id.data[i+1]; b+=id.data[i+2];
    const max=Math.max(id.data[i],id.data[i+1],id.data[i+2]);
    const min=Math.min(id.data[i],id.data[i+1],id.data[i+2]);
    if (max-min > 30) colorful++;
    if ((id.data[i]+id.data[i+1]+id.data[i+2])/3 < 100) dark++;
    n++;
  }
  return {avg:[Math.round(r/n),Math.round(g/n),Math.round(b/n)], colorfulPct: +(100*colorful/n).toFixed(1), darkPct:+(100*dark/n).toFixed(1)};
}
console.log("QR crop size", qr.width, qr.height);
console.log("center 40x40", regionStats(cx-20,cy-20,cx+20,cy+20));
console.log("center 80x80", regionStats(cx-40,cy-40,cx+40,cy+40));
console.log("full", regionStats(0,0,qr.width,qr.height));
console.log("top strip", regionStats(0,0,qr.width,40));
console.log("bottom strip", regionStats(0,qr.height-40,qr.width,qr.height));

// frontend asset
const fe = await loadImage("d:/PRAJWALA/anteso/temp-frontend-qrcode.png");
const fc = createCanvas(fe.width, fe.height);
const fctx = fc.getContext("2d");
fctx.drawImage(fe,0,0);
const fid = fctx.getImageData(0,0,fe.width,fe.height);
function feStats(x0,y0,x1,y1){
  let colorful=0,dark=0,n=0,r=0,g=0,b=0;
  for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){
    const i=(y*fe.width+x)*4; r+=fid.data[i];g+=fid.data[i+1];b+=fid.data[i+2];
    const max=Math.max(fid.data[i],fid.data[i+1],fid.data[i+2]);
    const min=Math.min(fid.data[i],fid.data[i+1],fid.data[i+2]);
    if(max-min>30)colorful++;
    if((fid.data[i]+fid.data[i+1]+fid.data[i+2])/3<100)dark++;
    n++;
  }
  return {avg:[Math.round(r/n),Math.round(g/n),Math.round(b/n)],colorfulPct:+(100*colorful/n).toFixed(1),darkPct:+(100*dark/n).toFixed(1)};
}
const fcx=Math.floor(fe.width/2), fcy=Math.floor(fe.height/2);
console.log("frontend QR", fe.width, fe.height);
console.log("fe center 40", feStats(fcx-20,fcy-20,fcx+20,fcy+20));
console.log("fe full", feStats(0,0,fe.width,fe.height));

// Measure QR black bounding box in close crop
let minX=qr.width,minY=qr.height,maxX=0,maxY=0;
for(let y=0;y<qr.height;y++) for(let x=0;x<qr.width;x++){
  const i=(y*qr.width+x)*4;
  if ((id.data[i]+id.data[i+1]+id.data[i+2])/3 < 80) {
    if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y;
  }
}
console.log("dark bbox in close crop", {minX,minY,maxX,maxY,w:maxX-minX,h:maxY-minY});

// Text near QR: items with x > 450 and y < 200
const content = await page.getTextContent();
const near = content.items.filter(i => i.str?.trim() && i.transform[4] > 400 && i.transform[5] < 220)
  .map(i => ({str:i.str, x:+i.transform[4].toFixed(1), y:+i.transform[5].toFixed(1)}))
  .sort((a,b)=>b.y-a.y||a.x-b.x);
console.log("text near bottom-right:");
near.forEach(t => console.log(t.y, t.x, t.str));
