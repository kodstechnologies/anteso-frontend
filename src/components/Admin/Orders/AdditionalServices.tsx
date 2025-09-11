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
                console.log("🚀 ~ fetchData ~ data:", data);

                // ✅ keep API-provided values, only fallback if missing
                const servicesWithState = (data.additionalServices || []).map((s: any) => ({
                    ...s,
                    status: s.status ?? "Pending",
                    remark: s.remark ?? "",
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

    const handleChange = (id: string, field: string, value: string) => {
        setAdditionalServices((prev) =>
            prev.map((service) =>
                service._id === id ? { ...service, [field]: value } : service
            )
        );
    };

    const handleUpdate = async (service: any) => {
        try {
            const res = await updateAdditionalService(service._id, {
                status: service.status,
                remark: service.remark,
            });

            alert(res.message || "Service updated successfully ✅");
        } catch (err: any) {
            alert(err.message || "Update failed ❌");
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 mt-5">
            {/* Additional Services */}
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

                                {/* Status Dropdown */}
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

                                {/* Remark Input */}
                                <input
                                    type="text"
                                    value={service.remark}
                                    onChange={(e) =>
                                        handleChange(service._id, "remark", e.target.value)
                                    }
                                    placeholder="Enter remark"
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                />

                                {/* Update Button */}
                                <button
                                    onClick={() => handleUpdate(service)}
                                    className="bg-blue-600 text-white text-sm py-1 px-3 rounded hover:bg-blue-700 self-start"
                                >
                                    Update
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-500 italic">No additional services</div>
                    )}
                </div>
            </div>

            {/* Special Instructions */}
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
