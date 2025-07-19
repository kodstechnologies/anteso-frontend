import { Router } from "express";
const router = Router();
import InstituteController from '../../../controllers/Admin/institute.controller.js'
router.post('/add', InstituteController.add)
export default router