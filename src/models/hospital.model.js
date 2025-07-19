// models/hospital.model.js

import mongoose from 'mongoose';

const { Schema } = mongoose;

const hospitalSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            lowercase: true,
        },
        address: {
            type: String,
        },
        branch: {
            type: String,
        },
        phone: {
            type: String,
        },
        gstNo: {
            type: String,
            unique: true,
        },
    },
    { timestamps: true }
);

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
