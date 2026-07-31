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

// List operators for images
const ops = await page.getOperatorList();
const { OPS } = pdfjs;
console.log("OPS keys sample", Object.keys(OPS).filter(k => /Image|XObject|paint/i.test(k)));
let imgCount = 0;
for (let i = 0; i < ops.fnArray.length; i++) {
  const fn = ops.fnArray[i];
  if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject) {
    imgCount++;
    console.log("image op", i, "fn", fn, "args", ops.argsArray[i]?.[0], ops.argsArray[i]?.slice?.(0,3));
  }
}
console.log("image ops", imgCount);

const scale = 2.5;
const viewport = page.getViewport({ scale });
const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#fff";
ctx.fillRect(0,0,canvas.width,canvas.height);
await page.render({ canvasContext: ctx, viewport }).promise;

function crop(name, x0, y0, x1, y1) {
  // coords as fractions of full page
  const x = Math.floor(canvas.width * x0);
  const y = Math.floor(canvas.height * y0);
  const w = Math.floor(canvas.width * (x1-x0));
  const h = Math.floor(canvas.height * (y1-y0));
  const c = createCanvas(w, h);
  c.getContext("2d").drawImage(canvas, x, y, w, h, 0, 0, w, h);
  const p = `d:/PRAJWALA/anteso/${name}`;
  fs.writeFileSync(p, c.toBuffer("image/png"));
  console.log("wrote", p, w, h);
}

// bottom half
crop("temp-quotation-bottom.png", 0, 0.72, 1, 1);
// left account + right account area
crop("temp-quotation-accounts.png", 0.05, 0.82, 0.95, 0.95);
// possible QR somewhere - scan for dark square density
// Try common QR positions: bottom-right of totals? mid-right?
crop("temp-qr-guess-br.png", 0.55, 0.72, 0.95, 0.92);
crop("temp-qr-guess-tr-totals.png", 0.55, 0.40, 0.95, 0.60);
crop("temp-qr-guess-mid.png", 0.35, 0.55, 0.75, 0.80);

// Find darkest square-ish region heuristically in bottom 50%
const imgData = ctx.getImageData(0, Math.floor(canvas.height*0.4), canvas.width, Math.floor(canvas.height*0.6));
const W = canvas.width, H = Math.floor(canvas.height*0.6);
const block = 40;
let best = {score:0,x:0,y:0};
for (let by = 0; by < H - 120; by += 20) {
  for (let bx = 0; bx < W - 120; bx += 20) {
    let dark = 0, n = 0;
    for (let y = by; y < by+120; y += 4) {
      for (let x = bx; x < bx+120; x += 4) {
        const i = (y*W + x)*4;
        const v = imgData.data[i];
        if (v < 80) dark++;
        n++;
      }
    }
    const score = dark/n;
    if (score > best.score) best = {score, x:bx, y:by + Math.floor(canvas.height*0.4)};
  }
}
console.log("darkest 120x120 candidate", best);
if (best.score > 0.15) {
  const pad = 80;
  const x = Math.max(0, best.x - pad);
  const y = Math.max(0, best.y - pad);
  const w = Math.min(canvas.width - x, 120 + pad*2 + 100);
  const h = Math.min(canvas.height - y, 120 + pad*2 + 150);
  const c = createCanvas(w,h);
  c.getContext("2d").drawImage(canvas, x,y,w,h,0,0,w,h);
  fs.writeFileSync("d:/PRAJWALA/anteso/temp-qr-detected.png", c.toBuffer("image/png"));
  console.log("wrote detected", x,y,w,h);
}

const qrAsset = await loadImage("d:/PRAJWALA/anteso/anteso-frontend/src/assets/quotationImg/qrcode.png");
console.log("frontend qrcode.png:", qrAsset.width, "x", qrAsset.height);
fs.copyFileSync("d:/PRAJWALA/anteso/anteso-frontend/src/assets/quotationImg/qrcode.png", "d:/PRAJWALA/anteso/temp-frontend-qrcode.png");
