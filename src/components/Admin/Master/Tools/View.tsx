import React from 'react';
import { Link, useParams } from 'react-router-dom';

const View = () => {
    const { id } = useParams();

    // Dummy data for demo (replace with fetched data if needed)
    const tool = {
        name: 'Digital Multimeter',
        manufactureDate: '2023-08-15',
        model: 'TX-200',
        srNo: 'FLK87V-001',
        calibrationCertificateNo: '2023-02-20',
        calibrationValidTill: '2024-08-15',
        range: '0-1000V	',
        toolID: 'T0001'
    };

    return (
        <div>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark pb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/tools" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Tools
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        View
                    </Link>
                </li>
            </ol>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Tool Details</h1>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="font-semibold text-gray-700">Tool Name:</span>
                            <p className="text-gray-600 mt-1">{tool.name}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Manufacture Date:</span>
                            <p className="text-gray-600 mt-1">{tool.manufactureDate}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Model:</span>
                            <p className="text-gray-600 mt-1">{tool.model}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Serial No:</span>
                            <p className="text-gray-600 mt-1">{tool.srNo}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Calibration Certificate No:</span>
                            <p className="text-gray-600 mt-1">{tool.calibrationCertificateNo}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Calibration Valid Till:</span>
                            <p className="text-gray-600 mt-1">{tool.calibrationValidTill}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Range:</span>
                            <p className="text-gray-600 mt-1">{tool.range}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Tool ID:</span>
                            <p className="text-gray-600 mt-1">{tool.toolID}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default View;
