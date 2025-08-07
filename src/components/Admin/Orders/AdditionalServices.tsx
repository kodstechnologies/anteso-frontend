import React, { useEffect, useState } from 'react';
import { getAdditionalServicesByOrderId } from '../../../api/index';
import { useParams } from 'react-router-dom';

const AdditionalServices = () => {
    const [additionalServices, setAdditionalServices] = useState<string[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const { orderId } = useParams();

    useEffect(() => {
        if (!orderId) return;

        const fetchData = async () => {
            try {
                const data = await getAdditionalServicesByOrderId(orderId);
                console.log("🚀 ~ fetchData ~ data:----------->additional services", data);
                setAdditionalServices(Object.keys(data.additionalServices || {}));
                setSpecialInstructions(data.specialInstructions || '');
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orderId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 mt-5">
            {/* Additional Services */}
            <div className="bg-white p-6 rounded-lg shadow-lg flex-1">
                <h5 className="text-lg font-bold text-gray-800 mb-4">Additional Services</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    {additionalServices.length > 0 ? (
                        additionalServices.map((field, idx) => (
                            <div
                                key={idx}
                                className="bg-blue-50 border border-blue-200 rounded-md px-4 py-2 shadow-sm"
                            >
                                <span className="text-gray-900 font-medium">{field}</span>
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
                        {specialInstructions || 'No special instructions'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdditionalServices;
