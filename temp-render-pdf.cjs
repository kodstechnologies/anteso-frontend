const fs = require("fs");
const path = require("path");

async function main() {
  let createCanvas, DOMMatrix, ImageData, Path2D;
  try {
    ({ createCanvas, DOMMatrix, ImageData, Path2D } = require("@napi-rs/canvas"));
  } catch (e) {
    console.log("napi canvas failed", e.message);
    ({ createCanvas } = require("canvas"));
  }
  if (DOMMatrix) global.DOMMatrix = DOMMatrix;
  if (ImageData) global.ImageData = ImageData;
  if (Path2D) global.Path2D = Path2D;

  const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
  const pdfPath = process.argv[2];
  const outPath = process.argv[3];
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
  const scale = Number(process.argv[4] || 2.5);
  const viewport = page.getViewport({ scale });
  console.log("viewport", viewport.width, viewport.height);
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  const buf = typeof canvas.toBuffer === "function" ? canvas.toBuffer("image/png") : Buffer.from(await canvas.encode("png"));
  fs.writeFileSync(outPath, buf);
  console.log("wrote", outPath, fs.statSync(outPath).size);
}
main().catch((e) => { console.error(e); process.exit(1); });
