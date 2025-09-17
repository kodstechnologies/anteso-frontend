import Manufacturer from '../../models/manufacturer.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/AsyncHandler.js'

const addManufacturer = asyncHandler(async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password, // if you store hashed password in User
            city,
            state,
            pincode,
            branch,
            mouValidity,
            qaTests,
            services,
            travelCost,
        } = req.body;

        const manufacturer = new Manufacturer({
            name,
            email,
            phone,
            password, // make sure you hash password if required
            city,
            state,
            pincode,
            branch,
            mouValidity,
            qaTests,
            services,
            travelCost,
            role: "Manufacturer", // optional if you want to distinguish
        });

        await manufacturer.save();

        res.status(201).json({
            success: true,
            message: "Manufacturer created successfully",
            data: manufacturer,
        });
    } catch (error) {
        console.error("Error creating manufacturer:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create manufacturer",
            error: error.message,
        });
    }
});


const getManufacturerById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const manufacturer = await Manufacturer.findById(id)
            .select("-password") // exclude password for safety
            .lean();

        if (!manufacturer) {
            throw new ApiError(404, "Manufacturer not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, manufacturer, "Manufacturer fetched successfully"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    error.statusCode || 500,
                    null,
                    error.message || "Something went wrong"
                )
            );
    }
});


const editManufacturer = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // ✅ Check if manufacturer exists
        let manufacturer = await Manufacturer.findById(id);
        if (!manufacturer) {
            throw new ApiError(404, "Manufacturer not found");
        }

        // ✅ Update manufacturer
        manufacturer = await Manufacturer.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password"); // exclude sensitive fields

        return res
            .status(200)
            .json(new ApiResponse(200, manufacturer, "Manufacturer updated successfully"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    error.statusCode || 500,
                    null,
                    error.message || "Something went wrong while updating manufacturer"
                )
            );
    }
});


const deleteManufacturer = async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Check if manufacturer exists
        const manufacturer = await Manufacturer.findById(id);
        if (!manufacturer) {
            throw new ApiError(404, "Manufacturer not found");
        }

        // ✅ Delete manufacturer
        await Manufacturer.findByIdAndDelete(id);

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Manufacturer deleted successfully"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    error.statusCode || 500,
                    null,
                    error.message || "Something went wrong while deleting manufacturer"
                )
            );
    }
};


export default { addManufacturer, getManufacturerById, editManufacturer, deleteManufacturer }