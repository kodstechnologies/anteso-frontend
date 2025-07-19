import { Router } from "express";
import leaveController from "../../../controllers/Admin/leave.controller.js";
const router = Router();
router.post('/add', leaveController.add)
router.post('/get-by-id/:id', leaveController.getLeaveById)
router.post('/update/:id', leaveController.updateLeaveById)
router.post('/all-leaves', leaveController.getAllLeaves)
router.post('/delete/:id', leaveController.deleteLeaveById)

export default router