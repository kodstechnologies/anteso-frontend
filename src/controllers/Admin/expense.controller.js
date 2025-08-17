import { asyncHandler } from "../../utils/AsyncHandler.js";
import Expense from "../../models/expense.model.js"; // adjust path if needed

// Add or update advanced amount for a technician
const addAdvance = asyncHandler(async (req, res) => {
    const { technicianId } = req.params;
    const { advancedAmount } = req.body;
    console.log("REQ BODY:", req.body);

    if (!advancedAmount || isNaN(advancedAmount)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid advanced amount"
        });
    }
    let expense = await Expense.findOne({ technician: technicianId });
    if (!expense) {
        // Create a new expense record with balance equal to advancedAmount
        expense = new Expense({
            technician: technicianId,
            advancedAmount: Number(advancedAmount),
            balance: Number(advancedAmount)
        });
    } else {
        // Add to existing advanced amount and balance
        expense.advancedAmount = (expense.advancedAmount || 0) + Number(advancedAmount);
        expense.balance = (expense.balance || 0) + Number(advancedAmount);
    }
    await expense.save();
    res.status(200).json({
        success: true,
        message: "Advanced amount added and balance updated successfully",
        data: expense
    });
});

const editAdvancedAmount = asyncHandler(async (req, res) => {
    try {
        const { technicianId } = req.params
        const {tripId}=req.body
    } catch (error) {
        throw new Error("error in editAdvancedAmount");
        console.error(error)
    }
})

export default { addAdvance, editAdvancedAmount };



