import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { createCanvas, DOMMatrix, ImageData, Path2D } = require("@napi-rs/canvas");
globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const pdfPath = process.argv[2];
const outPath = process.argv[3];
const scale = Number(process.argv[4] || 2.5);

const data = new Uint8Array(fs.readFileSync(pdfPath));
const loadingTask = pdfjs.getDocument({
  data,
  useSystemFonts: true,
  disableFontFace: true,
  isEvalSupported: false,
});
const pdf = await loadingTask.promise;
console.log("pages", pdf.numPages);
const page = await pdf.getPage(1);
const viewport = page.getViewport({ scale });
console.log("viewport", viewport.width, viewport.height);
const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
const context = canvas.getContext("2d");
context.fillStyle = "#ffffff";
context.fillRect(0, 0, canvas.width, canvas.height);
await page.render({ canvasContext: context, viewport }).promise;
fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
console.log("wrote", outPath, fs.statSync(outPath).size);
