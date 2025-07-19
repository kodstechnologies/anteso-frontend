import { Router } from 'express';
import AuthRouter from '../routes/allRoutes/authRouter.router.js'
import ToolRoutes from '../routes/allRoutes/Admin/tools.router.js'
import LeaveRoutes from '../routes/allRoutes/Admin/leave.router.js'
import EnquiryRoutes from '../routes/allRoutes/Admin/enquiry.router.js'
import ClientRoutes from '../routes/allRoutes/Admin/clientRoutes.js'
import HospitalRoutes from '../routes/allRoutes/Admin/hospital.router.js'
import InstituteRoutes from '../routes/allRoutes/Admin/institute.router.js'
import RSORoutes from '../routes/allRoutes/Admin/rso.router.js'

import { verifyAccessToken } from '../middlewares/authMiddleware.js';
const router = Router();
router.use('/auth', AuthRouter)
router.use(verifyAccessToken)

router.use('/clients', ClientRoutes)
router.use('/hospital', HospitalRoutes)
router.use('/rso', RSORoutes)
router.use('/institute', InstituteRoutes)

router.use('/tools', ToolRoutes)
router.use('/leaves', LeaveRoutes)
router.use('/enquiry', EnquiryRoutes)

export default router