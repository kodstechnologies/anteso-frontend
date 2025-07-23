import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
    // Section 1: Enquiry Details
    leadOwner: { type: String, required: false },
    hospitalName: { type: String, required: true },
    fullAddress: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    branch: { type: String, required: true },
    contactPersonName: { type: String, required: true },
    emailAddress: { type: String, required: true },
    contactNumber: { type: String, required: true },
    designation: { type: String, required: true },

    // Section 2: Services (multiple entries)
    services: [
        {
            machineType: {
                type: String,
                required: true,
                enum: [
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
                ],
            },
            equipmentNo: { type: String, required: true },
            workType: {
                type: [String],
                required: true,
                validate: {
                    validator: function (arr) {
                        const allowed = [
                            'Quality Assurance Test',
                            'License for Operation',
                            'Decommissioning',
                            'Decommissioning and Recommissioning'
                        ];
                        return arr.every((val) => allowed.includes(val));
                    },
                    message: 'Invalid workType value'
                }
            },

            machineModel: { type: String, required: true }
        }
    ],

    // Section 3: Additional Services (checkboxes)
    additionalServices: [{
        type: String,
        enum: [
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
            'OTHERS',
        ]
    }],

    // Section 4: Special Instructions & Attachment
    specialInstructions: { type: String },
    attachment: { type: String }, // file URL or path

    // Status Tracking
    enquiryStatus: {
        type: String,
        enum: ['Enquired', 'Quotation Sent', 'Approved'],
        default: 'Enquired'
    },
    enquiryStatusDates: {
        enquiredOn: { type: Date },
        quotationSentOn: { type: Date },
        approvedOn: { type: Date }
    },

    quotationStatus: {
        type: String,
        enum: ['Create', 'Created', 'Accepted', 'Rejected'],
        default: 'Create'
    },

    // Customer Reference (from User base model)
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // base model name
        required: true,
        default: null
    }

}, { timestamps: true });

const Enquiry = mongoose.model('Enquiry', enquirySchema);
export default Enquiry;
