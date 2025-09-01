import mongoose, { Schema } from 'mongoose';
import { genarateSRFNumber } from '../utils/generateSRFNumber.js';

const orderSchema = new mongoose.Schema({
    srfNumber: {
        type: String,
        unique: true
    },
    leadOwner: {
        type: String,
        // required: true
    },
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
    designation: { type: String },
    advanceAmount: { type: Number },
    workOrderCopy: { type: String },
    partyCodeOrSysId: { type: String },
    procNoOrPoNo: { type: String },
    procExpiryDate: { type: Date },
    //  customer: Only include users of role = 'customer'
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    urgency: { type: String, enum: ['normal', 'tatkal'] },
    //  Reference to the  Service model
    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    additionalServices: {
        type: Map,
        of: String,
        default: {}
    },
    // additionalServices: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'AdditionalService'
    //     }
    // ],
    specialInstructions: { type: String },
    courierDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Courier'
    },
    status: {
        type: String,
        enum: ['pending', 'inprogress', 'generated', 'completed', 'paid'],
        default: 'pending'
    },
    quotation: {
        type: Schema.Types.ObjectId,
        ref: 'Quotation',
        // required: true,
    },
    rawFile: { type: String },
    rawPhoto: { type: String },
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
    if (!this.srfNumber) {
        this.srfNumber = await genarateSRFNumber();
    }
    next();
});
export default mongoose.model('Order', orderSchema);