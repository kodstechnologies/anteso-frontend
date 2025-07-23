import { Router } from "express";
import EnquiryController from '../../../controllers/Admin/enquiry.controller.js'
const router = Router();
router.post('/add', EnquiryController.add)
router.get('/get-by-id/:id', EnquiryController.getById)
router.put('/update/:id', EnquiryController.updateById)
router.delete('/delete-by-id/:id', EnquiryController.deleteById)

export default router