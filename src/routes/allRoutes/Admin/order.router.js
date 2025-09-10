import { Router } from "express";
import orderController from "../../../controllers/Admin/order.controller.js";
import upload from "../../../middlewares/upload.js";
const router = Router();
router.get('/get-all', orderController.getAllOrders)
router.get('/basic-details-by-orderId/:orderId', orderController.getBasicDetailsByOrderId)
router.get('/additional-services/:orderId', orderController.getAdditionalServicesByOrderId)
router.get('/service-details-of-orders/:orderId', orderController.getAllServicesByOrderId)
// router.get('/get-all-services-by-id/:id',orderController.getServicesByDetails)
router.get('/machine-details/:orderId', orderController.getMachineDetailsByOrderId)

//not this
// router.patch(
//     "/update-order-details/:orderId/:technicianId",
//     orderController.updateOrderDetails
// );
// PATCH  partially updating
//web
router.patch("/update-employee/:orderId/:serviceId/:employeeId/:status", orderController.updateEmployeeStatus)
router.get('/get-qa-raw/:orderId', orderController.getQARawByOrderId)
// router.patch('/this-is-dummy-route',orderController.updateEmployeeStatus)
// router.put('/update-complete-status/:orderId/:employeeId', orderController.updateCompletedStatus)
//mobile
router.get('/all-technician-orders/:technicianId', orderController.getAllOrdersForTechnician);
router.get('/start-order/:employeeId/:orderId', orderController.startOrder);
//mobile-1
router.get('/srf-details/:technicianId/:orderId', orderController.getSRFDetails)
//mobile-2
router.get('/get-machine-details-for-technician/:technicianId/:orderId/:serviceId', orderController.getMachineDetails)
//mobile-3
router.patch(
    '/update-machine-details-by-technician/:technicianId/:orderId/:serviceId/:machineType/:workType',
    upload.fields([
        { name: 'uploadFile', maxCount: 1 },  // single file
        { name: 'viewFile', maxCount: 10 }    // multiple files
    ]),
    orderController.updateServiceWorkType
);

//for mobile--prev created
// router.patch('/update-services/:technicianId/:orderId', orderController.updateOrderServicesByTechnician)
//web
// router.get('/get-updated-order-services/:technicianId/:orderId/:serviceId', orderController.getUpdatedOrderServices)
router.get('/get/:technicianId/:orderId/:serviceId/:workType', orderController.getUpdatedOrderServices2)
//web-get the updated services buy technician
// router.get()
//routes for qa raw-- assigning to technician
router.put('/assign-to-technician/:orderId/:serviceId/:technicianId/:workType', orderController.assignTechnicianByQARaw)
router.put('/assign-to-office-staff/:orderId/:serviceId/:officeStaffId/:workType/:status', orderController.assignOfficeStaffByQATest)
// router.get('/get-qa-details/:orderId/:serviceId/:technicianId',orderController.getQaDetails)

// params: technicianId, orderId, serviceId, status, optional remark
router.post(
    "/completed-status-report/:technicianId/:orderId/:serviceId/:workType/:status",
    upload.single("file"), // "file" must match your input namer
    orderController.completedStatusAndReport
);

router.get('/get-qa-details/:orderId/:serviceId/:technicianId', orderController.getQaDetails)
router.get('/get-all-office-staff', orderController.getAllOfficeStaff)
router.get('/get-assigned-technician/:orderId/:serviceId/:workType', orderController.getAssignedTechnicianName)
router.get('/get-assigned-staff/:orderId/:serviceId/:workType', orderController.geAssignedtofficeStaffName)
router.post('/create-order', orderController.createOrder)
router.put('/update-additional-service/:id',orderController.updateAdditionalService)
// router.get('/',)
// router.post('/status-paid')

router.put('/edit-documents',orderController.editDocuments)

export default router