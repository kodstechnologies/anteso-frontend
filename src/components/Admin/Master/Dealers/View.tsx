import React from 'react';
import { Link, useParams } from 'react-router-dom';

// Dummy data - Replace this with fetched data using useEffect and useParams
const dummyDealer = {
    dealersName: 'Radiant Diagnostics',
    address: '123, Main Street, MG Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400001',
    region: 'West',
    mouValidity: '2025-12-31',
    qaTests: [
        { label: 'FIXED X RAY', value: 'FIXED_X_RAY', price: 3500 },
        { label: 'C ARM', value: 'C_ARM', price: 3000 },
    ],
    services: ['INSTITUTE_REGISTRATION', 'LICENSE'],
    travel: 1000,
    actual: 2000,
    fixed: 1500,
};

const serviceLabelMap = {
    INSTITUTE_REGISTRATION: 'Institute Registration',
    PROCUREMENT: 'Procurement',
    LICENSE: 'License',
};

const View = () => {
    const { id } = useParams();

    return (
        <div>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark pb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/dealer" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dealer
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        View Dealer
                    </Link>
                </li>
            </ol>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Dealer Details</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[15px]">
                    <div>
                        <span className="font-semibold text-gray-700">Dealer Name:</span>
                        <p className="text-gray-600 mt-1">{dummyDealer.dealersName}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Address:</span>
                        <p className="text-gray-600 mt-1">{dummyDealer.address}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">City:</span>
                        <p className="text-gray-600 mt-1">{dummyDealer.city}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">State:</span>
                        <p className="text-gray-600 mt-1">{dummyDealer.state}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Pin Code:</span>
                        <p className="text-gray-600 mt-1">{dummyDealer.pinCode}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Region:</span>
                        <p className="text-gray-600 mt-1">{dummyDealer.region}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">MOU Validity:</span>
                        <p className="text-gray-600 mt-1">{dummyDealer.mouValidity}</p>
                    </div>
                </div>

                {/* QA Tests Section */}
                <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">QA Tests</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dummyDealer.qaTests.map((test) => (
                            <div key={test.value}>
                                <span className="font-semibold text-gray-700">{test.label}:</span>
                                <p className="text-gray-600 mt-1">₹ {test.price}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Services Section */}
                {/* <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Services</h2>
                    <ul className="list-disc list-inside text-gray-600">
                        {dummyDealer.services.map((s) => (
                            <li key={s}>{serviceLabelMap[s]}</li>
                        ))}
                    </ul>
                </div> */}

                {/* Costs */}
                {/* <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[15px]">
                    <div>
                        <span className="font-semibold text-gray-700">Travel Cost:</span>
                        <p className="text-gray-600 mt-1">₹ {dummyDealer.travel}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Actual Cost:</span>
                        <p className="text-gray-600 mt-1">₹ {dummyDealer.actual}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Fixed Cost:</span>
                        <p className="text-gray-600 mt-1">₹ {dummyDealer.fixed}</p>
                    </div>
                </div> */}
            </div>
        </div>
    );
};

export default View;
