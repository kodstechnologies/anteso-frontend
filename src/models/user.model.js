import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: Number,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        address: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        discriminatorKey: 'role', 
    }
);

const User = mongoose.model('User', userSchema);

export default User;