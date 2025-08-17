import Joi from "joi";

export const enquirySchema = Joi.object({
    leadOwner: Joi.string(),
    hospitalName: Joi.string().required(),
    fullAddress: Joi.string().required(),
    city: Joi.string().required(),
    district: Joi.string().required(),
    state: Joi.string().required(),
    pinCode: Joi.string().required(),
    branch: Joi.string().required(),
    contactPerson: Joi.string().required(),
    emailAddress: Joi.string().email().required(),
    contactNumber: Joi.string().required(),
    designation: Joi.string().required(),

    services: Joi.array()
        .items(
            Joi.object({
                machineType: Joi.string()
                    .valid(
                        'Fixed X-Ray',
                        'Mobile X-Ray',
                        'C-Arm',
                        'Cath Lab/Interventional Radiology',
                        'Mammography',
                        'CT Scan',
                        'PET CT',
                        'CT Simulator',
                        'OPG',
                        'CBCT',
                        'BMD/DEXA',
                        'Dental IOPA',
                        'Dental Hand Held',
                        'O Arm',
                        'KV Imaging (OBI)',
                        'Lead Apron Test',
                        'Thyroid Shield Test',
                        'Gonad Shield Test',
                        'Radiation Survey of Radiation Facility',
                        'Others',
                    )
                    .required(),
                equipmentNo: Joi.string().required(),
                workType: Joi.array()
                    .items(
                        Joi.string().valid(
                            'Quality Assurance Test',
                            'License for Operation',
                            'Decommissioning',
                            'Decommissioning and Recommissioning'
                        )
                    )
                    .required(),

                machineModel: Joi.string().required()
            })
        )
        .required(),

    additionalServices: Joi.object().pattern(
        Joi.string().valid(
            'INSTITUTE REGISTRATION',
            'RSO REGISTRATION, NOMINATION & APPROVAL',
            'DECOMMISSIONING, PRE OWNED PROCUREMENT, QA & LICENSE',
            'PROCUREMENT',
            'TLD BADGE',
            'LEAD SHEET',
            'LEAD GLASS',
            'LEAD APRON',
            'THYROID SHIELD',
            'GONAD SHIELD',
            'OTHERS'
        ),
        Joi.any() // or Joi.string().allow('', null), depending on the value format you allow
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

    customer: Joi.string().optional()
});
