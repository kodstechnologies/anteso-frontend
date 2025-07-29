import { Router } from "express";
const router = Router();
import CourierController from '../../../controllers/Admin/courier.controller.js'

router.post('/add', CourierController.addCourier)
router.get('/get-all', CourierController.getAllCompanies)
router.get('/get-by-id/:id', CourierController.getCompanyById)
router.put('/update-by-id/:id', CourierController.updateCourierById)
router.delete('/delete-by-id/:id', CourierController.deleteCompanyById)
export default router