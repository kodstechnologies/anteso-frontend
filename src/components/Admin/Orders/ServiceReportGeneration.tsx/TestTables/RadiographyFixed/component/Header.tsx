import React from "react";
import logo from "../../../../../../../assets/logo/anteso-logo2.png";
import logoA from "../../../../../../../assets/quotationImg/NABLlogo.png";
import { ReportData } from "../ViewServiceReport";

export const ReportPdfPageHeader: React.FC<{
  report: ReportData;
  formatDate: (dateStr: string) => string;
}> = ({ report, formatDate }) => (
  <div className="report-pdf-page-header flex justify-between items-center mb-4 print:mb-2">
    <img src={logoA} alt="NABL" className="h-24 print:h-16" />
    <div className="text-right">
      <table style={{ fontSize: '9px', borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'auto', width: 'auto', maxWidth: '200px', border: '0.1px solid #666' }}>
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
    <img src={logo} alt="Logo" className="h-24 print:h-16" />
  </div>
);