import React, { useEffect, useState } from "react";
import { getAdditionalServicesByOrderId, updateAdditionalService } from "../../../api/index";
import { useParams } from "react-router-dom";
import { Loader2, FileText, Upload, Edit3, CheckCircle } from "lucide-react"; // Assuming lucide-react for icons
import { showMessage } from "../../../components/common/ShowMessage"; // Adjust path as needed for the showMessage utility

const AdditionalServices = () => {
    const [additionalServices, setAdditionalServices] = useState<any[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set()); // For per-service loading

    const { orderId } = useParams();

    useEffect(() => {
        if (!orderId) return;

        const fetchData = async () => {
            try {
                const data = await getAdditionalServicesByOrderId(orderId);
                console.log("🚀 ~ fetchData ~ data:", data);

                const servicesWithState = (data.additionalServices || []).map((s: any) => ({
                    ...s,
                    status: s.status ?? "Pending",
                    remark: s.remark ?? "",
                    file: null, // local upload state
                }));

                setAdditionalServices(servicesWithState);
                setSpecialInstructions(data.specialInstructions || "");
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orderId]);

    const handleChange = (id: string, field: string, value: any) => {
        const currentService = additionalServices.find(s => s._id === id);
        if (currentService && currentService.status === "Completed") {
            if (field === "status" && value !== "Completed") {
                showMessage("Status cannot be changed after marking as Completed", "error");
            } else if (field === "remark") {
                showMessage("Remarks cannot be changed after marking as Completed", "error");
            }
            return;
        }

        setAdditionalServices((prev) =>
            prev.map((service) =>
                service._id === id ? { ...service, [field]: value } : service
            )
        );
    };

    const handleUpdate = async (service: any) => {
        setUpdatingIds((prev) => new Set([...prev, service._id]));
        try {
            if (service.status === "Completed" && !service.file && !service.report) {
                showMessage("Please upload a file before marking as Completed", "error");
                return;
            }

            const formData = new FormData();
            formData.append("status", service.status);
            formData.append("remark", service.remark || "");
            if (service.file) formData.append("file", service.file);

            const res = await updateAdditionalService(service._id, formData);
            showMessage(res.message || "Service updated successfully ✅", "success");

            setAdditionalServices((prev) =>
                prev.map((s) =>
                    s._id === service._id ? { ...s, ...res.service, file: null } : s // Reset local file
                )
            );
        } catch (err: any) {
            showMessage(err.message || "Update failed ❌", "error");
        } finally {
            setUpdatingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(service._id);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading additional services...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
                <div className="text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-3 py-4">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start">

                {/* Additional Services Section */}
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Additional Services
                        </h5>
                        {additionalServices.length === 0 && (
                            <span className="text-sm text-gray-500">No services added yet</span>
                        )}
                    </div>

                    {additionalServices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {additionalServices.map((service) => (
                                <div
                                    key={service._id}
                                    className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300"
                                >
                                    {/* Service Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h6 className="text-base font-semibold text-gray-900 mb-1">
                                                {service.name}
                                            </h6>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {service.description}
                                            </p>
                                        </div>
                                        <div className="ml-3">
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${service.status === "Completed"
                                                    ? "bg-green-100 text-green-800"
                                                    : service.status === "In Progress"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {service.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Selector */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={service.status}
                                            onChange={(e) =>
                                                handleChange(service._id, "status", e.target.value)
                                            }
                                            disabled={service.status === "Completed"}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>

                                    {/* Remark Input */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Remark
                                        </label>
                                        <input
                                            type="text"
                                            value={service.remark}
                                            onChange={(e) =>
                                                handleChange(service._id, "remark", e.target.value)
                                            }
                                            placeholder="Enter any remarks or notes..."
                                            disabled={service.status === "Completed"}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {/* File Upload for Completed */}
                                    {service.status === "Completed" && !service.report && (
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <Upload className="h-4 w-4" />
                                                Upload Report (PDF, JPG, PNG)
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.png"
                                                onChange={(e) =>
                                                    handleChange(
                                                        service._id,
                                                        "file",
                                                        e.target.files?.[0] || null
                                                    )
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                    )}

                                    {/* Update Button */}
                                    <button
                                        onClick={() => handleUpdate(service)}
                                        disabled={updatingIds.has(service._id)}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updatingIds.has(service._id) ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4" />
                                                Update Service
                                            </>
                                        )}
                                    </button>

                                    {/* Report Link */}
                                    {service.report && (
                                        <a
                                            href={service.report}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium underline decoration-2 transition-colors"
                                        >
                                            <FileText className="h-4 w-4" />
                                            View Uploaded Report
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No additional services available for this order.</p>
                        </div>
                    )}
                </div>

                {/* Special Instructions Section */}
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 flex-1 lg:max-w-md">
                    <div className="flex items-center gap-2 mb-4">
                        <h5 className="text-lg font-bold text-gray-800">
                            Special Instructions
                        </h5>
                        <Edit3 className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 shadow-inner">
                        {specialInstructions ? (
                            <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                                <p>{specialInstructions}</p>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500 italic">No special instructions provided.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdditionalServices;