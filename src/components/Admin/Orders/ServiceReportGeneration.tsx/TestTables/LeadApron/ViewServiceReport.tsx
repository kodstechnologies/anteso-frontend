// src/components/reports/ViewServiceReportLeadApron.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForLeadApron, getLeadApronTestByTestId } from "../../../../../../api";
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
  certificate?: string;
  uncertainity?: string;
}

interface Note {
  slNo: string;
  text: string;
}

interface ReportData {
  customerName: string;
  address: string;
  srfNumber: string;
  srfDate: string;
  testReportNumber: string;
  issueDate: string;
  nomenclature: string;
  category?: string;
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
  toolsUsed?: Tool[];
  notes?: Note[];
  LeadApronTest?: any;
}

// Default notes to use if none are provided
const defaultNotes: Note[] = [
  { slNo: "5.1", text: "The Test Report relates only to the above item only." },
  {
    slNo: "5.2",
    text: "Publication or reproduction of this Certificate in any form other than by complete set of the whole report & in the language written, is not permitted without the written consent of ABPL.",
  },
  { slNo: "5.3", text: "Corrections/erasing invalidates the Test Report." },
  {
    slNo: "5.4",
    text: "Referred standard for Testing: AERB Test Protocol 2016 - AERB/RF-MED/SC-3 (Rev. 2) Quality Assurance Formats.",
  },
  { slNo: "5.5", text: "Any error in this Report should be brought to our knowledge within 30 days from the date of this report." },
  { slNo: "5.6", text: "Results reported are valid at the time of and under the stated conditions of measurements." },
  { slNo: "5.7", text: "Name, Address & Contact detail is provided by Customer." },
];

const ViewServiceReportLeadApron: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getReportHeaderForLeadApron(serviceId);
        console.log("Lead Apron Report Header Response:", response);

        if (response?.exists && response?.data) {
          const data = response.data;
          const processedData: ReportData = {
            ...data,
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
          };
          setReport(processedData);

          // Fetch test data if testId exists
          if (data.LeadApronTest?._id || data.LeadApronTest) {
            const testId = data.LeadApronTest._id || data.LeadApronTest;
            try {
              const testResponse = await getLeadApronTestByTestId(testId);
              if (testResponse?.data) {
                setTestData(testResponse.data);
              }
            } catch (err) {
              console.error("Failed to load test data:", err);
            }
          }
        } else {
          console.log("Report not found or doesn't exist:", response);
          setNotFound(true);
        }
      } catch (err: any) {
        console.error("Failed to load report:", err);
        console.error("Error details:", err?.response?.data);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [serviceId]);

  const downloadPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;

    const originalButton = document.querySelector(".download-pdf-btn") as HTMLButtonElement;
    if (originalButton) {
      originalButton.disabled = true;
      originalButton.textContent = "Generating PDF...";
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Lead_Apron_Report_${report?.testReportNumber || "Report"}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      if (originalButton) {
        originalButton.disabled = false;
        originalButton.textContent = "Download PDF";
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">
        Loading Report...
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please save the report header first.</p>
          <button onClick={() => window.history.back()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <>
      {/* PDF Download & Print Buttons */}
      <div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl"
        >
          Print
        </button>
        <button
          onClick={downloadPDF}
          className="download-pdf-btn bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl"
        >
          Download PDF
        </button>
      </div>

      {/* Main Report Content */}
      <div id="report-content" className="bg-white p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 pb-4">
          <div>
            <img src={logo} alt="Logo" className="h-16" />
          </div>
          <div className="text-right">
            <img src={logoA} alt="NABL Logo" className="h-16 mx-auto mb-2" />
            <p className="text-xs">NABL Accredited</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-8">Lead Apron Test Report</h1>

        {/* Customer Info */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Name and Address of Customer</h2>
          <p className="mb-1"><strong>Customer Name:</strong> {report.customerName || "—"}</p>
          <p><strong>Address:</strong> {report.address || "—"}</p>
        </div>

        {/* Reference */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">2. Customer Reference</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1"><strong>2.1 SRF Number:</strong> {report.srfNumber || "—"}</p>
              <p><strong>SRF Date:</strong> {formatDate(report.srfDate) || "—"}</p>
            </div>
            <div>
              <p className="mb-1"><strong>2.2 Test Report Number:</strong> {report.testReportNumber || "—"}</p>
              <p><strong>Issue Date:</strong> {formatDate(report.issueDate) || "—"}</p>
            </div>
          </div>
        </div>

        {/* Device Details */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">3. Details of Device Under Test</h2>
          <div className="grid grid-cols-3 gap-4">
            <p><strong>Nomenclature:</strong> {report.nomenclature || "—"}</p>
            <p><strong>Make:</strong> {report.make || "—"}</p>
            <p><strong>Model:</strong> {report.model || "—"}</p>
            <p><strong>Serial Number:</strong> {report.slNumber || "—"}</p>
            <p><strong>Condition:</strong> {report.condition || "—"}</p>
            <p><strong>Testing Procedure Number:</strong> {report.testingProcedureNumber || "—"}</p>
            <p><strong>Test Date:</strong> {formatDate(report.testDate) || "—"}</p>
            <p><strong>Test Due Date:</strong> {formatDate(report.testDueDate) || "—"}</p>
            <p><strong>Location:</strong> {report.location || "—"}</p>
            <p><strong>Temperature:</strong> {report.temperature || "—"} °C</p>
            <p><strong>Humidity:</strong> {report.humidity || "—"} %</p>
          </div>
        </div>

        {/* Lead Apron Test Data */}


        {/* Tools Used */}
        {report.toolsUsed && report.toolsUsed.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">4. Standards Used</h2>
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Sl. No.</th>
                  <th className="border p-2">Nomenclature</th>
                  <th className="border p-2">Make</th>
                  <th className="border p-2">Model</th>
                  <th className="border p-2">Sr. No.</th>
                  <th className="border p-2">Range</th>
                  <th className="border p-2">Calibration Certificate No.</th>
                  <th className="border p-2">Calibration Valid Till</th>
                </tr>
              </thead>
              <tbody>
                {report.toolsUsed.map((tool, index) => (
                  <tr key={index}>
                    <td className="border p-2 text-center">{tool.slNumber || index + 1}</td>
                    <td className="border p-2">{tool.nomenclature || "—"}</td>
                    <td className="border p-2">{tool.make || "—"}</td>
                    <td className="border p-2">{tool.model || "—"}</td>
                    <td className="border p-2">{tool.SrNo || "—"}</td>
                    <td className="border p-2">{tool.range || "—"}</td>
                    <td className="border p-2">{tool.calibrationCertificateNo || "—"}</td>
                    <td className="border p-2">{tool.calibrationValidTill || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">5. Notes</h2>
          <ul className="list-decimal list-inside space-y-2">
            {(report.notes || defaultNotes).map((note, index) => (
              <li key={index} className="text-sm">
                <strong>{note.slNo}</strong> {note.text}
              </li>
            ))}
          </ul>
        </div>
        {/* Lead Apron Test Results */}
        {testData && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">6. Lead Apron Test Results</h2>
            
            {/* Report Details Table */}
            {testData.reportDetails && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">6.1 Report Details</h3>
                <table className="w-full border-collapse border mb-4">
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium bg-gray-50 w-1/3">Institution Name</td>
                      <td className="border p-2">{testData.reportDetails.institutionName || "—"}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-gray-50">Institution City</td>
                      <td className="border p-2">{testData.reportDetails.institutionCity || "—"}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-gray-50">Equipment Type</td>
                      <td className="border p-2">{testData.reportDetails.equipmentType || "—"}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-gray-50">Equipment ID</td>
                      <td className="border p-2">{testData.reportDetails.equipmentId || "—"}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-gray-50">Person Testing</td>
                      <td className="border p-2">{testData.reportDetails.personTesting || "—"}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-gray-50">Service Agency</td>
                      <td className="border p-2">{testData.reportDetails.serviceAgency || "—"}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-gray-50">Test Date</td>
                      <td className="border p-2">{formatDate(testData.reportDetails.testDate) || "—"}</td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium bg-gray-50">Test Duration</td>
                      <td className="border p-2">{testData.reportDetails.testDuration || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Operating Parameters Table */}
            {testData.operatingParameters && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">6.2 Operating Parameters: Tested on Direct Radiation</h3>
                <table className="w-full border-collapse border mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">FFD (cm)</th>
                      <th className="border p-2 text-left">kV</th>
                      <th className="border p-2 text-left">mAs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 text-center">{testData.operatingParameters.ffd || "—"}</td>
                      <td className="border p-2 text-center">{testData.operatingParameters.kv || "—"}</td>
                      <td className="border p-2 text-center">{testData.operatingParameters.mas || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Dose Measurements Table */}
            {testData.doseMeasurements && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">6.3 Dose Value and Reading</h3>
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Dose Value</th>
                      <th className="border p-2 text-center">Reading</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium">Neutral</td>
                      <td className="border p-2 text-center">{testData.doseMeasurements.neutral || "—"}</td>
                    </tr>
                    {/* Dynamic Positions - handle both old format (position1/2/3) and new format (positions array) */}
                    {testData.doseMeasurements.positions && Array.isArray(testData.doseMeasurements.positions) && testData.doseMeasurements.positions.length > 0 ? (
                      // New format: positions array
                      testData.doseMeasurements.positions.map((pos: any, index: number) => (
                        <tr key={index}>
                          <td className="border p-2 font-medium">{pos.position || `Position ${index + 1}`}</td>
                          <td className="border p-2 text-center">{pos.value || "—"}</td>
                        </tr>
                      ))
                    ) : (
                      // Old format: position1, position2, position3 (backward compatibility)
                      <>
                        {testData.doseMeasurements.position1 && (
                          <tr>
                            <td className="border p-2 font-medium">Position 1</td>
                            <td className="border p-2 text-center">{testData.doseMeasurements.position1}</td>
                          </tr>
                        )}
                        {testData.doseMeasurements.position2 && (
                          <tr>
                            <td className="border p-2 font-medium">Position 2</td>
                            <td className="border p-2 text-center">{testData.doseMeasurements.position2}</td>
                          </tr>
                        )}
                        {testData.doseMeasurements.position3 && (
                          <tr>
                            <td className="border p-2 font-medium">Position 3</td>
                            <td className="border p-2 text-center">{testData.doseMeasurements.position3}</td>
                          </tr>
                        )}
                      </>
                    )}
                    <tr className="bg-gray-50">
                      <td className="border p-2 font-semibold">Average Value</td>
                      <td className="border p-2 text-center font-semibold">{testData.doseMeasurements.averageValue || "—"}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border p-2 font-semibold">% Reduction in Dose (Remark)</td>
                      <td className="border p-2 text-center">
                        <span className="font-semibold">{testData.doseMeasurements.percentReduction ? `${testData.doseMeasurements.percentReduction}%` : "—"}</span>
                        {testData.doseMeasurements.remark && (
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${testData.doseMeasurements.remark.includes('Pass')
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {testData.doseMeasurements.remark}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Footer */}
        <div className="mt-12 flex justify-between items-end">
          <div className="text-center">
            <img src={Signature} alt="Signature" className="h-16 mb-2" />
            <p className="font-semibold">{report.engineerNameRPId || "Engineer Name"}</p>
            <p className="text-sm">Service Engineer</p>
          </div>
          <div className="text-center">
            <img src={AntesoQRCode} alt="QR Code" className="h-20" />
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewServiceReportLeadApron;

