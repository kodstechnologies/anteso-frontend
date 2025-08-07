import React from 'react';
import antesoLogo from '../../../../assets/logo/logo-sm.png';
import signature from '../../../../assets/quotationImg/signature.png';
import qrcode from '../../../../assets/quotationImg/qrcode.png';

const InvoiceDealer = () => {
    const invoiceDetails = {
        invoiceDate: '24-June-2025',
        invoiceNo: '25-26/AB-173',
        billTo: 'Allengers Medical Systems Limited',
        addressLine: 'Bhankarpur Mubarakpur Road, DeraBassi SAS Nagar, Punjab - 140 507',
        gstin: '03AAECA2332H1ZE',
        email: '-',
        phone: '-',
    };

    const items = [
        { id: 1, partyCode: 'C049352', hospital: 'WELFARE HOSPITAL', location: 'UTTARA KANNADA', state: 'KARNATAKA', model: 'HF 595 PLUS', srNo: '2K25000468R-DC', expense: 3000 },
        { id: 2, partyCode: 'C049812', hospital: 'S.D.M. AYURVEDA HOSPITAL', location: 'UDUPI', state: 'KARNATAKA', model: 'MARS-30', srNo: '2K25040016-DXR', expense: 3000 },
        { id: 3, partyCode: 'C045808', hospital: 'KIMS HOSPITAL BENGALURU PVT LTD', location: 'BANGALORE URBAN', state: 'KARNATAKA', model: 'MARS-4.2', srNo: '2K25010396-DXR', expense: 3250 },
    ];

    const subTotal = items.reduce((sum, item) => sum + item.expense, 0);
    const gst = subTotal * 0.18;
    const total = subTotal + gst;

    return (
        <div className="w-full min-h-screen bg-gray-50 px-8 absolute top-0 left-0 z-50 lg:px-[15%]">

            <div className="w-full bg-white px-4 sm:px-6 md:px-8 py-4 text-[11px] sm:text-xs">
                <div className="max-w-[794px] mx-auto border border-black p-4">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-black pb-2">
                        <img src={antesoLogo} alt="Logo" className="h-10 sm:h-12" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[11px]">
                        <div className="border border-black p-2">
                            <p><strong>INVOICE DATE:</strong> {invoiceDetails.invoiceDate}</p>
                            <h2 className="text-sm sm:text-base font-bold">ANTESO Biomedical</h2>
                            <p>ANTESO Biomedical OPC Pvt. Ltd.</p>
                            <p>Flat No 290, 2nd Floor, Block D, Pocket 7, Sec 6, Rohini, New Delhi-110085</p>
                            <p>Email: accounts@antesobiomedicalopc.com</p>
                            <p>Mobile: 8470909720, 8274394720</p>
                        </div>

                        <div className="border border-black p-2">
                            <p><strong>INVOICE NO.:</strong> {invoiceDetails.invoiceNo}</p>
                            <p><strong>Bill To:</strong> {invoiceDetails.billTo}</p>
                            <p>{invoiceDetails.addressLine}</p>
                            <p>Phone: {invoiceDetails.phone}</p>
                            <p>Email: {invoiceDetails.email}</p>
                            <p><strong>GST:</strong> {invoiceDetails.gstin}</p>
                        </div>
                    </div>

                    {/* Service Info */}
                    <div className="border border-black mt-4 p-2 text-[10px]">
                        <p>Email ID: accounts@antesobiomedicalopc.com</p>
                        <p>Website: www.antesobiomedicalopc.com</p>
                        <p>Type Of Service: Quality Assurance Testing of Radiology Equipment (HSN NO-998719) - Branch Name - Bangalore</p>
                    </div>

                    {/* Table */}
                    <div className="mt-2 w-full overflow-hidden">
                        <table className="w-full table-fixed border border-black border-collapse text-[4px] sm:text-xs">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border border-black px-1 py-1 text-xs">S No</th>
                                    <th className="border border-black px-1 py-1 text-xs">Party Code</th>
                                    <th className="border border-black px-1 py-1 text-xs">Hospital</th>
                                    <th className="border border-black px-1 py-1 text-xs">Location</th>
                                    <th className="border border-black px-1 py-1 text-xs">State</th>
                                    <th className="border border-black px-1 py-1 text-xs">Model</th>
                                    <th className="border border-black px-1 py-1 text-xs">Sr.No</th>
                                    <th className="border border-black px-1 py-1 text-xs">Expense</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="border border-black px-1 py-1 text-xs">{item.id}</td>
                                        <td className="border border-black px-1 py-1 text-xs">{item.partyCode}</td>
                                        <td className="border border-black px-1 py-1 text-xs">{item.hospital}</td>
                                        <td className="border border-black px-1 py-1 text-xs">{item.location}</td>
                                        <td className="border border-black px-1 py-1 text-xs">{item.state}</td>
                                        <td className="border border-black px-1 py-1 text-xs">{item.model}</td>
                                        <td className="border border-black px-1 py-1 text-xs">{item.srNo}</td>
                                        <td className="border border-black px-1 py-1 text-xs">₹{item.expense.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>





                    {/* Totals */}
                    <div className="text-right mt-4 space-y-1">
                        <p><strong>Sub Total:</strong> ₹{subTotal.toLocaleString('en-IN')}</p>
                        <p><strong>IGST 18%:</strong> ₹{gst.toLocaleString('en-IN')}</p>
                        <p className="text-sm font-bold">Total: ₹{total.toLocaleString('en-IN')}</p>
                        <p className="mt-2 italic">In Words: Sixty Thousand One Hundred Eighty Only.</p>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col md:flex-row justify-between gap-6 mt-8 text-[10px] sm:text-xs">
                        <div>
                            <h2 className="font-semibold">Bank Details:</h2>
                            <p><strong>Name:</strong> ANTESO Biomedical OPC Pvt. Ltd.</p>
                            <p><strong>A/C No:</strong> 50200007211263 HDFC BANK</p>
                            <p><strong>IFSC:</strong> HDFC0000711</p>
                            <p><strong>Branch:</strong> Pushpanjali Enclave, Pitampura New Delhi</p>
                        </div>
                        <div>
                            <img src={qrcode} alt="QR Code" className="h-20 w-20 object-contain" />
                        </div>
                        <div className="text-right">
                            <p><strong>For ANTESO Biomedical OPC Pvt. Ltd.</strong></p>
                            <img src={signature} alt="Signature" className="h-14 ml-auto" />
                            <p><strong>Authorized Signatory</strong></p>
                        </div>
                    </div>

                    <p className="text-center mt-4 text-[10px] sm:text-xs font-semibold">Please make cheques payable to us: ANTESO Biomedical OPC Pvt. Ltd.</p>
                    <p className="text-center text-[10px] sm:text-xs italic">For any clarification this invoice please email us on: accounts@antesobiomedicalopc.com</p>

                    {/* Print Button */}
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={() => window.print()}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2 rounded print:hidden"
                        >
                            Print Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDealer;
