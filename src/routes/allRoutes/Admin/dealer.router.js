import { Router } from "express";
const router = Router();
import DealerController from '../../../controllers/Admin/dealer.controller.js'
import dealerController from "../../../controllers/Admin/dealer.controller.js";
router.post('/create-dealer', DealerController.createDealer)
router.get('/get-all-dealers', DealerController.getAll)
router.get('/get-by-id/:id',DealerController.getById)
router.put('/edit-by-id/:id',DealerController.editById)
router.delete('/delete-by-id/:id',DealerController.deleteById)

export default router