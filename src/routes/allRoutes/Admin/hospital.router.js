import { Router } from "express";
const router = Router();
import HospitalController from '../../../controllers/Admin/hospital.controller.js'
router.post('/add', HospitalController.add)
router.get('/get-by-id/:id', HospitalController.getById)
router.put('/update-by-id/:id', HospitalController.updateById)
router.delete('/delete-by-id/:id', HospitalController.deleteById)
router.get('/get-all', HospitalController.getAll)



export default router