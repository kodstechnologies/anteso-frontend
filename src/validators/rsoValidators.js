import Joi from "joi";

// Validation schema
export const rsoSchema = Joi.object({
    rsoId: Joi.string().required(),
    password: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.number().required(),
    rpId: Joi.string().required(),
    tldBadge: Joi.string().required(),
    validity: Joi.date().required(),
    attachment: Joi.string().uri().required()
});
