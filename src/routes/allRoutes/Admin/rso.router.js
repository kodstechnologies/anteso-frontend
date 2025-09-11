import { Router } from "express";
const router = Router();
import RSOController from '../../../controllers/Admin/rso.controller.js'
import rsoController from "../../../controllers/Admin/rso.controller.js";
import upload from '../../../middlewares/upload.js'
// router.post('/add', RSOController.add)
// router.get('/get-by-id/:id', RSOController.getById)
// router.put('/update-by-id/:id', RSOController.updateById)
// router.delete('/delete-by-id/:id', RSOController.deleteById)
router.get('/all', RSOController.getAll)

//rso by client
router.post('/create-rso-by-client/:clientId', RSOController.creatersoByClientId)
router.get('/get-allRso-by-client/:id', RSOController.getAllrsoByClientId)
router.delete('/delete-rso-by-id/:clientId/:rsoId', RSOController.deletersoByClientId)
router.put('/update-rso-by-client/:clientId/:rsoId', RSOController.updatersoByClientId)
router.get('/get-rso-by-clienId-and-rsoId/:clientId/:rsoId', RSOController.getrsoByClientIdAndRsoId)


router.post('/create-rso-by-hospitalId/:hospitalId', upload.single("attachment"), rsoController.createRsoByHospitalId)
router.get('/get-rso-by-hospitalId-rsoId/:hospitalId/:rsoId', rsoController.getRsoByHospitalIdAndRsoId)
router.get('/get-all-rso-by-hospitalId/:hospitalId', rsoController.getAllRsoByHospitalId)
router.put('/update-rso-by-hospitalId-rsoId/:hospitalId/:rsoId ', rsoController.updateRsoByHospitalId)
router.delete('/delete-rso-by-hospitalId-rsoId/:hospitalId/:rsoId', rsoController.deleteRsoByHospitalId)


//dummy router
export default router