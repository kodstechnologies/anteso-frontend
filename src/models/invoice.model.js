import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema({
    machineType: { type: String },
    description: { type: String },
    quantity: { type: Number },
    rate: { type: Number },
    hsnno: { type: String },
});

const dealerHospitalSchema = new Schema({
    partyCode: { type: String },
    hospitalName: { type: String },
    location: { type: String },
    dealerState: { type: String },
    modelNo: { type: String },
    amount: { type: Number },
});

const invoiceSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["Customer", "Dealer/Manufacturer"],
        },
        invoiceId: { type: String, },
        srfNumber: { type: String, },
        buyerName: { type: String },
        address: { type: String },
        state: { type: String },
        gstin: { type: String },

        // If Customer
        services: [serviceSchema],

        // If Dealer/Manufacturer
        dealerHospitals: [dealerHospitalSchema],

        // Common Fields
        totalAmount: { type: Number },
        remarks: { type: String },
        sgst: { type: Number, default: 0 },
        cgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        subtotal: { type: Number },
        grandtotal: { type: Number },

        // Reference to Enquiry
        enquiry: {
            type: Schema.Types.ObjectId,
            ref: "Enquiry",
        },
        payment: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
        },
    },
    { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;