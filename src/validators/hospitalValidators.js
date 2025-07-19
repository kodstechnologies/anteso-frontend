import Joi from "joi";

export const hospitalSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    address: Joi.string().required(),
    branch: Joi.string().required(),
    phone: Joi.number().required(),
    gstNo: Joi.string().required()
});
