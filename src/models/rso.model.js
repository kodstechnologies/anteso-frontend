// models/rso.model.js

import mongoose from 'mongoose';

const { Schema } = mongoose;

const rsoSchema = new Schema(
    {
        rsoId: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
        },
        rpId: {
            type: String,
            required: true,
        },
        tldBadge: {
            type: String,
            required: true,
        },
        validity: {
            type: Date,
            required: true,
        },
        attachment: {
            type: String, // path or file URL
            required: false,
        },
    },
    { timestamps: true }
);

const RSO = mongoose.model('RSO', rsoSchema);
export default RSO;
