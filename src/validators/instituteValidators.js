import Joi from "joi";

export const instituteSchema = Joi.object({
    eloraId: Joi.string().required(),
    password: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.number().required()
});