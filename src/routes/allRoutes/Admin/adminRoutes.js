import express from 'express'
import { Router } from 'express';
import AuthRouter from '../../allRoutes/authRouter.router.js'
import ToolRoutes from '../Admin/tools.router.js'
import LeaveRoutes from '../Admin/leave.router.js'
import EnquiryRoutes from '../Admin/enquiry.router.js'
import ClientRoutes from '../Admin/clientRoutes.js'
import HospitalRoutes from '../Admin/hospital.router.js'
import InstituteRoutes from '../Admin/institute.router.js'
import RSORoutes from '../Admin/rso.router.js'
import {authenticate} from '../../../middlewares/authMiddleware.js'

import { verifyAccessToken } from '../../../middlewares/adminAuthMiddleware.js';
const router = Router();
router.use('/auth', AuthRouter)
router.use(authenticate)

router.use('/clients', ClientRoutes)
router.use('/hospital', HospitalRoutes)
router.use('/rso', RSORoutes)
router.use('/institute', InstituteRoutes)

router.use('/tools', ToolRoutes)
router.use('/leaves', LeaveRoutes)
router.use('/enquiry', EnquiryRoutes)


export default router