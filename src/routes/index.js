import { Router } from 'express';
import AdminRoutes from '../routes/allRoutes/Admin/adminRoutes.js'
import UserRoutes from '../routes/allRoutes/User/userRoutes.js'


const router = Router();
// router.use('/auth', AuthRouter)
// router.use(verifyAccessToken)

// router.use('/clients', ClientRoutes)
// router.use('/hospital', HospitalRoutes)
// router.use('/rso', RSORoutes)
// router.use('/institute', InstituteRoutes)

// router.use('/tools', ToolRoutes)
// router.use('/leaves', LeaveRoutes)
// router.use('/enquiry', EnquiryRoutes)
router.use('/admin', AdminRoutes)
router.use('/user', UserRoutes)


export default router