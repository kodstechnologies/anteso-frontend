// src/components/reports/ViewServiceReportCTScan.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForCTScan } from "../../../../../../api";
import MainTestTableForCTScan from "./MainTestTableForCTScan";
import MechanicalTestSummary from "./MechanicalTestSummary";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF, estimateReportPages } from "../../../../../../utils/generatePDF";

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

interface Note {
  slNo: string;
  text: string;
}

interface ReportData {
  customerName: string;
  address: string;
  srfNumber: string;
  srfDate: string;
  reportULRNumber?: string;
  testReportNumber: string;
  issueDate: string;
  nomenclature: string;
  make: string;
  model: string;
  slNumber: string;
  condition: string;
  testingProcedureNumber: string;
  engineerNameRPId: string;
  rpId?: string;
  testDate: string;
  testDueDate: string;
  location: string;
  temperature: string;
  humidity: string;
  toolsUsed?: Tool[];
  notes?: Note[];
  pages?: string;

  // Test documents from populated response
  RadiationProfileWidthForCTScan?: any;
  MeasurementOfOperatingPotential?: any;
  TimerAccuracy?: any;
  MeasurementOfMaLinearity?: any;
  MeasurementOfCTDI?: any;
  TotalFilterationForCTScan?: any;
  RadiationLeakageLevel?: any;
  MeasureMaxRadiationLevel?: any;
  OutputConsistency?: any;
  lowContrastResolutionForCTScan?: any;
  HighContrastResolutionForCTScan?: any;
  RadiationProtectionSurveyCTScan?: any;
}

const defaultNotes: Note[] = [
  { slNo: "5.1", text: "The Test Report relates only to the above item only." },
  { slNo: "5.2", text: "Publication or reproduction of this Certificate in any form other than by complete set of the whole report & in the language written, is not permitted without the written consent of ABPL." },
  { slNo: "5.3", text: "Corrections/erasing invalidates the Test Report." },
  { slNo: "5.4", text: "Referred standard for Testing: AERB Test Protocol 2016 - AERB/RF-MED/SC-3 (Rev. 2) Quality Assurance Formats." },
  { slNo: "5.5", text: "Any error in this Report should be brought to our knowledge within 30 days from the date of this report." },
  { slNo: "5.6", text: "Results reported are valid at the time of and under the stated conditions of measurements." },
  { slNo: "5.7", text: "Name, Address & Contact detail is provided by Customer." },
];

const ViewServiceReportCTScan: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const tubeIdParam = searchParams.get("tubeId"); // Get tubeId from URL: 'A', 'B', 'null', or null

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [testDataTubeA, setTestDataTubeA] = useState<any>({});
  const [testDataTubeB, setTestDataTubeB] = useState<any>({});
  const [isDoubleTube, setIsDoubleTube] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Check if it's a double tube setup
        const savedTubeType = localStorage.getItem(`ctscan_tube_type_${serviceId}`);
        const doubleTube = savedTubeType === 'double';
        setIsDoubleTube(doubleTube);

        // Always fetch single tube data (tubeId = null) for common tests and header
        const response = await getReportHeaderForCTScan(serviceId, null);

        if (response?.exists && response?.data) {
          const data = response.data;
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            reportULRNumber: data.reportULRNumber || "N/A",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Computed Tomography",
            make: data.make || "N/A",
            model: data.model || "N/A",
            slNumber: data.slNumber || "N/A",
            condition: data.condition || "OK",
            testingProcedureNumber: data.testingProcedureNumber || "N/A",
            engineerNameRPId: data.engineerNameRPId || "N/A",
            rpId: data.rpId || "N/A",
            testDate: data.testDate || "",
            testDueDate: data.testDueDate || "",
            location: data.location || "N/A",
            temperature: data.temperature || "",
            humidity: data.humidity || "",
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
            pages: data.pages ?? "",
          });

          if (doubleTube) {
            // Fetch both Tube A and Tube B data
            const [responseA, responseB] = await Promise.all([
              getReportHeaderForCTScan(serviceId, 'A'),
              getReportHeaderForCTScan(serviceId, 'B'),
            ]);

            // Extract test data for Tube A
            if (responseA?.exists && responseA?.data) {
              const dataA = responseA.data;
              setTestDataTubeA({
                radiationProfile: dataA.RadiationProfileWidthForCTScan || null,
                operatingPotential: dataA.MeasurementOfOperatingPotential || null,
                maLinearity: dataA.MeasurementOfMaLinearity || null,
                timerAccuracy: dataA.TimerAccuracy || null,
                ctdi: dataA.MeasurementOfCTDI || null,
                totalFiltration: dataA.TotalFilterationForCTScan || null,
                leakage: dataA.RadiationLeakageLevel || null,
                measureMaxRadiationLevel: dataA.MeasureMaxRadiationLevel || null,
                outputConsistency: dataA.OutputConsistency || null,
                lowContrastResolution: dataA.lowContrastResolutionForCTScan || null,
                highContrastResolution: dataA.HighContrastResolutionForCTScan || null,
                radiationProtectionSurvey: dataA.RadiationProtectionSurveyCTScan || null,
              });
            }

            // Extract test data for Tube B
            if (responseB?.exists && responseB?.data) {
              const dataB = responseB.data;
              setTestDataTubeB({
                radiationProfile: dataB.RadiationProfileWidthForCTScan || null,
                operatingPotential: dataB.MeasurementOfOperatingPotential || null,
                maLinearity: dataB.MeasurementOfMaLinearity || null,
                timerAccuracy: dataB.TimerAccuracy || null,
                ctdi: dataB.MeasurementOfCTDI || null,
                totalFiltration: dataB.TotalFilterationForCTScan || null,
                leakage: dataB.RadiationLeakageLevel || null,
                measureMaxRadiationLevel: dataB.MeasureMaxRadiationLevel || null,
                outputConsistency: dataB.OutputConsistency || null,
                lowContrastResolution: dataB.lowContrastResolutionForCTScan || null,
                highContrastResolution: dataB.HighContrastResolutionForCTScan || null,
                radiationProtectionSurvey: dataB.RadiationProtectionSurveyCTScan || null,
              });
            }

            // Set combined test data for summary (common tests only) + high contrast & radiation survey from initial fetch (often tubeId null)
            setTestData({
              alignmentOfTableGantry: data.AlignmentOfTableGantryCTScan || null,
              tablePosition: data.TablePositionCTScan || null,
              gantryTilt: data.GantryTiltCTScan || null,
              highContrastResolution: data.HighContrastResolutionForCTScan || null,
              radiationProtectionSurvey: data.RadiationProtectionSurveyCTScan || null,
            });
          } else {
            // Single tube - use the response data
            setTestData({
              radiationProfile: data.RadiationProfileWidthForCTScan || null,
              operatingPotential: data.MeasurementOfOperatingPotential || null,
              maLinearity: data.MeasurementOfMaLinearity || null,
              timerAccuracy: data.TimerAccuracy || null,
              ctdi: data.MeasurementOfCTDI || null,
              totalFiltration: data.TotalFilterationForCTScan || null,
              leakage: data.RadiationLeakageLevel || null,
              measureMaxRadiationLevel: data.MeasureMaxRadiationLevel || null,
              outputConsistency: data.OutputConsistency || null,
              lowContrastResolution: data.lowContrastResolutionForCTScan || null,
              highContrastResolution: data.HighContrastResolutionForCTScan || null,
              radiationProtectionSurvey: data.RadiationProtectionSurveyCTScan || null,
              alignmentOfTableGantry: data.AlignmentOfTableGantryCTScan || null,
              tablePosition: data.TablePositionCTScan || null,
              gantryTilt: data.GantryTiltCTScan || null,
            });
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load CT Scan report:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [serviceId]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));

  // Helper function to get criteria text based on applied value for Radiation Profile Width
  const getRadiationProfileCriteria = (applied: string | number, index?: number): string => {
    // If index is provided (0, 1, 2), use fixed labels from generator
    if (index !== undefined) {
      if (index === 0) return "a. Less than 1.0 mm";
      if (index === 1) return "b. 1.0 mm to 2.0 mm";
      if (index === 2) return "c. Above 2.0 mm";
    }

    const appliedNum = typeof applied === 'string' ? parseFloat(applied) : applied;
    if (isNaN(appliedNum) || appliedNum <= 0) return "-";

    if (appliedNum < 1.0) {
      return "a. Less than 1.0 mm";
    } else if (appliedNum >= 1.0 && appliedNum <= 2.0) {
      return "b. 1.0 mm to 2.0 mm";
    } else {
      return "c. Above 2.0 mm";
    }
  };

  // Helper function to calculate tolerance based on applied value for Radiation Profile Width
  const getRadiationProfileTolerance = (applied: string | number, index?: number): string => {
    // If index is provided (0, 1, 2), use fixed labels from generator
    if (index !== undefined) {
      if (index === 0) return "0.5 mm";
      if (index === 1) return "Â±50%";
      if (index === 2) return "Â±1.0 mm";
    }

    const appliedNum = typeof applied === 'string' ? parseFloat(applied) : applied;
    if (isNaN(appliedNum) || appliedNum <= 0) return "-";

    if (appliedNum < 1.0) {
      return "0.5 mm";
    } else if (appliedNum >= 1.0 && appliedNum <= 2.0) {
      return "Â±50%";
    } else {
      return "Â±1.0 mm";
    }
  };

  // Helper function to format Operating Potential tolerance
  const formatOperatingPotentialTolerance = (tolerance: any): string => {
    if (!tolerance) return "-";
    const value = tolerance.value || tolerance;
    const type = tolerance.type || 'percent';
    const sign = tolerance.sign || 'both';

    const signSymbol = sign === 'both' ? 'Â±' : sign === 'plus' ? '+' : '-';
    const unit = type === 'percent' ? '%' : ' kVp';
    return `${signSymbol}${value}${unit}`;
  };

  // Dynamic mA columns for Measurement of Operating Potential (support maColumnLabels + row.ma)
  const getOperatingPotentialMaLabels = (op: any): string[] =>
    (Array.isArray(op?.maColumnLabels) && op.maColumnLabels.length > 0) ? op.maColumnLabels : ['10', '100', '200'];
  const getOperatingPotentialMaValue = (row: any, label: string): string | number =>
    row?.ma != null && row.ma[label] !== undefined && row.ma[label] !== null
      ? row.ma[label]
      : (row?.[`ma${label}`] ?? '-');

  // Dynamic mA columns for Measurement of mA Linearity
  const getMaLinearityMeasCount = (maLinearity: any) => {
    if (!maLinearity || !maLinearity.table2 || maLinearity.table2.length === 0) return 0;
    return Math.max(0, ...maLinearity.table2.map((r: any) => (r.measuredOutputs ? r.measuredOutputs.length : 0)));
  };

  const renderMaLinearityTable = (maLinearity: any) => {
    if (!maLinearity || !maLinearity.table2 || maLinearity.table2.length === 0) return null;
    const measCount = getMaLinearityMeasCount(maLinearity);

    return (
      <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
        <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
          <thead className="bg-gray-100">
            <tr>
              <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs Applied</th>
              <th colSpan={measCount} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Radiation Output (mGy)</th>
              <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg Output</th>
              <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X (mGy/mAs)</th>
              <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X Max</th>
              <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>X Min</th>
              <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>CoL</th>
              <th rowSpan={2} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
            </tr>
            <tr>
              {Array.from({ length: measCount }).map((_, idx) => (
                <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas {idx + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {maLinearity.table2.map((row: any, i: number) => (
              <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mAsApplied || "-"}</td>
                {Array.from({ length: measCount }).map((_, idx) => (
                  <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                    {row.measuredOutputs && row.measuredOutputs[idx] != null && row.measuredOutputs[idx] !== '' ? String(row.measuredOutputs[idx]) : "-"}
                  </td>
                ))}
                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgOutput != null && row.avgOutput !== '' ? String(row.avgOutput) : (row.average != null && row.average !== '' ? String(row.average) : "-")}</td>
                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.x != null && row.x !== '' ? String(row.x) : "-"}</td>
                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.xMax != null && row.xMax !== '' ? String(row.xMax) : "-"}</td>
                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.xMin != null && row.xMin !== '' ? String(row.xMin) : "-"}</td>
                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.col || "-"}</td>
                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                  <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
                    {row.remarks || "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper function to format CTDI tolerance
  const formatCtdiTolerance = (tolerance: any): string => {
    if (!tolerance) return "Â±20%"; // Default AERB tolerance
    const sign = tolerance.sign === "both" ? "Â±" : tolerance.sign === "plus" ? "+" : "-";
    return `${sign}${tolerance.value} mGy/100mAs`;
  };

  // Helper function to format Timer Accuracy tolerance
  const formatTimerAccuracyTolerance = (tolerance: string | number): string => {
    if (!tolerance) return "-";
    return `Â±${tolerance}%`;
  };

  // Helper to render High Contrast Resolution content (table2 or result/operatingParams)
  const renderHighContrastContent = (hcr: any) => {
    if (!hcr) return null;
    if (hcr.table2?.length > 0) {
      return (
        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Size (mm)</th>
                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Value</th>
                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Unit</th>
              </tr>
            </thead>
            <tbody>
              {hcr.table2.map((row: any, i: number) => (
                <tr key={i} className="text-center">
                  <td className="border border-black p-2 print:p-1">{row.size || "-"}</td>
                  <td className="border border-black p-2 print:p-1">{row.value || "-"}</td>
                  <td className="border border-black p-2 print:p-1">{row.unit || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    const res = hcr.result || {};
    const op = hcr.operatingParams || {};
    return (
      <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
        <table className="w-full border-2 border-black text-sm print:text-[9px]" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', maxWidth: '500px' }}>
          <tbody>
            <tr className="bg-gray-50"><td className="border border-black p-2 print:p-1 font-medium" style={{ width: '40%' }}>Observed Size (mm)</td><td className="border border-black p-2 print:p-1">{res.observedSize ?? "-"}</td></tr>
            <tr><td className="border border-black p-2 print:p-1 font-medium">Contrast Difference</td><td className="border border-black p-2 print:p-1">{res.contrastDifference ?? "-"}</td></tr>
            <tr className="bg-gray-50"><td className="border border-black p-2 print:p-1 font-medium">kVp</td><td className="border border-black p-2 print:p-1">{op.kvp ?? "-"}</td></tr>
            <tr><td className="border border-black p-2 print:p-1 font-medium">mAs</td><td className="border border-black p-2 print:p-1">{op.mas ?? "-"}</td></tr>
            <tr className="bg-gray-50"><td className="border border-black p-2 print:p-1 font-medium">Slice Thickness (mm)</td><td className="border border-black p-2 print:p-1">{op.sliceThickness ?? "-"}</td></tr>
            <tr><td className="border border-black p-2 print:p-1 font-medium">Window Width</td><td className="border border-black p-2 print:p-1">{op.ww ?? "-"}</td></tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Helper function to render test table for both tubes
  const renderTestTable = (
    testDataA: any,
    testDataB: any,
    testDataSingle: any,
    renderTable: (data: any) => React.ReactNode
  ) => {
    if (isDoubleTube) {
      return (
        <>
          {testDataA && (
            <div className="mb-4 print:mb-2">
              <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube A</h4>
              {renderTable(testDataA)}
            </div>
          )}
          {testDataB && (
            <div className="mb-4 print:mb-2">
              <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube B</h4>
              {renderTable(testDataB)}
            </div>
          )}
        </>
      );
    } else {
      return testDataSingle ? renderTable(testDataSingle) : null;
    }
  };

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `CTScan-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
      const pageCount = estimateReportPages("report-content");
      const response = await getReportHeaderForCTScan(serviceId!, null);
      if (response?.exists && response?.data && report) {
        const d = response.data as any;
        const payload = {
          customerName: d.customerName,
          address: d.address,
          srfNumber: d.srfNumber,
          srfDate: d.srfDate,
          reportULRNumber: d.reportULRNumber,
          testReportNumber: d.testReportNumber,
          issueDate: d.issueDate,
          nomenclature: d.nomenclature,
          make: d.make,
          model: d.model,
          slNumber: d.slNumber,
          condition: d.condition,
          testingProcedureNumber: d.testingProcedureNumber,
          engineerNameRPId: d.engineerNameRPId,
          testDate: d.testDate,
          testDueDate: d.testDueDate,
          location: d.location,
          temperature: d.temperature,
          humidity: d.humidity,
          toolsUsed: d.toolsUsed,
          notes: d.notes,
          pages: String(pageCount),
        };
        const { saveReportHeader } = await import("../../../../../../api");
        await saveReportHeader(serviceId!, payload);
        setReport((prev) => (prev ? { ...prev, pages: String(pageCount) } : null));
      }
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };


  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading CT Scan Report...</div>;

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please generate and save the report header first.</p>
          <button onClick={() => window.history.back()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const toolsArray = report.toolsUsed || [];
  const notesArray = report.notes && report.notes.length > 0 ? report.notes : defaultNotes;

  return (
    <>
      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">
        {/* <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Print
        </button> */}
        <button onClick={downloadPDF} className="download-pdf-btn bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Download PDF
        </button>
      </div>

      <div id="report-content">
        {/* PAGE 1 - MAIN REPORT */}
        <div className="bg-white print:py-0 px-8 py-2 print:px-8 print:py-2" style={{ pageBreakAfter: 'always' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4 print:mb-2">
            <img src={logoA} alt="NABL" className="h-28 print:h-20" />
            <div className="text-right">
              <table className="text-xs print:text-[7px] border border-black compact-table" style={{ fontSize: '9px', borderCollapse: 'collapse', borderSpacing: '0', tableLayout: 'auto', width: 'auto', maxWidth: '200px' }}>
                <tbody>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>SRF No.</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{report.srfNumber}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>SRF Date</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{formatDate(report.srfDate)}</td>
                  </tr>
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '0.9', padding: '0', margin: '0', verticalAlign: 'middle' }}>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5 font-bold" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>ULR No.</td>
                    <td className="border px-3 py-1 print:px-1 print:py-0.5" style={{ padding: '0px 2px', fontSize: '9px', lineHeight: '0.9', minHeight: '0', height: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{report.reportULRNumber || "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <img src={logo} alt="Logo" className="h-28 print:h-20" />
          </div>
          {/* <div className="text-center mb-4 print:mb-2">
            <p className="text-sm print:text-[9px]">Government of India, Atomic Energy Regulatory Board</p>
            <p className="text-sm print:text-[9px]">Radiological Safety Division, Mumbai-400094</p>
          </div> */}
          <h1 className="text-center text-2xl font-bold underline mb-4 print:mb-2 print:text-base" style={{ fontSize: '15px' }}>
            QA TEST REPORT FOR COMPUTED TOMOGRAPHY (CT SCAN) EQUIPMENT
            {isDoubleTube && (
              <span className="block text-lg mt-2 print:text-sm" style={{ fontSize: '13px' }}>
                DOUBLE TUBE (TUBE A & TUBE B)
              </span>
            )}
          </h1>
          <p className="text-center italic text-sm mb-6 print:mb-2 print:text-[9px]">
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>
          {/* Customer Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">1. Customer Details</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Name of the testing site</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.customerName}</td>
                </tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Address of the testing site</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.address}</td>
                </tr>
              </tbody>
            </table>
          </section>
          {/* Reference */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">2. Reference</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}><td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>SRF No. & Date</td><td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.srfNumber} / {formatDate(report.srfDate)}</td></tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}><td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Test Report No. & Issue Date</td><td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{report.testReportNumber} / {formatDate(report.issueDate)}</td></tr>
              </tbody>
            </table>
          </section>
          {/* Equipment Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">3. Details of Equipment Under Test</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                {[
                  ["Nomenclature", report.nomenclature],
                  ["Make", report.make || "-"],
                  ["Model", report.model],
                  ["Serial No.", report.slNumber],
                  ["Condition", report.condition],
                  ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                  ["Engineer Name", report.engineerNameRPId],
                  ["RP ID", report.rpId || "-"],
                  ["Test Date", formatDate(report.testDate)],
                  ["Due Date", formatDate(report.testDueDate)],
                  ["Location", report.location],
                  ["Temperature (Â°C)", report.temperature || "-"],
                  ["Humidity (%)", report.humidity || "-"],
                  ["No. of Pages", report.pages ?? "-"],
                ].map(([label, value]) => (
                  <tr key={label} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                    <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{label}</td>
                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {/* Tools Used */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">4. Standards / Tools Used</h2>
            <div className="overflow-x-auto print:overflow-visible print:max-w-none">
              <table className="w-full border-2 border-black text-xs print:text-[8px] compact-table" style={{ tableLayout: 'fixed', width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '6%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sl No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '16%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Nomenclature</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Make / Model</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Sr. No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Range</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Certificate No.</th>
                    <th className="border border-black p-1.5 print:p-0.5 text-center" style={{ width: '18%', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Valid Till</th>
                  </tr>
                </thead>
                <tbody>
                  {toolsArray.length > 0 ? toolsArray.map((tool, i) => (
                    <tr key={i} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{i + 1}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.nomenclature}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.make} / {tool.model}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.SrNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.range}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{tool.calibrationCertificateNo}</td>
                      <td className="border border-black p-1.5 print:p-0.5 text-center" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{formatDate(tool.calibrationValidTill)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="text-center py-2 print:py-1" style={{ padding: '0px 1px', fontSize: '11px' }}>No tools recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          {/* Notes */}
          <section className="mb-6 print:mb-3">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">5. Notes</h2>
            <div className="ml-8 text-sm print:text-[8px] print:ml-4" style={{ fontSize: '12px', lineHeight: '1.2' }}>
              {notesArray.map(n => (
                <p key={n.slNo} className="mb-1 print:mb-0.5" style={{ fontSize: '12px', lineHeight: '1.2', marginBottom: '2px' }}><strong>{n.slNo}.</strong> {n.text}</p>
              ))}
            </div>
          </section>
          {/* Signature */}
          <div className="flex justify-between items-end mt-8 print:mt-4">
            <img src={AntesoQRCode} alt="QR" className="h-24 print:h-16" />
            <div className="text-center">
              <img src={Signature} alt="Signature" className="h-20 print:h-16 mx-auto mb-2 print:mb-1" />
              <p className="font-bold print:text-xs">Authorized Signatory</p>
            </div>
          </div>
          <footer className="text-center text-xs print:text-[8px] text-gray-600 mt-6 print:mt-3">
            <p>ANTESO Biomedical Engg Pvt. Ltd.</p>
            <p>2nd Floor, D-290, Sector â€“ 63, Noida, New Delhi â€“ 110085</p>
            <p>Email: info@antesobiomedicalengg.com</p>
          </footer>
        </div>
        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none flex flex-col items-center" style={{ width: '100%', maxWidth: 'none' }}>
            {isDoubleTube ? (
              <>
                {/* Summary for Tube A */}
                <div className="mb-8 print:mb-4 w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-2 print:text-xl">
                    SUMMARY OF QA TEST RESULTS - TUBE A
                  </h2>
                  <div className="w-full flex justify-center">
                    <MainTestTableForCTScan testData={testDataTubeA} />
                  </div>
                </div>
                {/* Summary for Tube B */}
                <div className="mb-8 print:mb-4 w-full flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-center underline mb-4 print:mb-2 print:text-xl">
                    SUMMARY OF QA TEST RESULTS - TUBE B
                  </h2>
                  <div className="w-full flex justify-center">
                    <MainTestTableForCTScan testData={testDataTubeB} />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <MainTestTableForCTScan testData={testData} />
              </div>
            )}
            {/* Mechanical Tests Summary */}
            {(testData.alignmentOfTableGantry || testData.gantryTilt || testData.tablePosition) && (
              <div className="w-full flex justify-center mt-8 print:mt-4">
                <MechanicalTestSummary testData={testData} />
              </div>
            )}
          </div>
        </div>
        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>
        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-1 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>
            {/* 1. Radiation Profile Width */}
            {((isDoubleTube && (testDataTubeA.radiationProfile || testDataTubeB.radiationProfile)) || (!isDoubleTube && testData.radiationProfile)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Radiation Profile Width / Slice Thickness</h3>
                {isDoubleTube ? (
                  <>
                    {/* Tube A */}
                    {testDataTubeA.radiationProfile && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube A</h4>
                        {/* Tube Operating Parameters Table */}
                        {testDataTubeA.radiationProfile.table1?.[0] && (
                          <div className="mb-4 print:mb-2">
                            <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-xs" style={{ fontSize: '10px', marginBottom: '4px' }}>Tube Operating Parameters</h4>
                            <div className="overflow-x-auto mb-4 print:mb-2">
                              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeA.radiationProfile.table1[0].kvp || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeA.radiationProfile.table1[0].ma || "-"}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {testDataTubeA.radiationProfile.table2?.length > 0 && (
                          <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied (mm)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured (mm)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Criteria</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {testDataTubeA.radiationProfile.table2.map((row: any, i: number) => (
                                  <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.applied || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measured || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getRadiationProfileCriteria(row.applied, i)}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getRadiationProfileTolerance(row.applied, i)}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                      {(() => {
                                        const remark = row.remark || row.remarks;
                                        return (
                                          <span className={remark === "Pass" ? "text-green-600 font-bold" : remark === "Fail" ? "text-red-600 font-bold" : ""}>
                                            {remark || "-"}
                                          </span>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Tube B */}
                    {testDataTubeB.radiationProfile && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube B</h4>
                        {/* Tube Operating Parameters Table */}
                        {testDataTubeB.radiationProfile.table1?.[0] && (
                          <div className="mb-4 print:mb-2">
                            <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-xs" style={{ fontSize: '10px', marginBottom: '4px' }}>Tube Operating Parameters</h4>
                            <div className="overflow-x-auto mb-4 print:mb-2">
                              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeB.radiationProfile.table1[0].kvp || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeB.radiationProfile.table1[0].ma || "-"}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {testDataTubeB.radiationProfile.table2?.length > 0 && (
                          <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied (mm)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured (mm)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Criteria</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {testDataTubeB.radiationProfile.table2.map((row: any, i: number) => (
                                  <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.applied || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measured || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getRadiationProfileCriteria(row.applied, i)}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getRadiationProfileTolerance(row.applied, i)}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                      {(() => {
                                        const remark = row.remark || row.remarks;
                                        return (
                                          <span className={remark === "Pass" ? "text-green-600 font-bold" : remark === "Fail" ? "text-red-600 font-bold" : ""}>
                                            {remark || "-"}
                                          </span>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  testData.radiationProfile && (
                    <>
                      {/* Tube Operating Parameters Table */}
                      {testData.radiationProfile.table1?.[0] && (
                        <div className="mb-4 print:mb-2">
                          <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-xs" style={{ fontSize: '10px', marginBottom: '4px' }}>Tube Operating Parameters</h4>
                          <div className="overflow-x-auto mb-4 print:mb-2">
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationProfile.table1[0].kvp || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.radiationProfile.table1[0].ma || "-"}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {testData.radiationProfile.table2?.length > 0 && (
                        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied (mm)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured (mm)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Criteria</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testData.radiationProfile.table2.map((row: any, i: number) => (
                                <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.applied || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measured || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getRadiationProfileCriteria(row.applied, i)}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getRadiationProfileTolerance(row.applied, i)}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                    <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
                                      {row.remarks || "-"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            )}
            {/* 2. Measurement of Operating Potential */}
            {((isDoubleTube && (testDataTubeA.operatingPotential || testDataTubeB.operatingPotential)) || (!isDoubleTube && testData.operatingPotential)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Measurement of Operating Potential (kVp Accuracy)</h3>
                {isDoubleTube ? (
                  <>
                    {testDataTubeA.operatingPotential && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube A</h4>
                        {/* Table 1: Time vs Slice Thickness */}
                        {testDataTubeA.operatingPotential.table1?.[0] && (
                          <div className="mb-4 print:mb-2">
                            <div className="overflow-x-auto mb-4 print:mb-2">
                              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time (sec)</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Slice Thickness (mm)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeA.operatingPotential.table1[0].time || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeA.operatingPotential.table1[0].sliceThickness || "-"}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {testDataTubeA.operatingPotential.table2?.length > 0 && (() => {
                          const maLabels = getOperatingPotentialMaLabels(testDataTubeA.operatingPotential);
                          return (
                            <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set kV</th>
                                    {maLabels.map((l: string) => (
                                      <th key={l} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA {l}</th>
                                    ))}
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {testDataTubeA.operatingPotential.table2.map((row: any, i: number) => (
                                    <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKV ?? "-"}</td>
                                      {maLabels.map((l: string) => (
                                        <td key={l} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getOperatingPotentialMaValue(row, l) !== '-' ? String(getOperatingPotentialMaValue(row, l)) : "-"}</td>
                                      ))}
                                      <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp ?? "-"}</td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                        <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
                                          {row.remarks ?? "-"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                        {/* Tolerance Display */}
                        {testDataTubeA.operatingPotential.tolerance && (
                          <div className="mb-4 print:mb-2">
                            <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                              <strong>Tolerance:</strong> {formatOperatingPotentialTolerance(testDataTubeA.operatingPotential.tolerance)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {testDataTubeB.operatingPotential && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube B</h4>
                        {/* Table 1: Time vs Slice Thickness */}
                        {testDataTubeB.operatingPotential.table1?.[0] && (
                          <div className="mb-4 print:mb-2">
                            <div className="overflow-x-auto mb-4 print:mb-2">
                              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time (sec)</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Slice Thickness (mm)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeB.operatingPotential.table1[0].time || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeB.operatingPotential.table1[0].sliceThickness || "-"}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {testDataTubeB.operatingPotential.table2?.length > 0 && (() => {
                          const maLabels = getOperatingPotentialMaLabels(testDataTubeB.operatingPotential);
                          return (
                            <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set kV</th>
                                    {maLabels.map((l: string) => (
                                      <th key={l} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA {l}</th>
                                    ))}
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {testDataTubeB.operatingPotential.table2.map((row: any, i: number) => (
                                    <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKV ?? "-"}</td>
                                      {maLabels.map((l: string) => (
                                        <td key={l} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getOperatingPotentialMaValue(row, l) !== '-' ? String(getOperatingPotentialMaValue(row, l)) : "-"}</td>
                                      ))}
                                      <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp ?? "-"}</td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                        <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
                                          {row.remarks ?? "-"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                        {/* Tolerance Display */}
                        {testDataTubeB.operatingPotential.tolerance && (
                          <div className="mb-4 print:mb-2">
                            <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                              <strong>Tolerance:</strong> {formatOperatingPotentialTolerance(testDataTubeB.operatingPotential.tolerance)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  testData.operatingPotential && (
                    <>
                      {/* Table 1: Time vs Slice Thickness */}
                      {testData.operatingPotential.table1?.[0] && (
                        <div className="mb-4 print:mb-2">
                          <div className="overflow-x-auto mb-4 print:mb-2">
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time (ms)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Slice Thickness (mm)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.operatingPotential.table1[0].time || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.operatingPotential.table1[0].sliceThickness || "-"}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {testData.operatingPotential.table2?.length > 0 && (() => {
                        const maLabels = getOperatingPotentialMaLabels(testData.operatingPotential);
                        return (
                          <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set kV</th>
                                  {maLabels.map((l: string) => (
                                    <th key={l} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA {l}</th>
                                  ))}
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {testData.operatingPotential.table2.map((row: any, i: number) => (
                                  <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKV ?? "-"}</td>
                                    {maLabels.map((l: string) => (
                                      <td key={l} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getOperatingPotentialMaValue(row, l) !== '-' ? String(getOperatingPotentialMaValue(row, l)) : "-"}</td>
                                    ))}
                                    <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp ?? "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                      <span className={row.remarks === "Pass" ? "text-green-600 font-bold" : row.remarks === "Fail" ? "text-red-600 font-bold" : ""}>
                                        {row.remarks ?? "-"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                      {/* Tolerance Display */}
                      {testData.operatingPotential.tolerance && (
                        <div className="mb-4 print:mb-2">
                          <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                            <strong>Tolerance:</strong> {formatOperatingPotentialTolerance(testData.operatingPotential.tolerance)}
                          </p>
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            )}

            {/* 4. Timer Accuracy */}
            {testData.timerAccuracy && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Timer Accuracy</h3>
                {/* Table 1: Operating Parameters */}
                {testData.timerAccuracy.table1?.[0] && (
                  <div className="mb-4 print:mb-2">
                    <div className="overflow-x-auto mb-4 print:mb-2">
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Slice Thickness (mm)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mA</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.timerAccuracy.table1[0].kvp || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.timerAccuracy.table1[0].sliceThickness || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.timerAccuracy.table1[0].ma || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Table 2: Timer Accuracy Measurements */}
                {testData.timerAccuracy.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (sec)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Observed Time (sec)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.timerAccuracy.table2.map((row: any, i: number) => {
                          // Calculate percentError and remarks if not present
                          let percentError = row.percentError;
                          let remarks = row.remarks;
                          if (!percentError || !remarks) {
                            const set = parseFloat(row.setTime);
                            const obs = parseFloat(row.observedTime);
                            const tol = parseFloat(testData.timerAccuracy.tolerance) || 5;
                            if (!isNaN(set) && !isNaN(obs) && set > 0) {
                              const errorNum = (Math.abs(set - obs) / set) * 100;
                              if (!percentError) percentError = `${errorNum.toFixed(2)}%`;
                              if (!remarks) remarks = errorNum <= tol ? "Pass" : "Fail";
                            } else {
                              if (!percentError) percentError = "-";
                              if (!remarks) remarks = "-";
                            }
                          }
                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.observedTime || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{percentError}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={remarks === "Pass" ? "text-green-600 font-bold" : remarks === "Fail" ? "text-red-600 font-bold" : ""}>
                                  {remarks || "-"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Tolerance Display */}
                {testData.timerAccuracy.tolerance && (
                  <div className="mb-4 print:mb-2">
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                      <strong>Tolerance:</strong> {formatTimerAccuracyTolerance(testData.timerAccuracy.tolerance)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Measurement of mA Linearity */}
            {((isDoubleTube && (testDataTubeA.maLinearity || testDataTubeB.maLinearity)) || (!isDoubleTube && testData.maLinearity)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Measurement of mA Linearity</h3>
                {renderTestTable(
                  testDataTubeA.maLinearity,
                  testDataTubeB.maLinearity,
                  testData.maLinearity,
                  renderMaLinearityTable
                )}
              </div>
            )}

            {/* 8. Output Consistency */}
            {((isDoubleTube && (testDataTubeA.outputConsistency || testDataTubeB.outputConsistency)) || (!isDoubleTube && testData.outputConsistency)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Output Consistency</h3>
                {isDoubleTube ? (
                  <>
                    {/* Tube A */}
                    {testDataTubeA.outputConsistency && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube A</h4>
                        {/* Test Parameters Table */}
                        {testDataTubeA.outputConsistency.parameters && (
                          <div className="mb-4 print:mb-2">
                            <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-xs" style={{ fontSize: '10px', marginBottom: '4px' }}>Test Parameters</h4>
                            <div className="overflow-x-auto mb-4 print:mb-2">
                              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Slice Thickness (mm)</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time (s)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeA.outputConsistency.parameters.mas || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeA.outputConsistency.parameters.sliceThickness || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeA.outputConsistency.parameters.time || "-"}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {/* Radiation Output Consistency Table */}
                        {testDataTubeA.outputConsistency.outputRows?.length > 0 && (
                          <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                                  {/* Dynamic Measurement Columns */}
                                  {Array.from({ length: Math.max(testDataTubeA.outputConsistency.outputRows[0]?.outputs?.length || 0, 5) }).map((_, idx) => (
                                    <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas {idx + 1}</th>
                                  ))}
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mean (XÌ„)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>COV</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {testDataTubeA.outputConsistency.outputRows.map((row: any, i: number) => (
                                  <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kvp || "-"}</td>
                                    {/* Dynamic Measurement Data */}
                                    {Array.from({ length: Math.max(row.outputs?.length || 0, 5) }).map((_, idx) => (
                                      <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                        {(row.outputs && row.outputs[idx]) || "-"}
                                      </td>
                                    ))}
                                    <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mean || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                      {(() => {
                                        const covVal = row.cov ?? row.cv;
                                        if (covVal != null && covVal !== "") return covVal;

                                        const values: number[] = (Array.isArray(row.outputs) ? row.outputs : [])
                                          .map((v: any) => {
                                            if (v == null) return NaN;
                                            if (typeof v === "number") return v;
                                            if (typeof v === "string") return parseFloat(v);
                                            if (typeof v === "object" && "value" in v) return parseFloat((v as any).value);
                                            return NaN;
                                          })
                                          .filter((n: number) => !Number.isNaN(n));

                                        if (values.length === 0) return "-";
                                        const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                                        if (!mean) return "-";
                                        const variance = values.reduce((sum: number, n: number) => sum + Math.pow(n - mean, 2), 0) / values.length;
                                        const stdDev = Math.sqrt(variance);
                                        const computedCov = stdDev / mean;
                                        return Number.isFinite(computedCov) ? computedCov.toFixed(4) : "-";
                                      })()}
                                    </td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                      {(() => {
                                        const remark = row.remark || row.remarks;
                                        return (
                                          <span className={remark === "Pass" ? "text-green-600 font-bold" : remark === "Fail" ? "text-red-600 font-bold" : ""}>
                                            {remark || "-"}
                                          </span>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Tube B */}
                    {testDataTubeB.outputConsistency && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube B</h4>
                        {/* Test Parameters Table */}
                        {testDataTubeB.outputConsistency.parameters && (
                          <div className="mb-4 print:mb-2">
                            <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-xs" style={{ fontSize: '10px', marginBottom: '4px' }}>Test Parameters</h4>
                            <div className="overflow-x-auto mb-4 print:mb-2">
                              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Slice Thickness (mm)</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time (s)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeB.outputConsistency.parameters.mas || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeB.outputConsistency.parameters.sliceThickness || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testDataTubeB.outputConsistency.parameters.time || "-"}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {/* Radiation Output Consistency Table */}
                        {testDataTubeB.outputConsistency.outputRows?.length > 0 && (
                          <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                                  {/* Dynamic Measurement Columns */}
                                  {Array.from({ length: Math.max(testDataTubeB.outputConsistency.outputRows[0]?.outputs?.length || 0, 5) }).map((_, idx) => (
                                    <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas {idx + 1}</th>
                                  ))}
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mean (XÌ„)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>COV</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {testDataTubeB.outputConsistency.outputRows.map((row: any, i: number) => (
                                  <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kvp || "-"}</td>
                                    {/* Dynamic Measurement Data */}
                                    {Array.from({ length: Math.max(row.outputs?.length || 0, 5) }).map((_, idx) => (
                                      <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                        {(row.outputs && row.outputs[idx]) || "-"}
                                      </td>
                                    ))}
                                    <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mean || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                      {(() => {
                                        const covVal = row.cov ?? row.cv;
                                        if (covVal != null && covVal !== "") return covVal;

                                        const values: number[] = (Array.isArray(row.outputs) ? row.outputs : [])
                                          .map((v: any) => {
                                            if (v == null) return NaN;
                                            if (typeof v === "number") return v;
                                            if (typeof v === "string") return parseFloat(v);
                                            if (typeof v === "object" && "value" in v) return parseFloat((v as any).value);
                                            return NaN;
                                          })
                                          .filter((n: number) => !Number.isNaN(n));

                                        if (values.length === 0) return "-";
                                        const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                                        if (!mean) return "-";
                                        const variance = values.reduce((sum: number, n: number) => sum + Math.pow(n - mean, 2), 0) / values.length;
                                        const stdDev = Math.sqrt(variance);
                                        const computedCov = stdDev / mean;
                                        return Number.isFinite(computedCov) ? computedCov.toFixed(4) : "-";
                                      })()}
                                    </td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                      {(() => {
                                        const remark = row.remark || row.remarks;
                                        return (
                                          <span className={remark === "Pass" ? "text-green-600 font-bold" : remark === "Fail" ? "text-red-600 font-bold" : ""}>
                                            {remark || "-"}
                                          </span>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  testData.outputConsistency && (
                    <>
                      {/* Test Parameters Table */}
                      {testData.outputConsistency.parameters && (
                        <div className="mb-4 print:mb-2">
                          <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-xs" style={{ fontSize: '10px', marginBottom: '4px' }}>Test Parameters</h4>
                          <div className="overflow-x-auto mb-4 print:mb-2">
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Slice Thickness (mm)</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time (s)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.outputConsistency.parameters.mas || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.outputConsistency.parameters.sliceThickness || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.outputConsistency.parameters.time || "-"}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {/* Radiation Output Consistency Table */}
                      {testData.outputConsistency.outputRows?.length > 0 && (
                        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                                {/* Dynamic Measurement Columns */}
                                {Array.from({ length: Math.max(testData.outputConsistency.outputRows[0]?.outputs?.length || 0, 5) }).map((_, idx) => (
                                  <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Meas {idx + 1}</th>
                                ))}
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mean (XÌ„)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>COV</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testData.outputConsistency.outputRows.map((row: any, i: number) => (
                                <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.kvp || "-"}</td>
                                  {/* Dynamic Measurement Data */}
                                  {Array.isArray(row.outputs) && row.outputs.map((val: any, idx: number) => (
                                    <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{val || "-"}</td>
                                  ))}
                                  <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mean || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                    {(() => {
                                      const covVal = row.cov ?? row.cv;
                                      if (covVal != null && covVal !== "") return covVal;

                                      const values: number[] = (Array.isArray(row.outputs) ? row.outputs : [])
                                        .map((v: any) => {
                                          if (v == null) return NaN;
                                          if (typeof v === "number") return v;
                                          if (typeof v === "string") return parseFloat(v);
                                          if (typeof v === "object" && "value" in v) return parseFloat((v as any).value);
                                          return NaN;
                                        })
                                        .filter((n: number) => !Number.isNaN(n));

                                      if (values.length === 0) return "-";
                                      const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                                      if (!mean) return "-";
                                      const variance = values.reduce((sum: number, n: number) => sum + Math.pow(n - mean, 2), 0) / values.length;
                                      const stdDev = Math.sqrt(variance);
                                      const computedCov = stdDev / mean;
                                      return Number.isFinite(computedCov) ? computedCov.toFixed(4) : "-";
                                    })()}
                                  </td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                    {(() => {
                                      const remarkStr = row.remark || row.remarks;
                                      if (remarkStr === "Pass" || remarkStr === "Fail") {
                                        return (
                                          <span className={remarkStr === "Pass" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                            {remarkStr}
                                          </span>
                                        );
                                      }

                                      // Fallback calculation if remark is not explicitly saved
                                      const { tolerance } = testData.outputConsistency;
                                      const tolValue = tolerance && typeof tolerance === 'object' && tolerance.value
                                        ? parseFloat(tolerance.value)
                                        : (typeof tolerance === 'string' || typeof tolerance === 'number')
                                          ? parseFloat(String(tolerance))
                                          : 0.05;
                                      const tolOperator = tolerance && typeof tolerance === 'object' && tolerance.operator
                                        ? tolerance.operator
                                        : '<=';

                                      const covVal = row.cov ?? row.cv;
                                      let computedCov = covVal != null && covVal !== "" ? parseFloat(covVal) : NaN;

                                      if (isNaN(computedCov)) {
                                        const values: number[] = (Array.isArray(row.outputs) ? row.outputs : [])
                                          .map((v: any) => {
                                            if (v == null) return NaN;
                                            if (typeof v === "number") return v;
                                            if (typeof v === "string") return parseFloat(v);
                                            if (typeof v === "object" && "value" in v) return parseFloat((v as any).value);
                                            return NaN;
                                          })
                                          .filter((n: number) => !Number.isNaN(n));

                                        if (values.length > 0) {
                                          const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                                          if (mean) {
                                            const variance = values.reduce((sum: number, n: number) => sum + Math.pow(n - mean, 2), 0) / values.length;
                                            computedCov = Math.sqrt(variance) / mean;
                                          }
                                        }
                                      }

                                      let isPass = false;
                                      if (!isNaN(computedCov)) {
                                        if (tolOperator === '<=' || tolOperator === '<') {
                                          isPass = computedCov <= tolValue;
                                        } else {
                                          isPass = computedCov >= tolValue;
                                        }
                                      }

                                      return (
                                        <span className={isPass ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                          {isPass ? "Pass" : "Fail"}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            )}

            {/* 5. Measurement of CTDI */}
            {testData.ctdi && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Measurement of CTDI</h3>
                {/* Table 1: Operating Parameters */}
                {testData.ctdi.table1?.[0] && (
                  <div className="mb-4 print:mb-2">
                    <div className="overflow-x-auto mb-4 print:mb-2">
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>kVp</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mAs</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Slice Thickness (mm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.ctdi.table1[0].kvp || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.ctdi.table1[0].mAs || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.ctdi.table1[0].sliceThickness || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Table 2: CTDI Results */}
                {testData.ctdi.table2?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Results</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Head (mGy/100mAs)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Body (mGy/100mAs)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const table2 = testData.ctdi.table2 || [];
                          const ctdicRow = table2.find((r: any) => r.result === "CTDIc");
                          const peripheralRow = table2.find((r: any) => r.id === 'peripheral' || r.result === 'Peripheral Dose');

                          const getCalculatedFields = (row: any) => {
                            let head = row.head;
                            let body = row.body;

                            if ((!head || !body) && peripheralRow?.readings) {
                              const round = (num: number) => (isNaN(num) || !isFinite(num) ? '' : num.toFixed(2));
                              const headValues = peripheralRow.readings.map((r: any) => parseFloat(r.head)).filter((v: any) => !isNaN(v));
                              const bodyValues = peripheralRow.readings.map((r: any) => parseFloat(r.body)).filter((v: any) => !isNaN(v));
                              const headMean = headValues.length > 0 ? headValues.reduce((a: any, b: any) => a + b, 0) / headValues.length : NaN;
                              const bodyMean = bodyValues.length > 0 ? bodyValues.reduce((a: any, b: any) => a + b, 0) / bodyValues.length : NaN;

                              if (row.result?.includes("CTDIp(mean)")) {
                                if (!head) head = round(headMean);
                                if (!body) body = round(bodyMean);
                              } else if (row.result === "CTDIw") {
                                const ctdicHead = parseFloat(ctdicRow?.head || '0');
                                const ctdicBody = parseFloat(ctdicRow?.body || '0');
                                if (!head && !isNaN(ctdicHead) && !isNaN(headMean)) head = round((1 / 3) * ctdicHead + (2 / 3) * headMean);
                                if (!body && !isNaN(ctdicBody) && !isNaN(bodyMean)) body = round((1 / 3) * ctdicBody + (2 / 3) * bodyMean);
                              }
                            }
                            return { head, body };
                          };

                          return table2.map((row: any, i: number) => {
                            const { head, body } = getCalculatedFields(row);
                            return (
                              <React.Fragment key={i}>
                                <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.result || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{head != null && head !== '' ? String(head) : (row.id === 'peripheral' || row.result === 'Peripheral Dose' ? "" : "-")}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{body != null && body !== '' ? String(body) : (row.id === 'peripheral' || row.result === 'Peripheral Dose' ? "" : "-")}</td>
                                </tr>
                                {(row.id === 'peripheral' || row.result === 'Peripheral Dose') && row.readings?.map((reading: any, idx: number) => (
                                  <tr key={`reading-${idx}`} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-2 print:p-1 text-left pl-6" style={{ padding: '0px 4px 0px 12px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{reading.label || String.fromCharCode(65 + idx)}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{reading.head || "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{reading.body || "-"}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Tolerance Display */}
                {(testData.ctdi.tolerance || !testData.ctdi.tolerance) && (
                  <div className="mb-4 print:mb-2">
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px' }}>
                      <strong>Tolerance:</strong> {formatCtdiTolerance(testData.ctdi.tolerance)}
                    </p>
                  </div>
                )}
              </div>
            )}



            {/* 9. Low Contrast Resolution */}
            {testData.lowContrastResolution && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Low Contrast Resolution</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '500px' }}>
                    <tbody>
                      <tr className="bg-gray-50">
                        <td className="border border-black p-2 print:p-1 font-medium" style={{ width: '40%' }}>Observed Size (mm)</td>
                        <td className="border border-black p-2 print:p-1">{testData.lowContrastResolution.result?.observedSize || testData.lowContrastResolution.observedSize || "-"}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 print:p-1 font-medium">Contrast Level (%)</td>
                        <td className="border border-black p-2 print:p-1">{testData.lowContrastResolution.result?.contrastLevel || testData.lowContrastResolution.contrastLevel || "-"}</td>
                      </tr>
                      {testData.lowContrastResolution.acquisitionParams && (
                        <>
                          <tr className="bg-gray-50">
                            <td className="border border-black p-2 print:p-1 font-medium">kVp</td>
                            <td className="border border-black p-2 print:p-1">{testData.lowContrastResolution.acquisitionParams.kvp || "-"}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 print:p-1 font-medium">mA</td>
                            <td className="border border-black p-2 print:p-1">{testData.lowContrastResolution.acquisitionParams.ma || "-"}</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border border-black p-2 print:p-1 font-medium">Slice Thickness (mm)</td>
                            <td className="border border-black p-2 print:p-1">{testData.lowContrastResolution.acquisitionParams.sliceThickness || "-"}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 print:p-1 font-medium">Window Width</td>
                            <td className="border border-black p-2 print:p-1">{testData.lowContrastResolution.acquisitionParams.ww || "-"}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* 10. High Contrast Resolution */}
            {(testData.highContrastResolution || (isDoubleTube && (testDataTubeA.highContrastResolution || testDataTubeB.highContrastResolution))) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>8. High Contrast Resolution</h3>
                {isDoubleTube ? (
                  <>
                    {testDataTubeA.highContrastResolution && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-sm font-semibold mb-2 print:mb-1" style={{ fontSize: '11px' }}>Tube A</h4>
                        {renderHighContrastContent(testDataTubeA.highContrastResolution)}
                      </div>
                    )}
                    {testDataTubeB.highContrastResolution && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-sm font-semibold mb-2 print:mb-1" style={{ fontSize: '11px' }}>Tube B</h4>
                        {renderHighContrastContent(testDataTubeB.highContrastResolution)}
                      </div>
                    )}
                  </>
                ) : (
                  testData.highContrastResolution && renderHighContrastContent(testData.highContrastResolution)
                )}
              </div>
            )}

            {/* 6. Total Filtration */}
            {testData.totalFiltration && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>9. Total Filtration</h3>
                {testData.totalFiltration.rows?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kV</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied mA</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Time (s)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Slice Thickness (mm)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured TF (mm Al)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.totalFiltration.rows.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKV || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedMA || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.time || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.sliceThickness || "-"}</td>
                            <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTF || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              {(() => {
                                let remarks = row.remarks;
                                if (!remarks && row.measuredTF) {
                                  const tf = parseFloat(row.measuredTF);
                                  if (!isNaN(tf)) {
                                    remarks = tf >= 2.5 ? "Pass" : "Fail";
                                  }
                                }
                                return (
                                  <span className={remarks === "Pass" ? "text-green-600 font-bold" : remarks === "Fail" ? "text-red-600 font-bold" : ""}>
                                    {remarks || "-"}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {/* 7. Radiation Leakage Level */}
            {((isDoubleTube && (testDataTubeA.leakage || testDataTubeB.leakage)) || (!isDoubleTube && testData.leakage)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>10. Radiation Leakage Level from X-Ray Tube House</h3>

                {(() => {
                  const renderLeakageSection = (data: any, title?: string) => {
                    if (!data || !data.leakageMeasurements?.length) return null;
                    const maValue = parseFloat(data.ma || data.measurementSettings?.[0]?.ma || "0");
                    const workloadValue = parseFloat(data.workload || "0");

                    const getSummaryForLocation = (locName: string) => {
                      const row = data.leakageMeasurements.find((m: any) => m.location === locName);
                      if (!row) return null;
                      const values = [row.left, row.right, row.front, row.back, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
                      const rowMax = values.length > 0 ? Math.max(...values) : 0;
                      const resMR = (workloadValue * rowMax) / (60 * maValue);
                      const resMGy = resMR / 114;
                      return { rowMax, resMR, resMGy };
                    };
                    const tubeSummary = getSummaryForLocation("Tube Housing");
                    const collimatorSummary = getSummaryForLocation("Collimator");

                    return (
                      <div className="mb-6 print:mb-2">
                        {title && <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>{title}</h4>}

                        {/* Test Conditions Table */}
                        <div className="mb-4 print:mb-1">
                          <div className="overflow-x-auto mb-2 print:mb-1">
                            <table className="border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                              <thead className="bg-gray-100">
                                <tr className="bg-blue-50">
                                  <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>FDD (cm)</th>
                                  <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                                  <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mA</th>
                                  <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Time (Sec)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{data.fcd || data.measurementSettings?.[0]?.fcd || "100"}</td>
                                  <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{data.kv || data.measurementSettings?.[0]?.kv || "-"}</td>
                                  <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{data.ma || data.measurementSettings?.[0]?.ma || "-"}</td>
                                  <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{data.time || data.measurementSettings?.[0]?.time || "-"}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Workload */}
                        <div className="grid grid-cols-2 gap-4 mb-4 print:mb-1">
                          <div>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px' }}>
                              <strong>Workload:</strong> {data.workload || "-"} {data.workloadUnit || "mAÂ·min/week"}
                            </p>
                          </div>
                        </div>

                        {/* Exposure Level Table */}
                        <div className="overflow-x-auto mb-4 print:mb-1">
                          <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr className="bg-blue-50">
                                <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ width: '15%', padding: '0px 2px', fontSize: '10px' }}>Location</th>
                                <th colSpan={5} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Exposure Level (mR/hr)</th>
                                <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Result (mR in 1 hr)</th>
                                <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Result (mGy in 1 hr)</th>
                                <th rowSpan={2} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Remarks</th>
                              </tr>
                              <tr className="bg-gray-50">
                                <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Left</th>
                                <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Right</th>
                                <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Front</th>
                                <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Back</th>
                                <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Top</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.leakageMeasurements.map((row: any, idx: number) => {
                                const values = [row.left, row.right, row.front, row.back, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
                                const rowMax = values.length > 0 ? Math.max(...values) : 0;
                                let calculatedMR = "-";
                                let calculatedMGy = "-";
                                let remark = row.remark || "-";
                                if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                                  const resMR = (workloadValue * rowMax) / (60 * maValue);
                                  calculatedMR = resMR.toFixed(3);
                                  calculatedMGy = (resMR / 114).toFixed(4);
                                  if (remark === "-" || !remark) {
                                    const tolVal = parseFloat(data.toleranceValue || data.tolerance || "1") || 1.0;
                                    remark = (resMR / 114) <= tolVal ? "Pass" : "Fail";
                                  }
                                }
                                return (
                                  <tr key={idx} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                    <td className="border border-black p-1 text-center font-medium" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.location || "-"}</td>
                                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.left || "-"}</td>
                                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.right || "-"}</td>
                                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.front || "-"}</td>
                                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.back || "-"}</td>
                                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.top || "-"}</td>
                                    <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMR}</td>
                                    <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMGy}</td>
                                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                                      <span className={remark === "Pass" ? "text-green-600 font-bold" : remark === "Fail" ? "text-red-600 font-bold" : ""}>{remark}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Calculation Formula + Summary + Tolerance */}
                        <div className="space-y-4 print:space-y-1">
                          <div className="bg-gray-50 p-4 print:p-1 rounded border border-gray-200">
                            <p className="text-sm print:text-[10px] font-bold mb-2 print:mb-1">Calculation Formula:</p>
                            <div className="bg-white p-3 print:p-1 border border-dashed border-gray-400 text-center font-mono text-sm print:text-[10px]">
                              Maximum Leakage (mR in 1 hr) = (Workload Ã— Max Exposure) / (60 Ã— mA)
                            </div>
                            <p className="text-[10px] print:text-[8px] mt-2 text-gray-600 italic">
                              Where: Workload = {workloadValue} mAÂ·min/week | mA = {maValue} | 1 mGy = 114 mR
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 print:gap-1">
                            {tubeSummary && (
                              <div className="border border-blue-200 rounded p-3 print:p-1 bg-blue-50/30">
                                <p className="font-bold text-xs print:text-[9px] text-blue-800 mb-2">Tube Housing Summary:</p>
                                <div className="text-[11px] print:text-[8px] space-y-1">
                                  <p>Max Measured: <strong>{tubeSummary.rowMax} mR/hr</strong></p>
                                  <p>Result: ({workloadValue} Ã— {tubeSummary.rowMax}) / (60 Ã— {maValue}) = <strong>{tubeSummary.resMR.toFixed(3)} mR</strong></p>
                                  <p>In mGy: {tubeSummary.resMR.toFixed(3)} / 114 = <span className="font-bold text-blue-700">{tubeSummary.resMGy.toFixed(4)} mGy</span></p>
                                </div>
                              </div>
                            )}
                            {collimatorSummary && (
                              <div className="border border-indigo-200 rounded p-3 print:p-1 bg-indigo-50/30">
                                <p className="font-bold text-xs print:text-[9px] text-indigo-800 mb-2">Collimator Summary:</p>
                                <div className="text-[11px] print:text-[8px] space-y-1">
                                  <p>Max Measured: <strong>{collimatorSummary.rowMax} mR/hr</strong></p>
                                  <p>Result: ({workloadValue} Ã— {collimatorSummary.rowMax}) / (60 Ã— {maValue}) = <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong></p>
                                  <p>In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 = <span className="font-bold text-indigo-700">{collimatorSummary.resMGy.toFixed(4)} mGy</span></p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="bg-blue-50 p-4 print:p-1 border-l-4 border-blue-500 rounded-r">
                            <p className="text-[11px] print:text-[8px] leading-relaxed">
                              <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be{' '}
                              {data.toleranceOperator === 'less than or equal to' ? 'â‰¤' : data.toleranceOperator === 'greater than or equal to' ? 'â‰¥' : '='}{' '}
                              <strong>{data.toleranceValue || data.tolerance || '1'} mGy ({parseFloat(data.toleranceValue || data.tolerance || '1') * 114} mR) in one hour.</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  if (isDoubleTube) {
                    return (<>{renderLeakageSection(testDataTubeA.leakage, "Tube A")}{renderLeakageSection(testDataTubeB.leakage, "Tube B")}</>);
                  } else {
                    return renderLeakageSection(testData.leakage);
                  }
                })()}
              </div>
            )}


            {/* 11. Table Position */}
            {testData.tablePosition && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>11. Table Position</h3>
                {/* Initial Settings */}
                {(testData.tablePosition.initialTablePosition || testData.tablePosition.loadOnCouch) && (
                  <div className="mb-4 print:mb-2">
                    <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-xs" style={{ fontSize: '10px', marginBottom: '4px' }}>Initial Settings</h4>
                    <div className="overflow-x-auto mb-4 print:mb-2">
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Initial table position (cm)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Load on couch (kg)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.tablePosition.initialTablePosition || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.tablePosition.loadOnCouch || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Exposure Parameters */}
                {testData.tablePosition.exposureParameters?.length > 0 && (
                  <div className="mb-4 print:mb-2">
                    <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-xs" style={{ fontSize: '10px', marginBottom: '4px' }}>Exposure Parameters</h4>
                    <div className="overflow-x-auto mb-4 print:mb-2">
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '500px' }}>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* 12. Gantry Tilt Measurement */}
            {testData.gantryTilt && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>12. Gantry Tilt Measurement</h3>
                {/* Parameters Table */}
                {testData.gantryTilt.parameters?.length > 0 && (
                  <div className="mb-4 print:mb-2">
                    <h4 className="text-sm font-semibold mb-2 print:mb-1 print:text-xs" style={{ fontSize: '10px', marginBottom: '4px' }}>Parameters</h4>
                    <div className="overflow-x-auto mb-4 print:mb-2">
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Parameter Name</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.gantryTilt.parameters.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.name || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.value || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Measurement Results Table */}
                {testData.gantryTilt.measurements?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Actual Gantry Tilt</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Gantry Tilt</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.gantryTilt.measurements.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.actual || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measured || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.gantryTilt.toleranceSign || "Â±"}{testData.gantryTilt.toleranceValue || "2"}Â°</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={row.remark === "Pass" ? "text-green-600 font-bold" : row.remark === "Fail" ? "text-red-600 font-bold" : ""}>
                                {row.remark || "-"}
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
            {/* 13. Measure Max Radiation Level */}
            {testData.measureMaxRadiationLevel && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>13. Measure Maximum Radiation Level</h3>
                {testData.measureMaxRadiationLevel.readings?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Location</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Radiation Level (mR/hr)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Radiation Level (mR/week)</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Permissible Limit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testData.measureMaxRadiationLevel.readings.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.location || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mRPerHr || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.mRPerWeek || "-"}</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                              <span className={row.result === "Pass" ? "text-green-600 font-bold" : row.result === "Fail" ? "text-red-600 font-bold" : ""}>
                                {row.result || "-"}
                              </span>
                            </td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.permissibleLimit || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {/* 14. Radiation Protection Survey Report */}
            {(testData.radiationProtectionSurvey || testDataTubeA.radiationProtectionSurvey || testDataTubeB.radiationProtectionSurvey) && (() => {
              const survey = testData.radiationProtectionSurvey || testDataTubeA.radiationProtectionSurvey || testDataTubeB.radiationProtectionSurvey;
              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>13. Radiation Protection Survey Report</h3>

                  {/* 1. Survey Details */}
                  {(survey.surveyDate || survey.hasValidCalibration) && (
                    <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Survey Details</h4>
                      <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                        <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                          <tbody>
                            <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Date of Radiation Protection Survey</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{survey.surveyDate ? formatDate(survey.surveyDate) : "-"}</td>
                            </tr>
                            <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate</td>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{survey.hasValidCalibration || "-"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 2. Equipment Setting */}
                  {(survey.appliedCurrent || survey.appliedVoltage || survey.exposureTime || survey.workload) && (
                    <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>2. Equipment Setting</h4>
                      <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                        <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                          <tbody>
                            {[["Applied Current (mA)", survey.appliedCurrent], ["Applied Voltage (kV)", survey.appliedVoltage], ["Exposure Time(s)", survey.exposureTime], ["Workload (mA min/week)", survey.workload]].map(([label, value]) => (
                              <tr key={label as string} style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{label}</td>
                                <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{value || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 3. Measured Maximum Radiation Levels */}
                  {survey.locations?.length > 0 && (
                    <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                      <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                        <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Location</th>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Max. Radiation Level</th>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                              <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {survey.locations.map((loc: any, i: number) => (
                              <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                <td className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.location || "-"}</td>
                                <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerHr ? `${loc.mRPerHr} mR/hr` : "-"}</td>
                                <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerWeek ? `${loc.mRPerWeek} mR/week` : "-"}</td>
                                <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                  <span className={loc.result === "PASS" || loc.result === "Pass" ? "text-green-600 font-semibold" : loc.result === "FAIL" || loc.result === "Fail" ? "text-red-600 font-semibold" : ""}>
                                    {loc.result || "-"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 4. Calculation Formula */}
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>4. Calculation Formula</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 bg-gray-50" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                              <strong>Maximum Radiation level/week (mR/wk) = Work Load X Max. Radiation Level (mR/hr) / (60 X mA used for measurement)</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 5. Summary of Maximum Radiation Level/week */}
                  {survey.locations?.length > 0 && (() => {
                    const workerLocs = survey.locations.filter((loc: any) => loc.category === "worker");
                    const publicLocs = survey.locations.filter((loc: any) => loc.category === "public");
                    const maxWorkerLocation = workerLocs.reduce((max: any, loc: any) => { const maxVal = parseFloat(max?.mRPerWeek) || 0; const locVal = parseFloat(loc.mRPerWeek) || 0; return locVal > maxVal ? loc : max; }, workerLocs[0] || { mRPerHr: '', location: '' });
                    const maxPublicLocation = publicLocs.reduce((max: any, loc: any) => { const maxVal = parseFloat(max?.mRPerWeek) || 0; const locVal = parseFloat(loc.mRPerWeek) || 0; return locVal > maxVal ? loc : max; }, publicLocs[0] || { mRPerHr: '', location: '' });
                    const maxWorkerWeekly = Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                    const maxPublicWeekly = Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3);
                    const workerResult = parseFloat(maxWorkerWeekly) > 0 && parseFloat(maxWorkerWeekly) <= 40 ? "Pass" : parseFloat(maxWorkerWeekly) > 40 ? "Fail" : "";
                    const publicResult = parseFloat(maxPublicWeekly) > 0 && parseFloat(maxPublicWeekly) <= 2 ? "Pass" : parseFloat(maxPublicWeekly) > 2 ? "Fail" : "";
                    return (
                      <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                        <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>5. Summary of Maximum Radiation Level/week (mR/wk)</h4>
                        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Category</th>
                                <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                                <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[["For Radiation Worker", maxWorkerWeekly, workerResult], ["For Public", maxPublicWeekly, publicResult]].map(([cat, val, res]) => (
                                <tr key={cat as string} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{cat}</td>
                                  <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{val || "0.000"} mR/week</td>
                                  <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                    <span className={res === "Pass" ? "text-green-600 font-semibold" : res === "Fail" ? "text-red-600 font-semibold" : ""}>{res || "-"}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 print:mt-1 space-y-3 print:space-y-1">
                          {maxWorkerLocation?.mRPerHr && parseFloat(maxWorkerLocation.mRPerHr) > 0 && (
                            <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                              <p className="text-sm print:text-[9px] font-semibold mb-2 print:mb-0.5" style={{ fontSize: '11px', margin: '2px 0', fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Radiation Worker):</p>
                              <p className="text-xs print:text-[8px] mb-1 print:mb-0.5" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Location:</strong> {maxWorkerLocation.location}</p>
                              <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Formula:</strong> ({survey.workload || 'â€”'} mAmin/week Ã— {maxWorkerLocation.mRPerHr || 'â€”'} mR/hr) / (60 Ã— {survey.appliedCurrent || 'â€”'} mA)</p>
                              <p className="text-xs print:text-[8px] mt-1 print:mt-0.5" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Result:</strong> {maxWorkerWeekly} mR/week</p>
                            </div>
                          )}
                          {maxPublicLocation?.mRPerHr && parseFloat(maxPublicLocation.mRPerHr) > 0 && (
                            <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                              <p className="text-sm print:text-[9px] font-semibold mb-2 print:mb-0.5" style={{ fontSize: '11px', margin: '2px 0', fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Public):</p>
                              <p className="text-xs print:text-[8px] mb-1 print:mb-0.5" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Location:</strong> {maxPublicLocation.location}</p>
                              <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Formula:</strong> ({survey.workload || 'â€”'} mAmin/week Ã— {maxPublicLocation.mRPerHr || 'â€”'} mR/hr) / (60 Ã— {survey.appliedCurrent || 'â€”'} mA)</p>
                              <p className="text-xs print:text-[8px] mt-1 print:mt-0.5" style={{ fontSize: '10px', margin: '2px 0' }}><strong>Result:</strong> {maxPublicWeekly} mR/week</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 6. Permissible Limit */}
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>6. Permissible Limit</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For location of Radiation Worker</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>20 mSv in a year (40 mR/week)</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Location of Member of Public</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>1 mSv in a year (2mR/week)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* 15. Alignment of Table/Gantry */}
            {testData.alignmentOfTableGantry && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>15. Alignment of Table/Gantry</h3>
                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result (Gantry midline to table midline)</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Tolerance</th>
                        <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.alignmentOfTableGantry.result || "-"}</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testData.alignmentOfTableGantry.toleranceSign || "Â±"}{testData.alignmentOfTableGantry.toleranceValue || "2"}</td>
                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                          <span className={testData.alignmentOfTableGantry.remark === "Pass" ? "text-green-600 font-bold" : testData.alignmentOfTableGantry.remark === "Fail" ? "text-red-600 font-bold" : ""}>
                            {testData.alignmentOfTableGantry.remark || "-"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* No data fallback */}
            {Object.values(testData).every(v => !v) && (
              <p className="text-center text-xl text-gray-500 mt-32 print:mt-8 print:text-sm">
                No detailed test results available for this report.
              </p>
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
          @page { margin: 0.5cm; size: A4; }
          table, tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .compact-table {
            font-size: 11px !important;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
          }
          .compact-table td, .compact-table th {
            padding: 0px 1px !important;
            font-size: 11px !important;
            line-height: 1.0 !important;
            min-height: 0 !important;
            height: auto !important;
            vertical-align: middle !important;
            border-color: #000000 !important;
            text-align: center !important;
          }
          table, td, th {
            border-color: #000000 !important;
          }
          table td, table th {
            text-align: center !important;
          }
          .force-small-text {
            font-size: 7px !important;
          }
          .force-small-text td, .force-small-text th {
            font-size: 7px !important;
            padding: 0px 1px !important;
            line-height: 1.0 !important;
          }
          .compact-table tr {
            height: auto !important;
            min-height: 0 !important;
            line-height: 1.0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          thead { display: table-header-group; }
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
          table {
            border-collapse: collapse;
            border-spacing: 0;
            border-width: 1px !important;
            border-style: solid !important;
            border-color: #000000 !important;
          }
          table td, table th {
            border-width: 1px !important;
            border-style: solid !important;
            border-color: #000000 !important;
          }
          table.border-2, table[class*="border-2"] {
            border-width: 1px !important;
          }
          table td.border-2, table th.border-2,
          table td[class*="border-2"], table th[class*="border-2"] {
            border-width: 1px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportCTScan;
