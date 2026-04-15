// src/components/reports/ViewServiceReportDentalHandHeld.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getReportHeaderForDentalHandHeld,
  getDetails,
  getAccuracyOfOperatingPotentialByServiceIdForDentalHandHeld,
  getAccuracyOfIrradiationTimeByServiceIdForDentalHandHeld,
  getLinearityOfTimeByServiceIdForDentalHandHeld,
  getLinearityOfMaLoadingByServiceIdForDentalHandHeld,
  getLinearityOfMasLoadingByServiceIdForDentalHandHeld,
  getConsistencyOfRadiationOutputByServiceIdForDentalHandHeld,
  getTubeHousingLeakageByServiceIdForDentalHandHeld,
  getRadiationProtectionSurveyByServiceIdForDentalHandHeld,
  getTools
} from "../../../../../../api";
import logo from "../../../../../../assets/logo/anteso-logo2.png";
import logoA from "../../../../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from "../../../../../../assets/quotationImg/qrcode.png";
import Signature from "../../../../../../assets/quotationImg/signature.png";
import { generatePDF } from "../../../../../../utils/generatePDF";
import MainTestTableForDentalHandHeld from "./MainTestTableForDentalHandHeld";

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
  toolsUsed?: Tool[];
  notes?: Note[];
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

const ViewServiceReportDentalHandHeld: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch report header + service details
        const [response, detailsRes, toolsRes] = await Promise.all([
          getReportHeaderForDentalHandHeld(serviceId),
          getDetails(serviceId).catch(() => null),
          getTools(serviceId).catch(() => null),
        ]);
        const normalizeTools = (raw: any): Tool[] => {
          if (!Array.isArray(raw)) return [];
          return raw.map((tool: any, index: number) => ({
            slNumber: String(tool?.slNumber || index + 1),
            nomenclature: tool?.nomenclature || "-",
            make: tool?.make || tool?.manufacturer || "-",
            model: tool?.model || "-",
            SrNo: tool?.SrNo || tool?.srNo || tool?.serialNumber || "-",
            range: tool?.range || "-",
            calibrationCertificateNo:
              tool?.calibrationCertificateNo || tool?.certificateNo || tool?.certificateNumber || "-",
            calibrationValidTill: tool?.calibrationValidTill || tool?.validTill || "",
          }));
        };
        const mergeTools = (primary: Tool[], secondary: Tool[]): Tool[] => {
          const seen = new Set<string>();
          const merged: Tool[] = [];
          const addUnique = (tool: Tool) => {
            const key = [
              String(tool.nomenclature || "").toLowerCase().trim(),
              String(tool.make || "").toLowerCase().trim(),
              String(tool.model || "").toLowerCase().trim(),
              String(tool.SrNo || "").toLowerCase().trim(),
              String(tool.calibrationCertificateNo || "").toLowerCase().trim(),
            ].join("|");
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(tool);
            }
          };
          primary.forEach(addUnique);
          secondary.forEach(addUnique);
          return merged.map((tool, idx) => ({ ...tool, slNumber: String(idx + 1) }));
        };
        const reportData =
          response?.data?.data ||
          (response?.exists ? response?.data : null) ||
          (response?.success && response?.data ? response.data : null) ||
          (response?.data && typeof response.data === "object" ? response.data : null);

        if (reportData) {
          const data = reportData;
          const headerTools = normalizeTools(
            data.toolsUsed || data.tools || data.standards || data.toolsAssigned
          );
          const assignedTools = normalizeTools(toolsRes?.data?.toolsAssigned || []);
          const mergedTools = mergeTools(headerTools, assignedTools);
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
          const unwrap = (res: any) => {
            if (!res) return null;
            return res.data?.data ?? res.data ?? res ?? null;
          };
          const pick = (...vals: any[]) => vals.find((v) => v != null) ?? null;
          const normalizeOperatingPotential = (d: any) => {
            if (!d) return null;
            const mappedRows = Array.isArray(d.rows)
              ? d.rows.map((r: any) => {
                const measuredFromStations = Array.isArray(r?.maStations)
                  ? r.maStations.map((m: any) => m?.kvp ?? m?.kVp ?? m?.value ?? "")
                  : [];
                return {
                  ...r,
                  appliedKvp: r?.appliedKvp ?? r?.kvp ?? r?.kVp ?? "",
                  measuredValues: Array.isArray(r?.measuredValues) && r.measuredValues.length > 0
                    ? r.measuredValues
                    : measuredFromStations,
                  averageKvp: r?.averageKvp ?? r?.avgKvp ?? "",
                  remarks: r?.remarks ?? r?.remark ?? "-",
                };
              })
              : [];
            const derivedCount = mappedRows.reduce(
              (m: number, r: any) => Math.max(m, Array.isArray(r?.measuredValues) ? r.measuredValues.length : 0),
              0
            );
            const headers =
              (Array.isArray(d.mAStations) && d.mAStations.length > 0
                ? d.mAStations
                : Array.from({ length: derivedCount }, (_, i) => `mA ${i + 1}`));
            return { ...d, measurements: d.measurements || mappedRows, mAStations: headers };
          };
          const normalizeIrradiationTime = (d: any) => {
            if (!d) return null;
            const mappedFromRows = Array.isArray(d.rows)
              ? d.rows.map((r: any) => ({
                setTime: r?.setTime ?? r?.set_time ?? "",
                measuredTime:
                  r?.measuredTime ??
                  r?.measured_time ??
                  r?.maStations?.[0]?.time ??
                  r?.mAStations?.[0]?.time ??
                  "",
                remark: r?.remark ?? r?.remarks ?? "",
              }))
              : [];
            return {
              ...d,
              irradiationTimes: d.irradiationTimes || d.table2 || mappedFromRows,
              testConditions: {
                fcd: d?.testConditions?.fcd ?? d?.ffd ?? d?.fcd ?? d?.rows?.[0]?.fcd ?? "",
                kv: d?.testConditions?.kv ?? d?.rows?.[0]?.appliedKvp ?? d?.rows?.[0]?.kv ?? "",
                ma: d?.testConditions?.ma ?? d?.mAStations?.[0] ?? d?.rows?.[0]?.maStations?.[0]?.ma ?? "",
              },
              tolerance: {
                operator: d?.timeToleranceSign ?? d?.tolerance?.operator ?? "<=",
                value: d?.timeToleranceValue ?? d?.tolerance?.value ?? "10",
              }
            };
          };
          const normalizeLinearity = (d: any) => {
            if (!d) return null;
            return { ...d, table2: d.table2 || d.table2Rows || [] };
          };
          const normalizeConsistency = (d: any) => {
            if (!d) return null;
            const rows = d.outputRows || d.rows || [];
            const mappedRows = rows.map((r: any) => {
              const kv = r.kv || r.kvp || '';
              const mean = r.mean || r.avg || '';
              const cov = r.cov || r.cv || '';
              const remark = r.remark || r.remarks || '';
              return {
                ...r,
                kv,
                kvp: kv,
                mas: r.mas || '',
                outputs: r.outputs || [],
                mean,
                avg: mean,
                cov,
                cv: cov,
                remark,
                remarks: remark,
              };
            });
            return { ...d, outputRows: mappedRows };
          };
          const normalizeLeakage = (d: any) => {
            if (!d) return null;
            // Support both direct fields and nested rows
            const measurements = d.leakageMeasurements || d.leakageRows || [];
            const settingsObj = d.measurementSettings?.[0] || d.measurementSettings || d.settings?.[0] || d.settings || {};
            const normalizedSettings = {
              fcd: settingsObj.fcd || settingsObj.distance || d.fcd || d.distance || "",
              kv: settingsObj.kv || settingsObj.kvp || d.kv || d.kvp || "",
              ma: settingsObj.ma || settingsObj.mA || d.ma || d.mA || "",
              time:
                settingsObj.time ||
                settingsObj.Time ||
                settingsObj.timeSec ||
                settingsObj.timeInSec ||
                settingsObj.exposureTime ||
                d.time ||
                d.Time ||
                d.timeSec ||
                d.timeInSec ||
                d.exposureTime ||
                "",
            };

            return {
              ...d,
              leakageMeasurements: measurements,
              // Keep a predictable shape for render section
              measurementSettings: normalizedSettings,
              fcd: normalizedSettings.fcd,
              kv: normalizedSettings.kv,
              ma: normalizedSettings.ma,
              time: normalizedSettings.time,
              workload: d.workload?.value || d.workload || "",
              workloadUnit: d.workload?.unit || d.workloadUnit || "mA·min/week",
              toleranceValue: d.tolerance?.value || d.toleranceValue || "1",
              toleranceOperator: d.tolerance?.operator || d.toleranceOperator || "less than or equal to",
              toleranceTime: d.tolerance?.time || d.toleranceTime || "1",
              calculatedResult: d.calculatedResult || {}
            };
          };
          const normalizeRadiationProtection = (d: any) => {
            if (!d) return null;
            return {
              ...d,
              locations: d.locations || [],
              appliedCurrent: d.appliedCurrent || "100",
              appliedVoltage: d.appliedVoltage || "80",
              exposureTime: d.exposureTime || "0.5",
              workload: d.workload || "5000"
            };
          };
          const normalizeTotalFilteration = (d: any) => {
            if (!d) return null;
            // Always return data if it exists; provide defaults for missing sub-objects
            return {
              ...d,
              totalFiltration: d.totalFiltration ?? {},
              filtrationTolerance: d.filtrationTolerance ?? {
                forKvGreaterThan70: "1.5",
                forKvBetween70And100: "2.0",
                forKvGreaterThan100: "2.5",
                kvThreshold1: "70",
                kvThreshold2: "100",
              },
            };
          };
          setReport({
            ...data,
            city: data.city || detailsData?.city || "",
            hospitalName: data.hospitalName || detailsData?.hospitalName || cachedOrderBySrf?.hospitalName || "",
            fullAddress: data.fullAddress || detailsData?.fullAddress || cachedOrderBySrf?.fullAddress || "",
            leadOwner: data.leadOwner || data.leadowner || detailsLeadOwner || "",
            manufacturerName: data.manufacturerName || detailsData?.manufacturerName || cachedOrderBySrf?.manufacturerName || "",
            leadOwnerType: data.leadOwnerType || data.leadownerType || detailsLeadOwnerRole || "",
            leadOwnerRole: data.leadOwnerRole || data.leadownerRole || detailsLeadOwnerRole || "",
            leadOwnerName: data.leadOwnerName || detailsLeadOwnerName || "",
            toolsUsed: mergedTools,
            notes: data.notes || defaultNotes,
          });

          // Fetch all test data separately
          const [
            accuracyPotential,
            accuracyTime,
            linearityTime,
            linearityMa,
            linearityMas,
            consistency,
            leakageTest,
            radiationProtection
          ] = await Promise.allSettled([
            getAccuracyOfOperatingPotentialByServiceIdForDentalHandHeld(serviceId),
            getAccuracyOfIrradiationTimeByServiceIdForDentalHandHeld(serviceId),
            getLinearityOfTimeByServiceIdForDentalHandHeld(serviceId),
            getLinearityOfMaLoadingByServiceIdForDentalHandHeld(serviceId),
            getLinearityOfMasLoadingByServiceIdForDentalHandHeld(serviceId),
            getConsistencyOfRadiationOutputByServiceIdForDentalHandHeld(serviceId),
            getTubeHousingLeakageByServiceIdForDentalHandHeld(serviceId),
            getRadiationProtectionSurveyByServiceIdForDentalHandHeld(serviceId)
          ]);

          const accuracyPotentialData = accuracyPotential.status === 'fulfilled' ? unwrap(accuracyPotential.value) : null;
          const accuracyTimeData = accuracyTime.status === 'fulfilled' ? unwrap(accuracyTime.value) : null;
          const linearityTimeData = linearityTime.status === 'fulfilled' ? unwrap(linearityTime.value) : null;
          const linearityMaData = linearityMa.status === 'fulfilled' ? unwrap(linearityMa.value) : null;
          const linearityMasData = linearityMas.status === 'fulfilled' ? unwrap(linearityMas.value) : null;
          const consistencyData = consistency.status === 'fulfilled' ? unwrap(consistency.value) : null;
          const leakageData = leakageTest.status === 'fulfilled' ? unwrap(leakageTest.value) : null;
          const radiationProtectionData = radiationProtection.status === 'fulfilled' ? unwrap(radiationProtection.value) : null;

          const headerCombined = data.AccuracyOfOperatingPotentialAndTimeDentalHandHeld || null;

          setTestData({
            accuracyOfOperatingPotential: normalizeOperatingPotential(pick(accuracyPotentialData, headerCombined)),
            accuracyOfIrradiationTime: normalizeIrradiationTime(pick(accuracyTimeData, headerCombined)),
            linearityOfTime: normalizeLinearity(pick(linearityTimeData, data.LinearityOfTimeDentalHandHeld)),
            linearityOfmALoading: normalizeLinearity(pick(linearityMaData, data.LinearityOfMaLoadingDentalHandHeld)),
            linearityOfMasLoading: normalizeLinearity(pick(linearityMasData, data.LinearityOfmAsLoadingDentalHandHeld)),
            consistencyOfRadiationOutput: normalizeConsistency(pick(consistencyData, data.ConsistencyOfRadiationOutputDentalHandHeld)),
            tubeHousingLeakage: normalizeLeakage(pick(leakageData, data.TubeHousingLeakageDentalHandHeld)),
            radiationProtectionSurvey: normalizeRadiationProtection(
              pick(radiationProtectionData, data.RadiationProtectionSurveyDentalHandHeld)
            ),
            totalFilteration: normalizeTotalFilteration(
              // Prefer accuracyPotentialData which contains totalFiltration + filtrationTolerance
              pick(
                accuracyPotentialData,
                headerCombined,
                data.TotalFilterationDentalHandHeld,
                data.totalFilterationDentalHandHeld,
                data.totalFilteration
              )
            ),
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

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));
  const displayValue = (v: any) => {
    if (v == null || v === "") return "-";
    if (typeof v === "object" && "value" in v) {
      const inner = (v as any).value;
      return inner == null || inner === "" ? "-" : String(inner);
    }
    return String(v);
  };
  const normalizeToleranceValue = (tol: any, fallback = "-") => {
    if (tol == null || tol === "") return fallback;
    if (typeof tol === "object") {
      const v = "value" in tol ? (tol as any).value : null;
      return v != null && v !== "" ? String(v) : fallback;
    }
    return String(tol);
  };
  const normalizeToleranceOperator = (tol: any, fallback = "≤") => {
    if (tol == null || tol === "") return fallback;
    if (typeof tol === "object") {
      const op = "operator" in tol ? (tol as any).operator : null;
      if (op != null && op !== "") return String(op);
      return fallback;
    }
    return fallback;
  };

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `DentalHandHeld-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Loading Report...</div>;
  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h2>
          <p>Please generate and save the report header first.</p>
          <button onClick={() => window.history.back()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg">
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
            QA TEST REPORT FOR DENTAL HAND-HELD X-RAY EQUIPMENT
          </h1>
          <p className="text-center italic text-sm mb-6 print:mb-2 print:text-[9px]">
            (Periodic Quality Assurance shall be carried out at least once in five years as per AERB guidelines)
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

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 2+ - SUMMARY TABLE */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-2 test-section" style={{ pageBreakAfter: 'always' }}>
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <MainTestTableForDentalHandHeld
              testData={testData}
              hasTimer={
                Boolean(
                  testData.accuracyOfIrradiationTime?.irradiationTimes?.length ||
                    testData.accuracyOfIrradiationTime?.rows?.length
                )
              }
            />
          </div>
        </div>

        {/* PAGE BREAK */}
        <div className="print:break-before-page print:break-inside-avoid test-section"></div>

        {/* PAGE 3+ - DETAILED TEST RESULTS */}
        <div className="bg-white px-8 py-2 print:px-8 print:py-1 test-section">
          <div className="max-w-5xl mx-auto print:max-w-none" style={{ width: '100%', maxWidth: 'none' }}>
            <h2 className="text-3xl font-bold text-center underline mb-6 print:mb-2 print:text-xl">DETAILED TEST RESULTS</h2>


            {/* 2. Accuracy of Irradiation Time */}
            {testData.accuracyOfIrradiationTime && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>1. Accuracy of Irradiation Time</h3>
                {testData.accuracyOfIrradiationTime.testConditions && (
                  <div className="mb-6 print:mb-1 bg-gray-50 p-4 print:p-1 rounded border overflow-x-auto" style={{ marginBottom: '4px', padding: '2px 4px' }}>
                    <p className="font-semibold mb-2 print:mb-0.5 print:text-xs" style={{ marginBottom: '2px', fontSize: '8px' }}>Test Conditions:</p>
                    <table className="w-full border border-black text-sm print:text-[9px]" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: 0 }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>FDD (cm)</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>kV</th>
                          <th className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>mA</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.fcd || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.kv || "-"}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{testData.accuracyOfIrradiationTime.testConditions.ma || "-"}</td>
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
                    const s = parseFloat(set);
                    const m = parseFloat(meas);
                    if (isNaN(s) || isNaN(m) || s === 0) return "-";
                    return Math.abs((m - s) / s * 100).toFixed(2);
                  };

                  const getRemark = (errorPct: string): string => {
                    if (errorPct === "-" || isNaN(tolVal)) return "-";
                    const err = parseFloat(errorPct);
                    if (isNaN(err)) return "-";
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
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (mSec)</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (mSec)</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>% Error</th>
                            <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.accuracyOfIrradiationTime.irradiationTimes.map((row: any, i: number) => {
                            const error = calcError(String(row.setTime ?? ''), String(row.measuredTime ?? ''));
                            const remark = getRemark(error);
                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.setTime || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.measuredTime || "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center font-medium" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{error !== "-" ? `${error}%` : "-"}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>
                                  <span className={remark === "PASS" ? "text-green-600 font-semibold" : remark === "FAIL" ? "text-red-600 font-semibold" : ""}>
                                    {remark}
                                  </span>
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
                      <strong>Tolerance:</strong> Error {testData.accuracyOfIrradiationTime.tolerance.operator || "<="} {testData.accuracyOfIrradiationTime.tolerance.value || "-"}%
                    </p>
                  </div>
                )}
              </div>
            )}


            {/* 1. Accuracy of Operating Potential (kVp) */}
            {testData.accuracyOfOperatingPotential?.measurements?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>2. Accuracy of Operating Potential (kVp)</h3>
                {(() => {
                  const rows = testData.accuracyOfOperatingPotential.measurements || [];
                  const measCount = Math.max(
                    testData.accuracyOfOperatingPotential.mAStations?.length || 0,
                    ...rows.map((r: any) => (Array.isArray(r?.measuredValues) ? r.measuredValues.length : 0)),
                    1
                  );
                  const headers = (testData.accuracyOfOperatingPotential.mAStations?.length
                    ? testData.accuracyOfOperatingPotential.mAStations
                    : Array.from({ length: measCount }, (_: any, i: number) => `mA ${i + 1}`));

                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold">Applied kVp</th>
                            <th colSpan={measCount} className="border border-black p-2 print:p-1 text-center font-bold">Measured Values (kVp)</th>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold bg-blue-100">Average kVp</th>
                            <th rowSpan={2} className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                          </tr>
                          <tr>
                            {headers.map((s: string, idx: number) => (
                              <th key={idx} className="border border-black p-2 print:p-1 text-center font-bold">{displayValue(s)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row: any, i: number) => {
                            const vals = Array.isArray(row?.measuredValues)
                              ? row.measuredValues
                              : Array.isArray(row?.maStations)
                                ? row.maStations.map((m: any) => m?.kvp ?? m?.kVp ?? m?.value ?? "")
                                : [];
                            const rowRemark = row?.remarks ?? row?.remark ?? "-";
                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black p-2 print:p-1 font-semibold">{displayValue(row?.appliedKvp ?? row?.kvp ?? row?.kVp)}</td>
                                {Array.from({ length: measCount }, (_: any, idx: number) => (
                                  <td key={idx} className="border border-black p-2 print:p-1">{displayValue(vals[idx])}</td>
                                ))}
                                <td className="border border-black p-2 print:p-1 font-bold bg-blue-50">{displayValue(row?.averageKvp ?? row?.avgKvp)}</td>
                                <td className={`border border-black p-2 print:p-1 font-bold ${String(rowRemark).toUpperCase() === "PASS" ? "text-green-800 bg-green-100" : String(rowRemark).toUpperCase() === "FAIL" ? "text-red-800 bg-red-100" : ""}`}>{displayValue(rowRemark)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                <div className="bg-gray-50 p-4 print:p-1 rounded border mb-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance:</strong> {testData.accuracyOfOperatingPotential?.tolerance?.type || "±"} {testData.accuracyOfOperatingPotential?.tolerance?.value || "2.0"} kV
                  </p>
                </div>
              </div>
            )}


            {/* 2A. Total Filteration */}
            {testData.totalFilteration?.totalFiltration && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Total Filteration</h3>
                {(() => {
                  const tf = testData.totalFilteration.totalFiltration || {};
                  const ft = testData.totalFilteration.filtrationTolerance || {};
                  const primitive = (v: any) => {
                    if (v == null) return "";
                    if (typeof v === "object" && "value" in v) return (v as any).value ?? "";
                    return v;
                  };
                  const toNum = (v: any): number => {
                    const raw = primitive(v);
                    if (raw == null || raw === "") return NaN;
                    if (typeof raw === "number") return Number.isFinite(raw) ? raw : NaN;
                    const s = String(raw).trim();
                    const direct = Number(s);
                    if (Number.isFinite(direct)) return direct;
                    const m = s.match(/-?\d+(\.\d+)?/);
                    return m ? Number(m[0]) : NaN;
                  };
                  const tfAtKvp = tf.atKvp ?? tf.kvp ?? tf.kV ?? "";
                  const tfMeasured1 = tf.measured1 ?? tf.measured ?? tf.measuredValue ?? "";
                  const tfMeasured2 = tf.measured2 ?? tf.required ?? tf.requiredValue ?? "";
                  const kvpNum = toNum(tfAtKvp);
                  const measured1 = toNum(tfMeasured1);
                  const measured2 = toNum(tfMeasured2);
                  const measuredForDecision = !isNaN(measured1) ? measured1 : (!isNaN(measured2) ? measured2 : NaN);

                  const k1 = toNum(ft.kvp1 ?? ft.kvThreshold1);
                  const k2 = toNum(ft.kvp2 ?? ft.kvThreshold2);
                  let reqVal = ft.value3 ?? ft.forKvGreaterThan100;
                  let reqOp = ft.operator3 || ">=";
                  if (!isNaN(kvpNum) && !isNaN(k1) && kvpNum < k1) {
                    reqVal = ft.value1 ?? ft.forKvGreaterThan70;
                    reqOp = ft.operator1 || ">=";
                  } else if (!isNaN(kvpNum) && !isNaN(k1) && !isNaN(k2) && kvpNum >= k1 && kvpNum <= k2) {
                    reqVal = ft.value2 ?? ft.forKvBetween70And100;
                    reqOp = ft.operator2 || ">=";
                  }

                  const normalizedOp =
                    reqOp === "≤" ? "<=" :
                      reqOp === "≥" ? ">=" :
                        String(reqOp).toLowerCase() === "less than or equal to" ? "<=" :
                          String(reqOp).toLowerCase() === "greater than or equal to" ? ">=" :
                            String(reqOp).toLowerCase() === "less than" ? "<" :
                              String(reqOp).toLowerCase() === "greater than" ? ">" :
                                reqOp === "=" ? "==" : reqOp;
                  let reqNum = toNum(reqVal);
                  if (isNaN(reqNum)) {
                    const candidates = [
                      ft.value1, ft.value2, ft.value3,
                      ft.forKvGreaterThan70, ft.forKvBetween70And100, ft.forKvGreaterThan100
                    ].map(toNum).filter((n: number) => !isNaN(n));
                    reqNum = candidates.length > 0 ? candidates[0] : NaN;
                  }
                  // Legacy payload fallback: measured2 often stores required tolerance value.
                  if (isNaN(reqNum)) {
                    const legacyRequired = toNum(tfMeasured2);
                    if (!isNaN(legacyRequired)) {
                      reqNum = legacyRequired;
                    }
                  }
                  let remark = "-";
                  if (!isNaN(measuredForDecision) && !isNaN(reqNum)) {
                    if (normalizedOp === ">=" || normalizedOp === ">") remark = measuredForDecision >= reqNum ? "PASS" : "FAIL";
                    else if (normalizedOp === "<=" || normalizedOp === "<") remark = measuredForDecision <= reqNum ? "PASS" : "FAIL";
                    else remark = measuredForDecision >= reqNum ? "PASS" : "FAIL";
                  }

                  return (
                    <div className="border border-black rounded" style={{ padding: '4px 6px', marginTop: '4px' }}>
                      <table className="w-full border border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px', width: '50%' }}>At kVp</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px', width: '50%' }}>{displayValue(tfAtKvp)} kVp</td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Measured Total Filtration</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>
                              {displayValue(tfMeasured1)}
                              {(tfMeasured2 !== "" && tfMeasured2 !== null && tfMeasured2 !== undefined) ? ` / ${displayValue(tfMeasured2)}` : ""}
                              {" "}mm Al
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Required (Tolerance)</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>
                              {!isNaN(reqNum) ? `${normalizedOp === "==" ? "=" : (normalizedOp || ">=")} ${reqNum} mm Al` : "-"}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Result</td>
                            <td className="border border-black text-center font-bold" style={{ padding: '0px 4px', fontSize: '11px' }}>
                              <span className={remark === "PASS" ? "text-green-600" : remark === "FAIL" ? "text-red-600" : ""}>{remark}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div style={{ marginTop: '4px', fontSize: '10px', color: '#555' }}>
                        <span className="font-semibold">Tolerance criteria: </span>
                        {displayValue(ft.value1 ?? ft.forKvGreaterThan70)} mm Al for kV &lt; {displayValue(ft.kvp1 ?? ft.kvThreshold1)} |&nbsp;
                        {displayValue(ft.value2 ?? ft.forKvBetween70And100)} mm Al for {displayValue(ft.kvp1 ?? ft.kvThreshold1)} ≤ kV ≤ {displayValue(ft.kvp2 ?? ft.kvThreshold2)} |&nbsp;
                        {displayValue(ft.value3 ?? ft.forKvGreaterThan100)} mm Al for kV &gt; {displayValue(ft.kvp2 ?? ft.kvThreshold2)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 3. Linearity of Time */}
            {testData.linearityOfTime?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>3. Linearity of Time</h3>

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Time (sec)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Avg Output</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X (mGy/sec)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MAX</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MIN</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">CoL</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfTime.table2.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{displayValue(row.time)}</td>
                          <td className="border border-black p-2 print:p-1">{displayValue(row.average)}</td>
                          <td className="border border-black p-2 print:p-1">{displayValue(row.x)}</td>
                          {i === 0 && (
                            <>
                              <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 align-middle">{testData.linearityOfTime.xMax || "-"}</td>
                              <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 align-middle">{testData.linearityOfTime.xMin || "-"}</td>
                              <td rowSpan={testData.linearityOfTime.table2.length} className="border border-black p-2 print:p-1 font-bold align-middle">{testData.linearityOfTime.col || "-"}</td>
                              <td rowSpan={testData.linearityOfTime.table2.length} className={`border border-black p-2 print:p-1 font-bold align-middle ${testData.linearityOfTime.remarks?.toUpperCase() === "PASS" ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>
                                {testData.linearityOfTime.remarks || "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance (CoL):</strong> {normalizeToleranceOperator(testData.linearityOfTime?.tolerance, "≤")} {normalizeToleranceValue(testData.linearityOfTime?.tolerance, "0.1")}
                  </p>
                </div>
              </div>
            )}

            {/* 4. Linearity of mA Loading */}
            {testData.linearityOfmALoading?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>4. Linearity of mA Loading</h3>

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">mA</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Avg Output</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X (mGy/mA)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MAX</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MIN</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">CoL</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfmALoading.table2.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{displayValue(row.ma)}</td>
                          <td className="border border-black p-2 print:p-1">{displayValue(row.average)}</td>
                          <td className="border border-black p-2 print:p-1">{displayValue(row.x)}</td>
                          {i === 0 && (
                            <>
                              <td rowSpan={testData.linearityOfmALoading.table2.length} className="border border-black p-2 print:p-1 align-middle">{row.xMax || "-"}</td>
                              <td rowSpan={testData.linearityOfmALoading.table2.length} className="border border-black p-2 print:p-1 align-middle">{row.xMin || "-"}</td>
                              <td rowSpan={testData.linearityOfmALoading.table2.length} className="border border-black p-2 print:p-1 font-bold align-middle">{row.col || "-"}</td>
                              <td rowSpan={testData.linearityOfmALoading.table2.length} className={`border border-black p-2 print:p-1 font-bold align-middle ${row.remarks?.toUpperCase() === "PASS" ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>
                                {row.remarks || "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance (CoL):</strong> {normalizeToleranceOperator(testData.linearityOfmALoading?.tolerance, "≤")} {normalizeToleranceValue(testData.linearityOfmALoading?.tolerance, "0.1")}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Linearity of mAs Loading */}
            {testData.linearityOfMasLoading?.table2?.length > 0 && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Linearity of mAs Loading</h3>

                <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">mAs Range</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">Avg Output</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X (mGy/mAs)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MAX</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">X MIN</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold">CoL</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold bg-green-100">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.linearityOfMasLoading.table2.map((row: any, i: number) => (
                        <tr key={i} className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold">{displayValue(row.mAsRange)}</td>
                          <td className="border border-black p-2 print:p-1">{displayValue(row.average)}</td>
                          <td className="border border-black p-2 print:p-1">{displayValue(row.x)}</td>
                          {i === 0 && (
                            <>
                              <td rowSpan={testData.linearityOfMasLoading.table2.length} className="border border-black p-2 print:p-1 align-middle">{row.xMax || "-"}</td>
                              <td rowSpan={testData.linearityOfMasLoading.table2.length} className="border border-black p-2 print:p-1 align-middle">{row.xMin || "-"}</td>
                              <td rowSpan={testData.linearityOfMasLoading.table2.length} className="border border-black p-2 print:p-1 font-bold align-middle">{row.col || "-"}</td>
                              <td rowSpan={testData.linearityOfMasLoading.table2.length} className={`border border-black p-2 print:p-1 font-bold align-middle ${row.remarks?.toUpperCase() === "PASS" ? "text-green-800 bg-green-100" : "text-red-800 bg-red-100"}`}>
                                {row.remarks || "-"}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 print:p-1 rounded border mt-4" style={{ padding: '2px 4px', marginTop: '4px' }}>
                  <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                    <strong>Tolerance (CoL):</strong> {normalizeToleranceOperator(testData.linearityOfMasLoading?.tolerance, "≤")} {normalizeToleranceValue(testData.linearityOfMasLoading?.tolerance, "0.1")}
                  </p>
                </div>
              </div>
            )}

            {/* 6. Consistency of Radiation Output */}
            {testData.consistencyOfRadiationOutput && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>5. Consistency of Radiation Output</h3>
                {/* FFD small table */}
                {testData.consistencyOfRadiationOutput.ffd && (
                  <div className="mb-3 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FDD (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.consistencyOfRadiationOutput.ffd}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {testData.consistencyOfRadiationOutput.outputRows?.length > 0 && (() => {
                  const rows = testData.consistencyOfRadiationOutput.outputRows;
                  // Determine max measurement count across all rows
                  const measCount = Math.max(...rows.map((r: any) => (r.outputs ?? []).length), 1);
                  const tol = testData.consistencyOfRadiationOutput.tolerance;
                  const tolVal = parseFloat(typeof tol === 'object' ? tol.value : tol) || 0.05;
                  const tolOp = (typeof tol === 'object' ? tol.operator : null) || '<=';

                  const getVal = (o: any): number => {
                    if (o == null) return NaN;
                    if (typeof o === 'number') return o;
                    if (typeof o === 'string') return parseFloat(o);
                    if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
                    return NaN;
                  };

                  return (
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
                            const avgDisplay = avg !== null ? avg.toFixed(4) : (row.mean || '-');
                            let covDisplay = '-';
                            let remark = row.remark || '-';
                            if (avg !== null && avg > 0) {
                              const variance = outputs.length > 1
                                ? outputs.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / (outputs.length - 1)
                                : 0;
                              const cov = Math.sqrt(variance) / avg;
                              if (isFinite(cov)) {
                                covDisplay = cov.toFixed(4);
                                const passes = (tolOp === '<=' || tolOp === '<') ? cov <= tolVal : cov >= tolVal;
                                remark = passes ? 'Pass' : 'Fail';
                              }
                            } else if (row.cov) {
                              covDisplay = row.cov;
                            }
                            return (
                              <tr key={i} className="text-center">
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.kv || '-'}</td>
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.mas || '-'}</td>
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
                                  <span className={String(remark).toUpperCase() === 'PASS' ? 'text-green-600' : String(remark).toUpperCase() === 'FAIL' ? 'text-red-600' : ''}>
                                    {remark}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
                {testData.consistencyOfRadiationOutput.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Tolerance (CoV):</strong> {normalizeToleranceOperator(testData.consistencyOfRadiationOutput?.tolerance, "≤")} {normalizeToleranceValue(testData.consistencyOfRadiationOutput?.tolerance, "0.05")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 7. Tube Housing Leakage */}
            {testData.tubeHousingLeakage?.leakageMeasurements?.length > 0 && (() => {
              const leakageData = testData.tubeHousingLeakage;
              const settings =
                (Array.isArray(leakageData.measurementSettings)
                  ? leakageData.measurementSettings[0]
                  : leakageData.measurementSettings) ||
                (Array.isArray(leakageData.settings) ? leakageData.settings[0] : leakageData.settings) ||
                {};
              const measurements = leakageData.leakageMeasurements || [];
              const workload = leakageData.workload?.value || leakageData.workload || "0";
              const workloadUnit = leakageData.workload?.unit || "mA·min/week";
              const maUsed = parseFloat(leakageData.ma || settings.ma || "0") || 1;
              const workloadVal = parseFloat(String(workload)) || 0;
              const tolVal = parseFloat(leakageData.tolerance?.value || leakageData.toleranceValue || "1.0") || 1.0;
              const tolOp = leakageData.tolerance?.operator || leakageData.toleranceOperator || "less than or equal to";
              const tolTime = leakageData.tolerance?.time || leakageData.toleranceTime || "1";

              const getDisplayOp = (op: string) => {
                if (op === "less than or equal to") return "≤";
                if (op === "greater than or equal to") return "≥";
                if (op === "<=") return "≤";
                if (op === ">=") return "≥";
                return op || "≤";
              };

              return (
                <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                  <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>6. Tube Housing Leakage Radiation Test</h3>

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
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{leakageData.fcd || settings.distance || settings.fcd || "100"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{leakageData.kv || settings.kv || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{leakageData.ma || settings.ma || "-"}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>
                              {leakageData.time || settings.time || settings.Time || settings.timeSec || settings.timeInSec || settings.exposureTime || "-"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Workload and Tolerance Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 print:mb-1">
                    <div>
                      <p className="text-xs print:text-[8px]" style={{ fontSize: '10px' }}>
                        <strong>Workload:</strong> {workload} {workloadUnit}
                      </p>
                    </div>
                    <div></div>
                  </div>

                  {/* Exposure Level Table */}
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
                        {measurements.map((row: any, i: number) => {
                          const gets = (val: any) => parseFloat(val) || 0;
                          const values = [row.left, row.right, row.front, row.back, row.top].map(gets).filter(v => v > 0);
                          const rowMax = values.length > 0 ? Math.max(...values) : 0;

                          let resMRValue = 0;
                          let resMGyValue = 0;
                          let calculatedMR = "-";
                          let calculatedMGy = "-";
                          let remark = row.remark || "-";

                          if (rowMax > 0 && maUsed > 0 && workloadVal > 0) {
                            resMRValue = (workloadVal * rowMax) / (60 * maUsed);
                            calculatedMR = resMRValue.toFixed(3);
                            resMGyValue = resMRValue / 114;
                            calculatedMGy = resMGyValue.toFixed(4);

                            if (remark === "-" || !remark) {
                              const passed = (tolOp === "less than or equal to" || tolOp === "<=") ? resMGyValue <= tolVal : resMGyValue >= tolVal;
                              remark = passed ? "Pass" : "Fail";
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
                                <span className={String(remark).toUpperCase() === "PASS" ? "text-green-600 font-bold" : String(remark).toUpperCase() === "FAIL" ? "text-red-600 font-bold" : ""}>
                                  {remark}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Formula and Summary Blocks */}
                  {(() => {
                    const gets = (val: any) => parseFloat(val) || 0;
                    const getSummary = (locName: string) => {
                      const row = measurements.find((m: any) => (m.location || '').toLowerCase().includes(locName.toLowerCase()));
                      if (!row) return null;
                      const values = [row.left, row.right, row.front, row.back, row.top].map(gets).filter(v => v > 0);
                      const max = values.length > 0 ? Math.max(...values) : 0;
                      const resMR = (workloadVal * max) / (60 * maUsed);
                      const resMGy = resMR / 114;
                      return { max, resMR, resMGy, location: row.location };
                    };

                    const tubeSummary = getSummary("Tube");
                    const collimatorSummary = getSummary("Collimator");

                    return (
                      <div className="space-y-4 print:space-y-1">
                        <div className="bg-gray-50 p-4 print:p-1 rounded border border-gray-200">
                          <p className="text-sm print:text-[10px] font-bold mb-2 print:mb-1">Calculation Formula:</p>
                          <div className="bg-white p-3 print:p-1 border border-dashed border-gray-400 text-center font-mono text-sm print:text-[10px]">
                            Maximum Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA used for measurement)
                          </div>
                          <p className="text-[10px] print:text-[8px] mt-2 text-gray-600 italic">
                            Where: Workload = {workload} | mA = {maUsed} | 1 mGy = 114 mR
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 print:gap-1">
                          {tubeSummary && tubeSummary.max > 0 && (
                            <div className="border border-blue-200 rounded p-3 print:p-1 bg-blue-50/30">
                              <p className="font-bold text-xs print:text-[9px] text-blue-800 mb-2">{tubeSummary.location} Summary:</p>
                              <div className="text-[11px] print:text-[8px] space-y-1">
                                <p>Max Measured: <strong>{tubeSummary.max} mR/hr</strong></p>
                                <p>Result: ({workload} × {tubeSummary.max}) / (60 × {maUsed}) = <strong>{tubeSummary.resMR.toFixed(3)} mR</strong></p>
                                <p>In mGy: {tubeSummary.resMR.toFixed(3)} / 114 = <span className="font-bold text-blue-700">{tubeSummary.resMGy.toFixed(4)} mGy</span></p>
                                <p><strong>Result: {tubeSummary.resMGy <= tolVal ? "Pass" : "Fail"}</strong></p>
                              </div>
                            </div>
                          )}
                          {collimatorSummary && collimatorSummary.max > 0 && (
                            <div className="border border-indigo-200 rounded p-3 print:p-1 bg-indigo-50/30">
                              <p className="font-bold text-xs print:text-[9px] text-indigo-800 mb-2">{collimatorSummary.location} Summary:</p>
                              <div className="text-[11px] print:text-[8px] space-y-1">
                                <p>Max Measured: <strong>{collimatorSummary.max} mR/hr</strong></p>
                                <p>Result: ({workload} × {collimatorSummary.max}) / (60 × {maUsed}) = <strong>{collimatorSummary.resMR.toFixed(3)} mR</strong></p>
                                <p>In mGy: {collimatorSummary.resMR.toFixed(3)} / 114 = <span className="font-bold text-indigo-700">{collimatorSummary.resMGy.toFixed(4)} mGy</span></p>
                                <p><strong>Result: {collimatorSummary.resMGy <= tolVal ? "Pass" : "Fail"}</strong></p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-blue-50 p-4 print:p-1 border-l-4 border-blue-500 rounded-r">
                          <p className="text-[11px] print:text-[8px] leading-relaxed">
                            <strong>Tolerance:</strong> Maximum Leakage Radiation Level at 1 meter from the Focus should be{" "}
                            {getDisplayOp(tolOp)}{" "}
                            <strong>{tolVal} mGy ({tolVal * 114} mR) in {tolTime} hour.</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* 8. Radiation Protection Survey */}
            {testData.radiationProtectionSurvey && (
              <div className="mb-8 print:mb-2 print:break-inside-avoid test-section" style={{ marginBottom: '8px' }}>
                <h3 className="text-xl font-bold mb-6 print:mb-1 print:text-sm" style={{ marginBottom: '4px', fontSize: '12px' }}>7. Details of Radiation Protection Survey</h3>

                {/* 1. Survey Details */}
                {(testData.radiationProtectionSurvey.surveyDate || testData.radiationProtectionSurvey.hasValidCalibration) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Survey Details</h4>
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
                    const maxVal = parseFloat(max.mRPerWeek) || 0;
                    const locVal = parseFloat(loc.mRPerWeek) || 0;
                    return locVal > maxVal ? loc : max;
                  }, workerLocs[0] || { mRPerHr: '', location: '' });

                  const maxPublicLocation = publicLocs.reduce((max: any, loc: any) => {
                    const maxVal = parseFloat(max.mRPerWeek) || 0;
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
                      <div className="mt-4 print:mt-1 space-y-3 print:space-y-1">
                        {maxWorkerLocation.mRPerHr && parseFloat(maxWorkerLocation.mRPerHr) > 0 && (
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
                        {maxPublicLocation.mRPerHr && parseFloat(maxPublicLocation.mRPerHr) > 0 && (
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
              <p className="text-center text-xl text-gray-500 mt-32">
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
          }
        }
      `}</style>
    </>
  );
};

export default ViewServiceReportDentalHandHeld;
