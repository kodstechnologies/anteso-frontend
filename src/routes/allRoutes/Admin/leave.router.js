import { Router } from "express";
import leaveController from "../../../controllers/Admin/leave.controller.js";
const router = Router();
router.post('/add', leaveController.add)
router.get('/get-by-id/:id', leaveController.getLeaveById)
router.put('/update/:id', leaveController.updateLeaveById)
router.get('/all-leaves', leaveController.getAllLeaves)
router.delete('/delete/:id', leaveController.deleteLeaveById)

export default router