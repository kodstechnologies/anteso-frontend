import { Router } from "express";
const router = Router();
import RSOController from '../../../controllers/Admin/rso.controller.js'
router.post('/add', RSOController.add)
export default router