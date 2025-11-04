import React, { useRef } from "react";
import logo from "../../../../assets/logo/logo-sm.png";
import logoA from "../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../assets/quotationImg/signature.png";

const ViewServiceReport = () => {
  const reportRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center py-8 px-4">
      <div
        ref={reportRef}
        className="bg-white shadow-md border border-gray-300 p-8 text-sm leading-relaxed w-full max-w-[1100px]"
      >
        {/* Header logos */}
        <div className="flex justify-between items-center mb-2">
          <img src={logoA} alt="Left Logo" className="h-24 max-h-28 object-contain" />
          <div className="flex justify-center mb-2">
            <table className="text-[10px] border border-gray-400 w-auto inline-table">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-[1px] font-semibold">
                    SRF No.
                  </td>
                  <td className="border border-gray-400 px-2 py-[2px]">
                    ABSRF/2025/03/01160
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-[2px] font-semibold">
                    SRF Date
                  </td>
                  <td className="border border-gray-400 px-2 py-[2px]">
                    21-Mar-25
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-[2px] font-semibold">
                    ULR No.
                  </td>
                  <td className="border border-gray-400 px-2 py-[2px]">
                    TC9A43250001485F
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <img src={logo} alt="Right Logo" className="h-24 max-h-28 object-contain" />
        </div>



        <br />
        <br />

        {/* Government heading */}
        <div className="text-center text-xs mt-2 mb-4">
          <p>Government of India, Atomic Energy Regulatory Board</p>
          <p>
            Radiological Safety Division, Niyamak Bhavan, Anushaktinagar, Mumbai-400094
          </p>
        </div>

        {/* Main Title */}
        <h1 className="text-center text-lg font-bold underline">
          QA TEST REPORT FOR DIAGNOSTIC X-RAY EQUIPMENT
        </h1>
        <p className="text-center text-xs italic mt-1 mb-6">
          (Periodic Quality Assurance shall be carried out at least once in two years
          and also after any repairs having radiation safety implications.)
        </p>

        {/* 1. Customer Details */}
        <h2 className="font-semibold text-sm mb-2">
          1. Name, Address and Contact Detail of Customer
        </h2>
        <div className="flex justify-between text-sm border border-gray-300 p-3 mb-4">
          <span className="font-medium text-gray-800">Customer:</span>
          <div className="text-right">
            <p>SUBBAIAH INSTITUTE OF MEDICAL SCIENCES</p>
            <p>NH 13 H H ROAD, PURLE BESIDE PURLE LAKE</p>
            <p>SHIMOGA, KARNATAKA - 577 222</p>
          </div>
        </div>

        {/* 2. Customer Reference */}
        <h2 className="font-semibold text-sm mb-2">2. Customer Reference</h2>
        <table className="w-full text-sm border border-gray-300 mb-4">
          <tbody>
            <tr>
              <td className="border px-2 py-1 w-1/2 font-medium">2.1 SRF No.</td>
              <td className="border px-2 py-1 text-right">
                ABSRF/2025/03/01160 &nbsp;&nbsp; Dated: 21-Mar-25
              </td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-medium">2.2 Test Report No.</td>
              <td className="border px-2 py-1 text-right">
                ABQAR250301485 &nbsp;&nbsp; Issue Date: 24-Mar-25
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3. Details of Device Under Test */}
        <h2 className="font-semibold text-sm mb-2">3. Details of Device Under Test</h2>
        <table className="w-full text-xs border border-gray-400 mb-4">
          <tbody>
            {[
              ["1. Nomenclature", "C Arm"],
              ["2. Make", "ALLENGERS MEDICAL SYSTEMS LTD. India"],
              ["3. Model", "HF-59R PLUS"],
              ["4. Sl. No.", "2K32552112SR-DC"],
              ["5. Condition of Test Item", "OK"],
              ["6. Testing Procedure No.", "ABPL/W1048"],
              ["7. Engineer Name & RP ID", "Sohail M Thakur (13-01069)"],
              ["8. QA Test Date", "22-Mar-25"],
              ["9. QA Test Due Date", "22-Mar-27"],
              ["10. Testing done at Location", "Customer’s Premises"],
              ["11. Temperature (°C)", "34.1"],
              ["12. Humidity in RH (%)", "56.0"],
            ].map(([label, value]) => (
              <tr key={label}>
                <td className="border px-2 py-1 font-medium">{label}</td>
                <td className="border px-2 py-1 text-right">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 4. Standards Used for Testing */}
        <h2 className="font-semibold text-sm mb-2">4. Standards Used for Testing</h2>
        <table className="w-full border border-gray-400 text-xs mb-4">
          <thead>
            <tr className="bg-gray-100">
              {[
                "Sl. No.",
                "Nomenclature",
                "Make / Model",
                "Serial Number",
                "Range",
                "Certificate",
                "Validity",
              ].map((h) => (
                <th key={h} className="border border-gray-400 px-2 py-1">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1 text-center">1</td>
              <td className="border px-2 py-1">Multimeter</td>
              <td className="border px-2 py-1">R1/Trishna 657</td>
              <td className="border px-2 py-1">CB2-1340037</td>
              <td className="border px-2 py-1">±0.16 V</td>
              <td className="border px-2 py-1">TBS/SDPL/2023</td>
              <td className="border px-2 py-1">19-Apr-25</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 text-center">2</td>
              <td className="border px-2 py-1">Survey Meter</td>
              <td className="border px-2 py-1">RTI/SCATTER PROBE</td>
              <td className="border px-2 py-1">SP1-2405003</td>
              <td className="border px-2 py-1">0-100mGy/h</td>
              <td className="border px-2 py-1">2455832</td>
              <td className="border px-2 py-1">08-May-26</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 text-center">3</td>
              <td className="border px-2 py-1">Hygrometer</td>
              <td className="border px-2 py-1">ACE/TQ/28S</td>
              <td className="border px-2 py-1">ABPL/HYG-06</td>
              <td className="border px-2 py-1">(-50 to 70°C)</td>
              <td className="border px-2 py-1">AT24Q0003427</td>
              <td className="border px-2 py-1">23-Apr-25</td>
            </tr>
          </tbody>
        </table>

        {/* Notes */}
        <h2 className="font-semibold text-sm mb-2">5. Note:</h2>
        <div className="ml-4 space-y-1 text-xs">
          <p>5.1 The Test Report relates only to the above item only.</p>
          <p>
            5.2 Publication or reproduction of this Certificate in any form other than by
            complete set of the whole report & in the language, written, is not permitted
            without the written consent of ABPL.
          </p>
          <p>5.3 Corrections/erasing invalidates the Test Report.</p>
          <p>
            5.4 Referred standard for Testing: AERB Test Protocol 2016 - AERB/RF-MED/SC-3
            (Rev. 2) Quality Assurance Formats.
          </p>
          <p>
            5.5 Any error in this Report should be brought to our knowledge within 30 days
            from the date of this report.
          </p>
          <p>
            5.6 Results reported are valid at the time of and under the stated conditions
            of measurements.
          </p>
          <p>5.7 Name, Address & Contact detail is provided by Customer.</p>
        </div>

        {/* Footer */}
        {/* <div className="flex justify-between items-center mt-10 text-xs">
          <img src={AntesoQRCode} alt="QR Code" className="h-16" />
          <div className="text-center">
            <img src={Signature} alt="Signature" className="h-12 mx-auto" />
            <p className="font-semibold">Authorized Signatory</p>
          </div>
        </div> */}

        <p className="text-center text-[12px] text-gray-600 mt-6">
          ANTESO Biomedical Engg Pvt. Ltd. <br />
          2nd Floor, D-290, Plot Sector – 63, Noida, New Delhi – 110085 <br />
          Ph: 011-47096780 | Mob: +91-8243794270, +91-8700579720 <br />
          Email: antesobiomedical@gmail.com | info@antesobiomedicalengg.com
        </p>
      </div>
    </div>
  );
};

export default ViewServiceReport;
