import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaBuilding } from 'react-icons/fa';

const View: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // Replace this with backend data later
    const dummyCompany = {
        companyName: 'XYZ',
    };

    return (
        <div className="p-6">
            {/* Breadcrumb */}
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark pb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/courier-companies" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Company
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        View Company
                    </Link>
                </li>
            </ol>

            {/* Card */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaBuilding className="text-primary" /> Company Details
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-xs uppercase text-gray-500 font-semibold mb-1 flex items-center gap-2">
                            <FaBuilding className="text-primary" />
                            Company Name
                        </div>
                        <div className="text-gray-800 font-medium">{dummyCompany.companyName}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default View;
