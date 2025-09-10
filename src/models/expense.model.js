import mongoose, { Schema } from 'mongoose';
const expenseSchema = new mongoose.Schema({
    trip: {
        type: Schema.Types.ObjectId,
        ref: 'Trip',
        required: true
    },
    typeOfExpense: {
        type: String,
        enum: ["travel", "food", "lodging", "other"],
        required: true
    },
    requiredAmount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    screenshot: {
        type: String // file path or S3 URL
    },
    remarks: {
        type: String,
        trim: true
    }
}, { timestamps: true });
export default mongoose.model('Expense', expenseSchema);
