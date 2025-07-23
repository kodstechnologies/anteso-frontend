import { Router } from "express";
import EnquiryController from '../../../controllers/Admin/enquiry.controller.js'
const router = Router();
router.post('/add', EnquiryController.add)
export default router