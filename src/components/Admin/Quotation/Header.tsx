import React from "react";
import logo from "../../../assets/logo/anteso-logo2.png";
import logoA from "../../../assets/quotationImg/NABLlogo.png";

export interface QuotationHeaderEnquiry {
    contactPerson?: string;
    hospitalName?: string;
    fullAddress?: string;
    city?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    emailAddress?: string;
    contactNumber?: string;
}

interface QuotationHeaderProps {
    date: string;
    enquiry: QuotationHeaderEnquiry;
    assignedEmployeeName: string;
    assignedEmployeePhone: string | number;
    quotationDescription: string;
    formatDate: (dateString: string) => string;
}

const QuotationHeader: React.FC<QuotationHeaderProps> = ({
    date,
    enquiry,
    assignedEmployeeName,
    assignedEmployeePhone,
    quotationDescription,
    formatDate,
}) => {
    return (
        <>
            <div className="flex justify-between items-start no-break mb-10">
                <div>
                    <img src={logo} alt="Company Logo" className="h-20" />
                    <p className="font-bold text-[.6rem]">AERB Registration No. 14-AFSXE-2148</p>
                </div>
                <div className="text-center pt-2">
                    <h1 className="text-xl font-bold uppercase">Quotation</h1>
                </div>
                <div className="text-right">
                    <img src={logoA} alt="NABL Logo" className="h-20 ml-auto" />
                    <p className="font-bold text-[.6rem]">NABL Accreditation No TC-9843</p>
                </div>
            </div>

            {/* Company and Recipient Info */}
            <div className="flex w-full justify-between pdf-section">
                <div className="flex-1 min-w-0 pr-4">
                    <div className="text-[.7rem]" style={{ lineHeight: "1.35rem" }}>
                        <div className="flex">
                            <span className="font-bold shrink-0 w-[4.5rem]">Date:</span>
                            <span>{formatDate(date)}</span>
                        </div>
                        <div className="flex mt-1">
                            <span className="font-bold shrink-0 w-[4.5rem]">To</span>
                            <div style={{ lineHeight: "18px" }}>
                                {enquiry.contactPerson && (
                                    <>
                                        <span className="font-bold">{enquiry.contactPerson}</span>
                                        <br />
                                    </>
                                )}
                                <span className="font-bold">
                                    {(enquiry.hospitalName || "").toUpperCase()}
                                </span>
                                <br />
                                {enquiry.fullAddress}
                                <br />
                                {enquiry.city}, {enquiry.district},{" "}
                                {enquiry.state}-{enquiry.pinCode}
                            </div>
                        </div>
                        <div className="flex mt-2">
                            <span className="font-bold shrink-0 w-[4.5rem]">Email-</span>
                            <a
                                href={`mailto:${enquiry.emailAddress || ""}`}
                                className="text-blue-600 hover:underline"
                            >
                                {enquiry.emailAddress}
                            </a>
                        </div>
                        <div className="flex">
                            <span className="font-bold shrink-0 w-[4.5rem]">Contact.-</span>
                            <span>{enquiry.contactNumber}</span>
                        </div>
                        <div className="flex flex-wrap">
                            <span className="font-bold shrink-0">From: </span>
                            <span>{assignedEmployeeName}</span>
                            <span className="inline-block w-10" />
                            <span className="font-bold">M: </span>
                            <span>{assignedEmployeePhone}</span>
                        </div>
                    </div>
                </div>

                <div
                    className="flex-shrink-0 text-left pt-6"
                    style={{ lineHeight: "17px" }}
                >
                    <p className="font-bold text-black text-[.7rem]">ANTESO Biomedical (OPC) Pvt. Ltd.</p>
                    <p className="text-[.7rem]">Flat No. 290, 2nd Floor, Block D,</p>
                    <p className="text-[.7rem]">Pocket 7, Sector 6, Rohini,</p>
                    <p className="text-[.7rem]">New Delhi – 110 085, INDIA</p>
                    <p className="text-[.7rem]">Mobile: +91 8470909720 / 8951818690</p>
                    <p className="text-[.7rem]">Email: info@antesobiomedicalopc.com</p>
                </div>
            </div>

            <div className="w-full text-[.7rem] font-bold mt-3" style={{ lineHeight: "1.3rem" }}>
                <span>QUOTATION : </span>
                <span>{quotationDescription}</span>
            </div>
            <div className="w-full text-[.7rem] mb-2 mt-0.5" style={{ lineHeight: "1.3rem" }}>
                <span className="font-bold">EXPIRES: </span>
                <span>30 days from above date</span>
            </div>
        </>
    );
};

export default QuotationHeader;
