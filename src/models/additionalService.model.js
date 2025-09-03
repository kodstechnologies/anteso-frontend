// import mongoose from "mongoose";
// const additionalServiceSchema = new mongoose.Schema(
//     {
//         name: {
//             type: String,
//             required: true,
//             enum: [
//                 "INSTITUTE REGISTRATION",
//                 "RSO REGISTRATION, NOMINATION & APPROVAL",
//                 "DECOMMISSIONING, PRE OWNED PROCUREMENT, QA & LICENSE",
//                 "PROCUREMENT",
//                 "TLD BADGE",
//                 "LEAD SHEET",
//                 "LEAD GLASS",
//                 "LEAD APRON",
//                 "THYROID SHIELD",
//                 "GONAD SHIELD",
//                 "OTHERS",
//             ],
//         },
//         totalAmount: {
//             type: Number,
//             default: 0,
//         },
//     },
//     { timestamps: true }
// );

// const AdditionalService = mongoose.model(
//     "AdditionalService",
//     additionalServiceSchema
// );

import mongoose from "mongoose";
const additionalServiceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            enum: [
                "INSTITUTE REGISTRATION",
                "RSO REGISTRATION, NOMINATION & APPROVAL",
                "DECOMMISSIONING, PRE OWNED PROCUREMENT, QA & LICENSE",
                "PROCUREMENT",
                "TLD BADGE",
                "LEAD SHEET",
                "LEAD GLASS",
                "LEAD APRON",
                "THYROID SHIELD",
                "GONAD SHIELD",
                "OTHERS",
            ],
        },
        description: {
            type: String,
            trim: true,
        },
        totalAmount: {
            type: Number,
        },
        status:{
            type:String
        },
        remark:{
            type:String
        }
    },
    { timestamps: true }
);
const AdditionalService = mongoose.model(
    "AdditionalService",
    additionalServiceSchema
);
export default AdditionalService;