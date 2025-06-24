import React from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import AnimateHeight from 'react-animate-height';
import { useState } from 'react';
import IconCaretDown from '../../Icon/IconCaretDown';

// Define interfaces
interface OptionType {
    value: string;
    label: string;
}

// Constants
const employeeOptions: OptionType[] = [
    { value: 'Employee 1', label: 'Employee 1' },
    { value: 'Employee 2', label: 'Employee 2' },
    { value: 'Employee 3', label: 'Employee 3' },
    { value: 'Employee 4', label: 'Employee 4' },
];
const View = () => {
    return (
        <div>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark pb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/orders" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Orders
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        View
                    </Link>
                </li>
            </ol>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Enquiry Details</h1>
            {/* basic details */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h5 className="text-lg font-bold text-gray-800 mb-6">Basic Details</h5>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <span className="font-semibold text-gray-700">Hospital Name:</span>
                            <p className="text-gray-600 mt-1">Apollo Hospital</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Address:</span>
                            <p className="text-gray-600 mt-1">Xyz, sector-34, Delhi, India</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">City:</span>
                            <p className="text-gray-600 mt-1">Delhi</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">State:</span>
                            <p className="text-gray-600 mt-1">Delhi</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Pin Code:</span>
                            <p className="text-gray-600 mt-1">740911</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Contact Person Name:</span>
                            <p className="text-gray-600 mt-1">Ajith Mahanto</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Email Address:</span>
                            <p className="text-gray-600 mt-1">Ajith@gmail.com</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Contact Number:</span>
                            <p className="text-gray-600 mt-1">7402324961</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Designation:</span>
                            <p className="text-gray-600 mt-1">Managing Director</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Service details */}
            <div className="bg-white p-6 rounded-lg shadow-lg mt-5">
                <h5 className="text-lg font-bold text-gray-800 mb-6">Service Details</h5>
                <div className="flex">
                    <div className="basis-2/3">
                        <div className="bg-white p-6 rounded-lg shadow-lg border-2 ">
                            <div className="space-y-4 mb-2">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <span className="font-semibold text-gray-700">Machine Type:</span>
                                        <p className="text-gray-600 mt-1">CT Scan</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Equipment/Document No.:</span>
                                        <p className="text-gray-600 mt-1">1</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Type Of Work:</span>
                                        <p className="text-gray-600 mt-1"> License for Operation</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-lg border-2 ">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <span className="font-semibold text-gray-700">Machine Type:</span>
                                        <p className="text-gray-600 mt-1">CT Scan</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Equipment/Document No.:</span>
                                        <p className="text-gray-600 mt-1">1</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-700">Type Of Work:</span>
                                        <p className="text-gray-600 mt-1"> License for Operation</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mx-auto">
                        <div className="flex">
                            <div className="relative before:absolute before:left-1/2 before:-translate-x-1/2 before:top-[15px] before:w-2.5 before:h-2.5 before:border-2 before:border-primary before:rounded-full after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[25px] after:-bottom-[15px] after:w-0 after:h-auto after:border-l-2 after:border-primary after:rounded-full"></div>
                            <div className="p-2.5 self-center ltr:ml-2.5 rtl:ltr:mr-2.5 rtl:ml-2.5">
                                <p className="text-[#3b3f5c] dark:text-white-light font-semibold text-[13px]">Enquired on</p>
                                <p className="text-white-dark text-xs font-bold self-center min-w-[100px]">10-06-2025 10AM</p>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="relative before:absolute before:left-1/2 before:-translate-x-1/2 before:top-[15px] before:w-2.5 before:h-2.5 before:border-2 before:border-secondary before:rounded-full after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[25px] after:-bottom-[15px] after:w-0 after:h-auto after:border-l-2 after:border-secondary after:rounded-full"></div>
                            <div className="p-2.5 self-center ltr:ml-2.5 rtl:ltr:mr-2.5 rtl:ml-2.5">
                                <p className="text-[#3b3f5c] dark:text-white-light font-semibold text-[13px]">Qutation sent</p>
                                <p className="text-white-dark text-xs font-bold self-center min-w-[100px]">10-06-2025 10AM</p>
                            </div>
                        </div>
                        <div className="flex">
                            <div className="relative before:absolute before:left-1/2 before:-translate-x-1/2 before:top-[15px] before:w-2.5 before:h-2.5 before:border-2 before:border-success before:rounded-full after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[25px] after:-bottom-[15px] after:w-0 after:h-auto after:border-l-2 after:border-success after:rounded-full"></div>
                            <div className="p-2.5 self-center ltr:ml-2.5 rtl:ltr:mr-2.5 rtl:ml-2.5">
                                <p className="text-[#3b3f5c] dark:text-white-light font-semibold text-[13px]">Approved</p>
                                <p className="text-white-dark text-xs font-bold self-center min-w-[100px]">10-06-2025 10AM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default View;
