import mongoose from 'mongoose';

const loginOtpSchema = new mongoose.Schema(
    {
        mobileNumber: {
            type: String,
            required: true,
        },
        otp: {
            type: String,
            required: true,
        },
        otpExpiry: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
    },
    { timestamps: true }
);

export default mongoose.model('LoginOtp', loginOtpSchema);
