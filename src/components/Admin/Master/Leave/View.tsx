import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FaCalendarAlt,
    FaClipboardCheck,
    FaFileAlt,
    FaRegStickyNote,
    FaCheckCircle
} from 'react-icons/fa';
import { getLeaveById } from '../../../../api/index'; // adjust path as needed

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeave = async () => {
            try {
                if (id) {
                    const data = await getLeaveById(id);
                    console.log("🚀 ~ fetchLeave ~ data:", data)
                    setLeave(data);
                }
            } catch (err: any) {
                setError(err.message || "Failed to load leave data.");
            } finally {
                setLoading(false);
            }
        };

        fetchLeave();
    }, [id]);

    const formatDate = (isoDate: string) => {
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };
    if (loading) return <div className="p-6 text-gray-600">Loading...</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
    if (!leave) return <div className="p-6 text-gray-600">No leave data found.</div>;

    return (
        <div className="p-6">
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/leave" className="text-primary">
                        Leave
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        View Leave
                    </Link>
                </li>
            </ol>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaClipboardCheck className="text-primary" /> Leave Details
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <Detail label="Start Date" value={formatDate(leave.startDate)} icon={<FaCalendarAlt />} />
                    <Detail label="End Date" value={formatDate(leave.endDate)} icon={<FaCalendarAlt />} />
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
