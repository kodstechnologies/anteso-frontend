import { Router } from "express";
const router = Router();
import machineController from '../../../controllers/Admin/machine.controller.js'
router.post('/add', machineController.add)
router.put('/update/:id', machineController.updateById)
router.delete('/delete-by-id/:id', machineController.deleteById)
router.get('/get-all', machineController.getAll)
router.get('/get-by-id/:id', machineController.getById)
export default router