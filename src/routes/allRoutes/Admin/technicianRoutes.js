import { Router } from "express";
import technicianController from "../../../controllers/Admin/technician.controller.js";
const router = Router();
router.post('/add', technicianController.add)
router.get('/get-by-id/:id', technicianController.getById)
router.get('/get-all', technicianController.getAll)
router.put('/update-by-id/:id', technicianController.updateById)
router.delete('/delete-by-id/:id', technicianController.deleteById)
router.get('/unassigned-tools', technicianController.getUnassignedTools)
router.get('/assigned-tools-for-technician/:technicianId', technicianController.assignedToolByTechnicianId)
// router.get('/all-engineers', technicianController.getAllEngineers)
router.get('/all-officeStaff', technicianController.getAllOfficeStaff)

//mobile
// router.post('/machine-details/:technicianId/:orderId',technicianController.machineDetails)
export default router