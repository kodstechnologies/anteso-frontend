import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { getPaymentDetails as fetchPaymentDetails } from "../../../api"; // adjust path if needed

interface PaymentDetailsProps {
    id: string;
    date: string; // pass the selected date from calendar
}

interface SalaryData {
    basicSalary: number;
    incentive: number;
    totalSalary: number;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ id, date }) => {
    const [salary, setSalary] = useState<SalaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id || !date) return;

        const getSalary = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetchPaymentDetails(id, date);
                const data = res.data;
                setSalary({
                    basicSalary: data.basicSalary,
                    incentive: data.incentive,
                    totalSalary: data.totalSalary,
                });
            } catch (err: any) {
                setError(err.message || "Failed to fetch salary details");
                setSalary(null);
            } finally {
                setLoading(false);
            }
        };

        getSalary();
    }, [id, date]);

    if (loading) {
        return <div className="text-gray-600">Loading Payment Details...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!salary) {
        return <div className="text-gray-500">No payment details available</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Details</h2>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">
                                Component
                            </th>
                            <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">
                                Amount (₹)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-4 py-3 border border-gray-300 text-gray-700">
                                Basic Pay
                            </td>
                            <td className="px-4 py-3 border border-gray-300 text-gray-700 font-medium">
                                ₹{salary.basicSalary.toLocaleString()}
                            </td>
                        </tr>
                        <tr className="bg-gray-50">
                            <td className="px-4 py-3 border border-gray-300 text-gray-700">
                                Incentive
                            </td>
                            <td className="px-4 py-3 border border-gray-300 text-gray-700 font-medium">
                                ₹{salary.incentive.toLocaleString()}
                            </td>
                        </tr>
                        <tr className="bg-blue-50 font-bold">
                            <td className="px-4 py-3 border border-gray-300 text-gray-800">
                                Total Pay
                            </td>
                            <td className="px-4 py-3 border border-gray-300 text-blue-600 font-bold">
                                ₹{salary.totalSalary.toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentDetails;
