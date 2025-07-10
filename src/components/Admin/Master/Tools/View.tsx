import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FiTool, FiCalendar,
} from 'react-icons/fi';
import {
    FaIdCard, FaToolbox, FaFileContract, FaHashtag, FaRegCalendarCheck,
} from 'react-icons/fa';
import { HiCpuChip } from 'react-icons/hi2';
import axios from 'axios';

interface ToolType {
    name: string;
    manufactureDate: string;
    model: string;
    srNo: string;
    calibrationCertificateNo: string;
    calibrationValidTill: string;
    range: string;
    toolID: string;
}

const View: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [tool, setTool] = useState<ToolType | null>(null);

    useEffect(() => {
        const dummyTool: ToolType = {
            name: 'Digital Multimeter',
            manufactureDate: '2023-08-15',
            model: 'TX-200',
            srNo: 'FLK87V-001',
            calibrationCertificateNo: '2023-02-20',
            calibrationValidTill: '2024-08-15',
            range: '0-1000V',
            toolID: 'T0001',
        };

        setTool(dummyTool);

        // Replace with API call
        /*
        axios.get(`/api/tools/${id}`)
          .then(response => {
            setTool(response.data);
          })
          .catch(error => {
            console.error("Error fetching tool:", error);
          });
        */
    }, [id]);

    if (!tool) return <div className="p-6 text-gray-600">Loading...</div>;

    return (
        <div className="p-6">
            {/* Breadcrumbs */}
            <ol className="flex text-gray-500 font-medium text-sm mb-6">
                <li><Link to="/" className="hover:text-primary">Dashboard</Link></li>
                <li className="mx-2">/</li>
                <li><Link to="/admin/tools" className="hover:text-primary">Tools</Link></li>
                <li className="mx-2">/</li>
                <li className="text-primary font-semibold">View</li>
            </ol>

            <div className="bg-white rounded-xl shadow-xl p-8">
                <div className="mb-8 flex items-center gap-3">
                    <FiTool className="text-primary text-2xl" />
                    <h1 className="text-2xl font-bold text-gray-800">Tool Details</h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-700">
                    <Detail label="Tool ID" value={tool.toolID} icon={<FaIdCard />} />
                    <Detail label="Tool Name" value={tool.name} icon={<FaToolbox />} />
                    <Detail label="Model" value={tool.model} icon={<HiCpuChip />} />
                    <Detail label="Serial No" value={tool.srNo} icon={<FaHashtag />} />
                    <Detail label="Calibration Certificate No" value={tool.calibrationCertificateNo} icon={<FaFileContract />} />
                    <Detail label="Calibration Valid Till" value={tool.calibrationValidTill} icon={<FaRegCalendarCheck />} />
                    <Detail label="Manufacture Date" value={tool.manufactureDate} icon={<FiCalendar />} />
                    <Detail label="Range" value={tool.range} icon={<FiTool />} />
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

export default View;
