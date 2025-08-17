import { Router } from "express";
const router = Router();
import InstituteController from '../../../controllers/Admin/institute.controller.js'
import instituteController from "../../../controllers/Admin/institute.controller.js";
// router.post('/add', InstituteController.add)
// router.post('/get-all', InstituteController.getAll)
// router.post('/get-by-id/:id', InstituteController.getById)
// router.post('/update-by-id', InstituteController.updateById)
// router.post('/delete-by-id/:id', InstituteController.deleteById)


router.post('/create-institute-by-client/:clientId', instituteController.createInstituteByClientId)
router.get('/get-institutes-by-client/:clientId', instituteController.getAllInstitutesByClientId)
router.get('/get-institute-by-client-and-institute/:clientId/:instituteId', instituteController.getInstituteByClientIdAndInstituteId)
router.put('/update-institute-by-client-and-institute/:clientId/:instituteId', instituteController.updateInstituteByClientIdAndInstituteId)
router.delete('/delete-institute-by-client-and-institute/:clientId/:instituteId', instituteController.deleteInstituteByClientId)
// router.post('/create-institute-by-client/:id', instituteController.createInstituteByClientId)


router.post('/create-institute-by-hospitalId/:hospitalId', instituteController.createInstituteByHospitalId)
router.get('/get-institute-by-hospitalId-instituteId/:hospitalId/:instituteId', instituteController.getInstituteByHospitalIdAndInstituteId)
router.put('/update-institute-by-hospitalId-instituteId/:hospitalId/:instituteId', instituteController.updateInstituteByHospitalIdAndInstituteId)
router.get('/get-all-institutes-by-hospitalId/:hospitalId', instituteController.getAllInstitutesByHospitalId)
router.delete('/delete-institute-by-hospitalId-instituteId/:hospitalId/:instituteId', instituteController.createInstituteByHospitalId)


export default router