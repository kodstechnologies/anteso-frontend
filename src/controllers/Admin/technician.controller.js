import Technician from "../../models/technician.model.js";
import Tool from "../../models/tools.model.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Employee from "../../models/technician.model.js";
import Tools from "../../models/tools.model.js";

// const add = asyncHandler(async (req, res) => {
//     try {
//         const { name, phone, email, address, technicianType, status, tools } = req.body;

//         if (
//             technicianType === "engineer" &&
//             (!tools || !Array.isArray(tools) || tools.length === 0)
//         ) {
//             throw new ApiError(400, "Engineer must be assigned at least one tool.");
//         }

//         const validTools = await Tool.find({ _id: { $in: tools || [] } });
//         if (tools && validTools.length !== tools.length) {
//             throw new ApiError(400, "One or more tool IDs are invalid.");
//         }

//         const technician = await Technician.create({
//             name,
//             phone,
//             email,
//             address,
//             technicianType,
//             status,
//             tools: technicianType === "engineer" ? tools : [],
//         });

//         return res.status(201).json(
//             new ApiResponse(201, technician, "Technician created successfully")
//         );
//     } catch (error) {
//         throw new ApiError(500, error.message || "Failed to create technician");
//     }
// });

// const add = asyncHandler(async (req, res) => {
//     try {
//         console.log("technicain req,body",req.body);

//         const { name, phone, email, address, technicianType, status, tools } = req.body;

//         // Check tool details only for engineers
//         if (technicianType === "engineer") {
//             if (!tools || !Array.isArray(tools) || tools.length === 0) {
//                 throw new ApiError(400, "Engineer must be assigned at least one tool.");
//             }

//             // Validate each tool object
//             for (const tool of tools) {
//                 if (!tool.toolName || typeof tool.toolName !== 'string' || !tool.toolName.trim()) {
//                     throw new ApiError(400, "Each tool must include a valid toolName.");
//                 }
//                 // serialNumber is optional — no validation required
//             }
//         }

//         const technician = await Technician.create({
//             name,
//             phone,
//             email,
//             address,
//             technicianType,
//             status,
//             tools: technicianType === "engineer" ? tools : [],
//         });

//         return res
//             .status(201)
//             .json(new ApiResponse(201, technician, "Technician created successfully"));
//     } catch (error) {
//         throw new ApiError(500, error.message || "Failed to create technician");
//     }
// });

const add = asyncHandler(async (req, res) => {
    try {
        console.log("Employee req.body:", req.body);

        const {
            name,
            phone,
            email,
            // address,
            technicianType,
            status,
            tools,
            designation,
            department,
            dateOfJoining,
            workingDays
        } = req.body;

        // Basic validation
        if (!name || !phone || !email || !technicianType ||
            !designation || !department || !dateOfJoining || workingDays === undefined) {
            throw new ApiError(400, "All required fields must be provided");
        }

        // Engineer-specific tool validation
        if (technicianType === "engineer") {
            if (!tools || !Array.isArray(tools) || tools.length === 0) {
                throw new ApiError(400, "Engineer must be assigned at least one tool.");
            }
            // for (const tool of tools) {
            //     if (!tool.toolName || typeof tool.toolName !== 'string' || !tool.toolName.trim()) {
            //         throw new ApiError(400, "Each tool must include a valid toolName.");
            //     }
            //     // serialNumber and issueDate are optional
            // }
        }
        // Create new employee
        const employee = new Employee({
            name,
            phone,
            email,
            technicianType,
            status,
            designation,
            department,
            dateOfJoining,
            workingDays,
            tools: technicianType === "engineer" ? tools : [],
        });
        await employee.save();
        console.log("🚀 ~ employee:", employee)

        return res.status(201).json(
            new ApiResponse(201, employee, "Employee created successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to create employee");
    }
});

//not updated
const getById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const technician = await Technician.findById(id).populate("tools");
        if (!technician) {
            throw new ApiError(404, "Technician not found");
        }

        return res.status(200).json(new ApiResponse(200, technician, "Technician fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to fetch technician");
    }
});

const getAll = asyncHandler(async (req, res) => {
    try {
        const technicians = await Technician.find({ technicianType: "engineer" }).populate("tools");
        // console.log("🚀 ~ technicians:", technicians)

        return res.status(200).json(new ApiResponse(200, technicians, "All technicians fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to fetch technicians");
    }
});
const updateById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.technicianType === "engineer" && (!updateData.tools || updateData.tools.length === 0)) {
            throw new ApiError(400, "Engineer must be assigned at least one tool.");
        }

        const updatedTechnician = await Technician.findByIdAndUpdate(id, updateData, { new: true }).populate("tools");
        if (!updatedTechnician) {
            throw new ApiError(404, "Technician not found");
        }

        return res.status(200).json(new ApiResponse(200, updatedTechnician, "Technician updated successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to update technician");
    }
});
const deleteById = asyncHandler(async (req, res) => {
    try {
        // return res.status(200).json({msg:"hi"})
        const { id } = req.params;
        console.log("🚀 ~ id:", id)

        const deletedTechnician = await Technician.findByIdAndDelete(id);
        if (!deletedTechnician) {
            throw new ApiError(404, "Technician not found");
        }

        return res.status(200).json(new ApiResponse(200, deletedTechnician, "Technician deleted successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to delete technician");
    }
});
const getUnassignedTools = asyncHandler(async (req, res) => {
    try {
        const tools = await Tools.find({ toolStatus: 'unassigned' }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tools.length,
            data: tools,
        });
    } catch (error) {

        res.status(500);
        throw new Error('Failed to fetch unassigned tools');
    }
});

const assignedToolByTechnicianId = asyncHandler(async (req, res) => {
    try {
        const { technicianId } = req.params;

        if (!technicianId) {
            throw new ApiError(400, 'Technician ID is required');
        }

        // Find tools where technician field matches the given ID
        const tools = await Tools.find({ technician: technicianId });
        console.log("🚀 ~ tools:", tools)

        if (!tools || tools.length === 0) {
            throw new ApiError(404, 'No tools assigned to this technician');
        }

        return res
            .status(200)
            .json(new ApiResponse(200, tools, 'Assigned tools fetched successfully'));
    } catch (error) {
        // Pass error to global error handler middleware
        res
            .status(error.statusCode || 500)
            .json(
                new ApiError(
                    error.statusCode || 500,
                    error.message || 'Internal Server Error',
                    error.errors || [],
                    error.stack
                )
            );
    }
});

const getAllOfficeStaff = asyncHandler(async (req, res) => {
    try {
        const officeStaff = await Employee.find({ technicianType: 'office staff' }).select("-password"); // exclude password

        if (!officeStaff || officeStaff.length === 0) {
            throw new ApiError(404, "No office staff found");
        }

        return res.status(200).json(new ApiResponse(200, officeStaff, "Office staff fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to fetch office staff");
    }
});
// const getAllEngineers = asyncHandler(async (req, res) => {
//     try {
//         const engineers = await Employee.find({ technicianType: 'engineer' }).select("-password");

//         if (!engineers || engineers.length === 0) {
//             throw new ApiError(404, "No engineers found");
//         }

//         return res.status(200).json(new ApiResponse(200, engineers, "Engineers fetched successfully"));
//     } catch (error) {
//         throw new ApiError(500, error.message || "Failed to fetch engineers");
//     }
// });

// const machineDetails = asyncHandler(async (req, res) => {
//     try {
//         const {employeeId,orderId,serviceId}=req.body;
        
//     } catch (error) {

//     }
// })


export default { add, getById, getAll, updateById, deleteById, getUnassignedTools, assignedToolByTechnicianId, getAllOfficeStaff };