// models/rso.model.js

import mongoose from 'mongoose';

const { Schema } = mongoose;

const rsoSchema = new Schema(
    {
        rsoId: {
            type: String,
            required: false,
            unique: true,
        },
        password: {
            type: String,
            required: false,
        },
        email: {
            type: String,
            required: false,
            lowercase: true,
        },
        phone: {
            type: String,
            required: false,
        },
        rpId: {
            type: String,
            required: false,
        },
        tldBadge: {
            type: String,
            required: false,
        },
        validity: {
            type: Date,
            required: false,
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
