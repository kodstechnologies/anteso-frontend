import mongoose from "mongoose";
import orderModel from "../../models/order.model.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Services from "../../models/Services.js";
import User from "../../models/user.model.js";
import { generateULRReportNumber, generateQATestReportNumber, incrementSequence } from "../../utils/ReportNumberGenerator.js";

const getAllOrders = asyncHandler(async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ createdAt: -1 });
        console.log("🚀 ~ orders:", orders)

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No orders found" });
        }

        res.status(200).json({
            message: "Orders fetched successfully",
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error("Error in getAllOrders:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
const getBasicDetailsByOrderId = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log("🚀 ~ orderId:", orderId)

        // Validate orderId
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid or missing order ID." });
        }

        // Fetch order with only basic details needed
        const order = await orderModel.findById(orderId).select(
            'srfNumber leadOwner hospitalName fullAddress city district state pinCode branchName contactPersonName emailAddress contactNumber designation'
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({
            message: 'Order basic details fetched successfully',
            data: order
        });

    } catch (error) {
        console.error("Error in getBasicDetailsByOrderId:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});
const getAdditionalServicesByOrderId = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' });
        }

        const order = await orderModel.findById(orderId).select('additionalServices specialInstructions');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({
            additionalServices: order.additionalServices || {},
            specialInstructions: order.specialInstructions || ''
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Something went wrong' });
    }
});
const getAllServicesByOrderId = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.params;

        // Validate orderId
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        // Fetch only the services field of the order
        const order = await orderModel.findById(orderId).select('services');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json({ services: order.services });
    } catch (error) {
        console.error('Error fetching services:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// const getServicesByDetails = asyncHandler(async (req, res) => {
//     try {
//     } catch (error) {
//     }
// }) 

const getMachineDetailsByOrderId = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await orderModel.findById(orderId).populate("services");

        if (!order) {
            throw new ApiError(404, "Order not found");
        }
        console.log(JSON.stringify(order.services, null, 2));

        console.log("🚀 ~ order.services:", order.services)
        return res
            .status(200)
            .json(new ApiResponse(200, order.services, "Machine details fetched"));
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(error);
        }
        return res
            .status(500)
            .json(new ApiError(500, "Internal Server Error", [], error.stack));
    }
});

//web
const getQARawByOrderId = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.params;

        // Fetch the order and populate nested fields
        const order = await orderModel.findById(orderId)
            .populate({
                path: 'services',
                populate: {
                    path: 'workTypeDetails.employee',
                    model: 'Employee',
                    select: 'name'
                }
            });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        // Extract info from services with QA Raw
        const qaRawDetails = [];

        order.services.forEach(service => {
            service.workTypeDetails.forEach(work => {
                // if (work.serviceName === 'QA Raw') {
                qaRawDetails.push({
                    machineType: service.machineType,
                    machineModel: service.machineModel,
                    serialNumber: service.serialNumber,
                    rawFile: work.uploadFile,
                    rawPhoto: work.viewFile,
                    remark: work.remark,
                    employeeName: work.employee?.name || 'Not Assigned',
                    status: work.status,
                    workType: work.workType
                });
                // }
            });
        });

        return res.status(200).json({
            srfNumber: order.srfNumber,
            hospitalName: order.hospitalName,
            qaRawDetails
        });

    } catch (error) {
        console.error("Error in getQARawByOrderId:", error);
        return res.status(500).json({ message: 'Server Error' });
    }
});

//web app
const updateEmployeeStatus = asyncHandler(async (req, res) => {
    const { orderId, serviceId, employeeId, status } = req.params;

    if (!orderId || !serviceId || !employeeId) {
        return res.status(400).json({ message: "Missing required params" });
    }


    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== "Employee") {
        return res.status(404).json({ message: "Invalid employee" });
    }
    // 2. Find the order and validate it
    const order = await orderModel.findById(orderId).populate("services");
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    // 3. Find the service and update it
    const serviceToUpdate = await Services.findById(serviceId);
    if (!serviceToUpdate) {
        return res.status(404).json({ message: "Service not found" });
    }
    // 4. Assign employee to each workTypeDetails item
    serviceToUpdate.workTypeDetails.forEach((work) => {
        work.employee = employeeId;
        if (status) {
            work.status = status;
        }
    });
    await serviceToUpdate.save();
    res.status(200).json({
        message: "Service employee updated successfully",
        service: serviceToUpdate,
    });
});

//mobile--My orders
// const getAllInProgressOrders = asyncHandler(async (req, res) => {
//     const { technicianId, orderId, serviceId } = req.params;

//     if (!technicianId || !orderId || !serviceId) {
//         return res.status(400).json({ message: 'Technician ID, Order ID, and Service ID are required' });
//     }
//     const service = await Services.findById(serviceId);
//     if (!service) {
//         return res.status(404).json({ message: 'Service not found' });
//     }
//     const hasInProgressWork = service.workTypeDetails.some(
//         (work) =>
//             work.employee?.toString() === technicianId &&
//             work.status === 'inprogress'
//     );
//     if (!hasInProgressWork) {
//         return res.status(400).json({ message: 'No in-progress work found for this technician in the given service' });
//     }
//     // Step 2: Find all services with inprogress work for the technician
//     const servicesWithInProgress = await Services.find({
//         workTypeDetails: {
//             $elemMatch: {
//                 employee: new mongoose.Types.ObjectId(technicianId),
//                 status: 'inprogress',
//             },
//         },
//     });
//     const serviceIds = servicesWithInProgress.map((s) => s._id);
//     // Step 3: Find orders containing those services
//     const orders = await orderModel.find({
//         services: { $in: serviceIds },
//     })
//         .populate({
//             path: 'services',
//             populate: {
//                 path: 'workTypeDetails.employee',
//                 model: 'Employee',
//             },
//         })
//         .populate('customer', 'name email')
//         .sort({ createdAt: -1 });
//     res.status(200).json({
//         message: 'In-progress orders fetched successfully',
//         count: orders.length,
//         orders,
//     });
// });

//mobile--get the order by customerId orderId and status--if status is inprogress then only show that order details
const startOrder = asyncHandler(async (req, res) => {
    const { employeeId, orderId } = req.params;
    console.log("🚀 ~ orderId:", orderId)
    console.log("🚀 ~ employeeId:", employeeId)

    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ message: 'Invalid orderId or employeeId' });
    }

    // Step 1: Find the order with status 'in progress'
    const order = await orderModel.findOne({
        _id: orderId,
        // status: 'assigned'
    }).populate({
        path: 'services',
        model: 'Service'
    });
    console.log("🚀 ~ order:", order)
    if (!order) {
        return res.status(404).json({ message: 'Order not found ' });
    }

    // Step 2: Check if any service has workTypeDetails assigned to the given employeeId
    const hasEmployeeAssigned = order.services.some(service =>
        service.workTypeDetails.some(work =>
            work.employee?.toString() === employeeId
        )
    );
    console.log("🚀 ~ employeeId:", employeeId)

    if (!hasEmployeeAssigned) {
        return res.status(403).json({ message: 'Employee is not assigned to this order' });
    }
    // Step 3: Return order
    res.status(200).json(order);
});

//mobile api
const updateOrderDetails = asyncHandler(async (req, res) => {
    const { orderId, technicianId } = req.params;
    const { machineUpdates: submittedData } = req.body;

    try {
        // Step 1: Fetch the order with services and customer
        const order = await orderModel.findById(orderId)
            .populate('customer')
            .populate({
                path: 'services',
                model: 'Service'
            });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Step 2: Verify technician is assigned
        const isTechnicianAssigned = order.services.some(service =>
            service.workTypeDetails.some(work =>
                work.employee?.toString() === technicianId
            )
        );
        if (!isTechnicianAssigned) {
            return res.status(403).json({ message: 'Technician is not assigned to this order' });
        }
        // Step 3: General Info
        const generalInfo = {
            srfNumber: order.srfNumber,
            customerName: order.customer.name,
            contactNumber: order.contactNumber,
            procNoOrPoNo: order.procNoOrPoNo,
            procExpiryDate: order.procExpiryDate,
            quotationpdf: order.workOrderCopy
        };

        // Step 4: Apply updates to all services assigned to this technician
        if (Array.isArray(submittedData)) {
            for (const updateItem of submittedData) {
                const {
                    machineType,
                    machineModel,
                    serialNumber,
                    remark,
                    rawFile,
                    rawPhoto
                } = updateItem;

                const matchedServices = order.services.filter(
                    service => service.machineType === machineType &&
                        service.workTypeDetails.some(
                            work => work.employee?.toString() === technicianId
                        )
                );

                for (const service of matchedServices) {
                    // Update service-level fields
                    if (machineModel) service.machineModel = machineModel;
                    if (serialNumber) service.serialNumber = serialNumber;
                    if (remark) service.remark = remark;

                    // Update workTypeDetails for the technician
                    service.workTypeDetails.forEach(work => {
                        if (work.employee?.toString() === technicianId) {
                            if (remark) work.remark = remark;
                            if (rawFile) work.uploadFile = rawFile;
                            if (rawPhoto) work.viewFile = rawPhoto;
                        }
                    });
                    await service.save();
                }
            }
        }
        // Step 5: Re-fetch updated data for response
        const updatedOrder = await orderModel.findById(orderId)
            .populate('customer')
            .populate('services');
        const serviceInfo = [];
        for (const service of updatedOrder.services) {
            service.workTypeDetails.forEach(work => {
                if (work.employee?.toString() === technicianId) {
                    serviceInfo.push({
                        serviceId: service._id,
                        machineType: service.machineType,
                        machineModel: service.machineModel,
                        serialNumber: service.serialNumber,
                        remark: work.remark,
                        rawFile: work.uploadFile,
                        rawPhoto: work.viewFile,
                        workType: work.workType,
                        status: work.status
                    });
                }
            });
        }
        return res.status(200).json({
            message: 'Updates saved (if any) and data fetched',
            generalInfo,
            serviceInfo
            // countOfServices:
        });

    } catch (error) {
        console.error("Error in updateOrderDetails:", error);
        return res.status(500).json({ message: 'Server Error' });
    }
});

const getSRFDetails = asyncHandler(async (req, res) => {
    const { technicianId, orderId } = req.params;

    try {
        const order = await orderModel.findById(orderId)
            .populate('customer')
            .populate('services');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if technician is assigned in any service
        const isTechnicianAssigned = order.services.some(service =>
            service.workTypeDetails.some(work =>
                work.employee?.toString() === technicianId
            )
        );

        if (!isTechnicianAssigned) {
            return res.status(403).json({ message: 'Technician is not assigned to this order' });
        }

        const srfDetails = {
            srfNumber: order.srfNumber,
            customerName: order.customer?.name || '',
            contactNumber: order.contactNumber,
            procNoOrPoNo: order.procNoOrPoNo,
            procExpiryDate: order.procExpiryDate,
            quotationpdf: order.workOrderCopy
        };

        return res.status(200).json({ srfDetails });

    } catch (error) {
        console.error("Error in getSRFDetails:", error);
        return res.status(500).json({ message: 'Server Error' });
    }
});
const updateOrderServicesByTechnician = asyncHandler(async (req, res) => {
    const { technicianId, orderId } = req.params;
    console.log("🚀 ~ orderId:", orderId)
    console.log("🚀 ~ technicianId:", technicianId)
    const { serviceUpdates } = req.body; // [{ machineType, machineModel, serialNumber, remark, rawFile, rawPhoto }]

    try {
        const order = await orderModel.findById(orderId)
            .populate('services')
            .populate('customer');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const services = order.services;

        // Step 1: Verify technician is assigned
        const isTechnicianAssigned = services.some(service =>
            service.workTypeDetails.some(work =>
                work.employee?.toString() === technicianId
            )
        );
        if (!isTechnicianAssigned) {
            return res.status(403).json({ message: 'Technician not assigned to any service in this order' });
        }

        // Step 2: Apply updates
        for (const update of serviceUpdates) {
            const {
                machineType,
                machineModel,
                serialNumber,
                remark,
                rawFile,
                rawPhoto
            } = update;

            const matchingService = services.find(
                service =>
                    service.machineType === machineType &&
                    service.workTypeDetails.some(work => work.employee?.toString() === technicianId)
            );
            console.log("🚀 ~ matchingService:", matchingService)

            if (matchingService) {
                // Update machine-level fields
                if (machineModel) matchingService.machineModel = machineModel;
                if (serialNumber) matchingService.serialNumber = serialNumber;
                if (remark) matchingService.remark = remark;

                // Update workTypeDetails for technician
                matchingService.workTypeDetails.forEach(work => {
                    if (work.employee?.toString() === technicianId) {
                        if (remark) work.remark = remark;
                        if (rawFile) work.uploadFile = rawFile;
                        if (rawPhoto) work.viewFile = rawPhoto;
                        if (work.status === 'pending' || work.status === 'inprogress') {
                            work.status = 'completed';
                        }
                    }
                });
                await matchingService.save();
            }
        }
        // Step 3: Update order status
        const allWorks = services.flatMap(service => service.workTypeDetails);
        console.log("🚀 ~ allWorks:", allWorks)
        const allCompleted = allWorks.every(work => work.status === 'completed');
        console.log("🚀 ~ allCompleted:", allCompleted)
        const completedCount = allWorks.filter(w => w.status === 'completed').length;
        console.log("Completed:", completedCount, "of", allWorks.length);

        order.status = allCompleted ? 'completed' : 'in progress';
        await order.save();

        return res.status(200).json({
            message: 'Service updates saved',
            orderStatus: order.status
        });
    } catch (error) {
        console.error('Error in updateOrderServicesByTechnician:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
const getAllOrdersForTechnician = asyncHandler(async (req, res) => {
    const { technicianId } = req.params;

    if (!technicianId) {
        return res.status(400).json({ message: 'Technician ID is required' });
    }

    // Step 1: Find all services where this technician is assigned (regardless of status)
    const servicesWithTechnician = await Services.find({
        workTypeDetails: {
            $elemMatch: {
                employee: new mongoose.Types.ObjectId(technicianId),
            },
        },
    });

    const serviceIds = servicesWithTechnician.map((s) => s._id);

    if (serviceIds.length === 0) {
        return res.status(404).json({ message: 'No services found for this technician' });
    }

    // Step 2: Find orders that contain those services
    const orders = await orderModel.find({
        services: { $in: serviceIds },
    })
        .populate({
            path: 'services',
            populate: {
                path: 'workTypeDetails.employee',
                model: 'Employee',
            },
        })
        .populate('customer', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: 'Orders fetched successfully',
        count: orders.length,
        orders,
    });
});

const updateCompletedStatus = asyncHandler(async (req, res) => {
    const { orderId, employeeId } = req.params;
    if (!orderId || !employeeId) {
        return res.status(400).json({ message: 'Order ID and Employee ID are required' });
    }
    const order = await orderModel.findById(orderId);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    // Loop through services or assigned employees to update status
    let updated = false;
    for (const service of order.services || []) {
        // if (service.assignedTo?.toString() === employeeId.toString()) {
        service.status = 'Completed';
        service.workTypeStatus = 'Completed';
        // Generate and assign report numbers
        service.tcReportNumber = generateULRReportNumber();
        service.qaTestReportNumber = generateQATestReportNumber();
        order.status = 'completed';
        order.reportULRNumber = generateULRReportNumber();
        order.qaTestReportNumber = generateQATestReportNumber();
        // Increment sequence after generating
        incrementSequence();
        await order.save();
        console.log("🚀 ~ order:", order)
        updated = true;
        // }
    }
    if (!updated) {
        return res.status(400).json({ message: 'No matching employee assignment found in order' });
    }
    await order.save();
    res.status(200).json({
        message: 'Status updated and report numbers generated successfully',
        reportULRNumber: order.reportULRNumber,
        qaTestReportNumber: order.qaTestReportNumber
    });
});

export default { getAllOrders, getBasicDetailsByOrderId, getAdditionalServicesByOrderId, getAllServicesByOrderId, getMachineDetailsByOrderId, updateOrderDetails, updateEmployeeStatus, getQARawByOrderId, updateCompletedStatus, getAllOrdersForTechnician, startOrder, getSRFDetails, updateOrderServicesByTechnician }