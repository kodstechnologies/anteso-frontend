import { asyncHandler } from "../../utils/AsyncHandler.js";
import Expense from "../../models/expense.model.js"; // adjust path if needed
import mongoose from "mongoose";
import advanceAccountModel from "../../models/advanceAccount.model.js";

// Add or update advanced amount for a technician
// const addAdvance = asyncHandler(async (req, res) => {
//     const { technicianId } = req.params;
//     const { advancedAmount } = req.body;
//     console.log("REQ BODY:", req.body);
//     if (!advancedAmount || isNaN(advancedAmount)) {
//         return res.status(400).json({
//             success: false,
//             message: "Please provide a valid advanced amount"
//         });
//     }
//     let expense = await Expense.findOne({ technician: technicianId });
//     console.log("🚀 ~ expense:", expense)
//     if (!expense) {
//         // Create a new expense record with balance equal to advancedAmount
//         expense = new Expense({
//             technician: technicianId,
//             advancedAmount: Number(advancedAmount),
//             balance: Number(advancedAmount)
//         });
//     } else {
//         // Add to existing advanced amount and balance
//         expense.advancedAmount = (expense.advancedAmount || 0) + Number(advancedAmount);
//         expense.balance = (expense.balance || 0) + Number(advancedAmount);
//     }
//     await expense.save();
//     res.status(200).json({
//         success: true,
//         message: "Advanced amount added and balance updated successfully",
//         data: expense
//     });
// });

// Add Advance Amount
const addAdvance = asyncHandler(async (req, res) => {
    const { technicianId } = req.params;
    const { advancedAmount } = req.body;

    if (!advancedAmount || advancedAmount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    let account = await advanceAccountModel.findOne({ technician: technicianId });

    if (!account) {
        account = new advanceAccountModel({
            technician: technicianId,
            logs: [{ amount: advancedAmount }],
            advancedAmount: advancedAmount,
            balance: advancedAmount
        });
    } else {
        account.logs.push({ amount: advancedAmount });
        account.advancedAmount += advancedAmount;
        account.balance += advancedAmount;
    }

    await account.save();

    res.status(200).json({
        success: true,
        data: account
    });
});




//not changed
const getAddedAdvance = asyncHandler(async (req, res) => {
    try {
        const { technicianId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(technicianId)) {
            return res.status(400).json({ message: "Invalid technician ID" });
        }
        const advancedAmount = await Expense.find({ technician: technicianId })
            .select("advancedAmount") // only needed fields
            .sort({ createdAt: -1 }); // latest first

        if (!advancedAmount || advancedAmount.length === 0) {
            return res.status(404).json({ message: "No expenses found for this technician" });
        }
        res.status(200).json({
            success: true,
            count: advancedAmount.length,
            data: advancedAmount,
        });
    } catch (error) {
        console.error("Error fetching advances:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
const getExpenseLogs = asyncHandler(async (req, res) => {
    try {

    } catch (error) {

    }
})
const addExpenses = asyncHandler(async (req, res) => {
    try {

    } catch (error) {

    }
})

export default { addAdvance, getAddedAdvance };