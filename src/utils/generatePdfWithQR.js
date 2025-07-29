// src/utils/generatePdfWithQR.js
import QRCode from 'qrcode';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export const generatePdfWithQR = async (data) => {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(data);
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 400]);

        page.drawText('Tool Calibration Certificate', {
            x: 50,
            y: 350,
            size: 18,
            color: rgb(0, 0, 0),
        });

        const qrImageBytes = qrCodeDataUrl.split(',')[1];
        const qrImage = await pdfDoc.embedPng(Buffer.from(qrImageBytes, 'base64'));

        const scaledQR = qrImage.scale(0.5);
        page.drawImage(qrImage, {
            x: 400,
            y: 250,
            width: scaledQR.width,
            height: scaledQR.height,
        });

        const pdfBytes = await pdfDoc.save();
        const outputPath = path.join(path.resolve(), 'tool-certificate.pdf');
        fs.writeFileSync(outputPath, pdfBytes);

        console.log('✅ PDF with QR code saved to:', outputPath);
    } catch (err) {
        console.error('❌ Error generating PDF:', err);
    }
};
