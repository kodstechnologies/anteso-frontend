import { Router } from "express";
const router = Router();
import quotationController from "../../../controllers/Admin/quotation.controller.js";
router.post('/create/:id', quotationController.createQuotationByEnquiryId)
router.get('/get-by-quotation-id/:id', quotationController.getQuotationByEnquiryId)
router.get('/get-quotation-by-customer-enq-quo-ids/:customerId/:enquiryId', quotationController.getQuotationByIds)
router.put('/accept-quotation/:customerId/:enquiryId/:quotationId', quotationController.acceptQuotation)
router.put('/reject-quotation/:customerId/:enquiryId/:quotationId', quotationController.rejectQuotation)
export default router