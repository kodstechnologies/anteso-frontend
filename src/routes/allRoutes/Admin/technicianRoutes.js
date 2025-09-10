import { Router } from "express";
import technicianController from "../../../controllers/Admin/technician.controller.js";
import upload from "../../../middlewares/upload.js";
const router = Router();
router.post('/add', technicianController.add)
router.get('/get-by-id/:id', technicianController.getById)
router.get('/get-all', technicianController.getAll)
router.get('/all-employees', technicianController.getAllEmployees)
router.put('/update-by-id/:id', technicianController.updateById)
router.delete('/delete-by-id/:id', technicianController.deleteById)
router.get('/unassigned-tools', technicianController.getUnassignedTools)
router.get('/assigned-tools-for-technician/:technicianId', technicianController.assignedToolByTechnicianId)
// router.get('/all-engineers', technicianController.getAllEngineers)
router.get('/all-officeStaff', technicianController.getAllOfficeStaff)
//mobile api
router.post('/create-trip-by-techinician/:technicianId', technicianController.createTripByTechnicianId)
router.patch('/update-trip-by-technician-tripId/:technicianId/:tripId', technicianController.updateTripByTechnicianIdAndTripId)
// router.get('/get-all-trips/:technicianId', technicianController.getAllTripsByTechnician)
router.post(
    "/add-trip-expense/:tripId/:technicianId",
    upload.single("screenshot"),
    technicianController.addTripExpense
);
//mobile
// router.post('/machine-details/:technicianId/:orderId',technicianController.machineDetails)

router.get('/get-trips-per-technician/:technicianId', technicianController.getTripsWithExpensesByTechnician)

router.get('/get-trip-expenses/:technicianId/:tripId/:expenseId',technicianController.getTripExpenseByTechnicianTripExpenseId)

router.get('/get-transaction-logs/:technicianId/:tripId', technicianController.getTransactionLogs)

router.get('/get-trip/:technicianId/:tripId',technicianController.getTripByTechnicianAndTrip)
export default router