import { Router } from "express";
const
    router = Router();
import RSOController from '../../../controllers/Admin/rso.controller.js'
import rsoController from "../../../controllers/Admin/rso.controller.js";
router.post('/add', RSOController.add)
router.get('/get-by-id/:id', RSOController.getById)
router.put('/update-by-id/:id', RSOController.updateById)
router.delete('/delete-by-id/:id', RSOController.deleteById)
router.get('/all', RSOController.getAll)


router.post('/create-rso-by-client/:clientId', rsoController.creatersoByClientId)
router.get('/get-allRso-by-client/:id', rsoController.getAllrsoByClientId)
router.delete('/delete-rso-by-id/:clientId/:rsoId', rsoController.deletersoByClientId)
router.put('/update-rso-by-client/:clientId/:rsoId', rsoController.updatersoByClientId)
router.get('/get-rso-by-clienId-and-rsoId/:clientId/:rsoId', rsoController.getrsoByClientIdAndRsoId)

export default router