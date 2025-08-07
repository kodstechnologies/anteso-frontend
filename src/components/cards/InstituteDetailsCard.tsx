import React from 'react';

interface InstituteDetailsCardProps {
    eloraID: string;
    instPassword: string;
    instEmail: string;
    instPhone: string;
}

const InstituteDetailsCard: React.FC<InstituteDetailsCardProps> = ({ eloraID, instPassword, instEmail, instPhone }) => {
    return (
        <div className="panel p-0 border-white-light dark:border-[#1b2e4b] bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
            <div className="invoice-table p-4 text-[.8rem]">
                <h5 className="font-semibold text-lg text-primary mb-4">Institute Details</h5>
                <p className="mb-2"><strong>ELORA ID:</strong> {eloraID}</p>
                <p className="mb-2"><strong>Password:</strong> {instPassword}</p>
                <p className="mb-2"><strong>Email:</strong> {instEmail}</p>
                <p className="mb-2"><strong>Phone:</strong> {instPhone}</p>
            </div>
        </div>
    );
};

export default InstituteDetailsCard;
