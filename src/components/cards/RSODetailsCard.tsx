import React from 'react';
import IconEye from '../../components/Icon/IconEye';

interface RSODetailsCardProps {
    rsoID: string;
    rsoPassword: string;
    rsoEmail: string;
    rsoPhone: string;
    rpID: string;
    tldBadge: string;
    rsoValidity: string;
}

const RSODetailsCard: React.FC<RSODetailsCardProps> = ({
    rsoID,
    rsoPassword,
    rsoEmail,
    rsoPhone,
    rpID,
    tldBadge,
    rsoValidity
}) => {
    return (
        <div className="panel p-0 border-white-light dark:border-[#1b2e4b] bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
            <div className="invoice-table p-4 text-[.8rem]">
                <h5 className="font-semibold text-lg text-primary mb-4">RSO Details</h5>
                <p className="mb-2"><strong>RSO ID:</strong> {rsoID}</p>
                <p className="mb-2"><strong>Password:</strong> {rsoPassword}</p>
                <p className="mb-2"><strong>Email:</strong> {rsoEmail}</p>
                <p className="mb-2"><strong>Phone:</strong> {rsoPhone}</p>
                <p className="mb-2"><strong>RP ID:</strong> {rpID}</p>
                <p className="mb-2"><strong>TLD Badge:</strong> {tldBadge}</p>
                <p className="mb-2"><strong>Validity:</strong> {rsoValidity}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className="font-semibold">View File:</span>
                    <a
                        href="https://www.aerb.gov.in/images/PDF/RSO-eLORA-guidelines.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                    >
                        <IconEye className="w-4.5 h-4.5" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default RSODetailsCard;
