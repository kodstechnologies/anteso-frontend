import { Router } from "express";
import orderController from "../../../controllers/Admin/order.controller.js";
const router = Router();
router.get('/get-all', orderController.getAllOrders)
router.get('/basic-details-by-orderId/:orderId', orderController.getBasicDetailsByOrderId)
router.get('/additional-services/:orderId', orderController.getAdditionalServicesByOrderId)
router.get('/service-details-of-orders/:orderId', orderController.getAllServicesByOrderId)
// router.get('/get-all-services-by-id/:id',orderController.getServicesByDetails)
router.get('/machine-details/:orderId', orderController.getMachineDetailsByOrderId)
router.patch(
    "/update-order-details/:orderId/:technicianId",
    orderController.updateOrderDetails
);
// PATCH  partially updating
//web
router.patch("/update-employee/:orderId/:serviceId/:employeeId/:status", orderController.updateEmployeeStatus)
router.get('/get-qa-raw/:orderId', orderController.getQARawByOrderId)
// router.patch('/this-is-dummy-route',orderController.updateEmployeeStatus)
router.put('/update-complete-status/:orderId/:employeeId', orderController.updateCompletedStatus)
//mobile
router.get('/all-technician-orders/:technicianId', orderController.getAllOrdersForTechnician);
router.get('/start-order/:employeeId/:orderId', orderController.startOrder);
//mobile
router.get('/srf-details/:technicianId/:orderId', orderController.getSRFDetails)
//mobile
router.patch('/update-services/:technicianId/:orderId', orderController.updateOrderServicesByTechnician)
//web
// router.get('/get-updated-order-services/:technicianId/:orderId/:serviceId', orderController.getUpdatedOrderServices)
router.get('/get/:technicianId/:orderId/:serviceId/:workType', orderController.getUpdatedOrderServices2)
//web-get the updated services buy technician
// router.get()
//routes for qa raw-- assigning to technician
router.put('/assign-to-technician/:orderId/:serviceId/:technicianId', orderController.assignTechnicianByQARaw)
router.put('/assign-to-office-staff/:orderId/:serviceId/:officeStaffId', orderController.assignOfficeStaffByQATest)
// router.get('/get-qa-details/:orderId/:serviceId/:technicianId',orderController.getQaDetails)
router.get('/get-qa-details/:orderId/:serviceId/:technicianId', orderController.getQaDetails)
router.get('/get-all-office-staff', orderController.getAllOfficeStaff)
router.get('/get-assigned-technician/:orderId/:serviceId/:workType', orderController.getAssignedTechnicianName)
router.get('/get-assigned-staff/:orderId/:serviceId/:workType', orderController.geAssignedtofficeStaffName)

router.post('/create-order', orderController.createOrder)
// router.get('/',)

export default router