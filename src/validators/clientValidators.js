import Joi from "joi";

export const clientValidationSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.number().required(),
    email: Joi.string().email().required(),
    address: Joi.string().optional(),
    gstNo: Joi.string().optional(),

    // Optional references
    hospitals: Joi.array().items(Joi.string().hex().length(24)),
    institutes: Joi.array().items(Joi.string().hex().length(24)),
    rsos: Joi.array().items(Joi.string().hex().length(24)),
});
