import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FaIndustry,
    FaMapMarkerAlt,
    FaCity,
    FaFlag,
    FaHashtag,
    FaNetworkWired,
    FaRegCalendarCheck,
    FaVials,
    FaCogs,
    FaRupeeSign,
} from 'react-icons/fa';
import { getManufacturerById } from '../../../../api';

interface QATest {
    label: string;
    value: string;
    price: number;
}

/* ----------  API shape (exact) ---------- */
interface ApiService {
    serviceName: string;
    amount: number;
    _id: string;
}
interface ApiManufacturer {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    branch: string;
    mouValidity: string;               // ISO string
    qaTests: any[];
    services: ApiService[];
    travelCost: 'Actual Cost' | 'Fixed Cost';
    cost?: number;                     // present only when travelCost === 'Fixed Cost'
    // any other fields you may receive (createdAt, email, …) are ignored for UI
}

/* ----------  UI shape ---------- */
interface ManufactureType {
    manufactureName: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    branch: string;
    mouValidity: string;               // "YYYY-MM-DD"
    qaTests: QATest[];
    services: ApiService[];
    travel: 'actual' | 'fixed';
    fixedCost?: number;
}

const ManufacturerView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [manufacture, setManufacture] = useState<ManufactureType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchManufacturer = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await getManufacturerById(id);
                const data: ApiManufacturer = res.data.data;   // <-- exact API payload

                const mapped: ManufactureType = {
                    manufactureName: data.name ?? '-',
                    address: data.address ?? '-',
                    city: data.city ?? '-',
                    state: data.state ?? '-',
                    pinCode: data.pincode ?? '-',
                    branch: data.branch ?? '-',
                    mouValidity: data.mouValidity?.split('T')[0] ?? '-',
                    qaTests:
                        data.qaTests?.map((t: any) => ({
                            label: t.testName ?? '-',
                            value: (t.testName ?? '')
                                .toUpperCase()
                                .replace(/\s+/g, '_'),
                            price: t.price ?? 0,
                        })) ?? [],
                    services: data.services ?? [],
                    travel: data.travelCost === 'Actual Cost' ? 'actual' : 'fixed',
                    fixedCost:
                        data.travelCost === 'Fixed Cost' ? data.cost : undefined,
                };

                setManufacture(mapped);
                setError(null);
            } catch (err: any) {
                console.error('Failed to fetch manufacturer:', err);
                setError(err.message || 'Failed to fetch manufacturer');
            } finally {
                setLoading(false);
            }
        };

        fetchManufacturer();
    }, [id]);

    if (loading) return <div className="p-6 text-gray-600">Loading...</div>;
    if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
    if (!manufacture)
        return <div className="p-6 text-gray-600">No Manufacturer Found</div>;

    return (
        <div className="p-6">
            {/* Breadcrumbs */}
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark pb-4">
                <li>
                    <Link
                        to="/"
                        className="hover:text-gray-500/70 dark:hover:text-white-dark/70"
                    >
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link
                        to="/admin/manufacture"
                        className="hover:text-gray-500/70 dark:hover:text-white-dark/70"
                    >
                        Manufacture
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    View Manufacture
                </li>
            </ol>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaIndustry className="text-primary" /> Manufacturer Details
                </h1>

                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                    <Detail label="Name" value={manufacture.manufactureName} icon={<FaIndustry />} />
                    <Detail label="Address" value={manufacture.address} icon={<FaMapMarkerAlt />} />
                    <Detail label="City" value={manufacture.city} icon={<FaCity />} />
                    <Detail label="State" value={manufacture.state} icon={<FaFlag />} />
                    <Detail label="Pin Code" value={manufacture.pinCode} icon={<FaHashtag />} />
                    <Detail label="Branch" value={manufacture.branch} icon={<FaNetworkWired />} />
                    <Detail
                        label="MOU Validity"
                        value={manufacture.mouValidity}
                        icon={<FaRegCalendarCheck />}
                    />
                </div>

                {/* QA Tests */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaVials className="text-primary" /> QA Tests
                    </h2>
                    {manufacture.qaTests.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                            {manufacture.qaTests.map((test) => (
                                <Detail
                                    key={test.value}
                                    label={test.label}
                                    value={`₹ ${test.price}`}
                                    icon={<FaVials />}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">-</p>
                    )}
                </div>

                {/* Services + Amount */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaCogs className="text-primary" /> Services
                    </h2>

                    {manufacture.services.length ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Service
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {manufacture.services.map((s) => (
                                        <tr key={s._id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                                                {s.serviceName}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                                                ₹ {s.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">-</p>
                    )}
                </div>

                {/* Travel Cost */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaRupeeSign className="text-primary" /> Travel Cost Type
                    </h2>
                    <p className="text-gray-600">
                        {manufacture.travel === 'actual'
                            ? 'Actual Cost'
                            : `Fixed Cost ₹ ${manufacture.fixedCost ?? '-'}`}
                    </p>
                </div>
            </div>
        </div>
    );
};

/* ----------  Re-usable Detail Component ---------- */
interface DetailProps {
    label: string;
    value: string | number;
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

export default ManufacturerView;