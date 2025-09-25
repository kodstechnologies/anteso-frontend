"use client"
import { useState, useEffect } from "react"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import { isSameDay, startOfMonth, endOfMonth, isSunday } from "date-fns"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { useParams } from "react-router-dom" // or next/navigation if Next.js
import { getAllLeaves, approveLeave, rejectLeave, deleteLeave } from "../../../api" // ✅ include APIs
import type { AttendanceEntry, Employee, LeaveRequest } from "../../../types/hrms-types"

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
        const entry = attendanceData.find((entry) => isSameDay(entry.date, date))
        return entry ? entry.status : isSunday(date) ? "Holiday" : "Unknown"
    }

    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === "month") {
            const status = getStatusForDate(date)
            switch (status) {
                case "Present":
                    return "present"
                case "Absent":
                    return "absent"
                case "Sick Leave":
                    return "sick-leave"
                case "Holiday":
                    return "holiday"
                default:
                    return ""
            }
        }
        return ""
    }

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
          .react-calendar__tile.holiday { background: #f8f9fa !important; color: black; }
          .react-calendar__tile--active { background: #007bff !important; color: white !important; }
        `}
            </style>

            {/* Employee Details */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Employee Details</h2>
                <Formik initialValues={employee} validationSchema={validationSchema} onSubmit={() => toast.success("Details saved!")}>
                    <Form className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {["empId", "name", "email", "phone", "designation", "department", "joinDate", "workingDay"].map((field) => (
                                <div key={field}>
                                    <label className="font-medium text-gray-700">{field}</label>
                                    <Field name={field} type="text" className="w-full mt-1 p-2 border rounded-md" />
                                    <ErrorMessage name={field} component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <label className="font-medium text-gray-700">Address</label>
                            <Field as="textarea" name="address" className="w-full mt-1 p-2 border rounded-md" />
                            <ErrorMessage name="address" component="div" className="text-red-500 text-xs mt-1" />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">Save</button>
                    </Form>
                </Formik>
            </div>

            {/* Attendance Calendar */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Attendance Calendar</h2>
                <Calendar onChange={handleDateChange} value={selectedDate} tileClassName={tileClassName} />
            </div>

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
