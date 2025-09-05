import { Router } from "express";
import toolsController from "../../../controllers/Admin/tools.controller.js";
import upload from "../../../middlewares/upload.js";
const router = Router();
//normal tool CRUD
router.post('/add', upload.single("certificate"), toolsController.create)
router.get('/all-tools', toolsController.allTools)
router.put('/update/:id', toolsController.updateById)
router.delete('/delete/:id', toolsController.deleteById)
router.get('/get-by-id/:id', toolsController.getById)
router.get('/get-engineer-by-tool/:id', toolsController.getEngineerByTool)

//tools by employee

router.get('/all-tools-by-technicianId/:technicianId',toolsController.getAllToolsByTechnicianId)
router.get('/get-tools-by-technicanId-and-toolId/:technicianId/:toolId',toolsController.getToolByTechnicianAndTool)

export default router