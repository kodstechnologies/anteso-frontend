import mongoose, { Schema } from "mongoose";
const expenseSchema = new mongoose.Schema({
    advancedAmount: {
        type: Number,
    },
    requiredAmount: {
        type: Number,
    },  
    typeOfExpense: {
        type: String,
        enum: ["travel", "food", "lodging", "other"],
    },
    date: {
        type: Date,
        default: Date.now
    },
    screenshot: {
        type: String,
    },
    totalExpense: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    technician: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
    },
}, { timestamps: true });

export default mongoose.model("Expense", expenseSchema);