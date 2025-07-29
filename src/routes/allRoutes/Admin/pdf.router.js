import express from 'express';
import { generatePdfWithQR } from '../../../utils/generatePdfWithQR.js';

const router = express.Router();

router.get('/generate-pdf/:srf', async (req, res) => {
    try {
        const { srf } = req.params;
        const filePath = await generatePdfWithQR(srf, `${srf}.pdf`);
        res.download(filePath); // sends it to frontend
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to generate PDF");
    }
});
// generatePdfWithQR('SRF/2025/07/001');

export default router;
