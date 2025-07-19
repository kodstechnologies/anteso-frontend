import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
    // Section 1: Enquiry Details
    leadOwner: { type: String, required: true },
    hospitalName: { type: String, required: true },
    fullAddress: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    branchName: { type: String, required: true },
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
                    'X-Ray', 'MRI', 'CT Scanner', 'Ultrasound', 'Ventilator',
                    'ECG', 'EEG', 'Infusion Pump', 'Defibrillator', 'Patient Monitor',
                    'Anesthesia Machine', 'Surgical Light', 'Autoclave', 'Suction Pump',
                    'Nebulizer', 'Oxygen Concentrator', 'Incubator', 'Dialysis Machine',
                    'Laparoscopy', 'C-Arm'
                ],
            },
            equipmentId: { type: String, required: true },
            typeOfWork: {
                type: String,
                required: true,
                enum: ['Installation', 'Repair', 'Maintenance', 'Inspection'],
            }
        }
    ],

    // Section 3: Additional Services (checkboxes)
    additionalServices: [{
        type: String,
        enum: [
            'Electrical Support', 'Civil Work', 'Calibration', 'Software Update',
            'Networking', 'Biomedical Certification', 'Warranty Extension',
            'Hardware Upgrade', 'Battery Replacement', 'Gas Pipeline Support', 'Documentation'
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
        required: true
    }

}, { timestamps: true });

const Enquiry = mongoose.model('Enquiry', enquirySchema);
export default Enquiry;
