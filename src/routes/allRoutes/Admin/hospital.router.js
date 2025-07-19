import { Router } from "express";
const router = Router();
import HospitalController from '../../../controllers/Admin/hospital.controller.js'
router.post('/add', HospitalController.add)
export default router