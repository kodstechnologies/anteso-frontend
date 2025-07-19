import mongoose, { Schema } from 'mongoose';
const leaveSchema = mongoose.Schema({
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    leaveType: {
        type: String,
        enum: ['Sick Laeve', 'Vacation', 'Personal Leave', 'Maternity/Paternity', 'Bereavement Leave'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        required: true
    }

})
const Leave=mongoose.model('Leave',leaveSchema)
export default Leave