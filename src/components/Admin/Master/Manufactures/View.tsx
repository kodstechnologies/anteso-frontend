import React from 'react';
import { Link, useParams } from 'react-router-dom';

// Dummy data — replace this with real API data using useEffect and useParams
const dummyManufacture = {
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
    travel: 'fixed', //

};

type ServiceKey = 'INSTITUTE_REGISTRATION' | 'PROCUREMENT' | 'LICENSE';

const serviceLabelMap: Record<ServiceKey, string> = {
    INSTITUTE_REGISTRATION: 'Institute Registration',
    PROCUREMENT: 'Procurement',
    LICENSE: 'License',
};


const View = () => {
    const { id } = useParams(); // optional for future dynamic fetch

    return (
        <div>
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

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Manufacturer Details</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-[15px]">
                    <div><span className="font-semibold text-gray-700">Name:</span> <p>{dummyManufacture.manufactureName}</p></div>
                    <div><span className="font-semibold text-gray-700">Address:</span> <p>{dummyManufacture.address}</p></div>
                    <div><span className="font-semibold text-gray-700">City:</span> <p>{dummyManufacture.city}</p></div>
                    <div><span className="font-semibold text-gray-700">State:</span> <p>{dummyManufacture.state}</p></div>
                    <div><span className="font-semibold text-gray-700">Pin Code:</span> <p>{dummyManufacture.pinCode}</p></div>
                    <div><span className="font-semibold text-gray-700">Branch:</span> <p>{dummyManufacture.branch}</p></div>
                    <div><span className="font-semibold text-gray-700">MOU Validity:</span> <p>{dummyManufacture.mouValidity}</p></div>
                </div>

                <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">QA Tests</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {dummyManufacture.qaTests.map((test) => (
                            <div key={test.value}>
                                <span className="font-semibold text-gray-700">{test.label}:</span>
                                <p className="text-gray-600 mt-1">₹ {test.price}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Services Section */}
                <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Services</h2>
                    <ul className="list-disc list-inside text-gray-600">
                        {dummyManufacture.services.map((s) => (
                            <li key={s}>{serviceLabelMap[s as ServiceKey] || s}</li>
                        ))}
                    </ul>
                </div>

                {/* Travel Cost */}
                <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Travel Cost Type</h2>
                    <p className="text-gray-600">{dummyManufacture.travel === 'actual' ? 'Actual Cost' : 'Fixed Cost'}</p>
                </div>
            </div>
        </div>
    );
};

export default View;
