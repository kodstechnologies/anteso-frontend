import { Router } from "express";
import advanceController from "../../../controllers/Admin/advance.controller.js";
const router = Router();
router.post('/add-advance-to-technician/:technicianId', advanceController.addAdvance)
router.get('/get-advance-amount/:technicianId', advanceController.getAddedAdvance)
// router.post('/edit-advance-amount',)
export default router;