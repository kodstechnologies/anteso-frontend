import Joi from "joi";

export const enquirySchema = Joi.object({
    leadOwner: Joi.string().required(),
    hospitalName: Joi.string().required(),
    fullAddress: Joi.string().required(),
    city: Joi.string().required(),
    district: Joi.string().required(),
    state: Joi.string().required(),
    pinCode: Joi.string().required(),
    branchName: Joi.string().required(),
    contactPersonName: Joi.string().required(),
    emailAddress: Joi.string().email().required(),
    contactNumber: Joi.string().required(),
    designation: Joi.string().required(),

    services: Joi.array()
        .items(
            Joi.object({
                machineType: Joi.string()
                    .valid(
                        'X-Ray', 'MRI', 'CT Scanner', 'Ultrasound', 'Ventilator',
                        'ECG', 'EEG', 'Infusion Pump', 'Defibrillator', 'Patient Monitor',
                        'Anesthesia Machine', 'Surgical Light', 'Autoclave', 'Suction Pump',
                        'Nebulizer', 'Oxygen Concentrator', 'Incubator', 'Dialysis Machine',
                        'Laparoscopy', 'C-Arm'
                    )
                    .required(),
                equipmentId: Joi.string().required(),
                typeOfWork: Joi.string()
                    .valid('Installation', 'Repair', 'Maintenance', 'Inspection')
                    .required()
            })
        )
        .required(),

    additionalServices: Joi.array().items(
        Joi.string().valid(
            'Electrical Support', 'Civil Work', 'Calibration', 'Software Update',
            'Networking', 'Biomedical Certification', 'Warranty Extension',
            'Hardware Upgrade', 'Battery Replacement', 'Gas Pipeline Support', 'Documentation'
        )
    ),

    specialInstructions: Joi.string().allow('', null),
    attachment: Joi.string().allow('', null),

    enquiryStatus: Joi.string().valid('Enquired', 'Quotation Sent', 'Approved'),
    enquiryStatusDates: Joi.object({
        enquiredOn: Joi.date().optional(),
        quotationSentOn: Joi.date().optional(),
        approvedOn: Joi.date().optional()
    }),

    quotationStatus: Joi.string().valid('Create', 'Created', 'Accepted', 'Rejected'),

    customer: Joi.string().required()
});
