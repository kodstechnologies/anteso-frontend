import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { addMachineToOrder } from "../../../api";

const showMessage = (msg = "", type: "success" | "error" | "warning" = "success") => {
    const toast: any = Swal.mixin({
        toast: true,
        position: "top",
        showConfirmButton: false,
        timer: 4000,
        customClass: { container: "toast" },
    });
    toast.fire({
        icon: type,
        title: msg,
        padding: "10px 20px",
    });
};

const MACHINE_TYPES = [
    "Radiography (Fixed)",
    "Radiography (Mobile)",
    "Radiography (Portable)",
    "Radiography and Fluoroscopy",
    "Interventional Radiology",
    "C-Arm",
    "O-Arm",
    "Computed Tomography",
    "Mammography",
    "Dental Cone Beam CT",
    "Ortho Pantomography (OPG)",
    "Dental (Intra Oral)",
    "Dental (Hand-held)",
    "Bone Densitometer (BMD)",
    "KV Imaging (OBI)",
    "Radiography (Mobile) with HT",
    "Lead Apron/Thyroid Shield/Gonad Shield",
    "Others",
];

const WORK_TYPES = [
    { value: "Quality Assurance Test", label: "Quality Assurance Test (QA Raw + QA Test)" },
    { value: "License for Operation", label: "License for Operation" },
    { value: "Decommissioning", label: "Decommissioning" },
    { value: "Decommissioning and Recommissioning", label: "Decommissioning and Recommissioning" },
];

interface AddMachineModalProps {
    open: boolean;
    onClose: () => void;
    orderId: string;
    onSuccess: () => void;
    isEmployeeLead?: boolean;
}

export default function AddMachineModal({
    open,
    onClose,
    orderId,
    onSuccess,
    isEmployeeLead = false
}: AddMachineModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        machineType: "",
        equipmentId: "",
        machineModel: "",
        workType: "Quality Assurance Test",
        partyCodeOrSysId: "",
        procNoOrPoNo: "",
        procExpiryDate: "",
        price: ""
    });
    const [workOrderCopy, setWorkOrderCopy] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setWorkOrderCopy(file || null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.machineType || !formData.equipmentId) {
            showMessage("Machine Type and Equipment ID are required", "error");
            return;
        }

        if (isEmployeeLead && formData.workType === "Quality Assurance Test" && !formData.price) {
            showMessage("Price is required for Quality Assurance Test", "error");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append("machineType", formData.machineType);
            data.append("equipmentId", formData.equipmentId);
            data.append("machineModel", formData.machineModel);
            data.append("workType", formData.workType);
            if (formData.partyCodeOrSysId) data.append("partyCodeOrSysId", formData.partyCodeOrSysId);
            if (formData.procNoOrPoNo) data.append("procNoOrPoNo", formData.procNoOrPoNo);
            if (formData.procExpiryDate) data.append("procExpiryDate", formData.procExpiryDate);
            if (formData.price) data.append("price", formData.price);
            if (workOrderCopy) data.append("workOrderCopy", workOrderCopy);

            await addMachineToOrder(orderId, data);
            showMessage("Machine added successfully!", "success");
            resetForm();
            onSuccess();
            onClose();
        } catch (error: any) {
            showMessage(error?.message || "Failed to add machine", "error");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            machineType: "",
            equipmentId: "",
            machineModel: "",
            workType: "Quality Assurance Test",
            partyCodeOrSysId: "",
            procNoOrPoNo: "",
            procExpiryDate: "",
            price: ""
        });
        setWorkOrderCopy(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Add Machine to Order</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Machine Type *</label>
                        <select
                            name="machineType"
                            value={formData.machineType}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Machine Type</option>
                            {MACHINE_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Equipment ID *</label>
                        <input
                            type="text"
                            name="equipmentId"
                            value={formData.equipmentId}
                            onChange={handleChange}
                            required
                            placeholder="e.g. EQ-001"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Machine Model</label>
                        <input
                            type="text"
                            name="machineModel"
                            value={formData.machineModel}
                            onChange={handleChange}
                            placeholder="e.g. Model XYZ"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                        <select
                            name="workType"
                            value={formData.workType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {WORK_TYPES.map((wt) => (
                                <option key={wt.value} value={wt.value}>
                                    {wt.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Quality Assurance Test creates QA Raw and QA Test accordion sections
                        </p>
                    </div>

                    {isEmployeeLead && formData.workType === "Quality Assurance Test" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (Optional)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="Enter Price"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Party Code / Sys ID</label>
                        <input
                            type="text"
                            name="partyCodeOrSysId"
                            value={formData.partyCodeOrSysId}
                            onChange={handleChange}
                            placeholder="Optional"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PROC / PO No</label>
                        <input
                            type="text"
                            name="procNoOrPoNo"
                            value={formData.procNoOrPoNo}
                            onChange={handleChange}
                            placeholder="Optional"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PROC Expiry Date</label>
                        <input
                            type="date"
                            name="procExpiryDate"
                            value={formData.procExpiryDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Copy (Optional)</label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {workOrderCopy && (
                            <p className="text-xs text-green-600 mt-1">{workOrderCopy.name}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? "Adding..." : "Add Machine"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
