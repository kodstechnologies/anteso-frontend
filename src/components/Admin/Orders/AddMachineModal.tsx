import React, { useState } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
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

/** All selectable types except "Others" — used to detect custom typed machine names */
const STANDARD_MACHINE_TYPES = [
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
];

const MACHINE_TYPES = [...STANDARD_MACHINE_TYPES, "Others"];

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
        /** True when user chose "Others" and entered a custom type (saved to CustomMachine on backend). */
        fromOthers: false,
        equipmentId: "",
        machineModel: "",
        partyCodeOrSysId: "",
        procNoOrPoNo: "",
        procExpiryDate: "",
        price: "", // Unified price field
    });
    const [workTypeEntries, setWorkTypeEntries] = useState<string[]>(["Quality Assurance Test"]);
    const [workOrderCopy, setWorkOrderCopy] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleMachineTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "Others") {
            setFormData((prev) => ({ ...prev, machineType: "Others", fromOthers: true }));
        } else {
            setFormData((prev) => ({ ...prev, machineType: value, fromOthers: false }));
        }
    };

    const isOthersFlow =
        formData.machineType === "Others" ||
        (!!formData.machineType &&
            !STANDARD_MACHINE_TYPES.includes(formData.machineType) &&
            formData.machineType !== "");

    const selectMachineTypeValue =
        formData.machineType && STANDARD_MACHINE_TYPES.includes(formData.machineType)
            ? formData.machineType
            : formData.machineType
              ? "Others"
              : "";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setWorkOrderCopy(file || null);
    };

    // ── Work Type Entry Handlers ──────────────────────────────────────────────

    const handleWorkTypeChange = (index: number, value: string) => {
        setWorkTypeEntries(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    const addWorkTypeEntry = () => {
        // Pick the first available work type not already selected
        const available = WORK_TYPES.find(wt => !workTypeEntries.includes(wt.value));
        setWorkTypeEntries(prev => [
            ...prev,
            available?.value || WORK_TYPES[0].value,
        ]);
    };

    const removeWorkTypeEntry = (index: number) => {
        setWorkTypeEntries(prev => prev.filter((_, i) => i !== index));
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.equipmentId?.trim()) {
            showMessage("Equipment ID is required", "error");
            return;
        }

        if (!formData.machineType || formData.machineType === "Others") {
            showMessage("Please select a machine type or enter a custom name for Others", "error");
            return;
        }

        if (workTypeEntries.length === 0) {
            showMessage("At least one Work Type is required", "error");
            return;
        }

        // Validate work types are unique
        if (new Set(workTypeEntries).size !== workTypeEntries.length) {
            showMessage("Duplicate work types are not allowed", "error");
            return;
        }

        // Validate price (required only for employee leads)
        if (isEmployeeLead && (!formData.price || isNaN(Number(formData.price)))) {
            showMessage("Price is required", "error");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append("machineType", formData.machineType);
            data.append("fromOthers", formData.fromOthers ? "true" : "false");
            data.append("equipmentId", formData.equipmentId);
            data.append("machineModel", formData.machineModel);

            // Send workTypes as JSON array of strings
            data.append("workType", JSON.stringify(workTypeEntries));
            data.append("price", formData.price || "0");

            if (formData.partyCodeOrSysId) data.append("partyCodeOrSysId", formData.partyCodeOrSysId);
            if (formData.procNoOrPoNo) data.append("procNoOrPoNo", formData.procNoOrPoNo);
            if (formData.procExpiryDate) data.append("procExpiryDate", formData.procExpiryDate);
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
            fromOthers: false,
            equipmentId: "",
            machineModel: "",
            partyCodeOrSysId: "",
            procNoOrPoNo: "",
            procExpiryDate: "",
            price: "",
        });
        setWorkTypeEntries(["Quality Assurance Test"]);
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
                    {/* Machine Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Machine Type *</label>
                        <select
                            name="machineType"
                            value={selectMachineTypeValue}
                            onChange={handleMachineTypeSelect}
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

                    {isOthersFlow && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Specify Other Machine Type <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.machineType === "Others" ? "" : formData.machineType}
                                onChange={(e) => {
                                    const customValue = e.target.value.trim();
                                    setFormData((prev) => ({
                                        ...prev,
                                        machineType: customValue || "Others",
                                        fromOthers: true,
                                    }));
                                }}
                                placeholder="e.g. LINAC, Brachytherapy, etc."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* Equipment ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Equipment ID/Serial No. *</label>
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

                    {/* Machine Model */}
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

                    {/* Work Types (multiple selection, single row each) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Work Types *
                            </label>
                            <button
                                type="button"
                                onClick={addWorkTypeEntry}
                                disabled={workTypeEntries.length >= WORK_TYPES.length}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Work Type
                            </button>
                        </div>

                        <div className="space-y-2">
                            {workTypeEntries.map((entry, index) => {
                                const otherUsed = workTypeEntries.filter((_, i) => i !== index);
                                const availableOptions = WORK_TYPES.filter(
                                    wt => !otherUsed.includes(wt.value)
                                );

                                return (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50"
                                    >
                                        <select
                                            value={entry}
                                            onChange={e => handleWorkTypeChange(index, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            {availableOptions.map(wt => (
                                                <option key={wt.value} value={wt.value}>
                                                    {wt.label}
                                                </option>
                                            ))}
                                        </select>

                                        {workTypeEntries.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeWorkTypeEntry(index)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                title="Remove this work type"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Unified Price Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price {isEmployeeLead ? "*" : "(Optional)"}
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="Enter unified price for all work types"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Party Code / Sys ID */}
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

                    {/* PROC / PO No */}
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

                    {/* PROC Expiry Date */}
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

                    {/* Work Order Copy */}
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

                    {/* Actions */}
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
