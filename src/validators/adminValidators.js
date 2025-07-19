import Joi from "joi";

export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "Email must be a valid email",
        "string.empty": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters",
    }),
});
