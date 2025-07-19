import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
const JWT_SECRET = process.env.JWT_SECRET
console.log("🚀 ~ JWT_SECRET:", JWT_SECRET)
export const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check if token is provided
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "Access token missing or invalid");
    }

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach decoded user data to the request
        console.log("🚀 ~ verifyAccessToken ~ decoded:", decoded)

        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired access token");
    }
});
