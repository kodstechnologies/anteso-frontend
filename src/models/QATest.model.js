import mongoose from "mongoose";

const { Schema } = mongoose;

const qaTestSchema = new Schema({
    officeStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",  // Always points to Employee collection
    },
    reportULRNumber: {
        type: String
    },
    qaTestReportNumber: {
        type: String
    },
    report: { type: String },
    reportStatus: {
        type: String,
        enum:["accepted","rejected"]
    }
}, { timestamps: true });

const QATest = mongoose.model("QATest", qaTestSchema);
export default QATest;
