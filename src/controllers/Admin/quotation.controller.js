import { asyncHandler } from "../../utils/AsyncHandler.js";
import Enquiry from "../../models/enquiry.model.js";
import Quotation from "../../models/quotation.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import orderModel from "../../models/order.model.js";
import mongoose from "mongoose";
import Services from "../../models/Services.js";
import AdditionalService from '../../models/additionalService.model.js'
import { uploadToS3 } from "../../utils/s3Upload.js";


// export const createQuotationByEnquiryId = asyncHandler(async (req, res) => {
//     const { enquiryId } = req.params;

//     // Fetch enquiry using the ObjectId
//     const enquiry = await Enquiry.findById(enquiryId);

//     if (!enquiry) {
//         throw new ApiError(404, "Enquiry not found");
//     }

//     // You may customize discount, terms, total, etc. from req.body
//     const { discount = 0, total, from, termsAndConditions = [] } = req.body;

//     if (!total || !from) {
//         throw new ApiError(400, "Total and From (user ID) are required");
//     }

//     // Create new quotation
//     const newQuotation = await Quotation.create({
//         enquiry: enquiry._id,
//         from,
//         discount,
//         total,
//         termsAndConditions,
//         quotationStatus: "Created", // or 'Create' if you want to edit later
//     });

//     // Optional: Update enquiry's quotationStatus field with reference
//     enquiry.quotationStatus = newQuotation._id;
//     enquiry.enquiryStatus = 'Quotation Sent';
//     enquiry.enquiryStatusDates.quotationSentOn = new Date();
//     await enquiry.save();

//     res.status(201).json(
//         new ApiResponse(201, newQuotation, "Quotation created successfully")
//     );
// });


// const createQuotationByEnquiryId = asyncHandler(async (req, res) => {
//     try {
//         const { id } = req.params;
//         console.log("Incoming Quotation Payload:----->", req.body)

//         console.log("🚀 ~ enquiryId:", id)
//         const {
//             date,
//             quotationNumber,
//             expiryDate,
//             customer,
//             assignedEmployee,
//             termsAndConditions,
//             calculations,
//             items,
//         } = req.body;
//         console.log("🚀 ~ customer-------------->:", customer)

//         if (!assignedEmployee || !calculations || !items) {
//             throw new ApiError(400, 'Missing required fields');
//         }

//         // Now directly fetch by enquiry ID
//         const enquiry = await Enquiry.findById(id).populate("customer");
//         console.log("enquiry.customer:", enquiry.customer);

//         if (!enquiry) throw new ApiError(404, "Enquiry not found");
//         if (!enquiry.customer || !enquiry.customer._id)
//             throw new ApiError(400, "Customer info missing in enquiry");
//         console.log("Terms to be saved:", termsAndConditions);

//         const quotation = await Quotation.create({
//             date,
//             quotationId: quotationNumber,
//             enquiry: enquiry._id,
//             from: enquiry.customer._id,
//             discount: calculations.discount,
//             total: calculations.totalAmount,
//             quotationStatus: 'Created',
//             termsAndConditions,
//         });

//         console.log("Created Quotation:", quotation);
//         await Enquiry.findByIdAndUpdate(enquiry._id, {
//             quotationStatus: quotation.quotationStatus,
//             "enquiryStatusDates.quotationSentOn": quotation.date || new Date(),
//         });
//         return res
//             .status(201)
//             .json(new ApiResponse(201, quotation, 'Quotation created successfully'));
//     } catch (error) {
//         console.error("Error creating quotation:", error);
//         throw new ApiError(500, 'Failed to create quotation', [error.message]);
//     }
// });
// const createQuotationByEnquiryId = asyncHandler(async (req, res) => {
//     try {
//         const { id } = req.params;
//         const {
//             date,
//             quotationNumber,
//             customer,
//             assignedEmployee,
//             items,
//             calculations,
//             termsAndConditions,
//             bankDetails,
//             companyDetails,
//         } = req.body;

//         console.log("🚀 ~ req.body:", req.body);

//         if (!assignedEmployee) throw new ApiError(400, 'Assigned employee is required');

//         // Fetch enquiry to check if it exists
//         const enquiry = await Enquiry.findById(id).populate('customer');
//         if (!enquiry) throw new ApiError(404, 'Enquiry not found');
//         if (!enquiry.customer || !enquiry.customer._id)
//             throw new ApiError(400, 'Customer info missing in enquiry');

//         // Create quotation using frontend-calculated values
//         const quotation = await Quotation.create({
//             date,
//             quotationId: quotationNumber,
//             enquiry: enquiry._id,
//             from: enquiry.customer._id,
//             customer,
//             assignedEmployee,
//             items,
//             calculations,
//             bankDetails,
//             companyDetails,
//             discount: calculations?.discountAmount || 0,
//             total: calculations?.totalAmount || 0,
//             quotationStatus: 'Created',
//             termsAndConditions,
//         });

//         // Update enquiry with quotation status and date
//         await Enquiry.findByIdAndUpdate(enquiry._id, {
//             quotationStatus: quotation.quotationStatus,
//             "enquiryStatusDates.quotationSentOn": quotation.date || new Date(),
//             subtotalAmount: calculations?.subtotal || 0,
//             discount: calculations?.discountAmount || 0,
//             grandTotal: calculations?.totalAmount || 0
//         });

//         return res.status(201).json(
//             new ApiResponse(201, quotation, 'Quotation created successfully')
//         );

//     } catch (error) {
//         console.error("Error creating quotation:", error);
//         throw new ApiError(500, 'Failed to create quotation', [error.message]);
//     }
// });
// const createQuotationByEnquiryId = asyncHandler(async (req, res) => {
//     try {
//         const { id } = req.params;
//         const {
//             date,
//             quotationNumber,
//             customer,
//             assignedEmployee,
//             items,
//             calculations,
//             termsAndConditions,
//             bankDetails,
//             companyDetails,
//         } = req.body;

//         console.log("🚀 ~ req.body:", req.body);

//         if (!assignedEmployee) throw new ApiError(400, 'Assigned employee is required');

//         // Fetch enquiry and populate services/additional services
//         const enquiry = await Enquiry.findById(id)
//             .populate('services')
//             .populate('additionalServices')
//             .populate('customer');
//         if (!enquiry) throw new ApiError(404, 'Enquiry not found');
//         if (!enquiry.customer || !enquiry.customer._id)
//             throw new ApiError(400, 'Customer info missing in enquiry');
//         // Create snapshots of services with totalAmount
//         // const serviceSnapshots = items.services.map(s => ({
//         //     id: s.id,
//         //     machineType: s.machineType,
//         //     equipmentNo: s.equipmentNo,
//         //     machineModel: s.machineModel,
//         //     serialNumber: s.serialNumber,
//         //     remark: s.remark,
//         //     totalAmount: s.totalAmount, // directly from frontend
//         // }));

//         const serviceSnapshots = items.services.map(s => ({
//             id: s.id, // frontend sends real ObjectId
//             machineType: s.machineType,
//             equipmentNo: s.equipmentNo,
//             machineModel: s.machineModel,
//             serialNumber: s.serialNumber,
//             remark: s.remark,
//             totalAmount: s.totalAmount, //  directly from frontend
//         }));
//         console.log("Service snapshots for DB update:", serviceSnapshots);


//         const additionalServiceSnapshots = items.additionalServices.map(s => ({
//             id: s.id,
//             name: s.name,
//             description: s.description,
//             totalAmount: s.totalAmount, // directly from frontend
//         }));


//         // Create quotation with service snapshots and other data
//         const quotation = await Quotation.create({
//             date,
//             quotationId: quotationNumber,
//             enquiry: enquiry._id,
//             from: enquiry.customer._id,
//             customer,
//             assignedEmployee,
//             items: {
//                 services: serviceSnapshots,
//                 additionalServices: additionalServiceSnapshots,
//             },
//             calculations,
//             bankDetails,
//             companyDetails,
//             discount: calculations?.discountAmount || 0,
//             total: calculations?.totalAmount || 0,
//             quotationStatus: 'Created',
//             termsAndConditions,
//         });

//         // **Update the actual Service and AdditionalService totals in DB**
//         // Update the actual Service and AdditionalService totals in DB

//         await Promise.all(serviceSnapshots
//             .filter(s => mongoose.Types.ObjectId.isValid(s.id)) // ✅ only update valid ids
//             .map(s => Services.findByIdAndUpdate(
//                 s.id,
//                 { $set: { totalAmount: s.totalAmount } },
//                 { new: true }
//             ))
//         );


//         await Promise.all(additionalServiceSnapshots
//             .filter(s => s.id) // ✅ same for additional services
//             .map(s => AdditionalService.findByIdAndUpdate(s.id, { totalAmount: s.totalAmount }))
//         );


//         // Update enquiry with totals and quotation status
//         await Enquiry.findByIdAndUpdate(enquiry._id, {
//             quotationStatus: quotation.quotationStatus,
//             "enquiryStatusDates.quotationSentOn": quotation.date || new Date(),
//             subtotalAmount: calculations?.subtotal || 0,
//             discount: calculations?.discountAmount || 0,
//             grandTotal: calculations?.totalAmount || 0,
//         });

//         // Return response
//         return res.status(201).json(
//             new ApiResponse(201, quotation, 'Quotation created successfully')
//         );


//     } catch (error) {
//         console.error("Error creating quotation:", error);
//         throw new ApiError(500, 'Failed to create quotation', [error.message]);
//     }
// });


const createQuotationByEnquiryId = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params; // enquiryId
        console.log("🚀 ~ id:", id)
        const {
            date,
            quotationNumber,
            assignedEmployee,
            items,
            calculations,
            termsAndConditions,
            bankDetails,
            companyDetails,
        } = req.body;

        if (!assignedEmployee) throw new ApiError(400, "Assigned employee is required");

        // Fetch enquiry with hospital & services
        const enquiry = await Enquiry.findById(id)
            .populate("services")
            .populate("additionalServices")
            .populate("hospital");

        if (!enquiry) throw new ApiError(404, "Enquiry not found");
        if (!enquiry.hospital) throw new ApiError(400, "Hospital info missing in enquiry");

        // Prepare snapshots
        const serviceSnapshots = items.services.map((s) => ({
            id: s.id,
            machineType: s.machineType,
            equipmentNo: s.equipmentNo,
            machineModel: s.machineModel,
            serialNumber: s.serialNumber,
            remark: s.remark,
            totalAmount: s.totalAmount,
        }));

        const additionalServiceSnapshots = items.additionalServices.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            totalAmount: s.totalAmount,
        }));

        // Create quotation
        const quotation = await Quotation.create({
            date,
            quotationId: quotationNumber,
            enquiry: enquiry._id,
            from: enquiry.hospital._id, // ✅ hospital reference
            assignedEmployee,
            items: {
                services: serviceSnapshots,
                additionalServices: additionalServiceSnapshots,
            },
            calculations,
            bankDetails,
            companyDetails,
            discount: calculations?.discountAmount || 0,
            total: calculations?.totalAmount || 0,
            quotationStatus: "Created",
            termsAndConditions,
        });

        // Update service totals in DB
        await Promise.all(
            serviceSnapshots
                .filter((s) => mongoose.Types.ObjectId.isValid(s.id))
                .map((s) =>
                    Services.findByIdAndUpdate(
                        s.id,
                        { $set: { totalAmount: s.totalAmount } },
                        { new: true }
                    )
                )
        );

        // Update additional service totals
        await Promise.all(
            additionalServiceSnapshots
                .filter((s) => mongoose.Types.ObjectId.isValid(s.id))
                .map((s) =>
                    AdditionalService.findByIdAndUpdate(
                        s.id,
                        { $set: { totalAmount: s.totalAmount } },
                        { new: true }
                    )
                )
        );

        // Update enquiry with quotation info
        await Enquiry.findByIdAndUpdate(enquiry._id, {
            quotationStatus: quotation.quotationStatus,
            "enquiryStatusDates.quotationSentOn": quotation.date || new Date(),
            subtotalAmount: calculations?.subtotal || 0,
            discount: calculations?.discountAmount || 0,
            grandTotal: calculations?.totalAmount || 0,
        });

        return res
            .status(201)
            .json(new ApiResponse(201, quotation, "Quotation created successfully"));
    } catch (error) {
        console.error("Error creating quotation:", error);
        throw new ApiError(500, "Failed to create quotation", [error.message]);
    }
});
//web
const getQuotationByEnquiryId = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        console.log("🚀 ~ id:", id)

        if (!id) {
            throw new ApiError(400, 'Enquiry ID is required');
        }

        // Find the quotation associated with the given enquiry ID
        const quotation = await Quotation.findOne({ enquiry: id })
            .populate({
                path: 'enquiry',
                populate: [
                    {
                        path: 'services', // populate services inside enquiry
                        model: 'Service',
                    },
                    {
                        path: 'additionalServices', // populate additionalServices inside enquiry
                        model: 'AdditionalService',
                        select: 'name description totalAmount', // select only these fields
                    },
                ],
            })
            .populate('from', 'name email') // employee info
            .exec();

        if (!quotation) {
            throw new ApiError(404, 'Quotation not found for this enquiry');
        }

        return res
            .status(200)
            .json(new ApiResponse(200, quotation, 'Quotation fetched successfully'));
    } catch (error) {
        console.error("Error fetching quotation:", error);
        throw new ApiError(500, 'Failed to fetch quotation', [error.message]);
    }
});
//mobile
const getQuotationByIds = asyncHandler(async (req, res) => {
    const { hospitalId, enquiryId } = req.params;

    if (!enquiryId || !hospitalId) {
        throw new ApiError(400, 'Enquiry ID and Hospital ID are required');
    }

    const quotation = await Quotation.findOne({
        enquiry: enquiryId,
        from: hospitalId   // 👈 use `from` since schema has this
    })
        .populate('enquiry')   // populate enquiry details
        .populate('from');     // populate hospital details

    if (!quotation) {
        throw new ApiError(404, 'Quotation not found for the given enquiry and hospital');
    }

    res.status(200).json(new ApiResponse(200, quotation, 'Quotation fetched successfully'));
});


// for mobile app
// const acceptQuotation = asyncHandler(async (req, res) => {
//     try {
//         const { customerId, enquiryId, quotationId } = req.params;
//         console.log("🚀 ~ quotationId:", quotationId)
//         console.log("🚀 ~ enquiryId:", enquiryId)
//         console.log("🚀 ~ customerId:", customerId)

//         // 1. Find the quotation
//         const quotation = await Quotation.findOne({
//             _id: quotationId,
//             enquiry: enquiryId,
//             from: customerId
//         });
//         console.log("🚀 ~ quotation:", quotation)

//         if (!quotation) {
//             return res.status(404).json({ message: "Quotation not found" });
//         }

//         // 2. Update status
//         quotation.quotationStatus = 'Accepted';
//         await quotation.save();

//         const enquiry = await Enquiry.findOne({
//             _id: enquiryId,
//             customer: customerId
//         });

//         console.log("Found enquiry:", enquiry);

//         if (!enquiry) {
//             return res.status(404).json({ message: "Enquiry not found for the customer" });
//         }

//         // Update enquiry status to Approved and set the date
//         enquiry.enquiryStatus = 'Approved';
//         enquiry.quotationStatus = 'Accepted';
//         enquiry.enquiryStatusDates.approvedOn = new Date();
//         await enquiry.save();
//         // 4. Build services arrayss
//         const services = enquiry.services.map(service => ({
//             machineType: service.machineType,
//             equipmentNo: service.equipmentNo,
//             machineModel: service.machineModel,
//             workTypeDetails: service.workType.map(wt => ({
//                 workType: wt,
//                 serviceName: 'Elora', // or 'ELORA' or 'QA Raw' — set as needed
//             }))
//         }));

//         // 5. Create Order
//         const order = await orderModel.create({
//             leadOwner: enquiry.leadOwner,
//             hospitalName: enquiry.hospitalName,
//             fullAddress: enquiry.fullAddress,
//             city: enquiry.city,
//             district: enquiry.district,
//             state: enquiry.state,
//             pinCode: enquiry.pinCode,
//             branchName: enquiry.branch,
//             contactPersonName: enquiry.contactPerson,
//             emailAddress: enquiry.emailAddress,
//             contactNumber: enquiry.contactNumber,
//             designation: enquiry.designation,
//             advanceAmount: 0, // optional, set if needed
//             workOrderCopy: '', // optional, set if needed
//             partyCodeOrSysId: '',
//             procNoOrPoNo: '',
//             urgency: 'normal', // or get from enquiry if stored
//             specialInstructions: enquiry.specialInstructions,
//             services: services
//         });
//         console.log("🚀 ~ order:", order)

//         await order.save();

//         res.status(200).json({
//             message: "Quotation accepted and order created successfully",
//             quotation,
//             order
//         });

//     } catch (error) {
//         console.error("Error in acceptQuotation:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });


// const acceptQuotation = asyncHandler(async (req, res) => {
//     try {
//         const { customerId, enquiryId, quotationId } = req.params;

//         // 1. Find the quotation
//         const quotation = await Quotation.findOne({
//             _id: quotationId,
//             enquiry: enquiryId,
//             from: customerId
//         });
//         if (!quotation) {
//             return res.status(404).json({ message: "Quotation not found" });
//         }
//         // Update quotation status
//         quotation.quotationStatus = 'Accepted';
//         await quotation.save();

//         // 2. Find the related enquiry
//         // 2. Find the related enquiry and populate services
//         const enquiry = await Enquiry.findOne({
//             _id: enquiryId,
//             customer: customerId
//         }).populate("services");
//         console.log("🚀 ~ enquiry:", enquiry)
//         if (!enquiry) {
//             return res.status(404).json({ message: "Enquiry not found for the customer" });
//         }
//         // Update enquiry status
//         enquiry.enquiryStatus = 'Approved';
//         enquiry.quotationStatus = 'Accepted';
//         enquiry.enquiryStatusDates.approvedOn = new Date();
//         await enquiry.save();
//         // 3. Create Service documents
//         const serviceDocs = await Promise.all(
//             enquiry.services.map(async (service) => {
//                 const newService = new Services({
//                     machineType: service.machineType,
//                     equipmentNo: service.equipmentNo,
//                     machineModel: service.machineModel,
//                     workTypeDetails: (service.workTypeDetails || []).map(wt => ({
//                         workType: wt.workType,
//                         serviceName: wt.serviceName,
//                         status: wt.status || "pending",
//                     })),
//                 });
//                 await newService.save();
//                 return newService._id;
//             })
//         );
//         // 4. Create Order with service IDs
//         const order = await orderModel.create({
//             leadOwner: enquiry.leadOwner,
//             hospitalName: enquiry.hospitalName,
//             fullAddress: enquiry.fullAddress,
//             city: enquiry.city,
//             district: enquiry.district,
//             state: enquiry.state,
//             pinCode: enquiry.pinCode,
//             branchName: enquiry.branch,
//             contactPersonName: enquiry.contactPerson,
//             emailAddress: enquiry.emailAddress,
//             contactNumber: enquiry.contactNumber,
//             designation: enquiry.designation,
//             advanceAmount: 0,
//             workOrderCopy: '',
//             partyCodeOrSysId: '',
//             procNoOrPoNo: '',
//             urgency: 'normal',
//             specialInstructions: enquiry.specialInstructions,
//             additionalServices: enquiry.additionalServices,
//             services: serviceDocs,
//             quotation: quotation._id,
//             customer: enquiry.customer // 👈 Make sure this exists in the enquiry
//         });

//         console.log("🚀 ~ order:", order)
//         console.log("🚀 ~ order.additionalServices:", order.additionalServices)

//         res.status(200).json({
//             message: "Quotation accepted and order created successfully",
//             quotation,
//             order
//         });

//     } catch (error) {
//         console.error("Error in acceptQuotation:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });

const acceptQuotation = asyncHandler(async (req, res) => {
    try {
        const { hospitalId, enquiryId, quotationId } = req.params;

        // 1. Find the quotation by enquiry + hospital
        const quotation = await Quotation.findOne({
            _id: quotationId,
            enquiry: enquiryId,
            from: hospitalId
        });
        if (!quotation) {
            return res.status(404).json({ message: "Quotation not found for this hospital" });
        }

        // Update quotation status
        quotation.quotationStatus = 'Accepted';
        await quotation.save();

        // 2. Find the related enquiry (with services)
        const enquiry = await Enquiry.findOne({
            _id: enquiryId,
            hospital: hospitalId
        }).populate("services");
        if (!enquiry) {
            return res.status(404).json({ message: "Enquiry not found for this hospital" });
        }

        // Update enquiry status
        enquiry.enquiryStatus = 'Approved';
        enquiry.quotationStatus = 'Accepted';
        enquiry.enquiryStatusDates.approvedOn = new Date();
        await enquiry.save();

        // 3. Create new Service documents (clones)
        const serviceDocs = await Promise.all(
            enquiry.services.map(async (service) => {
                const newService = new Services({
                    machineType: service.machineType,
                    equipmentNo: service.equipmentNo,
                    machineModel: service.machineModel,
                    workTypeDetails: (service.workTypeDetails || []).map(wt => ({
                        workType: wt.workType,
                        serviceName: wt.serviceName,
                        status: wt.status || "pending",
                    })),
                });
                await newService.save();
                return newService._id;
            })
        );

        // 4. Create Order with service IDs
        const order = await orderModel.create({
            leadOwner: enquiry.leadOwner,
            hospital: hospitalId, // 👈 Link hospital directly
            hospitalName: enquiry.hospitalName,
            fullAddress: enquiry.fullAddress,
            city: enquiry.city,
            district: enquiry.district,
            state: enquiry.state,
            pinCode: enquiry.pinCode,
            branchName: enquiry.branch,
            contactPersonName: enquiry.contactPerson,
            emailAddress: enquiry.emailAddress,
            contactNumber: enquiry.contactNumber,
            designation: enquiry.designation,
            advanceAmount: 0,
            workOrderCopy: '',
            partyCodeOrSysId: '',
            procNoOrPoNo: '',
            urgency: 'normal',
            specialInstructions: enquiry.specialInstructions,
            additionalServices: enquiry.additionalServices,
            services: serviceDocs,
            quotation: quotation._id,
            customer: enquiry.customer // still keep if you want customer reference
        });

        res.status(200).json({
            message: "Quotation accepted and order created successfully",
            quotation,
            order
        });

    } catch (error) {
        console.error("Error in acceptQuotation:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// const rejectQuotation = asyncHandler(async (req, res) => {
//     try {
//         const { customerId, enquiryId, quotationId } = req.params;
//         const { rejectionRemark } = req.body;

//         console.log("Rejecting Quotation:", { quotationId, enquiryId, customerId, rejectionRemark });

//         // 1. Find the quotation and ensure it belongs to the customer and enquiry
//         const quotation = await Quotation.findOne({
//             _id: quotationId,
//             enquiry: enquiryId,
//             from: customerId
//         });

//         if (!quotation) {
//             return res.status(404).json({ message: "Quotation not found for the provided customer and enquiry" });
//         }

//         // 2. Prevent rejecting already accepted quotations
//         if (quotation.quotationStatus === 'Accepted') {
//             return res.status(400).json({
//                 message: "Cannot reject a quotation that has already been accepted"
//             });
//         }

//         // 3. Reject the quotation
//         quotation.quotationStatus = 'Rejected';
//         quotation.rejectionRemark = rejectionRemark;
//         await quotation.save();

//         // 4. Find and update the corresponding enquiry
//         const enquiry = await Enquiry.findOne({
//             _id: enquiryId,
//             customer: customerId
//         });

//         if (!enquiry) {
//             return res.status(404).json({ message: "Related enquiry not found for the customer" });
//         }

//         enquiry.enquiryStatus = 'Rejected';
//         enquiry.quotationStatus = 'Rejected';
//         await enquiry.save();

//         res.status(200).json({
//             message: "Quotation rejected successfully",
//             quotation
//         });

//     } catch (error) {
//         console.error("Error in rejectQuotation:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// });

// const test = asyncHandler(async (req, res) => {
//     return res.status(200).json({ "msg": "hello" })
//     try {
//     } catch (error) {

//     }
// })
// const getAcceptedQuotations=

const rejectQuotation = asyncHandler(async (req, res) => {
    try {
        const { hospitalId, enquiryId, quotationId } = req.params;
        console.log("🚀 ~ quotationId:", quotationId)
        console.log("🚀 ~ enquiryId:", enquiryId)
        console.log("🚀 ~ hospitalId:", hospitalId)
        const { rejectionRemark } = req.body;

        console.log("Rejecting Quotation:", { quotationId, enquiryId, hospitalId, rejectionRemark });

        // 1️⃣ Find the quotation and ensure it belongs to the hospital and enquiry
        const quotation = await Quotation.findOne({
            _id: quotationId,
            enquiry: enquiryId,
            from: hospitalId   // changed from "from: customerId"
        });

        if (!quotation) {
            return res.status(404).json({
                message: "Quotation not found for the provided hospital and enquiry"
            });
        }

        // 2️⃣ Prevent rejecting already accepted quotations
        if (quotation.quotationStatus === "Accepted") {
            return res.status(400).json({
                message: "Cannot reject a quotation that has already been accepted"
            });
        }

        // 3️⃣ Reject the quotation
        quotation.quotationStatus = "Rejected";
        quotation.rejectionRemark = rejectionRemark;
        await quotation.save();
        // 4️⃣ Find and update the corresponding enquiry
        const enquiry = await Enquiry.findOne({
            _id: enquiryId,
            hospital: hospitalId   // changed from "customer: customerId"
        });
        if (!enquiry) {
            return res.status(404).json({
                message: "Related enquiry not found for the hospital"
            });
        }
        enquiry.enquiryStatus = "Rejected";
        enquiry.quotationStatus = "Rejected";
        await enquiry.save();

        res.status(200).json({
            message: "Quotation rejected successfully",
            quotation
        });
    } catch (error) {
        console.error("Error in rejectQuotation:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});


const acceptQuotationPDF = asyncHandler(async (req, res) => {
    try {
        const { quotationId } = req.params; // quotationId from URL
        const file = req.file; // uploaded pdf (make sure multer middleware is used)

        if (!file) {
            return res.status(400).json({ message: "No PDF file uploaded" });
        }

        // Upload file to AWS S3
        const { url, key } = await uploadToS3(file, "quotations"); // return { url, key }
        // Update quotation record
        const updatedQuotation = await Quotation.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(quotationId) },
            {
                customersPDF: url,
                quotationStatus: "Accepted",
            },
            { new: true }
        );

        if (!updatedQuotation) {
            return res.status(404).json({ message: "Quotation not found" });
        }

        res.status(200).json({
            message: "Quotation accepted and PDF uploaded successfully",
            quotation: updatedQuotation,
        });
    } catch (error) {
        console.error("Error in acceptQuotationPDF:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});


const downloadQuotationPdf = asyncHandler(async (req, res) => {
    try {
        const { hospitalId, quotationId } = req.params;
        console.log("🚀 ~ quotationId:", quotationId)
        console.log("🚀 ~ hospitalId:", hospitalId)

        if (!quotationId || !hospitalId) {
            return res.status(400).json({
                success: false,
                message: "quotationId and hospitalId are required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "PDF file is required",
            });
        }

        // 1️⃣ Upload file to S3
        const { url } = await uploadToS3(req.file);

        // 2️⃣ Save URL in MongoDB
        const quotation = await Quotation.findByIdAndUpdate(
            quotationId,
            {
                $set: {
                    pdfUrl: url,
                    hospital: hospitalId, // ensures hospital is linked
                },
            },
            { new: true }
        );

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Quotation PDF uploaded successfully",
            pdfUrl: url,
            quotation,
        });
    } catch (error) {
        console.error("Error uploading quotation PDF:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
});


const shareQuotation = asyncHandler(async (req, res) => {
    try {
        const { hospitalId, enquiryId, quotationId } = req.params;
        console.log("🚀 ~ quotationId:", quotationId)
        console.log("🚀 ~ enquiryId:", enquiryId)
        console.log("🚀 ~ hospitalId:", hospitalId)

        if (!hospitalId || !enquiryId || !quotationId) {
            return res.status(400).json({
                success: false,
                message: "hospitalId, enquiryId, and quotationId are required",
            });
        }

        // Find the quotation by quotationId and enquiryId
        const quotation = await Quotation.findOne({
            _id: quotationId,
            enquiry: enquiryId,
        });

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found for the given IDs",
            });
        }

        if (!quotation.pdfUrl) {
            return res.status(400).json({
                success: false,
                message: "Quotation PDF not uploaded yet. Cannot share.",
            });
        }

        // Return the existing PDF URL
        res.status(200).json({
            success: true,
            message: "Quotation PDF shared successfully",
            data: {
                hospitalId,
                enquiryId,
                quotationId,
                pdfUrl: quotation.pdfUrl, // ✅ fetched from the quotation itself
            },
        });
    } catch (error) {
        console.error("Error sharing quotation:", error);
        res.status(500).json({
            success: false,
            message: "Failed to share quotation",
            error: error.message,
        });
    }
});

//mobile
const getQuotationPdfUrl = asyncHandler(async (req, res) => {
    try {
        const { hospitalId, enquiryId } = req.params;

        if (!hospitalId || !enquiryId) {
            return res.status(400).json({
                success: false,
                message: "hospitalId and enquiryId are required",
            });
        }

        // Find the quotation for the given hospital and enquiry
        const quotation = await Quotation.findOne({
            from: hospitalId,
            enquiry: enquiryId,
        }).select("pdfUrl"); // Only select the pdfUrl field

        if (!quotation || !quotation.pdfUrl) {
            return res.status(404).json({
                success: false,
                message: "Quotation PDF not found for the given hospital and enquiry",
            });
        }
        res.status(200).json({
            success: true,
            pdfUrl: quotation.pdfUrl,
        });
    } catch (error) {
        console.error("Error fetching quotation PDF URL:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch quotation PDF URL",
            error: error.message,
        });
    }
});


export default { acceptQuotation, rejectQuotation, createQuotationByEnquiryId, getQuotationByEnquiryId, getQuotationByIds, acceptQuotationPDF, downloadQuotationPdf, shareQuotation, getQuotationPdfUrl }