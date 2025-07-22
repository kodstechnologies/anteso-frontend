import { Router } from "express";
const router = Router();
import ClientController from '../../../controllers/Admin/client.controller.js'
router.post('/add', ClientController.add)
router.get('/get-all', ClientController.getAll)

router.delete('/delete-by-id/:id', ClientController.deleteById)

router.put('/update/:id', ClientController.updateById)
router.get('/get-by-id/:id', ClientController.getById)
router.delete('/delete-all',ClientController.deleteAll)


export default router