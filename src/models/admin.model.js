import mongoose, { Schema } from 'mongoose';

const adminSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        role: {
            type: String,
            enum: ['admin', 'staff'], // add more roles as needed
            default: 'admin',
        },
    },
    {
        timestamps: true,
    }
);

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
