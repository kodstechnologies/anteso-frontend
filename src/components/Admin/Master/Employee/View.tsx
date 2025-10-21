import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { isSameDay, startOfMonth, endOfMonth, getDaysInMonth, isSunday, format } from 'date-fns';
import { Link, useParams } from 'react-router-dom';
import { getEmployeeById, getAttendanceStatus } from '../../../../api';
import AttendenceSummary from '../../Hrms/AttendanceSummary';
import PaymentDetails from '../../Hrms/PaymentDetails';

function ViewEmployee() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const { id } = useParams<{ id: string }>();
    // get employee ID from URL
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                if (!id) {
                    setLoading(false);
                    return;
                }
                setLoading(true);
                const res = await getEmployeeById(id);
                // Backend response structure: res.data.data
                setEmployee(res.data);
            } catch (error) {
                console.error('Error fetching employee:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [id]);

    // Fetch attendance for the current month
    useEffect(() => {
        const fetchMonthlyAttendance = async () => {
            if (!id) return;
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
                console.error("Failed to fetch attendance status:", err);
                // Optionally show a message here
            }
        };

        fetchMonthlyAttendance();
    }, [id]);

    if (loading || !employee) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="text-lg text-gray-600">Loading Employee Details...</div>
            </div>
        );
    }

    // Calculate attendance summary for the current month
    const getAttendanceSummary = () => {
        const currentMonth = new Date();
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const totalDays = getDaysInMonth(currentMonth);
        let workingDays = 0;
        const summary = {
            present: 0,
            sickLeave: 0,
        };

        // Calculate working days (exclude Sundays unless present)
        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
            if (!isSunday(day) || Object.keys(attendanceMap).some(dateStr => {
                const date = new Date(dateStr);
                return isSameDay(date, day) && attendanceMap[dateStr] === 'Present';
            })) {
                workingDays += 1;
            }
        }

        // Count from attendanceMap
        Object.entries(attendanceMap).forEach(([dateStr, status]) => {
            const date = new Date(dateStr);
            if (date >= start && date <= end) {
                switch (status) {
                    case 'Present':
                        summary.present += 1;
                        break;
                    case 'Sick Leave':
                        summary.sickLeave += 1;
                        break;
                    default:
                        break;
                }
            }
        });

        return { ...summary, totalDays: workingDays };
    };

    // Get status for a specific date
    const getStatusForDate = (date: Date) => {
        const formattedDate = date.toISOString().split("T")[0];
        const status = attendanceMap[formattedDate];

        if (status) return status;
        if (isSunday(date)) return 'Holiday';
        return 'Unknown';
    };

    // Customize calendar tile based on attendance status
    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const status = getStatusForDate(date);
            switch (status) {
                case 'Present':
                    return 'present';
                case 'Absent':
                    return 'absent';
                case 'Sick Leave':
                    return 'sick-leave';
                case 'Holiday':
                    return 'holiday';
                default:
                    return '';
            }
        }
        return '';
    };

    // Handle calendar onChange with proper typing
    const handleDateChange = (value: any) => {
        // Handle different value types that react-calendar can return
        if (value instanceof Date) {
            setSelectedDate(value);
        } else if (Array.isArray(value) && value[0] instanceof Date) {
            setSelectedDate(value[0]);
        } else {
            setSelectedDate(null);
        }
    };

    const summary = getAttendanceSummary();

    return (
        <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
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

            {/* Breadcrumb Navigation */}
            <nav className="flex text-gray-500 font-semibold my-4" aria-label="Breadcrumb">
                <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                    <li>
                        <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                            Dashboard
                        </Link>
                    </li>
                    <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                        <Link to="/admin/employee" className="text-primary">
                            Employee
                        </Link>
                    </li>
                    <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                        <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                            View Employee
                        </Link>
                    </li>
                </ol>
            </nav>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Employee Details */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Employee Details</h1>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <span className="font-semibold text-gray-700">Employee ID:</span>
                                    <p className="text-gray-600 mt-1">{employee.empId}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Name:</span>
                                    <p className="text-gray-600 mt-1">{employee.name}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Email:</span>
                                    <p className="text-gray-600 mt-1">{employee.email}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Phone:</span>
                                    <p className="text-gray-600 mt-1">{employee.phone}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Designation:</span>
                                    <p className="text-gray-600 mt-1">{employee.designation}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Department:</span>
                                    <p className="text-gray-600 mt-1">{employee.department}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Date of Joining:</span>
                                    <p className="text-gray-600 mt-1">{employee.dateOfJoining ? format(new Date(employee.dateOfJoining), 'MM/dd/yyyy') : ''}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Working Days:</span>
                                    <p className="text-gray-600 mt-1">{employee.workingDays} days</p>
                                </div>
                            </div>
                            {/* <div className="pt-4">
                                <span className="font-semibold text-gray-700">Address:</span>
                                <p className="text-gray-600 mt-1">{employee.address || ''}</p>
                            </div> */}
                        </div>
                    </div>

                    {/* Attendance Calendar */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Attendance Calendar</h2>
                        <div className="flex justify-center">
                            <Calendar onChange={handleDateChange} value={selectedDate} tileClassName={tileClassName} className="border-none" />
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attendance Summary */}
                    {/* <AttendenceSummary id={id} /> */}
                    <AttendenceSummary id={id || ''} />

                    {/* Payment Details */}
                    {/* <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Details</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Component</th>
                                        <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-3 border border-gray-300 text-gray-700">Basic Pay</td>
                                        <td className="px-4 py-3 border border-gray-300 text-gray-700 font-medium">₹50,000</td>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        <td className="px-4 py-3 border border-gray-300 text-gray-700">Travel Allowance</td>
                                        <td className="px-4 py-3 border border-gray-300 text-gray-700 font-medium">₹5,000</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 border border-gray-300 text-gray-700">Other Allowances</td>
                                        <td className="px-4 py-3 border border-gray-300 text-gray-700 font-medium">₹3,000</td>
                                    </tr>
                                    <tr className="bg-blue-50 font-bold">
                                        <td className="px-4 py-3 border border-gray-300 text-gray-800">Total Pay</td>
                                        <td className="px-4 py-3 border border-gray-300 text-blue-600 font-bold">
                                            ₹58,000
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div> */}
                    <PaymentDetails id={employee._id} date={selectedDate ? selectedDate.toISOString().split("T")[0] : ""} />

                </div>
            </div>
        </div>
    );
}

export default ViewEmployee;