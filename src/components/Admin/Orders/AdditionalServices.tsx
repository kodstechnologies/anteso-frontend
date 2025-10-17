import React, { useEffect, useState } from "react";
import { getAdditionalServicesByOrderId, updateAdditionalService } from "../../../api/index";
import { useParams } from "react-router-dom";

const AdditionalServices = () => {
    const [additionalServices, setAdditionalServices] = useState<any[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const { orderId } = useParams();

    useEffect(() => {
        if (!orderId) return;

        const fetchData = async () => {
            try {
                const data = await getAdditionalServicesByOrderId(orderId);

                const servicesWithState = (data.additionalServices || []).map((s: any) => ({
                    ...s,
                    status: s.status ?? "Pending",
                    remark: s.remark ?? "",
                    file: null, // file state for upload
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
        setAdditionalServices((prev) =>
            prev.map((service) =>
                service._id === id ? { ...service, [field]: value } : service
            )
        );
    };

    const handleUpdate = async (service: any) => {
        try {
            // If status is Completed, ensure a file is selected
            if (service.status === "Completed" && !service.file) {
                alert("Please upload a file before marking as Completed");
                return;
            }

            const formData = new FormData();
            formData.append("status", service.status);
            formData.append("remark", service.remark || "");
            if (service.file) {
                formData.append("file", service.file);
            }

            const res = await updateAdditionalService(service._id, formData, true); // third param indicates multipart
            alert(res.message || "Service updated successfully ✅");

            // Update local state with new report URL if returned
            setAdditionalServices((prev) =>
                prev.map((s) =>
                    s._id === service._id ? { ...s, ...res.service } : s
                )
            );
        } catch (err: any) {
            alert(err.message || "Update failed ❌");
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 mt-5">
            <div className="bg-white p-6 rounded-lg shadow-lg flex-1">
                <h5 className="text-lg font-bold text-gray-800 mb-4">
                    Additional Services
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    {additionalServices.length > 0 ? (
                        additionalServices.map((service) => (
                            <div
                                key={service._id}
                                className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 shadow-sm flex flex-col gap-2"
                            >
                                <span className="text-gray-900 font-medium">{service.name}</span>
                                <p className="text-gray-600 text-sm">{service.description}</p>

                                <select
                                    value={service.status}
                                    onChange={(e) =>
                                        handleChange(service._id, "status", e.target.value)
                                    }
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>

                                <input
                                    type="text"
                                    value={service.remark}
                                    onChange={(e) =>
                                        handleChange(service._id, "remark", e.target.value)
                                    }
                                    placeholder="Enter remark"
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                />

                                {/* File upload field only for Completed status */}
                                {service.status === "Completed" && (
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.png"
                                        onChange={(e) =>
                                            handleChange(service._id, "file", e.target.files?.[0] || null)
                                        }
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                )}

                                <button
                                    onClick={() => handleUpdate(service)}
                                    className="bg-blue-600 text-white text-sm py-1 px-3 rounded hover:bg-blue-700 self-start"
                                >
                                    Update
                                </button>

                                {/* Display report URL if available */}
                                {service.report && (
                                    <a
                                        href={service.report}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 text-sm underline"
                                    >
                                        View uploaded report
                                    </a>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-500 italic">No additional services</div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg flex-1">
                <h5 className="text-lg font-bold text-gray-800 mb-4">Special Instructions</h5>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md px-4 py-3 shadow-sm">
                    <p className="text-gray-800 font-medium">
                        {specialInstructions || "No special instructions"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdditionalServices;
