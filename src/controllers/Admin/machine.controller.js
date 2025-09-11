import Machine from '../../models/machine.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { machineSchema } from '../../validators/machineValidator.js';
import Customer from '../../models/client.model.js'
import { uploadToS3 } from '../../utils/s3Upload.js';
import { getMultipleFileUrls } from '../../utils/s3Fetch.js';
import Hospital from '../../models/hospital.model.js'

// ADD MACHINE
// const add = asyncHandler(async (req, res) => {
//     try {
//         const {
//             machineType,
//             make,
//             model,
//             serialNumber,
//             equipmentId,
//             qaValidity,
//             licenseValidity,
//             status,
//         } = req.body;

//         const { customerId } = req.params;

//         const { error } = machineSchema.validate({
//             machineType,
//             make,
//             model,
//             serialNumber,
//             equipmentId,
//             qaValidity,
//             licenseValidity,
//             status,
//         });

//         if (error) {
//             throw new ApiError(400, error.details[0].message);
//         }

//         const qaReportAttachment = req.files?.qaReportAttachment?.[0]?.path;
//         const licenseReportAttachment = req.files?.licenseReportAttachment?.[0]?.path;
//         const rawDataAttachment = req.files?.rawDataAttachment?.[0]?.path || null;

//         const existingCustomer = await Customer.findById(customerId);
//         if (!existingCustomer) {
//             throw new ApiError(404, "Customer not found.");
//         }

//         const machine = await Machine.create({
//             machineType,
//             make,
//             model,
//             serialNumber,
//             equipmentId,
//             qaValidity,
//             licenseValidity,
//             status,
//             rawDataAttachment,
//             qaReportAttachment,
//             licenseReportAttachment,
//             customer: customerId,
//         });
//         console.log("🚀 ~ machine:", machine)

//         res.status(201).json(new ApiResponse(201, machine, 'Machine added successfully.'));
//     } catch (error) {
//         console.error('Error in add machine:', error);
//         throw new ApiError(500, error?.message || 'Internal Server Error');
//     }
// });

// const add = asyncHandler(async (req, res) => {
//     try {
//         const { customerId, hospitalId } = req.params;

//         const {
//             machineType,
//             make,
//             model,
//             serialNumber,
//             equipmentId,
//             qaValidity,
//             licenseValidity,
//             status,
//         } = req.body;

//         // ✅ Validate request body
//         const { error } = machineSchema.validate({
//             machineType,
//             make,
//             model,
//             serialNumber,
//             equipmentId,
//             qaValidity,
//             licenseValidity,
//             status,
//         });
//         if (error) {
//             throw new ApiError(400, error.details[0].message);
//         }

//         // ✅ Check customer exists
//         const customer = await Customer.findById(customerId).populate("hospitals");
//         if (!customer) {
//             throw new ApiError(404, "Customer not found.");
//         }

//         // ✅ Check hospital exists and belongs to this customer
//         const hospital = await Hospital.findOne({
//             _id: hospitalId,
//             _id: { $in: customer.hospitals },
//         });
//         if (!hospital) {
//             throw new ApiError(404, "Hospital not found for this customer.");
//         }

//         // ✅ Upload files to S3 (if they exist)
//         const uploadedFiles = {};
//         if (req.files) {
//             for (const [key, fileArray] of Object.entries(req.files)) {
//                 if (fileArray.length > 0) {
//                     const s3Result = await uploadToS3(fileArray[0]);
//                     uploadedFiles[key] = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Result.key}`;
//                 }
//             }
//         }

//         // ✅ Create machine linked to hospital
//         const machine = await Machine.create({
//             machineType,
//             make,
//             model,
//             serialNumber,
//             equipmentId,
//             qaValidity,
//             licenseValidity,
//             status: status || "Active",
//             rawDataAttachment: uploadedFiles.rawDataAttachment || null,
//             qaReportAttachment: uploadedFiles.qaReportAttachment || null,
//             licenseReportAttachment: uploadedFiles.licenseReportAttachment || null,
//             hospital: hospitalId,
//         });

//         // ✅ Update hospital with this machine (replace existing since only 1 allowed)
//         hospital.machines = machine._id;
//         await hospital.save();

//         res.status(201).json(new ApiResponse(201, machine, "Machine added successfully to hospital."));
//     } catch (error) {
//         console.error("Error in addMachine:", error);
//         throw new ApiError(500, error?.message || "Internal Server Error");
//     }
// });

const add = asyncHandler(async (req, res) => {
    try {
        const { customerId, hospitalId } = req.params;

        const {
            machineType,
            make,
            model,
            serialNumber,
            equipmentId,
            qaValidity,
            licenseValidity,
        } = req.body;

        // ✅ Validate request body
        const { error } = machineSchema.validate({
            machineType,
            make,
            model,
            serialNumber,
            equipmentId,
            qaValidity,
            licenseValidity,
        });
        if (error) {
            throw new ApiError(400, error.details[0].message);
        }

        // ✅ Check customer exists
        const customer = await Customer.findById(customerId).populate("hospitals");
        if (!customer) {
            throw new ApiError(404, "Customer not found.");
        }

        // ✅ Check hospital exists and belongs to this customer
        const hospital = await Hospital.findOne({
            _id: hospitalId,
            _id: { $in: customer.hospitals },
        });
        if (!hospital) {
            throw new ApiError(404, "Hospital not found for this customer.");
        }

        // ✅ Upload files to S3 (if they exist)
        const uploadedFiles = {};
        if (req.files) {
            for (const [key, fileArray] of Object.entries(req.files)) {
                if (fileArray.length > 0) {
                    const s3Result = await uploadToS3(fileArray[0]);
                    uploadedFiles[key] = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Result.key}`;
                }
            }
        }

        // ✅ Determine machine status based on qaValidity & licenseValidity
        const today = new Date();
        const isQaExpired = new Date(qaValidity) < today;
        const isLicenseExpired = new Date(licenseValidity) < today;

        let status = "Active";
        let expiredFields = [];

        if (isQaExpired) expiredFields.push("qaValidity");
        if (isLicenseExpired) expiredFields.push("licenseValidity");

        if (expiredFields.length > 0) {
            status = "Expired";
        }

        // ✅ Create machine linked to hospital
        const machine = await Machine.create({
            machineType,
            make,
            model,
            serialNumber,
            equipmentId,
            qaValidity,
            licenseValidity,
            status,
            rawDataAttachment: uploadedFiles.rawDataAttachment || null,
            qaReportAttachment: uploadedFiles.qaReportAttachment || null,
            licenseReportAttachment: uploadedFiles.licenseReportAttachment || null,
            hospital: hospitalId,
        });

        // ✅ Update hospital with this machine (replace existing since only 1 allowed)
        hospital.machines = machine._id;
        await hospital.save();

        res.status(201).json(
            new ApiResponse(201, machine, "Machine added successfully to hospital.")
        );
    } catch (error) {
        console.error("❌ Error in addMachine:", error);
        throw new ApiError(500, error?.message || "Internal Server Error");
    }
});



// GET ALL MACHINES
// ✅ Get all machines by Hospital ID
const getAllMachinesByHospitalId = asyncHandler(async (req, res) => {
    try {
        const { hospitalId } = req.params;
        if (!hospitalId) {
            return res.status(400).json({ success: false, message: "Hospital ID is required" });
        }

        // ✅ Find machines linked to this hospital
        let machines = await Machine.find({ hospital: hospitalId })
            .populate('hospital', 'name gstNo');

        if (!machines || machines.length === 0) {
            return res.status(404).json({ success: false, message: "No machines found for this hospital" });
        }

        const today = new Date();

        // ✅ Add signed URLs & expiry status
        const machinesWithUrls = await Promise.all(
            machines.map(async (machine) => {
                const rawDataUrls = machine.rawDataAttachment
                    ? await getMultipleFileUrls([machine.rawDataAttachment])
                    : [];
                const qaReportUrls = machine.qaReportAttachment
                    ? await getMultipleFileUrls([machine.qaReportAttachment])
                    : [];
                const licenseReportUrls = machine.licenseReportAttachment
                    ? await getMultipleFileUrls([machine.licenseReportAttachment])
                    : [];

                // ✅ Check expiry
                const isQaExpired = machine.qaValidity < today;
                console.log("🚀 ~ isQaExpired:", isQaExpired)
                const isLicenseExpired = machine.licenseValidity < today;
                console.log("🚀 ~ isLicenseExpired:", isLicenseExpired)

                let status = "Active";
                let expiredFields = [];

                if (isQaExpired) expiredFields.push("qaValidity");
                if (isLicenseExpired) expiredFields.push("licenseValidity");

                if (expiredFields.length > 0) {
                    status = "Expired";
                }

                return {
                    ...machine.toObject(),
                    status,
                    expiredFields,           // ["qaValidity"], ["licenseValidity"], etc.
                    rawDataAttachmentUrls: rawDataUrls,
                    qaReportAttachmentUrls: qaReportUrls,
                    licenseReportAttachmentUrls: licenseReportUrls,
                };
            })
        );

        res.status(200).json(
            new ApiResponse(200, machinesWithUrls, "Machines fetched successfully by hospital")
        );
    } catch (error) {
        console.error("❌ Error fetching machines by hospital ID:", error);
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});


// GET MACHINE BY ID
const getById = asyncHandler(async (req, res) => {
    try {
        const { id, hospitalId } = req.params;

        if (!id || !hospitalId) {
            return res.status(400).json({ success: false, message: 'Machine ID and Hospital ID are required' });
        }

        // ✅ Find machine by id and hospital
        const machine = await Machine.findOne({
            _id: id,
            hospital: hospitalId,
        }).populate({
            path: 'hospital',
            populate: [
                { path: 'rsos', model: 'RSO' },
                { path: 'institutes', model: 'Institute' }
            ]
        });

        if (!machine) {
            throw new ApiError(404, 'Machine not found for this hospital');
        }

        res.status(200).json(new ApiResponse(200, machine, 'Machine fetched successfully.'));
    } catch (error) {
        console.error("❌ Error fetching machine by ID and hospital:", error);
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});


// UPDATE MACHINE BY ID and customerId
const updateById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { customerId } = req.query;
        let query = { _id: id };
        if (customerId) {
            query = { _id: id, client: customerId };
        }

        const existingMachine = await Machine.findOne(query);
        if (!existingMachine) {
            throw new ApiError(404, 'Machine not found for the given customer');
        }

        const {
            machineType,
            make,
            model,
            serialNumber,
            equipmentId,
            qaValidity,
            licenseValidity,
            client,
        } = req.body;

        const { error } = machineSchema.validate(req.body);
        if (error) {
            throw new ApiError(400, error.details[0].message);
        }

        const qaReportAttachment = req.files?.qaReportAttachment?.[0]?.path || existingMachine.qaReportAttachment;
        const licenseReportAttachment = req.files?.licenseReportAttachment?.[0]?.path || existingMachine.licenseReportAttachment;
        const rawDataAttachment = req.files?.rawDataAttachment?.[0]?.path || existingMachine.rawDataAttachment;

        existingMachine.machineType = machineType;
        existingMachine.make = make;
        existingMachine.model = model;
        existingMachine.serialNumber = serialNumber;
        existingMachine.equipmentId = equipmentId;
        existingMachine.qaValidity = qaValidity;
        existingMachine.licenseValidity = licenseValidity;

        existingMachine.client = client;
        existingMachine.qaReportAttachment = qaReportAttachment;
        existingMachine.licenseReportAttachment = licenseReportAttachment;
        existingMachine.rawDataAttachment = rawDataAttachment;

        await existingMachine.save();

        res.status(200).json(new ApiResponse(200, existingMachine, 'Machine updated successfully.'));
    } catch (error) {
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});
// DELETE MACHINE BY ID
const deleteById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        console.log("hi");

        console.log("🚀 ~ id:", id)
        const { customerId } = req.query;
        console.log("🚀 ~ customerId:", customerId)

        let query = { _id: id };
        if (customerId) {
            query = { _id: id, client: customerId };
        }

        const deletedMachine = await Machine.findOneAndDelete(query);

        if (!deletedMachine) {
            throw new ApiError(404, 'Machine not found for the given customer');
        }

        res.status(200).json(new ApiResponse(200, deletedMachine, 'Machine deleted successfully.'));
    } catch (error) {
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});

const searchByType = asyncHandler(async (req, res) => {
    try {
        const { type } = req.query;
        const { hospitalId } = req.params;
        console.log("🚀 ~ hospitalId:", hospitalId);

        if (!type) {
            return res.status(400).json({ success: false, message: "Machine type is required" });
        }

        if (!hospitalId) {
            return res.status(400).json({ success: false, message: "Hospital ID is required" });
        }

        // ✅ Search by machine type within a specific hospital
        const machines = await Machine.find({
            machineType: { $regex: type, $options: "i" },
            hospital: hospitalId,
        });

        if (!machines || machines.length === 0) {
            return res.status(404).json({ success: false, message: "No machines found for this type in this hospital" });
        }

        res.status(200).json(new ApiResponse(200, machines, "Machines fetched successfully by type"));
    } catch (error) {
        console.error("❌ Error in searchByType:", error);
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});

export default { add, getById, updateById, deleteById, searchByType, getAllMachinesByHospitalId }