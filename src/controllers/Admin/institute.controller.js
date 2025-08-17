import mongoose from 'mongoose';
import Institute from '../../models/institute.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { instituteSchema } from '../../validators/instituteValidators.js';
import Client from '../../models/client.model.js';
import Hospital from '../../models/hospital.model.js';

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


//institute by client
const createInstituteByClientId = asyncHandler(async (req, res) => {
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
        throw new ApiError(400, 'Invalid client ID format');
    }

    const { error, value } = instituteSchema.validate(req.body, { abortEarly: false });
    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    try {
        const client = await Client.findById(clientId);
        if (!client) throw new ApiError(404, 'Client not found');

        const newInstitute = await Institute.create(value);
        console.log("🚀 ~ newInstitute:", newInstitute)
        client.institutes.push(newInstitute._id);
        await client.save();

        return res.status(201).json(new ApiResponse(201, newInstitute, 'Institute created and linked to client'));
    } catch (error) {
        throw new ApiError(500, error.message || 'Failed to create institute');
    }
});
const getAllInstitutesByClientId = asyncHandler(async (req, res) => {
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
        throw new ApiError(400, 'Invalid client ID format');
    }

    try {
        const client = await Client.findById(clientId).populate('institutes');
        if (!client) throw new ApiError(404, 'Client not found');

        return res.status(200).json(new ApiResponse(200, client.institutes, 'Institutes fetched successfully'));
    } catch (error) {
        throw new ApiError(500, error.message || 'Failed to fetch institutes');
    }
});
const getInstituteByClientIdAndInstituteId = asyncHandler(async (req, res) => {
    const { clientId, instituteId } = req.params;

    if (
        !mongoose.Types.ObjectId.isValid(clientId) ||
        !mongoose.Types.ObjectId.isValid(instituteId)
    ) {
        throw new ApiError(400, 'Invalid ID format');
    }

    const client = await Client.findById(clientId);
    if (!client || !client.institutes.includes(instituteId)) {
        throw new ApiError(404, 'Institute not found for this client');
    }

    const institute = await Institute.findById(instituteId);
    if (!institute) throw new ApiError(404, 'Institute not found');

    return res.status(200).json(new ApiResponse(200, institute, 'Institute fetched successfully'));
});

const deleteInstituteByClientId = asyncHandler(async (req, res) => {
    const { clientId, instituteId } = req.params;

    if (
        !mongoose.Types.ObjectId.isValid(clientId) ||
        !mongoose.Types.ObjectId.isValid(instituteId)
    ) {
        throw new ApiError(400, 'Invalid ID format');
    }

    const client = await Client.findById(clientId);
    if (!client) throw new ApiError(404, 'Client not found');

    const index = client.institutes.indexOf(instituteId);
    if (index === -1) {
        throw new ApiError(404, 'Institute not associated with client');
    }

    client.institutes.splice(index, 1);
    await client.save();

    const deleted = await Institute.findByIdAndDelete(instituteId);
    if (!deleted) throw new ApiError(404, 'Institute not found');

    return res.status(200).json(new ApiResponse(200, deleted, 'Institute deleted successfully'));
});


const updateInstituteByClientIdAndInstituteId = asyncHandler(async (req, res) => {
    const { clientId, instituteId } = req.params;

    if (
        !mongoose.Types.ObjectId.isValid(clientId) ||
        !mongoose.Types.ObjectId.isValid(instituteId)
    ) {
        throw new ApiError(400, 'Invalid ID format');
    }

    const client = await Client.findById(clientId);
    if (!client || !client.institutes.includes(instituteId)) {
        throw new ApiError(404, 'Institute not associated with this client');
    }

    const { error, value } = instituteSchema.validate(req.body, { abortEarly: false });
    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    const updated = await Institute.findByIdAndUpdate(instituteId, value, {
        new: true,
        runValidators: true,
    });

    if (!updated) throw new ApiError(404, 'Institute not found');

    return res.status(200).json(new ApiResponse(200, updated, 'Institute updated successfully'));
});

// --------------------- HOSPITAL-BASED RELATIONSHIP ---------------------

// CREATE Institute by Hospital ID
const createInstituteByHospitalId = asyncHandler(async (req, res) => {
    const { hospitalId } = req.params;
    console.log("🚀 ~ hospitalId:", hospitalId)
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        throw new ApiError(400, 'Invalid Hospital ID format');
    }

    const { error, value } = instituteSchema.validate(req.body, { abortEarly: false });
    if (error) throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));

    const hospital = await Hospital.findById(hospitalId);
    console.log("🚀 ~ hospital:", hospital)
    if (!hospital) throw new ApiError(404, 'Hospital not found');

    const newInstitute = await Institute.create(value);
    if (!hospital.institutes) hospital.institutes = [];
    hospital.institutes.push(newInstitute._id);
    await hospital.save();

    return res.status(201).json(new ApiResponse(201, newInstitute, 'Institute created and linked to hospital'));
});

// GET all Institutes by Hospital ID
const getAllInstitutesByHospitalId = asyncHandler(async (req, res) => {
    const { hospitalId } = req.params;
    console.log("🚀 ~ hospitalId:", hospitalId)
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        throw new ApiError(400, 'Invalid Hospital ID format');
    }

    const hospital = await Hospital.findById(hospitalId).populate('institutes');
    if (!hospital) throw new ApiError(404, 'Hospital not found');

    return res.status(200).json(new ApiResponse(200, hospital.institutes, 'Institutes fetched successfully'));
});

// GET specific Institute by Hospital & Institute ID
const getInstituteByHospitalIdAndInstituteId = asyncHandler(async (req, res) => {
    const { hospitalId, instituteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(instituteId)) {
        throw new ApiError(400, 'Invalid ID format');
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital || !hospital.institutes.includes(instituteId)) {
        throw new ApiError(404, 'Institute not associated with this hospital');
    }

    const institute = await Institute.findById(instituteId);
    if (!institute) throw new ApiError(404, 'Institute not found');

    return res.status(200).json(new ApiResponse(200, institute, 'Institute fetched successfully'));
});

// UPDATE Institute by Hospital ID
const updateInstituteByHospitalIdAndInstituteId = asyncHandler(async (req, res) => {
    const { hospitalId, instituteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(instituteId)) {
        throw new ApiError(400, 'Invalid ID format');
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital || !hospital.institutes.includes(instituteId)) {
        throw new ApiError(404, 'Institute not associated with this hospital');
    }

    const { error, value } = instituteSchema.validate(req.body, { abortEarly: false });
    if (error) throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));

    const updatedInstitute = await Institute.findByIdAndUpdate(instituteId, value, { new: true, runValidators: true });
    if (!updatedInstitute) throw new ApiError(404, 'Institute not found');

    return res.status(200).json(new ApiResponse(200, updatedInstitute, 'Institute updated successfully'));
});

// DELETE Institute by Hospital ID
const deleteInstituteByHospitalId = asyncHandler(async (req, res) => {
    const { hospitalId, instituteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hospitalId) || !mongoose.Types.ObjectId.isValid(instituteId)) {
        throw new ApiError(400, 'Invalid ID format');
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) throw new ApiError(404, 'Hospital not found');

    const index = hospital.institutes.indexOf(instituteId);
    if (index === -1) throw new ApiError(404, 'Institute not associated with hospital');

    hospital.institutes.splice(index, 1);
    await hospital.save();

    const deleted = await Institute.findByIdAndDelete(instituteId);
    if (!deleted) throw new ApiError(404, 'Institute not found');

    return res.status(200).json(new ApiResponse(200, deleted, 'Institute deleted successfully'));
});

export default {
    add,
    getAll,
    getById,
    updateById,
    deleteById,
    updateInstituteByClientIdAndInstituteId,
    deleteInstituteByClientId,
    getInstituteByClientIdAndInstituteId,
    getAllInstitutesByClientId,
    createInstituteByClientId,
    createInstituteByHospitalId,
    getAllInstitutesByHospitalId,
    getInstituteByHospitalIdAndInstituteId,
    updateInstituteByHospitalIdAndInstituteId,
    deleteInstituteByHospitalId
};
