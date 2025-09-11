import mongoose from "mongoose";

const { Schema } = mongoose;

const eloraSchema = new Schema({

    officeStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",  // Always points to Employee collection
        required: true
    },
}, { timestamps: true });

const Elora = mongoose.model("Elora", eloraSchema);
export default Elora;