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
    
}, { timestamps: true });

export default mongoose.model('Trip', tripSchema);