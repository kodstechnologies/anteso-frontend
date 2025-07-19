// models/institute.model.js

import mongoose from 'mongoose';

const { Schema } = mongoose;

const instituteSchema = new Schema(
    {
        eloraId: {
            type: String,
            unique: true,
        },
        password: {
            type: String,
        },
        email: {
            type: String,
            lowercase: true,
        },
        phone: {
            type: String,
        },
    },
    { timestamps: true }
);

const Institute = mongoose.model('Institute', instituteSchema);
export default Institute;
