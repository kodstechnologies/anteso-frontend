import mongoose from 'mongoose';
import Joi from 'joi';
import RSO from '../../models/rso.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { rsoSchema } from '../../validators/rsoValidators.js';
import Client from '../../models/client.model.js';
import Hospital from '../../models/hospital.model.js';

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

//RSO by clientId
const creatersoByClientId = asyncHandler(async (req, res) => {
    try {
        const { clientId } = req.params;
        console.log("🚀 ~ creatersoByClientId ~ clientId:", clientId)
        const {
            rsoId,
            password,
            email,
            phone,
            rpId,
            tldBadge,
            validity,
            attachment
        } = req.body;
        console.log("🚀 ~ req.body:", req.body)

        const client = await Client.findById(clientId);
        if (!client) {
            throw new ApiError(404, 'Client not found');
        }

        const existingRSO = await RSO.findOne({ rsoId });
        if (existingRSO) {
            throw new ApiError(409, 'RSO ID already exists');
        }

        const newRSO = await RSO.create({
            rsoId,
            password,
            email,
            phone,
            rpId,
            tldBadge,
            validity,
            attachment,
            client: client._id
        });
        client.rsos.push(newRSO._id);
        await client.save(); // Save the updated client

        res.status(201).json(new ApiResponse(201, newRSO, 'RSO created successfully'));
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json(
            new ApiResponse(error.statusCode || 500, null, error.message || 'Internal Server Error')
        );
    }
});

// GET ALL RSOs BY CLIENT
const getAllrsoByClientId = asyncHandler(async (req, res) => {
    try {
        const { clientId } = req.params;
        const rsos = await RSO.find({ client: clientId });

        res.status(200).json(new ApiResponse(200, rsos, 'All RSOs fetched'));
    } catch (error) {
        res.status(error.statusCode || 500).json(
            new ApiResponse(error.statusCode || 500, null, error.message || 'Internal Server Error')
        );
    }
});

// GET RSO BY CLIENT + RSO ID
const getrsoByClientIdAndRsoId = asyncHandler(async (req, res) => {
    try {
        const { clientId, rsoId } = req.params;
        console.log("🚀 ~ getrsoByClientIdAndRsoId ~ rsoId:", rsoId)
        console.log("🚀 ~ getrsoByClientIdAndRsoId ~ clientId:", clientId)
        const client = await Client.findById(clientId).populate('rsos');
        if (!client) throw new ApiError(404, 'Client not found');

        const rso = client.rsos.find((r) => r._id.toString() === rsoId);
        if (!rso) throw new ApiError(404, 'RSO not associated with this client');



        res.status(200).json(new ApiResponse(200, rso, 'RSO fetched successfully'));
    } catch (error) {
        res.status(error.statusCode || 500).json(
            new ApiResponse(error.statusCode || 500, null, error.message || 'Internal Server Error')
        );
    }
});

// UPDATE RSO
// const updatersoByClientId = asyncHandler(async (req, res) => {
//     try {
//         const { clientId, rsoId } = req.params;
//         console.log("🚀 ~ rsoId:", rsoId)
//         console.log("🚀 ~ clientId:", clientId)
//         const updates = req.body;

//         const rso = await RSO.findOneAndUpdate(
//             { client: clientId, _id: rsoId },
//             updates,
//             { new: true }
//         );

//         if (!rso) {
//             throw new ApiError(404, 'RSO not found');
//         }

//         res.status(200).json(new ApiResponse(200, rso, 'RSO updated successfully'));
//     } catch (error) {
//         res.status(error.statusCode || 500).json(
//             new ApiResponse(error.statusCode || 500, null, error.message || 'Internal Server Error')
//         );
//     }
// });

const updatersoByClientId = asyncHandler(async (req, res) => {
    const { clientId, rsoId } = req.params;

    const client = await Client.findById(clientId);

    if (!client) {
        throw new ApiError(404, "Client not found");
    }

    const rsoExists = client.rsos.find((r) => r.toString() === rsoId); // ✅ FIX

    if (!rsoExists) {
        throw new ApiError(404, "RSO not associated with this client");
    }

    // Now safely fetch and update the RSO
    const rso = await RSO.findById(rsoId);
    if (!rso) {
        throw new ApiError(404, "RSO not found");
    }

    // Update the RSO with req.body
    Object.assign(rso, req.body);
    await rso.save();

    return res.status(200).json(new ApiResponse(200, rso, "RSO updated successfully"));
});


// DELETE RSO
const deletersoByClientId = asyncHandler(async (req, res) => {
    try {
        const { clientId, rsoId } = req.params;

        const deleted = await RSO.findOneAndDelete({ client: clientId, _id: rsoId });

        if (!deleted) {
            throw new ApiError(404, 'RSO not found or already deleted');
        }

        res.status(200).json(new ApiResponse(200, deleted, 'RSO deleted successfully'));
    } catch (error) {
        res.status(error.statusCode || 500).json(
            new ApiResponse(error.statusCode || 500, null, error.message || 'Internal Server Error')
        );
    }
});


// ✅ Create RSO for a specific hospital
const createRsoByHospitalId = asyncHandler(async (req, res) => {
    const { hospitalId } = req.params;

    // Validate hospital ID
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        throw new ApiError(400, 'Invalid hospital ID format');
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
        throw new ApiError(404, 'Hospital not found');
    }

    // Validate request body with Joi
    const { error, value } = rsoSchema.validate(req.body, { abortEarly: false });
    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    // Prevent duplicate RSO IDs
    const existingRSO = await RSO.findOne({ rsoId: value.rsoId });
    if (existingRSO) {
        throw new ApiError(409, 'RSO ID already exists');
    }

    // Create RSO
    const newRSO = await RSO.create(value);

    // Link to hospital
    hospital.rsos.push(newRSO._id);
    await hospital.save();

    return res.status(201).json(new ApiResponse(201, newRSO, 'RSO created successfully'));
});

// ✅ Get all RSOs for a hospital
const getAllRsoByHospitalId = asyncHandler(async (req, res) => {
    const { hospitalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        throw new ApiError(400, 'Invalid hospital ID format');
    }

    const hospital = await Hospital.findById(hospitalId).populate('rsos');
    if (!hospital) {
        throw new ApiError(404, 'Hospital not found');
    }

    return res.status(200).json(new ApiResponse(200, hospital.rsos, 'RSOs fetched successfully'));
});

// ✅ Get RSO by hospitalId + rsoId
const getRsoByHospitalIdAndRsoId = asyncHandler(async (req, res) => {
    const { hospitalId, rsoId } = req.params;
    console.log("🚀 ~ rsoId:", rsoId)
    console.log("🚀 ~ hospitalId:", hospitalId)

    if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(rsoId)) {
        throw new ApiError(400, 'Invalid ID format');
    }

    const hospital = await Hospital.findById(hospitalId).populate('rsos');
    if (!hospital) {
        throw new ApiError(404, 'Hospital not found');
    }

    const rso = hospital.rsos.find(r => r._id.toString() === rsoId);
    if (!rso) {
        throw new ApiError(404, 'RSO not associated with this hospital');
    }

    return res.status(200).json(new ApiResponse(200, rso, 'RSO fetched successfully'));
});

// ✅ Update RSO for a hospital
const updateRsoByHospitalId = asyncHandler(async (req, res) => {
    const { hospitalId, rsoId } = req.params;
    console.log("🚀 ~ rsoId:", rsoId)
    console.log("🚀 ~ hospitalId:", hospitalId)

    if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(rsoId)) {
        throw new ApiError(400, 'Invalid ID format');
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
        throw new ApiError(404, 'Hospital not found');
    }

    // Ensure RSO belongs to this hospital
    if (!hospital.rsos.some(r => r.toString() === rsoId)) {
        throw new ApiError(404, 'RSO not associated with this hospital');
    }

    const { error, value } = rsoSchema.validate(req.body, { abortEarly: false });
    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    const updatedRSO = await RSO.findByIdAndUpdate(rsoId, value, { new: true });
    if (!updatedRSO) {
        throw new ApiError(404, 'RSO not found');
    }

    return res.status(200).json(new ApiResponse(200, updatedRSO, 'RSO updated successfully'));
});

// ✅ Delete RSO from hospital
const deleteRsoByHospitalId = asyncHandler(async (req, res) => {
    const { hospitalId, rsoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(rsoId)) {
        throw new ApiError(400, 'Invalid ID format');
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
        throw new ApiError(404, 'Hospital not found');
    }

    // Remove RSO reference from hospital
    hospital.rsos = hospital.rsos.filter(r => r.toString() !== rsoId);
    await hospital.save();

    // Delete RSO document
    const deletedRSO = await RSO.findByIdAndDelete(rsoId);
    if (!deletedRSO) {
        throw new ApiError(404, 'RSO not found');
    }

    return res.status(200).json(new ApiResponse(200, deletedRSO, 'RSO deleted successfully'));
});


export default {
    add,
    getAll,
    getById,
    updateById,
    deleteById,
    creatersoByClientId,
    getAllrsoByClientId,
    getrsoByClientIdAndRsoId,
    updatersoByClientId,
    deletersoByClientId,
    createRsoByHospitalId,
    getAllRsoByHospitalId,
    getRsoByHospitalIdAndRsoId,
    updateRsoByHospitalId,
    deleteRsoByHospitalId
};
