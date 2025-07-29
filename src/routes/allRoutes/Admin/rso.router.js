import { Router } from "express";
const router = Router();
import RSOController from '../../../controllers/Admin/rso.controller.js'
// router.post('/add', RSOController.add)
// router.get('/get-by-id/:id', RSOController.getById)
// router.put('/update-by-id/:id', RSOController.updateById)
// router.delete('/delete-by-id/:id', RSOController.deleteById)
// router.get('/all', RSOController.getAll)

//rso by client
router.post('/create-rso-by-client/:clientId', RSOController.creatersoByClientId)
router.get('/get-allRso-by-client/:id', RSOController.getAllrsoByClientId)
router.delete('/delete-rso-by-id/:clientId/:rsoId', RSOController.deletersoByClientId)
router.put('/update-rso-by-client/:clientId/:rsoId', RSOController.updatersoByClientId)
router.get('/get-rso-by-clienId-and-rsoId/:clientId/:rsoId', RSOController.getrsoByClientIdAndRsoId)

export default router