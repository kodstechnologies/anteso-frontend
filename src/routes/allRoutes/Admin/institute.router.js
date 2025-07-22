import { Router } from "express";
const router = Router();
import InstituteController from '../../../controllers/Admin/institute.controller.js'
router.post('/add', InstituteController.add)
router.post('/get-all', InstituteController.getAll)
router.post('/get-by-id/:id', InstituteController.getById)
router.post('/update-by-id', InstituteController.updateById)

router.post('/delete-by-id/:id', InstituteController.deleteById)

export default router