import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { createCanvas, DOMMatrix, ImageData, Path2D } = require("@napi-rs/canvas");
globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const pdfPath = process.argv[2];
const data = new Uint8Array(fs.readFileSync(pdfPath));
const pdf = await (await pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true, isEvalSupported: false })).promise;
const page = await pdf.getPage(1);

// Extract embedded images
for (const name of ["img_p0_1","img_p0_2","img_p0_3","img_p0_4"]) {
  try {
    const img = await page.objs.get(name);
    console.log(name, "keys", Object.keys(img||{}), "w", img?.width, "h", img?.height, "kind", img?.data?.length || img?.bitmap);
    // Try to dump raw RGBA if available
    if (img?.data && img.width && img.height) {
      const c = createCanvas(img.width, img.height);
      const ctx = c.getContext("2d");
      const id = ctx.createImageData(img.width, img.height);
      // pdfjs ImageKind: 1 GRAYSCALE_1BPP, 2 RGB_24BPP, 3 RGBA_32BPP
      const kind = img.kind;
      const src = img.data;
      console.log(name, "kind", kind, "dataLen", src.length, "expected", img.width*img.height*(kind===3?4:kind===2?3:1));
      if (kind === 2) {
        for (let i=0,j=0;i<src.length;i+=3,j+=4) {
          id.data[j]=src[i]; id.data[j+1]=src[i+1]; id.data[j+2]=src[i+2]; id.data[j+3]=255;
        }
      } else if (kind === 3) {
        id.data.set(src);
      } else {
        // grayscale / other - skip complex
        console.log("skip kind", kind);
        continue;
      }
      ctx.putImageData(id,0,0);
      fs.writeFileSync(`d:/PRAJWALA/anteso/temp-pdf-embed-${name}.png`, c.toBuffer("image/png"));
      console.log("wrote embed", name);
    }
  } catch(e) { console.log(name, e.message); }
}

// Wider crop around QR for context (include left account details)
const scale = 2.5;
const viewport = page.getViewport({ scale });
const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#fff";
ctx.fillRect(0,0,canvas.width,canvas.height);
await page.render({ canvasContext: ctx, viewport }).promise;

// QR at ~1560,2248 size ~120-200; expand to show surrounding labels
function save(name,x,y,w,h){
  const c=createCanvas(w,h);
  c.getContext("2d").drawImage(canvas,x,y,w,h,0,0,w,h);
  fs.writeFileSync(`d:/PRAJWALA/anteso/${name}`, c.toBuffer("image/png"));
  console.log(name,x,y,w,h);
}
save("temp-qr-context.png", 1200, 2050, 950, 550);
save("temp-qr-close.png", 1480, 2140, 420, 420);
save("temp-footer-full.png", 100, 2050, 2000, 700);
save("temp-totals-and-below.png", 1100, 1550, 1000, 500);
