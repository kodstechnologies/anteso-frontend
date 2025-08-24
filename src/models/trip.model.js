import mongoose, { Schema } from 'mongoose';
const tripSchema = new mongoose.Schema({
    tripName: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    remarks: {
        type: String,
        trim: true
    },
    technician: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
    },
    expenses: [{
        type: Schema.Types.ObjectId,
        ref: 'Expense'
    }],
    tripstatus: {
        type: String,
        default: "ongoing"
    },
    tripTotalExpense: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model('Trip', tripSchema);