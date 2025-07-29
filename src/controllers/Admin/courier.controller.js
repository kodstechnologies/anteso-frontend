import { asyncHandler } from "../../utils/AsyncHandler.js";
import Courier from "../../models/courier.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const addCourier = asyncHandler(async (req, res) => {
    console.log("📦 Payload received:", req.body);

    const { courierCompanyName, trackingId, trackingUrl, status } = req.body;

    if (!courierCompanyName) {
        throw new ApiError(400, "Courier company name is required");
    }

    const newCourier = await Courier.create({
        courierCompanyName,
        trackingId,
        trackingUrl,
        status: status || "Active",
    });

    res.status(201).json(new ApiResponse(201, newCourier, "Courier company added successfully"));
});


const getAllCompanies = asyncHandler(async (req, res) => {
    const companies = await Courier.find().sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, companies, "Courier companies fetched successfully"));
});

// Get single courier company by ID
const getCompanyById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const company = await Courier.findById(id);
    if (!company) {
        throw new ApiError(404, "Courier company not found");
    }

    res.status(200).json(new ApiResponse(200, company, "Courier company fetched successfully"));
});


const deleteCompanyById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deleted = await Courier.findByIdAndDelete(id);
    if (!deleted) {
        throw new ApiError(404, "Courier company not found");
    }

    res.status(200).json(new ApiResponse(200, deleted, "Courier company deleted successfully"));
});
const updateCourierById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { courierCompanyName, trackingId, trackingUrl, status } = req.body;

    const updatedCourier = await Courier.findByIdAndUpdate(
        id,
        {
            $set: {
                courierCompanyName,
                trackingId,
                trackingUrl,
                status,
            },
        },
        { new: true, runValidators: true }
    );

    if (!updatedCourier) {
        throw new ApiError(404, "Courier company not found");
    }

    res.status(200).json(new ApiResponse(200, updatedCourier, "Courier company updated successfully"));
});

export default {
    addCourier,
    getAllCompanies,
    getCompanyById,
    deleteCompanyById,
    updateCourierById
};
