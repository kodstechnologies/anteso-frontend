import Enquiry from "../../models/enquiry.model.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { enquirySchema } from "../../validators/enquiryValidators.js";
import mongoose from "mongoose";

const add = asyncHandler(async (req, res) => {
    try {
        // Validate input
        const { error, value } = enquirySchema.validate(req.body, {
            abortEarly: false,
        });

        if (error) {

            const errorMessages = error.details.map((err) => err.message);
            throw new ApiError(400, "Validation failed", errorMessages);
        }

        const newEnquiry = await Enquiry.create(value);

        return res
            .status(201)
            .json(new ApiResponse(201, newEnquiry, "Enquiry created successfully"));
    } catch (error) {
        console.error("Create Enquiry Error:", error); // 👈 Add this

        throw new ApiError(500, "Failed to create enquiry", [error.message]);
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

export default { add, getById, deleteById, updateById };
