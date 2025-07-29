import { Router } from "express";
const router = Router();
import quotationController from "../../../controllers/Admin/quotation.controller.js";
router.post('/create/:id', quotationController.createQuotationByEnquiryId)
router.get('/get-by-quotation-id/:id',quotationController.getQuotationByEnquiryId)

export default router