import { Router } from "express";
const router = Router();
import PaymentController from '../../../controllers/Admin/payment.controller.js'
import upload from "../../../middlewares/upload.js";

router.post('/add-payment', upload.single('screenshot'), PaymentController.addPayment)
router.get('/all-orders-with-client-name', PaymentController.allOrdersWithClientName)
router.get('/get-total-amount', PaymentController.getTotalAmount)
router.get('/get-all-payments', PaymentController.getAllPayments)
router.get('/get-payment-type-by-srf/:srfNumber', PaymentController.getPaymentsBySrf)
router.get('/get-payment-by-id/:id',PaymentController.getPaymentById)
router.get('/search-by-srf',PaymentController.searchBySRF)
router.delete('/delete-payment-by-id/:paymentId',PaymentController.deletePayment)
router.get('/payment-details-by-orderId/:orderId',PaymentController.getPaymentDetailsByOrderId)

export default router