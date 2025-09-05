// models/machine.model.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Hardcoded list of machine types
const MACHINE_TYPES = [
    "Fixed X-Ray",
    "Mobile X-Ray",
    "C-Arm",
    "Cath Lab/Interventional Radiology",
    "Mammography",
    "CT Scan",
    "PET CT",
    "CT Simulator",
    "OPG",
    "CBCT",
    "BMD/DEXA",
    "Dental IOPA",
    "Dental Hand Held",
    "O Arm",
    "KV Imaging (OBI)",
    "Lead Apron Test",
    "Thyroid Shield Test",
    "Gonad Shield Test",
    "Radiation Survey of Radiation Facility",
    "Others",
];

const machineSchema = new Schema(
    {
        machineType: {
            type: String,
            enum: MACHINE_TYPES,
            required: true,
        },
        make: {
            type: String,
            required: true,
            trim: true,
        },
        model: {
            type: String,
            required: true,
            trim: true,
        },
        serialNumber: {
            type: String,
            required: true,
            unique: true,
        },
        equipmentId: {
            type: String,
            required: true,
            unique: true,
        },
        qaValidity: {
            type: Date,
            required: true,
        },
        licenseValidity: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            // enum: ['Working', 'Not Working', 'Under Maintenance', 'Decommissioned'],
            required: true,
        },
        rawDataAttachment: {
            type: String,
            default: null,
        },
        qaReportAttachment: {
            type: String,
            required: false,
        },
        licenseReportAttachment: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ['Active', 'Pending', 'Expired'],
            default: 'Active'
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
    },
    { timestamps: true }
);

const Machine = mongoose.model('Machine', machineSchema);

export default Machine;