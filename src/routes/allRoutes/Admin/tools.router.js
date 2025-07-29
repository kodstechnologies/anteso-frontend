import { Router } from "express";
import toolsController from "../../../controllers/Admin/tools.controller.js";
const router = Router();
//normal tool CRUD
router.post('/add',toolsController.create)
router.get('/all-tools',toolsController.allTools)
router.put('/update/:id',toolsController.updateById)
router.delete('/delete/:id',toolsController.deleteById)
router.put('/get-by-id/:id',toolsController.getById)


//tools by employee

export default router