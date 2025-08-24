import { Router } from "express";
const router = Router();
import PaymentController from '../../../controllers/Admin/payment.controller.js'
import upload from "../../../middlewares/upload.js";

router.post('/add-payment', upload.single('screenshot'), PaymentController.addPayment)
router.get('/all-orders-with-client-name', PaymentController.allOrdersWithClientName)
router.get('/get-total-amount', PaymentController.getTotalAmount)
router.get('/get-all-payments',PaymentController.getAllPayments)

export default router