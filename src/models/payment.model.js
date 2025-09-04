import mongoose, { Schema, model } from "mongoose";
import { generateReadableId } from "../utils/GenerateReadableId.js";

const paymentSchema = new Schema(
    {
        paymentId: {
            type: String,
            unique: true,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order", // Reference to the Order collection
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
            enum: ["advance", "balance", "complete"],
        },
        utrNumber: {
            type: String,
            required: true,
        },
        screenshot: {
            type: String, // Can store URL or file path
        },
    },
    { timestamps: true }
);

// 🔹 Auto-generate paymentId before saving
paymentSchema.pre("save", async function (next) {
    if (this.isNew && !this.paymentId) {
        this.paymentId = await generateReadableId("Payment", "PAY");
    }
    next();
});

const Payment = model("Payment", paymentSchema);

export default Payment;
