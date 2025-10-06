import Leave from '../../models/leave.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { leaveValidationSchema } from '../../validators/leaveValidators.js';

const add = asyncHandler(async (req, res) => {
    // Validate input
    await leaveValidationSchema.validate(req.body);

    const { startDate, endDate, leaveType, reason } = req.body;

    const leave = await Leave.create({
        startDate,
        endDate,
        leaveType,
        reason,
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

const applyForLeave = asyncHandler(async (req, res) => {
    try {
        const { startDate, endDate, leaveType, reason } = req.body;

        // Optional: get technician ID from req.user if using auth middleware
        const { technicianId } = req.params;

        if (!startDate || !endDate || !leaveType || !reason) {
            throw new ApiError(400, "All leave details must be provided");
        }

        // Validate leave type
        const validLeaveTypes = ['Sick Leave', 'casual leave', 'Maternity/Paternity', 'Leave without pay'];
        if (!validLeaveTypes.includes(leaveType)) {
            throw new ApiError(400, "Invalid leave type");
        }

        // Check date logic
        if (new Date(startDate) > new Date(endDate)) {
            throw new ApiError(400, "Start date cannot be after end date");
        }

        const leave = new Leave({
            startDate,
            endDate,
            leaveType,
            reason,
            employee: technicianId
        });

        await leave.save();

        return res.status(201).json(
            new ApiResponse(201, leave, "Leave applied successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to apply for leave");
    }
});
    
// const getLeaveByType=asyncHandler(async(req,res)=>{
//     try {

//     } catch (error) {

//     }
// })


const getAllLeavesByCustomerId = asyncHandler(async (req, res) => {
    try {
        const { technicianId } = req.params;
        if (!technicianId) {
            return res.status(400).json({ message: "Technician ID is required" });
        }
        const leaves = await Leave.find({ employee: technicianId })
            .populate("employee", "name email empId") // optional: populate employee info
            .sort({ createdAt: -1 }); // newest first

        if (!leaves || leaves.length === 0) {
            return res.status(404).json({ message: "No leave records found for this technician" });
        }
        return res.status(200).json({
            success: true,
            count: leaves.length,
            data: leaves
        });
    } catch (error) {
        console.error("Error fetching leaves:", error);
        res.status(500).json({ message: "Failed to fetch leave records" });
    }
});


const approveLeave = asyncHandler(async (req, res) => {
    try {
        const { employeeId, leaveId } = req.params;

        const leave = await Leave.findOne({ _id: leaveId, employee: employeeId });
        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found for this employee",
            });
        }

        // Update status to Approved
        leave.status = "Approved";
        await leave.save();

        res.status(200).json({
            success: true,
            message: "Leave approved successfully",
            data: leave.status,
        });
    } catch (error) {
        console.error("Approve Leave Error:", error);
        res.status(500).json({
            success: false,
            message: "Error approving leave",
            error: error.message,
        });
    }
});

// const rejectLeave = asyncHandler(async (req, res) => {
//     try {
//         const { employeeId, leaveId } = req.params;

//         const leave = await Leave.findOne({ _id: leaveId, employee: employeeId });
//         if (!leave) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Leave request not found for this employee",
//             });
//         }

//         // Update status to Rejected
//         leave.status = "Rejected";
//         await leave.save();

//         res.status(200).json({
//             success: true,
//             message: "Leave rejected successfully",
//             data: leave,
//         });
//     } catch (error) {
//         console.error("Reject Leave Error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Error rejecting leave",
//             error: error.message,
//         });
//     }
// });

const rejectLeave = asyncHandler(async (req, res) => {
    try {
        const { employeeId, leaveId } = req.params;

        const leave = await Leave.findOne({ _id: leaveId, employee: employeeId });
        if (!leave) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found for this employee",
            });
        }

        // ❌ If already Approved, don't allow rejection
        if (leave.status === "Approved") {
            return res.status(400).json({
                success: false,
                message: "Cannot reject an already approved leave",
            });
        }

        // ✅ Update status to Rejected (only if Pending or already Rejected)
        leave.status = "Rejected";
        await leave.save();

        res.status(200).json({
            success: true,
            message: "Leave rejected successfully",
            data: leave,
        });
    } catch (error) {
        console.error("Reject Leave Error:", error);
        res.status(500).json({
            success: false,
            message: "Error rejecting leave",
            error: error.message,
        });
    }
});


export default { add, getLeaveById, getAllLeaves, updateLeaveById, deleteLeaveById, applyForLeave, getAllLeavesByCustomerId, approveLeave, rejectLeave }
// export default {createLeave,getLeavesByEmployeeId,updateLeaveByEmployee,deleteLeaveByEmployee}