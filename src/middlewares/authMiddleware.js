// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

const JWT_USER_SECRET = process.env.JWT_USER_SECRET;
const JWT_ADMIN_SECRET = process.env.JWT_SECRET;

export const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("🚀 ~ authenticate ~ token:", token)
    if (!token) throw new ApiError(401, "Token missing");

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_ADMIN_SECRET);
    } catch (err) {
        try {
            decoded = jwt.verify(token, JWT_USER_SECRET);
        } catch (innerErr) {
            throw new ApiError(401, "Invalid or expired token");
        }
    }
    console.log("✅ Token authenticated:", decoded);
    req.user = decoded;
    next();
};