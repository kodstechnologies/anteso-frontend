import Enquiry from "../../models/enquiry.model.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { enquirySchema } from "../../validators/enquiryValidators.js";
import mongoose from "mongoose";
import User from "../../models/user.model.js";
import Quotation from "../../models/quotation.model.js";

// const add = asyncHandler(async (req, res) => {
//     try {
//         // Validate input
//         const { error, value } = enquirySchema.validate(req.body, {
//             abortEarly: false,
//         });

//         if (error) {
//             const errorMessages = error.details.map((err) => err.message);
//             throw new ApiError(400, "Validation failed", errorMessages);
//         }

//         // 1. Create the enquiry
//         const newEnquiry = await Enquiry.create(value);

//         // 2. Push this enquiry to the related customer (if customer exists)
//         if (newEnquiry.customer) {
//             await User.findByIdAndUpdate(
//                 newEnquiry.customer,
//                 { $push: { enquiries: newEnquiry._id } },
//                 { new: true }
//             );
//         }

//         // 3. Return response
//         return res
//             .status(201)
//             .json(new ApiResponse(201, newEnquiry, "Enquiry created successfully"));
//     } catch (error) {
//         console.error("Create Enquiry Error:", error);
//         throw new ApiError(500, "Failed to create enquiry", [error.message]);
//     }
// });



// const add = asyncHandler(async (req, res) => {
//     try {
//         // Validate input
//         const { error, value } = enquirySchema.validate(req.body, {
//             abortEarly: false,
//         });

//         if (error) {
//             const errorMessages = error.details.map((err) => err.message);
//             throw new ApiError(400, "Validation failed", errorMessages);
//         }

//         let customerId = value.customer;

//         // Check if customer exists (based on email or phone)
//         if (!customerId) {
//             const { emailAddress, contactNumber, hospitalName } = value;
//             let existingCustomer = null;
//             if (emailAddress) {
//                 existingCustomer = await User.findOne({ emailAddress });
//             } else if (contactNumber) {
//                 existingCustomer = await User.findOne({ contactNumber });
//             }
//             if (!existingCustomer) {
//                 // Create a new customer
//                 const newCustomer = await User.create({
//                     name: hospitalName,
//                     email: emailAddress,
//                     phone: contactNumber,
//                 });
//                 customerId = newCustomer._id;
//             } else {
//                 customerId = existingCustomer._id;
//             }
//             value.customer = customerId;
//         }
//         // Create the enquiry
//         const newEnquiry = await Enquiry.create(value);
//         // Push this enquiry to the related customer
//         await User.findByIdAndUpdate(
//             customerId,
//             { $push: { enquiries: newEnquiry._id } },
//             { new: true }
//         );
//         return res
//             .status(201)
//             .json(new ApiResponse(201, newEnquiry, "Enquiry created successfully"));
//     } catch (error) {
//         console.error("Create Enquiry Error:", error);
//         throw new ApiError(500, "Failed to create enquiry", [error.message]);
//     }
// });

const add = asyncHandler(async (req, res) => {
    try {
        // ✅ Validate input
        const { error, value } = enquirySchema.validate(req.body, {
            abortEarly: false,
        });

        if (error) {
            const errorMessages = error.details.map((err) => err.message);
            throw new ApiError(400, "Validation failed", errorMessages);
        }

        let customerId = value.customer;

        // ✅ Check if customer exists (based on email or phone)
        if (!customerId) {
            const { emailAddress, contactNumber, hospitalName } = value;

            let existingCustomer = null;
            if (emailAddress) {
                existingCustomer = await User.findOne({ emailAddress });
            } else if (contactNumber) {
                existingCustomer = await User.findOne({ contactNumber });
            }

            if (!existingCustomer) {
                // Create a new customer
                const newCustomer = await User.create({
                    name: hospitalName,
                    email: emailAddress,
                    phone: contactNumber,
                });
                customerId = newCustomer._id;
            } else {
                customerId = existingCustomer._id;
            }
            value.customer = customerId;
        }

        // ✅ Handle file uploads to S3
        let attachments = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(async (file) => {
                const { url, key } = await uploadToS3(file);
                return {
                    filename: file.originalname,
                    key,
                    url,
                    mimetype: file.mimetype,
                    size: file.size,
                };
            });

            attachments = await Promise.all(uploadPromises);
        }

        // ✅ Attach files to enquiry payload
        value.attachments = attachments;

        // ✅ Create the enquiry
        const newEnquiry = await Enquiry.create(value);

        // ✅ Link enquiry to customer
        await User.findByIdAndUpdate(
            customerId,
            { $push: { enquiries: newEnquiry._id } },
            { new: true }
        );

        return res
            .status(201)
            .json(new ApiResponse(201, newEnquiry, "Enquiry created successfully"));
    } catch (error) {
        console.error("Create Enquiry Error:", error);
        throw new ApiError(500, "Failed to create enquiry", [error.message]);
    }
});

const addByCustomerId = asyncHandler(async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!customerId) {
            throw new ApiError(400, "Customer ID is required");
        }

        // ✅ Ensure customer exists
        const existingCustomer = await User.findById(customerId);
        if (!existingCustomer) {
            throw new ApiError(404, "Customer not found");
        }

        // ✅ Validate enquiry input
        const { error, value } = enquirySchema.validate(req.body, {
            abortEarly: false,
        });

        if (error) {
            const errorMessages = error.details.map((err) => err.message);
            throw new ApiError(400, "Validation failed", errorMessages);
        }

        // ✅ Force customer ID into payload
        value.customer = customerId;

        // ✅ Handle file uploads to S3
        let attachments = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(async (file) => {
                const { url, key } = await uploadToS3(file);
                return {
                    filename: file.originalname,
                    key,
                    url,
                    mimetype: file.mimetype,
                    size: file.size,
                };
            });

            attachments = await Promise.all(uploadPromises);
        }

        value.attachments = attachments;

        // ✅ Create enquiry
        const newEnquiry = await Enquiry.create(value);

        // ✅ Link enquiry to customer
        await User.findByIdAndUpdate(
            customerId,
            { $push: { enquiries: newEnquiry._id } },
            { new: true }
        );

        return res
            .status(201)
            .json(new ApiResponse(201, newEnquiry, "Enquiry created successfully"));
    } catch (error) {
        console.error("Create Enquiry (by customerId) Error:", error);
        throw new ApiError(500, "Failed to create enquiry", [error.message]);
    }
});

const getAll = asyncHandler(async (req, res) => {
    try {
        const enquiries = await Enquiry.find()
            .populate("customer")            // populates the customer info


        const createdQuotations = await Quotation.find({ quotationStatus: "Created" })
            .populate("enquiry")
            .populate("from"); // Optional, if you want user info

        // Log for debugging
        console.log("Created Quotations:", createdQuotations);
        console.log(enquiries.map(e => ({
            enquiryId: e.enquiryId,
            quotationStatus: e.quotationStatus || 'No quotation linked'
        })));
        return res
            .status(200)
            .json(new ApiResponse(200, enquiries, "All enquiries fetched"));
    } catch (error) {
        console.error("Get All Enquiries Error:", error);
        throw new ApiError(500, "Failed to fetch enquiries", [error.message]);
    }
});
const getById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid ID format");
        }
        const enquiry = await Enquiry.findById(id);
        if (!enquiry) {
            throw new ApiError(404, "Enquiry not found");
        }
        return res
            .status(200)
            .json(new ApiResponse(200, enquiry, "Enquiry fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to fetch enquiry", [error.message]);
    }
});
const deleteById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid ID format");
        }
        const deleted = await Enquiry.findByIdAndDelete(id);

        if (!deleted) {
            throw new ApiError(404, "Enquiry not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Enquiry deleted successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to delete enquiry", [error.message]);
    }
});
const updateById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const { error, value } = enquirySchema.validate(req.body, {
            abortEarly: false,
        });
        if (error) {
            const errorMessages = error.details.map((err) => err.message);
            throw new ApiError(400, "Validation failed", errorMessages);
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid ID format");
        }
        const updated = await Enquiry.findByIdAndUpdate(id, value, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            throw new ApiError(404, "Enquiry not found");
        }
        return res
            .status(200)
            .json(new ApiResponse(200, updated, "Enquiry updated successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to update enquiry", [error.message]);
    }
});
const getEnquiryDetailsById = async (req, res) => {
    try {
        const enquiryId = req.params.id;

        const enquiry = await Enquiry.findById(enquiryId)
            .populate({
                path: 'customer',
                model: 'User', // or 'Customer' if you’re using discriminator names
                select: 'name email phone address role ',
            });

        if (!enquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }
        const additionalServices = enquiry.additionalServices || {};

        return res.status(200).json({
            enquiryId: enquiry.enquiryId,
            hospitalName: enquiry.hospitalName,
            customer: enquiry.customer,
            machines: enquiry.services, // includes machineType, equipmentNo, etc.
            additionalServices,
        });
    } catch (err) {
        console.error('Error fetching enquiry details:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getByCustomerIdEnquiryId = async (req, res) => {
    try {
        const { id: enquiryId, customerId } = req.params; // both enquiryId & customerId from params

        if (!enquiryId || !customerId) {
            return res.status(400).json({
                success: false,
                message: 'Enquiry ID and Customer ID are required'
            });
        }

        const enquiry = await Enquiry.findOne({
            _id: enquiryId,
            customer: customerId
        }).populate({
            path: 'customer',
            model: 'User', // or 'Customer' depending on your schema
            select: 'name email phone address role'
        });

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found for this customer'
            });
        }

        const additionalServices = enquiry.additionalServices || {};

        return res.status(200).json({
            success: true,
            enquiryId: enquiry.enquiryId,
            hospitalName: enquiry.hospitalName,
            customer: enquiry.customer,
            machines: enquiry.services, // includes machineType, equipmentNo, etc.
            additionalServices,
        });
    } catch (err) {
        console.error('Error fetching enquiry details:', err);
        return res.status(500).json({
            success: false,
            message: err?.message || 'Server error'
        });
    }
};

export default { add, getById, deleteById, updateById, getAll, getEnquiryDetailsById, addByCustomerId, getByCustomerIdEnquiryId };