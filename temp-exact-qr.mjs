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

const scale = 3;
const viewport = page.getViewport({ scale });
const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#fff";
ctx.fillRect(0,0,canvas.width,canvas.height);
await page.render({ canvasContext: ctx, viewport }).promise;

// Exact QR image placement from CTM analysis (PDF bottom-left origin)
// x=564.8, y=145.2, w=132.9, h=125.3
const pageH = 1147.83;
const qr = {
  x: 564.8 * scale,
  // canvas y from top
  y: (pageH - 145.2 - 125.3) * scale,
  w: 132.9 * scale,
  h: 125.3 * scale,
};
console.log("qr canvas box", qr);

function save(name, x, y, w, h) {
  const c = createCanvas(Math.round(w), Math.round(h));
  c.getContext("2d").drawImage(canvas, x, y, w, h, 0, 0, w, h);
  fs.writeFileSync(`d:/PRAJWALA/anteso/${name}`, c.toBuffer("image/png"));
  console.log("wrote", name, Math.round(w), Math.round(h));
}

save("temp-qr-exact.png", qr.x, qr.y, qr.w, qr.h);

// Include text below QR (ICICI details) and heading OUR ACCOUNT DETAILS
// Account section roughly y PDF 78-150, heading at 149.7
save("temp-qr-with-account-right.png",
  520 * scale,
  (pageH - 280) * scale,
  320 * scale,
  220 * scale
);

// Full footer band: NABL left + account center + QR/ICICI right
save("temp-footer-band.png",
  90 * scale,
  (pageH - 290) * scale,
  720 * scale,
  230 * scale
);

// Left image (NABL?) exact
// img_p0_4: x=100.5 y=161.3 w=137.2 h=91.3
save("temp-nabl-exact.png",
  100.5 * scale,
  (pageH - 161.3 - 91.3) * scale,
  137.2 * scale,
  91.3 * scale
);

// Compare dimensions: PDF QR placed size vs frontend h-20 (5rem=80px)
console.log("PDF QR display size:", (132.9).toFixed(1), "x", (125.3).toFixed(1), "pt (~", (132.9/72*25.4).toFixed(1), "mm)");
console.log("PDF QR as fraction of page width:", (132.9/886.957*100).toFixed(1) + "%");
console.log("Right edge margin:", ((886.957 - (564.8+132.9))/886.957*100).toFixed(1) + "% from right");
console.log("QR horizontal position: starts at", (564.8/886.957*100).toFixed(1) + "% from left (RIGHT side)");

// Pixel analyze exact QR for logo / colored finder patterns (UPI often has colored brand icons at corners outside QR)
const img = await loadImage("d:/PRAJWALA/anteso/temp-qr-exact.png");
const c2 = createCanvas(img.width, img.height);
const x2 = c2.getContext("2d");
x2.drawImage(img,0,0);
const id = x2.getImageData(0,0,img.width,img.height);
let colorPixels = 0, orangeish=0, greenish=0, blueish=0;
for (let i=0;i<id.data.length;i+=4){
  const r=id.data[i],g=id.data[i+1],b=id.data[i+2];
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  if (max-min>40 && max>80) {
    colorPixels++;
    if (r>g && r>b && r-b>40) orangeish++;
    if (g>r && g>b) greenish++;
    if (b>r && b>g) blueish++;
  }
}
console.log("exact QR color pixels%", +(100*colorPixels/(img.width*img.height)).toFixed(2), {orangeish, greenish, blueish});

// Find continuous dark QR module square (excluding possible caption)
let minX=img.width,minY=img.height,maxX=0,maxY=0,dark=0;
for(let y=0;y<img.height;y++) for(let x=0;x<img.width;x++){
  const i=(y*img.width+x)*4;
  if ((id.data[i]+id.data[i+1]+id.data[i+2])/3 < 90) {
    dark++;
    if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y;
  }
}
console.log("exact dark bbox", {minX,minY,maxX,maxY,w:maxX-minX+1,h:maxY-minY+1, darkPct:+(100*dark/(img.width*img.height)).toFixed(1)});

// Check if whitespace margins suggest text inside image above/below modules
console.log("margin top", minY, "bottom", img.height-1-maxY, "left", minX, "right", img.width-1-maxX);
