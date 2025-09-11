import mongoose from "mongoose";

const { Schema } = mongoose;

const qaTestSchema = new Schema({

    officeStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",  // Always points to Employee collection
    },

}, { timestamps: true });

const QATest = mongoose.model("QATest", qaTestSchema);
export default QATest;
