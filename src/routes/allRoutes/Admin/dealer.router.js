import { Router } from "express";
const router = Router();
import DealerController from '../../../controllers/Admin/dealer.controller.js'
router.post('/create-dealer', DealerController.createDealer)
router.get('/get-all-dealers', DealerController.getAll)
export default router