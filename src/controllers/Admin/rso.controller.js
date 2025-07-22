import mongoose from 'mongoose';
import Joi from 'joi';
import RSO from '../../models/rso.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { rsoSchema } from '../../validators/rsoValidators.js';

// Create
const add = asyncHandler(async (req, res) => {
    try {
        const { error, value } = rsoSchema.validate(req.body, { abortEarly: false });

        if (error) {
            throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
        }

        const newRSO = await RSO.create(value);
        return res.status(201).json(new ApiResponse(201, newRSO, 'RSO created successfully'));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong');
    }
});

// Get All (with pagination)
const getAll = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const rsos = await RSO.find().skip(skip).limit(limit);
        const total = await RSO.countDocuments();

        return res.status(200).json(new ApiResponse(200, {
            rsos,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total
        }, 'RSOs fetched successfully'));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong');
    }
});

// Get by ID
const getById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, 'Invalid ID format');
        }

        const rso = await RSO.findById(id);
        if (!rso) {
            throw new ApiError(404, 'RSO not found');
        }

        return res.status(200).json(new ApiResponse(200, rso, 'RSO fetched successfully'));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong');
    }
});

// Update by ID
const updateById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, 'Invalid ID format');
        }

        const { error, value } = rsoSchema.validate(req.body, { abortEarly: false });
        if (error) {
            throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
        }

        const updatedRSO = await RSO.findByIdAndUpdate(id, value, { new: true });
        if (!updatedRSO) {
            throw new ApiError(404, 'RSO not found');
        }

        return res.status(200).json(new ApiResponse(200, updatedRSO, 'RSO updated successfully'));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong');
    }
});

// Delete by ID
const deleteById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, 'Invalid ID format');
        }

        const deletedRSO = await RSO.findByIdAndDelete(id);
        if (!deletedRSO) {
            throw new ApiError(404, 'RSO not found');
        }

        return res.status(200).json(new ApiResponse(200, deletedRSO, 'RSO deleted successfully'));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong');
    }
});

export default {
    add,
    getAll,
    getById,
    updateById,
    deleteById
};
