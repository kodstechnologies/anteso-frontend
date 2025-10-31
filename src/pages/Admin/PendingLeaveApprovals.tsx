import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingLeaveApprovals } from '../../api'; // Adjust path
import { format } from 'date-fns';

interface Employee {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface LeaveRequest {
    _id: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    status: string;
    employee: Employee;
    createdAt: string;
}

const PendingLeaveApprovals: React.FC = () => {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPendingLeaves = async () => {
            try {
                setLoading(true);
                const response = await getPendingLeaveApprovals();
                setLeaves(response.data || []);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch pending leave approvals');
            } finally {
                setLoading(false);
            }
        };

        fetchPendingLeaves();
    }, []);

    const handleViewClick = (employeeId: string) => {
        navigate(`/admin/hrms/leave-management-view/${employeeId}`);
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'MMM dd, yyyy');
    };

    const getLeaveTypeColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'Sick Leave': 'bg-red-100 text-red-700 border-red-200',
            'Casual Leave': 'bg-blue-100 text-blue-700 border-blue-200',
            'Annual Leave': 'bg-green-100 text-green-700 border-green-200',
            'Maternity/Paternity': 'bg-purple-100 text-purple-700 border-purple-200',
            'Unpaid Leave': 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    // Loading Skeleton
    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Pending Leave Approvals</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
                            <div className="h-6 bg-gray-200 rounded w-32"></div>
                            <div className="h-4 bg-gray-200 rounded w-48"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-10 bg-gray-200 rounded mt-4"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Empty State
    if (leaves.length === 0) {
        return (
            <div className="p-6">
                <div className="text-center py-12 bg-gray-50 rounded-lg border">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-700">No pending leave approvals</p>
                    <p className="text-sm text-gray-500">All leave requests have been processed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Pending Leave Approvals</h2>
                <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                    {leaves.length} Pending
                </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {leaves.map((leave) => (
                    <div
                        key={leave._id}
                        className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                        {/* Card Header */}
                        <div className="p-4 border-b">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {leave.employee.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{leave.employee.email}</p>
                                </div>
                                <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getLeaveTypeColor(
                                        leave.leaveType
                                    )}`}
                                >
                                    {leave.leaveType}
                                </span>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>
                                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                                </span>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700">Reason:</p>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {leave.reason || 'No reason provided'}
                                </p>
                            </div>

                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Requested on {format(new Date(leave.createdAt), 'MMM dd, yyyy • hh:mm a')}
                            </p>
                        </div>

                        {/* Card Footer */}
                        <div className="p-4 pt-0">
                            <button
                                onClick={() => handleViewClick(leave.employee._id)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingLeaveApprovals;