import mongoose from "mongoose";
import User from "../models/user.model.js";

const { Schema } = mongoose;

const qaTestSchema = new Schema({
    testName: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
    },
});

// Manufacturer Schema
const ManufacturerSchema = new Schema(
    {
        city: {
            type: String,
        },
        state: {
            type: String,
        },
        pincode: {
            type: String,
        },
        branch: {
            type: String,
        },
        mouValidity: {
            type: Date,
        },
        qaTests: {
            type: [qaTestSchema],
            default: [
                { testName: "FIXED X RAY", price: 3500 },
                { testName: "MOBILE X RAY", price: 2500 },
                { testName: "C ARM", price: 3000 },
                { testName: "MAMMOGRAPH", price: 4000 },
                { testName: "CATH LAB", price: 5000 },
                { testName: "CT SCAN", price: 600 },
            ],
        },
        services: {
            type: [String], // e.g. ["Installation", "Maintenance", "Support"]
            default: [],
        },
        travelCost: {
            type: String,
            enum: ["Actual Cost", "Fixed Cost"],
            default: "Actual Cost",
        },
    },
    { timestamps: true }
);

const Manufacturer = User.discriminator("Manufacturer", ManufacturerSchema);

export default Manufacturer;
