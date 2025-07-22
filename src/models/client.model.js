import mongoose from 'mongoose';
import User from './user.model.js';
const { Schema } = mongoose;

const clientSchema = new Schema({
    gstNo: {
        type: String,
        required: true,
        unique: true,
    },
    hospitals: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
            default: [],
        },
    ],
    institutes: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Institute',
            default: [],
        },
    ],
    rsos: [
        {
            type: Schema.Types.ObjectId,
            ref: 'RSO',
            default: [],
        },
    ],
    machines:
    {
        type: Schema.Types.ObjectId,
        ref: 'Machine',
    },
});

const Client = User.discriminator('Customer', clientSchema);

export default Client;