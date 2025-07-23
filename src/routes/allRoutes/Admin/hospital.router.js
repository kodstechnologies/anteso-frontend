import { Router } from "express";
const router = Router();
import HospitalController from '../../../controllers/Admin/hospital.controller.js'
import ClientController from "../../../controllers/Admin/client.controller.js";
import hospitalController from "../../../controllers/Admin/hospital.controller.js";
router.post('/add', HospitalController.add)
router.get('/get-by-id/:id', HospitalController.getById)
router.put('/update-by-id/:id', HospitalController.updateById)
router.delete('/delete-by-id/:id', HospitalController.deleteById)
router.get('/get-all', HospitalController.getAll)

//details by clientID

router.post('/create-hospital-by-client/:id', HospitalController.createHospitalByClientId)
router.get('/get-allHospitals-by-client/:id', HospitalController.getAllHospitalsByClientId)
router.delete('/delete-hospital-by-id/:clientId/:hospitalId', HospitalController.deleteHospitalByClientId)
router.put('/update-hospital-by-client/:clientId/:hospitalId', HospitalController.updateHospitalByClientId)
router.get('/get-hospital-by-clienId-and-hospitalId/:clientId/:hospitalId', hospitalController.getHospitalByClientIdAndHospitalId)

export default router