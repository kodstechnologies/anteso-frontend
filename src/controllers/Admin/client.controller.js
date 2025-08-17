import mongoose from "mongoose";
import Client from "../../models/client.model.js";
import Hospital from "../../models/hospital.model.js";
import Institute from "../../models/institute.model.js";
import RSO from "../../models/rso.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { clientValidationSchema } from "../../validators/clientValidators.js";
import { handleDuplicateKeyError } from "../../utils/ErrorHandler.js";

const create = asyncHandler(async (req, res) => {
    const { error, value } = clientValidationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    const { name, phone, email, address, gstNo, hospitals } = value;

    const validateReferences = async (Model, ids) => {
        if (!ids) return [];
        const found = await Model.find({ _id: { $in: ids } });
        if (found.length !== ids.length) {
            throw new ApiError(400, `Some ${Model.modelName} IDs are invalid.`);
        }
        return ids;
    };

    const validHospitals = await validateReferences(Hospital, hospitals);

    try {
        const newClient = await Client.create({
            name,
            phone,
            email,
            address,
            gstNo,
            hospitals: validHospitals,
        });

        return res.status(201).json(new ApiResponse(201, newClient, 'Client created successfully'));
    } catch (error) {
        if (error.code === 11000) {
            const message = handleDuplicateKeyError(error);
            throw new ApiError(409, message);
        }
        throw new ApiError(error.statusCode || 500, error.message || 'Something went wrong');
    }
});

const getAll = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalClients = await Client.countDocuments();
    const clients = await Client.find()
        .populate({
            path: 'hospitals',
            populate: [{ path: 'institutes' }, { path: 'rsos' }]
        })
        .skip(skip)
        .limit(limit);

    return res.status(200).json(
        new ApiResponse(200, {
            clients,
            totalClients,
            totalPages: Math.ceil(totalClients / limit),
            currentPage: page
        }, 'Clients fetched successfully')
    );
});

const getById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const client = await Client.findById(id)
        .populate({
            path: 'hospitals',
            populate: [{ path: 'institutes' }, { path: 'rsos' }]
        });

    if (!client) throw new ApiError(404, 'Client not found');

    return res.status(200).json(new ApiResponse(200, client, 'Client fetched successfully'));
});

const updateById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { error, value } = clientValidationSchema.validate(req.body, { abortEarly: false });

    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    const { name, phone, email, address, gstNo, hospitals } = value;

    const validateReferences = async (Model, ids) => {
        if (!ids) return [];
        const found = await Model.find({ _id: { $in: ids } });
        if (found.length !== ids.length) {
            throw new ApiError(400, `Some ${Model.modelName} IDs are invalid.`);
        }
        return ids;
    };

    const validHospitals = await validateReferences(Hospital, hospitals);

    const updatedClient = await Client.findByIdAndUpdate(
        id,
        { name, phone, email, address, gstNo, hospitals: validHospitals },
        { new: true, runValidators: true }
    );

    if (!updatedClient) throw new ApiError(404, 'Client not found');

    return res.status(200).json(new ApiResponse(200, updatedClient, 'Client updated successfully'));
});

const deleteById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const client = await Client.findById(id).populate('hospitals');
    if (!client) throw new ApiError(404, 'Client not found');

    // Cascade delete: remove hospitals + related institutes & rsos
    for (const hospital of client.hospitals) {
        if (hospital.rsos?.length) {
            await RSO.deleteMany({ _id: { $in: hospital.rsos } });
        }
        if (hospital.institutes?.length) {
            await Institute.deleteMany({ _id: { $in: hospital.institutes } });
        }
        await Hospital.findByIdAndDelete(hospital._id);
    }

    await Client.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, null, 'Client and all associated data deleted successfully'));
});

const deleteAll = asyncHandler(async (req, res) => {
    // Delete all hospitals, institutes, and rsos before clients
    const allHospitals = await Hospital.find({});
    for (const hospital of allHospitals) {
        if (hospital.rsos?.length) {
            await RSO.deleteMany({ _id: { $in: hospital.rsos } });
        }
        if (hospital.institutes?.length) {
            await Institute.deleteMany({ _id: { $in: hospital.institutes } });
        }
    }
    await Hospital.deleteMany({});
    await Client.deleteMany({});

    return res.status(200).json(new ApiResponse(200, null, 'All clients and related data deleted successfully'));
});

export default {
    create,
    getAll,
    getById,
    updateById,
    deleteById,
    deleteAll,
};
