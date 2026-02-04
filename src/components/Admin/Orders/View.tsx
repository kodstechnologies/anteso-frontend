import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import MachineImage from '../../../assets/machine.jpg'
import DymmyReport from '../../../../public/assets/dummy-report.jpg'
import ExpenseAndAccountDetails from './ExpenseAndAccountDetails';
import CourierDetails from './CourierDetails';
import AdditionalServices from './AdditionalServices';
import ServiceDetails from './ServiceDetails';
import { getBasicDetailsByOrderId, getPdfForAcceptQuotation, getWorkOrderCopy, updateBasicDetailsByOrderId } from '../../../api';
import ServiceDetails2 from './ServiceDetails2'
import ServicesCard from './ServiceDetails2';
import { toast } from 'react-toastify'; // optional – for nice notifications
import { PencilSquareIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
// Define interfaces
interface OptionType {
    value: string;
    label: string;
}
// interface HospitalDetails {
//     hospitalName: string;
//     fullAddress: string;
//     city: string;
//     district: string;
//     state: string;
//     pinCode: string;
//     contactPersonName: string;
//     emailAddress: string;
//     contactNumber: string;
//     designation: string;
// }
interface HospitalDetails {
    hospitalName: string;
    fullAddress: string;
    city: string;
    // district: string;
    state: string;
    pinCode: string;
    // branchName?: string;
    contactPersonName: string;
    emailAddress: string;
    contactNumber: string;
    designation: string;
}

// Constants
const employeeOptions: OptionType[] = [
    { value: 'Employee 1', label: 'Employee 1' },
    { value: 'Employee 2', label: 'Employee 2' },
    { value: 'Employee 3', label: 'Employee 3' },
    { value: 'Employee 4', label: 'Employee 4' },
];
const aditionalServices = [
    'INSTITUTE REGISTRATION', 'RSO REGISTRATION, NOMINATION & APPROVAL', 'DECOMMISSIONING, PRE OWNED PROCUREMENT, QA & LICENSE', 'PROCUREMENT', 'TLD BADGE', 'THYROID SHIELD', 'LEAD APRON', 'LEAD GLASS', 'LEAD SHEET']

const View = () => {
    const [active, setActive] = useState<string>('1');
    const [isAddingCourier, setIsAddingCourier] = useState(false);
    // const [details, setDetails] = useState<HospitalDetails | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string>(''); // ✅ state for PDF URL
    const [workOrderCopyUrl, setWorkOrderCopyUrl] = useState<string>('');
    const [formData, setFormData] = useState<Partial<HospitalDetails>>({});
    const [loading, setLoading] = useState(false);
    const togglePara = (value: string) => {
        setActive((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };
    const [selectedRow, setSelectedRow] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openMachineModal, setOpenMachineModal] = useState(false)
    const [openVerificationModal, setOpenVerificationModal] = useState(false)
    const { orderId } = useParams(); // Assuming you're using a dynamic route like /orders/:orderId
    // console.log("🚀 ~ View ~ orderId:", orderId)
    const [details, setDetails] = useState<HospitalDetails | null>(null);
    const [editMode, setEditMode] = useState(false);
    if (!orderId) {
        return <div className="text-gray-600 p-6">Order ID not found.</div>;
    }
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Orders', to: '/admin/orders', icon: <IconBox /> },
        { label: 'View', icon: <IconBook /> },
    ];
    useEffect(() => {
        const fetchData = async () => {
            if (!orderId) return;
            try {
                setLoading(true);
                const res = await getBasicDetailsByOrderId(orderId);
                setDetails(res.data);
                setFormData(res.data); // initialize form with current values
                // ... your PDF & WorkOrder fetch logic
                const resPdf = await getPdfForAcceptQuotation(orderId);
                setPdfUrl(resPdf.data.pdfUrl || '');
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("Failed to load order details");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [orderId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!orderId || !details) return;

        // Required fields check
        const requiredFields = [
            'hospitalName',
            'fullAddress',
            'city',
            'state',
            'pinCode',
            'contactPersonName',
            'emailAddress',
            'contactNumber',
        ];

        for (const field of requiredFields) {
            const value = formData[field as keyof HospitalDetails]?.trim() || '';
            if (!value) {
                toast.error(`Please fill ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return;
            }
        }

        // Extra format validation for pinCode and contactNumber
        const pinCode = formData.pinCode?.trim() || '';
        const contactNumber = formData.contactNumber?.trim() || '';

        if (pinCode && !/^\d{6}$/.test(pinCode)) {
            toast.error("PIN Code must be exactly 6 digits");
            return;
        }

        if (contactNumber && !/^\d{10}$/.test(contactNumber)) {
            toast.error("Contact Number must be exactly 10 digits");
            return;
        }

        // Optional: Email format check
        const email = formData.emailAddress?.trim() || '';
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            setLoading(true);
            const response = await updateBasicDetailsByOrderId(orderId, formData);

            // Update UI with server response
            setDetails(response.data);
            setFormData(response.data);
            setEditMode(false);
            toast.success("Basic details updated successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to update details");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData(details || {});
        setEditMode(false);
    };
    useEffect(() => {
        const fetchData = async () => {
            if (!orderId) return;

            try {
                const resDetails = await getBasicDetailsByOrderId(orderId);
                setDetails(resDetails.data);

                const resPdf = await getPdfForAcceptQuotation(orderId);
                setPdfUrl(resPdf.data.pdfUrl || '');

                const resWorkOrder = await getWorkOrderCopy(orderId);
                console.log("🚀 ~ fetchData ~ resWorkOrder:", resWorkOrder)
                setWorkOrderCopyUrl(resWorkOrder || '');
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, [orderId]);
    const handleViewPdf = async () => {
        if (!orderId) return;
        try {
            const res = await getPdfForAcceptQuotation(orderId);

            // Assuming res.data.url contains the PDF URL
            const pdfUrl = res.data.pdfUrl;
            window.open(pdfUrl, '_blank');
        } catch (error) {
            console.error("Failed to view PDF:", error);
            alert("Failed to open PDF. Please try again.");
        }
    };

    if (!orderId) return <div className="text-red-600 p-6">Order ID not found.</div>;
    if (loading && !details) return <div className="text-gray-600 p-6">Loading...</div>;

    const fields = [
        { label: 'Hospital Name', key: 'hospitalName', placeholder: 'Enter hospital name' },
        { label: 'Full Address', key: 'fullAddress', placeholder: 'Enter full address' },
        { label: 'City', key: 'city', placeholder: 'Enter city' },
        { label: 'District', key: 'district', placeholder: 'Enter district' },
        { label: 'State', key: 'state', placeholder: 'Enter state' },
        { label: 'Pin Code', key: 'pinCode', placeholder: 'Enter PIN code' },
        { label: 'Branch Name', key: 'branchName', placeholder: 'Enter branch name (optional)' },
        { label: 'Contact Person', key: 'contactPersonName', placeholder: 'Enter contact person name' },
        { label: 'Email Address', key: 'emailAddress', placeholder: 'Enter email address' },
        { label: 'Contact Number', key: 'contactNumber', placeholder: 'Enter contact number' },
        { label: 'Designation', key: 'designation', placeholder: 'Enter designation' },
    ];
    return (
        <div>
            <Breadcrumb items={breadcrumbItems} />

            {/* <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Details</h1> */}
            {/* basic details */}


            {/* <div className="bg-white p-6 rounded-lg shadow-lg">
                <h5 className="text-lg font-bold text-gray-800 mb-6">Basic Details</h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm text-gray-700">
                    {fields.map((field, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="text-xs uppercase text-gray-500 font-semibold mb-1">
                                {field.label}
                            </div>
                            <div className="text-gray-800 font-medium">{field.value}</div>
                        </div>
                    ))}
                </div>
            </div> */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                {/* Header with Edit / Save / Cancel buttons */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <h5 className="text-lg font-semibold text-gray-800 flex items-center gap-2.5">
                        <span className="text-blue-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h-4m-6 0H5"
                                />
                            </svg>
                        </span>
                        Basic Details
                    </h5>

                    {!editMode ? (
                        <button
                            onClick={() => setEditMode(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <PencilSquareIcon className="w-4 h-4" />
                            Edit
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-300 disabled:opacity-50"
                            >
                                <XMarkIcon className="w-4 h-4" />
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 mr-1.5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                                            />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {fields.map((field) => (
                            <div
                                key={field.key}
                                className={`p-4 rounded-lg border transition-all duration-150 ${editMode
                                    ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50'
                                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                    }`}
                            >
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5 tracking-wide">
                                    {field.label}
                                </label>

                                {editMode ? (
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            name={field.key}
                                            value={formData[field.key as keyof HospitalDetails] || ''}
                                            onChange={handleInputChange}
                                            onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                // Restrict pinCode (6 digits) and contactNumber (10 digits)
                                                if (field.key === 'pinCode' || field.key === 'contactNumber') {
                                                    const maxLength = field.key === 'pinCode' ? 6 : 10;
                                                    e.currentTarget.value = e.currentTarget.value
                                                        .replace(/[^0-9]/g, '') // only numbers
                                                        .slice(0, maxLength);   // max length enforcement
                                                }
                                            }}
                                            maxLength={field.key === 'pinCode' ? 6 : field.key === 'contactNumber' ? 10 : undefined}
                                            placeholder={field.placeholder}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
                                            disabled={loading}
                                        />

                                        {/* Optional: show digit counter for better UX */}
                                        {(field.key === 'pinCode' || field.key === 'contactNumber') && (
                                            <div className="text-xs text-right text-gray-500">
                                                {(formData[field.key as keyof HospitalDetails]?.length || 0)} /{' '}
                                                {field.key === 'pinCode' ? '6' : '10'}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-base font-medium text-gray-800 break-words min-h-[1.5rem]">
                                        {details?.[field.key as keyof HospitalDetails] || (
                                            <span className="text-gray-400 italic">—</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ✅ Only show if pdfUrl exists and is not empty */}
            {pdfUrl && pdfUrl.trim() !== '' && (
                <div className="bg-white p-4 rounded-lg shadow-md mt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 flex items-center justify-center rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-gray-800 font-medium text-sm">Customer Uploaded PDF</p>
                                <p className="text-xs text-gray-500">Click to view PDF</p>
                            </div>
                        </div>
                        <button
                            onClick={handleViewPdf}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded shadow hover:bg-blue-700 transition"
                        >
                            View
                        </button>
                    </div>
                </div>
            )}
            {/* ✅ Show Work Order Copy only if available */}
            {workOrderCopyUrl && workOrderCopyUrl.trim() !== '' && (
                <div className="bg-white p-4 rounded-lg shadow-md mt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 text-green-600 flex items-center justify-center rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-gray-800 font-medium text-sm">Work Order Copy</p>
                                <p className="text-xs text-gray-500">Click to view uploaded file</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.open(workOrderCopyUrl, '_blank')}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded shadow hover:bg-green-700 transition"
                        >
                            View
                        </button>
                    </div>
                </div>
            )}


            {/* ✅ Only show if pdfUrl exists and is not empty */}


            {/* Service details */}
            <ServiceDetails2 orderId={orderId} />
            {/* <ServicesCardDemo orderId={orderId} /> */}
            <div className="bg-white p-6 rounded-lg shadow-lg mt-5">
                <div className="space-y-4">
                    <AdditionalServices />
                    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
                        <CourierDetails orderId={orderId} />
                    </div>
                    <FadeInModal open={openModal} onClose={() => setOpenModal(false)} title="Payment Screenshot">
                        <img
                            src={PyamentPNG}
                            alt="Payment Screenshot"
                            className="w-full rounded-lg shadow-md object-contain h-80"
                        />
                    </FadeInModal>
                    <FadeInModal open={openMachineModal} onClose={() => setOpenMachineModal(false)} title="Machine Image">
                        <img
                            src={MachineImage}
                            alt="Machine Image"
                            className="w-full rounded-lg shadow-md object-contain h-80"
                        />
                    </FadeInModal>
                    <FadeInModal open={openVerificationModal} onClose={() => setOpenVerificationModal(false)} title="Verification Image">
                        <img
                            src={DymmyReport}
                            alt="Verification Image"
                            className="w-full rounded-lg shadow-md object-contain h-80"
                        />
                    </FadeInModal>
                    <ExpenseAndAccountDetails orderId={orderId} />
                </div>
            </div>
        </div>
    );
};

export default View;    
