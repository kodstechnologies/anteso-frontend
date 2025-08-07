import Machine from '../../models/machine.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { machineSchema } from '../../validators/machineValidator.js';
import Customer from '../../models/client.model.js'

// ADD MACHINE
const add = asyncHandler(async (req, res) => {
    try {
        const {
            machineType,
            make,
            model,
            serialNumber,
            equipmentId,
            qaValidity,
            licenseValidity,
            status,
        } = req.body;

        const { customerId } = req.params;

        const { error } = machineSchema.validate({
            machineType,
            make,
            model,
            serialNumber,
            equipmentId,
            qaValidity,
            licenseValidity,
            status,
        });

        if (error) {
            throw new ApiError(400, error.details[0].message);
        }

        const qaReportAttachment = req.files?.qaReportAttachment?.[0]?.path;
        const licenseReportAttachment = req.files?.licenseReportAttachment?.[0]?.path;
        const rawDataAttachment = req.files?.rawDataAttachment?.[0]?.path || null;

        const existingCustomer = await Customer.findById(customerId);
        if (!existingCustomer) {
            throw new ApiError(404, "Customer not found.");
        }

        const machine = await Machine.create({
            machineType,
            make,
            model,
            serialNumber,
            equipmentId,
            qaValidity,
            licenseValidity,
            status,
            rawDataAttachment,
            qaReportAttachment,
            licenseReportAttachment,
            customer: customerId,
        });
        console.log("🚀 ~ machine:", machine)

        res.status(201).json(new ApiResponse(201, machine, 'Machine added successfully.'));
    } catch (error) {
        console.error('Error in add machine:', error);
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});

// GET ALL MACHINES
const getAllMachinesByCustomerId = asyncHandler(async (req, res) => {
    try {
        const { customerId } = req.params;
        if (!customerId) {
            return res.status(400).json({ success: false, message: "Customer ID is required" });
        }
        const machines = await Machine.find({ customer: customerId }).populate('customer', 'gstNo');
        res.status(200).json(ApiResponse(200, machines, "Machines fetched successfully"));
    } catch (error) {
        console.error("Error fetching machines by customer ID:", error);
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});

// GET MACHINE BY ID
const getById = asyncHandler(async (req, res) => {
    try {
        const { id, customerId } = req.params;

        if (!id || !customerId) {
            return res.status(400).json({ success: false, message: 'Machine ID and Customer ID are required' });
        }

        const machine = await Machine.findOne({
            _id: id,
            customer: customerId,
        }).populate('customer');

        if (!machine) {
            throw new ApiError(404, 'Machine not found for this customer');
        }

        res.status(200).json(new ApiResponse(200, machine, 'Machine fetched successfully.'));
    } catch (error) {
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});

// UPDATE MACHINE BY ID
const updateById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { customerId } = req.query;

        let query = { _id: id };
        if (customerId) {
            query = { _id: id, client: customerId };
        }

        const existingMachine = await Machine.findOne(query);
        if (!existingMachine) {
            throw new ApiError(404, 'Machine not found for the given customer');
        }

        const {
            machineType,
            make,
            model,
            serialNumber,
            equipmentId,
            qaValidity,
            licenseValidity,
            status,
            client,
        } = req.body;

        const { error } = machineSchema.validate(req.body);
        if (error) {
            throw new ApiError(400, error.details[0].message);
        }

        const qaReportAttachment = req.files?.qaReportAttachment?.[0]?.path || existingMachine.qaReportAttachment;
        const licenseReportAttachment = req.files?.licenseReportAttachment?.[0]?.path || existingMachine.licenseReportAttachment;
        const rawDataAttachment = req.files?.rawDataAttachment?.[0]?.path || existingMachine.rawDataAttachment;

        existingMachine.machineType = machineType;
        existingMachine.make = make;
        existingMachine.model = model;
        existingMachine.serialNumber = serialNumber;
        existingMachine.equipmentId = equipmentId;
        existingMachine.qaValidity = qaValidity;
        existingMachine.licenseValidity = licenseValidity;
        existingMachine.status = status;
        existingMachine.client = client;
        existingMachine.qaReportAttachment = qaReportAttachment;
        existingMachine.licenseReportAttachment = licenseReportAttachment;
        existingMachine.rawDataAttachment = rawDataAttachment;

        await existingMachine.save();

        res.status(200).json(new ApiResponse(200, existingMachine, 'Machine updated successfully.'));
    } catch (error) {
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});

// DELETE MACHINE BY ID
const deleteById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { customerId } = req.query;

        let query = { _id: id };
        if (customerId) {
            query = { _id: id, client: customerId };
        }

        const deletedMachine = await Machine.findOneAndDelete(query);

        if (!deletedMachine) {
            throw new ApiError(404, 'Machine not found for the given customer');
        }

        res.status(200).json(new ApiResponse(200, deletedMachine, 'Machine deleted successfully.'));
    } catch (error) {
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});

// controllers/Admin/machine.controller.js
const searchByType = asyncHandler(async (req, res) => {
    try {
        const { type } = req.query;
        const { customerId } = req.params;

        if (!type) {
            return res.status(400).json({ success: false, message: "Machine type is required" });
        }

        if (!customerId) {
            return res.status(400).json({ success: false, message: "Customer ID is required" });
        }

        const machines = await Machine.find({
            machineType: { $regex: type, $options: "i" },
            customer: customerId,
        });

        res.status(200).json(new ApiResponse(200, machines));
    } catch (error) {
        console.error("Error in searchByType:", error);
        throw new ApiError(500, error?.message || 'Internal Server Error');
    }
});




export default { add, getById, updateById, deleteById, searchByType, getAllMachinesByCustomerId }