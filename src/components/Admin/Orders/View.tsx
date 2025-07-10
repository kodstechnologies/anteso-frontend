import React from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import AnimateHeight from 'react-animate-height';
import { useState } from 'react';
import IconCaretDown from '../../Icon/IconCaretDown';
import Breadcrumb, { BreadcrumbItem } from '../../common/Breadcrumb';
import IconHome from '../../Icon/IconHome';
import IconBox from '../../Icon/IconBox';
import IconBook from '../../Icon/IconBook';
import { paymentdata } from '../../../data'; // or fetch via API
import PyamentPNG from '../../../../public/assets/images/payment.png'
import FadeInModal from '../../../components/common/FadeInModal'; // adjust path if needed
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import IconEye from '../../Icon/IconEye';



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
    const [active, setActive] = useState<string>('1');
    const [isAddingCourier, setIsAddingCourier] = useState(false);

    const togglePara = (value: string) => {
        setActive((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };
    const [selectedRow, setSelectedRow] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Orders', to: '/admin/orders', icon: <IconBox /> },
        { label: 'View', icon: <IconBook /> },
    ];
    return (
        <div>
            <Breadcrumb items={breadcrumbItems} />

            {/* <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Details</h1> */}
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
                        <div>
                            <span className="font-semibold text-gray-700">SRF NO:</span>
                            <p className="text-gray-600 mt-1">ABSRF/2025/05/001</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">PROC NO/PO NO:</span>
                            <p className="text-gray-600 mt-1">PROC/2025/05/001</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">PROC Expiry Date:</span>
                            <p className="text-gray-600 mt-1">2025-05-01</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Type:</span>
                            <p className="text-gray-600 mt-1">Customer</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Party Code/ Sys ID:</span>
                            <p className="text-gray-600 mt-1">SY-1234</p>
                        </div>
                        {/* <div>
                            <span className="font-semibold text-gray-700">Type:</span>
                            <p className="text-gray-600 mt-1">Customer</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Type:</span>
                            <p className="text-gray-600 mt-1">Customer</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Type:</span>
                            <p className="text-gray-600 mt-1">Customer</p>
                        </div> */}
                        <div>
                            <span className="font-semibold text-gray-700">No of days taken:</span>
                            <p className="text-gray-600 mt-1">25</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Service details */}
            <div className="bg-white p-6 rounded-lg shadow-lg mt-5">
                <h5 className="text-lg font-bold text-gray-800 mb-6">Service Details</h5>
                <div className="bg-white p-6 rounded-lg shadow-lg border-2 ">
                    <div className="space-y-4 mb-2">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                            <div>
                                <span className="font-semibold text-gray-700">Status:</span>
                                <p className="text-gray-600 mt-1">
                                    <span className="badge bg-primary">Pending</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                            <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                                <table className="min-w-full table-auto">
                                    <thead className="bg-gray-200 text-gray-700 text-sm font-semibold">
                                        <tr>
                                            <th className="px-6 py-3 border-b">Service Name</th>
                                            <th className="px-6 py-3 border-b">Employee Name</th>
                                            <th className="px-6 py-3 border-b">Status</th>
                                            <th className="px-6 py-3 border-b">Upload File</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white text-sm">
                                        {['QA Test', 'Elora', 'QA Test Report'].map((service, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 border-b font-medium text-gray-800">{service}</td>
                                                <td className="px-6 py-4 border-b">
                                                    <select
                                                        className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                                                        defaultValue=""
                                                        onChange={(e) => console.log(`${service} status:`, e.target.value)}
                                                    >
                                                        <option value="">Select Employee</option>
                                                        <option value="Employee 1">Employee 1</option>
                                                        <option value="Employee 2">Employee 2</option>
                                                        <option value="Employee 3">Employee 3</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <select
                                                        className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                                                        defaultValue=""
                                                        onChange={(e) => console.log(`${service} status:`, e.target.value)}
                                                    >
                                                        <option value="">Select status</option>
                                                        <option value="Pending">Pending</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Paid">Paid</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="file"
                                                            className="form-input w-full px-2 py-1 border border-gray-300 rounded-md file:bg-gray-100 file:border-0 file:mr-2 file:py-1 file:px-3 file:rounded-l-md"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    console.log(`${service} file uploaded:`, file.name);
                                                                }
                                                            }}
                                                        />
                                                        <button type="button" className="btn btn-primary px-4 py-1 text-sm rounded-md">
                                                            Upload
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg border-2 ">
                    <div className="space-y-4 mb-2">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                            <div>
                                <span className="font-semibold text-gray-700">Status:</span>
                                <p className="text-gray-600 mt-1">
                                    <span className="badge bg-primary">Pending</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* <div className="space-y-4">
                        <h5 className="text-md font-bold text-gray-800 mt-4">Assign Employee</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700">Employee</label>
                                <Select isMulti options={employeeOptions} className="basic-multi-select" classNamePrefix="select" isSearchable={true} />
                            </div>
                            <div className="flex items-end">
                                {' '}
                                <button type="button" className="btn btn-primary">
                                    Assign
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="mb-5">
                                <div className="space-y-2 font-semibold">
                                    <div className="border border-[#d3d3d3] rounded dark:border-[#1b2e4b]">
                                        <button type="button" className={`p-4 w-full flex items-center text-white-dark dark:bg-[#1b2e4b] !text-primary`} onClick={() => togglePara('2')}>
                                            Work timeline
                                            <div className={`ltr:ml-auto rtl:mr-auto ${active === '2' ? 'rotate-180' : ''}`}>
                                                <IconCaretDown />
                                            </div>
                                        </button>
                                        <div>
                                            <AnimateHeight duration={300} height={active === '2' ? 'auto' : 0}>
                                                <div className="space-y-2 p-4 text-white-dark text-[13px] border-t border-[#d3d3d3] dark:border-[#1b2e4b]">
                                                    <div className="mb-5">
                                                        <div className="max-w-[900px] mx-auto">
                                                            <div className="flex">
                                                                <div className="relative before:absolute before:left-1/2 before:-translate-x-1/2 before:top-[15px] before:w-2.5 before:h-2.5 before:border-2 before:border-primary before:rounded-full after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[25px] after:-bottom-[15px] after:w-0 after:h-auto after:border-l-2 after:border-primary after:rounded-full"></div>
                                                                <div className="p-2.5 self-center ltr:ml-2.5 rtl:ltr:mr-2.5 rtl:ml-2.5">
                                                                    <p className="text-[#3b3f5c] dark:text-white-light font-semibold text-[13px]">QA Test</p>
                                                                    <p className="text-white-dark text-xs font-bold self-center min-w-[100px]">10-06-2025 10AM</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex">
                                                                <div className="relative before:absolute before:left-1/2 before:-translate-x-1/2 before:top-[15px] before:w-2.5 before:h-2.5 before:border-2 before:border-secondary before:rounded-full after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[25px] after:-bottom-[15px] after:w-0 after:h-auto after:border-l-2 after:border-secondary after:rounded-full"></div>
                                                                <div className="p-2.5 self-center ltr:ml-2.5 rtl:ltr:mr-2.5 rtl:ml-2.5">
                                                                    <p className="text-[#3b3f5c] dark:text-white-light font-semibold text-[13px]">Elora</p>
                                                                    <p className="text-white-dark text-xs font-bold self-center min-w-[100px]">10-06-2025 10AM</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex">
                                                                <div className="relative before:absolute before:left-1/2 before:-translate-x-1/2 before:top-[15px] before:w-2.5 before:h-2.5 before:border-2 before:border-success before:rounded-full after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[25px] after:-bottom-[15px] after:w-0 after:h-auto after:border-l-2 after:border-success after:rounded-full"></div>
                                                                <div className="p-2.5 self-center ltr:ml-2.5 rtl:ltr:mr-2.5 rtl:ml-2.5">
                                                                    <p className="text-[#3b3f5c] dark:text-white-light font-semibold text-[13px]">QA Report</p>
                                                                    <p className="text-white-dark text-xs font-bold self-center min-w-[100px]">10-06-2025 10AM</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex">
                                                                <div className="relative before:absolute before:left-1/2 before:-translate-x-1/2 before:top-[15px] before:w-2.5 before:h-2.5 before:border-2 before:border-danger before:rounded-full after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[25px] after:-bottom-[15px] after:w-0 after:h-auto after:border-l-2 after:border-danger after:rounded-full"></div>
                                                                <div className="p-2.5 self-center ltr:ml-2.5 rtl:ltr:mr-2.5 rtl:ml-2.5">
                                                                    <p className="text-[#3b3f5c] dark:text-white-light font-semibold text-[13px]">Invoice</p>
                                                                    <p className="text-white-dark text-xs font-bold self-center min-w-[100px]">10-06-2025 10AM</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AnimateHeight>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                            <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                                <table className="min-w-full table-auto">
                                    <thead className="bg-gray-200 text-gray-700 text-sm font-semibold">
                                        <tr>
                                            <th className="px-6 py-3 border-b">Service Name</th>
                                            <th className="px-6 py-3 border-b">Employee Name</th>
                                            <th className="px-6 py-3 border-b">Status</th>
                                            <th className="px-6 py-3 border-b">Upload File</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white text-sm">
                                        {['QA Test', 'Elora', 'QA test Report'].map((service, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 border-b font-medium text-gray-800">{service}</td>
                                                <td className="px-6 py-4 border-b">
                                                    <select
                                                        className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                                                        defaultValue=""
                                                        onChange={(e) => console.log(`${service} status:`, e.target.value)}
                                                    >
                                                        <option value="">Select Employee</option>
                                                        <option value="Employee 1">Employee 1</option>
                                                        <option value="Employee 2">Employee 2</option>
                                                        <option value="Employee 3">Employee 3</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <select
                                                        className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200"
                                                        defaultValue=""
                                                        onChange={(e) => console.log(`${service} status:`, e.target.value)}
                                                    >
                                                        <option value="">Select status</option>
                                                        <option value="Pending">Pending</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Paid">Paid</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="file"
                                                            className="form-input w-full px-2 py-1 border border-gray-300 rounded-md file:bg-gray-100 file:border-0 file:mr-2 file:py-1 file:px-3 file:rounded-l-md"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    console.log(`${service} file uploaded:`, file.name);
                                                                }
                                                            }}
                                                        />
                                                        <button type="button" className="btn btn-primary px-4 py-1 text-sm rounded-md">
                                                            Upload
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg mt-5">
                <div className="flex justify-between items-center mb-6">
                    <h5 className="text-lg font-bold text-gray-800 mb-6">Courier Details</h5>
                    <button onClick={() => setIsAddingCourier(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        Add Courier
                    </button>
                </div>

                {isAddingCourier && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Add New Salary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 mb-1">Company Name</label>
                                <input type="text" className="w-full p-2 border border-gray-300 rounded" placeholder="e.g. XYZ" />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Tracking Id</label>
                                <input type="text" className="w-full p-2 border border-gray-300 rounded" placeholder="e.g. XYZ" />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">URL</label>
                                <input type="text" className="w-full p-2 border border-gray-300 rounded" placeholder="e.g. XYZ" />
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button onClick={() => setIsAddingCourier(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
                                    Cancel
                                </button>
                                <button onClick={() => setIsAddingCourier(false)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <span className="font-semibold text-gray-700">Company Name:</span>
                            <p className="text-gray-600 mt-1">DTDC</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Tracking Id:</span>
                            <p className="text-gray-600 mt-1">rr3rd3ed2thyt</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-700">Url:</span>
                            <p className="text-gray-600 mt-1">
                                <a href="http://" target="_blank" rel="noopener noreferrer">
                                    View
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg mt-5">
                <div className="flex justify-between items-center mb-6">
                    <h5 className="text-lg font-bold text-gray-800 mb-6">Expense and Accounts Details</h5>
                    {/* <button onClick={() => setIsAddingCourier(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        Add Courier
                    </button> */}
                </div>

                {/* {isAddingCourier && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Add New Salary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 mb-1">Company Name</label>
                                <input type="text" className="w-full p-2 border border-gray-300 rounded" placeholder="e.g. XYZ" />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">Tracking Id</label>
                                <input type="text" className="w-full p-2 border border-gray-300 rounded" placeholder="e.g. XYZ" />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1">URL</label>
                                <input type="text" className="w-full p-2 border border-gray-300 rounded" placeholder="e.g. XYZ" />
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button onClick={() => setIsAddingCourier(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
                                    Cancel
                                </button>
                                <button onClick={() => setIsAddingCourier(false)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )} */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Single Payment Card - Repeat this block for dynamic data */}

                        <div className="bg-white rounded-lg shadow-md p-4 space-y-4 border">
                            <div>
                                <span className="font-semibold text-gray-700">SRF No.:</span>
                                <p className="text-gray-600 mt-1">ABSRF/2025/05/001 - Apollo Hospital</p>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-700">Total Amount:</span>
                                <p className="text-gray-600 mt-1">₹50,000</p>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-700">Payment Amount:</span>
                                <p className="text-gray-600 mt-1">₹20,000</p>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-700">Payment Type:</span>
                                <p className="text-gray-600 mt-1">Advanced</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Payment Screenshot:</span>
                                    <button onClick={() => setOpenModal(true)} className="hover:text-primary">
                                        <IconEye className="w-4.5 h-4.5" />
                                    </button>
                                </div>
                                <p className="text-gray-600 mt-1 mb-2">Attached</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4 space-y-4 border">
                            <div>
                                <span className="font-semibold text-gray-700">SRF No.:</span>
                                <p className="text-gray-600 mt-1">ABSRF/2025/04/001 - Fortis Healthcare</p>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-700">Total Amount:</span>
                                <p className="text-gray-600 mt-1">₹50,000</p>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-700">Payment Amount:</span>
                                <p className="text-gray-600 mt-1">₹20,000</p>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-700">Payment Type:</span>
                                <p className="text-gray-600 mt-1">Advanced</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Payment Screenshot:</span>
                                    <button onClick={() => setOpenModal(true)} className="hover:text-primary">
                                        <IconEye className="w-4.5 h-4.5" />
                                    </button>
                                </div>
                                <p className="text-gray-600 mt-1 mb-2">Attached</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4 space-y-4 border">
                            <div>
                                <span className="font-semibold text-gray-700">SRF No.:</span>
                                <p className="text-gray-600 mt-1">ABSRF/2025/03/002 - MaxHealth Hospital</p>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-700">Total Amount:</span>
                                <p className="text-gray-600 mt-1">₹50,000</p>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-700">Payment Amount:</span>
                                <p className="text-gray-600 mt-1">₹20,000</p>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-700">Payment Type:</span>
                                <p className="text-gray-600 mt-1">Advanced</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Payment Screenshot:</span>
                                    <button onClick={() => setOpenModal(true)} className="hover:text-primary">
                                        <IconEye className="w-4.5 h-4.5" />                                    </button>
                                </div>
                                <p className="text-gray-600 mt-1 mb-2">Attached</p>
                            </div>
                        </div>

                    </div>

                    <FadeInModal open={openModal} onClose={() => setOpenModal(false)} title="Payment Screenshot">
                        <img
                            src={PyamentPNG}
                            alt="Payment Screenshot"
                            className="w-full rounded-lg shadow-md object-contain h-80"
                        />
                    </FadeInModal>


                    {/* Modal */}
                    <FadeInModal open={openModal} onClose={() => setOpenModal(false)} title="Payment Screenshot">
                        <img
                            src={PyamentPNG}
                            alt="Payment Screenshot"
                            className="w-full rounded-lg shadow-md object-contain h-80 "
                        />
                    </FadeInModal>
                </div>
            </div>
        </div>
    );
};

export default View;
