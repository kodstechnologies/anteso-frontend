import { Router } from "express";
import technicianController from "../../../controllers/Admin/technician.controller.js";
const router = Router();
router.post('/add',technicianController.add)
router.get('/get-by-id/:id',technicianController.getById)
router.get('/get-all',technicianController.getAll)
router.put('/update-by-id/:id',technicianController.updateById)
router.delete('/delete-by-id/:id',technicianController.deleteById)
export default router
