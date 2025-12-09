// src/components/reports/ViewServiceReportMammography.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getReportHeaderForMammography,
} from "../../../../../../api";
import MainTestTableForMammography from "../../TestTables/Mammography/MainTestTableForMammogaphy";
import logo from "../../../../../../assets/logo/logo-sm.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
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
  category: string;
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

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getReportHeaderForMammography(serviceId);
        if (response.exists && response.data) {
          const data = response.data;
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Mammography Unit",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "N/A",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || [],
            category: data.category || "N/A",
            // Extract test IDs from populated objects
            accuracyOfOperatingPotentialId: data.AccuracyOfOperatingPotentialMammography?._id || null,
            linearityOfMasLLoadingId: data.LinearityOfMasLoadingMammography?._id || null,
            totalFiltrationAndAluminiumId: data.TotalFilterationAndAlluminiumMammography?._id || null,
            reproducibilityOfOutputId: data.ReproducibilityOfRadiationOutputMammography?._id || null,
            radiationLeakageLevelId: data.RadiationLeakageLevelMammography?._id || null,
            imagingPhantomId: data.ImagingPhantomMammography?._id || null,
            radiationProtectionSurveyId: data.DetailsOfRadiationProtectionMammography?._id || null,
            equipmentSettingId: data.EquipmentSettingMammography?._id || null,
            maximumRadiationLevelId: data.MaximumRadiationLevelMammography?._id || null,
          });
          
          // Set test data directly from populated objects
          setTestData({
            accuracyOfOperatingPotential: data.AccuracyOfOperatingPotentialMammography || null,
            linearityOfMasLLoading: data.LinearityOfMasLoadingMammography || null,
            totalFiltrationAndAluminium: data.TotalFilterationAndAlluminiumMammography || null,
            reproducibilityOfOutput: data.ReproducibilityOfRadiationOutputMammography || null,
            radiationLeakageLevel: data.RadiationLeakageLevelMammography || null,
            imagingPhantom: data.ImagingPhantomMammography || null,
            radiationProtectionSurvey: data.DetailsOfRadiationProtectionMammography || null,
            equipmentSetting: data.EquipmentSettingMammography || null,
            maximumRadiationLevel: data.MaximumRadiationLevelMammography || null,
          });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load report:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [serviceId]);

  // Test data is now loaded directly from getReportHeaderForMammography
  // No need for separate fetch calls

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
    <>
      <div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Print
        </button>
        <button onClick={downloadPDF} className="download-pdf-btn bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Download PDF
        </button>
      </div>

      <div id="report-content" className="bg-white">
        {/* Page 1 - Header */}
        <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:py-0">
          <div className="max-w-5xl mx-auto bg-white shadow-2xl print:shadow-none border print:border-0 p-10 print:p-8">

            <div className="flex justify-between items-center mb-8">
              <img src={logoA} alt="NABL" className="h-28" />
              <div className="text-right">
                <table className="text-xs border border-gray-600">
                  <tbody>
                    <tr><td className="border px-3 py-1 font-bold">SRF No.</td><td className="border px-3 py-1">{report.srfNumber}</td></tr>
                    <tr><td className="border px-3 py-1 font-bold">SRF Date</td><td className="border px-3 py-1">{formatDate(report.srfDate)}</td></tr>
                    <tr><td className="border px-3 py-1 font-bold">ULR No.</td><td className="border px-3 py-1">TC9A43250001485F</td></tr>
                  </tbody>
                </table>
              </div>
              <img src={logo} alt="Logo" className="h-28" />
            </div>

            <div className="text-center mb-6">
              <p className="text-sm">Government of India, Atomic Energy Regulatory Board</p>
              <p className="text-sm">Radiological Safety Division, Mumbai-400094</p>
            </div>

            <h1 className="text-center text-2xl font-bold underline mb-4">
              QA TEST REPORT FOR MAMMOGRAPHY EQUIPMENT
            </h1>

            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">1. Customer Details</h2>
              <div className="border-2 border-gray-600 p-5 text-lg">
                <p><strong>Customer:</strong> {report.customerName}</p>
                <p><strong>Address:</strong> {report.address}</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">2. Reference</h2>
              <table className="w-full border-2 border-gray-600 text-sm">
                <tbody>
                  <tr><td className="border p-3 font-medium w-1/2">SRF No. & Date</td><td className="border p-3">{report.srfNumber} / {formatDate(report.srfDate)}</td></tr>
                  <tr><td className="border p-3 font-medium">Test Report No. & Issue Date</td><td className="border p-3">{report.testReportNumber} / {formatDate(report.issueDate)}</td></tr>
                </tbody>
              </table>
            </section>

            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">3. Details of Equipment Under Test</h2>
              <table className="w-full border-2 border-gray-600 text-sm">
                <tbody>
                  {[
                    ["Nomenclature", report.nomenclature],
                    ["Make", report.make],
                    ["Model", report.model],
                    ["Serial No.", report.slNumber],
                    ["Category", report.category || "-"],
                    ["Condition", report.condition],
                    ["Testing Procedure No.", report.testingProcedureNumber],
                    ["Engineer Name & RP ID", report.engineerNameRPId],
                    ["Test Date", formatDate(report.testDate)],
                    ["Due Date", formatDate(report.testDueDate)],
                    ["Location", report.location],
                    ["Temperature (°C)", report.temperature],
                    ["Humidity (%)", report.humidity],
                  ].map(([l, v]) => (
                    <tr key={l}><td className="border p-3 font-medium w-1/2">{l}</td><td className="border p-3">{v || "-"}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">4. Standards / Tools Used</h2>
              <table className="w-full border-2 border-gray-600 text-xs">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border p-2">Sl No.</th>
                    <th className="border p-2">Nomenclature</th>
                    <th className="border p-2">Make / Model</th>
                    <th className="border p-2">Sr. No.</th>
                    <th className="border p-2">Range</th>
                    <th className="border p-2">Certificate No.</th>
                    <th className="border p-2">Valid Till</th>
                  </tr>
                </thead>
                <tbody>
                  {report.toolsUsed.length > 0 ? report.toolsUsed.map((t, i) => (
                    <tr key={i}>
                      <td className="border p-2 text-center">{i + 1}</td>
                      <td className="border p-2">{t.nomenclature}</td>
                      <td className="border p-2">{t.make} / {t.model}</td>
                      <td className="border p-2">{t.SrNo}</td>
                      <td className="border p-2">{t.range}</td>
                      <td className="border p-2">{t.calibrationCertificateNo}</td>
                      <td className="border p-2">{formatDate(t.calibrationValidTill)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="text-center py-4 border">No tools recorded</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="mb-12">
              <h2 className="font-bold text-lg mb-3">5. Notes</h2>
              <div className="ml-8 text-sm">
                {report.notes.length > 0 ? report.notes.map(n => (
                  <p key={n.slNo}><strong>{n.slNo}.</strong> {n.text}</p>
                )) : <p>No notes added.</p>}
              </div>
            </section>

            <div className="flex justify-between items-end mt-20">
              <img src={AntesoQRCode} alt="QR" className="h-24" />
              <div className="text-center">
                <img src={Signature} alt="Signature" className="h-20 mx-auto mb-2" />
                <p className="font-bold">Authorized Signatory</p>
              </div>
            </div>

            <footer className="text-center text-xs text-gray-600 mt-12">
              <p>ANTESO Biomedical Engg Pvt. Ltd.</p>
              <p>2nd Floor, D-290, Sector – 63, Noida, New Delhi – 110085</p>
              <p>Email: info@antesobiomedicalengg.com</p>
            </footer>
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-12 print:p-8 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <MainTestTableForMammography testData={testData} />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-12 print:p-8 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none">
            <h2 className="text-3xl font-bold text-center underline mb-16">DETAILED TEST RESULTS</h2>

            {/* 1. Accuracy of Operating Potential (kVp) */}
            {testData.accuracyOfOperatingPotential && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">1. Accuracy of Operating Potential (kVp)</h3>
                
                {testData.accuracyOfOperatingPotential.mAStations && testData.accuracyOfOperatingPotential.mAStations.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th rowSpan={2} className="border border-black p-3">Applied kVp</th>
                          <th colSpan={testData.accuracyOfOperatingPotential.mAStations.length} className="border border-black p-3">
                            Measured kVp
                          </th>
                          <th rowSpan={2} className="border border-black p-3">Average kVp</th>
                          <th rowSpan={2} className="border border-black p-3">Remarks</th>
                        </tr>
                        <tr>
                          {testData.accuracyOfOperatingPotential.mAStations.map((station: string, idx: number) => (
                            <th key={idx} className="border border-black p-2">{station}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {testData.accuracyOfOperatingPotential.measurements?.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 font-semibold">{row.appliedKvp || "-"}</td>
                            {testData.accuracyOfOperatingPotential.mAStations.map((_: string, idx: number) => (
                              <td key={idx} className="border border-black p-3">
                                {row.measuredValues?.[idx] || "-"}
                              </td>
                            ))}
                            <td className="border border-black p-3 font-bold bg-blue-50">{row.averageKvp || "-"}</td>
                            <td className="border border-black p-3 font-bold">
                              <span className={row.remarks === "PASS" || row.remarks === "Pass" ? "text-green-600" : row.remarks === "FAIL" || row.remarks === "Fail" ? "text-red-600" : ""}>
                                {row.remarks || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.accuracyOfOperatingPotential.tolerance && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm">
                      <strong>Tolerance:</strong> {testData.accuracyOfOperatingPotential.tolerance.sign || "±"} {testData.accuracyOfOperatingPotential.tolerance.value || "-"}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. Linearity of mAs Loading */}
            {testData.linearityOfMasLLoading && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">2. Linearity of mAs Loading</h3>
                
                {testData.linearityOfMasLLoading.exposureCondition && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <p className="font-semibold mb-2">Test Conditions:</p>
                    <div className="text-sm">
                      FCD: {testData.linearityOfMasLLoading.exposureCondition.fcd || "-"} cm | 
                      kV: {testData.linearityOfMasLLoading.exposureCondition.kv || "-"}
                    </div>
                  </div>
                )}

                {testData.linearityOfMasLLoading.measurementHeaders && testData.linearityOfMasLLoading.measurements && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">mAs Range</th>
                          {testData.linearityOfMasLLoading.measurementHeaders.map((header: string, idx: number) => (
                            <th key={idx} className="border border-black p-3">{header}</th>
                          ))}
                          <th className="border border-black p-3 bg-blue-100">Average</th>
                          <th className="border border-black p-3 bg-yellow-100">X (mGy/mAs)</th>
                          <th className="border border-black p-3">X Max</th>
                          <th className="border border-black p-3">X Min</th>
                          <th className="border border-black p-3">CoL</th>
                          <th className="border border-black p-3 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.linearityOfMasLLoading.measurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 font-semibold">{row.mAsRange || "-"}</td>
                            {testData.linearityOfMasLLoading.measurementHeaders.map((_: string, idx: number) => (
                              <td key={idx} className="border border-black p-3">
                                {row.measuredOutputs?.[idx] || "-"}
                              </td>
                            ))}
                            <td className="border border-black p-3 font-bold bg-blue-50">{row.average || "-"}</td>
                            <td className="border border-black p-3">{row.x || "-"}</td>
                            <td className="border border-black p-3">{row.xMax || "-"}</td>
                            <td className="border border-black p-3">{row.xMin || "-"}</td>
                            <td className="border border-black p-3 font-semibold">{row.col || "-"}</td>
                            <td className="border border-black p-3 font-bold">
                              <span className={row.remarks === "Pass" || row.remarks === "PASS" ? "text-green-600" : row.remarks === "Fail" || row.remarks === "FAIL" ? "text-red-600" : ""}>
                                {row.remarks || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.linearityOfMasLLoading.tolerance && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm">
                      <strong>Tolerance (CoL):</strong> ≤ {testData.linearityOfMasLLoading.tolerance || "0.1"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Total Filtration & Aluminium Equivalence */}
            {testData.totalFiltrationAndAluminium && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">3. Total Filtration & Aluminium Equivalence</h3>
                
                {(testData.totalFiltrationAndAluminium.targetWindow || testData.totalFiltrationAndAluminium.addedFilterThickness) && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <p className="font-semibold mb-2">Anode/Filter & Added Filtration:</p>
                    <div className="text-sm">
                      <p><strong>Target/Window:</strong> {testData.totalFiltrationAndAluminium.targetWindow || "-"}</p>
                      {testData.totalFiltrationAndAluminium.addedFilterThickness && (
                        <p><strong>Added Filter Thickness:</strong> {testData.totalFiltrationAndAluminium.addedFilterThickness}</p>
                      )}
                    </div>
                  </div>
                )}

                {testData.totalFiltrationAndAluminium.table && testData.totalFiltrationAndAluminium.table.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">kVp</th>
                          <th className="border border-black p-3">mAs</th>
                          <th className="border border-black p-3">Al Equivalence (mm Al)</th>
                          <th className="border border-black p-3">HVT (mm Al)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.totalFiltrationAndAluminium.table.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3">{row.kvp || "-"}</td>
                            <td className="border border-black p-3">{row.mAs || "-"}</td>
                            <td className="border border-black p-3">{row.alEquivalence || "-"}</td>
                            <td className="border border-black p-3">{row.hvt || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.totalFiltrationAndAluminium.resultHVT28kVp && (
                  <div className="bg-gray-50 p-4 rounded border mb-4">
                    <p className="text-sm">
                      <strong>Result HVT at 28 kVp:</strong> {testData.totalFiltrationAndAluminium.resultHVT28kVp} mm Al
                    </p>
                  </div>
                )}

                {testData.totalFiltrationAndAluminium.hvlTolerances && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm font-semibold mb-2">Recommended HVL Tolerances:</p>
                    <div className="text-sm space-y-1">
                      <p>At 30 kVp: {testData.totalFiltrationAndAluminium.hvlTolerances.at30?.operator || ">="} {testData.totalFiltrationAndAluminium.hvlTolerances.at30?.value || "-"} mm Al</p>
                      <p>At 40 kVp: {testData.totalFiltrationAndAluminium.hvlTolerances.at40?.operator || ">="} {testData.totalFiltrationAndAluminium.hvlTolerances.at40?.value || "-"} mm Al</p>
                      <p>At 50 kVp: {testData.totalFiltrationAndAluminium.hvlTolerances.at50?.operator || ">="} {testData.totalFiltrationAndAluminium.hvlTolerances.at50?.value || "-"} mm Al</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Reproducibility of Radiation Output */}
            {testData.reproducibilityOfOutput && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">4. Reproducibility of Radiation Output</h3>
                
                {testData.reproducibilityOfOutput.outputRows && testData.reproducibilityOfOutput.outputRows.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">kV</th>
                          <th className="border border-black p-3">mAs</th>
                          {testData.reproducibilityOfOutput.outputRows[0]?.outputs && testData.reproducibilityOfOutput.outputRows[0].outputs.length > 0 && (
                            <>
                              {testData.reproducibilityOfOutput.outputRows[0].outputs.map((_: any, idx: number) => (
                                <th key={idx} className="border border-black p-3">Meas {idx + 1}</th>
                              ))}
                            </>
                          )}
                          <th className="border border-black p-3 bg-blue-100">Average</th>
                          <th className="border border-black p-3 bg-green-100">CV % / Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.reproducibilityOfOutput.outputRows.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 font-semibold">{row.kv || "-"}</td>
                            <td className="border border-black p-3">{row.mas || "-"}</td>
                            {row.outputs && row.outputs.map((output: any, idx: number) => (
                              <td key={idx} className="border border-black p-3">{output.value || "-"}</td>
                            ))}
                            <td className="border border-black p-3 font-bold bg-blue-50">{row.avg || "-"}</td>
                            <td className="border border-black p-3 font-bold">
                              <span className={row.remark?.includes("Pass") || row.remark?.includes("PASS") ? "text-green-600" : row.remark?.includes("Fail") || row.remark?.includes("FAIL") ? "text-red-600" : ""}>
                                {row.remark || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.reproducibilityOfOutput.tolerance && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm">
                      <strong>Acceptance Criteria:</strong> CV {testData.reproducibilityOfOutput.tolerance.operator || "<="} {testData.reproducibilityOfOutput.tolerance.value || "5.0"}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 5. Radiation Leakage Level */}
            {testData.radiationLeakageLevel && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">5. Radiation Leakage Level (5 cm from Tube Housing)</h3>
                
                {(testData.radiationLeakageLevel.distanceFromFocus || testData.radiationLeakageLevel.kv || testData.radiationLeakageLevel.ma || testData.radiationLeakageLevel.time) && (
                  <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <p className="font-semibold mb-2">Test Conditions:</p>
                    <div className="text-sm grid grid-cols-4 gap-4">
                      <p><strong>Distance:</strong> {testData.radiationLeakageLevel.distanceFromFocus || "-"} cm</p>
                      <p><strong>kV:</strong> {testData.radiationLeakageLevel.kv || "-"}</p>
                      <p><strong>mA:</strong> {testData.radiationLeakageLevel.ma || "-"}</p>
                      <p><strong>Time:</strong> {testData.radiationLeakageLevel.time || "-"} s</p>
                    </div>
                  </div>
                )}

                {testData.radiationLeakageLevel.leakageLocations && testData.radiationLeakageLevel.leakageLocations.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Location</th>
                          <th className="border border-black p-3">Left</th>
                          <th className="border border-black p-3">Right</th>
                          <th className="border border-black p-3">Front</th>
                          <th className="border border-black p-3">Back</th>
                          <th className="border border-black p-3">Top</th>
                          <th className="border border-black p-3">Max</th>
                          <th className="border border-black p-3">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.radiationLeakageLevel.leakageLocations.map((location: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 font-semibold">{location.location || "-"}</td>
                            {location.measurements && location.measurements.map((meas: any, idx: number) => (
                              <td key={idx} className="border border-black p-3">{meas.value || "-"}</td>
                            ))}
                            <td className="border border-black p-3 font-bold">{location.max || "-"}</td>
                            <td className="border border-black p-3 font-bold">
                              <span className={location.resultMR === "Pass" || location.resultMGy === "Pass" ? "text-green-600" : location.resultMR === "Fail" || location.resultMGy === "Fail" ? "text-red-600" : ""}>
                                {location.resultMR || location.resultMGy || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {(testData.radiationLeakageLevel.highestLeakageMR || testData.radiationLeakageLevel.highestLeakageMGy) && (
                  <div className="bg-gray-50 p-4 rounded border mb-4">
                    <p className="text-sm">
                      <strong>Highest Leakage:</strong> {testData.radiationLeakageLevel.highestLeakageMR || testData.radiationLeakageLevel.highestLeakageMGy || "-"}
                    </p>
                  </div>
                )}

                {testData.radiationLeakageLevel.finalRemark && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm font-bold">
                      <strong>Final Remark:</strong> 
                      <span className={testData.radiationLeakageLevel.finalRemark === "Pass" ? "text-green-600 ml-2" : testData.radiationLeakageLevel.finalRemark === "Fail" ? "text-red-600 ml-2" : ""}>
                        {testData.radiationLeakageLevel.finalRemark}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 6. Imaging Performance Evaluation */}
            {testData.imagingPhantom && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">6. Imaging Performance Evaluation (Phantom)</h3>
                
                {testData.imagingPhantom.rows && testData.imagingPhantom.rows.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Phantom Element</th>
                          <th className="border border-black p-3">Visible Count</th>
                          <th className="border border-black p-3">Tolerance</th>
                          <th className="border border-black p-3 bg-green-100">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.imagingPhantom.rows.map((row: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 font-semibold">{row.name || "-"}</td>
                            <td className="border border-black p-3">{row.visibleCount || "-"}</td>
                            <td className="border border-black p-3">
                              {row.tolerance?.operator || ">="} {row.tolerance?.value || "-"}
                            </td>
                            <td className="border border-black p-3 font-bold">
                              <span className={testData.imagingPhantom.remark === "Pass" ? "text-green-600" : "text-red-600"}>
                                {testData.imagingPhantom.remark || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 7. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">7. Radiation Protection Survey</h3>
                
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-2 border-black text-sm">
                    <tbody>
                      <tr>
                        <td className="border border-black p-3 font-medium w-1/2">Survey Date</td>
                        <td className="border border-black p-3">{testData.radiationProtectionSurvey.surveyDate ? formatDate(testData.radiationProtectionSurvey.surveyDate) : "-"}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-3 font-medium">Valid Calibration Certificate</td>
                        <td className="border border-black p-3">{testData.radiationProtectionSurvey.hasValidCalibration || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 8. Equipment Settings */}
            {testData.equipmentSetting && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">8. Equipment Settings Verification</h3>
                
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-2 border-black text-sm">
                    <tbody>
                      {[
                        ["Applied Current", testData.equipmentSetting.appliedCurrent],
                        ["Applied Voltage", testData.equipmentSetting.appliedVoltage],
                        ["Exposure Time", testData.equipmentSetting.exposureTime],
                        ["Focal Spot Size", testData.equipmentSetting.focalSpotSize],
                        ["Filtration", testData.equipmentSetting.filtration],
                        ["Collimation", testData.equipmentSetting.collimation],
                        ["Frame Rate", testData.equipmentSetting.frameRate],
                        ["Pulse Width", testData.equipmentSetting.pulseWidth],
                      ].map(([label, value]) => (
                        <tr key={label}>
                          <td className="border border-black p-3 font-medium w-1/2">{label}</td>
                          <td className="border border-black p-3">{value || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 9. Maximum Radiation Levels */}
            {testData.maximumRadiationLevel && (
              <div className="mb-16 print:mb-12 print:break-inside-avoid test-section">
                <h3 className="text-xl font-bold mb-6">9. Maximum Radiation Levels at Different Locations</h3>
                
                {testData.maximumRadiationLevel.readings && testData.maximumRadiationLevel.readings.length > 0 && (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-2 border-black text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-3">Location</th>
                          <th className="border border-black p-3">Measured Radiation Level (mR/hr)</th>
                          <th className="border border-black p-3 bg-green-100">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.maximumRadiationLevel.readings.map((reading: any, i: number) => (
                          <tr key={i} className="text-center">
                            <td className="border border-black p-3 font-semibold text-left">{reading.location || "-"}</td>
                            <td className="border border-black p-3">{reading.mRPerHr || "-"}</td>
                            <td className="border border-black p-3 font-bold">
                              <span className={reading.result === "Pass" ? "text-green-600" : reading.result === "Fail" ? "text-red-600" : ""}>
                                {reading.result || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.maximumRadiationLevel.maxWeeklyDose && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <p className="text-sm">
                      <strong>Maximum Radiation Level/week:</strong> {testData.maximumRadiationLevel.maxWeeklyDose} mR/wk
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .print\\:break-before-page { page-break-before: always; }
          .print\\:break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          .test-section { page-break-inside: avoid; break-inside: avoid; }
          @page { margin: 1cm; size: A4; }
          table, tr, td, th { 
            page-break-inside: avoid; 
            break-inside: avoid;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          thead { display: table-header-group; }
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportMammography;