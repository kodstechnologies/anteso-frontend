// controllers/hospital.controller.js

import Hospital from '../../models/hospital.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { hospitalSchema } from '../../validators/hospitalValidators.js';
import mongoose from 'mongoose';

// CREATE
const add = asyncHandler(async (req, res) => {
    try {
        const { error, value } = hospitalSchema.validate(req.body, { abortEarly: false });
        if (error) {
            throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
        }

        const newHospital = await Hospital.create(value);
        return res.status(201).json(new ApiResponse(201, newHospital, 'Hospital created successfully'));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong', error.errors || [], error.stack);
    }
});

// DELETE
const deleteById = asyncHandler(async (req, res) => {
    try {
        //    return res.status(200).json({mag:"hi"})
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid ID format");
        }
        const hospital = await Hospital.findByIdAndDelete(id);

        if (!hospital) {
            throw new ApiError(404, 'Hospital not found');
        }
        return res.status(200).json(new ApiResponse(200, hospital, 'Hospital deleted successfully'));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong', error.errors || [], error.stack);
    }
});

// UPDATE
const updateById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = hospitalSchema.validate(req.body, { abortEarly: false });
        if (error) {
            throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid ID format");
        }
        const updatedHospital = await Hospital.findByIdAndUpdate(id, value, { new: true });
        if (!updatedHospital) {
            throw new ApiError(404, 'Hospital not found');
        }
        return res.status(200).json(new ApiResponse(200, updatedHospital, 'Hospital updated successfully'));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong', error.errors || [], error.stack);
    }
});

// GET BY ID
const getById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid ID format");
        }
        const hospital = await Hospital.findById(id);
        if (!hospital) {
            throw new ApiError(404, 'Hospital not found');
        }
        return res.status(200).json(new ApiResponse(200, hospital, 'Hospital fetched successfully'));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong', error.errors || [], error.stack);
    }
});

// GET ALL
const getAll = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // default to page 1
        const limit = 10; // fixed 10 items per page
        const skip = (page - 1) * limit;

        const hospitals = await Hospital.find().skip(skip).limit(limit);
        const total = await Hospital.countDocuments();

        return res.status(200).json(new ApiResponse(200, {
            hospitals,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
        }, 'Hospitals fetched successfully'));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong', error.errors || [], error.stack);
    }
});


export default {
    add,
    deleteById,
    updateById,
    getById,
    getAll,
};
