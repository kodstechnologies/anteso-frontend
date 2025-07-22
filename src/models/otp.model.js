import mongoose from 'mongoose';
const otpSchema = new mongoose.Schema({
    mobileNumber: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: false
    },
    otpExpiry: {
        type: Date,
        required: true,
        index: { expires: 0 } 
    }
},
    { timestamps: true })
export default mongoose.model('otp', otpSchema)