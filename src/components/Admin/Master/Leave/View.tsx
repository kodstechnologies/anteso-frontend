import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FaCalendarAlt,
    FaClipboardCheck,
    FaFileAlt,
    FaRegStickyNote,
    FaCheckCircle
} from 'react-icons/fa';

interface LeaveType {
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    status: string;
}

const LeaveView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [leave, setLeave] = useState<LeaveType | null>(null);

    useEffect(() => {
        // Replace with API call
        const dummyLeave: LeaveType = {
            startDate: '2025-05-31',
            endDate: '2025-06-09',
            leaveType: 'Sick Leave',
            reason: 'Fever and Cold',
            status: 'Approved',
        };

        setLeave(dummyLeave);

        // For backend use:
        /*
        axios.get(`/api/leaves/${id}`)
          .then(res => setLeave(res.data))
          .catch(err => console.error(err));
        */
    }, [id]);

    if (!leave) return <div className="p-6 text-gray-600">Loading...</div>;

    return (
        <div className="p-6">
            <ol className="flex text-gray-500 font-semibold text-sm pb-4">
                <li>
                    <Link to="/" className="hover:text-primary">Dashboard</Link>
                </li>
                <li className="mx-2">/</li>
                <li>
                    <Link to="/admin/leave" className="hover:text-primary">Leave</Link>
                </li>
                <li className="mx-2">/</li>
                <li className="text-primary">View</li>
            </ol>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaClipboardCheck className="text-primary" /> Leave Details
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <Detail label="Start Date" value={leave.startDate} icon={<FaCalendarAlt />} />
                    <Detail label="End Date" value={leave.endDate} icon={<FaCalendarAlt />} />
                    <Detail label="Leave Type" value={leave.leaveType} icon={<FaFileAlt />} />
                    <Detail label="Reason" value={leave.reason} icon={<FaRegStickyNote />} />
                    <Detail label="Status" value={leave.status} icon={<FaCheckCircle />} />
                </div>
            </div>
        </div>
    );
};

interface DetailProps {
    label: string;
    value: string;
    icon?: React.ReactNode;
}

const Detail: React.FC<DetailProps> = ({ label, value, icon }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="text-xs uppercase text-gray-500 font-semibold mb-1 flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            {label}
        </div>
        <div className="text-gray-800 font-medium">{value}</div>
    </div>
);

export default LeaveView;
