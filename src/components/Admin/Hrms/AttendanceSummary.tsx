// "use client";

// import React, { useEffect, useState } from "react";
// import { toast } from "react-toastify";
// import { attendenceSummary } from "../../../api"; // ✅ adjust import path if needed

// interface AttendanceSummaryProps {
//     id: string;
// }

// interface AttendanceData {
//     employeeId: string;
//     employeeName: string;
//     totalWorkingDays: number;
//     daysPresent: number;
//     totalLeaveDays: number;
//     leaveTypeSummary?: Record<string, number>;
//     attendanceRate: number;
// }

// const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ id }) => {
//     const [data, setData] = useState<AttendanceData | null>(null);
//     const [loading, setLoading] = useState<boolean>(true);

//     useEffect(() => {
//         if (!id) return;

//         const fetchAttendance = async () => {
//             try {
//                 setLoading(true);
//                 const res = await attendenceSummary(id); // ✅ use the API function here
//                 // Assuming backend response has structure: { data: {...}, message: "..." }
//                 setData(res.data);
//             } catch (error: any) {
//                 toast.error(error?.message || "Failed to fetch attendance summary");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchAttendance();
//     }, [id]);

//     if (loading) return <p className="text-gray-500">Loading attendance summary...</p>;
//     if (!data) return <p className="text-red-500">No attendance data found.</p>;

//     const leaveSummary = data.leaveTypeSummary || {};

//     return (
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//             <h2 className="text-2xl font-bold text-gray-800 mb-6">Attendance Summary</h2>
//             <div className="overflow-x-auto">
//                 <table className="w-full border-collapse border border-gray-300">
//                     <thead>
//                         <tr className="bg-gray-50">
//                             <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Metric</th>
//                             <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Value</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         <tr>
//                             <td className="px-4 py-3 border border-gray-300 text-gray-700">Total Working Days</td>
//                             <td className="px-4 py-3 border border-gray-300 text-gray-700 font-medium">{data.totalWorkingDays}</td>
//                         </tr>
//                         <tr className="bg-gray-50">
//                             <td className="px-4 py-3 border border-gray-300 text-gray-700">Days Present</td>
//                             <td className="px-4 py-3 border border-gray-300 text-green-700 font-medium">{data.daysPresent}</td>
//                         </tr>
//                         <tr>
//                             <td className="px-4 py-3 border border-gray-300 text-gray-700">Total Leave Days</td>
//                             <td className="px-4 py-3 border border-gray-300 text-yellow-700 font-medium">{data.totalLeaveDays}</td>
//                         </tr>
//                         <tr className="bg-gray-50">
//                             <td className="px-4 py-3 border border-gray-300 text-gray-700">Attendance Rate</td>
//                             <td className="px-4 py-3 border border-gray-300 text-blue-700 font-semibold">{data.attendanceRate}%</td>
//                         </tr>
//                     </tbody>
//                 </table>
//             </div>
//         </div>

//     );
// };

// export default AttendanceSummary;
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { attendenceSummary } from "../../../api";

interface AttendanceData {
    employeeId: string;
    employeeName: string;
    totalWorkingDays: number;
    daysPresent: number;
    totalLeaveDays: number;
    leaveTypeSummary?: Record<string, number>;
    attendanceRate: number;
}

const AttendanceSummary: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<AttendanceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchAttendance = async () => {
            try {
                setLoading(true);
                const res = await attendenceSummary(id);
                setData(res.data);
            } catch (error: any) {
                toast.error(error?.message || "Failed to fetch attendance summary");
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [id]);

    if (loading) return <p className="text-gray-500">Loading attendance summary...</p>;
    if (!data) return <p className="text-red-500">No attendance data found.</p>;

    const leaveSummary = data.leaveTypeSummary || {};

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Attendance Summary</h2>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Metric</th>
                            <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="px-4 py-3 border border-gray-300 text-gray-700">Total Working Days</td>
                            <td className="px-4 py-3 border border-gray-300 text-gray-700 font-medium">{data.totalWorkingDays}</td>
                        </tr>
                        <tr className="bg-gray-50">
                            <td className="px-4 py-3 border border-gray-300 text-gray-700">Days Present</td>
                            <td className="px-4 py-3 border border-gray-300 text-green-700 font-medium">{data.daysPresent}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 border border-gray-300 text-gray-700">Total Leave Days</td>
                            <td className="px-4 py-3 border border-gray-300 text-yellow-700 font-medium">{data.totalLeaveDays}</td>
                        </tr>
                        <tr className="bg-gray-50">
                            <td className="px-4 py-3 border border-gray-300 text-gray-700">Attendance Rate</td>
                            <td className="px-4 py-3 border border-gray-300 text-blue-700 font-semibold">{data.attendanceRate}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceSummary;
