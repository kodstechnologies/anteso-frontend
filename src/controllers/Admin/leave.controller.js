import Leave from '../../models/leave.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { leaveValidationSchema } from '../../validators/leaveValidators.js';

const add = asyncHandler(async (req, res) => {
    // Validate input
    await leaveValidationSchema.validate(req.body);

    const { startDate, endDate, leaveType, reason, status } = req.body;

    const leave = await Leave.create({
        startDate,
        endDate,
        leaveType,
        reason,
        status: status || 'Pending'
    });

    res.status(201).json(new ApiResponse(201, leave, "Leave created successfully"));
});

const getLeaveById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const leave = await Leave.findById(id);
    if (!leave) {
        throw new ApiError(404, "Leave not found");
    }

    res.status(200).json(new ApiResponse(200, leave, "Leave fetched successfully"));
});

const getAllLeaves = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const totalLeaves = await Leave.countDocuments();
    const leaves = await Leave.find().skip(skip).limit(limit).sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, {
            total: totalLeaves,
            page,
            limit,
            totalPages: Math.ceil(totalLeaves / limit),
            data: leaves
        }, "Leaves fetched successfully")
    );
});
const updateLeaveById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedLeave = await Leave.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
    );
    if (!updatedLeave) {
        throw new ApiError(404, "Leave not found");
    }
    res.status(200).json(new ApiResponse(200, updatedLeave, "Leave updated successfully"));
});

const deleteLeaveById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await Leave.findByIdAndDelete(id);
    if (!deleted) {
        throw new ApiError(404, "Leave not found");
    }
    res.status(200).json(new ApiResponse(200, deleted, "Leave deleted successfully"));
});

export default { add, getLeaveById, getAllLeaves, updateLeaveById, deleteLeaveById }