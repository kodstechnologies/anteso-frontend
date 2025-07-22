// models/machine.model.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Hardcoded list of machine types
const MACHINE_TYPES = [
    'X-Ray',
    'Ultrasound',
    'MRI',
    'CT Scan',
    'ECG',
    'Ventilator',
    'Defibrillator',
    'Infusion Pump',
    'Anesthesia Machine',
    'Endoscope',
    'Patient Monitor',
    'Suction Machine',
    'Autoclave',
    'Centrifuge',
    'Incubator',
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
