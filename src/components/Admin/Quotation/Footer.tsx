import React from "react";
import AntesoQRCode from "../../../assets/quotationImg/qrcode.png";
import Signature from "../../../assets/quotationImg/signature.png";

const QuotationFooter: React.FC = () => {
    return (
        <div className="mt-4 no-break w-full">
            <div className="flex flex-nowrap justify-between items-start gap-4 w-full">
                {/* Left: signature (includes name/RSO stamp in image) */}
                <div className="flex-shrink-0">
                    <img
                        src={Signature}
                        alt="Signature"
                        className="h-36 w-auto object-contain object-left"
                    />
                </div>

                {/* Right: QR + merchant + steps — centered under QR */}
                <div className="flex-shrink-0 w-[15rem] flex flex-col items-center text-center">
                    <img
                        src={AntesoQRCode}
                        alt="QR Code"
                        className="h-28 w-28 object-contain"
                    />
                    <div className="mt-0.5 flex flex-col items-center text-gray-900">
                        <div className="w-28 mx-auto text-[.4rem] text-left" style={{ lineHeight: "8px" }}>
                            <div className="flex gap-1 items-start">
                                <span className="whitespace-nowrap shrink-0">Merchant Name :</span>
                                <span className="break-words">ANTESO BIOMEDICAL PRIVATE LIMITED</span>
                            </div>
                            <div className="flex gap-1 items-start">
                                <span className="whitespace-nowrap shrink-0">Mobile Number :</span>
                                <span>8470909720</span>
                            </div>
                        </div>
                        <div
                            className="mt-0.5 w-full text-center text-[.4rem] px-1 mb-1"
                            style={{ lineHeight: "10px" }}
                        >
                            <p>Steps to Pay UPI QR Code</p>
                            <p>
                                Open UPI app &gt; Select Type to Pay &gt; Scan QR Code &gt; Enter Amount
                            </p>
                        </div>
                    </div>
                    <hr className="bg-gray-700 h-[1.5px] mt-1 mb-0 w-full" />
                </div>
            </div>

            {/* Bank details — one horizontal line below signature + QR */}
            <div
                className="flex flex-nowrap justify-between items-start gap-3 w-full mt-0.5 text-[.6rem]"
                style={{ lineHeight: "11px" }}
            >
                <div className="flex-1 min-w-0 text-left">
                    <p>
                        <span className="font-medium">A/C No.:</span> 50200007211263
                    </p>
                    <p>
                        <span className="font-medium">IFSC :</span> HDFC0000711
                    </p>
                    <p>HDFC BANK PUSHPANJALI ENCLAVE PITAMPURA</p>
                </div>
                <div className="flex-1 min-w-0 text-center">
                    <p className="font-bold">OUR ACCOUNT DETAILS</p>
                    <p className="font-bold">
                        <span>GST NO :</span> 07AAMCA8142J1ZE
                    </p>
                </div>
                <div className="flex-1 min-w-0 text-left pl-6">
                    <p>
                        <span className="font-medium">A/C No</span> 344305001088
                    </p>
                    <p>
                        <span className="font-medium">IFSC Code</span> ICIC0003443
                    </p>
                    <p>ICICI BANK ROHINI</p>
                </div>
            </div>
        </div>
    );
};

export default QuotationFooter;
