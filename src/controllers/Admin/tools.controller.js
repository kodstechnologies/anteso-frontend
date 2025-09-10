import Tool from "../../models/tools.model.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { createToolSchema } from "../../validators/toolValidators.js";
import { generateReadableId } from "../../utils/GenerateReadableId.js";
import Employee from "../../models/technician.model.js";
import Tools from "../../models/tools.model.js";
import { uploadToS3 } from "../../utils/s3Upload.js";

const create = asyncHandler(async (req, res) => {
    console.log("🛠️ Tool body submitted:", req.body);

    const { error, value } = createToolSchema.validate(req.body);
    if (error) {
        throw new ApiError(400, error.details[0].message);
    }

    // Generate toolId manually
    const toolId = await generateReadableId("Tool", "TL");

    // Check for duplicates
    const exists = await Tools.findOne({ toolId });
    if (exists) {
        throw new ApiError(409, "Tool with this ID already exists");
    }

    // Handle file upload (certificate)
    let certificateUrl = null;
    if (req.file) {
        try {
            const { url } = await uploadToS3(req.file);
            certificateUrl = url;
        } catch (err) {
            console.error("S3 upload error:", err);
            throw new ApiError(500, "Failed to upload certificate file");
        }
    }

    const tool = await Tools.create({
        ...value,
        toolId,
        toolStatus: "unassigned", // default value
        certificate: certificateUrl,
    });

    res.status(201).json(new ApiResponse(201, tool, "Tool created successfully"));
});

const allTools = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [tools, totalCount] = await Promise.all([
        Tool.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
        Tool.countDocuments()
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            tools,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount
        }, "Tools fetched successfully")
    );
});

const updateById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { error, value } = createToolSchema.validate(req.body);
    if (error) {
        throw new ApiError(400, error.details[0].message);
    }
    const updatedTool = await Tool.findByIdAndUpdate(id, value, {
        new: true, // return updated doc
        runValidators: true, // apply schema validation
    });
    if (!updatedTool) {
        throw new ApiError(404, "Tool not found");
    }
    res.status(200).json(new ApiResponse(200, updatedTool, "Tool updated successfully"));
});

const deleteById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedTool = await Tool.findByIdAndDelete(id);
    if (!deletedTool) {
        throw new ApiError(404, "Tool not found");
    }
    res.status(200).json(new ApiResponse(200, deletedTool, "Tool deleted successfully"));
});


const getById = asyncHandler(async (req, res) => {
    console.log("hi from controller");

    console.log("tools route hit");

    const { id } = req.params;
    const tool = await Tool.findById(id);
    if (!tool) {
        throw new ApiError(404, "Tool not found");
    }
    res.status(200).json(new ApiResponse(200, tool, "Tool fetched successfully"));
});


const createToolByTechnician = asyncHandler(async (req, res) => {
    try {

    } catch (error) {

    }
})


const getEngineerByTool = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Step 1: Get tool by ID
    const tool = await Tool.findById(id);
    if (!tool) {
        return res.status(404).json({ message: 'Tool not found' });
    }

    // Step 2: Find engineer by embedded toolId
    const engineer = await Employee.findOne({
        'tools.toolId': tool._id
    });

    if (!engineer) {
        return res.status(404).json({ message: 'Engineer not assigned to this tool' });
    }

    // Step 3: Find assignment info (issueDate)
    const assignedToolData = engineer.tools.find(
        t => t.toolId.toString() === tool._id.toString()
    );

    if (!assignedToolData) {
        return res.status(404).json({ message: 'Tool assignment not found in engineer data' });
    }

    return res.status(200).json({
        engineer: {
            _id: engineer._id,
            name: engineer.name,
            email: engineer.email,
            technicianType: engineer.technicianType,
            designation: engineer.designation,
            department: engineer.department,
        },
        tool: {
            toolId: tool._id,
            toolName: tool.nomenclature,
            serialNumber: tool.SrNo,
            issueDate: assignedToolData.issueDate,
            submitDate: tool.createdAt,
        },
    });
});



const getAllToolsByTechnicianId = asyncHandler(async (req, res) => {
    try {
        const { technicianId } = req.params;

        if (!technicianId) {
            return res.status(400).json({
                success: false,
                message: "Technician ID is required",
            });
        }

        // Find employee/technician by ID and populate tool details
        const technician = await Employee.findById(technicianId)
            .populate("tools.toolId", "toolId SrNo nomenclature manufacturer model calibrationCertificateNo calibrationValidTill range toolStatus");

        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        // Flatten the toolId object into the tool response
        const formattedTools = technician.tools.map(tool => {
            if (tool.toolId && typeof tool.toolId === "object") {
                return {
                    ...tool.toolId.toObject(),
                    issueDate: tool.issueDate
                };
            }
            return tool;
        });

        return res.status(200).json({
            success: true,
            technicianId: technician._id,
            tools: formattedTools,
        });
    } catch (error) {
        console.error("Error fetching tools by technician:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching tools",
            error: error.message,
        });
    }
});



const getToolByTechnicianAndTool = asyncHandler(async (req, res) => {
    try {
        const { technicianId, toolId } = req.params;

        if (!technicianId || !toolId) {
            return res.status(400).json({
                success: false,
                message: "Technician ID and Tool ID are required",
            });
        }

        // Find the technician and populate the tools array
        const technician = await Employee.findById(technicianId)
            .populate(
                "tools.toolId",
                "toolId SrNo nomenclature manufacturer model calibrationCertificateNo calibrationValidTill range toolStatus"
            );

        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found",
            });
        }

        // Find the specific tool in technician's tools array
        const toolDoc = technician.tools.find(
            (t) => t.toolId && t.toolId._id.toString() === toolId
        );

        if (!toolDoc) {
            return res.status(404).json({
                success: false,
                message: "Tool not assigned to this technician",
            });
        }

        // Flatten toolId + issueDate
        const formattedTool = {
            ...toolDoc.toolId.toObject(),
            issueDate: toolDoc.issueDate
        };

        return res.status(200).json({
            success: true,
            technicianId: technician._id,
            tool: formattedTool,
        });
    } catch (error) {
        console.error("Error fetching tool by technician and tool:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching tool",
            error: error.message,
        });
    }
});

export default { create, allTools, updateById, deleteById, getById, getEngineerByTool, getAllToolsByTechnicianId, getToolByTechnicianAndTool };