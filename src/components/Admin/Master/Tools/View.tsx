import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FiTool, FiCalendar,
} from 'react-icons/fi';
import {
    FaIdCard, FaToolbox, FaFileContract, FaHashtag, FaRegCalendarCheck,
    FaCalendarAlt,
    FaUserTie, FaHistory
} from 'react-icons/fa';
import { HiCpuChip } from 'react-icons/hi2';
import axios from 'axios';
import { getByToolId } from '../../../../api';
import dayjs from 'dayjs';

interface ToolType {
    nomenclature: string;
    manufacture_date: string;
    model: string;
    SrNo: string;
    calibrationCertificateNo: string;
    calibrationValidTill: string;
    range: string;
    toolId: string;
    engineerName: string;
    issueDate: string;
    submitDate: string
}

const View: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    console.log("🚀 ~ View ~ id:", id)
    const [tool, setTool] = useState<ToolType | null>(null);

    useEffect(() => {
        const fetchTool = async () => {
            if (!id) return;

            try {
                const res = await getByToolId(id);
                console.log("✅ Tool fetched by ID:", res.data);

                if (res?.data) {
                    setTool(res.data);
                } else {
                    console.warn("⚠️ No tool data found");
                }
            } catch (error) {
                console.error("❌ Error fetching tool by ID:", error);
            }
        };

        fetchTool();
    }, [id]);


    if (!tool) return <div className="p-6 text-gray-600">Loading...</div>;

    return (
        <div className="p-6">
            {/* Breadcrumbs */}

            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/tools" className="text-primary">
                        Tools
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        View Tool
                    </Link>
                </li>
            </ol>
            <div className="bg-white rounded-xl shadow-xl p-8">
                <div className="mb-8 flex items-center gap-3">
                    <FiTool className="text-primary text-2xl" />
                    <h1 className="text-2xl font-bold text-gray-800">Tool Details</h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-700">
                    <Detail label="Tool ID" value={tool.toolId} icon={<FaIdCard />} />
                    <Detail label="Tool Name" value={tool.nomenclature
                    } icon={<FaToolbox />} />
                    <Detail label="Model" value={tool.model} icon={<HiCpuChip />} />
                    <Detail label="Serial No" value={tool.SrNo} icon={<FaHashtag />} />
                    <Detail label="Calibration Certificate No" value={tool.calibrationCertificateNo} icon={<FaFileContract />} />

                    <Detail
                        label="Calibration Valid Till"
                        value={dayjs(tool.calibrationValidTill).format('DD-MM-YYYY')}
                        icon={<FaRegCalendarCheck />}
                    />
                    <Detail
                        label="Manufacture Date"
                        value={dayjs(tool.manufacture_date).format('DD-MM-YYYY')}
                        icon={<FiCalendar />}
                    />
                    <Detail label="Range" value={tool.range} icon={<FiTool />} />
                    {/* <Detail label="Engineer Name" value={tool.engineerName} icon={<FaUserTie className="text-primary" />} />

                    <Detail label="Issue Date " value={tool.issueDate} icon={<FaCalendarAlt />} />

                    <Detail label="Submit Date" value={tool.submitDate} icon={<FaCalendarAlt />} /> */}


                </div>
            </div>
            <div className="bg-white rounded-xl shadow-xl p-8 mt-10">
                <div className="mb-8 flex items-center gap-3">
                    <FaHistory className="text-primary text-2xl" />
                    <h1 className="text-2xl font-bold text-gray-800">History</h1>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-700">
                    <Detail label="Engineer Name" value="Ramesh Rao" icon={<FaUserTie className="text-primary" />} />
                    <Detail label="Issue Date " value="20/02/2024" icon={<FaCalendarAlt />} />
                    <Detail label="Submit Date" value="09/03/2024" icon={<FaCalendarAlt />} />
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
