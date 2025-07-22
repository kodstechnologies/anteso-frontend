import { ApiError } from "../utils/ApiError.js";

// middlewares/authorize.js
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            console.log("🚀 ~ return ~ req.user.role:", req.user.role)

            throw new ApiError(403, "Access denied");
        }
        next();
    };
};