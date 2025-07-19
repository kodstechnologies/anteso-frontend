import Admin from "../../models/admin.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema } from "../../validators/adminValidators.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
const JWT_SECRET=process.env.JWT_SECRET;
console.log("🚀 ~ JWT_SECRET:", JWT_SECRET)
const JWT_REFRESH_SECRET=process.env.JWT_REFRESH_SECRET;
console.log("🚀 ~ JWT_REFRESH_SECRET:", JWT_REFRESH_SECRET)
export const adminLogin = asyncHandler(async (req, res) => {
    // 1. Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
        throw new ApiError(400, error.details[0].message);
    }

    const { email, password } = value;

    // 2. Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    // 3. Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    // 4. Generate tokens
    const accessToken = jwt.sign(
        { id: admin._id, email: admin.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
        { id: admin._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    // 5. Optional: Store or send refreshToken securely (e.g. HTTP-only cookie)
    res.status(200).json(
        new ApiResponse(200, { accessToken, refreshToken }, "Login successful")
    );
});
