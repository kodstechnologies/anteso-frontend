import React from 'react';

interface HospitalDetailsCardProps {
    name: string;
    email: string;
    address: string;
    phone: string;
    business: string;
    gstNo: string;
}

const HospitalDetailsCard: React.FC<HospitalDetailsCardProps> = ({ name, email, address, phone, business, gstNo }) => {
    return (
        <div className="panel p-0 border-white-light dark:border-[#1b2e4b] bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
            <div className="invoice-table p-4 text-[.8rem]">
                <h5 className="font-semibold text-lg text-primary mb-4">Hospital Details</h5>
                <p className="mb-2"><strong>Name:</strong> {name}</p>
                <p className="mb-2"><strong>Email:</strong> {email}</p>
                <p className="mb-2"><strong>Address:</strong> {address}</p>
                <p className="mb-2"><strong>Phone:</strong> {phone}</p>
                <p className="mb-2"><strong>Business:</strong> {business}</p>
                <p className="mb-2"><strong>GST No:</strong> {gstNo}</p>
            </div>
        </div>
    );
};

export default HospitalDetailsCard;
