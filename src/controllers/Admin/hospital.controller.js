// controllers/hospital.controller.js

import Hospital from '../../models/hospital.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { hospitalSchema } from '../../validators/hospitalValidators.js';
import mongoose from 'mongoose';
import Client from '../../models/client.model.js';

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

//hospital by client
const createHospitalByClientId = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const client = await Client.findById(id);
        if (!client) throw new ApiError(404, 'Client not found');

        const newHospital = await Hospital.create(req.body);
        client.hospitals.push(newHospital._id);
        await client.save();

        return res.status(201).json(
            new ApiResponse(201, newHospital, 'Hospital added to client')
        );
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiResponse(error.statusCode || 500, null, error.message || 'Something went wrong')
        );
    }
});

const updateHospitalByClientIdAndHospitalId = asyncHandler(async (req, res) => {
    try {
        const { clientId, hospitalId } = req.params;
        console.log("🚀 ~ updateHospitalByClientId ~ hospitalId:", hospitalId)
        console.log("🚀 ~ updateHospitalByClientId ~ clientId:", clientId)

        const client = await Client.findById(clientId);
        if (!client || !client.hospitals.includes(hospitalId)) {
            throw new ApiError(404, 'Hospital not associated with this client');
        }

        const updatedHospital = await Hospital.findByIdAndUpdate(hospitalId, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedHospital) throw new ApiError(404, 'Hospital not found');

        return res.status(200).json(
            new ApiResponse(200, updatedHospital, 'Hospital updated successfully')
        );
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiResponse(error.statusCode || 500, null, error.message || 'Something went wrong')
        );
    }
});

const deleteHospitalByClientId = asyncHandler(async (req, res) => {
    try {
        const { clientId, hospitalId } = req.params;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(clientId) || !mongoose.Types.ObjectId.isValid(hospitalId)) {
            throw new ApiError(400, 'Invalid ID format');
        }

        // Find client and hospital
        const client = await Client.findById(clientId);
        if (!client || !client.hospitals.includes(hospitalId)) {
            throw new ApiError(404, 'Hospital not associated with this client');
        }

        const hospital = await Hospital.findById(hospitalId);
        if (!hospital) {
            throw new ApiError(404, 'Hospital not found');
        }

        // Delete all RSOs linked to the hospital
        if (hospital.rsos && hospital.rsos.length > 0) {
            await RSO.deleteMany({ _id: { $in: hospital.rsos } });
        }

        // Delete all Institutes linked to the hospital
        if (hospital.institutes && hospital.institutes.length > 0) {
            await Institute.deleteMany({ _id: { $in: hospital.institutes } });
        }

        // Delete the hospital
        await Hospital.findByIdAndDelete(hospitalId);

        // Remove hospital reference from client
        client.hospitals.pull(hospitalId);
        await client.save();

        return res.status(200).json(
            new ApiResponse(200, null, 'Hospital and all associated RSOs & Institutes deleted successfully')
        );

    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiResponse(error.statusCode || 500, null, error.message || 'Something went wrong')
        );
    }
});


const getAllHospitalsByClientId = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const client = await Client.findById(id).populate({
            path: 'hospitals',
            populate: [
                { path: 'rsos' },        // Assuming field name is 'rsos' in Hospital schema
                { path: 'institutes' }   // Assuming field name is 'institutes' in Hospital schema
            ]
        });

        if (!client) {
            throw new ApiError(404, 'Client not found');
        }

        return res.status(200).json(
            new ApiResponse(200, client.hospitals, 'Hospitals (with RSOs & Institutes) fetched for client')
        );
    } catch (error) {
        return res.status(error.statusCode || 500).json(
            new ApiResponse(error.statusCode || 500, null, error.message || 'Something went wrong')
        );
    }
});


const getHospitalByClientIdAndHospitalId = asyncHandler(async (req, res) => {
    try {
        const { clientId, hospitalId } = req.params;

        // Find the client and populate hospitals with nested RSOs & Institutes
        const client = await Client.findById(clientId).populate({
            path: 'hospitals',
            populate: [
                { path: 'rsos' },
                { path: 'institutes' }
            ]
        });

        if (!client) {
            throw new ApiError(404, 'Client not found');
        }

        // Check if the hospital exists in client's hospitals array
        const hospital = client.hospitals.find(
            (h) => h._id.toString() === hospitalId
        );

        if (!hospital) {
            throw new ApiError(404, 'Hospital not associated with this client');
        }

        return res.status(200).json(
            new ApiResponse(200, hospital, 'Hospital fetched successfully with RSOs & Institutes')
        );
    } catch (error) {
        console.error("Error in getHospitalByClientIdAndHospitalId:", error);
        return res.status(error.statusCode || 500).json(
            new ApiResponse(error.statusCode || 500, null, error.message || 'Internal Server Error')
        );
    }
});



export default {
    add,
    deleteById,
    updateById,
    getById,
    getAll,
    getAllHospitalsByClientId,
    deleteHospitalByClientId,
    updateHospitalByClientIdAndHospitalId,
    createHospitalByClientId,
    getHospitalByClientIdAndHospitalId
};
