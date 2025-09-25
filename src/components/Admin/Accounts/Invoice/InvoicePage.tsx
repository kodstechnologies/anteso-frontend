import React from 'react';
import logoA from '../../../../assets/quotationImg/NABLlogo.png';
import logoB from '../../../../assets/quotationImg/images.jpg';
import signature from '../../../../assets/quotationImg/signature.png';
import qrcode from '../../../../assets/quotationImg/qrcode.png';

const Invoice = () => {
  const invoice = {
    invoiceId: 'INV001',
    date: '22-Nov-2024',
    buyerName: 'Civil Hospital Kotli',
    address: 'Kotli, Mandi, Himachal Pradesh - 175003',
    email: 'hospitalkotli@example.com',
    contact: '80917 50188',
    employee: 'Anjana Thakur',
    employeePhone: '9317509720',
    dealer: 'Namita Rajput',
    dealerPhone: '9988334122',
    state: 'Himachal Pradesh',
    gstin: '29ABCDE1234F2Z5',
  };

  const items = [
    {
      id: 1,
      machineType: 'CT SCAN',
      HSNSACNo: "123456",
      quantity: 2,
      rate: 100000,
      total: 200000,
    },
    {
      id: 2,
      machineType: 'X-RAY MACHINE',
      HSNSACNo: "123456",
      quantity: 1,
      rate: 50000,
      total: 50000,
    },
  ];

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="w-full min-h-screen bg-gray-50 px-8 absolute top-0 left-0 z-50 lg:px-[15%]">
      <div className="max-w-6xl mx-auto rounded-lg px-4 bg-white w-[50rem]">
        <div className="flex justify-between items-start">
          <div>
            <img src={logoB} alt="Logo B" className="h-14" />
            <p className="font-bold text-[.6rem]">AERB Registration No. 14-AFSXE-2148</p>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold uppercase">Invoice</h1>
          </div>
          <div className="text-right">
            <img src={logoA} alt="Logo A" className="h-14 ml-auto" />
            <p className="font-bold text-[.6rem]">NABL Accreditation No TC-9843</p>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <div>
            <p className="text-sm font-semibold">Invoice To:</p>
            <p className="text-[.7rem]">{invoice.buyerName}</p>
            <p className="text-[.7rem]">{invoice.address}</p>
            <p className="text-[.7rem]">Email: {invoice.email}</p>
            <p className="text-[.7rem]">Contact: {invoice.contact}</p>
            <p className="text-[.7rem]">GSTIN: {invoice.gstin}</p>
          </div>

          <div
            className=""
            style={{
              lineHeight: '17px',
            }}
          >
            <p className="font-bold text-black text-[.7rem]">ANTESO Biomedical (OPC) Pvt. Ltd.</p>
            <p className="text-[.7rem]">Flat No. 290, 2nd Floor, Block D,</p>
            <p className="text-[.7rem]">Pocket 7, Sector 6, Rohini,</p>
            <p className="text-[.7rem]">New Delhi – 110 085, INDIA</p>
            <p className="text-[.7rem]">Mobile: +91 8470909720 / 8951818690</p>
            <p className="text-[.7rem]">Email: info@antesobiomedicalopc.com</p>
          </div>
        </div>
        <div className="text-[.7rem] space-y-1">
          <p><strong>EmailId:</strong> lalitha@antesobiomedicalopc</p>
          <p><strong>Website:</strong>www.antesobiomedicalopc.com</p>
          <p><strong>Type of Service:</strong>Quality Assurance Testing of Radiology Equipment(HSN NO-998719)-Branch Name-Bangalore</p>

          {/* <p><strong>Employee:</strong> {invoice.employee} ({invoice.employeePhone})</p>
            <p><strong>Dealer:</strong> {invoice.dealer} ({invoice.dealerPhone})</p> */}
        </div>

        <table className="w-full mt-6 text-[.7rem]">
          <thead>
            <tr className="bg-gray-100 text-gray-800 font-bold">
              <th className="p-2">S.NO</th>
              <th className="p-2">Machine Type</th>
              <th className="p-2">HSN/SAC No</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Rate</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="p-2 text-center">{item.id}</td>
                <td className="p-2">{item.machineType}</td>
                <td className="p-2">{item.HSNSACNo}</td>

                <td className="p-2 text-right">{item.quantity}</td>
                <td className="p-2 text-right">₹ {item.rate.toLocaleString('en-IN')}</td>
                <td className="p-2 text-right">₹ {item.total.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Subtotal, GST and Total */}
        <div className="flex flex-row-reverse px-4 mt-4">
          <div className="w-60 space-y-2 text-[.7rem]">
            <div className="flex justify-between">
              <span className="font-semibold">Subtotal</span>
              <span>₹ </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">GST @18%</span>
              <span>₹ </span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-[.75rem]">
              <span>Total</span>
              <span>₹ </span>
            </div>
          </div>
        </div>

        <table className="w-full border border-gray-300 text-[.7rem] mt-4">

        </table>
        <div className="flex justify-between gap-44 mt-10 text-[.6rem]">
          {/* Left Column - Declaration */}
          <div className="w-1/2">
            <h2 className="font-semibold mb-1">DECLARATION</h2>
            <p>
              We declare that this invoice shows the actual price of the service provided and all perticulars are true and correct.
            </p>

          </div>

          {/* Right Column - Company's Bank Details */}
          <div className="w-1/2">

            <h2 className="font-semibold mb-1">COMPANY'S BANK DETAILS</h2>
            <p>Bank: HDFC BANK</p>
            <p>A/C No.: 50200007211263</p>
            <p>Branch: Pushpanjali Enclave, Pitampura, New Delhi</p>
            <p>IFSC: HDFC0000711</p>
          </div>
        </div>

        <hr className="my-5" />

        {/* Signature at the bottom right */}
        <div className="flex justify-end mt-10 text-[.6rem]">
          <div className="text-right">
            <p><strong>For Anteso Biomedical (OPC)  Pvt. Ltd</strong></p>
            <img src={signature} alt="Signature" className="h-20 mb-2 ml-auto" />
            <p><strong>Authorized Signatory</strong></p>
          </div>
        </div>
        {/* Terms & Conditions */}
        <div className="bg-blue-100 text-blue-700 text-xs p-3 rounded mb-4">
          <span className="font-semibold uppercase">Terms & Conditions</span><br />
          Payment delayed more than 30 days, 14% interest p.a. will be charged
        </div>

        {/* Jurisdiction Note */}
        <div className="text-center text-[0.7rem] text-gray-600 mt-2">
          <p className="font-semibold tracking-wide">SUBJECT TO NEW DELHI JURISDICTION</p>
          <p>This is a Computer Generated Invoice</p>
        </div>

        {/* Print Button (bottom right) */}
        <div className="flex justify-end mt-4">
          <button
            onClick={() => window.print()}
            className="btn bg-teal-500 hover:bg-teal-600 text-white text-xs px-4 py-2 rounded flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-4 h-4 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 10.5v-6a.75.75 0 01.75-.75h9a.75.75 0 01.75.75v6m-9 0H5.25A2.25 2.25 0 003 12.75v4.5A2.25 2.25 0 005.25 19.5H6.75m0-9h10.5m-10.5 0V19.5m10.5-9v9m0 0h1.5A2.25 2.25 0 0021 17.25v-4.5A2.25 2.25 0 0019.5 10.5h-1.5"
              />
            </svg>
            Print
          </button>
        </div>

      </div>
    </div>
  );
};

export default Invoice;
