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
        enum: ['Sick Leave', 'casual leave', 'Maternity/Paternity', 'Leave without pay'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
        required: false
    },
    employee: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, { timestamps: true })
const Leave = mongoose.model('Leave', leaveSchema)
export default Leave