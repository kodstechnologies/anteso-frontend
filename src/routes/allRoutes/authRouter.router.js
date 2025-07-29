import { Router } from "express";
import { adminLogin } from "../../controllers/Admin/login.controller.js";
import { verifyAccessToken } from "../../middlewares/adminAuthMiddleware.js";
const router = Router();

router.post('/login', adminLogin)



// router.
export default router