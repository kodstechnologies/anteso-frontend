// src/components/reports/ViewServiceReportInventionalRadiology.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReportHeaderForInventionalRadiology, getCentralBeamAlignmentByServiceIdForInventionalRadiology, getEffectiveFocalSpotByServiceIdForInventionalRadiology, getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology, getRadiationProtectionSurveyByServiceIdForInventionalRadiology, getAccuracyOfOperatingPotentialByServiceIdForInventionalRadiology, getMeasurementOfMaLinearityByServiceIdForInventionalRadiology, getDetails } from "../../../../../../api";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForInventionalRadiology from "./MainTestTableForInventionalRadiology";

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
  city?: string;
  hospitalName?: string;
  fullAddress?: string;
  leadOwner?: any;
  manufacturerName?: string;
  leadOwnerType?: string;
  leadOwnerRole?: string;
  leadOwnerName?: string;
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
  category: string;
  toolsUsed?: Tool[];
  notes?: Note[];

  // Test documents
  CentralBeamAlignmentInventionalRadiology?: any;
  EffectiveFocalSpotInventionalRadiology?: any;
  AccuracyOfIrradiationTimeInventionalRadiology?: any;
  TotalFilterationForInventionalRadiology?: any;
  ConsistencyOfRadiationOutputInventionalRadiology?: any;
  LowContrastResolutionInventionalRadiology?: any;
  HighContrastResolutionInventionalRadiology?: any;
  ExposureRateTableTopInventionalRadiology?: any;
  TubeHousingLeakageInventionalRadiology?: any;
  RadiationProtectionSurveyInventionalRadiology?: any;
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

const ViewServiceReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [testDataFrontal, setTestDataFrontal] = useState<any>({});
  const [testDataLateral, setTestDataLateral] = useState<any>({});

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const resolveSurveyData = (headerValue: any, apiValue: any) => {
          // Prefer fully populated survey objects; ignore plain id strings from header links.
          if (headerValue && typeof headerValue === "object" && !Array.isArray(headerValue)) return headerValue;
          if (apiValue?.data && typeof apiValue.data === "object" && !Array.isArray(apiValue.data)) return apiValue.data;
          if (apiValue && typeof apiValue === "object" && !Array.isArray(apiValue)) return apiValue;
          return null;
        };

        // Check if it's a double tube setup
        const savedTubeType = localStorage.getItem(`inventional_radiology_tube_type_${serviceId}`);
        const isDoubleTube = savedTubeType === 'double';

        // Always fetch single tube data (tubeId = null) for common tests and header
        const [response, detailsRes] = await Promise.all([
          getReportHeaderForInventionalRadiology(serviceId, null),
          getDetails(serviceId).catch(() => null),
        ]);

        if (response?.exists && response?.data) {
          const data = response.data;
          const detailsData = detailsRes?.data?.data || detailsRes?.data || {};
          const srfKey = data?.srfNumber || detailsData?.srfNumber || "";
          const cachedOrderBySrfRaw = srfKey ? localStorage.getItem(`order-basic-by-srf-${srfKey}`) : null;
          const cachedOrderBySrf = cachedOrderBySrfRaw ? JSON.parse(cachedOrderBySrfRaw) : {};
          const detailsLeadOwner =
            detailsData?.leadOwner ||
            detailsData?.leadowner ||
            cachedOrderBySrf?.leadOwner ||
            null;
          const detailsLeadOwnerRole = String(
            detailsData?.leadOwnerType ||
            detailsData?.leadOwnerRole ||
            cachedOrderBySrf?.leadOwner?.role ||
            detailsLeadOwner?.role ||
            ""
          ).trim();
          const detailsLeadOwnerName = String(
            detailsData?.manufacturerName ||
            cachedOrderBySrf?.manufacturerName ||
            detailsLeadOwner?.name ||
            ""
          ).trim();
          setReport({
            customerName: data.customerName || "N/A",
            address: data.address || "N/A",
            city: data.city || detailsData?.city || "",
            hospitalName: data.hospitalName || detailsData?.hospitalName || cachedOrderBySrf?.hospitalName || "",
            fullAddress: data.fullAddress || detailsData?.fullAddress || cachedOrderBySrf?.fullAddress || "",
            leadOwner: data.leadOwner || data.leadowner || detailsLeadOwner || "",
            manufacturerName: data.manufacturerName || detailsData?.manufacturerName || cachedOrderBySrf?.manufacturerName || "",
            leadOwnerType: data.leadOwnerType || data.leadownerType || detailsLeadOwnerRole || "",
            leadOwnerRole: data.leadOwnerRole || data.leadownerRole || detailsLeadOwnerRole || "",
            leadOwnerName: data.leadOwnerName || detailsLeadOwnerName || "",
            srfNumber: data.srfNumber || "N/A",
            srfDate: data.srfDate || "",
            reportULRNumber: data.reportULRNumber || "N/A",
            testReportNumber: data.testReportNumber || "N/A",
            issueDate: data.issueDate || "",
            nomenclature: data.nomenclature || "Interventional Radiology",
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
            category: data.category || "",
            toolsUsed: data.toolsUsed || [],
            notes: data.notes || defaultNotes,
          });

          if (isDoubleTube) {
            // Fetch both Tube Frontal and Tube Lateral data
            const [responseFrontal, responseLateral, centralBeamFrontal, effectiveFocalFrontal, consistencyFrontal, centralBeamLateral, effectiveFocalLateral, consistencyLateral, radiationProtection, accOpFrontal, accOpLateral, measurementMaFrontal, measurementMaLateral] = await Promise.all([
              getReportHeaderForInventionalRadiology(serviceId, 'frontal'),
              getReportHeaderForInventionalRadiology(serviceId, 'lateral'),
              getCentralBeamAlignmentByServiceIdForInventionalRadiology(serviceId, 'frontal'),
              getEffectiveFocalSpotByServiceIdForInventionalRadiology(serviceId, 'frontal'),
              getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology(serviceId, 'frontal'),
              getCentralBeamAlignmentByServiceIdForInventionalRadiology(serviceId, 'lateral'),
              getEffectiveFocalSpotByServiceIdForInventionalRadiology(serviceId, 'lateral'),
              getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology(serviceId, 'lateral'),
              getRadiationProtectionSurveyByServiceIdForInventionalRadiology(serviceId),
              getAccuracyOfOperatingPotentialByServiceIdForInventionalRadiology(serviceId, 'frontal'),
              getAccuracyOfOperatingPotentialByServiceIdForInventionalRadiology(serviceId, 'lateral'),
              getMeasurementOfMaLinearityByServiceIdForInventionalRadiology(serviceId, 'frontal'),
              getMeasurementOfMaLinearityByServiceIdForInventionalRadiology(serviceId, 'lateral'),
            ]);

            // Extract test data for Tube Frontal
            if (responseFrontal?.exists && responseFrontal?.data) {
              const dataFrontal = responseFrontal.data;
              setTestDataFrontal({
                centralBeamAlignment: dataFrontal.CentralBeamAlignmentInventionalRadiology || null,
                effectiveFocalSpot: dataFrontal.EffectiveFocalSpotInventionalRadiology || null,
                accuracyOfIrradiationTime: dataFrontal.AccuracyOfIrradiationTimeInventionalRadiology || null,
                totalFilteration: dataFrontal.TotalFilterationForInventionalRadiology || null,
                consistencyOfRadiationOutput: dataFrontal.ConsistencyOfRadiationOutputInventionalRadiology || null,
                lowContrastResolution: dataFrontal.LowContrastResolutionInventionalRadiology || null,
                highContrastResolution: dataFrontal.HighContrastResolutionInventionalRadiology || null,
                exposureRateTableTop: dataFrontal.ExposureRateTableTopInventionalRadiology || null,
                tubeHousingLeakage: dataFrontal.TubeHousingLeakageInventionalRadiology || null,
              });
            }

            // Update with individual test data for Tube Frontal
            setTestDataFrontal((prev: any) => ({
              ...prev,
              centralBeamAlignment: centralBeamFrontal?.data || null,
              effectiveFocalSpot: effectiveFocalFrontal?.data || null,
              consistencyOfRadiationOutput: consistencyFrontal?.data || null,
              accuracyOfOperatingPotential: accOpFrontal?.data || null,
              measurementOfMaLinearity: measurementMaFrontal || responseFrontal?.data?.MeasurementOfMaLinearityInventionalRadiology || prev?.measurementOfMaLinearity || null,
            }));

            // Extract test data for Tube Lateral
            if (responseLateral?.exists && responseLateral?.data) {
              const dataLateral = responseLateral.data;
              setTestDataLateral({
                centralBeamAlignment: dataLateral.CentralBeamAlignmentInventionalRadiology || null,
                effectiveFocalSpot: dataLateral.EffectiveFocalSpotInventionalRadiology || null,
                accuracyOfIrradiationTime: dataLateral.AccuracyOfIrradiationTimeInventionalRadiology || null,
                totalFilteration: dataLateral.TotalFilterationForInventionalRadiology || null,
                consistencyOfRadiationOutput: dataLateral.ConsistencyOfRadiationOutputInventionalRadiology || null,
                lowContrastResolution: dataLateral.LowContrastResolutionInventionalRadiology || null,
                highContrastResolution: dataLateral.HighContrastResolutionInventionalRadiology || null,
                exposureRateTableTop: dataLateral.ExposureRateTableTopInventionalRadiology || null,
                tubeHousingLeakage: dataLateral.TubeHousingLeakageInventionalRadiology || null,
              });
            }

            // Update with individual test data for Tube Lateral
            setTestDataLateral((prev: any) => ({
              ...prev,
              centralBeamAlignment: centralBeamLateral?.data || null,
              effectiveFocalSpot: effectiveFocalLateral?.data || null,
              consistencyOfRadiationOutput: consistencyLateral?.data || null,
              accuracyOfOperatingPotential: accOpLateral?.data || null,
              measurementOfMaLinearity: measurementMaLateral || responseLateral?.data?.MeasurementOfMaLinearityInventionalRadiology || prev?.measurementOfMaLinearity || null,
            }));

            // Set combined test data for summary (common tests only)
            setTestData({
              // Common tests that don't have tubeId
              radiationProtectionSurvey: resolveSurveyData(data.RadiationProtectionSurveyInventionalRadiology, radiationProtection),
            });
          } else {
            // Single tube - fetch individual test data
            const [centralBeam, effectiveFocal, consistency, radiationProtection, accOpSingle, measurementMaSingle] = await Promise.all([
              getCentralBeamAlignmentByServiceIdForInventionalRadiology(serviceId, null),
              getEffectiveFocalSpotByServiceIdForInventionalRadiology(serviceId, null),
              getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology(serviceId, null),
              getRadiationProtectionSurveyByServiceIdForInventionalRadiology(serviceId),
              getAccuracyOfOperatingPotentialByServiceIdForInventionalRadiology(serviceId, null),
              getMeasurementOfMaLinearityByServiceIdForInventionalRadiology(serviceId, null),
            ]);

            setTestData({
              centralBeamAlignment: data.CentralBeamAlignmentInventionalRadiology || centralBeam?.data || null,
              effectiveFocalSpot: data.EffectiveFocalSpotInventionalRadiology || effectiveFocal?.data || null,
              accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeInventionalRadiology || null,
              totalFilteration: data.TotalFilterationForInventionalRadiology || null,
              consistencyOfRadiationOutput: data.ConsistencyOfRadiationOutputInventionalRadiology || consistency?.data || null,
              lowContrastResolution: data.LowContrastResolutionInventionalRadiology || null,
              highContrastResolution: data.HighContrastResolutionInventionalRadiology || null,
              exposureRateTableTop: data.ExposureRateTableTopInventionalRadiology || null,
              tubeHousingLeakage: data.TubeHousingLeakageInventionalRadiology || null,
              radiationProtectionSurvey: resolveSurveyData(data.RadiationProtectionSurveyInventionalRadiology, radiationProtection),
              accuracyOfOperatingPotential: accOpSingle?.data || null,
              measurementOfMaLinearity: measurementMaSingle || data.MeasurementOfMaLinearityInventionalRadiology || null,
            });
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load Interventional Radiology report:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [serviceId]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));
  const getExposureMode = (row: any) => row.mode || row.remark || row.remarks || "-";
  const getExposureResult = (row: any) => row.result || row.finalResult || row.remark || row.remarks || "-";
  const getExposureResultClass = (row: any) => {
    const result = String(getExposureResult(row)).toUpperCase();
    if (result.includes("PASS")) return "text-green-600";
    if (result.includes("FAIL")) return "text-red-600";
    return "";
  };
  const hasMaLinearityRows = (data: any) => {
    const rows = data?.table2 || data?.Table2 || data?.rows || data?.Rows;
    return Array.isArray(rows) && rows.length > 0;
  };

  /** Match RadiographyFixed ViewServiceReport — thin borders, compact QA tables */
  const cellStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "4px 6px",
    fontSize: "11px",
    lineHeight: "1.3",
    minHeight: "0",
    height: "auto",
    borderColor: "#000",
    textAlign: "center",
    verticalAlign: "middle",
    fontWeight: 400,
    boxSizing: "border-box",
    ...extra,
  });

  const tableStyle: React.CSSProperties = {
    fontSize: "11px",
    tableLayout: "fixed",
    borderCollapse: "collapse",
    borderSpacing: "0",
    width: "100%",
    border: "0.1px solid #666",
    textAlign: "center",
  };

  /** Central beam detail block — same structure as RadiographyFixed ViewServiceReport §2 */
  const renderCentralBeamAlignmentDetail = (c: any) => {
    if (!c) return null;
    return (
      <>
        {c.techniqueFactors && (
          <div style={{ marginBottom: "4px" }}>
            <p style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "3px" }}>Operating parameters:</p>
            <table style={{ ...tableStyle, width: "100%" }}>
              <thead>
                <tr>
                  {["FFD (cm)", "kV", "mAs"].map((h) => (
                    <th key={h} style={cellStyle({ fontWeight: 700, border: "0.1px solid #666", padding: "1px 8px" })}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>
                    {c.techniqueFactors.fcd || c.techniqueFactors.sid || "-"}
                  </td>
                  <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>{c.techniqueFactors.kv || "-"}</td>
                  <td style={cellStyle({ border: "0.1px solid #666", padding: "1px 8px" })}>{c.techniqueFactors.mas || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {c.observedTilt && (
          <div>
            <p style={{ fontSize: "11px", marginBottom: "4px" }}>
              Observe the images of the two steel balls on the radiograph and evaluate tilt in the central beam
            </p>
            <table style={tableStyle} className="compact-table">
              <tbody>
                <tr>
                  <th scope="row" style={cellStyle({ width: "50%", border: "0.1px solid #666", fontWeight: 700 })}>
                    Observed tilt
                  </th>
                  <td style={cellStyle({ border: "0.1px solid #666" })}>
                    {c.observedTilt.value || "-"}&deg;
                    {c.observedTilt.remark && <span style={{ marginLeft: "8px" }}>{c.observedTilt.remark}</span>}
                  </td>
                </tr>
                <tr>
                  <th scope="row" style={cellStyle({ border: "0.1px solid #666", fontWeight: 700 })}>
                    Tolerance: Central Beam Alignment
                  </th>
                  <td style={cellStyle({ border: "0.1px solid #666" })}>
                    {c.tolerance && typeof c.tolerance === "object"
                      ? `${c.tolerance.operator || "<"} ${c.tolerance.value || "1.5"}°`
                      : c.tolerance || "< 1.5°"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  // Helper function to render test table for both tubes
  const renderTestTable = (
    testDataFrontal: any,
    testDataLateral: any,
    testDataSingle: any,
    renderTable: (data: any) => React.ReactNode
  ) => {
    if (isDoubleTube) {
      return (
        <>
          {testDataFrontal && (
            <div className="mb-4 print:mb-2">
              <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
              {renderTable(testDataFrontal)}
            </div>
          )}
          {testDataLateral && (
            <div className="mb-4 print:mb-2">
              <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
              {renderTable(testDataLateral)}
            </div>
          )}
        </>
      );
    } else {
      return testDataSingle ? renderTable(testDataSingle) : null;
    }
  };

  const renderLowContrastTable = (data: any) => (
    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
        <tbody>
          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
            <td className="border border-black p-2 print:p-1 text-left font-medium" style={{ padding: '0px 2px', fontSize: '11px', borderColor: '#000000' }}>
              Diameter of the smallest size hole clearly resolved on the monitor
            </td>
            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 2px', fontSize: '11px', borderColor: '#000000' }}>
              <span className="font-semibold">{data?.smallestHoleSize || "-"}</span> mm hole pattern must be resolved
            </td>
          </tr>
          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
            <td className="border border-black p-2 print:p-1 text-left font-medium" style={{ padding: '0px 2px', fontSize: '11px', borderColor: '#000000' }}>
              Recommended performance standard
            </td>
            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 2px', fontSize: '11px', borderColor: '#000000' }}>
              <span className="font-semibold">{data?.recommendedStandard || "3.0"}</span> mm hole pattern must be resolved
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const renderHighContrastTable = (data: any) => (
    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
        <tbody>
          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
            <td className="border border-black p-2 print:p-1 text-left font-medium" style={{ padding: '0px 2px', fontSize: '11px', borderColor: '#000000' }}>
              Bar strips resolved on the monitor (lp/mm)
            </td>
            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 2px', fontSize: '11px', borderColor: '#000000' }}>
              <span className="font-semibold">{data?.measuredLpPerMm || "-"}</span> lp/mm pattern must be resolved
            </td>
          </tr>
          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
            <td className="border border-black p-2 print:p-1 text-left font-medium" style={{ padding: '0px 2px', fontSize: '11px', borderColor: '#000000' }}>
              Recommended performance standard
            </td>
            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 2px', fontSize: '11px', borderColor: '#000000' }}>
              <span className="font-semibold">{data?.recommendedStandard || "1.50"}</span> lp/mm pattern must be resolved
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const hasTubeHousingLeakageData = (leakage: any) =>
    !!(leakage && (leakage.leakageMeasurements?.length > 0 || leakage.fcd));

  const renderTubeHousingLeakageTable = (tubeHousingLeakage: any) => (
    <>
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
                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{tubeHousingLeakage.fcd || "100"}</td>
                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{tubeHousingLeakage.kv || "-"}</td>
                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{tubeHousingLeakage.ma || "-"}</td>
                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{tubeHousingLeakage.time || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Workload and Tolerance Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 print:mb-1">
        <div>
          <p className="text-xs print:text-[8px]" style={{ fontSize: '10px' }}>
            <strong>Workload:</strong> {tubeHousingLeakage.workload || "-"} mA·min/week
          </p>
        </div>
        <div>
          {/* Intentionally left empty to preserve current print layout */}
        </div>
      </div>

      {/* Exposure Level Table */}
      {tubeHousingLeakage.leakageMeasurements?.length > 0 && (
        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
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
              {tubeHousingLeakage.leakageMeasurements.map((row: any, i: number) => {
                const maValue = parseFloat(tubeHousingLeakage.ma || "0");
                const workloadValue = parseFloat(tubeHousingLeakage.workload || "0");
                const toleranceVal = parseFloat(tubeHousingLeakage.toleranceValue || "1");
                const toleranceOperator = tubeHousingLeakage.toleranceOperator || "less than or equal to";

                const values = [row.left, row.right, row.front, row.back, row.top]
                  .map(v => parseFloat(v) || 0)
                  .filter(v => v > 0);
                const rowMax = values.length > 0 ? Math.max(...values) : 0;

                let calculatedMR = "-";
                let calculatedMGy = "-";
                let remark = row.remark || "-";

                if (rowMax > 0 && maValue > 0 && workloadValue > 0) {
                  const resMR = (workloadValue * rowMax) / (60 * maValue);
                  const resMGy = resMR / 114;
                  calculatedMR = resMR.toFixed(3);
                  calculatedMGy = resMGy.toFixed(4);

                  if (!remark || remark === "-" || remark === "") {
                    let pass = false;
                    if (toleranceOperator === "less than or equal to") pass = resMGy <= toleranceVal;
                    else if (toleranceOperator === "greater than or equal to") pass = resMGy >= toleranceVal;
                    else pass = Math.abs(resMGy - toleranceVal) < 0.01;
                    remark = pass ? "Pass" : "Fail";
                  }
                }

                return (
                  <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                    <td className="border border-black p-1 text-center font-medium" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.location || "-"}</td>
                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.left || "-"}</td>
                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.right || "-"}</td>
                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.front || "-"}</td>
                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.back || "-"}</td>
                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.top || "-"}</td>
                    <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMR}</td>
                    <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{calculatedMGy}</td>
                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                      <span className={remark === "Pass" ? "text-green-600 font-bold" : remark === "Fail" ? "text-red-600 font-bold" : ""}>
                        {remark}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Calculation Formula, Summary Blocks and Tolerance */}
      {(() => {
        const maValue = parseFloat(tubeHousingLeakage.ma || "0");
        const workloadValue = parseFloat(tubeHousingLeakage.workload || "0");

        const getSummaryForLocation = (locName: string) => {
          const row = tubeHousingLeakage.leakageMeasurements?.find((m: any) => m.location === locName);
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
          <div className="space-y-4 print:space-y-1">
            {/* Formula Block */}
            <div className="bg-gray-50 p-4 print:p-1 rounded border border-gray-200">
              <p className="text-sm print:text-[10px] font-bold mb-2 print:mb-1">Calculation Formula:</p>
              <div className="bg-white p-3 print:p-1 border border-dashed border-gray-400 text-center font-mono text-sm print:text-[10px]">
                Maximum Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA)
              </div>
              <p className="text-[10px] print:text-[8px] mt-2 text-gray-600 italic">
                Where: Workload = {workloadValue} mA·min/week | mA = {maValue} | 1 mGy = 114 mR
              </p>
            </div>

            {/* Summary Blocks */}
            <div className="grid grid-cols-2 gap-4 print:gap-1">
              {tubeSummary && (
                <div className="border border-blue-200 rounded p-3 print:p-1 bg-blue-50/30">
                  <p className="font-bold text-xs print:text-[9px] text-blue-800 mb-2">Tube Housing Summary:</p>
                  <div className="text-[11px] print:text-[8px] space-y-1">
                    <p>Max Measured: <strong>{tubeSummary.rowMax} mR/hr</strong></p>
                    <p>Result: ({workloadValue} × {tubeSummary.rowMax}) / (60 × {maValue}) = <strong>{tubeSummary.resMR.toFixed(3)} mR</strong></p>
                    <p>In mGy: {tubeSummary.resMR.toFixed(3)} / 114 = <span className="font-bold text-blue-700">{tubeSummary.resMGy.toFixed(4)} mGy</span></p>
                  </div>
                </div>
              )}
              {collimatorSummary && (
                <div className="border border-indigo-200 rounded p-3 print:p-1 bg-indigo-50/30">
                  <p className="font-bold text-xs print:text-[9px] text-indigo-800 mb-2">Collimator Summary:</p>
                  <div className="text-[11px] print:text-[8px] space-y-1">
                    <p>Max Measured: <strong>{collimatorSummary.rowMax} mR/hr</strong></p>
                    <p>Result: ({workloadValue} × {collimatorSummary.rowMax}) / (60 × {maValue}) = <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong></p>
                    <p>In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 = <span className="font-bold text-indigo-700">{collimatorSummary.resMGy.toFixed(4)} mGy</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Tolerance Narrative */}
            <div className="bg-blue-50 p-4 print:p-1 border-l-4 border-blue-500 rounded-r">
              <p className="text-[11px] print:text-[8px] leading-relaxed">
                <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be{' '}
                {tubeHousingLeakage.toleranceOperator === 'less than or equal to'
                  ? '≤'
                  : tubeHousingLeakage.toleranceOperator === 'greater than or equal to'
                    ? '≥'
                    : '='}{' '}
                <strong>
                  {tubeHousingLeakage.toleranceValue || '1'} mGy ({parseFloat(tubeHousingLeakage.toleranceValue || '1') * 114} mR) in one hour.
                </strong>
              </p>
            </div>
          </div>
        );
      })()}
    </>
  );

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `InterventionalRadiology-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Interventional Radiology Report...</div>;

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
  const leadOwnerRole = String(
    report?.leadOwnerType ||
    report?.leadOwnerRole ||
    report?.leadOwner?.role ||
    report?.leadOwner?.leadOwnerType ||
    report?.leadOwner ||
    ""
  ).trim().toLowerCase();
  const leadOwnerName = String(
    report?.leadOwner?.name ||
    report?.leadOwner?.fullName ||
    report?.leadOwner?.companyName ||
    report?.leadOwner ||
    ""
  ).trim();
  const isManufacturerLeadOwner =
    leadOwnerRole === "manufacturer" ||
    leadOwnerName.toLowerCase() === "manufacturer" ||
    !!String(report?.manufacturerName || "").trim();
  const manufacturerDisplayName =
    report?.manufacturerName ||
    report?.leadOwnerName ||
    report?.leadOwner?.name ||
    report?.leadOwner?.fullName ||
    report?.leadOwner?.companyName ||
    "-";
  const testingSiteName = report?.hospitalName || report?.customerName || "-";
  const testingSiteAddress = report?.fullAddress || report?.address || "-";

  // Check if it's a double tube setup
  const savedTubeType = localStorage.getItem(`inventional_radiology_tube_type_${serviceId}`);
  const isDoubleTube = savedTubeType === 'double';

  /** Total Filtration result table (same logic/fields as RadiographyFixed ViewServiceReport). */
  const renderTotalFiltration = (totalData: any) => {
    if (!totalData?.totalFiltration) return null;
    const tf = totalData.totalFiltration;
    const ft = {
      forKvGreaterThan70: "1.5",
      forKvBetween70And100: "2.0",
      forKvGreaterThan100: "2.5",
      kvThreshold1: "70",
      kvThreshold2: "100",
      ...(totalData.filtrationTolerance || {}),
    };

    const atKvpRaw = tf.atKvp ?? tf.atKVp ?? "";
    let kvp = parseFloat(String(atKvpRaw));
    if (isNaN(kvp) && Array.isArray(totalData.measurements) && totalData.measurements.length > 0) {
      const first = totalData.measurements.find((m: any) => m?.appliedKvp != null && String(m.appliedKvp).trim() !== "");
      if (first) kvp = parseFloat(String(first.appliedKvp));
    }

    const measuredMmAl = tf.required ?? tf.measured;
    const measured = parseFloat(String(measuredMmAl ?? ""));
    const threshold1 = parseFloat(String(ft.kvThreshold1 ?? "70"));
    const threshold2 = parseFloat(String(ft.kvThreshold2 ?? "100"));

    let requiredTol = NaN;
    if (!isNaN(kvp)) {
      if (kvp < threshold1) requiredTol = parseFloat(String(ft.forKvGreaterThan70 ?? "1.5"));
      else if (kvp <= threshold2) requiredTol = parseFloat(String(ft.forKvBetween70And100 ?? "2.0"));
      else requiredTol = parseFloat(String(ft.forKvGreaterThan100 ?? "2.5"));
    }

    const filtrationRemark = (!isNaN(measured) && !isNaN(requiredTol))
      ? (measured >= requiredTol ? "PASS" : "FAIL")
      : "-";

    const atKvpDisplay = !isNaN(kvp) ? String(kvp) : (atKvpRaw !== "" ? atKvpRaw : "-");

    return (
      <div className="border border-black rounded" style={{ padding: '4px 6px', marginTop: '4px' }}>
        <h4 className="font-semibold mb-2" style={{ fontSize: '11px', marginBottom: '4px' }}>5.Total Filtration</h4>
        <table className="w-full border border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
          <tbody>
            <tr>
              <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>At kVp</td>
              <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{atKvpDisplay !== "-" ? `${atKvpDisplay} kVp` : "-"}</td>
            </tr>
            <tr>
              <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Measured Total Filtration</td>
              <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{measuredMmAl != null && measuredMmAl !== "" ? measuredMmAl : "-"} mm Al</td>
            </tr>
            <tr>
              <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Required (Tolerance)</td>
              <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>
                {!isNaN(requiredTol) ? `≥ ${requiredTol} mm Al` : "-"}
              </td>
            </tr>
            <tr>
              <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Result</td>
              <td className="border border-black text-center font-bold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                <span className={filtrationRemark === "PASS" ? "text-green-600" : filtrationRemark === "FAIL" ? "text-red-600" : ""}>
                  {filtrationRemark}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        {/* Filtration Tolerance Reference */}
        <div style={{ marginTop: '4px', fontSize: '10px', color: '#555' }}>
          <span className="font-semibold">Tolerance criteria: </span>
          {ft.forKvGreaterThan70 ?? "1.5"} mm Al for kV &lt; {ft.kvThreshold1 ?? "70"} |&nbsp;
          {ft.forKvBetween70And100 ?? "2.0"} mm Al for {ft.kvThreshold1 ?? "70"} ≤ kV ≤ {ft.kvThreshold2 ?? "100"} |&nbsp;
          {ft.forKvGreaterThan100 ?? "2.5"} mm Al for kV &gt; {ft.kvThreshold2 ?? "100"}
        </div>
      </div>
    );
  };

  /** Accuracy of Operating Potential from TotalFilteration document (Applied kVp × mA stations) — RadiographyFixed. */
  const renderOperatingPotentialFromTotalFilteration = (totalData: any) => {
    if (!totalData?.measurements?.length) return null;
    return (
      <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
        <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Accuracy of Operating Potential</h4>
        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                {totalData.mAStations?.map((ma: string, idx: number) => (
                  <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{ma}</th>
                ))}
                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average kVp</th>
                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {totalData.measurements.map((row: any, i: number) => (
                <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || "-"}</td>
                  {totalData.mAStations?.map((_: string, idx: number) => (
                    <td key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredValues?.[idx] || "-"}</td>
                  ))}
                  <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.averageKvp || "-"}</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                    <span className={row.remarks === "PASS" || row.remarks === "Pass" ? "text-green-600 font-semibold" : row.remarks === "FAIL" || row.remarks === "Fail" ? "text-red-600 font-semibold" : ""}>
                      {row.remarks || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalData.tolerance && (
          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
            <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
              <strong>Tolerance:</strong> {totalData.tolerance.sign || "±"} {totalData.tolerance.value || "-"}kVp
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderFullTotalFiltrationSection = (totalData: any) => (
    <>
      {renderOperatingPotentialFromTotalFilteration(totalData)}
      {totalData?.totalFiltration ? renderTotalFiltration(totalData) : null}
    </>
  );

  const renderConsistencyOfRadiationOutput = (consistencyData: any) => {
    if (!consistencyData || !consistencyData.outputRows || consistencyData.outputRows.length === 0) return null;
    const rows = consistencyData.outputRows;
    const ffdValue = (() => {
      const raw = consistencyData.fdd ?? consistencyData.ffd;
      if (raw === undefined || raw === null || raw === "") return null;
      if (typeof raw === "object") {
        return raw.value ?? null;
      }
      return raw;
    })();
    // Determine max measurement count across all rows
    const measCount = Math.max(...rows.map((r: any) => (r.outputs ?? []).length), 1);
    const tolVal = parseFloat(consistencyData.tolerance?.value ?? '0.05') || 0.05;
    const tolOp = consistencyData.tolerance?.operator ?? '<=';

    const getVal = (o: any): number => {
      if (o == null) return NaN;
      if (typeof o === 'number') return o;
      if (typeof o === 'string') return parseFloat(o);
      if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
      return NaN;
    };
    const getDisplayValue = (...vals: any[]) => {
      for (const v of vals) {
        if (v === undefined || v === null || v === "") continue;
        if (typeof v === "object") {
          if ("value" in v && v.value !== undefined && v.value !== null && v.value !== "") {
            return v.value;
          }
          continue;
        }
        return v;
      }
      return "-";
    };

    return (
      <>
        {/* FFD small table */}
        {ffdValue !== null && (
          <div className="mb-3 print:mb-1" style={{ marginBottom: '4px' }}>
            <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FFD (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{ffdValue}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '10px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0' }}>
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                {Array.from({ length: measCount }, (_, i) => (
                  <th key={i} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Meas {i + 1}</th>
                ))}
                <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Avg (X̄)</th>
                <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>CoV</th>
                <th className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, i: number) => {
                const outputs: number[] = (row.outputs ?? []).map(getVal).filter((n: number) => !isNaN(n) && n > 0);
                const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                const avgDisplay = avg !== null ? avg.toFixed(4) : (row.avg || '-');
                let covDisplay = '-';
                let remark = row.remark || '-';
                if (avg !== null && avg > 0) {
                  const variance = outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / outputs.length;
                  const cov = Math.sqrt(variance) / avg;
                  if (isFinite(cov)) {
                    covDisplay = cov.toFixed(3);
                    const passes = (tolOp === '<=' || tolOp === '<') ? cov <= tolVal : cov >= tolVal;
                    remark = passes ? 'Pass' : 'Fail';
                  }
                } else if (row.cv) {
                  covDisplay = row.cv;
                }

                return (
                  <tr key={i} className="text-center">
                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                      {getDisplayValue(row.kv, row.kvp, row.kV, row.kVp, row.appliedKv, row.appliedKvp)}
                    </td>
                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                      {getDisplayValue(row.mas, row.mAs, row.appliedMas, row.appliedMA)}
                    </td>
                    {Array.from({ length: measCount }, (_, j) => {
                      const raw = (row.outputs ?? [])[j];
                      const display = raw != null ? (typeof raw === 'object' && 'value' in raw ? raw.value : String(raw)) : '-';
                      return (
                        <td key={j} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{display || '-'}</td>
                      );
                    })}
                    <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>{avgDisplay}</td>
                    <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{covDisplay}</td>
                    <td className="border border-black p-1 text-center font-semibold" style={{ padding: '0px 2px', fontSize: '10px' }}>
                      <span className={remark === 'Pass' ? 'text-green-600' : remark === 'Fail' ? 'text-red-600' : ''}>
                        {remark}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {consistencyData.tolerance && (
          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
            <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
              <strong>Acceptance Criteria:</strong> CoV {consistencyData.tolerance.operator || "<="} {consistencyData.tolerance.value || "0.05"}
            </p>
          </div>
        )}
      </>
    );
  };

  /** Measurement of mA Linearity — same table structure as RadiographyFixed §6 Linearity of mAs Loading (two-row header, CoL rowSpan, recalculated X / Xmax / Xmin). */
  const renderMeasurementOfMaLinearityLikeRadiographyFixed = (mol: any) => {
    const table1 = mol?.table1 || mol?.Table1 || [];
    const table2 = mol?.table2 || mol?.Table2 || [];
    const measHeaderSource = mol?.measHeaders || mol?.measurementHeaders || mol?.MeasHeaders || [];
    const tolerance = mol?.tolerance ?? mol?.Tolerance;
    const toleranceOperator = mol?.toleranceOperator ?? mol?.ToleranceOperator;

    if (!Array.isArray(table2) || table2.length === 0) return null;
    const measHeaders = (() => {
      if (Array.isArray(measHeaderSource) && measHeaderSource.length > 0) return measHeaderSource;
      const n = Math.max(
        1,
        ...table2.map((r: any) => (Array.isArray(r.measuredOutputs) ? r.measuredOutputs.length : 0))
      );
      return Array.from({ length: n }, (_, i) => `Meas ${i + 1}`);
    })();
    const tolVal = parseFloat(tolerance ?? "0.1") || 0.1;
    const tolOp = toleranceOperator ?? "<=";

    const t1First = Array.isArray(table1) && table1.length > 0 ? table1[0] : null;
    const hasMas = t1First?.time && String(t1First.time).trim() !== "" && String(t1First.time).trim() !== "-";
    const mAsColLabel = "mA";
    const xColLabel = hasMas ? "X (mGy/(mA*s))" : "X (mGy/mA)";

    return (
      <>
        {Array.isArray(table1) && table1.length > 0 && (
          <div className="mb-4 print:mb-1" style={{ marginBottom: "6px" }}>
            <p className="font-semibold mb-1 text-sm print:text-xs" style={{ fontSize: "11px", marginBottom: "3px" }}>Test Conditions:</p>
            <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: "11px", borderCollapse: "collapse", borderSpacing: "0" }}>
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-black px-4 py-1 text-center" style={{ padding: "0px 8px", fontSize: "11px" }}>kVp</th>
                  <th className="border border-black px-4 py-1 text-center" style={{ padding: "0px 8px", fontSize: "11px" }}>Slice Thickness (mm)</th>
                  <th className="border border-black px-4 py-1 text-center" style={{ padding: "0px 8px", fontSize: "11px" }}>Time (sec)</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: "0px 8px", fontSize: "11px" }}>{table1[0]?.kvp ?? table1[0]?.kVp ?? "-"}</td>
                  <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: "0px 8px", fontSize: "11px" }}>{table1[0]?.sliceThickness ?? "-"}</td>
                  <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: "0px 8px", fontSize: "11px" }}>{table1[0]?.time ?? "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="overflow-x-auto mb-6 print:mb-1 print:overflow-visible" style={{ marginBottom: "4px" }}>
          <table className="w-full border-2 border-black compact-table force-small-text" style={{ fontSize: "10px", tableLayout: "fixed", width: "100%" }}>
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>{mAsColLabel}</th>
                <th colSpan={measHeaders.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>
                  Output (mGy)
                </th>
                <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>Avg Output</th>
                <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>{xColLabel}</th>
                <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>X MAX</th>
                <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>X MIN</th>
                <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>CoL</th>
                <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>Remarks</th>
              </tr>
              <tr>
                <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                {measHeaders.map((header: string, idx: number) => (
                  <th key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>
                    {header || `Meas ${idx + 1}`}
                  </th>
                ))}
                <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
                <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = table2;
                const formatV = (val: any) => {
                  if (val === undefined || val === null) return "-";
                  const str = String(val).trim();
                  return str === "" || str === "—" || str === "undefined" || str === "null" ? "-" : str;
                };

                const xValues: number[] = [];
                const processedRows = rows.map((row: any) => {
                  const outputs = (row.measuredOutputs ?? row.outputs ?? [])
                    .map((v: any) => parseFloat(v))
                    .filter((v: number) => !isNaN(v) && v > 0);
                  const avg =
                    outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                  const avgDisplay = avg !== null ? parseFloat(avg.toFixed(4)).toFixed(4) : "—";

                  const mALabel = String(row.mAsApplied ?? row.mAApplied ?? row.mAsRange ?? row.ma ?? "");
                  const match = mALabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                  const midMA = match
                    ? (parseFloat(match[1]) + parseFloat(match[2])) / 2
                    : parseFloat(mALabel) || 0;
                  const timeVal = parseFloat(String(table1?.[0]?.time ?? t1First?.time ?? ""));
                  const hasValidTime = !isNaN(timeVal) && timeVal > 0;

                  let x = null;
                  if (avg !== null && midMA > 0 && hasValidTime) {
                    x = avg / (midMA * timeVal);
                  } else if (avg !== null && midMA > 0) {
                    x = avg / midMA;
                  }
                  const xDisplay = x !== null ? parseFloat(x.toFixed(4)).toFixed(4) : "—";
                  if (x !== null) xValues.push(parseFloat(x.toFixed(4)));

                  return { ...row, _avgDisplay: avgDisplay, _xDisplay: xDisplay };
                });

                const hasData = xValues.length > 0;
                const xMax = hasData ? parseFloat(Math.max(...xValues).toFixed(4)).toFixed(4) : "—";
                const xMin = hasData ? parseFloat(Math.min(...xValues).toFixed(4)).toFixed(4) : "—";
                const colNum =
                  hasData && xMax !== "—" && xMin !== "—" && parseFloat(xMax) + parseFloat(xMin) > 0
                    ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
                    : 0;
                const col = hasData && colNum > 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : "—";

                let pass = false;
                if (hasData && col !== "—") {
                  const colVal2 = parseFloat(col);
                  switch (tolOp) {
                    case "<":
                      pass = colVal2 < tolVal;
                      break;
                    case ">":
                      pass = colVal2 > tolVal;
                      break;
                    case "<=":
                      pass = colVal2 <= tolVal;
                      break;
                    case ">=":
                      pass = colVal2 >= tolVal;
                      break;
                    case "=":
                      pass = Math.abs(colVal2 - tolVal) < 0.0001;
                      break;
                    default:
                      pass = colVal2 <= tolVal;
                  }
                }
                const remarks = hasData && col !== "—" ? (pass ? "Pass" : "Fail") : "—";

                return processedRows.map((row: any, i: number) => (
                  <tr key={i} className="text-center" style={{ fontSize: "10px" }}>
                    <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>
                      {formatV(row.mAsApplied ?? row.mAApplied ?? row.mAsRange ?? row.ma)}
                    </td>
                    {measHeaders.map((_: string, idx: number) => (
                      <td key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: "10px", padding: "5px" }}>
                        {formatV(row.measuredOutputs?.[idx])}
                      </td>
                    ))}
                    <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: "10px", padding: "5px" }}>
                      {row._avgDisplay}
                    </td>
                    <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: "10px", padding: "5px" }}>
                      {row._xDisplay}
                    </td>
                    {i === 0 ? (
                      <>
                        <td
                          rowSpan={rows.length}
                          className="border border-black p-1.5 print:p-[3px] font-medium text-center"
                          style={{ fontSize: "10px", padding: "5px", verticalAlign: "middle" }}
                        >
                          {xMax}
                        </td>
                        <td
                          rowSpan={rows.length}
                          className="border border-black p-1.5 print:p-[3px] font-medium text-center"
                          style={{ fontSize: "10px", padding: "5px", verticalAlign: "middle" }}
                        >
                          {xMin}
                        </td>
                        <td
                          rowSpan={rows.length}
                          className="border border-black p-1.5 print:p-[3px] font-medium text-center"
                          style={{ fontSize: "10px", padding: "5px", verticalAlign: "middle" }}
                        >
                          {col}
                        </td>
                        <td
                          rowSpan={rows.length}
                          className="border border-black p-1.5 print:p-[3px] text-center"
                          style={{ fontSize: "10px", padding: "5px", verticalAlign: "middle" }}
                        >
                          <span
                            className={
                              remarks === "Pass"
                                ? "text-green-600 font-semibold"
                                : remarks === "Fail"
                                  ? "text-red-600 font-semibold"
                                  : ""
                            }
                            style={{ fontSize: "10px" }}
                          >
                            {remarks}
                          </span>
                        </td>
                      </>
                    ) : null}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
        {tolerance != null && tolerance !== "" && (
          <div className="bg-gray-50 p-4 print:p-1 rounded border">
            <p className="text-sm print:text-[10px]" style={{ fontSize: "10px" }}>
              <strong>Tolerance (CoL):</strong> {tolOp} {tolerance ?? "0.1"}
            </p>
          </div>
        )}
      </>
    );
  };

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
            QA TEST REPORT FOR INTERVENTIONAL RADIOLOGY X-RAY EQUIPMENT
          </h1>
          <p className="text-center italic text-sm mb-6 print:mb-2 print:text-[9px]">
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>

          {/* Customer Details */}
          <section className="mb-4 print:mb-2">
            <h2 className="font-bold text-lg mb-3 print:mb-1 print:text-sm">1. Customer Details</h2>
            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
              <tbody>
                {isManufacturerLeadOwner && (
                  <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                    <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Name of the customer</td>
                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{manufacturerDisplayName}</td>
                  </tr>
                )}
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium w-1/2 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Name of the testing site</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testingSiteName}</td>
                </tr>
                <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                  <td className="border border-black p-2 print:p-1 font-medium text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Address of the testing site</td>
                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{testingSiteAddress}</td>
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
                  ...(report.category && report.category !== "N/A" && report.category !== "-" ? [["Category", report.category]] : []),
                  ["Condition", report.condition],
                  ["Testing Procedure No.", report.testingProcedureNumber || "-"],
                  ["Engineer Name", report.engineerNameRPId],
                  ["RP ID", report.rpId || "-"],
                  ["Test Date", formatDate(report.testDate)],
                  ["Due Date", formatDate(report.testDueDate)],
                  ["Location", report.location],
                  ["Temperature (°C)", report.temperature || "-"],
                  ["Humidity (%)", report.humidity || "-"],
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
            <p>2nd Floor, D-290, Sector – 63, Noida, New Delhi – 110085</p>
            <p>Email: info@antesobiomedicalengg.com</p>
          </footer>
        </div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none flex flex-col items-center" style={{ width: '100%', maxWidth: 'none' }}>
            {isDoubleTube ? (
              <>
                {/* Summary for Tube Frontal */}
                <div className="mb-8 print:mb-4 w-full flex flex-col items-center">
                  <h1 className="text-xl font-bold text-center mb-4 print:mb-2 print:text-base" style={{ fontSize: '14px' }}>
                    SUMMARY OF QA TEST RESULTS - TUBE FRONTAL
                  </h1>
                  <div className="w-full flex justify-center">
                    <MainTestTableForInventionalRadiology testData={testDataFrontal} />
                  </div>
                </div>
                {/* Summary for Tube Lateral */}
                <div className="mb-8 print:mb-4 w-full flex flex-col items-center">
                  <h1 className="text-xl font-bold text-center mb-4 print:mb-2 print:text-base" style={{ fontSize: '14px' }}>
                    SUMMARY OF QA TEST RESULTS - TUBE LATERAL
                  </h1>
                  <div className="w-full flex justify-center">
                    <MainTestTableForInventionalRadiology testData={testDataLateral} />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <MainTestTableForInventionalRadiology testData={testData} />
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

            {/* 1. Central Beam Alignment — same layout as RadiographyFixed detailed section 2 */}
            {((isDoubleTube && (testDataFrontal.centralBeamAlignment || testDataLateral.centralBeamAlignment)) || (!isDoubleTube && testData.centralBeamAlignment)) && (
              <div className="mb-4 test-section print:mb-2 print:break-inside-avoid" style={{ marginBottom: "8px" }}>
                <h3 className="font-bold mb-2" style={{ fontSize: "12px" }}>
                  1. Central Beam Alignment
                </h3>
                {isDoubleTube ? (
                  <>
                    {testDataFrontal.centralBeamAlignment && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="font-semibold mb-2 print:mb-1" style={{ fontSize: "11px", marginBottom: "2px" }}>
                          Tube Frontal
                        </h4>
                        {renderCentralBeamAlignmentDetail(testDataFrontal.centralBeamAlignment)}
                      </div>
                    )}
                    {testDataLateral.centralBeamAlignment && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="font-semibold mb-2 print:mb-1" style={{ fontSize: "11px", marginBottom: "2px" }}>
                          Tube Lateral
                        </h4>
                        {renderCentralBeamAlignmentDetail(testDataLateral.centralBeamAlignment)}
                      </div>
                    )}
                  </>
                ) : (
                  renderCentralBeamAlignmentDetail(testData.centralBeamAlignment)
                )}
              </div>
            )}

            {/* 2. Effective Focal Spot Size */}
            {((isDoubleTube && (testDataFrontal.effectiveFocalSpot || testDataLateral.effectiveFocalSpot)) || (!isDoubleTube && testData.effectiveFocalSpot)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Effective Focal Spot Size</h3>
                {isDoubleTube ? (
                  <>
                    {testDataFrontal.effectiveFocalSpot && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        {/* FFD small table */}
                        <div className="mb-3 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FFD (cm)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testDataFrontal.effectiveFocalSpot.fcd || "-"}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {testDataFrontal.effectiveFocalSpot.focalSpots?.length > 0 && (
                          <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px' }}></th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ width: '26%', padding: '0px 1px', fontSize: '11px' }}>Stated Focal Spot of Tube</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ width: '26%', padding: '0px 1px', fontSize: '11px' }}>Measured Focal Spot (Nominal)</th>
                                  <th className="border border-black p-2 print:p-1 text-left" style={{ width: '34%', padding: '2px 4px', fontSize: '10px', lineHeight: '1.3' }}>
                                    <div><strong>Tolerance:</strong></div>
                                    <div>1. +{testDataFrontal.effectiveFocalSpot?.toleranceCriteria?.small?.multiplier ?? 0.5} f for f &lt; {testDataFrontal.effectiveFocalSpot?.toleranceCriteria?.small?.upperLimit ?? 0.8} mm</div>
                                    <div>2. +{testDataFrontal.effectiveFocalSpot?.toleranceCriteria?.medium?.multiplier ?? 0.4} f for {testDataFrontal.effectiveFocalSpot?.toleranceCriteria?.medium?.lowerLimit ?? 0.8} &lt;= f &lt;= {testDataFrontal.effectiveFocalSpot?.toleranceCriteria?.medium?.upperLimit ?? 1.5} mm</div>
                                    <div>3. +{testDataFrontal.effectiveFocalSpot?.toleranceCriteria?.large?.multiplier ?? 0.3} f for f &gt; {testDataFrontal.effectiveFocalSpot?.toleranceCriteria?.large?.lowerLimit ?? 1.5} mm</div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {testDataFrontal.effectiveFocalSpot.focalSpots.slice(0, 2).map((spot: any, i: number) => {
                                  const formatValue = (val: any) => {
                                    if (val === undefined || val === null || val === "") return "-";
                                    const numVal = typeof val === "number" ? val : parseFloat(val);
                                    if (isNaN(numVal)) return "-";
                                    return numVal.toFixed(1);
                                  };

                                  const statedNominal = formatValue(
                                    spot.statedNominal ??
                                    (spot.statedWidth != null && spot.statedHeight != null
                                      ? (Number(spot.statedWidth) + Number(spot.statedHeight)) / 2
                                      : spot.statedWidth ?? spot.statedHeight)
                                  );
                                  const measuredNominal = formatValue(
                                    spot.measuredNominal ??
                                    (spot.measuredWidth != null && spot.measuredHeight != null
                                      ? (Number(spot.measuredWidth) + Number(spot.measuredHeight)) / 2
                                      : spot.measuredWidth ?? spot.measuredHeight)
                                  );

                                  return (
                                    <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                      <td className="border border-black p-2 print:p-1 text-left font-semibold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                        {spot.focusType || (i === 0 ? "Large Focus" : "Small Focus")}
                                      </td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{statedNominal}</td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{measuredNominal}</td>
                                      <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                        <span
                                          className={
                                            spot.remark === "Pass" || spot.remark === "PASS"
                                              ? "text-green-600"
                                              : spot.remark === "Fail" || spot.remark === "FAIL"
                                                ? "text-red-600"
                                                : ""
                                          }
                                        >
                                          {spot.remark || "-"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    {testDataLateral.effectiveFocalSpot && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        {/* FFD small table */}
                        <div className="mb-3 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FFD (cm)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testDataLateral.effectiveFocalSpot.fcd || "-"}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {testDataLateral.effectiveFocalSpot.focalSpots?.length > 0 && (
                          <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                            <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px' }}></th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ width: '26%', padding: '0px 1px', fontSize: '11px' }}>Stated Focal Spot of Tube</th>
                                  <th className="border border-black p-2 print:p-1 text-center" style={{ width: '26%', padding: '0px 1px', fontSize: '11px' }}>Measured Focal Spot (Nominal)</th>
                                  <th className="border border-black p-2 print:p-1 text-left" style={{ width: '34%', padding: '2px 4px', fontSize: '10px', lineHeight: '1.3' }}>
                                    <div><strong>Tolerance:</strong></div>
                                    <div>1. +{testDataLateral.effectiveFocalSpot?.toleranceCriteria?.small?.multiplier ?? 0.5} f for f &lt; {testDataLateral.effectiveFocalSpot?.toleranceCriteria?.small?.upperLimit ?? 0.8} mm</div>
                                    <div>2. +{testDataLateral.effectiveFocalSpot?.toleranceCriteria?.medium?.multiplier ?? 0.4} f for {testDataLateral.effectiveFocalSpot?.toleranceCriteria?.medium?.lowerLimit ?? 0.8} &lt;= f &lt;= {testDataLateral.effectiveFocalSpot?.toleranceCriteria?.medium?.upperLimit ?? 1.5} mm</div>
                                    <div>3. +{testDataLateral.effectiveFocalSpot?.toleranceCriteria?.large?.multiplier ?? 0.3} f for f &gt; {testDataLateral.effectiveFocalSpot?.toleranceCriteria?.large?.lowerLimit ?? 1.5} mm</div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {testDataLateral.effectiveFocalSpot.focalSpots.slice(0, 2).map((spot: any, i: number) => {
                                  const formatValue = (val: any) => {
                                    if (val === undefined || val === null || val === "") return "-";
                                    const numVal = typeof val === "number" ? val : parseFloat(val);
                                    if (isNaN(numVal)) return "-";
                                    return numVal.toFixed(1);
                                  };

                                  const statedNominal = formatValue(
                                    spot.statedNominal ??
                                    (spot.statedWidth != null && spot.statedHeight != null
                                      ? (Number(spot.statedWidth) + Number(spot.statedHeight)) / 2
                                      : spot.statedWidth ?? spot.statedHeight)
                                  );
                                  const measuredNominal = formatValue(
                                    spot.measuredNominal ??
                                    (spot.measuredWidth != null && spot.measuredHeight != null
                                      ? (Number(spot.measuredWidth) + Number(spot.measuredHeight)) / 2
                                      : spot.measuredWidth ?? spot.measuredHeight)
                                  );

                                  return (
                                    <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                      <td className="border border-black p-2 print:p-1 text-left font-semibold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                        {spot.focusType || (i === 0 ? "Large Focus" : "Small Focus")}
                                      </td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{statedNominal}</td>
                                      <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{measuredNominal}</td>
                                      <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                        <span
                                          className={
                                            spot.remark === "Pass" || spot.remark === "PASS"
                                              ? "text-green-600"
                                              : spot.remark === "Fail" || spot.remark === "FAIL"
                                                ? "text-red-600"
                                                : ""
                                          }
                                        >
                                          {spot.remark || "-"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* FFD small table */}
                    <div className="mb-3 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FFD (cm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.effectiveFocalSpot.fcd || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {testData.effectiveFocalSpot.focalSpots?.length > 0 && (
                      <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                        <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-black p-2 print:p-1 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px' }}></th>
                              <th className="border border-black p-2 print:p-1 text-center" style={{ width: '26%', padding: '0px 1px', fontSize: '11px' }}>Stated Focal Spot of Tube</th>
                              <th className="border border-black p-2 print:p-1 text-center" style={{ width: '26%', padding: '0px 1px', fontSize: '11px' }}>Measured Focal Spot (Nominal)</th>
                              <th className="border border-black p-2 print:p-1 text-left" style={{ width: '34%', padding: '2px 4px', fontSize: '10px', lineHeight: '1.3' }}>
                                <div><strong>Tolerance:</strong></div>
                                <div>1. +{testData.effectiveFocalSpot?.toleranceCriteria?.small?.multiplier ?? 0.5} f for f &lt; {testData.effectiveFocalSpot?.toleranceCriteria?.small?.upperLimit ?? 0.8} mm</div>
                                <div>2. +{testData.effectiveFocalSpot?.toleranceCriteria?.medium?.multiplier ?? 0.4} f for {testData.effectiveFocalSpot?.toleranceCriteria?.medium?.lowerLimit ?? 0.8} &lt;= f &lt;= {testData.effectiveFocalSpot?.toleranceCriteria?.medium?.upperLimit ?? 1.5} mm</div>
                                <div>3. +{testData.effectiveFocalSpot?.toleranceCriteria?.large?.multiplier ?? 0.3} f for f &gt; {testData.effectiveFocalSpot?.toleranceCriteria?.large?.lowerLimit ?? 1.5} mm</div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {testData.effectiveFocalSpot.focalSpots.slice(0, 2).map((spot: any, i: number) => {
                              const formatValue = (val: any) => {
                                if (val === undefined || val === null || val === "") return "-";
                                const numVal = typeof val === "number" ? val : parseFloat(val);
                                if (isNaN(numVal)) return "-";
                                return numVal.toFixed(1);
                              };

                              const statedNominal = formatValue(
                                spot.statedNominal ??
                                (spot.statedWidth != null && spot.statedHeight != null
                                  ? (Number(spot.statedWidth) + Number(spot.statedHeight)) / 2
                                  : spot.statedWidth ?? spot.statedHeight)
                              );
                              const measuredNominal = formatValue(
                                spot.measuredNominal ??
                                (spot.measuredWidth != null && spot.measuredHeight != null
                                  ? (Number(spot.measuredWidth) + Number(spot.measuredHeight)) / 2
                                  : spot.measuredWidth ?? spot.measuredHeight)
                              );

                              return (
                                <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-left font-semibold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                                    {spot.focusType || (i === 0 ? "Large Focus" : "Small Focus")}
                                  </td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{statedNominal}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{measuredNominal}</td>
                                  <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                    <span
                                      className={
                                        spot.remark === "Pass" || spot.remark === "PASS"
                                          ? "text-green-600"
                                          : spot.remark === "Fail" || spot.remark === "FAIL"
                                            ? "text-red-600"
                                            : ""
                                      }
                                    >
                                      {spot.remark || "-"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 4. Accuracy of Irradiation Time */}
            {((isDoubleTube && (testDataFrontal.accuracyOfIrradiationTime || testDataLateral.accuracyOfIrradiationTime)) || (!isDoubleTube && testData.accuracyOfIrradiationTime)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Accuracy of Irradiation Time</h3>
                {isDoubleTube ? (
                  <>
                    {/* Tube Frontal */}
                    {testDataFrontal.accuracyOfIrradiationTime && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        {testDataFrontal.accuracyOfIrradiationTime.testConditions && (
                          <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                            <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                            <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FFD (cm)</th>
                                  <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                                  <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mA</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testDataFrontal.accuracyOfIrradiationTime.testConditions.fcd || testDataFrontal.accuracyOfIrradiationTime.testConditions.sid || "-"}</td>
                                  <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testDataFrontal.accuracyOfIrradiationTime.testConditions.kv || "-"}</td>
                                  <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testDataFrontal.accuracyOfIrradiationTime.testConditions.ma || testDataFrontal.accuracyOfIrradiationTime.testConditions.mA || "-"}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        {testDataFrontal.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (() => {
                          const tol = testDataFrontal.accuracyOfIrradiationTime.tolerance;
                          const tolOp = tol?.operator || "<=";
                          const tolVal = parseFloat(tol?.value ?? "10");
                          const calcError = (set: string, meas: string): string => {
                            const s = parseFloat(set); const m = parseFloat(meas);
                            if (isNaN(s) || isNaN(m) || s === 0) return "-";
                            return Math.abs((m - s) / s * 100).toFixed(2);
                          };
                          const getRemark = (errorPct: string): string => {
                            if (errorPct === "-" || isNaN(tolVal)) return "-";
                            const err = parseFloat(errorPct); if (isNaN(err)) return "-";
                            switch (tolOp) {
                              case ">": return err > tolVal ? "PASS" : "FAIL";
                              case "<": return err < tolVal ? "PASS" : "FAIL";
                              case ">=": return err >= tolVal ? "PASS" : "FAIL";
                              case "<=": return err <= tolVal ? "PASS" : "FAIL";
                              default: return "-";
                            }
                          };
                          return (
                            <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Set Time (mSec)</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Measured Time (mSec)</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>% Error</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {testDataFrontal.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                                    const error = calcError(String(row.setTime ?? ''), String(row.measuredTime ?? ''));
                                    const remark = getRemark(error);
                                    return (
                                      <tr key={i} className="text-center">
                                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.setTime ?? "-"}</td>
                                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.measuredTime ?? "-"}</td>
                                        <td className="border border-black p-2 print:p-1 text-center font-medium" style={{ padding: '0px 1px', fontSize: '11px' }}>{error !== "-" ? `${error}%` : "-"}</td>
                                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                          <span className={remark === "PASS" ? "text-green-600 font-semibold" : remark === "FAIL" ? "text-red-600 font-semibold" : ""}>{remark}</span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                        {testDataFrontal.accuracyOfIrradiationTime.tolerance && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                            <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                              <strong>Tolerance:</strong> Error {testDataFrontal.accuracyOfIrradiationTime.tolerance.operator || "<="} {testDataFrontal.accuracyOfIrradiationTime.tolerance.value || "10"}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Tube Lateral */}
                    {testDataLateral.accuracyOfIrradiationTime && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        {testDataLateral.accuracyOfIrradiationTime.testConditions && (
                          <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                            <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                            <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FFD (cm)</th>
                                  <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                                  <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mA</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testDataLateral.accuracyOfIrradiationTime.testConditions.fcd || testDataLateral.accuracyOfIrradiationTime.testConditions.sid || "-"}</td>
                                  <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testDataLateral.accuracyOfIrradiationTime.testConditions.kv || "-"}</td>
                                  <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testDataLateral.accuracyOfIrradiationTime.testConditions.ma || testDataLateral.accuracyOfIrradiationTime.testConditions.mA || "-"}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        {testDataLateral.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (() => {
                          const tol = testDataLateral.accuracyOfIrradiationTime.tolerance;
                          const tolOp = tol?.operator || "<=";
                          const tolVal = parseFloat(tol?.value ?? "10");
                          const calcError = (set: string, meas: string): string => {
                            const s = parseFloat(set); const m = parseFloat(meas);
                            if (isNaN(s) || isNaN(m) || s === 0) return "-";
                            return Math.abs((m - s) / s * 100).toFixed(2);
                          };
                          const getRemark = (errorPct: string): string => {
                            if (errorPct === "-" || isNaN(tolVal)) return "-";
                            const err = parseFloat(errorPct); if (isNaN(err)) return "-";
                            switch (tolOp) {
                              case ">": return err > tolVal ? "PASS" : "FAIL";
                              case "<": return err < tolVal ? "PASS" : "FAIL";
                              case ">=": return err >= tolVal ? "PASS" : "FAIL";
                              case "<=": return err <= tolVal ? "PASS" : "FAIL";
                              default: return "-";
                            }
                          };
                          return (
                            <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                              <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Set Time (mSec)</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Measured Time (mSec)</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>% Error</th>
                                    <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {testDataLateral.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                                    const error = calcError(String(row.setTime ?? ''), String(row.measuredTime ?? ''));
                                    const remark = getRemark(error);
                                    return (
                                      <tr key={i} className="text-center">
                                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.setTime ?? "-"}</td>
                                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.measuredTime ?? "-"}</td>
                                        <td className="border border-black p-2 print:p-1 text-center font-medium" style={{ padding: '0px 1px', fontSize: '11px' }}>{error !== "-" ? `${error}%` : "-"}</td>
                                        <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                          <span className={remark === "PASS" ? "text-green-600 font-semibold" : remark === "FAIL" ? "text-red-600 font-semibold" : ""}>{remark}</span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                        {testDataLateral.accuracyOfIrradiationTime.tolerance && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px' }}>
                            <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                              <strong>Tolerance:</strong> Error {testDataLateral.accuracyOfIrradiationTime.tolerance.operator || "<="} {testDataLateral.accuracyOfIrradiationTime.tolerance.value || "10"}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {testData.accuracyOfIrradiationTime.testConditions && (
                      <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                        <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                        <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FFD (cm)</th>
                              <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                              <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mA</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.fcd || testData.accuracyOfIrradiationTime.testConditions.sid || "-"}</td>
                              <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.kv || "-"}</td>
                              <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.ma || testData.accuracyOfIrradiationTime.testConditions.mA || "-"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                    {testData.accuracyOfIrradiationTime.irradiationTimes?.length > 0 && (() => {
                      const tol = testData.accuracyOfIrradiationTime.tolerance;
                      const tolOp = tol?.operator || "<=";
                      const tolVal = parseFloat(tol?.value ?? "10");
                      const calcError = (set: string, meas: string): string => {
                        const s = parseFloat(set); const m = parseFloat(meas);
                        if (isNaN(s) || isNaN(m) || s === 0) return "-";
                        return Math.abs((m - s) / s * 100).toFixed(2);
                      };
                      const getRemark = (errorPct: string): string => {
                        if (errorPct === "-" || isNaN(tolVal)) return "-";
                        const err = parseFloat(errorPct); if (isNaN(err)) return "-";
                        switch (tolOp) {
                          case ">": return err > tolVal ? "PASS" : "FAIL";
                          case "<": return err < tolVal ? "PASS" : "FAIL";
                          case ">=": return err >= tolVal ? "PASS" : "FAIL";
                          case "<=": return err <= tolVal ? "PASS" : "FAIL";
                          default: return "-";
                        }
                      };
                      return (
                        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                                const error = calcError(String(row.setTime ?? ''), String(row.measuredTime ?? ''));
                                const remark = getRemark(error);
                                return (
                                  <tr key={i} className="text-center">
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime ?? "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime ?? "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center font-medium" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{error !== "-" ? `${error}%` : "-"}</td>
                                    <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                      <span className={remark === "PASS" ? "text-green-600 font-semibold" : remark === "FAIL" ? "text-red-600 font-semibold" : ""}>{remark}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                    {testData.accuracyOfIrradiationTime.tolerance && (
                      <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                        <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                          <strong>Tolerance:</strong> Error {testData.accuracyOfIrradiationTime.tolerance.operator || "<="} {testData.accuracyOfIrradiationTime.tolerance.value || "10"}%
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
   {/* 5. Accuracy Of Operating Potential & Total Filtration (same structure as RadiographyFixed) */}
            {((isDoubleTube && (testDataFrontal.totalFilteration || testDataLateral.totalFilteration)) || (!isDoubleTube && testData.totalFilteration)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Accuracy Of Operating Potential</h3>
                {isDoubleTube ? (
                  <>
                    {testDataFrontal.totalFilteration && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        {renderFullTotalFiltrationSection(testDataFrontal.totalFilteration)}
                      </div>
                    )}
                    {testDataLateral.totalFilteration && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        {renderFullTotalFiltrationSection(testDataLateral.totalFilteration)}
                      </div>
                    )}
                  </>
                ) : (
                  renderFullTotalFiltrationSection(testData.totalFilteration)
                )}
              </div>
            )}

            {/* 2.1 Measurement of mA/mAs Linearity (RadiographyFixed-style linearity table) */}
            {((isDoubleTube && (hasMaLinearityRows(testDataFrontal.measurementOfMaLinearity) || hasMaLinearityRows(testDataLateral.measurementOfMaLinearity))) || (!isDoubleTube && hasMaLinearityRows(testData.measurementOfMaLinearity))) && (
              <div className="mb-16 print:mb-12 test-section" style={{ marginBottom: "8px" }}>
                {(() => {
                  const mol = isDoubleTube
                    ? (testDataFrontal.measurementOfMaLinearity || testDataLateral.measurementOfMaLinearity)
                    : testData.measurementOfMaLinearity;
                  const t1 = mol?.table1?.[0] || mol?.Table1?.[0];
                  const hasMas = t1?.time && String(t1.time).trim() !== "" && String(t1.time).trim() !== "-";
                  return (
                    <h3 className="text-lg font-bold mb-4 print:mb-1 print:text-sm" style={{ fontSize: "14px", marginBottom: "4px" }}>
                      6. {hasMas ? "Measurement of mA Linearity" : "Measurement of mA Linearity"}
                    </h3>
                  );
                })()}
                {isDoubleTube ? (
                  <>
                    {hasMaLinearityRows(testDataFrontal.measurementOfMaLinearity) && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: "11px", marginBottom: "2px" }}>Tube Frontal</h4>
                        {renderMeasurementOfMaLinearityLikeRadiographyFixed(testDataFrontal.measurementOfMaLinearity)}
                      </div>
                    )}
                    {hasMaLinearityRows(testDataLateral.measurementOfMaLinearity) && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: "11px", marginBottom: "2px" }}>Tube Lateral</h4>
                        {renderMeasurementOfMaLinearityLikeRadiographyFixed(testDataLateral.measurementOfMaLinearity)}
                      </div>
                    )}
                  </>
                ) : (
                  renderMeasurementOfMaLinearityLikeRadiographyFixed(testData.measurementOfMaLinearity)
                )}
              </div>
            )}

            {/* 3. Accuracy of kVp at Different mA Stations */}
            {((isDoubleTube && (testDataFrontal.accuracyOfOperatingPotential || testDataLateral.accuracyOfOperatingPotential)) || (!isDoubleTube && testData.accuracyOfOperatingPotential)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Accuracy of Operating Potential</h3>
                {isDoubleTube ? (
                  <>
                    {testDataFrontal.accuracyOfOperatingPotential && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set kV</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>10 mA</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>100 mA</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>200 mA</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testDataFrontal.accuracyOfOperatingPotential.table2?.map((row: any, i: number) => (
                                <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKV || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma10 || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma100 || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma200 || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                    <span className={row.remarks === "Pass" ? "text-green-600" : row.remarks === "Fail" ? "text-red-600" : ""}>{row.remarks || "-"}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {testDataLateral.accuracyOfOperatingPotential && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set kV</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>10 mA</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>100 mA</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>200 mA</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testDataLateral.accuracyOfOperatingPotential.table2?.map((row: any, i: number) => (
                                <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKV || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma10 || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma100 || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma200 || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                    <span className={row.remarks === "Pass" ? "text-green-600" : row.remarks === "Fail" ? "text-red-600" : ""}>{row.remarks || "-"}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  testData.accuracyOfOperatingPotential.table2?.length > 0 && (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set kV</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>10 mA</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>100 mA</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>200 mA</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Avg kVp</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setKV || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma10 || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma100 || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.ma200 || "-"}</td>
                              <td className="border border-black p-2 print:p-1 font-semibold text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.avgKvp || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                <span className={row.remarks === "Pass" ? "text-green-600" : row.remarks === "Fail" ? "text-red-600" : ""}>
                                  {row.remarks || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            )}

         


            {/* 6. Consistency of Radiation Output */}
            {((isDoubleTube && (testDataFrontal.consistencyOfRadiationOutput || testDataLateral.consistencyOfRadiationOutput)) || (!isDoubleTube && testData.consistencyOfRadiationOutput)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Consistency of Radiation Output</h3>
                {isDoubleTube ? (
                  <>
                    {testDataFrontal.consistencyOfRadiationOutput && testDataFrontal.consistencyOfRadiationOutput.outputRows?.length > 0 && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        {renderConsistencyOfRadiationOutput(testDataFrontal.consistencyOfRadiationOutput)}
                      </div>
                    )}
                    {testDataLateral.consistencyOfRadiationOutput && testDataLateral.consistencyOfRadiationOutput.outputRows?.length > 0 && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        {renderConsistencyOfRadiationOutput(testDataLateral.consistencyOfRadiationOutput)}
                      </div>
                    )}
                  </>
                ) : (
                  renderConsistencyOfRadiationOutput(testData.consistencyOfRadiationOutput)
                )}
              </div>
            )}


   {/* 4. Low Contrast Resolution */}
            {((isDoubleTube && (testDataFrontal.lowContrastResolution || testDataLateral.lowContrastResolution)) || (!isDoubleTube && testData.lowContrastResolution)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>8. Low Contrast Resolution</h3>
                {renderTestTable(
                  testDataFrontal.lowContrastResolution,
                  testDataLateral.lowContrastResolution,
                  testData.lowContrastResolution,
                  renderLowContrastTable
                )}
              </div>
            )}

            {/* 5. High Contrast Resolution */}
            {((isDoubleTube && (testDataFrontal.highContrastResolution || testDataLateral.highContrastResolution)) || (!isDoubleTube && testData.highContrastResolution)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>9. High Contrast Resolution</h3>
                {renderTestTable(
                  testDataFrontal.highContrastResolution,
                  testDataLateral.highContrastResolution,
                  testData.highContrastResolution,
                  renderHighContrastTable
                )}
              </div>
            )}

            {/* 3. Exposure Rate at Table Top */}
            {((isDoubleTube && (testDataFrontal.exposureRateTableTop || testDataLateral.exposureRateTableTop)) || (!isDoubleTube && testData.exposureRateTableTop)) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>10. Exposure Rate at Table Top</h3>
                {isDoubleTube ? (
                  <>
                    {testDataFrontal.exposureRateTableTop && testDataFrontal.exposureRateTableTop.rows?.length > 0 && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Frontal</h4>
                        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Distance (cm)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kV</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied mA</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure (mGy/min)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mode</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Result</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testDataFrontal.exposureRateTableTop.rows.map((row: any, i: number) => (
                                <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.distance || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKv || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedMa || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.exposure || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getExposureMode(row)}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                    <span className={getExposureResultClass(row)}>
                                      {getExposureResult(row)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {testDataLateral.exposureRateTableTop && testDataLateral.exposureRateTableTop.rows?.length > 0 && (
                      <div className="mb-4 print:mb-2">
                        <h4 className="text-lg font-semibold mb-2 print:mb-1 print:text-sm" style={{ fontSize: '11px', marginBottom: '2px' }}>Tube Lateral</h4>
                        <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                          <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Distance (cm)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kV</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied mA</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure (mGy/min)</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mode</th>
                                <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Result</th>
                              </tr>
                            </thead>
                            <tbody>
                              {testDataLateral.exposureRateTableTop.rows.map((row: any, i: number) => (
                                <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.distance || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKv || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedMa || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.exposure || "-"}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getExposureMode(row)}</td>
                                  <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                    <span className={getExposureResultClass(row)}>
                                      {getExposureResult(row)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  testData.exposureRateTableTop?.rows?.length > 0 && (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Distance (cm)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kV</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied mA</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Exposure (mGy/min)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Mode</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.5)' }}>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.exposureRateTableTop.rows.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.distance || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKv || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedMa || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.exposure || "-"}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{getExposureMode(row)}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center', backgroundColor: 'rgba(220, 252, 231, 0.3)' }}>
                                <span className={getExposureResultClass(row)}>
                                  {getExposureResult(row)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            )}

         

            {/* 10. Tube Housing Leakage (RadiographyFixed Radiation Leakage Level style) */}
            {((isDoubleTube &&
              (hasTubeHousingLeakageData(testDataFrontal.tubeHousingLeakage) ||
                hasTubeHousingLeakageData(testDataLateral.tubeHousingLeakage))) ||
              (!isDoubleTube && hasTubeHousingLeakageData(testData.tubeHousingLeakage))) && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>11. Tube Housing Leakage</h3>
                {renderTestTable(
                  hasTubeHousingLeakageData(testDataFrontal.tubeHousingLeakage)
                    ? { tubeHousingLeakage: testDataFrontal.tubeHousingLeakage }
                    : null,
                  hasTubeHousingLeakageData(testDataLateral.tubeHousingLeakage)
                    ? { tubeHousingLeakage: testDataLateral.tubeHousingLeakage }
                    : null,
                  hasTubeHousingLeakageData(testData.tubeHousingLeakage)
                    ? { tubeHousingLeakage: testData.tubeHousingLeakage }
                    : null,
                  (data) => renderTubeHousingLeakageTable(data.tubeHousingLeakage)
                )}
              </div>
            )}

            {/* 11. Radiation Protection Survey Report */}
            {testData.radiationProtectionSurvey && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>12. Radiation Protection Survey Report</h3>
                {/* 1. Survey details */}
                {(testData.radiationProtectionSurvey.surveyDate || testData.radiationProtectionSurvey.hasValidCalibration) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Radiation Protection Survey</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Date of Radiation Protection Survey</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.surveyDate ? formatDate(testData.radiationProtectionSurvey.surveyDate) : "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate</td>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.hasValidCalibration || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. Equipment Setting */}
                {(testData.radiationProtectionSurvey.appliedCurrent || testData.radiationProtectionSurvey.appliedVoltage || testData.radiationProtectionSurvey.exposureTime || testData.radiationProtectionSurvey.workload) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>2. Equipment Setting</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Applied Current (mA)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.appliedCurrent || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Applied Voltage (kV)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.appliedVoltage || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Exposure Time(s)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.exposureTime || "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Workload (mA min/week)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.workload || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Measured Maximum Radiation Levels */}
                {testData.radiationProtectionSurvey.locations?.length > 0 && (
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
                          {testData.radiationProtectionSurvey.locations.map((loc: any, i: number) => (
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
                {testData.radiationProtectionSurvey.locations?.length > 0 && (() => {
                  const workerLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "worker");
                  const publicLocs = testData.radiationProtectionSurvey.locations.filter((loc: any) => loc.category === "public");

                  const maxWorkerLocation = workerLocs.reduce((max: any, loc: any) => {
                    const maxVal = parseFloat(max?.mRPerWeek) || 0;
                    const locVal = parseFloat(loc.mRPerWeek) || 0;
                    return locVal > maxVal ? loc : max;
                  }, workerLocs[0] || { mRPerHr: '', location: '' });

                  const maxPublicLocation = publicLocs.reduce((max: any, loc: any) => {
                    const maxVal = parseFloat(max?.mRPerWeek) || 0;
                    const locVal = parseFloat(loc.mRPerWeek) || 0;
                    return locVal > maxVal ? loc : max;
                  }, publicLocs[0] || { mRPerHr: '', location: '' });

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
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Radiation Worker</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxWorkerWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : workerResult === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {workerResult || "-"}
                                </span>
                              </td>
                            </tr>
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Public</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxPublicWeekly || "0.000"} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={publicResult === "Pass" ? "text-green-600 font-semibold" : publicResult === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {publicResult || "-"}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {/* Calculation Formulas */}
                      <div className="mt-4 print:mt-1 space-y-3 print:space-y-1">
                        {maxWorkerLocation?.mRPerHr && parseFloat(maxWorkerLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-2 print:mb-0.5" style={{ fontSize: '11px', margin: '2px 0', fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Radiation Worker):</p>
                            <p className="text-xs print:text-[8px] mb-1 print:mb-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Location:</strong> {maxWorkerLocation.location}
                            </p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || '—'} mAmin/week × {maxWorkerLocation.mRPerHr || '—'} mR/hr) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '—'} mA)
                            </p>
                            <p className="text-xs print:text-[8px] mt-1 print:mt-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Result:</strong> {maxWorkerWeekly} mR/week
                            </p>
                          </div>
                        )}
                        {maxPublicLocation?.mRPerHr && parseFloat(maxPublicLocation.mRPerHr) > 0 && (
                          <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                            <p className="text-sm print:text-[9px] font-semibold mb-2 print:mb-0.5" style={{ fontSize: '11px', margin: '2px 0', fontWeight: 'bold' }}>Calculation for Maximum Radiation Level/week (For Public):</p>
                            <p className="text-xs print:text-[8px] mb-1 print:mb-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Location:</strong> {maxPublicLocation.location}
                            </p>
                            <p className="text-xs print:text-[8px]" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Formula:</strong> ({testData.radiationProtectionSurvey.workload || '—'} mAmin/week × {maxPublicLocation.mRPerHr || '—'} mR/hr) / (60 × {testData.radiationProtectionSurvey.appliedCurrent || '—'} mA)
                            </p>
                            <p className="text-xs print:text-[8px] mt-1 print:mt-0.5" style={{ fontSize: '10px', margin: '2px 0' }}>
                              <strong>Result:</strong> {maxPublicWeekly} mR/week
                            </p>
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
            )}

            {/* No data fallback */}
            {Object.values(testData).every(v => !v) && (
              <p className="text-center text-xl print:text-lg text-gray-500 mt-32 print:mt-16">
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

export default ViewServiceReport;