import React from 'react';

const InvoiceCustomer = () => {
    const services = [
        {
            id: 1,
            description: 'QA Test Of C-Arm Machine',
            date: 'Date of QA: 14-06-2025',
            hsn: '998719',
            qty: 1,
            rate: 6000,
        },
        {
            id: 2,
            description: 'QA Test Of Fixed X Ray Machine',
            date: 'Date of QA: 14-06-2025',
            hsn: '998719',
            qty: 1,
            rate: 6000,
        },
        {
            id: 3,
            description: 'QA Test Of Portable X Ray Machine',
            date: 'Date of QA: 14-06-2025',
            hsn: '998719',
            qty: 1,
            rate: 5000,
        },
    ];

    const subTotal = services.reduce((sum, item) => sum + item.qty * item.rate, 0);
    const cgst = subTotal * 0.09;
    const sgst = subTotal * 0.09;
    const total = subTotal + cgst + sgst;

    return (
        <div className="max-w-[1100px] mx-auto p-6 text-sm bg-white text-black">
            <h1 className="text-center text-lg font-bold mb-4">Invoice Table</h1>

            <div className="overflow-x-auto">
                <table className="w-full border border-collapse border-gray-400 text-xs">
                    <thead className="bg-gray-200 text-left">
                        <tr>
                            <th className="border p-2">Sl. No</th>
                            <th className="border p-2">Description of Services</th>
                            <th className="border p-2">HSN/SAC</th>
                            <th className="border p-2">Quantity</th>
                            <th className="border p-2">Rate</th>
                            <th className="border p-2">per</th>
                            <th className="border p-2">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((item) => (
                            <tr key={item.id}>
                                <td className="border p-2 text-center">{item.id}</td>
                                <td className="border p-2">
                                    {item.description}
                                    <br />
                                    <span className="italic text-gray-600">{item.date}</span>
                                </td>
                                <td className="border p-2">{item.hsn}</td>
                                <td className="border p-2">{item.qty} qty</td>
                                <td className="border p-2">₹{item.rate.toLocaleString('en-IN')}</td>
                                <td className="border p-2">qty</td>
                                <td className="border p-2 text-right">
                                    ₹{(item.qty * item.rate).toLocaleString('en-IN')}
                                </td>
                            </tr>
                        ))}
                        {/* Subtotal Row */}
                        <tr>
                            <td colSpan={6} className="border p-2 text-right font-semibold">Sub Total</td>
                            <td className="border p-2 text-right">₹{subTotal.toLocaleString('en-IN')}</td>
                        </tr>
                        {/* Tax Rows */}
                        <tr>
                            <td colSpan={6} className="border p-2 text-right font-semibold">CGST @ 9%</td>
                            <td className="border p-2 text-right">₹{cgst.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td colSpan={6} className="border p-2 text-right font-semibold">SGST @ 9%</td>
                            <td className="border p-2 text-right">₹{sgst.toLocaleString('en-IN')}</td>
                        </tr>
                        {/* Final Total */}
                        <tr>
                            <td colSpan={6} className="border p-2 text-right font-bold">Total</td>
                            <td className="border p-2 text-right font-bold text-base">₹{total.toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Amount in Words */}
            <div className="mt-4">
                <p className="text-xs"><strong>Amount Chargeable (in words):</strong> Indian Rupees Twenty Thousand Sixty Only</p>
                <p className="text-xs mt-2"><strong>Tax Amount (in words):</strong> Indian Rupees Three Thousand Sixty Only</p>
            </div>

            {/* Bank Details and Declaration */}
            <div className="mt-6 flex flex-col md:flex-row justify-between gap-6 text-xs">
                <div>
                    <h2 className="font-semibold mb-1">Company’s Bank Details</h2>
                    <p><strong>Bank Name:</strong> HDFC Bank</p>
                    <p><strong>A/C No.:</strong> 50200007211263</p>
                    <p><strong>Branch & IFSC:</strong> Pushpanjali Enclave, Pitampura, New Delhi, HDFC0000711</p>
                    <p><strong>Other Bank:</strong> ICICI BANK, A/C No.: 344305001088, IFSC: ICIC0003443</p>
                </div>
                <div>
                    <h2 className="font-semibold mb-1">Declaration</h2>
                    <p>We declare that this invoice shows the actual price of the service provided and all particulars are true and correct.</p>
                    <p className="mt-2"><strong>PAN:</strong> AAMCA8142J</p>
                    <p className="mt-2"><strong>Terms & Conditions:</strong> Payment delayed more than 30 days, 14% interest p.a. will be charged.</p>
                </div>
            </div>

            {/* Footer Note */}
            <div className="mt-6 text-center text-xs">
                <p className="font-semibold">SUBJECT TO NEW DELHI JURISDICTION</p>
                <p className="italic">This is a Computer Generated Invoice</p>
            </div>
        </div>
    );
};

export default InvoiceCustomer;
