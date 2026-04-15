import React from "react";
import AntesoQRCode from "../../../../../../../assets/quotationImg/qrcode.png";
import { Note, ReportData } from "../ViewServiceReport";

export const ReportPdfPageNoteQR: React.FC<{ report: ReportData }> = ({ report }) => {

  const defaultNotesOne: Note[] = [
    { slNo: "5.1", text: "The Test Report relates only to the above item only." },
    { slNo: "5.2", text: "Publication or reproduction of this Certificate in any form other than by complete set of the whole report & in the language written, is not permitted without the written consent of ABPL." },
  ];

  const defaultNotesTwo: Note[] = [
    { slNo: "5.3", text: "Corrections/erasing invalidates the Test Report." },
    { slNo: "5.4", text: "Referred standard for Testing: AERB Test Protocol 2016 - AERB/RF-MED/SC-3 (Rev. 2) Quality Assurance Formats." },
    { slNo: "5.5", text: "Any error in this Report should be brought to our knowledge within 30 days from the date of this report." },
    { slNo: "5.6", text: "Results reported are valid at the time of and under the stated conditions of measurements." },
    { slNo: "5.7", text: "Name, Address & Contact detail is provided by Customer." },
  ];

  return (
    <section className="mb-4 text-[10px]">

      {/* Title */}
      <h2 className="font-bold mb-1 text-[12px]">5. Note:</h2>

      {/* ✅ First Part (Full Width) */}
      <div className="leading-tight mb-2">
        {defaultNotesOne.map((n) => (
          <div key={n.slNo} className="flex mb-[2px]">
            <div className="w-10">{n.slNo}.</div>
            <div className="flex-1 text-justify">{n.text}</div>
          </div>
        ))}
      </div>

      {/* ✅ Second Part (Grid with QR) */}
      <div className="grid grid-cols-[1fr_auto] gap-x-4">

        {/* Notes (Left) */}
        <div className="space-y-[2px]">
          {defaultNotesTwo.map((n) => (
            <div key={n.slNo} className="flex">
              <div className="w-10">{n.slNo}.</div>
              <div className="flex-1 text-justify">{n.text}</div>
            </div>
          ))}
        </div>

        {/* QR (Right) */}
        <div className="flex items-start justify-end">
          <img
            src={AntesoQRCode}
            alt="QR"
            className="w-20 h-20 object-contain"
          />
        </div>

      </div>

    </section>
  );
};