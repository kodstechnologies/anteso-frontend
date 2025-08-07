import { Router } from "express";
const router = Router();
import machineController from '../../../controllers/Admin/machine.controller.js'
router.post('/add/:customerId', machineController.add)
router.get('/get-machine-by-customer/:id', machineController.getAllMachinesByCustomerId)
router.put('/update/:id/:customerId', machineController.updateById)
router.delete('/delete-by-id/:id/:customerId', machineController.deleteById)
// router.get('/get-all', machineController.getAll)
router.get('/get-by-id/:id/:customerId', machineController.getById)
router.get('/search-by-type/:customerId', machineController.searchByType)

export default router