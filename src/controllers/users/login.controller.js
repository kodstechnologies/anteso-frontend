import Joi from "joi";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import LoginOtp from "../../models/otpLogins.model.js";
import sendSMS from "../../utils/SendSMS.js";
import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";

const JWT_USER_SECRET = process.env.JWT_USER_SECRET;

//otp functions using sendsms function

// ================== SEND OTP ==================
// export const sendOtp = asyncHandler(async (req, res) => {
//     const mobileVerifySchema = Joi.object({
//         mobileNumber: Joi.string().required(),
//     });

//     const { error } = mobileVerifySchema.validate(req.body);
//     if (error) throw new ApiError(400, error.details[0].message);

//     const { mobileNumber } = req.body;
//      const existingUser = await User.findOne({ phone: mobileNumber, role: "Customer" });
//     console.log("🚀 ~ existingUser:", existingUser)
//     if (!existingUser) {
//         throw new ApiError(404, "Mobile number not registered! Please contact admin.");
//     }

//     // Generate OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     console.log("🚀 ~ sendOtp ~ otp:", otp)
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

//     const message = `Dear User, Your OTP for login is ${otp}. It is valid for 10 minutes. Please do not share this OTP with anyone. - ANTESO BIOMEDICAL`;

//     try {
//         await sendSMS(mobileNumber, message);
//         await LoginOtp.findOneAndUpdate(
//             { mobileNumber },
//             { otp, expiresAt },
//             { upsert: true, new: true }
//         );

//         return res.status(200).json(
//             new ApiResponse(200, null, "OTP sent successfully")
//         );
//     } catch (err) {
//         console.error("Error sending OTP:", err);
//         throw new ApiError(500, "Failed to send OTP", [err.message]);
//     }
// });

// ================== VERIFY OTP ==================
// export const verifyOtp = asyncHandler(async (req, res) => {
//     const verifyOtpSchema = Joi.object({
//         mobileNumber: Joi.string().required(),
//         otp: Joi.string().length(6).required()
//     });

//     const { error } = verifyOtpSchema.validate(req.body);
//     if (error) throw new ApiError(400, error.details[0].message);

//     const { mobileNumber, otp } = req.body;
//     const otpRecord = await LoginOtp.findOne({ mobileNumber });

//     if (!otpRecord) throw new ApiError(400, "No OTP sent to this number");
//     if (otpRecord.expiresAt < new Date()) throw new ApiError(400, "OTP has expired");
//     if (otpRecord.otp !== otp) throw new ApiError(400, "Invalid OTP");

//     // ✅ Ensure only "Customer" can log in
//     const user = await User.findOne({ phone: mobileNumber, role: "Customer" });
//     if (!user) throw new ApiError(404, "Client not found or not allowed");

//     const payload = {
//         _id: user._id,
//         role: user.role,
//         phone: user.phone,
//     };

//     const token = jwt.sign(payload, JWT_USER_SECRET, { expiresIn: "1d" });

//     await LoginOtp.deleteOne({ mobileNumber });

//     return res.status(200).json(
//         new ApiResponse(200, { token, user }, "OTP verified successfully")
//     );
// });


//test otp functions--without send sms

const HARDCODED_MOBILE = "6655443322";
const HARDCODED_OTP = "123456";

export const sendOtp = asyncHandler(async (req, res) => {
    const mobileVerifySchema = Joi.object({
        mobileNumber: Joi.string().required(),
    });

    const { error } = mobileVerifySchema.validate(req.body);
    if (error) throw new ApiError(400, error.details[0].message);

    const { mobileNumber } = req.body;

    // Allow only hardcoded number
    if (mobileNumber !== HARDCODED_MOBILE) {
        throw new ApiError(403, "This number is not allowed in test mode.");
    }

    const existingUser = await User.findOne({ phone: mobileNumber });
    if (!existingUser) {
        throw new ApiError(404, "Mobile number not registered! Please contact admin.");
    }

    // Skip sending SMS
    console.log(`Mock OTP for ${mobileNumber}: ${HARDCODED_OTP}`);

    return res.status(200).json(
        new ApiResponse(200, null, "Mock OTP generated successfully")
    );
});

export const verifyOtp = asyncHandler(async (req, res) => {
    const verifyOtpSchema = Joi.object({
        mobileNumber: Joi.string().required(),
        otp: Joi.string().length(6).required()
    });
    const { error } = verifyOtpSchema.validate(req.body);
    if (error) throw new ApiError(400, error.details[0].message);
    const { mobileNumber, otp } = req.body;
    if (mobileNumber !== HARDCODED_MOBILE) {
        throw new ApiError(403, "This number is not allowed in test mode.");
    }
    if (otp !== HARDCODED_OTP) {
        throw new ApiError(400, "Invalid OTP");
    }
    const user = await User.findOne({ phone: mobileNumber });
    if (!user) throw new ApiError(404, "User not found");
    const payload = {
        _id: user._id,
        role: user.role,
        phone: user.phone,
    };
    const token = jwt.sign(payload, JWT_USER_SECRET, { expiresIn: "1h" });
    return res.status(200).json(
        new ApiResponse(200, { token, user }, "OTP verified successfully")
    );
});