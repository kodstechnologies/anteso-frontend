import React from "react";
import logo from "../../../../../../../assets/logo/anteso-logo2.png";
import logoA from "../../../../../../../assets/quotationImg/NABLlogo.png";

export type ReportPdfPageHeaderData = {
  srfNumber: string;
  srfDate: string;
  reportULRNumber?: string;
};

export const ReportPdfPageHeader: React.FC<{
  report: ReportPdfPageHeaderData;
  formatDate: (dateStr: string) => string;
}> = ({ report, formatDate }) => (
  <div className="report-pdf-page-header flex w-full justify-between items-start m-0 p-0 mb-4 print:mb-2">
    <img src={logoA} alt="NABL" className="block h-24 self-start m-0 p-0 leading-none print:h-16" />
    <div className="text-right self-start m-0 p-0">
      <table style={{ fontSize: '9px', borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'auto', width: 'auto', maxWidth: '200px', border: '0.1px solid #666', marginTop: '0', marginBottom: '0' }}>
        <tbody>
          {[["SRF No.:", report.srfNumber], ["SRF Date:", formatDate(report.srfDate)], ["ULR No.:", report.reportULRNumber || "N/A"]].map(([label, val]) => (
            <tr key={String(label)}>
              <th scope="row" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', whiteSpace: 'nowrap', fontWeight: 700, textAlign: 'center', verticalAlign: 'middle', border: '0.1px solid #666', boxSizing: 'border-box' }}>{label}</th>
              <td style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', whiteSpace: 'nowrap', fontWeight: 400, textAlign: 'center', verticalAlign: 'middle', border: '0.1px solid #666', boxSizing: 'border-box' }}>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <img src={logo} alt="Logo" className="block h-24 self-start m-0 p-0 leading-none print:h-16" />
  </div>
);