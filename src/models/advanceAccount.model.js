import mongoose, { Schema } from "mongoose";

const advanceAccountSchema = new mongoose.Schema({
    technician: {
        type: Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
        unique: true, // one account per technician
    },
    logs: [
        {
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now }
        }
    ],
    advancedAmount: {
        type: Number,
        default: 0,
    },
    totalExpense: {
        type: Number,
        default: 0,
    },
    balance: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

export default mongoose.model("AdvanceAccount", advanceAccountSchema);
