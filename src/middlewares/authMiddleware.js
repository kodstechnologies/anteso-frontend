// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) throw new ApiError(401, "Token missing");

    try {
        const decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
        req.user = decoded; // contains id and role
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
};
