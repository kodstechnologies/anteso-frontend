import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import Admin from "../src/models/admin.model.js"; // adjust if your path differs

dotenv.config();
const MONGODB_URL = process.env.MONGODB_URL
const EMAIL1 = process.env.EMAIL1;
const EMAIL2 = process.env.EMAIL2;
const EMAIL3 = process.env.EMAIL3;

const PASSWORD1 = process.env.PASSWORD1
const PASSWORD2 = process.env.PASSWORD2
const PASSWORD3 = process.env.PASSWORD3


console.log("🚀 ~ MONGODB_URL:", MONGODB_URL)
const seedAdmins = async () => {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log(" Connected to MongoDB");

        const admins = [
            { email: EMAIL1, password: PASSWORD1 },
            { email: EMAIL2, password: PASSWORD2 },
            { email: EMAIL3, password: PASSWORD3 },
        ];

        for (const adminData of admins) {
            const existing = await Admin.findOne({ email: adminData.email });
            if (existing) {
                console.log(`  Admin already exists: ${adminData.email}`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(adminData.password, 10);

            await Admin.create({
                email: adminData.email,
                password: hashedPassword,
            });

            console.log(` Admin created: ${adminData.email}`);
        }

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(" Admin seeding failed:", error);
        process.exit(1);
    }
};

seedAdmins();
