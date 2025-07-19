import mongoose, { Schema } from 'mongoose';

const toolsSchema = new Schema(
    {
        toolId: {
            type: String,
            required: true,
            trim: true,
            unique: true,
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
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

const Tools = mongoose.model('Tool', toolsSchema);

export default Tools;
