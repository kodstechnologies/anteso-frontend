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

interface QATest {
    label: string;
    value: string;
    price: number;
}

type ServiceKey = 'INSTITUTE_REGISTRATION' | 'PROCUREMENT' | 'LICENSE';

interface ManufactureType {
    manufactureName: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    branch: string;
    mouValidity: string;
    qaTests: QATest[];
    services: ServiceKey[];
    travel: 'actual' | 'fixed';
}

const serviceLabelMap: Record<ServiceKey, string> = {
    INSTITUTE_REGISTRATION: 'Institute Registration',
    PROCUREMENT: 'Procurement',
    LICENSE: 'License',
};

const ManufacturerView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [manufacture, setManufacture] = useState<ManufactureType | null>(null);

    useEffect(() => {
        const dummy: ManufactureType = {
            manufactureName: 'XRay Corp Ltd',
            address: '45 Industrial Estate, Sector 12',
            city: 'Bangalore',
            state: 'Karnataka',
            pinCode: '560001',
            branch: 'South Zone',
            mouValidity: '2026-01-01',
            qaTests: [
                { label: 'FIXED X RAY', value: 'FIXED_X_RAY', price: 3500 },
                { label: 'C ARM', value: 'C_ARM', price: 3000 },
                { label: 'TATKAL QA', value: 'TATKAL_QA', price: 5000 },
            ],
            services: ['INSTITUTE_REGISTRATION', 'LICENSE'],
            travel: 'fixed',
        };

        setManufacture(dummy);

        // Replace with axios.get(`/api/manufacturers/${id}`) when backend is ready
    }, [id]);

    if (!manufacture) return <div className="p-6 text-gray-600">Loading...</div>;

    return (
        <div className="p-6">
            {/* Breadcrumbs */}
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark pb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/manufacture" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Manufacture
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        View Manufacture
                    </Link>
                </li>
            </ol>


            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaIndustry className="text-primary" /> Manufacturer Details
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                    <Detail label="Name" value={manufacture.manufactureName} icon={<FaIndustry />} />
                    <Detail label="Address" value={manufacture.address} icon={<FaMapMarkerAlt />} />
                    <Detail label="City" value={manufacture.city} icon={<FaCity />} />
                    <Detail label="State" value={manufacture.state} icon={<FaFlag />} />
                    <Detail label="Pin Code" value={manufacture.pinCode} icon={<FaHashtag />} />
                    <Detail label="Branch" value={manufacture.branch} icon={<FaNetworkWired />} />
                    <Detail label="MOU Validity" value={manufacture.mouValidity} icon={<FaRegCalendarCheck />} />
                </div>

                {/* QA Tests */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaVials className="text-primary" /> QA Tests
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                        {manufacture.qaTests.map((test) => (
                            <Detail key={test.value} label={test.label} value={`₹ ${test.price}`} icon={<FaVials />} />
                        ))}
                    </div>
                </div>

                {/* Services */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaCogs className="text-primary" /> Services
                    </h2>
                    <ul className="list-disc list-inside text-gray-600">
                        {manufacture.services.map((s) => (
                            <li key={s}>{serviceLabelMap[s]}</li>
                        ))}
                    </ul>
                </div>

                {/* Travel Cost */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaRupeeSign className="text-primary" /> Travel Cost Type
                    </h2>
                    <p className="text-gray-600">{manufacture.travel === 'actual' ? 'Actual Cost' : 'Fixed Cost'}</p>
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

export default ManufacturerView;
