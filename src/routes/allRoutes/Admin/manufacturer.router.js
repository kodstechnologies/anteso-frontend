import { Router } from "express";
import manufacturerController from "../../../controllers/Admin/manufacturer.controller.js";
const router = Router();

router.post('/add',manufacturerController.addManufacturer)
router.get('/get-by-id/:id',manufacturerController.getManufacturerById)
router.put('/update-manufacturer/:id',manufacturerController.editManufacturer)
router.delete('/delete-manufacturer/:id',manufacturerController.deleteManufacturer)
export default router