import mongoose from 'mongoose';
import Institute from '../../models/institute.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { instituteSchema } from '../../validators/instituteValidators.js';

// ADD Institute
const add = asyncHandler(async (req, res) => {
    const { error, value } = instituteSchema.validate(req.body, { abortEarly: false });

    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    try {
        const newInstitute = await Institute.create(value);
        return res.status(201).json(new ApiResponse(201, newInstitute, 'Institute created successfully'));
    } catch (err) {
        throw new ApiError(500, err.message || 'Failed to create Institute');
    }
});

// GET ALL Institutes with Pagination
const getAll = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [institutes, total] = await Promise.all([
            Institute.find().skip(skip).limit(limit),
            Institute.countDocuments()
        ]);

        return res.status(200).json(
            new ApiResponse(200, {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                data: institutes
            }, 'Institutes fetched successfully')
        );
    } catch (error) {
        throw new ApiError(500, error.message || 'Failed to fetch Institutes');
    }
});

// GET Institute by ID
const getById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid Institute ID format');
    }

    try {
        const institute = await Institute.findById(id);
        if (!institute) {
            throw new ApiError(404, 'Institute not found');
        }

        return res.status(200).json(new ApiResponse(200, institute, 'Institute fetched successfully'));
    } catch (error) {
        throw new ApiError(500, error.message || 'Failed to fetch Institute');
    }
});

// UPDATE Institute by ID
const updateById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid Institute ID format');
    }

    const { error, value } = instituteSchema.validate(req.body, { abortEarly: false });
    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    try {
        const updatedInstitute = await Institute.findByIdAndUpdate(id, value, {
            new: true,
            runValidators: true
        });

        if (!updatedInstitute) {
            throw new ApiError(404, 'Institute not found');
        }

        return res.status(200).json(new ApiResponse(200, updatedInstitute, 'Institute updated successfully'));
    } catch (error) {
        throw new ApiError(500, error.message || 'Failed to update Institute');
    }
});

// DELETE Institute by ID
const deleteById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid Institute ID format');
    }

    try {
        const deleted = await Institute.findByIdAndDelete(id);
        if (!deleted) {
            throw new ApiError(404, 'Institute not found');
        }

        return res.status(200).json(new ApiResponse(200, deleted, 'Institute deleted successfully'));
    } catch (error) {
        throw new ApiError(500, error.message || 'Failed to delete Institute');
    }
});

export default {
    add,
    getAll,
    getById,
    updateById,
    deleteById
};
