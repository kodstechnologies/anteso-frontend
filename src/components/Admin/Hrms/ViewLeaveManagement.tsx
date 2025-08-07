"use client"
import { useState } from "react"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import { isSameDay, startOfMonth, endOfMonth, getDaysInMonth, isSunday } from "date-fns"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import type { AttendanceEntry, Employee, LeaveRequest } from "../../../types/hrms-types"

// Mock attendance data
const attendanceData: AttendanceEntry[] = [
    { date: new Date(2025, 4, 1), status: "Present" },
    { date: new Date(2025, 4, 2), status: "Present" },
    { date: new Date(2025, 4, 3), status: "Sick Leave" },
    { date: new Date(2025, 4, 4), status: "Absent" },
    { date: new Date(2025, 4, 5), status: "Present" },
    { date: new Date(2025, 4, 6), status: "Present" },
    { date: new Date(2025, 4, 7), status: "Present" },
    { date: new Date(2025, 4, 8), status: "Absent" },
    { date: new Date(2025, 4, 9), status: "Present" },
]

// Employee details
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

// Validation schema for employee details
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

// Leave form validation schema
const leaveValidationSchema = Yup.object({
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
        .required("End date is required")
        .min(Yup.ref("startDate"), "End date cannot be before start date"),
    leaveType: Yup.string().required("Leave type is required"),
    reason: Yup.string().required("Reason is required"),
})

export default function EmployeeDetailsLeaveManagement() {
    // Employee Details & Calendar State
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

    // Leave Management State
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
        {
            id: "1",
            startDate: new Date(2025, 4, 10),
            endDate: new Date(2025, 4, 12),
            leaveType: "Sick Leave",
            reason: "Fever and cold",
            status: "Approved",
        },
        {
            id: "2",
            startDate: new Date(2025, 4, 20),
            endDate: new Date(2025, 4, 22),
            leaveType: "Vacation",
            reason: "Family trip",
            status: "Pending",
        },
    ])
    const [isAddingLeave, setIsAddingLeave] = useState(false)

    // Employee Details Functions
    const onSubmit = (values: Employee) => {
        toast.success("Employee details updated successfully!")
        console.log("Employee details updated:", values)
        // Here you would typically send the data to your API
    }

    // Calculate attendance summary for the current month
    const getAttendanceSummary = () => {
        const currentMonth = new Date(2025, 4) // May 2025
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)
        const totalDays = getDaysInMonth(currentMonth)
        let workingDays = 0
        const summary = {
            present: 0,
            sickLeave: 0,
        }

        // Calculate working days (exclude Sundays unless present)
        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
            if (!isSunday(day) || attendanceData.some((entry) => isSameDay(entry.date, day) && entry.status === "Present")) {
                workingDays += 1
            }
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
                    default:
                        break
                }
            }
        })

        return { ...summary, totalDays: workingDays }
    }

    // Get status for a specific date
    const getStatusForDate = (date: Date) => {
        const entry = attendanceData.find((entry) => isSameDay(entry.date, date))
        return entry ? entry.status : isSunday(date) ? "Holiday" : "Unknown"
    }

    // Customize calendar tile based on attendance status
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

    // Handle calendar onChange with proper typing
    const handleDateChange = (value: any) => {
        if (value instanceof Date) {
            setSelectedDate(value)
        } else if (Array.isArray(value) && value[0] instanceof Date) {
            setSelectedDate(value[0])
        } else {
            setSelectedDate(null)
        }
    }

    // Leave Management Functions
    const handleSubmitLeave = (values: Omit<LeaveRequest, "id" | "status">, { resetForm }: any) => {
        const newLeave: LeaveRequest = {
            ...values,
            id: Date.now().toString(),
            status: "Pending",
        }
        setLeaveRequests([...leaveRequests, newLeave])
        setIsAddingLeave(false)
        resetForm()
    }

    const handleDeleteLeave = (id: string) => {
        setLeaveRequests(leaveRequests.filter((leave) => leave.id !== id))
    }

    const handleLeaveStatusChange = (id: string, status: "Approved" | "Rejected") => {
        setLeaveRequests(leaveRequests.map((leave) => (leave.id === id ? { ...leave, status } : leave)))
    }

    return (
        <div>
            <style>
                {`
          .react-calendar__tile.present {
            background: rgba(40, 167, 69, 0.5) !important;
            color: black;
          }
          .react-calendar__tile.absent {
            background: #dc3545 !important;
            color: white;
          }
          .react-calendar__tile.sick-leave {
            background: #ffc107 !important;
            color: black;
          }
          .react-calendar__tile.holiday {
            background: #f8f9fa !important;
            color: black;
          }
          .react-calendar__tile--active {
            background: #007bff !important;
            color: white !important;
          }
        `}
            </style>

            {/* Employee Details and Calendar Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Employee Details */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Employee Details</h1>
                    <Formik initialValues={employee} validationSchema={validationSchema} onSubmit={onSubmit}>
                        {() => (
                            <Form className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: "Employee ID", name: "empId" },
                                        { label: "Name", name: "name" },
                                        { label: "Email", name: "email", type: "email" },
                                        { label: "Phone", name: "phone" },
                                        { label: "Designation", name: "designation" },
                                        { label: "Department", name: "department" },
                                        { label: "Date of Joining", name: "joinDate", type: "date" },
                                        { label: "Working Days (per week)", name: "workingDay", type: "number" },
                                    ].map(({ label, name, type = "text" }) => (
                                        <div key={name}>
                                            <label className="font-semibold text-gray-700">{label}:</label>
                                            <Field type={type} name={name} className="w-full mt-1 p-2 border border-gray-300 rounded" />
                                            <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <label className="font-semibold text-gray-700">Address:</label>
                                    <Field as="textarea" name="address" className="w-full mt-1 p-2 border border-gray-300 rounded" />
                                    <ErrorMessage name="address" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                        Save Details
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>

                {/* Attendance Calendar */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Attendance Calendar</h2>
                    <div className="flex justify-center">
                        <Calendar
                            onChange={handleDateChange}
                            value={selectedDate}
                            tileClassName={tileClassName}
                            className="border-none"
                        />
                    </div>
                    {/* Legend */}
                    <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
                            <span>Present</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                            <span>Absent</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
                            <span>Sick Leave</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                            <span>Holiday</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leave Management Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Leave Management</h2>
                    <button
                        onClick={() => setIsAddingLeave(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        Apply for Leave
                    </button>
                </div>

                {/* Add Leave Form */}
                {isAddingLeave && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Apply for Leave</h3>
                        <Formik
                            initialValues={{
                                startDate: new Date(),
                                endDate: new Date(),
                                leaveType: "Sick Leave",
                                reason: "",
                            }}
                            validationSchema={leaveValidationSchema}
                            onSubmit={handleSubmitLeave}
                        >
                            {({ values, setFieldValue }) => (
                                <Form className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-700 mb-1">Leave Type</label>
                                            <Field as="select" name="leaveType" className="w-full p-2 border border-gray-300 rounded">
                                                <option value="Sick Leave">Sick Leave</option>
                                                <option value="Vacation">Vacation</option>
                                                <option value="Personal Leave">Personal Leave</option>
                                                <option value="Maternity/Paternity">Maternity/Paternity</option>
                                                <option value="Bereavement">Bereavement</option>
                                            </Field>
                                            <ErrorMessage name="leaveType" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={values.startDate.toISOString().split("T")[0]}
                                                onChange={(e) => setFieldValue("startDate", new Date(e.target.value))}
                                                className="w-full p-2 border border-gray-300 rounded"
                                            />
                                            <ErrorMessage name="startDate" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 mb-1">End Date</label>
                                            <input
                                                type="date"
                                                value={values.endDate.toISOString().split("T")[0]}
                                                onChange={(e) => setFieldValue("endDate", new Date(e.target.value))}
                                                className="w-full p-2 border border-gray-300 rounded"
                                            />
                                            <ErrorMessage name="endDate" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-gray-700 mb-1">Reason</label>
                                            <Field
                                                as="textarea"
                                                name="reason"
                                                className="w-full p-2 border border-gray-300 rounded"
                                                placeholder="Brief reason for leave"
                                            />
                                            <ErrorMessage name="reason" component="div" className="text-red-500 text-sm mt-1" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-2 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingLeave(false)}
                                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                            Submit Leave Request
                                        </button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                )}

                {/* Leave Requests Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Start Date</th>
                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">End Date</th>
                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Leave Type</th>
                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Reason</th>
                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Status</th>
                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaveRequests.length > 0 ? (
                                leaveRequests.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 border border-gray-300 text-gray-700">
                                            {leave.startDate.toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-300 text-gray-700">
                                            {leave.endDate.toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-300 text-gray-700">{leave.leaveType}</td>
                                        <td className="px-4 py-3 border border-gray-300 text-gray-700">{leave.reason}</td>
                                        <td className="px-4 py-3 border border-gray-300">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs ${leave.status === "Approved"
                                                    ? "bg-green-100 text-green-800"
                                                    : leave.status === "Rejected"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                            >
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border border-gray-300 space-x-2">
                                            {leave.status === "Pending" && (
                                                <>
                                                    <button
                                                        onClick={() => handleLeaveStatusChange(leave.id, "Approved")}
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleLeaveStatusChange(leave.id, "Rejected")}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => handleDeleteLeave(leave.id)} className="text-gray-600 hover:text-gray-800">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                        No leave requests recorded yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
