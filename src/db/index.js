import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv'
dotenv.config();
const MONGODB_URL = process.env.MONGODB_URL
// console.log("🚀 ~ MONGODB_URI:", MONGODB_URI)
const connectToDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(MONGODB_URL)
        console.log("connected to mongodb");

    } catch (error) {
        console.error("MONGODB connection Failed: " + error);

    }
}
export default connectToDb