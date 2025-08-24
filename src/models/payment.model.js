import mongoose, { Schema, model } from 'mongoose';

// Payment Schema
const paymentSchema = new Schema(
    {
        srfNumber: {
            type: Schema.Types.ObjectId,
            ref: 'Order', // Reference to the Order collection
            required: true,
        },
        totalAmount: {
            type: Number,
        },
        paymentAmount: {
            type: Number,
        },
        paymentType: {
            type: String,
            enum: ['advance', 'balance', 'complete'],
        },
        utrNumber: {
            type: String,
            required: true,
        },
        screenshot: {
            type: String, // Can store URL or file path
        },
    },
    { timestamps: true } // Adds createdAt and updatedAt fields
);

const Payment = model('Payment', paymentSchema);

export default Payment;
