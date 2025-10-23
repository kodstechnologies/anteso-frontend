import React, { useEffect, useState } from "react";
import { getPaymentDetails as fetchPaymentDetails } from "../../../api";

interface PaymentDetailsProps {
    id: string;
    date: string; // from calendar
}

interface SalaryData {
    employee: string;
    date: string;
    basicSalary: number;
    incentive: number;
    leaveWithoutPayDays: number;
    leaveDeduction: number;
    status: string;
    totalSalary: number;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ id, date }) => {
    const [salary, setSalary] = useState<SalaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const getMonthYear = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString("default", { month: "long", year: "numeric" });
    };

    useEffect(() => {
        if (!id || !date) return;

        const getSalary = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await fetchPaymentDetails(id, date); // ✅ direct data
                console.log("🚀 ~ getSalary ~ data:", data)
                setSalary(data);
            } catch (err: any) {
                if (err.message === "Salary not found for this date") {
                    setError("not_found");
                } else {
                    setError(err.message || "Failed to fetch salary details");
                }
                setSalary(null);
            } finally {
                setLoading(false);
            }
        };

        getSalary();
    }, [id, date]);

    if (loading) return <div className="text-gray-600">Loading Payment Details...</div>;

    const isNotFound = error === "not_found";

    if (error && !isNotFound) return <div className="text-red-500">{error}</div>;

    if (!salary) {
        if (isNotFound) {
            return (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Details</h2>
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Salary Data Found</h3>
                        <p className="text-gray-500 mb-4">Salary details are not available for <span className="font-medium">{getMonthYear(date)}</span>.</p>
                        <p className="text-sm text-gray-400">Please select a different date to view payment details.</p>
                    </div>
                </div>
            );
        }
        return <div className="text-gray-500">No payment details available</div>;
    }

    const salaryDate = new Date(salary.date);
    const monthName = salaryDate.toLocaleString("default", { month: "long" });
    const year = salaryDate.getFullYear();

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Payment Details — {monthName} {year}
            </h2>

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
                        <tr className="bg-red-50">
                            <td className="px-4 py-3 border border-gray-300 text-gray-700">
                                Leave Deduction
                            </td>
                            <td className="px-4 py-3 border border-gray-300 text-red-600 font-medium">
                                -₹{salary.leaveDeduction.toLocaleString()}
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

            {/* <p className="mt-4 text-gray-600">
                <strong>Status:</strong> {salary.status}
            </p> */}
        </div>
    );
};

export default PaymentDetails;