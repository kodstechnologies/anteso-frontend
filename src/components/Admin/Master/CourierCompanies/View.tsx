import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaBuilding } from 'react-icons/fa';
import { getCourierById } from '../../../../api/index'; // adjust the path as needed

interface CourierCompany {
    courierCompanyName: string;
    trackingId?: string;
    trackingUrl?: string;
    status: 'Active' | 'Inactive';
}

const View: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [company, setCompany] = useState<CourierCompany | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                if (id) {
                    const data = await getCourierById(id);
                    setCompany(data?.data); // Ensure your backend returns data in { data: {...} } structure
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCompany();
    }, [id]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

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
                    <span className="text-gray-700 dark:text-white">View Company</span>
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
                        <div className="text-gray-800 font-medium">{company?.courierCompanyName}</div>
                    </div>

                    {company?.trackingId && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Tracking ID</div>
                            <div className="text-gray-800 font-medium">{company.trackingId}</div>
                        </div>
                    )}

                    {company?.trackingUrl && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Tracking URL</div>
                            <a href={company.trackingUrl} className="text-primary font-medium" target="_blank" rel="noopener noreferrer">
                                {company.trackingUrl}
                            </a>
                        </div>
                    )}

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Status</div>
                        <div className={`font-medium ${company?.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                            {company?.status}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default View;
