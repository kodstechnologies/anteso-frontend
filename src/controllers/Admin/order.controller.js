import mongoose from "mongoose";
import orderModel from "../../models/order.model.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Services from "../../models/Services.js";
import User from "../../models/user.model.js";
import { generateULRReportNumber, generateQATestReportNumber, incrementSequence } from "../../utils/ReportNumberGenerator.js";
import Employee from "../../models/technician.model.js";
import Client from "../../models/client.model.js";
import Hospital from "../../models/hospital.model.js";
import { uploadToS3 } from "../../utils/s3Upload.js";
import Payment from "../../models/payment.model.js";
import { getFileUrl, getMultipleFileUrls } from "../../utils/s3Fetch.js";
import AdditionalService from "../../models/additionalService.model.js";
import QATest from "../../models/QATest.model.js";
import Elora from "../../models/elora.model.js";

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

        // ✅ Populate only name & description from AdditionalService
        const order = await orderModel
            .findById(orderId)
            .populate('additionalServices', 'name description remark status') // 👈 only these fields
            .select('additionalServices specialInstructions');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({
            additionalServices: order.additionalServices || [],
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
        const order = await orderModel
            .findById(orderId)
            .select('services')
            .populate({
                path: 'services',
                populate: [
                    {
                        path: 'workTypeDetails.engineer',
                        model: 'Employee',
                    },
                    {
                        path: 'workTypeDetails.officeStaff',
                        model: 'Employee',
                    }
                ]
            });

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


//changed after model change
const getMachineDetailsByOrderId = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await orderModel.findById(orderId)
            .populate({
                path: "services",
                // populate: [
                //     { path: "workTypeDetails.engineer", model: "Employee" },
                //     { path: "workTypeDetails.officeStaff", model: "Employee" }
                // ]
            });

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


const getQARawByOrderId = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.params;

        // Fetch the order and populate both engineer & office staff fields
        const order = await orderModel.findById(orderId)
            .populate({
                path: 'services',
                populate: [
                    {
                        path: 'workTypeDetails.engineer',
                        model: 'Employee',
                        select: 'name'
                    },
                    {
                        path: 'workTypeDetails.officeStaff',
                        model: 'Employee',
                        select: 'name'
                    }
                ]
            });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Extract info from services
        const qaRawDetails = [];

        order.services.forEach(service => {
            service.workTypeDetails.forEach(work => {
                qaRawDetails.push({
                    machineType: service.machineType,
                    machineModel: service.machineModel,
                    serialNumber: service.serialNumber,
                    rawFile: work.uploadFile,
                    rawPhoto: work.viewFile,
                    remark: work.remark,
                    engineerName: work.engineer?.name || 'Not Assigned',
                    officeStaffName: work.officeStaff?.name || 'Not Assigned',
                    status: work.status,
                    workType: work.workType
                });
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
//for qa test--change this after chnaging the model
const updateEmployeeStatus = asyncHandler(async (req, res) => {
    const { orderId, serviceId, employeeId, status } = req.params;
    console.log("🚀 ~ employeeId:", employeeId)

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


//mobile api
const getMachineDetails = asyncHandler(async (req, res) => {
    const { technicianId, orderId, serviceId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(orderId) ||
        !mongoose.Types.ObjectId.isValid(serviceId) ||
        !mongoose.Types.ObjectId.isValid(technicianId)) {
        return res.status(400).json({ message: "Invalid IDs provided" });
    }

    try {
        // Fetch order and populate services
        const order = await orderModel.findById(orderId).populate('services');
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Find the specific service
        const service = order.services.find(s => s._id.toString() === serviceId);
        if (!service) return res.status(404).json({ message: "Service not found in this order" });

        // Filter workTypeDetails assigned to this technician
        const result = service.workTypeDetails
            .filter(work => work.engineer?.toString() === technicianId)
            .map(work => ({
                machineType: service.machineType,
                workType: work.workType,
                status: work.status
            }));

        return res.status(200).json(result);

    } catch (error) {
        console.error("Error fetching machine details:", error);
        return res.status(500).json({ message: "Server error" });
    }
});
//mobile
// PATCH /api/orders/:orderId/services/:serviceId/worktypes
//use this for mobile


// PATCH /api/orders/:orderId/services/:serviceId/worktypes/:technicianId
// const updateServiceWorkType = asyncHandler(async (req, res) => {
//     const { orderId, serviceId, technicianId, machineType, workType } = req.params;
//     const { machineModel, serialNumber, uploadFile, viewFile, remark } = req.body;

//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(orderId) ||
//         !mongoose.Types.ObjectId.isValid(serviceId) ||
//         !mongoose.Types.ObjectId.isValid(technicianId)) {
//         return res.status(400).json({ message: "Invalid IDs" });
//     }

//     // Step 1: Find order and ensure the service belongs to it
//     const order = await orderModel.findById(orderId).populate('services');
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     // Step 2: Find the service by machineType
//     const service = order.services.find(s => s.machineType === machineType && s._id.equals(serviceId));
//     if (!service) return res.status(404).json({ message: "Service not found in this order" });

//     // Step 3: Update machineModel and serialNumber if provided
//     if (machineModel) service.machineModel = machineModel;
//     if (serialNumber) service.serialNumber = serialNumber;

//     // Step 4: Find workTypeDetail by workType and technician
//     const workTypeDetail = service.workTypeDetails.find(wt =>
//         wt.workType === workType &&
//         ((wt.engineer && wt.engineer.toString() === technicianId) ||
//             (wt.officeStaff && wt.officeStaff.toString() === technicianId))
//     );

//     if (!workTypeDetail) {
//         return res.status(404).json({ message: "WorkTypeDetail not found for this technician" });
//     }

//     // Step 5: Update optional fields from req.body
//     if (uploadFile !== undefined) workTypeDetail.uploadFile = uploadFile;
//     if (viewFile !== undefined) workTypeDetail.viewFile = viewFile;
//     if (remark !== undefined) workTypeDetail.remark = remark;

//     // Step 6: Save the updated service
//     await service.save();

//     res.status(200).json({
//         success: true,
//         message: "Service workType updated successfully",
//         service
//     });
// });


// const updateServiceWorkType = asyncHandler(async (req, res) => {
//     const { orderId, serviceId, technicianId, machineType, workType } = req.params;
//     const { machineModel, serialNumber, remark } = req.body;
//     console.log("🚀 ~ remark:", remark)

//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(orderId) ||
//         !mongoose.Types.ObjectId.isValid(serviceId) ||
//         !mongoose.Types.ObjectId.isValid(technicianId)) {
//         return res.status(400).json({ message: "Invalid IDs" });
//     }

//     const order = await orderModel.findById(orderId).populate('services');
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     const service = order.services.find(s => s.machineType === machineType && s._id.equals(serviceId));
//     if (!service) return res.status(404).json({ message: "Service not found in this order" });

//     if (machineModel) service.machineModel = machineModel;
//     if (serialNumber) service.serialNumber = serialNumber;

//     const workTypeDetail = service.workTypeDetails.find(wt =>
//         wt.workType === workType &&
//         ((wt.engineer && wt.engineer.toString() === technicianId) ||
//             (wt.officeStaff && wt.officeStaff.toString() === technicianId))
//     );

//     if (!workTypeDetail) {
//         return res.status(404).json({ message: "WorkTypeDetail not found for this technician" });
//     }

//     // Handle file uploads
//     if (req.files) {
//         // Single uploadFile
//         if (req.files.uploadFile && req.files.uploadFile[0]) {
//             const uploaded = await uploadToS3(req.files.uploadFile[0]);
//             workTypeDetail.uploadFile = uploaded.url;
//         }

//         // Multiple viewFiles
//         if (req.files.viewFile && req.files.viewFile.length > 0) {
//             const urls = [];
//             for (let file of req.files.viewFile) {
//                 const uploaded = await uploadToS3(file);
//                 urls.push(uploaded.url);
//             }
//             workTypeDetail.viewFile = urls; // store array of URLs
//         }
//     }

//     // Update remark if present
//     // Update remark if present
//     if (remark !== undefined) {
//         service.remark = remark;
//     }

//     // Save service after all changes
//     await service.save();

//     res.status(200).json({
//         success: true,
//         message: "Service workType updated successfully",
//         service
//     });

// });


const updateServiceWorkType = asyncHandler(async (req, res) => {
    const { orderId, serviceId, technicianId, machineType, workType } = req.params;
    const { machineModel, serialNumber, remark } = req.body;

    // ✅ Validate IDs
    if (
        !mongoose.Types.ObjectId.isValid(orderId) ||
        !mongoose.Types.ObjectId.isValid(serviceId) ||
        !mongoose.Types.ObjectId.isValid(technicianId)
    ) {
        return res.status(400).json({ message: "Invalid IDs" });
    }

    // ✅ Find order
    const order = await orderModel.findById(orderId).populate("services");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ✅ Find service
    const service = order.services.find(
        (s) => s.machineType === machineType && s._id.equals(serviceId)
    );
    if (!service) return res.status(404).json({ message: "Service not found in this order" });

    // ✅ Update service fields
    if (machineModel) service.machineModel = machineModel;
    if (serialNumber) service.serialNumber = serialNumber;
    if (remark !== undefined) service.remark = remark;

    // ✅ Find workTypeDetail for this technician
    const workTypeDetail = service.workTypeDetails.find(
        (wt) =>
            wt.workType === workType &&
            ((wt.engineer && wt.engineer.toString() === technicianId) ||
                (wt.officeStaff && wt.officeStaff.toString() === technicianId))
    );

    if (!workTypeDetail) {
        return res
            .status(404)
            .json({ message: "WorkTypeDetail not found for this technician" });
    }

    // ✅ Handle file uploads
    if (req.files) {
        if (req.files.uploadFile && req.files.uploadFile[0]) {
            const uploaded = await uploadToS3(req.files.uploadFile[0]);
            workTypeDetail.uploadFile = uploaded.url;
        }

        if (req.files.viewFile && req.files.viewFile.length > 0) {
            const urls = [];
            for (let file of req.files.viewFile) {
                const uploaded = await uploadToS3(file);
                urls.push(uploaded.url);
            }
            workTypeDetail.viewFile = urls;
        }
    }

    // ✅ Always create/update QA Test entry
    const qaTest = new QATest({
        officeStaff: technicianId,
        reportULRNumber: generateULRReportNumber(),
        qaTestReportNumber: generateQATestReportNumber(),
    });
    await qaTest.save();
    workTypeDetail.QAtest = qaTest._id;
    incrementSequence();

    // ✅ Always create/update Elora entry
    const elora = new Elora({
        officeStaff: technicianId,
        reportULRNumber: generateULRReportNumber(),
        qaTestReportNumber: generateQATestReportNumber(),
    });
    await elora.save();
    workTypeDetail.elora = elora._id;
    incrementSequence();

    // ✅ Save service
    await service.save();

    res.status(200).json({
        success: true,
        message: "Service workType updated successfully",
        service,
    });
});

const getReportNumbers = asyncHandler(async (req, res) => {
    try {
        const { orderId, serviceId, technicianId, workType } = req.params;

        // ✅ Validate IDs
        if (
            !mongoose.Types.ObjectId.isValid(orderId) ||
            !mongoose.Types.ObjectId.isValid(serviceId) ||
            !mongoose.Types.ObjectId.isValid(technicianId)
        ) {
            return res.status(400).json({ message: "Invalid IDs" });
        }

        // ✅ Find order and populate services
        const order = await orderModel.findById(orderId).populate({
            path: "services",
            populate: {
                path: "workTypeDetails.QAtest workTypeDetails.elora", // populate both
            },
        });

        if (!order) return res.status(404).json({ message: "Order not found" });

        // ✅ Find the service
        const service = order.services.find((s) => s._id.equals(serviceId));
        if (!service) return res.status(404).json({ message: "Service not found" });

        // ✅ Find workTypeDetail for technician
        const workTypeDetail = service.workTypeDetails.find(
            (wt) =>
                wt.workType === workType &&
                ((wt.engineer && wt.engineer.toString() === technicianId) ||
                    (wt.officeStaff && wt.officeStaff.toString() === technicianId))
        );

        if (!workTypeDetail) {
            return res.status(404).json({ message: "WorkTypeDetail not found" });
        }

        // ✅ Extract numbers
        let reportNumbers = {};

        if (workTypeDetail.QAtest) {
            reportNumbers.qaTest = {
                reportULRNumber: workTypeDetail.QAtest.reportULRNumber,
                qaTestReportNumber: workTypeDetail.QAtest.qaTestReportNumber,
            };
        }

        if (workTypeDetail.elora) {
            reportNumbers.elora = {
                reportULRNumber: workTypeDetail.elora.reportULRNumber,
                qaTestReportNumber: workTypeDetail.elora.qaTestReportNumber,
            };
        }

        res.status(200).json({
            success: true,
            reportNumbers,
        });
    } catch (error) {
        console.error("❌ getReportNumbers error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
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


//create order--by admin

const createOrder = asyncHandler(async (req, res) => {
    try {
        console.log("hi---📥 req body:", req.body);
        const {
            leadOwner, // userId from frontend
            hospitalName,
            fullAddress,
            city,
            district,
            state,
            pinCode,
            branchName,
            contactPersonName,
            emailAddress,
            contactNumber,
            designation,
            advanceAmount,
            workOrderCopy,
            partyCodeOrSysId,
            procNoOrPoNo,
            procExpiryDate,
            urgency,
            services,
            additionalServices, // will handle as references
            specialInstructions,
            courierDetails,
            reportULRNumber,
            qaTestReportNumber,
            rawFile,
            rawPhoto,
        } = req.body;

        // ✅ Validate required fields
        if (
            !leadOwner ||
            !hospitalName ||
            !fullAddress ||
            !city ||
            !district ||
            !state ||
            !pinCode ||
            !branchName ||
            !contactPersonName ||
            !emailAddress ||
            !contactNumber
        ) {
            throw new ApiError(400, "Missing required fields");
        }

        // ✅ Find lead owner user
        const leadOwnerUser = await User.findById(leadOwner).select("name role");
        if (!leadOwnerUser) {
            throw new ApiError(404, "Lead owner not found");
        }

        // ✅ Step 1: Find or create client by phone
        let client = await Client.findOne({ phone: contactNumber });
        if (!client) {
            client = await Client.create({
                name: contactPersonName,
                phone: contactNumber,
                email: emailAddress,
                address: fullAddress,
                role: "Customer",
            });
        }

        // ✅ Step 2: Create hospital and link to client
        const hospital = await Hospital.create({
            name: hospitalName,
            email: emailAddress,
            address: fullAddress,
            branch: branchName,
            phone: contactNumber,
            city,
            district,
            state,
            pinCode,
        });

        if (!client.hospitals.includes(hospital._id)) {
            client.hospitals.push(hospital._id);
            await client.save();
        }

        // ✅ Step 3: Parse services (if stringified)
        let parsedServices = [];
        if (services) {
            if (typeof services === "string") {
                try {
                    parsedServices = JSON.parse(services);
                } catch (err) {
                    throw new ApiError(400, "Invalid services format, must be JSON array");
                }
            } else {
                parsedServices = services;
            }
        }

        // ✅ Step 4: Transform workType → workTypeDetails
        let transformedServices = parsedServices.map((s) => ({
            ...s,
            workTypeDetails: (s.workType || []).map((wt) => ({
                workType: wt,
                status: "pending",
            })),
        }));

        console.log("🚀 ~ transformedServices:", transformedServices);

        // ✅ Step 5: Save services to DB and map ObjectIds
        let serviceDocs = [];
        if (transformedServices.length > 0) {
            serviceDocs = await Services.insertMany(transformedServices);
            console.log("🚀 ~ serviceDocs:", serviceDocs);
        }

        // ✅ Step 6: Parse and upsert additionalServices
        let parsedAdditional = [];
        if (additionalServices) {
            if (typeof additionalServices === "string") {
                try {
                    parsedAdditional = JSON.parse(additionalServices);
                } catch (err) {
                    throw new ApiError(400, "Invalid additionalServices format, must be JSON array");
                }
            } else {
                parsedAdditional = additionalServices;
            }
        }

        // Expected format: [{ name: "INSTITUTE REGISTRATION", description: "", totalAmount: 1000 }]
        let additionalServiceDocs = [];
        if (Array.isArray(parsedAdditional) && parsedAdditional.length > 0) {
            additionalServiceDocs = await Promise.all(
                parsedAdditional.map(async (svc) => {
                    let existing = await AdditionalService.findOne({ name: svc.name });
                    if (!existing) {
                        existing = await AdditionalService.create({
                            name: svc.name,
                            description: svc.description || "",
                            totalAmount: svc.totalAmount || 0,
                        });
                    }
                    return existing._id;
                })
            );
        }

        // ✅ Step 7: Create order
        const order = await orderModel.create({
            leadOwner: leadOwnerUser.name, // store name instead of ID
            // leadOwner: leadOwnerUser._id,
            hospitalName,
            fullAddress,
            city,
            district,
            state,
            pinCode,
            branchName,
            contactPersonName,
            emailAddress,
            contactNumber,
            designation,
            advanceAmount,
            workOrderCopy,
            partyCodeOrSysId,
            procNoOrPoNo,
            procExpiryDate,
            customer: client._id,
            urgency,
            services: serviceDocs.map((s) => s._id),
            additionalServices: additionalServiceDocs, // ✅ only ObjectIds here
            specialInstructions,
            courierDetails,
            reportULRNumber,
            qaTestReportNumber,
            rawFile,
            rawPhoto,
        });

        console.log("🚀 ~ order:", order);

        return res
            .status(201)
            .json(new ApiResponse(201, order, "Order created successfully"));
    } catch (error) {
        console.error("❌ Error creating order:", error);
        throw new ApiError(500, "Failed to create order", [error.message]);
    }
});

//check this one also
//mobile--get the order by customerId orderId and status--if status is inprogress then only show that order details
const startOrder = asyncHandler(async (req, res) => {
    const { employeeId, orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ message: 'Invalid orderId or employeeId' });
    }

    // Step 1: Find the order
    const order = await orderModel.findOne({
        _id: orderId,
        // status: 'assigned' // uncomment if needed
    })
        .populate({
            path: 'services',
            model: 'Service'
        })
        .populate({
            path: 'customer',
            model: 'User',
            select: 'name email phone role' // only required fields
        });

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Step 2: Check if employee is assigned as engineer
    const isEngineerAssigned = order.services.some(service =>
        service.workTypeDetails.some(work =>
            work.engineer?.toString() === employeeId
        )
    );

    if (!isEngineerAssigned) {
        return res.status(403).json({ message: 'Engineer is not assigned to this order' });
    }

    // Step 3: Return order
    res.status(200).json(order);
});
//mobile api--previously created api -not using this one
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
//check in postman
const getSRFDetails = asyncHandler(async (req, res) => {
    const { technicianId, orderId } = req.params;

    try {
        const order = await orderModel.findById(orderId)
            .populate('customer')
            .populate('services');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // ✅ Check if this engineer is assigned in any service
        const isEngineerAssigned = order.services.some(service =>
            service.workTypeDetails.some(work =>
                work.engineer?.toString() === technicianId
            )
        );

        if (!isEngineerAssigned) {
            return res.status(403).json({ message: 'Engineer is not assigned to this order' });
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

//check--done
// const updateOrderServicesByTechnician = asyncHandler(async (req, res) => {
//     const { technicianId, orderId } = req.params;
//     console.log("🚀 ~ engineerId:", technicianId)
//     console.log("🚀 ~ req.params.orderId:", req.params.orderId);

//     const { serviceUpdates } = req.body; // [{ machineType, machineModel, serialNumber, remark, rawFile, rawPhoto }]
//     try {

//         if (!mongoose.Types.ObjectId.isValid(orderId)) {
//             return res.status(400).json({ message: "Invalid orderId" });
//         }

//         const order = await orderModel.findById(orderId).populate('services');
//         if (!order) {
//             console.log("Order not found in DB");
//             return res.status(404).json({ message: "Order not found" });
//         }
//         const services = order.services;
//         // ✅ Step 1: Verify engineer is assigned
//         const isEngineerAssigned = services.some(service =>
//             service.workTypeDetails.some(work =>
//                 work.engineer?.toString() === technicianId
//             )
//         );
//         if (!isEngineerAssigned) {
//             return res.status(403).json({ message: 'Engineer not assigned to any service in this order' });
//         }
//         // ✅ Step 2: Apply updates
//         for (const update of serviceUpdates) {
//             const {
//                 machineType,
//                 machineModel,
//                 serialNumber,
//                 remark,
//                 rawFile,
//                 rawPhoto
//             } = update;
//             const matchingService = services.find(
//                 service =>
//                     service.machineType === machineType &&
//                     service.workTypeDetails.some(work => work.engineer?.toString() === technicianId)
//             );
//             if (matchingService) {
//                 // Update machine-level fields
//                 if (machineModel) matchingService.machineModel = machineModel;
//                 if (serialNumber) matchingService.serialNumber = serialNumber;
//                 // if (remark) matchingService.remark = remark;

//                 // Update workTypeDetails for this engineer
//                 matchingService.workTypeDetails.forEach(work => {
//                     if (work.engineer?.toString() === technicianId) {
//                         if (remark) work.remark = remark;
//                         if (rawFile) work.uploadFile = rawFile;
//                         if (rawPhoto) work.viewFile = rawPhoto;
//                         if (['pending', 'inprogress'].includes(work.status)) {
//                             work.status = 'completed';
//                         }
//                     }
//                 });
//                 await matchingService.save();
//             }
//         }
//         await order.save();
//         return res.status(200).json({
//             message: 'Service updates saved successfully',
//             orderStatus: order.status
//         });
//     } catch (error) {
//         console.error('Error in updateOrderServicesByEngineer:', error);
//         return res.status(500).json({ message: 'Server error' });
//     }
// });

const getUpdatedOrderServices = asyncHandler(async (req, res) => {
    try {
        const { technicianId, orderId, serviceId, workType } = req.params;
        // 1️⃣ Find the order and populate its services
        const order = await orderModel.findById(orderId)
            .populate({
                path: 'services',
                match: { _id: serviceId }, // get only the specified service
                populate: {
                    path: 'workTypeDetails.engineer',
                    select: 'name'
                }
            });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (!order.services || order.services.length === 0) {
            return res.status(404).json({ message: 'Service not found in this order' });
        }
        const service = order.services[0];
        // 2️⃣ Filter workTypeDetails for the given technician
        const technicianWork = service.workTypeDetails.find(
            w => w.engineer?._id?.toString() === technicianId
        );
        if (!technicianWork) {
            return res.status(403).json({ message: 'Technician not assigned to this service' });
        }
        // 3️⃣ Build response with only the updated fields
        const updatedData = {
            machineType: service.machineType,
            machineModel: service.machineModel,
            serialNumber: service.serialNumber,
            remark: technicianWork.remark || null,
            rawFile: technicianWork.uploadFile || null,
            rawPhoto: technicianWork.viewFile || null
        };
        res.status(200).json({
            success: true,
            updatedService: updatedData
        });
    } catch (error) {
        console.error('Error fetching updated order service details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const getUpdatedOrderServices2 = asyncHandler(async (req, res) => {
    try {
        const { technicianId, orderId, serviceId, workType } = req.params;
        console.log("🚀 ~ workType:", workType)
        console.log("🚀 ~ serviceId:", serviceId)
        console.log("🚀 ~ orderId:", orderId)
        console.log("🚀 ~ technicianId:", technicianId)

        // 1️⃣ Find the order and populate its services
        const order = await orderModel.findById(orderId)
            .populate({
                path: 'services',
                match: { _id: serviceId },
                populate: {
                    path: 'workTypeDetails.engineer',
                    select: 'name'
                }
            });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!order.services || order.services.length === 0) {
            return res.status(404).json({ message: 'Service not found in this order' });
        }

        const service = order.services[0];

        // 2️⃣ Filter workTypeDetails for the given technician & work type
        const technicianWork = service.workTypeDetails.find(
            w =>
                w.engineer?._id?.toString() === technicianId &&
                w.workType?.toLowerCase() === workType.toLowerCase()
        );

        if (!technicianWork) {
            return res.status(403).json({ message: 'Technician not assigned to this work type in this service' });
        }

        // 3️⃣ Handle single or multiple files
        const rawFileUrl = Array.isArray(technicianWork.uploadFile)
            ? await getMultipleFileUrls(technicianWork.uploadFile)
            : await getFileUrl(technicianWork.uploadFile);

        const rawPhotoUrl = Array.isArray(technicianWork.viewFile)
            ? await getMultipleFileUrls(technicianWork.viewFile)
            : await getFileUrl(technicianWork.viewFile);

        // 4️⃣ Build response with IDs + workType + signed URLs
        // const updatedData = {
        //     orderId: order._id,
        //     serviceId: service._id,
        //     technicianId,
        //     workType: technicianWork.workType || null,
        //     machineType: service.machineType,
        //     machineModel: service.machineModel,
        //     serialNumber: service.serialNumber,
        //     remark: technicianWork.remark || null,
        //     rawFile: rawFileUrl,   // ✅ signed URL(s)
        //     rawPhoto: rawPhotoUrl  // ✅ signed URL(s)
        // };
        const updatedData = {
            orderId: order._id,
            serviceId: service._id,
            technicianId,
            workType: technicianWork.workType || null,
            machineType: service.machineType,
            machineModel: service.machineModel,
            serialNumber: service.serialNumber,
            remark: service.remark || null,   // ✅ from service level
            rawFile: rawFileUrl,
            rawPhoto: rawPhotoUrl
        };

        console.log("🚀 ~ updatedData.remark:", updatedData.remark)
        res.status(200).json({
            success: true,
            updatedService: updatedData
        });

    } catch (error) {
        console.error('Error fetching updated order service details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


//check
const getAllOrdersForTechnician = asyncHandler(async (req, res) => {
    const { technicianId } = req.params;
    if (!technicianId) {
        return res.status(400).json({ message: 'technicianId is required' });
    }

    // Step 1: Find all services where this engineer is assigned
    const servicesWithEngineer = await Services.find({
        workTypeDetails: {
            $elemMatch: {
                engineer: new mongoose.Types.ObjectId(technicianId),
            },
        },
    });

    const serviceIds = servicesWithEngineer.map((s) => s._id);

    if (serviceIds.length === 0) {
        return res.status(404).json({ message: 'No services found for this engineer' });
    }

    // Step 2: Find orders that contain those services
    const orders = await orderModel.find({
        services: { $in: serviceIds },
    })
        .populate({
            path: 'services',
            populate: {
                path: 'workTypeDetails.engineer',
                model: 'Employee', // Assuming engineer is also stored in Employee model
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
// const updateCompletedStatus = asyncHandler(async (req, res) => {
//     const { orderId, employeeId } = req.params;
//     if (!orderId || !employeeId) {
//         return res.status(400).json({ message: 'Order ID and Employee ID are required' });
//     }
//     const order = await orderModel.findById(orderId);
//     if (!order) {
//         return res.status(404).json({ message: 'Order not found' });
//     }
//     // Loop through services or assigned employees to update status
//     let updated = false;
//     for (const service of order.services || []) {
//         // if (service.assignedTo?.toString() === employeeId.toString()) {
//         service.status = 'Completed';
//         service.workTypeStatus = 'Completed';
//         // Generate and assign report numbers
//         service.tcReportNumber = generateULRReportNumber();
//         service.qaTestReportNumber = generateQATestReportNumber();
//         order.status = 'completed';
//         order.reportULRNumber = generateULRReportNumber();
//         order.qaTestReportNumber = generateQATestReportNumber();
//         // Increment sequence after generating
//         incrementSequence();
//         await order.save();
//         console.log("🚀 ~ order:", order)
//         updated = true;
//         // }
//     }
//     if (!updated) {
//         return res.status(400).json({ message: 'No matching employee assignment found in order' });
//     }
//     await order.save();
//     res.status(200).json({
//         message: 'Status updated and report numbers generated successfully',
//         reportULRNumber: order.reportULRNumber,
//         qaTestReportNumber: order.qaTestReportNumber
//     });
// });
//qa raw --assign engineer--check in postman
const assignTechnicianByQARaw = asyncHandler(async (req, res) => {
    try {
        const { orderId, serviceId, technicianId, workType } = req.params;
        // 1. Validate order and service relationship
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!order.services.includes(serviceId)) {
            return res.status(400).json({ message: 'Service not linked to this order' });
        }

        // 2. Get the service
        const service = await Services.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // 3. Validate engineer
        const engineer = await Employee.findById(technicianId);
        if (!engineer || engineer.technicianType !== 'engineer') {
            return res.status(400).json({ message: 'Invalid engineer or not an engineer type' });
        }

        // 4. Find the specific workType and update only that
        const work = service.workTypeDetails.find(w => w.workType === workType);
        if (!work) {
            return res.status(404).json({ message: `WorkType '${workType}' not found in service` });
        }

        work.engineer = technicianId;
        work.status = 'in progress';

        await service.save();

        res.status(200).json({
            message: `Engineer assigned successfully to workType '${workType}'`,
            service,
        });
    } catch (error) {
        console.error('Error assigning engineer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


//for qa test
// const assignOfficeStaffByQATest = asyncHandler(async (req, res) => {
//     try {
//         const { orderId, serviceId, officeStaffId, workType, status } = req.params; 
//         console.log("🚀 ~ officeStaffId:", officeStaffId);
//         console.log("🚀 ~ serviceId:", serviceId);
//         console.log("🚀 ~ orderId:", orderId);
//         console.log("🚀 ~ status:", status);
//         console.log("🚀 ~ workType:", workType);

//         // 1. Validate order
//         const order = await orderModel.findById(orderId);
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         if (!order.services.includes(serviceId)) {
//             return res.status(400).json({ message: 'Service not linked to this order' });
//         }

//         // 2. Validate service
//         const service = await Services.findById(serviceId);
//         if (!service) {
//             return res.status(404).json({ message: 'Service not found' });
//         }

//         // 3. Validate staff
//         const staff = await Employee.findById(officeStaffId);
//         if (!staff || staff.technicianType !== 'office-staff') {
//             return res.status(400).json({ message: 'Invalid staff or not an office staff type' });
//         }

//         // 4. Assign office staff to the given workType only
//         let updated = false;
//         service.workTypeDetails = service.workTypeDetails.map((work) => {
//             if (work.workType?.toLowerCase() === workType.toLowerCase()) {
//                 work.officeStaff = officeStaffId;
//                 work.status = status || work.status;
//                 updated = true;
//             }
//             return work;
//         });

//         if (!updated) {
//             return res.status(404).json({ message: `WorkType '${workType}' not found in this service` });
//         }

//         await service.save();

//         res.status(200).json({
//             message: `Office staff assigned successfully to workType '${workType}'`,
//             service,
//         });
//     } catch (error) {
//         console.error('Error assigning office staff:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });


const assignOfficeStaffByQATest = asyncHandler(async (req, res) => {
    try {
        const { orderId, serviceId, officeStaffId, workType, status } = req.params;

        console.log("🚀 officeStaffId:", officeStaffId);
        console.log("🚀 serviceId:", serviceId);
        console.log("🚀 orderId:", orderId);
        console.log("🚀 workType:", workType);
        console.log("🚀 status:", status);

        // 1️⃣ Validate order
        const order = await orderModel.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (!order.services.includes(serviceId)) {
            return res.status(400).json({ message: 'Service not linked to this order' });
        }

        // 2️⃣ Validate service
        const service = await Services.findById(serviceId);
        if (!service) return res.status(404).json({ message: 'Service not found' });

        // 3️⃣ Validate office staff
        const staff = await Employee.findById(officeStaffId);
        if (!staff || staff.technicianType !== 'office-staff') {
            return res.status(400).json({ message: 'Invalid staff or not an office staff type' });
        }

        // 4️⃣ Find the workTypeDetail by workType param
        const workDetail = service.workTypeDetails.find(
            (w) => w.workType && w.workType.toLowerCase() === workType.toLowerCase()
        );

        if (!workDetail) {
            return res.status(404).json({ message: `WorkType '${workType}' not found in this service` });
        }

        // 5️⃣ Create or update QATest subdocument
        if (!workDetail.QAtest) {
            // create a new QATest document
            const newQATest = await QATest.create({ officeStaff: officeStaffId });
            workDetail.QAtest = newQATest._id;
        } else {
            await QATest.findByIdAndUpdate(workDetail.QAtest, { officeStaff: officeStaffId });
        }

        // 6️⃣ Update status if provided
        if (status) workDetail.status = status;

        // 7️⃣ Save service
        await service.save();

        res.status(200).json({
            message: `Office staff assigned successfully to workType '${workType}'`,
            service
        });

    } catch (error) {
        console.error('Error assigning office staff:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


//in this controller i have both completed and paid status
// controllers/statusController.js
// const completedStatusAndReport = asyncHandler(async (req, res) => {
//     const { staffId, orderId, serviceId, workType, status } = req.params;
//     console.log("completedStatusAndReport");

//     console.log("🚀 ~ status:", status)
//     console.log("🚀 ~ workType:", workType)
//     console.log("🚀 ~ serviceId:", serviceId)
//     console.log("🚀 ~ orderId:", orderId)
//     console.log("🚀 ~ technicianId:", staffId)
//     console.log("req.body", req.body);

//     let fileUrl = null;
//     let ulrReportNumber = null;
//     let qaTestReportNumber = null;

//     // ✅ Only require and upload file if status is 'completed'
//     if (status === "completed" || status === "generated") {
//         if (!req.file) {
//             return res.status(400).json({ message: "File is required for completed status" });
//         }
//         try {
//             fileUrl = await uploadToS3(req.file);
//             console.log("🚀 ~ fileUrl:", fileUrl)

//             // 👇 Generate report numbers after successful file upload
//             ulrReportNumber = generateULRReportNumber();
//             qaTestReportNumber = generateQATestReportNumber();
//             incrementSequence(); // increment for next use

//         } catch (err) {
//             console.error("S3 upload error:", err);
//             return res.status(500).json({ message: "Failed to upload file" });
//         }
//     }

//     // Fetch the service document
//     const service = await Services.findById(serviceId);
//     if (!service) {
//         return res.status(404).json({ message: "Service not found" });
//     }

//     let updated = false;

//     // Update only the specific workType for this technician/office staff
//     service.workTypeDetails = service.workTypeDetails.map((work) => {
//         if (
//             work.workType?.toLowerCase() === workType.toLowerCase() &&
//             (work.engineer?.toString() === staffId ||
//                 work.officeStaff?.toString() === staffId)
//         ) {
//             if (fileUrl) work.report = fileUrl;
//             work.status = status === "completed" ? "generated" : status;

//             // 👇 Optionally, also store report numbers inside the workType
//             if (ulrReportNumber) work.ulrReportNumber = ulrReportNumber;
//             if (qaTestReportNumber) work.qaTestReportNumber = qaTestReportNumber;

//             updated = true;
//         }
//         return work;
//     });

//     if (!updated) {
//         return res.status(404).json({
//             message: `WorkType '${workType}' not assigned to technician/office staff ${staffId} in this service`,
//         });
//     }

//     await service.save();

//     // Update order status if needed
//     const order = await orderModel.findById(orderId);
//     if (order) {
//         if (status === "paid") {
//             const payment = await Payment.findOne({ orderId });
//             if (!payment || payment.status !== "complete") {
//                 return res.status(400).json({
//                     message: "Cannot mark order as paid. Payment is not complete.",
//                 });
//             }
//             order.status = "paid";
//             await order.save();
//         }
//     }

//     // Send response
//     res.status(200).json({
//         message: `Status for workType '${workType}' updated successfully`,
//         fileUrl,
//         ulrReportNumber,
//         qaTestReportNumber,
//         service,
//         orderStatus: order?.status,
//     });
// });


const completedStatusAndReport = asyncHandler(async (req, res) => {
    const { staffId, orderId, serviceId, workType, status, reportType } = req.params;
    console.log("🚀 ~ reportType:", reportType)
    console.log("🚀 ~ status:", status)
    console.log("🚀 ~ workType:", workType)
    console.log("🚀 ~ serviceId:", serviceId)
    console.log("🚀 ~ orderId:", orderId)
    console.log("🚀 ~ staffId:", staffId)

    console.log("HELLO ");

    if (!req.file && (status === "completed" || status === "generated")) {
        return res.status(400).json({ message: "File is required for completed status" });
    }

    let fileUrl = null;
    console.log("🚀 ~ fileUrl:", fileUrl)
    if (req.file) {
        try {
            const uploaded = await uploadToS3(req.file); // { key, url }
            fileUrl = uploaded.url; // Only the URL string
            console.log("🚀 ~ fileUrl:", fileUrl)
        } catch (err) {
            return res.status(500).json({ message: "Failed to upload file" });
        }
    }

    const service = await Services.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    let updated = false;
    let newReportDoc = null;

    service.workTypeDetails = await Promise.all(
        service.workTypeDetails.map(async (work) => {
            if (work.workType?.toLowerCase() !== workType.toLowerCase()) return work;
            console.log("fileUrl:", fileUrl);
            console.log("reportType:", reportType);
            console.log("work.QAtest:", work.QAtest);
            console.log("work.elora:", work.elora);

            // Check assigned staff
            let assignedStaff = null;
            if (work.QAtest) {
                const qaDoc = await QATest.findById(work.QAtest);
                assignedStaff = qaDoc?.officeStaff?.toString();
            } else if (work.elora) {
                const eloraDoc = await Elora.findById(work.elora);
                assignedStaff = eloraDoc?.officeStaff?.toString();
            }

            if (assignedStaff && assignedStaff !== staffId) {
                throw new Error(`WorkType '${workType}' is assigned to another staff`);
            }

            // Update status only in workTypeDetails
            work.status = status === "completed" ? "generated" : status;

            // Only update linked QATest or Elora report
            if (fileUrl) {
                if (reportType === "qatest") {
                    if (work.QAtest) {
                        newReportDoc = await QATest.findById(work.QAtest);
                        if (newReportDoc) {
                            newReportDoc.report = fileUrl;
                            await newReportDoc.save();
                        } else {
                            newReportDoc = await QATest.create({ officeStaff: staffId, report: fileUrl });
                            work.QAtest = newReportDoc._id;
                        }
                    } else {
                        newReportDoc = await QATest.create({ officeStaff: staffId, report: fileUrl });
                        work.QAtest = newReportDoc._id;
                    }
                } else if (reportType === "elora") {
                    if (work.elora) {
                        newReportDoc = await Elora.findById(work.elora);
                        if (newReportDoc) {
                            newReportDoc.report = fileUrl;
                            await newReportDoc.save();
                        } else {
                            newReportDoc = await Elora.create({ officeStaff: staffId, report: fileUrl });
                            work.elora = newReportDoc._id;
                        }
                    } else {
                        newReportDoc = await Elora.create({ officeStaff: staffId, report: fileUrl });
                        work.elora = newReportDoc._id;
                    }
                }

            }

            updated = true;
            return work;
        })
    );

    if (!updated) {
        return res.status(404).json({
            message: `WorkType '${workType}' not assigned in this service`,
        });
    }

    await service.save();

    // Update order status if needed
    const order = await orderModel.findById(orderId);
    if (order && status === "paid") {
        const payment = await Payment.findOne({ orderId });
        if (!payment || payment.status !== "complete") {
            return res.status(400).json({
                message: "Cannot mark order as paid. Payment is not complete.",
            });
        }
        order.status = "paid";
        await order.save();
    }

    res.status(200).json({
        message: `Status for workType '${workType}' updated successfully`,
        fileUrl,
        service,
        linkedReport: newReportDoc, // now contains the QATest/Elora document
        orderStatus: order?.status,
    });
});


// export const
const getRawDetailsByTechnician = asyncHandler(async (req, res) => {
    try {

    } catch (error) {

    }
})
const getQaDetails = asyncHandler(async (req, res) => {
    try {
        const { orderId, serviceId, technicianId } = req.params;
        console.log("🚀 ~ engineerId:", technicianId)
        console.log("🚀 ~ serviceId:", serviceId)
        console.log("🚀 ~ orderId:", orderId)

        // Step 1: Find the order with populated services and engineers
        const order = await orderModel.findById(orderId)
            .populate({
                path: 'services',
                populate: {
                    path: 'workTypeDetails.engineer',
                    model: 'Employee'
                }
            });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Step 2: Find the specific service by serviceId
        const service = order.services.find(s => s._id.toString() === serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Step 3: Find work assigned to the engineer
        const engineerWork = service.workTypeDetails.find(work =>
            work.engineer?._id?.toString() === technicianId
        );
        if (!engineerWork) {
            return res.status(404).json({ message: 'No work found for this engineer' });
        }

        // Step 4: Construct response
        const response = {
            engineerName: engineerWork.engineer?.name || 'N/A',
            machineModel: service.machineModel || 'N/A',
            serialNumber: service.serialNumber || 'N/A',
            rawPhoto: engineerWork.viewFile || 'N/A',
            rawFile: engineerWork.uploadFile || 'N/A',
            remark: engineerWork.remark || 'N/A'
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error("Error fetching QA details:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

const getAllOfficeStaff = async (req, res) => {
    try {
        const officeStaff = await Employee.find({ technicianType: 'office staff' }).select('name');
        res.status(200).json({ success: true, data: officeStaff });
    } catch (error) {
        console.error("Error fetching office staff:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const updateStaffStatus = asyncHandler(async (req, res) => {
    try {

    } catch (error) {

    }
})

const uploadReportByOfficeStaff = asyncHandler(async (req, res) => {
    try {

    } catch (error) {

    }
})

const getAssignedTechnicianName = asyncHandler(async (req, res) => {
    try {
        const { orderId, serviceId, workType } = req.params;

        // 1. Validate the order contains the service
        const order = await orderModel.findById(orderId).populate({
            path: 'services',
            match: { _id: serviceId },
            populate: {
                path: 'workTypeDetails.engineer',
                select: '_id name'
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const service = order.services[0];
        if (!service) {
            return res.status(404).json({ message: 'Service not found in this order' });
        }

        // 2. Find the workType entry
        const workDetail = service.workTypeDetails.find(
            w => w.workType === workType
        );

        if (!workDetail) {
            return res.status(404).json({ message: 'Work type not found in this service' });
        }

        if (!workDetail.engineer) {
            return res.status(404).json({ message: 'No technician assigned for this work type' });
        }

        // 3. Return the technician's name
        res.status(200).json({
            success: true,
            technicianId: workDetail.engineer._id,
            technicianName: workDetail.engineer.name,
            status: workDetail.status
        });
    } catch (error) {
        console.error('Error fetching technician name:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



const getAssignedOfficeStaffName = asyncHandler(async (req, res) => {
    try {
        const { orderId, serviceId, workType } = req.params;

        // 1️⃣ Populate services → workTypeDetails → QAtest → officeStaff
        const order = await orderModel.findById(orderId).populate({
            path: "services",
            match: { _id: serviceId },
            populate: {
                path: "workTypeDetails.QAtest",   // populate QATest first
                populate: {
                    path: "officeStaff",          // then populate officeStaff inside QATest
                    select: "name"
                }
            }
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const service = order.services[0];
        if (!service) {
            return res.status(404).json({ message: "Service not found in this order" });
        }

        // 2️⃣ Find workType entry
        const workDetail = service.workTypeDetails.find(
            w => w.workType === workType
        );

        if (!workDetail) {
            return res.status(404).json({ message: "Work type not found in this service" });
        }

        if (!workDetail.QAtest || !workDetail.QAtest.officeStaff) {
            return res.status(404).json({ message: "No office staff assigned for this work type" });
        }

        // 3️⃣ Return office staff name
        res.status(200).json({
            success: true,
            officeStaffName: workDetail.QAtest.officeStaff.name,
            status: workDetail.status
        });

    } catch (error) {
        console.error("Error fetching office staff name:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});


export const getOrders = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.params
    } catch (error) {
        console.error("error ", error.message[0])
    }
})
export const editOrder = async (req, res) => {
    try {

    } catch (error) {

    }
}

// export const paidStatus = asyncHandler(async (req, res) => {
//     try {
//         const { orderId, serviceId, customerId, status } = req.body
//         const order=orderModel.findById(_id:orderId)

//     } catch (error) {

//     }
// })



// Update Additional Service
export const updateAdditionalService = async (req, res) => {
    try {
        const { id } = req.params; // service ID from URL
        const { status, remark } = req.body; // values from fronten
        if (!id) {
            return res.status(400).json({ message: "Service ID is required" });
        }
        const updatedService = await AdditionalService.findByIdAndUpdate(
            id,
            { status, remark },
            { new: true, runValidators: true }
        );
        if (!updatedService) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.status(200).json({
            message: "Additional Service updated successfully",
            service: updatedService,
        });
    } catch (error) {
        console.error("Error updating additional service:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// const assignToOfficeStff

// PATCH controller
const editDocuments = asyncHandler(async (req, res) => {
    try {
        const { orderId, serviceId, technicianId, workType } = req.params;

        // ✅ Upload files to S3
        let uploadFileUrl = null;
        let viewFileUrls = [];

        if (req.files?.uploadFile?.[0]) {
            const uploaded = await uploadToS3(req.files.uploadFile[0]);
            uploadFileUrl = uploaded.url;
        }

        if (req.files?.viewFile?.length > 0) {
            const uploads = await Promise.all(
                req.files.viewFile.map((file) => uploadToS3(file))
            );
            viewFileUrls = uploads.map((u) => u.url);
        }

        if (!uploadFileUrl && viewFileUrls.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded",
            });
        }

        // ✅ Ensure order exists
        const order = await orderModel.findById(orderId).populate("services");
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // ✅ Ensure service exists
        const service = await Services.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        // ✅ Find workTypeDetails matching workType & technician
        const workTypeDetail = service.workTypeDetails.find(
            (wt) =>
                wt.workType === workType &&
                (wt.engineer?.toString() === technicianId ||
                    wt.officeStaff?.toString() === technicianId)
        );

        if (!workTypeDetail) {
            return res.status(404).json({
                success: false,
                message: "Work type detail not found for this technician",
            });
        }

        // ✅ Update fields
        if (uploadFileUrl) {
            workTypeDetail.uploadFile = uploadFileUrl;
        }
        if (viewFileUrls.length > 0) {
            workTypeDetail.viewFile = [
                ...(workTypeDetail.viewFile || []),
                ...viewFileUrls,
            ];
        }

        await service.save();

        res.status(200).json({
            success: true,
            message: "Documents updated successfully",
            data: workTypeDetail,
        });
    } catch (error) {
        console.error("Error in editDocuments:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating documents",
            error: error.message,
        });
    }
});


const deleteDocument = asyncHandler(async (req, res) => {
    try {
        const { orderId, serviceId, technicianId, workType } = req.params;
        const { fileUrl, fileType } = req.body;
        // fileType can be "uploadFile" or "viewFile"

        if (!fileUrl || !fileType) {
            return res.status(400).json({
                success: false,
                message: "fileUrl and fileType are required",
            });
        }

        // ✅ Ensure order exists
        const order = await orderModel.findById(orderId).populate("services");
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // ✅ Ensure service exists
        const service = await Services.findById(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        // ✅ Find workTypeDetails matching workType & technician
        const workTypeDetail = service.workTypeDetails.find(
            (wt) =>
                wt.workType === workType &&
                (wt.engineer?.toString() === technicianId ||
                    wt.officeStaff?.toString() === technicianId)
        );

        if (!workTypeDetail) {
            return res.status(404).json({
                success: false,
                message: "Work type detail not found for this technician",
            });
        }

        // ✅ Delete file from workTypeDetail
        if (fileType === "uploadFile" && workTypeDetail.uploadFile === fileUrl) {
            workTypeDetail.uploadFile = null;
        } else if (fileType === "viewFile" && workTypeDetail.viewFile?.length) {
            workTypeDetail.viewFile = workTypeDetail.viewFile.filter(
                (url) => url !== fileUrl
            );
        } else {
            return res.status(404).json({
                success: false,
                message: "File not found in the specified field",
            });
        }

        // ✅ (Optional) Delete from S3 too
        // await deleteFromS3(fileUrl);

        await service.save();

        res.status(200).json({
            success: true,
            message: "Document deleted successfully",
            data: workTypeDetail,
        });
    } catch (error) {
        console.error("Error in deleteDocument:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting document",
            error: error.message,
        });
    }
});


const assignStaffByElora = asyncHandler(async (req, res) => {
    try {
        const { orderId, serviceId, officeStaffId, workType, status } = req.params;
        console.log("hi from assignStaffByElora ");
        console.log("🚀 officeStaffId:", officeStaffId);
        console.log("🚀 serviceId:", serviceId);
        console.log("🚀 orderId:", orderId);
        console.log("🚀 workType:", workType);
        console.log("🚀 status:", status);

        // 1️⃣ Validate order
        const order = await orderModel.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (!order.services.includes(serviceId)) {
            return res.status(400).json({ message: "Service not linked to this order" });
        }

        // 2️⃣ Validate service
        const service = await Services.findById(serviceId);
        if (!service) return res.status(404).json({ message: "Service not found" });

        // 3️⃣ Validate office staff
        const staff = await Employee.findById(officeStaffId);
        if (!staff || staff.technicianType !== "office-staff") {
            return res
                .status(400)
                .json({ message: "Invalid staff or not an office staff type" });
        }

        // 4️⃣ Find the workTypeDetail by workType param
        const workDetail = service.workTypeDetails.find(
            (w) => w.workType && w.workType.toLowerCase() === workType.toLowerCase()
        );

        if (!workDetail) {
            return res
                .status(404)
                .json({ message: `WorkType '${workType}' not found in this service` });
        }

        // 5️⃣ Create or update Elora subdocument
        if (!workDetail.elora) {
            // create a new Elora document
            const newElora = await Elora.create({ officeStaff: officeStaffId });
            workDetail.elora = newElora._id;
        } else {
            await Elora.findByIdAndUpdate(workDetail.elora, {
                officeStaff: officeStaffId,
            });
        }

        // 6️⃣ Update status if provided
        if (status) workDetail.status = status;

        // 7️⃣ Save service
        await service.save();

        res.status(200).json({
            message: `Office staff assigned successfully to Elora for workType '${workType}'`,
            service,
        });
    } catch (error) {
        console.error("❌ Error assigning office staff to Elora:", error);
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
});


const getAllOrdersByHospitalId = asyncHandler(async (req, res) => {
    try {
        const { hospitalId } = req.params;
        console.log("🚀 ~ hospitalId:", hospitalId)

        if (!hospitalId) {
            return res.status(400).json({
                success: false,
                message: "Hospital ID is required",
            });
        }

        // Validate hospital exists
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital not found",
            });
        }

        // ✅ Use hospital ObjectId instead of hospitalName
        const orders = await orderModel.find({ hospital: hospitalId })
            .populate("services", "machineType equipmentNo machineModel serialNumber remark workTypeDetails")
            .populate("additionalServices", "name description totalAmount")
            .populate("customer", "name email role")
            .populate("quotation", "quotationNumber status")
            .populate("payment")
            .populate("courierDetails");


        if (!orders || orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No orders found for this hospital",
            });
        }

        res.status(200).json({
            success: true,
            hospital: {
                id: hospital._id,
                name: hospital.name,
                branch: hospital.branch,
                phone: hospital.phone,
                email: hospital.email,
            },
            totalOrders: orders.length,
            orders,
        });
    } catch (error) {
        console.error("Error fetching orders by hospitalId:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching orders",
            error: error.message,
        });
    }
});


const getOrderByHospitalIdOrderId = asyncHandler(async (req, res) => {
    try {
        const { hospitalId, orderId } = req.params;
        console.log("🚀 ~ orderId:", orderId);
        console.log("🚀 ~ hospitalId:", hospitalId);

        if (!hospitalId || !orderId) {
            return res.status(400).json({
                success: false,
                message: "Hospital ID and Order ID are required",
            });
        }

        // 1️⃣ Validate hospital exists
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: "Hospital not found",
            });
        }

        // Find order by _id AND hospital (ObjectId reference)
        const order = await orderModel.findOne({
            _id: orderId,
            hospital: hospitalId,
        })
            .populate("services", "machineType equipmentNo machineModel serialNumber remark workTypeDetails")
            .populate("additionalServices", "name description totalAmount")
            .populate("customer", "name email role")
            .populate("quotation", "quotationNumber status")
            .populate("payment")
            .populate("courierDetails")
            .populate("hospital", "name branch phone email"); // 👉 optional: populate hospital

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found for this hospital",
            });
        }
        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Error fetching order by hospitalId + orderId:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching order",
            error: error.message,
        });
    }
});


const getQaReportsByTechnician = async (req, res) => {
    try {
        const { technicianId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(technicianId)) {
            return res.status(400).json({ success: false, message: "Invalid technicianId" });
        }

        // Step 1: Find services for this technician
        const services = await Services.find({
            "workTypeDetails.engineer": technicianId,
        }).populate({
            path: "workTypeDetails.QAtest",
            select: "report reportULRNumber qaTestReportNumber createdAt",
        });

        if (!services || services.length === 0) {
            return res.status(404).json({ success: false, message: "No QA reports found for this technician" });
        }

        // Step 2: Collect all orderIds containing these services
        const serviceIds = services.map(s => s._id);
        const orders = await orderModel.find({ services: { $in: serviceIds } }).select("_id srfNumber partyCodeOrSysId procNoOrPoNo services");

        // Step 3: Build response
        const reports = [];
        for (const service of services) {
            const parentOrder = orders.find(order => order.services.includes(service._id));
            service.workTypeDetails.forEach(wt => {
                if (wt.engineer?.toString() === technicianId && wt.QAtest) {
                    reports.push({
                        orderId: parentOrder?._id,
                        srfNumber: parentOrder?.srfNumber,
                        procNoOrPoNo: parentOrder?.procNoOrPoNo,
                        partyCodeOrSysId: parentOrder?.partyCodeOrSysId,
                        serviceId: service._id,
                        machineType: service.machineType,
                        qaReportId: wt.QAtest._id,
                        report: wt.QAtest.report,
                        reportULRNumber: wt.QAtest.reportULRNumber,
                        qaTestReportNumber: wt.QAtest.qaTestReportNumber,
                        uploadedAt: wt.QAtest.createdAt,
                    });
                }
            });
        }

        return res.status(200).json({
            success: true,
            technicianId,
            totalReports: reports.length,
            reports,
        });
    } catch (error) {
        console.error("❌ Error in getQaReportsByTechnician:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


// GET /admin/orders/:orderId/:serviceId/:qaReportId


// GET QA Report by orderId, serviceId, qaReportId
const getReportById = asyncHandler(async (req, res) => {
    const { orderId, serviceId, qaReportId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(orderId) ||
        !mongoose.Types.ObjectId.isValid(serviceId) ||
        !mongoose.Types.ObjectId.isValid(qaReportId)) {
        return res.status(400).json({ success: false, message: "Invalid ID(s)" });
    }

    // Populate services -> workTypeDetails -> QAtest -> officeStaff
    const order = await orderModel.findById(orderId)
        .populate({
            path: "services",
            populate: {
                path: "workTypeDetails.QAtest",
                populate: { path: "officeStaff", select: "name email" }
            }
        });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Find service
    const service = order.services.find(s => s._id.toString() === serviceId);
    if (!service) return res.status(404).json({ success: false, message: "Service not found in this order" });

    // Find QA report
    let foundReport = null;
    service.workTypeDetails.forEach(wt => {
        const qaId = wt.QAtest?._id ? wt.QAtest._id.toString() : wt.QAtest?.toString();
        if (qaId === qaReportId) {
            foundReport = {
                orderId: order._id,
                serviceId: service._id,
                // srfNumber: order.srfNumber,
                // procNoOrPoNo: order.procNoOrPoNo,
                // partyCodeOrSysId: order.partyCodeOrSysId,
                // machineType: service.machineType,
                reportId: qaId,
                report: wt.QAtest?.report,
                // reportULRNumber: wt.QAtest?.reportULRNumber,
                // qaTestReportNumber: wt.QAtest?.qaTestReportNumber,
                // uploadedAt: wt.QAtest?.createdAt,
                officeStaff: wt.QAtest?.officeStaff,
            };
        }
    });

    if (!foundReport) return res.status(404).json({ success: false, message: "Report not found in this service" });

    res.status(200).json({ success: true, report: foundReport });
});

const acceptQAReport = asyncHandler(async (req, res) => {
    const { orderId, serviceId, qaReportId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(orderId) ||
        !mongoose.Types.ObjectId.isValid(serviceId) ||
        !mongoose.Types.ObjectId.isValid(qaReportId)) {
        return res.status(400).json({ success: false, message: "Invalid ID(s)" });
    }

    const order = await orderModel.findById(orderId).populate({
        path: "services",
        populate: {
            path: "workTypeDetails.QAtest",
        },
    });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const service = order.services.find(s => s._id.toString() === serviceId);
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    const wt = service.workTypeDetails.find(w => w.QAtest && w.QAtest._id.toString() === qaReportId);
    if (!wt) return res.status(404).json({ success: false, message: "QA Report not found" });

    wt.QAtest.reportStatus = "accepted";
    await wt.QAtest.save();

    res.status(200).json({ success: true, message: "QA Report accepted", report: wt.QAtest });
});

const rejectQAReport = asyncHandler(async (req, res) => {
    const { orderId, serviceId, qaReportId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(orderId) ||
        !mongoose.Types.ObjectId.isValid(serviceId) ||
        !mongoose.Types.ObjectId.isValid(qaReportId)) {
        return res.status(400).json({ success: false, message: "Invalid ID(s)" });
    }

    const order = await orderModel.findById(orderId).populate({
        path: "services",
        populate: {
            path: "workTypeDetails.QAtest",
        },
    });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const service = order.services.find(s => s._id.toString() === serviceId);
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    const wt = service.workTypeDetails.find(w => w.QAtest && w.QAtest._id.toString() === qaReportId);
    if (!wt) return res.status(404).json({ success: false, message: "QA Report not found" });

    // Check if already accepted
    if (wt.QAtest.reportStatus === "accepted") {
        return res.status(400).json({ success: false, message: "Cannot reject. QA Report is already accepted." });
    }

    // Update status to rejected
    wt.QAtest.reportStatus = "rejected";
    await wt.QAtest.save();

    res.status(200).json({ success: true, message: "QA Report rejected", report: wt.QAtest });
});

const completeStatusReportForElora = asyncHandler(async (req, res) => {
    try {

    } catch (error) {

    }
})

export default { getAllOrders, getBasicDetailsByOrderId, getAdditionalServicesByOrderId, getAllServicesByOrderId, getMachineDetailsByOrderId, updateOrderDetails, updateEmployeeStatus, getQARawByOrderId, getAllOrdersForTechnician, startOrder, getSRFDetails, assignTechnicianByQARaw, assignOfficeStaffByQATest, getQaDetails, getAllOfficeStaff, getAssignedTechnicianName, getAssignedOfficeStaffName, getUpdatedOrderServices, getUpdatedOrderServices2, createOrder, completedStatusAndReport, getMachineDetails, updateServiceWorkType, updateAdditionalService, editDocuments, assignStaffByElora, getAllOrdersByHospitalId, getOrderByHospitalIdOrderId, getReportNumbers, getQaReportsByTechnician, getReportById, acceptQAReport, rejectQAReport, completeStatusReportForElora }