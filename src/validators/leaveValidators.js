import Joi from "joi";

export const leaveValidationSchema = Joi.object({
    startDate: Joi.date()
        .required()
        .messages({
            "date.base": "Start date must be a valid date",
            "any.required": "Start date is required",
        }),

    endDate: Joi.date()
        .greater(Joi.ref('startDate'))
        .required()
        .messages({
            "date.base": "End date must be a valid date",
            "date.greater": "End date cannot be before start date",
            "any.required": "End date is required",
        }),

    leaveType: Joi.string()
        .valid(
            'Sick Leave',
            'Vacation',
            'Personal Leave',
            'Maternity/Paternity',
            'Bereavement Leave'
        )
        .required()
        .messages({
            "any.only": "Invalid leave type",
            "any.required": "Leave type is required",
        }),

    reason: Joi.string()
        .required()
        .messages({
            "string.empty": "Reason is required",
        }),

    status: Joi.string()
        .valid("Pending", "Approved", "Rejected")
        .optional()
        .messages({
            "any.only": "Invalid status value",
        })
});
