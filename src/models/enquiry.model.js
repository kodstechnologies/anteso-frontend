import mongoose from 'mongoose';
import { generateReadableId } from '../utils/GenerateReadableId.js';

const enquirySchema = new mongoose.Schema({
    // Section 1: Enquiry Details
    enquiryId: {
        type: String,
        unique: true,
    },
    leadOwner: { type: String, required: false },
    hospitalName: { type: String, required: true },
    fullAddress: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    branch: { type: String, required: true },
    contactPerson: { type: String, required: true },
    emailAddress: { type: String, required: true },
    contactNumber: { type: String, required: true },
    designation: { type: String, required: true },
    services: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service'
        }
    ],
    // Section 3: Additional Services (checkboxes)
    // additionalServices: {
    //     type: Map,
    //     of: String,
    //     default: {}
    // },
    additionalServices: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AdditionalService'
        }
    ],
    // Section 4: Special Instructions & Attachment
    specialInstructions: { type: String },
    attachment: { type: String }, // file URL or path

    // Status Tracking
    enquiryStatus: {
        type: String,
        enum: ['Enquired', 'Quotation Sent', 'Approved', 'Rejected'],
        default: 'Enquired'
    },
    enquiryStatusDates: {
        enquiredOn: { type: Date },
        quotationSentOn: { type: Date },
        approvedOn: { type: Date }
    },
    // quotation: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Quotation',
    // },
    quotationStatus: {
        type: String,
        enum: ['Create', 'Created', 'Accepted', 'Rejected'],
        default: 'Create'
    },
    // Customer Reference (from User base model)
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // base model name
        required: false,
        default: null
    },
    subtotalAmount: {
        type: String
    },
    discount: {
        type: String
    },
    grandTotal: {
        type: String
    }
}, { timestamps: true });
enquirySchema.pre('save', async function (next) {
    if (!this.enquiryId) {
        this.enquiryId = await generateReadableId('Enquiry', 'EN');
    }
    next();
});
const Enquiry = mongoose.model('Enquiry', enquirySchema);
export default Enquiry;