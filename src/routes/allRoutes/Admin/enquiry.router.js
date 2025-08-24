import { Router } from "express";
import EnquiryController from '../../../controllers/Admin/enquiry.controller.js'
const router = Router();

//enquiry creation by open form
router.post('/add', EnquiryController.add)
router.get('/get-all', EnquiryController.getAll)
router.get("/all-states",EnquiryController.getAllStates)

//enquiry creation after choosing leadowner
router.post('/create-direct-order-from-enquiry', EnquiryController.createDirectOrder)
router.get('/get-by-id/:id', EnquiryController.getEnquiryDetailsById)
router.put('/update/:id', EnquiryController.updateById)
router.delete('/delete-by-id/:id', EnquiryController.deleteById)
//for mobile
router.post('/add-by-customerId/:customerId', EnquiryController.addByCustomerId)
router.post('/get-by-enquiryId-customerId/:enquiryId/:customerId', EnquiryController.getByCustomerIdEnquiryId)

export default router