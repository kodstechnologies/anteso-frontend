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

// Use PATCH since you're partially updating
router.patch("/update-employee/:orderId/:serviceId/:employeeId/:status", orderController.updateEmployeeStatus)
router.get('/get-qa-raw/:orderId', orderController.getQARawByOrderId)
// router.patch('/this-is-dummy-route',orderController.updateEmployeeStatus)
router.put('/update-complete-status/:orderId/:employeeId', orderController.updateCompletedStatus)
//mobile
router.get('/all-technician-orders/:technicianId', orderController.getAllOrdersForTechnician);
router.get('/start-order/:employeeId/:orderId', orderController.startOrder);
router.get('/srf-details/:technicianId/:orderId', orderController.getSRFDetails)
// router.patch('/update-machien-details/:technicianId/:orderId')

//mobile
router.patch('/update-services/:technicianId/:orderId',orderController.updateOrderServicesByTechnician)

export default router