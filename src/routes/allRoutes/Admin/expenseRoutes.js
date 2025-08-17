import { Router } from "express";
import expenseController from "../../../controllers/Admin/expense.controller.js";
const router = Router();
router.post('/add-advance-to-technician/:technicianId', expenseController.addAdvance)
export default router;