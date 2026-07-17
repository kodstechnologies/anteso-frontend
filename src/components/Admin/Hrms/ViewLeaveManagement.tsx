import React, { useState, useEffect, useMemo } from "react"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import { startOfMonth, endOfMonth, isSunday, format } from "date-fns"
import { toast } from "react-toastify"
import { useParams } from "react-router-dom"
import { getAllLeaves, approveLeave, rejectLeave, deleteLeave, getEmployeeById, getAttendanceStatus, getAllAllocatedLeaves, getLeavesPerEmployee } from "../../../api"
import type { LeaveRequest } from "../../../types/hrms-types"
import { ChevronDown, ChevronUp, FileDown, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import {
    buildAttendanceExportData,
    exportAttendanceSummaryToExcel,
    exportAttendanceSummaryToPdf,
    exportAttendanceSummaryToWord,
    formatDateDDMMYYYY,
} from "../../../utils/exportAttendanceSummary"

const computeMonthlyAttendanceSummary = (
    monthDate: Date,
    attendanceMap: Record<string, string>,
) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    let totalWorkingDays = 0;
    let daysPresent = 0;

    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        const formatted = format(day, "yyyy-MM-dd");
        const status = attendanceMap[formatted];
        const isPresentOnSunday = isSunday(day) && status === "Present";

        if (!isSunday(day) || isPresentOnSunday) {
            totalWorkingDays += 1;
        }
        if (status === "Present") {
            daysPresent += 1;
        }
    }

    return { totalWorkingDays, daysPresent };
};

export default function EmployeeDetailsLeaveManagement() {
    const { id } = useParams()
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()))
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [employeeDetails, setEmployeeDetails] = useState<any>(null)
    const [showTools, setShowTools] = useState(false)
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({})
    const [attendanceLoading, setAttendanceLoading] = useState(false)
    const [leaveSummary, setLeaveSummary] = useState<any>(null);
    const [exporting, setExporting] = useState<'pdf' | 'excel' | 'word' | null>(null);
    // Rejection Modal State
    const [rejectModal, setRejectModal] = useState<{ open: boolean; leaveId: string | null }>({
        open: false,
        leaveId: null,
    })
    const [rejectionReason, setRejectionReason] = useState("")

    // Open/Close Modal
    const openRejectModal = (leaveId: string) => {
        setRejectModal({ open: true, leaveId })
        setRejectionReason("")
    }

    const closeRejectModal = () => {
        setRejectModal({ open: false, leaveId: null })
        setRejectionReason("")
    }

    // Fetch Allocated Leaves
    useEffect(() => {
        const fetchAllocatedLeaves = async () => {
            if (!id) return
            try {
                const res = await getAllAllocatedLeaves()
                let leavesArray = []
                if (Array.isArray(res?.data)) {
                    leavesArray = res.data
                } else if (res?.data) {
                    leavesArray = [{ ...res.data, year: res.data.year || new Date().getFullYear() }]
                }
                // setAllocatedLeaves(leavesArray) // not used yet
            } catch (err: any) {
                toast.error(err.message || "Failed to fetch allocated leaves")
            }
        }
        fetchAllocatedLeaves()
    }, [id])
    // Fetch Leave Summary (Allocated + CompOff)
    useEffect(() => {
        const fetchLeaveSummary = async () => {
            if (!id) return;

            try {
                const currentYear = new Date().getFullYear();
                const res = await getLeavesPerEmployee(id, currentYear);
                const summary = res?.data?.data ?? res?.data ?? null;
                setLeaveSummary(summary);
            } catch (err: any) {
                toast.error(err.message || "Failed to fetch leave summary");
            }
        };

        fetchLeaveSummary();
    }, [id]);

    // Fetch Attendance for the selected calendar month
    useEffect(() => {
        if (!id) return
        const fetchMonthlyAttendance = async () => {
            setAttendanceLoading(true)
            try {
                const start = startOfMonth(viewMonth)
                const end = endOfMonth(viewMonth)
                const today = format(new Date(), "yyyy-MM-dd")
                const allDays: string[] = []
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const date = format(d, "yyyy-MM-dd")
                    if (date <= today) allDays.push(date)
                }

                const attendanceData: Record<string, string> = {}
                for (const date of allDays) {
                    const res = await getAttendanceStatus(id, date)
                    attendanceData[date] = res?.data?.status || "Unknown"
                }
                setAttendanceMap(attendanceData)
            } catch (err: any) {
                toast.error(err.message || "Failed to fetch attendance status")
            } finally {
                setAttendanceLoading(false)
            }
        }
        fetchMonthlyAttendance()
    }, [id, viewMonth])

    // Fetch Employee
    useEffect(() => {
        const fetchEmployee = async () => {
            if (!id) return
            try {
                const res = await getEmployeeById(id)
                setEmployeeDetails(res?.data)
            } catch (err: any) {
                toast.error(err.message || "Failed to fetch employee details")
            }
        }
        fetchEmployee()
    }, [id])

    // Fetch Leaves
    useEffect(() => {
        const fetchLeaves = async () => {
            if (!id) return
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
                        rejectionReason: leave.rejectionReason || "",
                    }))
                    setLeaveRequests(mapped)
                }
            } catch {
                toast.error("Failed to fetch leaves")
            } finally {
                setLoading(false)
            }
        }
        fetchLeaves()
    }, [id])

    // Handle Approve/Reject
    const handleLeaveStatusChange = async (leaveId: string, status: "Approved" | "Rejected") => {
        if (!id) return

        try {
            if (status === "Approved") {
                await approveLeave(id, leaveId)
                toast.success("Leave approved")
                setLeaveRequests(prev =>
                    prev.map(l => l.id === leaveId ? { ...l, status: "Approved" } : l)
                )
            } else {
                openRejectModal(leaveId)
            }
        } catch (err: any) {
            toast.error(err.message || `Failed to ${status.toLowerCase()} leave`)
        }
    }

    // Confirm Rejection
    const confirmRejection = async () => {
        const reason = rejectionReason.trim()
        if (!reason || reason.length < 10) {
            toast.warn("Rejection reason must be at least 10 characters.")
            return
        }

        if (!rejectModal.leaveId || !id) return

        try {
            await rejectLeave(id, rejectModal.leaveId, reason)
            toast.success("Leave rejected")

            setLeaveRequests(prev =>
                prev.map(l =>
                    l.id === rejectModal.leaveId
                        ? { ...l, status: "Rejected", rejectionReason: reason }
                        : l
                )
            )
        } catch (err: any) {
            toast.error(err.message || "Failed to reject leave")
        } finally {
            closeRejectModal()
        }
    }

    // Delete Leave
    const handleDeleteLeave = async (leaveId: string) => {
        try {
            await deleteLeave(leaveId)
            toast.success("Leave deleted")
            setLeaveRequests(prev => prev.filter(l => l.id !== leaveId))
        } catch (err: any) {
            toast.error(err.message || "Failed to delete leave")
        }
    }

    const monthlySummary = useMemo(
        () => computeMonthlyAttendanceSummary(viewMonth, attendanceMap),
        [viewMonth, attendanceMap],
    );

    // Calendar Helpers
    const getStatusForDate = (date: Date) => {
        const formatted = format(date, "yyyy-MM-dd")
        if (formatted > format(new Date(), "yyyy-MM-dd")) return "Unknown"
        const status = attendanceMap[formatted]
        if (status) return status
        if (isSunday(date)) return "Holiday"
        return "Unknown"
    }

    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view !== "month") return ""
        const status = getStatusForDate(date)
        switch (status) {
            case "Present": return "present"
            case "Absent": return "absent"
            case "On Leave": return "sick-leave"
            case "Holiday": return "holiday"
            default: return ""
        }
    }

    const handleDateChange = (value: any) => {
        if (value instanceof Date) {
            setSelectedDate(value)
            setViewMonth(startOfMonth(value))
        } else if (Array.isArray(value) && value[0] instanceof Date) {
            setSelectedDate(value[0])
            setViewMonth(startOfMonth(value[0]))
        } else {
            setSelectedDate(null)
        }
    }

    const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
        if (activeStartDate) {
            setViewMonth(startOfMonth(activeStartDate))
        }
    }

    const getExportPayload = () =>
        buildAttendanceExportData(employeeDetails, attendanceMap, viewMonth);

    const handleExport = async (format: 'pdf' | 'excel' | 'word') => {
        if (!employeeDetails) {
            toast.warn("Employee details are still loading.");
            return;
        }

        const payload = getExportPayload();
        try {
            setExporting(format);
            if (format === 'pdf') {
                exportAttendanceSummaryToPdf(payload);
            } else if (format === 'excel') {
                exportAttendanceSummaryToExcel(payload);
            } else {
                await exportAttendanceSummaryToWord(payload);
            }
            toast.success(`Attendance summary exported as ${format.toUpperCase()}`);
        } catch (err: any) {
            toast.error(err?.message || `Failed to export ${format.toUpperCase()}`);
        } finally {
            setExporting(null);
        }
    };

    return (        <div className="space-y-8">
            <style >{`
                .react-calendar__tile.present { background: rgba(40, 167, 69, 0.5) !important; color: black; }
                .react-calendar__tile.absent { background: #dc3545 !important; color: white; }
                .react-calendar__tile.sick-leave { background: #ffc107 !important; color: black; }
                .react-calendar__tile.holiday { background: #e9ecef !important; color: black; }
                .react-calendar__tile--active { background: #007bff !important; color: white !important; }
            `}</style>

            {/* Employee Details */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">Employee Details</span>
                </h2>

                {employeeDetails ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <p><span className="font-semibold text-gray-900">Employee ID:</span> {employeeDetails.empId}</p>
                            <p><span className="font-semibold text-gray-900">Name:</span> {employeeDetails.name}</p>
                            <p><span className="font-semibold text-gray-900">Email:</span> {employeeDetails.email}</p>
                            <p><span className="font-semibold text-gray-900">Phone:</span> {employeeDetails.phone}</p>
                        </div>
                        <div className="space-y-3">
                            <p><span className="font-semibold text-gray-900">Designation:</span> {employeeDetails.designation}</p>
                            <p><span className="font-semibold text-gray-900">Department:</span> {employeeDetails.department}</p>
                            <p><span className="font-semibold text-gray-900">Join Date:</span> {new Date(employeeDetails.dateOfJoining).toLocaleDateString()}</p>
                            <p><span className="font-semibold text-gray-900">Working Days:</span> {employeeDetails.workingDays}</p>
                        </div>
                        {employeeDetails.address && (
                            <div className="col-span-2 mt-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                <p><span className="font-semibold text-gray-900">Address:</span> {employeeDetails.address}</p>
                            </div>
                        )}
                        {employeeDetails.tools && employeeDetails.tools.length > 0 && (
                            <div className="col-span-2 mt-6">
                                <button
                                    onClick={() => setShowTools(!showTools)}
                                    className="flex items-center justify-between w-full bg-blue-100 px-4 py-2 rounded-lg text-left font-semibold text-gray-800 hover:bg-blue-200 transition"
                                >
                                    <span>Issued Tools ({employeeDetails.tools.length})</span>
                                    {showTools ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>
                                {showTools && (
                                    <div className="mt-4 overflow-x-auto">
                                        <table className="w-full border border-gray-200 rounded-lg shadow-sm bg-white">
                                            <thead className="bg-gray-100 text-left">
                                                <tr>
                                                    {["Tool ID", "Serial No", "Nomenclature", "Manufacturer", "Model", "Certificate No", "Issue Date"].map(h => (
                                                        <th key={h} className="px-4 py-2 border-b">{h}</th>
                                                    ))}
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
                                                            {tool.issueDate ? new Date(tool.issueDate).toLocaleDateString() : "-"}
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
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="mb-5 rounded-xl border border-gray-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50/60 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Attendance Calendar</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Browse monthly attendance and download reports for {format(viewMonth, "MMMM yyyy")}.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Download Report
                            </span>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleExport('pdf')}
                                    disabled={!!exporting || attendanceLoading}
                                    className="group inline-flex min-w-[148px] items-center gap-3 rounded-xl border border-red-100 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                                        {exporting === 'pdf' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <FileText className="h-4 w-4" />
                                        )}
                                    </span>
                                    <span className="text-left">
                                        <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">Export</span>
                                        <span className="block text-sm font-semibold text-gray-900">
                                            {exporting === 'pdf' ? 'Preparing...' : 'PDF'}
                                        </span>
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleExport('excel')}
                                    disabled={!!exporting || attendanceLoading}
                                    className="group inline-flex min-w-[148px] items-center gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                        {exporting === 'excel' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <FileSpreadsheet className="h-4 w-4" />
                                        )}
                                    </span>
                                    <span className="text-left">
                                        <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">Export</span>
                                        <span className="block text-sm font-semibold text-gray-900">
                                            {exporting === 'excel' ? 'Preparing...' : 'Excel'}
                                        </span>
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleExport('word')}
                                    disabled={!!exporting || attendanceLoading}
                                    className="group inline-flex min-w-[148px] items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                        {exporting === 'word' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <FileDown className="h-4 w-4" />
                                        )}
                                    </span>
                                    <span className="text-left">
                                        <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">Export</span>
                                        <span className="block text-sm font-semibold text-gray-900">
                                            {exporting === 'word' ? 'Preparing...' : 'Word'}
                                        </span>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <Calendar
                    onChange={handleDateChange}
                    value={selectedDate}
                    activeStartDate={viewMonth}
                    onActiveStartDateChange={handleActiveStartDateChange}
                    tileClassName={tileClassName}
                />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-xl font-bold mb-4">
                    Attendance Summary ({format(viewMonth, "MMMM yyyy")})
                </h2>
                {attendanceLoading ? (
                    <p className="text-gray-500 italic">Loading attendance for selected month...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Working Days</p>
                            <p className="text-2xl font-semibold text-gray-900 mt-1">{monthlySummary.totalWorkingDays}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                            <p className="text-xs text-green-700 uppercase tracking-wide">Days Present</p>
                            <p className="text-2xl font-semibold text-green-800 mt-1">{monthlySummary.daysPresent}</p>
                        </div>
                    </div>
                )}
            </div>
            {selectedDate && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-gray-800">
                    <strong>Status for {formatDateDDMMYYYY(selectedDate)}:</strong> {getStatusForDate(selectedDate)}
                </div>
            )}
            {leaveSummary && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mt-6">
                    <h2 className="text-xl font-bold mb-4">Leave Summary ({leaveSummary.year ?? new Date().getFullYear()})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <p><strong>Allocated Leaves:</strong> {leaveSummary.allocatedLeaves ?? 0}</p>
                        <p><strong>Comp Off:</strong> {leaveSummary.compOffLeaves ?? 0}</p>
                        {/* <p><strong>Total Leaves:</strong> {leaveSummary.totalLeaves}</p>
                        <p><strong>Used Leaves:</strong> {leaveSummary.usedLeaves}</p>
                        <p><strong>Remaining Leaves:</strong> {leaveSummary.remainingLeaves}</p> */}
                    </div>
                </div>
            )}

            {/* Leave Management */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm">Leave Management</span>
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        <span className="ml-3 text-gray-600">Loading leaves…</span>
                    </div>
                ) : leaveRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium">No leave requests found</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                                    <tr>
                                        {["Start Date", "End Date", "Leave Type", "Reason", "Status", "Rejection Reason", "Actions"].map(h => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {leaveRequests.map((leave, idx) => (
                                        <tr key={leave.id} className={`${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-indigo-50 transition-colors duration-150`}>
                                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">{leave.startDate.toLocaleDateString()}</td>
                                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-800">{leave.endDate.toLocaleDateString()}</td>
                                            <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">{leave.leaveType}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600 max-w-xs">
                                                {leave.reason}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                                                    ${leave.status === "Approved" ? "bg-green-100 text-green-800" :
                                                        leave.status === "Rejected" ? "bg-red-100 text-red-800" :
                                                            "bg-yellow-100 text-yellow-800"}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm max-w-xs">
                                                {leave.status === "Rejected" ? (
                                                    <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5  text-xs font-medium border border-red-200 hover:bg-red-100 transition cursor-default">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="whitespace-normal break-words">
                                                            {leave.rejectionReason}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                {leave.status === "Pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleLeaveStatusChange(leave.id, "Approved")}
                                                            className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-700 transition"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleLeaveStatusChange(leave.id, "Rejected")}
                                                            className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-700 transition"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteLeave(leave.id)}
                                                    className="inline-flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-300 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-4">
                            {leaveRequests.map(leave => (
                                <div key={leave.id} className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl shadow-sm border border-indigo-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-indigo-900">{leave.leaveType}</p>
                                            <p className="text-xs text-gray-600">
                                                {leave.startDate.toLocaleDateString()} – {leave.endDate.toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold
                                            ${leave.status === "Approved" ? "bg-green-100 text-green-800" :
                                                leave.status === "Rejected" ? "bg-red-100 text-red-800" :
                                                    "bg-yellow-100 text-yellow-800"}`}>
                                            {leave.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{leave.reason}</p>
                                    {leave.status === "Rejected" && (
                                        <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 mb-3 w-fit">
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span className="truncate max-w-[180px]">{leave.rejectionReason}</span>
                                        </div>
                                    )}
                                    <div className="flex gap-2 mt-3">
                                        {leave.status === "Pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleLeaveStatusChange(leave.id, "Approved")}
                                                    className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleLeaveStatusChange(leave.id, "Rejected")}
                                                    className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-red-700 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDeleteLeave(leave.id)}
                                            className="flex items-center justify-center bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-300 transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Reject Leave Request
                        </h3>

                        <div className="mb-5">
                            <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Rejection <span className="text-red-600">*</span>
                            </label>
                            <textarea
                                id="rejection-reason"
                                rows={3}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g. Insufficient team coverage..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                            />
                            {rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 && (
                                <p className="mt-1 text-xs text-red-600">Reason must be at least 10 characters.</p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeRejectModal}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRejection}
                                disabled={!rejectionReason.trim() || rejectionReason.trim().length < 10}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}