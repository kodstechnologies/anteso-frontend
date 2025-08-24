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
import { getBasicDetailsByOrderId } from '../../../api';
import ServiceDetails2 from './ServiceDetails2'

// Define interfaces
interface OptionType {
    value: string;
    label: string;
}
interface HospitalDetails {
    hospitalName: string;
    fullAddress: string;
    city: string;
    district: string;
    state: string;
    pinCode: string;
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
    console.log("🚀 ~ View ~ orderId:", orderId)
    const [details, setDetails] = useState<HospitalDetails | null>(null);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Orders', to: '/admin/orders', icon: <IconBox /> },
        { label: 'View', icon: <IconBook /> },
    ];
    useEffect(() => {
        const fetchBasicDetails = async () => {
            try {
                if (!orderId) return;
                const response = await getBasicDetailsByOrderId(orderId);
                setDetails(response.data); // if your API returns { data: {...} }
            } catch (error) {
                console.error("Failed to fetch order basic details:", error);
            }
        };

        fetchBasicDetails();
    }, [orderId]);

    if (!details) return <div className="text-gray-600 p-6">Loading...</div>;
    const fields = [
        { label: 'Hospital Name', value: details.hospitalName },
        { label: 'Address', value: details.fullAddress },
        { label: 'City', value: details.city },
        { label: 'State', value: details.state },
        { label: 'Pin Code', value: details.pinCode },
        { label: 'Contact Person Name', value: details.contactPersonName },
        { label: 'Email Address', value: details.emailAddress },
        { label: 'Contact Number', value: details.contactNumber },
        { label: 'Designation', value: details.designation },
    ];
    return (
        <div>
            <Breadcrumb items={breadcrumbItems} />

            {/* <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Details</h1> */}
            {/* basic details */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
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

            </div>
            {/* Service details */}
            {/* <ServiceDetails orderId={orderId} /> */}
            <ServiceDetails2 orderId={orderId}/>
            <div className="bg-white p-6 rounded-lg shadow-lg mt-5">
                <div className="space-y-4">
                    <AdditionalServices />
                    <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
                        <CourierDetails />
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
                    <ExpenseAndAccountDetails />
                </div>
            </div>
        </div>
    );
};

export default View;
