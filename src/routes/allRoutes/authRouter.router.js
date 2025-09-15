import { Router } from "express";
import  adminLogin from "../../controllers/Admin/login.controller.js";
import  staffLogin  from '../../controllers/Admin/login.controller.js'
import { verifyAccessToken } from "../../middlewares/adminAuthMiddleware.js";
import loginController from "../../controllers/Admin/login.controller.js";
const router = Router();

router.post('/login',loginController.adminLogin)
// router.post('/signout',lo)
router.post('/staff-login', loginController.staffLogin)

// router.
export default router