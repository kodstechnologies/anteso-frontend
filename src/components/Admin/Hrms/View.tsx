'use client';

import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { isSameDay, startOfMonth, endOfMonth, getDaysInMonth, isSunday } from 'date-fns';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdDelete } from "react-icons/md";
import IconEye from '../../Icon/IconEye';

// Types
interface AttendanceEntry {
    date: Date;
    status: 'Present' | 'Absent' | 'Sick Leave';
}

interface PaymentData {
    basicPay: number;
    travelAllowance: number;
    otherAllowances: number;
}

interface Employee {
    empId: string;
    name: string;
    email: string;
    address: string;
    phone: string;
    business: string;
    gstNo: string;
    designation: string;
    department: string;
    joinDate: string;
    workingDay: string;
}

interface Expense {
    id: string;
    title: string;
    amount: number;
    date: Date;
    category: string;
    type: string;
}
interface Salary {
    id: string;
    date: Date;
    month: string;
    fixed: number;
    incentive: number;
}

interface LeaveRequest {
    id: string;
    startDate: Date;
    endDate: Date;
    leaveType: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

// Mock attendance data
const attendanceData: AttendanceEntry[] = [
    { date: new Date(2025, 4, 1), status: 'Present' },
    { date: new Date(2025, 4, 2), status: 'Present' },
    { date: new Date(2025, 4, 3), status: 'Sick Leave' },
    { date: new Date(2025, 4, 4), status: 'Absent' },
    { date: new Date(2025, 4, 5), status: 'Present' },
    { date: new Date(2025, 4, 6), status: 'Present' },
    { date: new Date(2025, 4, 7), status: 'Present' },
    { date: new Date(2025, 4, 8), status: 'Absent' },
    { date: new Date(2025, 4, 9), status: 'Present' },
];

// Mock payment data
const paymentData: PaymentData = {
    basicPay: 50000,
    travelAllowance: 5000,
    otherAllowances: 3000,
};

// Employee details
const employee: Employee = {
    empId: 'EMP001',
    name: 'Rabi Prasad',
    email: 'client1@gmail.com',
    address: 'HSR Layout, Bangalore, Karnataka',
    phone: '9876576876',
    business: 'Tech Solutions Pvt. Ltd.',
    gstNo: 'AX123',
    designation: 'Manager',
    department: 'dpt_A',
    joinDate: '2023-01-04',
    workingDay: '6',
};

// Validation schema
const validationSchema = Yup.object({
    empId: Yup.string().required('Employee ID is required'),
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string().required('Phone is required'),
    designation: Yup.string().required('Designation is required'),
    department: Yup.string().required('Department is required'),
    joinDate: Yup.string().required('Join date is required'),
    workingDay: Yup.string().required('Working days is required'),
    address: Yup.string().required('Address is required'),
});

// Leave form validation schema
const leaveValidationSchema = Yup.object({
    startDate: Yup.date().required('Start date is required'),
    endDate: Yup.date().required('End date is required').min(Yup.ref('startDate'), 'End date cannot be before start date'),
    leaveType: Yup.string().required('Leave type is required'),
    reason: Yup.string().required('Reason is required'),
});

function ViewHrms() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [expenses, setExpenses] = useState<Expense[]>([
        {
            id: '1',
            title: 'Office Supplies',
            amount: 5000,
            date: new Date(2025, 4, 1),
            category: 'Advance',
            type: 'Advance',
        },
        {
            id: '2',
            title: 'Office Supplies',
            amount: 2500,
            date: new Date(2025, 4, 1),
            category: 'Operations',
            type: 'Expense',
        },
        {
            id: '3',
            title: 'Team Lunch',
            amount: 4500,
            date: new Date(2025, 4, 3),
            category: 'Team Building',
            type: 'Expense',
        },
    ]);
    const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>({
        title: '',
        amount: 0,
        date: new Date(),
        category: 'Operations',
        type: 'Expense',
    });
    const [isAddingSalary, setIsAddingSalary] = useState(false);
    const [salaries, setSalaries] = useState<Salary[]>([
        {
            id: '1',
            date: new Date(2025, 4, 1),
            month: 'January',
            fixed: 25000,
            incentive: 2000,
        },
        {
            id: '2',
            date: new Date(2025, 4, 1),
            month: 'February',
            fixed: 25000,
            incentive: 2000,
        },
    ]);
    const [newSalary, setNewSalary] = useState<Omit<Salary, 'id'>>({
        date: new Date(),
        month: '',
        fixed: 25000,
        incentive: 0,
    });

    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
        {
            id: '1',
            startDate: new Date(2025, 4, 10),
            endDate: new Date(2025, 4, 12),
            leaveType: 'Sick Leave',
            reason: 'Fever and cold',
            status: 'Approved',
        },
        {
            id: '2',
            startDate: new Date(2025, 4, 20),
            endDate: new Date(2025, 4, 22),
            leaveType: 'Vacation',
            reason: 'Family trip',
            status: 'Pending',
        },
    ]);
    const [isAddingLeave, setIsAddingLeave] = useState(false);

    // Handle form submission
    const onSubmit = (values: Employee) => {
        toast.success('Employee details updated successfully!');
        console.log('Employee details updated:', values);
        // Here you would typically send the data to your API
    };

    // Handle adding new expense
    const handleAddSalary = () => {
        if (newSalary.month && newSalary.fixed > 0) {
            const salary: Salary = {
                ...newSalary,
                id: Date.now().toString(),
            };
            setSalaries([...salaries, salary]);
            setNewSalary({
                date: new Date(),
                month: '',
                fixed: 25000,
                incentive: 0,
            });
            setIsAddingSalary(false);
        }
    };
    // Handle adding new salary
    const handleAddExpense = () => {
        if (newExpense.title && newExpense.amount > 0) {
            const expense: Expense = {
                ...newExpense,
                id: Date.now().toString(),
            };
            setExpenses([...expenses, expense]);
            setNewExpense({
                title: '',
                amount: 0,
                date: new Date(),
                category: 'Operations',
                type: 'Expense',
            });
            setIsAddingExpense(false);
        }
    };

    // Handle deleting expense
    const handleDeleteExpense = (id: string) => {
        setExpenses(expenses.filter((expense) => expense.id !== id));
    };

    // Handle submitting leave request
    const handleSubmitLeave = (values: Omit<LeaveRequest, 'id' | 'status'>, { resetForm }: any) => {
        const newLeave: LeaveRequest = {
            ...values,
            id: Date.now().toString(),
            status: 'Pending',
        };
        setLeaveRequests([...leaveRequests, newLeave]);
        setIsAddingLeave(false);
        resetForm();
    };

    // Handle deleting leave request
    const handleDeleteLeave = (id: string) => {
        setLeaveRequests(leaveRequests.filter((leave) => leave.id !== id));
    };

    // Handle leave status change
    const handleLeaveStatusChange = (id: string, status: 'Approved' | 'Rejected') => {
        setLeaveRequests(leaveRequests.map((leave) => (leave.id === id ? { ...leave, status } : leave)));
    };

    // Calculate attendance summary for the current month
    const getAttendanceSummary = () => {
        const currentMonth = new Date(2025, 4); // May 2025
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
            if (!isSunday(day) || attendanceData.some((entry) => isSameDay(entry.date, day) && entry.status === 'Present')) {
                workingDays += 1;
            }
        }

        attendanceData.forEach((entry) => {
            if (entry.date >= start && entry.date <= end) {
                switch (entry.status) {
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
        const entry = attendanceData.find((entry) => isSameDay(entry.date, date));
        return entry ? entry.status : isSunday(date) ? 'Holiday' : 'Unknown';
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
                        <Link to="/admin/hrms" className="text-primary">
                            HRMS
                        </Link>
                    </li>
                    <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                        <span className="text-gray-600">View</span>
                    </li>
                </ol>
            </nav>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Employee Details */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Employee Details</h1>
                        <Formik initialValues={employee} validationSchema={validationSchema} onSubmit={onSubmit}>
                            {() => (
                                <Form className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Employee ID', name: 'empId' },
                                            { label: 'Name', name: 'name' },
                                            { label: 'Email', name: 'email', type: 'email' },
                                            { label: 'Phone', name: 'phone' },
                                            { label: 'Designation', name: 'designation' },
                                            { label: 'Department', name: 'department' },
                                            { label: 'Date of Joining', name: 'joinDate', type: 'date' },
                                            { label: 'Working Days (per week)', name: 'workingDay', type: 'number' },
                                        ].map(({ label, name, type = 'text' }) => (
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

                {/* Leave Management */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Leave Management</h2>
                        <button onClick={() => setIsAddingLeave(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
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
                                    leaveType: 'Sick Leave',
                                    reason: '',
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
                                                    value={values.startDate.toISOString().split('T')[0]}
                                                    onChange={(e) => setFieldValue('startDate', new Date(e.target.value))}
                                                    className="w-full p-2 border border-gray-300 rounded"
                                                />
                                                <ErrorMessage name="startDate" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 mb-1">End Date</label>
                                                <input
                                                    type="date"
                                                    value={values.endDate.toISOString().split('T')[0]}
                                                    onChange={(e) => setFieldValue('endDate', new Date(e.target.value))}
                                                    className="w-full p-2 border border-gray-300 rounded"
                                                />
                                                <ErrorMessage name="endDate" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-gray-700 mb-1">Reason</label>
                                                <Field as="textarea" name="reason" className="w-full p-2 border border-gray-300 rounded" placeholder="Brief reason for leave" />
                                                <ErrorMessage name="reason" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-2 mt-4">
                                            <button type="button" onClick={() => setIsAddingLeave(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
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
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{leave.startDate.toLocaleDateString()}</td>
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{leave.endDate.toLocaleDateString()}</td>
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{leave.leaveType}</td>
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{leave.reason}</td>
                                            <td className="px-4 py-3 border border-gray-300">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${leave.status === 'Approved'
                                                        ? 'bg-green-100 text-green-800'
                                                        : leave.status === 'Rejected'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                >
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border border-gray-300 space-x-2">
                                                {leave.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => handleLeaveStatusChange(leave.id, 'Approved')} className="text-green-600 hover:text-green-800">
                                                            Approve
                                                        </button>
                                                        <button onClick={() => handleLeaveStatusChange(leave.id, 'Rejected')} className="text-red-600 hover:text-red-800">
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

                {/* Expense Management */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Advance Management</h2>
                        <button onClick={() => setIsAddingExpense(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                            Add Advance
                        </button>
                    </div>

                    {/* Add Expense Form */}
                    {isAddingExpense && (
                        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Add New Advance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-1">Advance Title</label>
                                    <input
                                        type="text"
                                        value={newExpense.title}
                                        onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="e.g. Office Supplies"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={newExpense.amount || ''}
                                        onChange={(e) => setNewExpense({ ...newExpense, amount: Number.parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={newExpense.date.toISOString().split('T')[0]}
                                        onChange={(e) => setNewExpense({ ...newExpense, date: new Date(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                {/* <div>
                                    <label className="block text-gray-700 mb-1">Category</label>
                                    <select
                                        value={newExpense.category}
                                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    >
                                        <option value="Operations">Operations</option>
                                        <option value="Team Building">Team Building</option>
                                        <option value="Travel">Travel</option>
                                        <option value="Equipment">Equipment</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div> */}
                                {/* <div>
                                    <label className="block text-gray-700 mb-1">Type</label>
                                    <select value={newExpense.type} onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })} className="w-full p-2 border border-gray-300 rounded">
                                        <option value="Advance">Advance</option>
                                        <option value="Expense">Expense</option>
                                    </select>
                                </div> */}
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button onClick={() => setIsAddingExpense(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
                                    Cancel
                                </button>
                                <button onClick={handleAddExpense} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                    Save Advance
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Expenses Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Date</th>
                                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Title</th>
                                    {/* <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Category</th> */}
                                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Amount</th>
                                    {/* <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Type</th> */}
                                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.length > 0 ? (
                                    expenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{expense.date.toLocaleDateString()}</td>
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{expense.title}</td>
                                            {/* <td className="px-4 py-3 border border-gray-300 text-gray-700">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${expense.category === 'Operations'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : expense.category === 'Team Building'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : expense.category === 'Travel'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {expense.category}
                                                </span>
                                            </td> */}
                                            {/* <td className={`px-4 py-3 border border-gray-300 font-medium ${expense.type === 'Advance' ? 'text-green-700' : 'text-red-700'}`}>
                                                ₹{expense.amount.toLocaleString('en-IN')}
                                            </td> */}
                                            {/* <td className="px-4 py-3 border border-gray-300 text-gray-700">{expense.type}</td> */}
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{expense.amount}</td>

                                            <td className="px-4 py-3 border border-gray-300">
                                                <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600 hover:text-red-800">
                                                    <MdDelete className='h-5 w-5' />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                            No expenses recorded yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {expenses.length > 0 && (
                                <tfoot>
                                    <tr className="bg-blue-50 font-bold">
                                        <td colSpan={3} className="px-4 py-3 border border-gray-300 text-right text-gray-800">
                                            Total Expenses:
                                        </td>
                                        <td className="px-4 py-3 border border-gray-300 text-blue-600">
                                            ₹
                                            {expenses
                                                .reduce((sum, exp) => {
                                                    return exp.type === 'Advance' ? sum + exp.amount : sum - exp.amount;
                                                }, 0)
                                                .toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                </tfoot>

                            )}
                        </table>
                    </div>
                </div>
                {/* salary */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Salary Management</h2>
                        <button onClick={() => setIsAddingSalary(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                            Add Salary
                        </button>
                    </div>
                    {/* Add Expense Form */}
                    {isAddingSalary && (
                        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Add New Salary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-1">Month</label>
                                    <input
                                        type="text"
                                        value={newSalary.month}
                                        onChange={(e) => setNewSalary({ ...newSalary, month: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="e.g. Office Supplies"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1">Fixed (₹)</label>
                                    <input
                                        type="number"
                                        value={newSalary.fixed || ''}
                                        onChange={(e) => setNewSalary({ ...newSalary, fixed: Number.parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1">Incentive (₹)</label>
                                    <input
                                        type="number"
                                        value={newSalary.incentive || ''}
                                        onChange={(e) => setNewSalary({ ...newSalary, incentive: Number.parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={newExpense.date.toISOString().split('T')[0]}
                                        onChange={(e) => setNewExpense({ ...newExpense, date: new Date(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>

                                <div className="flex justify-end space-x-2 mt-4">
                                    <button onClick={() => setIsAddingSalary(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
                                        Cancel
                                    </button>
                                    <button onClick={handleAddSalary} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                        Release Salary
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Salary Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Date</th>
                                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Month</th>
                                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Fixed</th>
                                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Incentive</th>
                                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Total</th>
                                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">PaySlip</th>

                                </tr>
                            </thead>
                            <tbody>
                                {salaries.length > 0 ? (
                                    salaries.map((salary) => (
                                        <tr key={salary.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{salary.date.toLocaleDateString()}</td>
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{salary.month}</td>
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{salary.fixed}</td>
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{salary.incentive}</td>
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">{salary.fixed + salary.incentive}</td>
                                            <td className="px-4 py-3 border border-gray-300 text-gray-700">
                                                <Link to="/admin/hrms/payslip" >
                                                    <IconEye />
                                                </Link>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                            No expenses recorded yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewHrms;
