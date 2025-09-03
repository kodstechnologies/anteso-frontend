import Technician from "../../models/technician.model.js";
import Tool from "../../models/tools.model.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Employee from "../../models/technician.model.js";
import Tools from "../../models/tools.model.js";
import tripModel from "../../models/trip.model.js";
import expenseModel from "../../models/expense.model.js";
import advanceAccountModel from "../../models/advanceAccount.model.js";

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
            technicianType,
            status,
            tools,
            designation,
            department,
            dateOfJoining,
            workingDays
        } = req.body;
        console.log("🚀 ~ technicianType:", technicianType)

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

            // 🔹 Check each tool's status before assigning
            for (const t of tools) {
                const toolDoc = await Tool.findById(t.toolId);

                if (!toolDoc) {
                    throw new ApiError(404, `Tool with ID ${t.toolId} not found`);
                }

                if (toolDoc.toolStatus === "assigned") {
                    throw new ApiError(400, `Tool ${toolDoc.nomenclature} (Serial: ${toolDoc.SrNo}) is already assigned to another employee`);
                }
            }
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

        // 🔹 Update tool status if assigned to engineer
        if (technicianType === "engineer") {
            for (const t of tools) {
                await Tool.findByIdAndUpdate(
                    t.toolId,
                    {
                        toolStatus: "assigned",
                        technician: employee._id
                    },
                    { new: true }
                );
            }
        }

        console.log("🚀 ~ employee:", employee);

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

        const technician = await Technician.findById(id)
            .populate({
                path: "tools.toolId", // populate inside tools array
                select: "nomenclature manufacturer model SrNo calibrationCertificateNo" // pick only needed fields
            });
        if (!technician) {
            throw new ApiError(404, "Technician not found");
        }

        return res.status(200).json(new ApiResponse(200, technician, "Technician fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to fetch technician");
    }
});


const getAllEmployees = asyncHandler(async (req, res) => {
    try {
        const employees = await Technician.find()  // 👈 no filter
            .populate({
                path: "tools.toolId",
                select: "nomenclature manufacturer model"
            });

        console.log("🚀 ~ employees:", employees);

        return res.status(200).json(new ApiResponse(200, employees, "All technicians fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to fetch technicians");
    }
});

const getAll = asyncHandler(async (req, res) => {
    try {
        const technicians = await Technician.find({ technicianType: "engineer" })
        console.log("🚀 ~ technicians:", technicians)
        // .populate("tools");
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


//qa raw --assign engineer

//admin api
// const getTripsWithExpensesByTechnician = asyncHandler(async (req, res) => {
//     try {
//         const { technicianId } = req.params;

//         // 1. Get all trips for this technician with their expenses populated
//         const trips = await tripModel.find({ technician: technicianId })
//             .populate({
//                 path: "expenses",
//                 select: "typeOfExpense amount date screenshot remarks" // correct fields from Expense schema
//             })
//             .select("tripName startDate endDate remarks expenses tripstatus")
//             .lean();

//         // 2. Get technician's AdvanceAccount (global balance)
//         const advanceAccount = await advanceAccountModel.findOne({ technician: technicianId }).lean();

//         const currentDate = new Date();

//         // 3. Update tripstatus & calculate per-trip totals
//         trips.forEach(trip => {
//             if (trip.endDate && trip.endDate < currentDate) {
//                 trip.tripstatus = "completed";
//             } else if (!trip.tripstatus) {
//                 trip.tripstatus = "ongoing";
//             }

//             // calculate trip total expense
//             const tripTotalExpense = trip.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
//             trip.tripTotalExpense = tripTotalExpense;
//         });

//         res.status(200).json({
//             success: true,
//             data: {
//                 trips,
//                 advanceAccount: advanceAccount || {
//                     advancedAmount: 0,
//                     totalExpense: 0,
//                     balance: 0
//                 }
//             }
//         });
//     } catch (error) {
//         console.error("Error fetching trips with expenses:", error);
//         res.status(500).json({
//             success: false,
//             message: "Server error fetching trips with expenses",
//             error: error.message
//         });
//     }
// });

const getTripsWithExpensesByTechnician = asyncHandler(async (req, res) => {
    try {
        const { technicianId } = req.params;

        // 1. Get all trips for this technician
        const trips = await tripModel.find({ technician: technicianId })
            .select("tripName startDate endDate remarks tripstatus tripTotalExpense")
            .lean();

        const currentDate = new Date();

        // 2. For each trip, fetch expenses & update totals
        for (let trip of trips) {
            const expenses = await expenseModel.find({ trip: trip._id })
                .select("typeOfExpense requiredAmount date screenshot remarks")
                .lean();

            trip.expenses = expenses;

            // Update trip status
            if (trip.endDate && trip.endDate < currentDate) {
                trip.tripstatus = "completed";
            } else if (!trip.tripstatus) {
                trip.tripstatus = "ongoing";
            }

            // Calculate total expense
            const tripTotalExpense = expenses.reduce(
                (sum, exp) => sum + (exp.requiredAmount || 0),
                0
            );
            trip.tripTotalExpense = tripTotalExpense;

            // 👉 Persist the total expense log in DB
            await tripModel.findByIdAndUpdate(trip._id, {
                tripstatus: trip.tripstatus,
                tripTotalExpense
            });
        }

        // 3. Get technician’s global AdvanceAccount
        const advanceAccount = await advanceAccountModel.findOne({ technician: technicianId }).lean();

        res.status(200).json({
            success: true,
            data: {
                trips,
                advanceAccount: advanceAccount || {
                    advancedAmount: 0,
                    totalExpense: 0,
                    balance: 0
                }
            }
        });

    } catch (error) {
        console.error("Error fetching trips with expenses:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching trips with expenses",
            error: error.message
        });
    }
});

//all mobile APIS
// const createTripByTechnicianId = asyncHandler(async (req, res) => {
//     try {
//         const { technicianId } = req.params;
//         const tripData = req.body;
//         // Create trip
//         const newTrip = await tripModel.create({
//             ...tripData,
//             technician: technicianId
//         });

//         // Find technician's expense (or create one if not exists)
//         let expense = await expenseModel.findOne({ technician: technicianId });

//         if (!expense) {
//             expense = new expenseModel({
//                 technician: technicianId,
//                 advancedAmount: 0,
//                 balance: 0,
//                 totalExpense: 0,
//                 typeOfExpense: "other",
//                 date: new Date()
//             });
//             await expense.save();
//         }

//         // Link expense to trip
//         newTrip.expenses.push(expense._id);
//         await newTrip.save();

//         res.status(201).json({
//             success: true,
//             message: "Trip created successfully",
//             data: {
//                 trip: newTrip,
//                 expense
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message || "Error creating trip"
//         });
//     }
// });

const createTripByTechnicianId = asyncHandler(async (req, res) => {
    try {
        const { technicianId } = req.params;
        const tripData = req.body;

        // ✅ Create a new trip assigned to technician
        const newTrip = await tripModel.create({
            ...tripData,
            technician: technicianId,
        });

        // ✅ Ensure AdvanceAccount exists for technician
        let account = await advanceAccountModel.findOne({ technician: technicianId });

        if (!account) {
            account = new advanceAccountModel({
                technician: technicianId,
                advancedAmount: 0,
                balance: 0,
                totalExpense: 0,
            });
            await account.save();
        }

        res.status(201).json({
            success: true,
            message: "Trip created successfully",
            data: {
                trip: newTrip,
                advanceAccount: account,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Error creating trip",
        });
    }
});

//patche
const updateTripByTechnicianIdAndTripId = asyncHandler(async (req, res) => {
    try {
        const { technicianId, tripId } = req.params;
        console.log("🚀 ~ tripId:", tripId)
        console.log("🚀 ~ technicianId:", technicianId)
        const updateData = req.body;

        const updatedTrip = await tripModel.findOneAndUpdate(
            { _id: tripId, technician: technicianId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
        console.log("🚀 ~ updatedTrip:", updatedTrip)

        if (!updatedTrip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found for the given technician"
            });
        }

        res.status(200).json({
            success: true,
            message: "Trip updated successfully",
            data: updatedTrip
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Error updating trip"
        });
    }
});
const getAllTripsByTechnician = asyncHandler(async (req, res) => {
    try {
        const { technicianId } = req.params;
        const trips = await tripModel.find({ technician: technicianId })
            .select("tripName startDate endDate remarks") // return only required fields
            .lean();

        res.status(200).json({
            success: true,
            data: trips
        });
    } catch (error) {
        console.error("Error fetching trips:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching trips",
            error: error.message
        });
    }
});
const addExpenseByTechnicianAndTripId = asyncHandler(async (req, res) => {
    try {
        const { technicianId, tripId } = req.params
    } catch (error) {

    }
})
// Add expense for a technician's trip



// export const addTripExpense = asyncHandler(async (req, res) => {
//     const { tripId, technicianId } = req.params;
//     const { requiredAmount, typeOfExpense, screenshot, date } = req.body;

//     // validate
//     const amt = Number(requiredAmount);
//     if (!amt || isNaN(amt) || amt <= 0) {
//         return res.status(400).json({ success: false, message: "Please provide a valid requiredAmount (> 0)." });
//     }

//     // find trip
//     const trip = await tripModel.findById(tripId).populate("expenses");
//     if (!trip) return res.status(404).json({ success: false, message: "Trip not found." });
//     // ensure technician is assigned to this trip
//     if (!trip.technician || trip.technician.toString() !== technicianId) {
//         return res.status(400).json({ success: false, message: "Technician is not assigned to this trip." });
//     }
//     // find technician's advance account
//     const account = await expenseModel.findOne({ technician: technicianId, advancedAmount: { $exists: true } });
//     console.log("🚀 ~ account:", account)
//     if (!account) {
//         return res.status(400).json({
//             success: false,
//             message: "No advance account found for this technician. Admin must add advanced amount first."
//         });
//     }
//     // check balance
//     const currentBalance =
//         account.balance != null
//             ? Number(account.balance)
//             : Number(account.advancedAmount || 0) - Number(account.totalExpense || 0);

//     if (amt > currentBalance) {
//         return res.status(400).json({ success: false, message: "Not enough balance." });
//     }

//     // update account totals
//     account.totalExpense = (account.totalExpense || 0) + amt;
//     account.balance = currentBalance - amt;
//     await account.save();



//     // create transaction expense (record for this trip)
//     const transaction = await expenseModel.create({
//         requiredAmount: amt,
//         typeOfExpense,
//         screenshot,
//         technician: technicianId,
//         totalExpense: amt,   // per-record
//         balance: account.balance
//     });

//     // attach transaction to trip
//     trip.expenses.push(transaction._id);
//     await trip.save();

//     // 🔑 Calculate total expense for this trip
//     const tripExpenses = await expenseModel.find({ _id: { $in: trip.expenses } });
//     const tripTotalExpense = tripExpenses.reduce((sum, exp) => sum + (exp.requiredAmount || 0), 0);

//     return res.status(201).json({
//         success: true,
//         message: "Expense added successfully",
//         data: {
//             tripId: trip._id,
//             transaction,
//             accountSummary: {
//                 advancedAmount: account.advancedAmount,
//                 totalExpense: account.totalExpense, // overall technician
//                 balance: account.balance
//             },
//             tripSummary: {
//                 tripTotalExpense // ✅ total just for this trip
//             },
//             submittedData: {
//                 requiredAmount, typeOfExpense, screenshot, date
//             }
//         }
//     });
// });
const addTripExpense = asyncHandler(async (req, res) => {
    const { tripId, technicianId } = req.params;
    const { requiredAmount, typeOfExpense, screenshot, date, remarks } = req.body;

    // validate
    const amt = Number(requiredAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid amount (> 0)."
        });
    }

    // find trip
    const trip = await tripModel.findById(tripId).populate("expenses");
    if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found." });
    }
    if (trip.status === "completed") {
        return res.status(400).json({
            success: false,
            message: "Cannot add expenses to a completed trip."
        });
    }
    // ensure technician is assigned to this trip
    if (!trip.technician || trip.technician.toString() !== technicianId) {
        return res.status(400).json({ success: false, message: "Technician is not assigned to this trip." });
    }

    // find technician's advance account
    const account = await advanceAccountModel.findOne({ technician: technicianId });
    if (!account) {
        return res.status(400).json({
            success: false,
            message: "No advance account found for this technician. Admin must add advanced amount first."
        });
    }

    // check balance
    if (amt > account.balance) {
        return res.status(400).json({ success: false, message: "Not enough balance." });
    }

    // update account totals
    account.totalExpense += amt;
    account.balance -= amt;
    await account.save();

    // create expense linked to trip
    const expense = await expenseModel.create({
        trip: tripId,
        typeOfExpense,
        requiredAmount: amt,
        date: date || new Date(),
        screenshot,
        remarks
    });

    // attach expense to trip
    trip.expenses.push(expense._id);
    await trip.save();

    // 🔑 Calculate total expense for this trip
    const tripExpenses = await expenseModel.find({ _id: { $in: trip.expenses } });
    const tripTotalExpense = tripExpenses.reduce((sum, exp) => sum + (exp.requiredAmount || 0), 0);

    return res.status(201).json({
        success: true,
        message: "Expense added successfully",
        data: {
            tripId: trip._id,
            expense,
            accountSummary: {
                advancedAmount: account.advancedAmount,
                totalExpense: account.totalExpense,
                balance: account.balance
            },
            tripSummary: {
                tripTotalExpense
            },
            submittedData: {
                requiredAmount, typeOfExpense, screenshot, date, remarks
            }
        }
    });
});


export default { add, getById, getAll, getAllEmployees, updateById, deleteById, getUnassignedTools, assignedToolByTechnicianId, getAllOfficeStaff, createTripByTechnicianId, updateTripByTechnicianIdAndTripId, getAllTripsByTechnician, addTripExpense, getTripsWithExpensesByTechnician };