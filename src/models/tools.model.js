import mongoose, { Schema } from 'mongoose';
import { generateReadableId } from '../utils/GenerateReadableId.js';

const toolsSchema = new Schema(
    {
        toolId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        SrNo: {
            type: String,
            required: true,
            trim: true,
        },
        nomenclature: {
            type: String,
            required: true,
            trim: true,
        },
        manufacturer: {
            type: String,
            required: true,
            trim: true,
        },
        manufacture_date: {
            type: Date,
            required: true,
        },
        model: {
            type: String,
            required: true,
            trim: true,
        },
        calibrationCertificateNo: {
            type: String,
            required: true,
            trim: true,
        },
        calibrationDate: {
            type: Date,
            required: true,
        },
        calibrationValidTill: {
            type: Date,
            required: true,
        },
        range: {
            type: String,
            required: true,
            trim: true,
        },
        certificate: {
            type: String,
        },
        toolStatus: {
            type: String,
            enum: ['assigned', 'unassigned'],
            default: 'unassigned',
        },
        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
        },
    },
    {
        timestamps: true,
    }
);

toolsSchema.pre('validate', async function (next) {
    if (!this.toolId) {
        this.toolId = await generateReadableId('Tool', 'TL');
    }
    next();
});

const Tools = mongoose.model('Tool', toolsSchema);

export default Tools;
