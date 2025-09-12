import { Router } from "express";
import EnquiryController from '../../../controllers/Admin/enquiry.controller.js'
import upload from '../../../middlewares/upload.js'
const router = Router();

//enquiry creation by open form
router.post('/add', EnquiryController.add) //--1--done
router.get('/get-all', EnquiryController.getAll)
router.get("/all-states", EnquiryController.getAllStates)

//enquiry creation after choosing leadowner
router.post('/create-direct-order-from-enquiry', EnquiryController.createDirectOrder)//--2--done
router.get('/get-by-id/:id', EnquiryController.getEnquiryDetailsById)//--3--done
router.put('/update/:id', EnquiryController.updateById)//--4
router.delete('/delete-by-id/:id', EnquiryController.deleteById)//--5
//for mobile
// router.post('/add-by-customerId/:customerId', EnquiryController.addByCustomerId)//--6--done -need testing
router.post(
    "/add-by-hospitalId/:hospitalId",
    upload.single("attachment"),
    EnquiryController.addByHospitalId
);
router.get('/get-all-enquiries-by-hospital/:hospitalId', EnquiryController.getAllEnquiriesByHospitalId)
router.get('/get-by-enquiryId-hospitalId/:enquiryId/:hospitalId', EnquiryController.getByHospitalIdEnquiryId)//--7-done need testing

export default router