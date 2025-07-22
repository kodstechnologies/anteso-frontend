import { Router } from "express";
const 
router = Router();
import RSOController from '../../../controllers/Admin/rso.controller.js'
router.post('/add', RSOController.add)
router.get('/get-by-id/:id', RSOController.getById)
router.put('/update-by-id/:id', RSOController.updateById)
router.delete('/delete-by-id/:id', RSOController.deleteById)
router.get('/all', RSOController.getAll)

export default router