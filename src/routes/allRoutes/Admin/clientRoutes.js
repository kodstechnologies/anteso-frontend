import { Router } from "express";
const router = Router();
import ClientController from '../../../controllers/Admin/client.controller.js'
router.post('/add',ClientController.add)
export default router