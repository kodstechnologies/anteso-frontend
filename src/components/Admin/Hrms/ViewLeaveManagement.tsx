"use client"
import { useState, useEffect } from "react"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import { isSameDay, startOfMonth, endOfMonth, isSunday } from "date-fns"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { useParams } from "react-router-dom" // or next/navigation if Next.js
import { getAllLeaves, approveLeave, rejectLeave, deleteLeave, getEmployeeById, allocateLeaves, getAllocatedLeaves, getAttendanceStatus } from "../../../api" // ✅ include APIs
import type { AttendanceEntry, Employee, LeaveRequest } from "../../../types/hrms-types"
import { ChevronDown, ChevronUp } from "lucide-react"
import AttendenceSummary from "../Hrms/AttendanceSummary"

// Mock attendance data (same as before)
const attendanceData: AttendanceEntry[] = [
    { date: new Date(2025, 4, 1), status: "Present" },
    { date: new Date(2025, 4, 2), status: "Present" },
    { date: new Date(2025, 4, 3), status: "Sick Leave" },
    { date: new Date(2025, 4, 4), status: "Absent" },
]

// Dummy employee details (later fetch from backend)
const employee: Employee = {
    empId: "EMP001",
    name: "Rabi Prasad",
    email: "client1@gmail.com",
    address: "HSR Layout, Bangalore, Karnataka",
    phone: "9876576876",
    business: "Tech Solutions Pvt. Ltd.",
    gstNo: "AX123",
    designation: "Manager",
    department: "dpt_A",
    joinDate: "2023-01-04",
    workingDay: "6",
}

// Yup schema
const validationSchema = Yup.object({
    empId: Yup.string().required("Employee ID is required"),
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone: Yup.string().required("Phone is required"),
    designation: Yup.string().required("Designation is required"),
    department: Yup.string().required("Department is required"),
    joinDate: Yup.string().required("Join date is required"),
    workingDay: Yup.string().required("Working days is required"),
    address: Yup.string().required("Address is required"),
})

export default function EmployeeDetailsLeaveManagement() {
    const { id } = useParams() // employeeId from URL
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [employeeDetails, setEmployeeDetails] = useState<any>(null)
    const [showTools, setShowTools] = useState(false);
    const [allocatedLeaves, setAllocatedLeaves] = useState<any>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchAllocatedLeaves = async () => {
            if (!id) return;
            try {
                const res = await getAllocatedLeaves(id);

                console.log("🚀 ~ fetchAllocatedLeaves ~ res:", res);

                // Ensure it's always an array for map
                let leavesArray = [];

                if (Array.isArray(res?.data)) {
                    leavesArray = res.data;
                } else if (res?.data) {
                    // Convert single object into array
                    leavesArray = [{ ...res.data, year: res.data.year || new Date().getFullYear() }];
                }

                setAllocatedLeaves(leavesArray);
            } catch (err: any) {
                toast.error(err.message || "Failed to fetch allocated leaves");
            }
        };
        fetchAllocatedLeaves();
    }, [id]);

    useEffect(() => {
        if (!id) return;

        const fetchMonthlyAttendance = async () => {
            try {
                const today = new Date();
                const start = startOfMonth(today);
                const end = endOfMonth(today);

                const allDays: string[] = [];
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    allDays.push(new Date(d).toISOString().split("T")[0]); // YYYY-MM-DD
                }

                const attendanceData: Record<string, string> = {};

                // Fetch status day by day
                for (const date of allDays) {
                    const res = await getAttendanceStatus(id, date);
                    attendanceData[date] = res?.data?.status || "Unknown";
                }

                setAttendanceMap(attendanceData);
                console.log("✅ Attendance Map:", attendanceData);
            } catch (err: any) {
                toast.error(err.message || "Failed to fetch attendance status");
            }
        };

        fetchMonthlyAttendance();
    }, [id]);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                if (!id) return
                const res = await getEmployeeById(id)
                setEmployeeDetails(res?.data)
            } catch (err: any) {
                toast.error(err.message || "Failed to fetch employee details")
            }
        }
        fetchEmployee()
    }, [id])
    // Fetch leaves from backend
    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                const res = await getAllLeaves(id)
                if (res?.data?.data) {
                    const mapped = res.data.data.map((leave: any) => ({
                        id: leave._id,
                        startDate: new Date(leave.startDate),
                        endDate: new Date(leave.endDate),
                        leaveType: leave.leaveType,
                        reason: leave.reason,
                        status: leave.status,
                    }))
                    setLeaveRequests(mapped)
                }
            } catch {
                toast.error("Failed to fetch leaves")
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchLeaves()
    }, [id])

    // Approve/Reject leave
    const handleLeaveStatusChange = async (leaveId: string, status: "Approved" | "Rejected") => {
        try {
            if (!id) return
            if (status === "Approved") {
                await approveLeave(id, leaveId)
                toast.success("Leave approved")
            } else {
                await rejectLeave(id, leaveId)
                toast.info("Leave rejected")
            }

            // update UI
            setLeaveRequests((prev) =>
                prev.map((leave) => (leave.id === leaveId ? { ...leave, status } : leave))
            )
        } catch (err: any) {
            toast.error(err.message || `Failed to ${status.toLowerCase()} leave`)
        }
    }

    // Delete leave
    const handleDeleteLeave = async (leaveId: string) => {
        try {
            await deleteLeave(leaveId)
            toast.success("Leave deleted")
            setLeaveRequests((prev) => prev.filter((leave) => leave.id !== leaveId))
        } catch (err: any) {
            toast.error(err.message || "Failed to delete leave")
        }
    }

    // Attendance summary
    const getAttendanceSummary = () => {
        const currentMonth = new Date(2025, 4)
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)
        let workingDays = 0
        const summary = { present: 0, sickLeave: 0 }

        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
            if (!isSunday(day)) workingDays += 1
        }

        attendanceData.forEach((entry) => {
            if (entry.date >= start && entry.date <= end) {
                switch (entry.status) {
                    case "Present":
                        summary.present += 1
                        break
                    case "Sick Leave":
                        summary.sickLeave += 1
                        break
                }
            }
        })

        return { ...summary, totalDays: workingDays }
    }

    const getStatusForDate = (date: Date) => {
        const formattedDate = date.toISOString().split("T")[0];
        const status = attendanceMap[formattedDate];

        if (status) return status;
        if (isSunday(date)) return "Holiday";
        return "Unknown";
    };


    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === "month") {
            const status = getStatusForDate(date);
            switch (status) {
                case "Present":
                    return "present";
                case "Absent":
                    return "absent";
                case "On Leave":
                case "Sick Leave":
                    return "sick-leave";
                case "Holiday":
                    return "holiday";
                default:
                    return "";
            }
        }
        return "";
    };


    const handleDateChange = (value: any) => {
        if (value instanceof Date) {
            setSelectedDate(value)
        } else if (Array.isArray(value) && value[0] instanceof Date) {
            setSelectedDate(value[0])
        } else {
            setSelectedDate(null)
        }
    }

    return (
        <div className="space-y-8">
            <style>
                {`
.react-calendar__tile.present { background: rgba(40, 167, 69, 0.5) !important; color: black; }
.react-calendar__tile.absent { background: #dc3545 !important; color: white; }
.react-calendar__tile.sick-leave { background: #ffc107 !important; color: black; }
.react-calendar__tile.holiday { background: #e9ecef !important; color: black; }
.react-calendar__tile--active { background: #007bff !important; color: white !important; }
`}
            </style>


            {/* Employee Details */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
                        Employee Details
                    </span>
                </h2>

                {employeeDetails ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Left side */}
                        <div className="space-y-3">
                            <p className="text-gray-700">
                                <span className="font-semibold text-gray-900">👤 Employee ID:</span>{" "}
                                {employeeDetails.empId}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-semibold text-gray-900">📛 Name:</span>{" "}
                                {employeeDetails.name}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-semibold text-gray-900">📧 Email:</span>{" "}
                                {employeeDetails.email}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-semibold text-gray-900">📞 Phone:</span>{" "}
                                {employeeDetails.phone}
                            </p>
                        </div>

                        {/* Right side */}
                        <div className="space-y-3">
                            <p className="text-gray-700">
                                <span className="font-semibold text-gray-900">💼 Designation:</span>{" "}
                                {employeeDetails.designation}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-semibold text-gray-900">🏢 Department:</span>{" "}
                                {employeeDetails.department}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-semibold text-gray-900">📅 Join Date:</span>{" "}
                                {new Date(employeeDetails.dateOfJoining).toLocaleDateString()}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-semibold text-gray-900">📊 Working Days:</span>{" "}
                                {employeeDetails.workingDays}
                            </p>
                        </div>

                        {/* Address */}
                        {employeeDetails.address && (
                            <div className="col-span-2 mt-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                <p className="text-gray-700">
                                    <span className="font-semibold text-gray-900">📍 Address:</span>{" "}
                                    {employeeDetails.address}
                                </p>
                            </div>
                        )}

                        {/* Collapsible Tools Section */}
                        {employeeDetails.tools && employeeDetails.tools.length > 0 && (
                            <div className="col-span-2 mt-6">
                                <button
                                    onClick={() => setShowTools(!showTools)}
                                    className="flex items-center justify-between w-full bg-blue-100 px-4 py-2 rounded-lg text-left font-semibold text-gray-800 hover:bg-blue-200 transition"
                                >
                                    <span>🛠️ Issued Tools ({employeeDetails.tools.length})</span>
                                    {showTools ? (
                                        <ChevronUp className="h-5 w-5" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5" />
                                    )}
                                </button>

                                {showTools && (
                                    <div className="mt-4 overflow-x-auto">
                                        <table className="w-full border border-gray-200 rounded-lg shadow-sm bg-white">
                                            <thead className="bg-gray-100 text-left">
                                                <tr>
                                                    <th className="px-4 py-2 border-b">Tool ID</th>
                                                    <th className="px-4 py-2 border-b">Serial No</th>
                                                    <th className="px-4 py-2 border-b">Nomenclature</th>
                                                    <th className="px-4 py-2 border-b">Manufacturer</th>
                                                    <th className="px-4 py-2 border-b">Model</th>
                                                    <th className="px-4 py-2 border-b">Certificate No</th>
                                                    <th className="px-4 py-2 border-b">Issue Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employeeDetails.tools.map((tool: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 border-b">{tool.toolId?.toolId}</td>
                                                        <td className="px-4 py-2 border-b">{tool.toolId?.SrNo}</td>
                                                        <td className="px-4 py-2 border-b">{tool.toolId?.nomenclature}</td>
                                                        <td className="px-4 py-2 border-b">{tool.toolId?.manufacturer}</td>
                                                        <td className="px-4 py-2 border-b">{tool.toolId?.model}</td>
                                                        <td className="px-4 py-2 border-b">{tool.toolId?.calibrationCertificateNo}</td>
                                                        <td className="px-4 py-2 border-b">
                                                            {tool.issueDate
                                                                ? new Date(tool.issueDate).toLocaleDateString()
                                                                : "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">Loading employee details...</p>
                )}
            </div>


            {/* Attendance Calendar */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Attendance Calendar</h2>
                <Calendar onChange={handleDateChange} value={selectedDate} tileClassName={tileClassName} />
            </div>
            {selectedDate && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-gray-800">
                    <strong>Status for {selectedDate.toLocaleDateString()}:</strong>{" "}
                    {getStatusForDate(selectedDate)}
                </div>
            )}

            {/* Leave Allocation Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-md text-sm">
                        Leave Allocation
                    </span>
                </h2>

                <Formik
                    initialValues={{
                        year: new Date().getFullYear(),
                        totalLeaves: "",
                    }}
                    validationSchema={Yup.object({
                        year: Yup.number()
                            .min(2020, "Year must be 2020 or later")
                            .required("Year is required"),
                        totalLeaves: Yup.number()
                            .min(0, "Leave count must be positive")
                            .required("Total leaves is required"),
                    })}
                    onSubmit={async (values, { resetForm }) => {
                        try {
                            if (!id) return toast.error("Invalid employee ID");

                            // Allocate leaves for the selected year
                            await allocateLeaves(id, values);

                            // ✅ Fetch all allocated leaves again (not just selected year)
                            const res = await getAllocatedLeaves(id);
                            let leavesArray = [];

                            if (Array.isArray(res?.data)) {
                                leavesArray = res.data;
                            } else if (res?.data) {
                                leavesArray = [{ ...res.data, year: values.year }];
                            }

                            setAllocatedLeaves(leavesArray); // ✅ update the state

                            toast.success(`Allocated ${values.totalLeaves} leaves for ${values.year}`);
                            resetForm();
                        } catch (err: any) {
                            toast.error(err.message || "Failed to allocate leaves");
                        }
                    }}

                >

                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form className="space-y-6">
                            {/* Year Selection - Calendar in decade view (shows years only, no months) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Year
                                </label>
                                <Calendar
                                    onChange={(value: Date) => setFieldValue("year", value.getFullYear())}
                                    value={new Date(values.year || new Date().getFullYear(), 0, 1)}
                                    view="decade"
                                    maxDetail="decade"
                                    minDate={new Date(2020, 0, 1)}
                                    maxDate={new Date(2050, 11, 31)}
                                    className="border border-gray-300 rounded-lg shadow-sm"
                                    calendarType="US"
                                />
                                <ErrorMessage name="year" component="div" className="text-red-500 text-sm mt-1" />
                                <p className="text-sm text-gray-500 mt-1">
                                    Selected Year: <strong>{values.year}</strong>
                                </p>
                            </div>

                            {/* Total Leaves Input */}
                            <div>
                                <label htmlFor="totalLeaves" className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Leaves
                                </label>
                                <Field
                                    type="number"
                                    name="totalLeaves"
                                    placeholder="Enter no. of leaves"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:outline-none"
                                />
                                <ErrorMessage name="totalLeaves" component="div" className="text-red-500 text-sm mt-1" />
                            </div>

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition"
                                >
                                    {isSubmitting ? "Saving..." : "Save Allocation"}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
                    <h2 className="text-xl font-semibold mb-4">Allocated Leaves History</h2>
                    {Array.isArray(allocatedLeaves) && allocatedLeaves.length > 0 ? (
                        <table className="w-full border">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2">Year</th>
                                    <th className="px-4 py-2">Total Leaves</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allocatedLeaves.map((leave) => (
                                    <tr key={leave.year}>
                                        <td className="px-4 py-2">{leave.year}</td>
                                        <td className="px-4 py-2">{leave.totalLeaves}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No leaves allocated yet.</p>
                    )}

                </div>

            </div>
            {/* <AttendenceSummary id={id}/> */}
            {/* Leave Management */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Leave Management</h2>
                {loading ? (
                    <p>Loading leaves...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border">
                            <thead className="bg-gray-100">
                                <tr>
                                    {["Start Date", "End Date", "Leave Type", "Reason", "Status", "Actions"].map((col) => (
                                        <th key={col} className="px-4 py-2">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {leaveRequests.length > 0 ? (
                                    leaveRequests.map((leave) => (
                                        <tr key={leave.id}>
                                            <td className="px-4 py-2">{leave.startDate.toLocaleDateString()}</td>
                                            <td className="px-4 py-2">{leave.endDate.toLocaleDateString()}</td>
                                            <td className="px-4 py-2">{leave.leaveType}</td>
                                            <td className="px-4 py-2">{leave.reason}</td>
                                            <td className="px-4 py-2">{leave.status}</td>
                                            <td className="px-4 py-2 space-x-2">
                                                {leave.status === "Pending" && (
                                                    <>
                                                        <button onClick={() => handleLeaveStatusChange(leave.id, "Approved")} className="text-green-600">Approve</button>
                                                        <button onClick={() => handleLeaveStatusChange(leave.id, "Rejected")} className="text-red-600">Reject</button>
                                                    </>
                                                )}
                                                <button onClick={() => handleDeleteLeave(leave.id)} className="text-gray-600">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="text-center py-4">No leave requests</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}