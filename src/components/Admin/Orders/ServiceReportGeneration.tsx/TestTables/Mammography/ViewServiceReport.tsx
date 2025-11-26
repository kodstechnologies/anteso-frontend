// src/components/reports/ViewServiceReportMammography.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
// import {
//   getReportHeader,
//   getAccuracyOfOperatingPotentialByTestId,
//   getLinearityOfMasLLoadingByTestId,
//   getTotalFiltrationAndAluminiumByTestId,
//   getReproducibilityOfOutputByTestId,
//   getRadiationLeakageLevelByTestId,
//   getImagingPhantomByTestId,
//   getRadiationProtectionSurveyByTestId,
//   getEquipmentSettingByTestId,
//   getMaximumRadiationLevelByTestId,
// } from "../../../../../../a";
// import MainTestTableForMammography from "../../TestTables/Mammography/";
import logo from "../../../../assets/logo/logo-sm.png";
import logoA from "../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../assets/quotationImg/signature.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Tool {
  slNumber: string;
  nomenclature: string;
  make: string;
  model: string;
  SrNo: string;
  range: string;
  calibrationCertificateNo: string;
  calibrationValidTill: string;
}

interface ReportData {
  customerName: string;
  address: string;
  srfNumber: string;
  srfDate: string;
  testReportNumber: string;
  issueDate: string;
  nomenclature: string;
  make: string;
  model: string;
  slNumber: string;
  condition: string;
  testingProcedureNumber: string;
  engineerNameRPId: string;
  testDate: string;
  testDueDate: string;
  location: string;
  temperature: string;
  humidity: string;
  toolsUsed: Tool[];
  notes: { slNo: string; text: string }[];

  // Mammography test IDs
  accuracyOfOperatingPotentialId?: string | null;
  linearityOfMasLLoadingId?: string | null;
  totalFiltrationAndAluminiumId?: string | null;
  reproducibilityOfOutputId?: string | null;
  radiationLeakageLevelId?: string | null;
  imagingPhantomId?: string | null;
  radiationProtectionSurveyId?: string | null;
  equipmentSettingId?: string | null;
  maximumRadiationLevelId?: string | null;
}

const ViewServiceReportMammography: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testsLoading, setTestsLoading] = useState(false);

  const [testData, setTestData] = useState<any>({
    accuracyOfOperatingPotential: null,
    linearityOfMasLLoading: null,
    totalFiltrationAndAluminium: null,
    reproducibilityOfOutput: null,
    radiationLeakageLevel: null,
    imagingPhantom: null,
    radiationProtectionSurvey: null,
    equipmentSetting: null,
    maximumRadiationLevel: null,
  });

  // useEffect(() => {
  //   const fetchReport = async () => {
  //     if (!serviceId) {
  //       setNotFound(true);
  //       setLoading(false);
  //       return;
  //     }

  //     try {
  //       setLoading(true);
  //       const response = await getReportHeader(serviceId);
  //       if (response.exists && response.data) {
  //         setReport(response.data);
  //       } else {
  //         setNotFound(true);
  //       }
  //     } catch (err) {
  //       console.error("Failed to load report:", err);
  //       setNotFound(true);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchReport();
  // }, [serviceId]);

  // useEffect(() => {
  //   if (!report) return;

  //   const fetchTests = async () => {
  //     setTestsLoading(true);

  //     const safeFetch = async (fn: () => Promise<any>) => {
  //       try {
  //         const res = await fn();
  //         return res?.data?.data || res?.data || res || null;
  //       } catch (err) {
  //         console.warn("Test fetch error:", err);
  //         return null;
  //       }
  //     };

  //     const results = await Promise.all([
  //       report.accuracyOfOperatingPotentialId ? safeFetch(() => getAccuracyOfOperatingPotentialByTestId(report.accuracyOfOperatingPotentialId!)) : null,
  //       report.linearityOfMasLLoadingId ? safeFetch(() => getLinearityOfMasLLoadingByTestId(report.linearityOfMasLLoadingId!)) : null,
  //       report.totalFiltrationAndAluminiumId ? safeFetch(() => getTotalFiltrationAndAluminiumByTestId(report.totalFiltrationAndAluminiumId!)) : null,
  //       report.reproducibilityOfOutputId ? safeFetch(() => getReproducibilityOfOutputByTestId(report.reproducibilityOfOutputId!)) : null,
  //       report.radiationLeakageLevelId ? safeFetch(() => getRadiationLeakageLevelByTestId(report.radiationLeakageLevelId!)) : null,
  //       report.imagingPhantomId ? safeFetch(() => getImagingPhantomByTestId(report.imagingPhantomId!)) : null,
  //       report.radiationProtectionSurveyId ? safeFetch(() => getRadiationProtectionSurveyByTestId(report.radiationProtectionSurveyId!)) : null,
  //       report.equipmentSettingId ? safeFetch(() => getEquipmentSettingByTestId(report.equipmentSettingId!)) : null,
  //       report.maximumRadiationLevelId ? safeFetch(() => getMaximumRadiationLevelByTestId(report.maximumRadiationLevelId!)) : null,
  //     ]);

  //     setTestData({
  //       accuracyOfOperatingPotential: results[0],
  //       linearityOfMasLLoading: results[1],
  //       totalFiltrationAndAluminium: results[2],
  //       reproducibilityOfOutput: results[3],
  //       radiationLeakageLevel: results[4],
  //       imagingPhantom: results[5],
  //       radiationProtectionSurvey: results[6],
  //       equipmentSetting: results[7],
  //       maximumRadiationLevel: results[8],
  //     });

  //     setTestsLoading(false);
  //   };

  //   fetchTests();
  // }, [report]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB");
  };

  const downloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    try {
      const btn = document.querySelector('.download-pdf-btn') as HTMLButtonElement;
      if (btn) {
        btn.textContent = 'Generating PDF...';
        btn.disabled = true;
      }

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Mammography-Report-${report?.testReportNumber || 'report'}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Failed to generate PDF');
    } finally {
      const btn = document.querySelector('.download-pdf-btn') as HTMLButtonElement;
      if (btn) {
        btn.textContent = 'Download PDF';
        btn.disabled = false;
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Loading Report...</div>;
  if (notFound || !report) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-10 rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
        <p>Please generate the report first.</p>
        <button onClick={() => window.history.back()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg">Go Back</button>
      </div>
    </div>
  );

  return (
    // <>
    //   <div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">
    //     <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
    //       Print
    //     </button>
    //     <button onClick={downloadPDF} className="download-pdf-btn bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
    //       Download PDF
    //     </button>
    //   </div>

    //   <div id="report-content" className="bg-white">
    //     {/* Page 1 - Header */}
    //     <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:py-0">
    //       <div className="max-w-5xl mx-auto bg-white shadow-2xl print:shadow-none border print:border-0 p-10 print:p-8">

    //         <div className="flex justify-between items-center mb-8">
    //           <img src={logoA} alt="NABL" className="h-28" />
    //           <div className="text-right">
    //             <table className="text-xs border border-gray-600">
    //               <tbody>
    //                 <tr><td className="border px-3 py-1 font-bold">SRF No.</td><td className="border px-3 py-1">{report.srfNumber}</td></tr>
    //                 <tr><td className="border px-3 py-1 font-bold">SRF Date</td><td className="border px-3 py-1">{formatDate(report.srfDate)}</td></tr>
    //                 <tr><td className="border px-3 py-1 font-bold">ULR No.</td><td className="border px-3 py-1">TC9A43250001485F</td></tr>
    //               </tbody>
    //             </table>
    //           </div>
    //           <img src={logo} alt="Logo" className="h-28" />
    //         </div>

    //         <div className="text-center mb-6">
    //           <p className="text-sm">Government of India, Atomic Energy Regulatory Board</p>
    //           <p className="text-sm">Radiological Safety Division, Mumbai-400094</p>
    //         </div>

    //         <h1 className="text-center text-2xl font-bold underline mb-4">
    //           QA TEST REPORT FOR MAMMOGRAPHY EQUIPMENT
    //         </h1>

    //         <section className="mb-8">
    //           <h2 className="font-bold text-lg mb-3">1. Customer Details</h2>
    //           <div className="border-2 border-gray-600 p-5 text-lg">
    //             <p><strong>Customer:</strong> {report.customerName}</p>
    //             <p><strong>Address:</strong> {report.address}</p>
    //           </div>
    //         </section>

    //         <section className="mb-8">
    //           <h2 className="font-bold text-lg mb-3">2. Reference</h2>
    //           <table className="w-full border-2 border-gray-600 text-sm">
    //             <tbody>
    //               <tr><td className="border p-3 font-medium w-1/2">SRF No. & Date</td><td className="border p-3">{report.srfNumber} / {formatDate(report.srfDate)}</td></tr>
    //               <tr><td className="border p-3 font-medium">Test Report No. & Issue Date</td><td className="border p-3">{report.testReportNumber} / {formatDate(report.issueDate)}</td></tr>
    //             </tbody>
    //           </table>
    //         </section>

    //         <section className="mb-8">
    //           <h2 className="font-bold text-lg mb-3">3. Details of Equipment Under Test</h2>
    //           <table className="w-full border-2 border-gray-600 text-sm">
    //             <tbody>
    //               {[
    //                 ["Nomenclature", report.nomenclature],
    //                 ["Make", report.make],
    //                 ["Model", report.model],
    //                 ["Serial No.", report.slNumber],
    //                 ["Condition", report.condition],
    //                 ["Testing Procedure No.", report.testingProcedureNumber],
    //                 ["Engineer Name & RP ID", report.engineerNameRPId],
    //                 ["Test Date", formatDate(report.testDate)],
    //                 ["Due Date", formatDate(report.testDueDate)],
    //                 ["Location", report.location],
    //                 ["Temperature (°C)", report.temperature],
    //                 ["Humidity (%)", report.humidity],
    //               ].map(([l, v]) => (
    //                 <tr key={l}><td className="border p-3 font-medium w-1/2">{l}</td><td className="border p-3">{v || "-"}</td></tr>
    //               ))}
    //             </tbody>
    //           </table>
    //         </section>

    //         <section className="mb-8">
    //           <h2 className="font-bold text-lg mb-3">4. Standards / Tools Used</h2>
    //           <table className="w-full border-2 border-gray-600 text-xs">
    //             <thead className="bg-gray-200">
    //               <tr>
    //                 <th className="border p-2">Sl No.</th>
    //                 <th className="border p-2">Nomenclature</th>
    //                 <th className="border p-2">Make / Model</th>
    //                 <th className="border p-2">Sr. No.</th>
    //                 <th className="border p-2">Range</th>
    //                 <th className="border p-2">Certificate No.</th>
    //                 <th className="border p-2">Valid Till</th>
    //               </tr>
    //             </thead>
    //             <tbody>
    //               {report.toolsUsed.length > 0 ? report.toolsUsed.map((t, i) => (
    //                 <tr key={i}>
    //                   <td className="border p-2 text-center">{i + 1}</td>
    //                   <td className="border p-2">{t.nomenclature}</td>
    //                   <td className="border p-2">{t.make} / {t.model}</td>
    //                   <td className="border p-2">{t.SrNo}</td>
    //                   <td className="border p-2">{t.range}</td>
    //                   <td className="border p-2">{t.calibrationCertificateNo}</td>
    //                   <td className="border p-2">{formatDate(t.calibrationValidTill)}</td>
    //                 </tr>
    //               )) : (
    //                 <tr><td colSpan={7} className="text-center py-4 border">No tools recorded</td></tr>
    //               )}
    //             </tbody>
    //           </table>
    //         </section>

    //         <section className="mb-12">
    //           <h2 className="font-bold text-lg mb-3">5. Notes</h2>
    //           <div className="ml-8 text-sm">
    //             {report.notes.length > 0 ? report.notes.map(n => (
    //               <p key={n.slNo}><strong>{n.slNo}.</strong> {n.text}</p>
    //             )) : <p>No notes added.</p>}
    //           </div>
    //         </section>

    //         <div className="flex justify-between items-end mt-20">
    //           <img src={AntesoQRCode} alt="QR" className="h-24" />
    //           <div className="text-center">
    //             <img src={Signature} alt="Signature" className="h-20 mx-auto mb-2" />
    //             <p className="font-bold">Authorized Signatory</p>
    //           </div>
    //         </div>

    //         <footer className="text-center text-xs text-gray-600 mt-12">
    //           <p>ANTESO Biomedical Engg Pvt. Ltd.</p>
    //           <p>2nd Floor, D-290, Sector – 63, Noida, New Delhi – 110085</p>
    //           <p>Email: info@antesobiomedicalengg.com</p>
    //         </footer>
    //       </div>
    //     </div>

    //     <div className="print:break-before-page"></div>

    //     <div className="bg-white px-8 py-12 print:p-8">
    //       <div className="max-w-5xl mx-auto print:max-w-none">
    //         <h2 className="text-3xl font-bold text-center underline mb-16">DETAILED TEST RESULTS</h2>

    //         {testsLoading ? (
    //           <p className="text-center text-xl">Loading test results...</p>
    //         ) : (
    //           <>
    //             {testData.accuracyOfOperatingPotential && (
    //               <div className="mb-16 print:mb-12">
    //                 <h3 className="text-xl font-bold mb-4">1. Accuracy of Operating Potential (kVp)</h3>
    //                 <p className="text-sm text-gray-600">Table data available</p>
    //               </div>
    //             )}

    //             {testData.linearityOfMasLLoading && (
    //               <div className="mb-16 print:mb-12">
    //                 <h3 className="text-xl font-bold mb-4">2. Linearity of mAs Loading</h3>
    //                 <p className="text-sm text-gray-600">Table data available</p>
    //               </div>
    //             )}

    //             {testData.totalFiltrationAndAluminium && (
    //               <div className="mb-16 print:mb-12">
    //                 <h3 className="text-xl font-bold mb-4">3. Total Filtration & Aluminium Equivalence</h3>
    //                 <p className="text-sm text-gray-600">Table data available</p>
    //               </div>
    //             )}

    //             {testData.reproducibilityOfOutput && (
    //               <div className="mb-16 print:mb-12">
    //                 <h3 className="text-xl font-bold mb-4">4. Reproducibility of Radiation Output</h3>
    //                 <p className="text-sm text-gray-600">Table data available</p>
    //               </div>
    //             )}

    //             {testData.radiationLeakageLevel && (
    //               <div className="mb-16 print:mb-12">
    //                 <h3 className="text-xl font-bold mb-4">5. Radiation Leakage Level</h3>
    //                 <p className="text-sm text-gray-600">Table data available</p>
    //               </div>
    //             )}

    //             {testData.imagingPhantom && (
    //               <div className="mb-16 print:mb-12">
    //                 <h3 className="text-xl font-bold mb-4">6. Imaging Performance Evaluation</h3>
    //                 <p className="text-sm text-gray-600">Phantom image results</p>
    //               </div>
    //             )}

    //             {testData.radiationProtectionSurvey && (
    //               <div className="mb-16 print:mb-12">
    //                 <h3 className="text-xl font-bold mb-4">7. Radiation Protection Survey</h3>
    //                 <p className="text-sm text-gray-600">Survey results</p>
    //               </div>
    //             )}

    //             {testData.equipmentSetting && (
    //               <div className="mb-16 print:mb-12">
    //                 <h3 className="text-xl font-bold mb-4">8. Equipment Settings</h3>
    //                 <p className="text-sm text-gray-600">Settings verified</p>
    //               </div>
    //             )}

    //             {testData.maximumRadiationLevel && (
    //               <div className="mb-16 print:mb-12">
    //                 <h3 className="text-xl font-bold mb-4">9. Maximum Radiation Levels at Different Locations</h3>
    //                 <p className="text-sm text-gray-600">Leakage levels recorded</p>
    //               </div>
    //             )}
    //           </>
    //         )}
    //       </div>
    //     </div>

    //     <div className="px-8 py-12 print:p-8">
    //       <div className="max-w-5xl mx-auto print:max-w-none">
    //         <MainTestTableForMammography testData={testData} />
    //       </div>
    //     </div>
    //   </div>

    //   <style>{`
    //     @media print {
    //       body { -webkit-print-color-adjust: exact; margin: 0; }
    //       .print\\:break-before-page { page-break-before: always; }
    //       @page { margin: 1cm; size: A4; }
    //       table, tr { page-break-inside: avoid; }
    //     }
    //   `}</style>
    // </>
    <div></div>
  );
};

export default ViewServiceReportMammography;