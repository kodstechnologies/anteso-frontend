import { Router } from "express";
import leaveController from "../../../controllers/Admin/leave.controller.js";
const router = Router();
router.post('/add', leaveController.add)
router.get('/get-by-id/:id', leaveController.getLeaveById)
router.put('/update/:id', leaveController.updateLeaveById)
router.get('/all-leaves', leaveController.getAllLeaves)
router.delete('/delete/:id', leaveController.deleteLeaveById)

// technician
router.post('/apply-for-leave/:technicianId', leaveController.applyForLeave)
router.get('/get-all-leaves/:technicianId', leaveController.getAllLeavesByCustomerId)
router.post('/approve-leave/:employeeId/:leaveId',leaveController.approveLeave)
router.post('/reject-leave/:employeeId/:leaveId',leaveController.rejectLeave)

export default router