import { Schema } from "mongoose";
import mongoose from 'mongoose'
import { generateReadableId } from "../utils/GenerateReadableId.js";

const quotationSchema = new Schema(
    {
        quotationId: {
            type: String,
            unique: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        enquiry: {
            type: Schema.Types.ObjectId,
            ref: 'Enquiry',
            required: true,
        },
        from: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        discount: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            required: true,
        },
        quotationStatus: {
            type: String,
            enum: ['Create', 'Created', 'Accepted', 'Rejected'],
            // default: 'Create',
        },
        rejectionRemark: {
            type: String
        },
        customersPDF: {
            type: String
        },
        termsAndConditions: [String],
    },
    { timestamps: true }
);

quotationSchema.pre('save', async function (next) {
    if (!this.quotationId) {
        this.quotationId = await generateReadableId('Quotation', 'QUO');
    }
    next();
});

const Quotation = mongoose.model('Quotation', quotationSchema);

export default Quotation;