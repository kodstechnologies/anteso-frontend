import Tool from "../../models/tools.model.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { createToolSchema } from "../../validators/toolValidators.js";
import { generateReadableId } from "../../utils/GenerateReadableId.js";

const create = asyncHandler(async (req, res) => {
    console.log("🛠️ Tool body submitted:", req.body);

    const { error, value } = createToolSchema.validate(req.body);
    if (error) {
        throw new ApiError(400, error.details[0].message);
    }

    // Generate toolId manually
    const toolId = await generateReadableId('Tool', 'TL');

    // Check for duplicates
    const exists = await Tool.findOne({ toolId });
    if (exists) {
        throw new ApiError(409, 'Tool with this ID already exists');
    }

    const tool = await Tool.create({
        ...value,
        toolId,
        toolStatus: 'unassigned', // default value
    });

    res.status(201).json(new ApiResponse(201, tool, 'Tool created successfully'));
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

    // Step 1: Get tool by ID to access createdAt
    const tool = await Tool.findById(id);
    if (!tool) {
        return res.status(404).json({ message: 'Tool not found' });
    }

    // Step 2: Find engineer who has this tool assigned (by _id)
    const engineer = await Employee.findOne({
        'tools.toolName': tool.nomenclature, // match toolName from embedded doc
        'tools.serialNumber': tool.SrNo,     // match serial number
    });

    if (!engineer) {
        return res.status(404).json({ message: 'Engineer not assigned to this tool' });
    }

    // Step 3: Find the matching embedded tool data for issueDate
    const assignedToolData = engineer.tools.find(
        t => t.toolName === tool.nomenclature && t.serialNumber === tool.SrNo
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

export default { create, allTools, updateById, deleteById, getById, getEngineerByTool };
