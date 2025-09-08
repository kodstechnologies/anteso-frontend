import mongoose from 'mongoose';
const workTypeStatusEnum = ['pending', 'in progress', 'completed', 'generated', 'paid'];
const serviceNameEnum = ['QA Test', 'Elora', 'QA Raw'];
const workTypeDetailSchema = new mongoose.Schema({
    workType: {
        type: String,
        enum: [
            'Quality Assurance Test',
            'License for Operation',
            'Decommissioning',
            'Decommissioning and Recommissioning'
        ]
    },
    serviceName: {
        type: String,
        enum: serviceNameEnum,
    },
    engineer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee' // Only those with technicianType = 'engineer'
    },
    officeStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee' // Only those with technicianType = 'office staff'
    },
    status: { type: String, enum: workTypeStatusEnum, default: 'pending' },
    uploadFile: { type: String },
    viewFile: { type: [String], default: [] }, // array of strings    remark: { type: String }
    report: { type: String },
    reportULRNumber: {
        type: String
    },
    qaTestReportNumber: {
        type: String
    }
}, { _id: false });
const serviceSchema = new mongoose.Schema({
    machineType: {
        type: String,
        required: true,
        enum: [
            'Fixed X-Ray', 'Mobile X-Ray', 'C-Arm', 'Cath Lab/Interventional Radiology', 'Mammography',
            'CT Scan', 'PET CT', 'CT Simulator', 'OPG', 'CBCT', 'BMD/DEXA',
            'Dental IOPA', 'Dental Hand Held', 'O Arm', 'KV Imaging (OBI)',
            'Lead Apron Test', 'Thyroid Shield Test', 'Gonad Shield Test',
            'Radiation Survey of Radiation Facility', 'Others'
        ]
    },
    equipmentNo: String,
    machineModel: String,
    serialNumber: String,
    remark: String,
    workTypeDetails: [workTypeDetailSchema],
    verificationResponse: String,
    status: String,
    totalAmount: Number
}, { timestamps: true });
export default mongoose.model('Service', serviceSchema);