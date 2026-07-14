// src/components/reports/ViewServiceReportFixedRadioFluro.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getReportHeader,
  getDetails,
  getTotalFiltrationByServiceIdForFixedRadioFluro,
  getEffectiveFocalSpotByServiceIdForFixedRadioFluro,
  getCongruenceByServiceIdForFixedRadioFluro,
  getCentralBeamAlignmentByServiceIdForFixedRadioFluro,
  getOutputConsistencyByServiceIdForFixedRadioFluro,
  getLowContrastResolutionByServiceIdForFixedRadioFluro,
  getHighContrastResolutionByServiceIdForFixedRadioFluro,
  getExposureRateByServiceIdForFixedRadioFluro,
  getTubeHousingLeakageByServiceIdForFixedRadioFluro,
  getRadiationProtectionSurveyByServiceIdForFixedRadioFluro,
  getAccuracyOfIrradiationTimeByServiceIdForFixedRadioFluro,
  getLinearityOfMasLoadingByServiceIdForFixedRadioFluro,
  getLinearityOfMasLoadingStationsByServiceIdForFixedRadioFluro,
  getAccuracyOfOperatingPotentialByServiceIdForFixedRadioFluro,
  getTools,
} from "../../../../../../api";
import MainTestTableForFixedRadioFluro, { generateFixedRadioFluroSummaryRows } from "./MainTestTableForFixedRadioFluro";
import { generatePDF } from "../../../../../../utils/generatePDF";
import { ReportPdfPageHeader } from "../RadiographyFixed/component/Header";
import { ReportPdfPageFooter } from "../RadiographyFixed/component/Footer";
import { ReportPdfPageFooterEnd } from "../RadiographyFixed/component/FooterEnd";
import { ReportPdfPageNoteQR } from "../RadiographyFixed/component/NoteQR";
import { ReportPdfPageDeclaration } from "../RadiographyFixed/component/Declaration";

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
  qrCode?: string;
  notes?: Note[];
  category: string;
  reportULRNumber?: string;
  authorizedSignatoryName?: string;
  authorizedSignatorySignature?: string;
  // Test documents
  accuracyOfOperatingPotentialFixedRadioFluoro?: any;
  OutputConsistencyForFixedRadioFlouro?: any;
  LowContrastResolutionFixedRadioFlouro?: any;
  HighContrastResolutionFixedRadioFluoro?: any;
  ExposureRateTableTopFixedRadioFlouro?: any;
  LinearityOfmAsLoadingFixedRadioFluoro?: any;
  TubeHousingLeakageFixedRadioFlouro?: any;
  AccuracyOfIrradiationTimeFixedRadioFluoro?: any;
  CongruenceOfRadiationForRadioFluro?: any;
  CentralBeamAlignmentForRadioFluoro?: any;
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

/** Backend / forms use several shapes for the same value. */
const pickUlrFromObject = (obj: any): string | undefined => {
  if (!obj || typeof obj !== "object") return undefined;
  const raw =
    obj.reportULRNumber ??
    obj.reportUlrNumber ??
    obj.reportULRNo ??
    obj.ulrNumber;
  if (raw == null || raw === "") return undefined;
  const s = String(raw).trim();
  if (!s || s === "N/A") return undefined;
  return s;
};

const pickUlrFromQaTests = (tests: any[] | undefined): string | undefined => {
  if (!Array.isArray(tests)) return undefined;
  for (const t of tests) {
    const u = pickUlrFromObject(t);
    if (u) return u;
  }
  return undefined;
};

const ViewServiceReportFixedRadioFluro: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const pickRpId = (obj: any): string =>
    obj?.rpId || obj?.rpid || obj?.rpID || obj?.RPId || obj?.RPID || obj?.engineerAssigned?.rpId || obj?.engineerAssigned?.RPId || "N/A";
  const isToolUnexpired = (validTillRaw: string): boolean => {
    if (!validTillRaw) return false;
    const parsed = new Date(validTillRaw);
    if (Number.isNaN(parsed.getTime())) return false;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const validTillDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    return validTillDate >= todayStart;
  };
  const hasTimer = (() => {
    if (!serviceId) return true;
    const stored = localStorage.getItem(`fixedradiofluro_timer_choice_${serviceId}`);
    if (stored != null) {
      try {
        return JSON.parse(stored) === true;
      } catch {
        return stored === "true";
      }
    }
    return localStorage.getItem(`fixed-radio-fluro-timer-${serviceId}`) === "true";
  })();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [calculatedPages, setCalculatedPages] = useState<string>("");
  const [ulrNumber, setUlrNumber] = useState<string>("N/A");

  /** With timer: indices match legacy 4–13. Without timer: section 4 is omitted, so subtract 1 from 5–13. */
  const detailedSeq = (withTimerIndex: number) => (hasTimer ? withTimerIndex : withTimerIndex - 1);

  useEffect(() => {
    const fetchReport = async () => {
      if (!serviceId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [response, detailsRes, toolsRes] = await Promise.all([
          getReportHeader(serviceId),
          getDetails(serviceId),
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
          return merged
            .filter((tool) => isToolUnexpired(tool.calibrationValidTill))
            .map((tool, idx) => ({ ...tool, slNumber: String(idx + 1) }));
        };
        const detailsData = detailsRes?.data?.data || detailsRes?.data || {};
        const srfKey = response?.data?.srfNumber || detailsData?.srfNumber || "";
        const cachedOrderBySrfRaw = srfKey ? localStorage.getItem(`order-basic-by-srf-${srfKey}`) : null;
        const cachedOrderBySrf = cachedOrderBySrfRaw ? JSON.parse(cachedOrderBySrfRaw) : {};

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
          const resolvedUlr =
            pickUlrFromObject(data) ||
            pickUlrFromQaTests(detailsData.qaTests) ||
            undefined;
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
            reportULRNumber: resolvedUlr ?? (ulrNumber !== "N/A" ? ulrNumber : ""),
            rpId: pickRpId(data),
            toolsUsed: mergedTools,
            qrCode: data.qrCode || "",
            notes: data.notes || defaultNotes,
            authorizedSignatoryName:
              (typeof data.authorizedSignatory === "object" && data.authorizedSignatory?.name) ||
              data.authorizedSignatoryName ||
              "",
            authorizedSignatorySignature:
              (typeof data.authorizedSignatory === "object" && data.authorizedSignatory?.signature) ||
              data.authorizedSignatorySignature ||
              "",
          });
          if (resolvedUlr) setUlrNumber(resolvedUlr);

          const fromReport = {
            accuracyOfOperatingPotential: data.accuracyOfOperatingPotentialFixedRadioFluoro || data.accuracyOfOperatingPotentialRadigraphyFixed || null,
            outputConsistency: data.OutputConsistencyForFixedRadioFlouro || data.ConsistencyOfRadiationOutputFixedRadiography || null,
            linearityOfmAsLoading: data.LinearityOfmAsLoadingFixedRadioFluoro || data.LinearityOfmAsLoadingRadiographyFixed || null,
            linearityOfMaLoading: data.LinearityOfMaLoadingFixedRadioFluoro || data.LinearityOfMasLoadingStationsFixedRadioFluoro || null,
            tubeHousingLeakage: data.TubeHousingLeakageFixedRadioFlouro || data.RadiationLeakageLevelRadiographyFixed || null,
            accuracyOfIrradiationTime: data.AccuracyOfIrradiationTimeFixedRadioFluoro || data.AccuracyOfIrradiationTimeRadiographyFixed || null,
            congruenceOfRadiation: data.CongruenceOfRadiationForRadioFluro || data.CongruenceOfRadiationRadioGraphyFixed || null,
            centralBeamAlignment: data.CentralBeamAlignmentForRadioFluoro || data.CentralBeamAlignmentRadiographyFixed || null,
            effectiveFocalSpot: data.EffectiveFocalSpotRadiographyFixed || data.EffectiveFocalSpotForRadiographyFixedAndMobile || null,
            radiationProtectionSurvey: data.RadiationProtectionSurvey || data.RadiationProtectionSurveyRadiographyFixed || null,
            totalFiltration: data.TotalFilterationRadiographyFixed || null,
            lowContrastResolution: data.LowContrastResolutionFixedRadioFlouro || null,
            highContrastResolution: data.HighContrastResolutionFixedRadioFluoro || null,
            exposureRate: data.ExposureRateTableTopFixedRadioFlouro || null,
          };
          setTestData(fromReport);

          // Fetch any test tables not in report (e.g. Total Filtration, Effective Focal Spot when not linked) so all tables from Generate appear
          const fetchTest = async (fn: () => Promise<any>) => {
            try {
              const res = await fn();
              if (!res) return null;
              // Handle { success, data } envelope
              if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
                return res.data ?? null;
              }
              return res;
            } catch {
              return null;
            }
          };
          const [
            totalFiltrationRes,
            effectiveFocalSpotRes,
            congruenceRes,
            centralBeamRes,
            outputConsistencyRes,
            lowContrastRes,
            highContrastRes,
            exposureRateRes,
            tubeHousingRes,
            radiationProtectionRes,
            accuracyOfIrradiationTimeRes,
            linearityOfMasRes,
            linearityOfMaStationsRes,
            accuracyOfOperatingPotentialRes,
          ] = await Promise.all([
            fetchTest(() => getTotalFiltrationByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getEffectiveFocalSpotByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getCongruenceByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getCentralBeamAlignmentByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getOutputConsistencyByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getLowContrastResolutionByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getHighContrastResolutionByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getExposureRateByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getTubeHousingLeakageByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getRadiationProtectionSurveyByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getAccuracyOfIrradiationTimeByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getLinearityOfMasLoadingByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getLinearityOfMasLoadingStationsByServiceIdForFixedRadioFluro(serviceId)),
            fetchTest(() => getAccuracyOfOperatingPotentialByServiceIdForFixedRadioFluro(serviceId)),
          ]);

          setTestData((prev: any) => ({
            ...prev,
            totalFiltration: prev.totalFiltration || totalFiltrationRes || null,
            effectiveFocalSpot: prev.effectiveFocalSpot || effectiveFocalSpotRes || null,
            congruenceOfRadiation: prev.congruenceOfRadiation || congruenceRes || null,
            centralBeamAlignment: prev.centralBeamAlignment || centralBeamRes || null,
            outputConsistency: prev.outputConsistency || outputConsistencyRes || null,
            lowContrastResolution: prev.lowContrastResolution || lowContrastRes || null,
            highContrastResolution: prev.highContrastResolution || highContrastRes || null,
            exposureRate: prev.exposureRate || exposureRateRes || null,
            tubeHousingLeakage: prev.tubeHousingLeakage || tubeHousingRes || null,
            radiationProtectionSurvey: prev.radiationProtectionSurvey || radiationProtectionRes || null,
            accuracyOfIrradiationTime: prev.accuracyOfIrradiationTime || accuracyOfIrradiationTimeRes || null,
            linearityOfmAsLoading: prev.linearityOfmAsLoading || linearityOfMasRes || null,
            linearityOfMaLoading: prev.linearityOfMaLoading || linearityOfMaStationsRes || null,
            accuracyOfOperatingPotential: prev.accuracyOfOperatingPotential || accuracyOfOperatingPotentialRes || null,
          }));
        } else {
          console.error("FixedRadioFluro report header missing/unrecognized shape:", response);
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

  // Fetch ULR Number (matching ServiceDetails2.tsx approach)
  useEffect(() => {
    const fetchULRNumber = async () => {
      if (!serviceId) return;
      try {
        // First, try to get from service details (qaTests)
        const serviceDetails = await getDetails(serviceId);
        const fromQa = pickUlrFromQaTests(serviceDetails?.data?.qaTests);
        if (fromQa) {
          setUlrNumber(fromQa);
          return;
        }

        // Second, try to get from localStorage reportNumbers (matching ServiceDetails2 pattern)
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith('reportNumbers_')) {
            try {
              const reportNumbers = JSON.parse(localStorage.getItem(key) || '{}');
              const serviceReport = reportNumbers[serviceId];
              const fromStore =
                pickUlrFromObject(serviceReport) ||
                pickUlrFromObject(serviceReport?.qatest);
              if (fromStore) {
                setUlrNumber(fromStore);
                return;
              }
            } catch (e) {
              // Continue to next key
            }
          }
        }

        // If still not found, set default
        setUlrNumber("N/A");
      } catch (err) {
        console.error("Failed to fetch ULR number:", err);
        setUlrNumber("N/A");
      }
    };
    fetchULRNumber();
  }, [serviceId]);

  useEffect(() => {
    if (loading || notFound) return;
    const summaryRows = generateFixedRadioFluroSummaryRows(testData, hasTimer);
    const summaryPagesCount = Math.ceil(summaryRows.length / 18) || 1;
    // 1 main + summary pages + 7 detailed pages + 1 declaration page
    const pagesCount = 9 + summaryPagesCount;
    setCalculatedPages(String(pagesCount));
  }, [testData, hasTimer, loading, notFound]);

  const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString("en-GB"));

  // Safely extract value from potential Mongoose {value, _id} objects
  const safeVal = (v: any): string => {
    if (v == null) return "-";
    if (typeof v === "object" && "value" in v) return v.value ?? "-";
    return String(v);
  };

  const leadOwnerRole = String(
    report?.leadOwnerType ||
    report?.leadOwnerRole ||
    report?.leadOwner?.role ||
    report?.leadOwner?.leadOwnerType ||
    report?.leadOwner || ""
  ).trim().toLowerCase();
  const leadOwnerName = String(
    report?.leadOwner?.name ||
    report?.leadOwner?.fullName ||
    report?.leadOwner?.companyName ||
    report?.leadOwner || ""
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
  const todayDate = new Date().toLocaleDateString("en-GB");
  const extractCity = (raw: string) => {
    if (!raw || raw === "N/A") return "";
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return "";
    const alphaParts = parts.filter((p) => /[A-Za-z]/.test(p) && !/^\d{6}$/.test(p.replace(/\s+/g, "")));
    if (alphaParts.length === 0) return "";
    const stateOrCountry = /^(india|bharat|uttar pradesh|up|delhi|new delhi|haryana|maharashtra|karnataka|tamil nadu|kerala|gujarat|rajasthan|punjab|bihar|west bengal|telangana|andhra pradesh|odisha|jharkhand|chhattisgarh|madhya pradesh|goa|assam|jammu and kashmir|ladakh|himachal pradesh|uttarakhand|manipur|meghalaya|mizoram|nagaland|sikkim|tripura|arunachal pradesh)$/i;
    const city = [...alphaParts].reverse().find((p) => !stateOrCountry.test(p));
    return city || alphaParts[alphaParts.length - 1];
  };
  const customerCity = extractCity(report?.location || "") || extractCity(report?.address || "") || "-";
  const placeValue = report?.city && String(report.city).trim() !== "" ? String(report.city).trim() : customerCity;

  const downloadPDF = async () => {
    try {
      await generatePDF({
        elementId: "report-content",
        filename: `FixedRadioFluro-Report-${report?.testReportNumber || "report"}.pdf`,
        buttonSelector: ".download-pdf-btn",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-semibold">Loading Fixed RadioFluro Report...</div>;
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

  const displayReport = {
    ...report,
    reportULRNumber: report.reportULRNumber || (ulrNumber !== "N/A" ? ulrNumber : "N/A"),
  };

  const toolsArray = (report.toolsUsed || []).filter((tool) => isToolUnexpired(tool.calibrationValidTill));

  const cellStyle = (extra?: React.CSSProperties): React.CSSProperties => {
    const padding = extra?.padding ? String(extra.padding) : "4px 6px";
    const parts = padding.trim().split(/\s+/);
    let finalPadding = padding;
    if (parts.length === 1) finalPadding = `${parts[0]} ${parts[0]} 4px ${parts[0]}`;
    else if (parts.length === 2) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[1]}`;
    else if (parts.length === 3) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[0]}`;
    else if (parts.length === 4) finalPadding = `${parts[0]} ${parts[1]} 4px ${parts[3]}`;

    return {
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
      padding: finalPadding,
    };
  };

  const tableStyle: React.CSSProperties = {
    fontSize: "11px",
    tableLayout: "fixed",
    borderCollapse: "collapse",
    borderSpacing: "0",
    width: "100%",
    border: "0.1px solid #666",
    textAlign: "center",
  };

  const ReportPage: React.FC<{ isLast?: boolean; children: React.ReactNode }> = ({ isLast, children }) => (
    <div
      className={`bg-white shadow-2xl print:shadow-none ${isLast ? "report-pdf-last-page-shell" : "report-pdf-page-shell"}`}
      style={{
        pageBreakAfter: "always",
        display: "flex",
        flexDirection: "column",
        width: "210mm",
        boxSizing: "border-box",
        minHeight: "297mm",
        margin: "20px auto",
        padding: "15mm 20mm",
      }}
    >
      <ReportPdfPageHeader report={displayReport} formatDate={formatDate} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>{children}</div>
      {isLast ? (
        <ReportPdfPageFooterEnd todayDate={todayDate} customerCity={placeValue} />
      ) : (
        <ReportPdfPageFooter todayDate={todayDate} customerCity={placeValue} />
      )}
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="font-bold mb-1 text-[12px]">{title}</h2>
  );

  const TestSectionTitle = ({ num, title }: { num: number; title: string }) => (
    <h3 className="font-bold mb-2" style={{ fontSize: "12px" }}>
      {num}. {title}
    </h3>
  );

  return (
    <>
      <div className="fixed bottom-8 right-8 print:hidden z-50 flex flex-col gap-4">
        <button onClick={downloadPDF} className="download-pdf-btn bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-5 px-12 rounded-xl shadow-2xl">
          Download PDF
        </button>
      </div>

      <div id="report-content" className="fixed-report-pdf">
        <ReportPage>
          <h1 className="text-center font-bold underline mb-2" style={{ fontSize: "15px" }}>
            QA TEST REPORT FOR FIXED RADIOGRAPHY & FLUOROSCOPY EQUIPMENT
          </h1>
          <p className="text-center italic mb-4" style={{ fontSize: "9px" }}>
            (Periodic Quality Assurance shall be carried out at least once in two years as per AERB guidelines)
          </p>

          <section className="mb-3 text-[10px]">
            <SectionTitle title="1. Customer Details" />
            <div className="space-y-[2px]">
              {[
                ...(isManufacturerLeadOwner ? [["Name of the customer", manufacturerDisplayName]] : []),
                ["Name of the testing site", testingSiteName],
                ["Address of the testing site", testingSiteAddress],
              ].map(([label, value], index) => (
                <div key={label} className="flex">
                  <div className="w-6 text-right pr-1 font-semibold">1.{index + 1}</div>
                  <div className="w-64 font-semibold">{label}</div>
                  <div className="px-1 font-semibold">:</div>
                  <div className="flex-1 break-words">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-3 text-[10px]">
            <SectionTitle title="2. Customer Reference" />
            <div className="space-y-1">
              <div className="flex">
                <div className="w-6 text-right pr-1">2.1</div>
                <div className="w-64">SRF No.</div>
                <div className="px-1">:</div>
                <div className="flex-1">{safeVal(report.srfNumber)}</div>
                <div className="w-20">SRF Date</div>
                <div className="px-1">:</div>
                <div className="w-28">{formatDate(safeVal(report.srfDate))}</div>
              </div>
              <div className="flex">
                <div className="w-6 text-right pr-1">2.2</div>
                <div className="w-64">Test Report No.</div>
                <div className="px-1">:</div>
                <div className="flex-1">{safeVal(report.testReportNumber)}</div>
                <div className="w-20">Issue Date</div>
                <div className="px-1">:</div>
                <div className="w-28">{formatDate(safeVal(report.issueDate))}</div>
              </div>
            </div>
          </section>

          <section className="mb-3 text-[10px]">
            <SectionTitle title="3. Details Of Device Under Test" />
            <div className="space-y-[2px]">
              {[
                ["Nomenclature / Type of equipment", safeVal(report.nomenclature)],
                ["Make", safeVal(report.make) || "-"],
                ["Model", safeVal(report.model)],
                ["Sl. No.", safeVal(report.slNumber)],
                ...(report.category && report.category !== "N/A" ? [["Category", safeVal(report.category)]] : []),
                ["Condition of Test Item", safeVal(report.condition)],
                ["Testing Procedure No.", safeVal(report.testingProcedureNumber) || "-"],
                ["Engineer's Name", safeVal(report.engineerNameRPId) || "-"],
                ["RP ID", report.rpId || pickRpId(report) || "-"],
                ["No. of pages", calculatedPages || "-"],
                ["QA Test Date", formatDate(safeVal(report.testDate))],
                ["QA Test Due Date", formatDate(safeVal(report.testDueDate))],
                ["Testing done at Location", safeVal(report.location)],
                ["Temperature (°C)", safeVal(report.temperature) || "-"],
                ["Humidity in RH (%)", safeVal(report.humidity) || "-"],
              ].map(([label, value], index) => (
                <div key={label} className="flex">
                  <div className="w-6 text-right pr-1">3.{index + 1}</div>
                  <div className="w-64">{label}</div>
                  <div className="px-1">:</div>
                  <div className="flex-1 break-words">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-3">
            <h2 className="font-bold mb-4" style={{ fontSize: "12px" }}>
              4. Standards / Tools Used
            </h2>
            <table style={{ ...tableStyle, tableLayout: "fixed" }} className="compact-table">
              <thead>
                <tr>
                  {["Sl No.", "Nomenclature", "Make", "Model", "Sr. No.", "Range", "Certificate No.", "Valid Till"].map(
                    (h, i) => (
                      <th
                        key={h}
                        style={cellStyle({
                          fontWeight: 700,
                          border: "0.1px solid #666",
                          fontSize: "9px",
                          lineHeight: "1.2",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          padding: "3px 4px",
                          width: ["6%", "18%", "12%", "12%", "10%", "10%", "16%", "16%"][i],
                        })}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {toolsArray.length > 0 ? (
                  toolsArray.map((tool, i) => (
                    <tr key={i}>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{i + 1}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.nomenclature}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.make || "-"}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.model || "-"}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.SrNo}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.range}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{tool.calibrationCertificateNo}</td>
                      <td style={cellStyle({ border: "0.1px solid #666" })}>{formatDate(tool.calibrationValidTill)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={cellStyle({ border: "0.1px solid #666" })}>
                      No tools recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div style={{ marginTop: "auto" }}>
            <ReportPdfPageNoteQR report={report} />
          </div>
        </ReportPage>

        {(() => {
          const allRows = generateFixedRadioFluroSummaryRows(testData, hasTimer);
          const chunkSize = 18;
          const chunks: typeof allRows[] = [];
          for (let i = 0; i < allRows.length; i += chunkSize) {
            chunks.push(allRows.slice(i, i + chunkSize));
          }

          if (chunks.length === 0) {
            return (
              <ReportPage>
                <div style={{ width: "100%", flex: 1 }}>
                  <div className="text-center text-gray-500 py-10">No test results available.</div>
                </div>
              </ReportPage>
            );
          }

          return chunks.map((chunk, pageIdx) => {
            const displayRows = chunk.map((r, rowIdx) => {
              if (rowIdx === 0 && !r.isFirstRow) {
                const originalIdx = pageIdx * chunkSize;
                let srcIdx = originalIdx;
                while (srcIdx >= 0 && !allRows[srcIdx].isFirstRow) {
                  srcIdx--;
                }
                const sourceRow = allRows[srcIdx];
                let groupCountInStore = 0;
                for (let k = 0; k < chunk.length; k++) {
                  if (k === 0 || !chunk[k].isFirstRow) {
                    groupCountInStore++;
                  } else {
                    break;
                  }
                }
                return {
                  ...r,
                  isFirstRow: true,
                  srNo: sourceRow.srNo,
                  parameter: `${sourceRow.parameter} (Cont.)`,
                  rowSpan: groupCountInStore,
                };
              }
              return r;
            });

            return (
              <ReportPage key={`summary-page-${pageIdx}`}>
                <div style={{ width: "100%", flex: 1 }}>
                  <MainTestTableForFixedRadioFluro
                    testData={testData}
                    hasTimer={hasTimer}
                    rows={displayRows}
                    isContinuation={pageIdx > 0}
                  />
                </div>
              </ReportPage>
            );
          });
        })()}

        {/* DETAILED TEST RESULTS — PART 1 */}
        <ReportPage>
          <div className="report-pdf-last-main" style={{ width: "100%", flex: 1 }}>
            <h2 className="font-bold text-center underline mb-4" style={{ fontSize: "16px" }}>
              DETAILED TEST RESULTS
            </h2>
            {testData.congruenceOfRadiation && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={1} title="Congruence of Radiation & Optical Field" />

                {/* Technique Factors */}
                {testData.congruenceOfRadiation.techniqueFactors?.length > 0 && (
                  <div className="mb-4 print:mb-1">
                    <p className="font-semibold mb-2 text-sm print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Technique Factors:</p>
                    <div className="overflow-x-auto">
                      <table className="border-2 border-black text-sm mb-4 compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>FFD (cm)</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.congruenceOfRadiation.techniqueFactors.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(row.fcd || row.sid)}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(row.kv)}</td>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(row.mas)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>Dimension (cm)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>Observed Shift (cm)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>Shift in Edges (cm)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>% of FED</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>Tolerance (%)</th>
                        <th className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '10px' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(testData.congruenceOfRadiation.congruenceMeasurements) && testData.congruenceOfRadiation.congruenceMeasurements.length > 0 ? (
                        testData.congruenceOfRadiation.congruenceMeasurements.map((m: any, i: number) => {
                          const percentFED = m.percentFED != null ? parseFloat(m.percentFED) : null;
                          const tolVal = m.tolerance != null ? parseFloat(m.tolerance) : 2;
                          const isPass = percentFED != null ? percentFED <= tolVal : (m.remark === "Pass" || m.remark === "PASS");
                          return (
                            <tr key={i} className="text-center">
                              <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px' }}>{safeVal(m.dimension || "—")}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px' }}>{safeVal(m.observedShift)}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px' }}>{safeVal(m.edgeShift)}</td>
                              <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px' }}>{percentFED != null ? `${percentFED}%` : "-"}</td>
                              <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px' }}>{m.tolerance != null ? `≤ ${safeVal(m.tolerance)}%` : "≤ 2%"}</td>
                              <td className="border border-black p-2 print:p-1 font-bold" style={{ padding: '0px 1px' }}>
                                <span className={isPass ? "text-green-600" : "text-red-600"}>{isPass ? "PASS" : "FAIL"}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold" colSpan={3}>No detailed measurements available</td>
                          <td className="border border-black p-2 print:p-1 font-bold">FAIL</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Central Beam Alignment Test */}
            {testData.centralBeamAlignment && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={2} title="Central Beam Alignment" />

                {/* Operating parameters */}
                {testData.centralBeamAlignment.techniqueFactors && (
                  <div className="mb-4 print:mb-1">
                    <p className="font-semibold mb-2 text-sm print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>Operating parameters:</p>
                    <div className="overflow-x-auto">
                      <table className="border-2 border-black text-sm mb-4 compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '400px' }}>
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>FFD (cm)</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(testData.centralBeamAlignment.techniqueFactors.fcd || testData.centralBeamAlignment.techniqueFactors.sid)}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(testData.centralBeamAlignment.techniqueFactors.kv)}</td>
                            <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{safeVal(testData.centralBeamAlignment.techniqueFactors.mas)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '10px', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '500px' }}>
                    <tbody>
                      {testData.centralBeamAlignment.observedTilt && (testData.centralBeamAlignment.observedTilt.value != null || testData.centralBeamAlignment.observedTilt.remark) && (
                        <>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                            <td className="border border-black p-2 print:p-1 font-semibold w-1/2" style={{ padding: '2px 4px' }}>Observed tilt</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '2px 4px' }}>
                              {testData.centralBeamAlignment.observedTilt.value != null ? `${safeVal(testData.centralBeamAlignment.observedTilt.value)}°` : "-"}
                              {testData.centralBeamAlignment.observedTilt.remark && (
                                <span className={`ml-2 font-bold ${safeVal(testData.centralBeamAlignment.observedTilt.remark) === "Pass" ? "text-green-600" : "text-red-600"}`}>
                                  {safeVal(testData.centralBeamAlignment.observedTilt.remark)}
                                </span>
                              )}
                            </td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                            <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '2px 4px' }}>Tolerance: Central Beam Alignment</td>
                            <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '2px 4px' }}>
                              {testData.centralBeamAlignment.tolerance?.value != null ? `${safeVal(testData.centralBeamAlignment.tolerance?.operator || "≤")} ${safeVal(testData.centralBeamAlignment.tolerance.value)}°` : "≤ 1.5°"}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. Effective Focal Spot */}
            {testData.effectiveFocalSpot && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={3} title="Effective Focal Spot Size" />
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
                        <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{safeVal(testData.effectiveFocalSpot.fcd)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {testData.effectiveFocalSpot.focalSpots?.length > 0 && (
                  <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ width: '14%', padding: '0px 1px', fontSize: '11px' }}>Focus</th>
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
                            const numVal = typeof val === 'number' ? val : parseFloat(val);
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
                              <td className="border border-black p-2 print:p-1 text-left font-semibold" style={{ padding: '0px 4px', fontSize: '11px' }}>{spot.focusType || (i === 0 ? "Large Focus" : "Small Focus")}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{statedNominal}</td>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{measuredNominal}</td>
                              <td className="border border-black p-2 print:p-1 text-center font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                <span className={
                                  spot.remark === "Pass" || spot.remark === "PASS" ? "text-green-600" :
                                    spot.remark === "Fail" || spot.remark === "FAIL" ? "text-red-600" : ""
                                }>
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
          </div>
        </ReportPage>

        {/* DETAILED TEST RESULTS — PART 2 */}
        <ReportPage>
          <div className="report-pdf-last-main" style={{ width: "100%", flex: 1 }}>
            {hasTimer && testData.accuracyOfIrradiationTime && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={4} title="Accuracy of Irradiation Time" />
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
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{safeVal(testData.accuracyOfIrradiationTime.testConditions.fcd || testData.accuracyOfIrradiationTime.testConditions.sid)}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{safeVal(testData.accuracyOfIrradiationTime.testConditions.kv)}</td>
                          <td className="border border-black px-2 py-1 text-center" style={{ padding: '0px 1px' }}>{safeVal(testData.accuracyOfIrradiationTime.testConditions.ma || testData.accuracyOfIrradiationTime.testConditions.mA)}</td>
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
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Set Time (sec)</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Measured Time (sec)</th>
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
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(row.setTime)}</td>
                                <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{safeVal(row.measuredTime)}</td>
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
                      <strong>Tolerance:</strong> Error {testData.accuracyOfIrradiationTime.tolerance.operator || "<="} {testData.accuracyOfIrradiationTime.tolerance.value || "10"}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {testData.accuracyOfOperatingPotential && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={detailedSeq(5)} title="Accuracy of Operating Potential" />
                {Array.isArray(testData.accuracyOfOperatingPotential.table2) && testData.accuracyOfOperatingPotential.table2.length > 0 && (
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
                        {testData.accuracyOfOperatingPotential.table2.map((row: any, i: number) => (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
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
                )}
              </div>
            )}
          </div>
        </ReportPage>

        {/* DETAILED TEST RESULTS — PART 3 */}
        <ReportPage>
          <div className="report-pdf-last-main" style={{ width: "100%", flex: 1 }}>
            {testData.totalFiltration && (
              <div className="mb-4 test-section">
                {/* kVp Accuracy measurements table (same data source) */}
                {Array.isArray(testData.totalFiltration.measurements) && testData.totalFiltration.measurements.length > 0 && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>5.Accuracy of Operating Potential</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Applied kVp</th>
                            {testData.totalFiltration.mAStations?.map((ma: string, idx: number) => (
                              <th key={idx} className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{ma}</th>
                            ))}
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Average kVp</th>
                            <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testData.totalFiltration.measurements.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>{row.appliedKvp || "-"}</td>
                              {testData.totalFiltration.mAStations?.map((_: string, idx: number) => (
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
                    {testData.totalFiltration.tolerance && (
                      <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                        <p className="text-sm print:text-[9px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                          <strong>Tolerance:</strong> {testData.totalFiltration.tolerance.sign || "±"} {testData.totalFiltration.tolerance.value || "-"} kVp
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {/* Total Filtration Result */}
                {testData.totalFiltration.totalFiltration && (() => {
                  const tf = testData.totalFiltration.totalFiltration;
                  const ft = testData.totalFiltration.filtrationTolerance || {};
                  const kvp = parseFloat(tf.atKvp ?? "");
                  const measured = parseFloat(tf.required ?? "");
                  const threshold1 = parseFloat(ft.kvThreshold1 ?? "70");
                  const threshold2 = parseFloat(ft.kvThreshold2 ?? "100");

                  let requiredTol = NaN;
                  if (!isNaN(kvp)) {
                    if (kvp < threshold1) requiredTol = parseFloat(ft.forKvGreaterThan70 ?? "1.5");
                    else if (kvp <= threshold2) requiredTol = parseFloat(ft.forKvBetween70And100 ?? "2.0");
                    else requiredTol = parseFloat(ft.forKvGreaterThan100 ?? "2.5");
                  }

                  const filtrationRemark = (!isNaN(measured) && !isNaN(requiredTol))
                    ? (measured >= requiredTol ? "PASS" : "FAIL")
                    : "-";

                  return (
                    <div className="rounded" style={{ padding: "4px 6px", marginTop: "4px" }}>
                      <TestSectionTitle num={detailedSeq(6)} title="Total Filtration" />
                      <table className="w-full border border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>At kVp</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{tf.atKvp || "-"} kVp</td>
                          </tr>
                          <tr>
                            <td className="border border-black font-medium" style={{ padding: '0px 4px', fontSize: '11px' }}>Measured Total Filtration</td>
                            <td className="border border-black text-center" style={{ padding: '0px 4px', fontSize: '11px' }}>{tf.required || "-"} mm Al</td>
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
                      <div style={{ marginTop: '4px', fontSize: '10px', color: '#555' }}>
                        <span className="font-semibold">Tolerance criteria: </span>
                        {ft.forKvGreaterThan70 ?? "1.5"} mm Al for kV &lt; {ft.kvThreshold1 ?? "70"} |&nbsp;
                        {ft.forKvBetween70And100 ?? "2.0"} mm Al for {ft.kvThreshold1 ?? "70"} ≤ kV ≤ {ft.kvThreshold2 ?? "100"} |&nbsp;
                        {ft.forKvGreaterThan100 ?? "2.5"} mm Al for kV &gt; {ft.kvThreshold2 ?? "100"}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {(testData.linearityOfmAsLoading || testData.linearityOfMaLoading) && (
              <div className="mb-4 test-section">
                <TestSectionTitle
                  num={detailedSeq(7)}
                  title={
                    (() => {
                      const maData = testData.linearityOfMaLoading;
                      const masData = testData.linearityOfmAsLoading;
                      const data = (maData?.table2?.length ? maData : null) || (masData?.table2?.length ? masData : null) || maData || masData;
                      const table1 = data?.table1 || data?.testConditions;
                      const conditions = Array.isArray(table1) ? table1?.[0] : table1;
                      const timerPresent = conditions?.time !== undefined && conditions?.time !== null && String(conditions?.time).trim() !== "";
                      return hasTimer || timerPresent ? "Linearity of mA Loading Stations" : "Linearity of mAs Loading";
                    })()
                  }
                />
                {/* Test Conditions as table */}
                {(() => {
                  const maData = testData.linearityOfMaLoading;
                  const masData = testData.linearityOfmAsLoading;
                  const linearityData = (maData?.table2?.length ? maData : null) || (masData?.table2?.length ? masData : null) || maData || masData;
                  const table1 = linearityData.table1 || linearityData.testConditions;
                  if (!table1 || (Array.isArray(table1) && table1.length === 0)) return null;

                  const conditions = Array.isArray(table1) ? table1[0] : table1;
                  const hasTimer = conditions?.time !== undefined && conditions?.time !== null && String(conditions?.time).trim() !== "";
                  return (
                    <div className="mb-4 print:mb-1" style={{ marginBottom: '6px' }}>
                      <p className="font-semibold mb-1 text-sm print:text-xs" style={{ fontSize: '11px', marginBottom: '3px' }}>Test Conditions:</p>
                      <table className="border border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FDD (cm)</th>
                            <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>kV</th>
                            {hasTimer && (
                              <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>Time (sec)</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{safeVal(conditions?.fcd || conditions?.sid)}</td>
                            <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{safeVal(conditions?.kv)}</td>
                            {hasTimer && (
                              <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{safeVal(conditions?.time)}</td>
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {(() => {
                  const maData = testData.linearityOfMaLoading;
                  const masData = testData.linearityOfmAsLoading;
                  const linearityData = (maData?.table2?.length ? maData : null) || (masData?.table2?.length ? masData : null) || maData || masData;
                  const rows = linearityData.table2 || [];
                  if (rows.length === 0) return null;

                  const tolVal = parseFloat(linearityData.tolerance ?? '0.1') || 0.1;
                  const tolOp = linearityData.toleranceOperator ?? '<=';
                  const measHeaders = linearityData.measHeaders || Array.from({ length: Math.max(...rows.map((r: any) => (r.measuredOutputs || []).length), 1) }, (_, i) => `Meas ${i + 1}`);

                  const formatV = (val: any) => {
                    if (val === undefined || val === null) return '-';
                    const str = String(val).trim();
                    return str === '' || str === '—' || str === 'undefined' || str === 'null' ? '-' : str;
                  };

                  const table1 = linearityData.table1 || linearityData.testConditions;
                  const conditions = Array.isArray(table1) ? table1?.[0] : table1;
                  const timeSec = parseFloat(String(conditions?.time ?? ""));
                  const hasValidTimer = !isNaN(timeSec) && timeSec > 0;

                  // Recalculate values using same logic as reference
                  const xValues: number[] = [];
                  const processedRows = rows.map((row: any) => {
                    const outputs = (row.measuredOutputs ?? [])
                      .map((v: any) => parseFloat(v))
                      .filter((v: number) => !isNaN(v) && v > 0);
                    const avg = outputs.length > 0
                      ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length
                      : null;
                    const avgDisplay = avg !== null ? parseFloat(avg.toFixed(4)).toFixed(4) : '—';

                    const mAsLabel = String(row.mAsApplied ?? row.mAs ?? row.mAsRange ?? '');
                    const match = mAsLabel.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
                    const midMas = match
                      ? (parseFloat(match[1]) + parseFloat(match[2])) / 2
                      : parseFloat(mAsLabel) || 0;

                    let x = null;
                    if (avg !== null && midMas > 0 && hasValidTimer) {
                      x = avg / (midMas * timeSec);
                    } else if (avg !== null && midMas > 0) {
                      x = avg / midMas;
                    }
                    const xDisplay = x !== null ? parseFloat(x.toFixed(4)).toFixed(4) : '—';
                    if (x !== null) xValues.push(parseFloat(x.toFixed(4)));

                    return { ...row, _avgDisplay: avgDisplay, _xDisplay: xDisplay };
                  });

                  const hasData = xValues.length > 0;
                  const xMax = hasData ? parseFloat(Math.max(...xValues).toFixed(4)).toFixed(4) : '—';
                  const xMin = hasData ? parseFloat(Math.min(...xValues).toFixed(4)).toFixed(4) : '—';
                  const colNum = hasData && xMax !== '—' && xMin !== '—' && (parseFloat(xMax) + parseFloat(xMin)) > 0
                    ? Math.abs(parseFloat(xMax) - parseFloat(xMin)) / (parseFloat(xMax) + parseFloat(xMin))
                    : 0;
                  const col = hasData && colNum > 0 ? parseFloat(colNum.toFixed(4)).toFixed(4) : '—';

                  let pass = false;
                  if (hasData && col !== '—') {
                    const colVal = parseFloat(col);
                    switch (tolOp) {
                      case '<': pass = colVal < tolVal; break;
                      case '>': pass = colVal > tolVal; break;
                      case '<=': pass = colVal <= tolVal; break;
                      case '>=': pass = colVal >= tolVal; break;
                      case '=': pass = Math.abs(colVal - tolVal) < 0.0001; break;
                      default: pass = colVal <= tolVal;
                    }
                  }
                  const remarks = hasData && col !== '—' ? (pass ? 'Pass' : 'Fail') : '—';

                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1 print:overflow-visible" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black compact-table force-small-text" style={{ fontSize: '10px', tableLayout: 'fixed', width: '100%' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>mA</th>
                            <th colSpan={measHeaders.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                              Output (mGy)
                            </th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Avg Output</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                              X ({hasValidTimer ? "mGy/(mA*s)" : "mGy/mA"})
                            </th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X MAX</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>X MIN</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>CoL</th>
                            <th className="border border-black border-b-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>Remarks</th>
                          </tr>
                          <tr>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            {measHeaders.map((header: string, idx: number) => (
                              <th key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                                {header || `Meas ${idx + 1}`}
                              </th>
                            ))}
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                            <th className="border border-black border-t-0 p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {processedRows.map((row: any, i: number) => (
                            <tr key={i} className="text-center" style={{ fontSize: '10px' }}>
                              <td className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>{formatV(row.mAsApplied ?? row.mAs ?? row.mAsRange)}</td>
                              {measHeaders.map((_: string, idx: number) => (
                                <td key={idx} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px' }}>
                                  {formatV(row.measuredOutputs?.[idx])}
                                </td>
                              ))}
                              <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px' }}>{row._avgDisplay}</td>
                              <td className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px' }}>{row._xDisplay}</td>
                              {i === 0 ? (
                                <>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{xMax}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{xMin}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] font-medium text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>{col}</td>
                                  <td rowSpan={rows.length} className="border border-black p-1.5 print:p-[3px] text-center" style={{ fontSize: '10px', padding: '5px', verticalAlign: 'middle' }}>
                                    <span className={
                                      remarks === 'Pass' ? 'text-green-600 font-semibold' :
                                        remarks === 'Fail' ? 'text-red-600 font-semibold' : ''
                                    } style={{ fontSize: '10px' }}>
                                      {remarks}
                                    </span>
                                  </td>
                                </>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
                {(() => {
                  const linearityData = testData.linearityOfmAsLoading || testData.linearityOfMaLoading;
                  if (!linearityData.tolerance) return null;
                  return (
                    <div className="bg-gray-50 p-4 print:p-1 rounded border">
                      <p className="text-sm print:text-[10px]" style={{ fontSize: '10px' }}>
                        <strong>Tolerance (CoL):</strong> {linearityData.toleranceOperator || "≤"} {linearityData.tolerance || "0.1"}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </ReportPage>

        {/* DETAILED TEST RESULTS — PART 4 */}
        <ReportPage>
          <div className="report-pdf-last-main" style={{ width: "100%", flex: 1 }}>
            {testData.outputConsistency && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={detailedSeq(8)} title="Consistency of Radiation Output" />

                {testData.outputConsistency.ffd?.value && (
                  <div className="mb-4 print:mb-1">
                    <table className="border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', maxWidth: '150px' }}>
                      <thead className="bg-gray-100">
                        <tr className="bg-blue-50">
                          <th className="border border-black px-4 py-1 text-center" style={{ padding: '0px 8px', fontSize: '11px' }}>FDD (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black px-4 py-1 text-center font-medium" style={{ padding: '0px 8px', fontSize: '11px' }}>{testData.outputConsistency.ffd.value}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {testData.outputConsistency.outputRows?.length > 0 && (() => {
                  const rows = testData.outputConsistency.outputRows;
                  const measHeaders = testData.outputConsistency.measurementHeaders?.length
                    ? testData.outputConsistency.measurementHeaders
                    : Array.from(
                        { length: Math.max(...rows.map((r: any) => Math.max((r.outputs ?? []).length, (r.measuredOutputs ?? []).length)), 1) },
                        (_, i) => `Meas ${i + 1}`
                      );
                  const measCount = measHeaders.length;
                  const tolVal = parseFloat(testData.outputConsistency.tolerance?.value ?? '0.05') || 0.05;
                  const tolOp = testData.outputConsistency.tolerance?.operator ?? '<=';

                  const getVal = (o: any, row?: any, field?: string): number => {
                    if (o == null) {
                      if (row && field) {
                        const val = parseFloat(row[field]);
                        return isNaN(val) ? NaN : val;
                      }
                      return NaN;
                    }
                    if (typeof o === 'number') return o;
                    if (typeof o === 'string') return parseFloat(o);
                    if (typeof o === 'object' && 'value' in o) return parseFloat(o.value);
                    return NaN;
                  };

                  return (
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm print:text-[9px] compact-table" style={{ fontSize: '10px', tableLayout: 'auto', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr className="bg-blue-50">
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>kV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>mAs</th>
                            {measHeaders.map((header: string, i: number) => (
                              <th key={i} className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>{header}</th>
                            ))}
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Avg (X̄)</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>CoV</th>
                            <th className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row: any, i: number) => {
                            const outputs: number[] = Array.from({ length: measCount }, (_, j) => {
                              const raw = (row.outputs ?? [])[j] ?? (row.measuredOutputs ?? [])[j];
                              return getVal(raw, row, `meas${j + 1}`);
                            }).filter((n: number) => !isNaN(n) && n > 0);

                            const avg = outputs.length > 0 ? outputs.reduce((a: number, b: number) => a + b, 0) / outputs.length : null;
                            const avgDisplay = avg !== null ? avg.toFixed(4) : (row.avg || (row.average || '-'));
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
                              <tr key={i} className="text-center font-medium">
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.kv || '-'}</td>
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{row.mas || (row.mAs || '-')}</td>
                                {Array.from({ length: measCount }, (_, j) => {
                                  let val = '-';
                                  const raw = (row.outputs ?? [])[j] ?? (row.measuredOutputs ?? [])[j];
                                  if (raw != null && raw !== '') {
                                    val = (typeof raw === 'object' && 'value' in raw) ? raw.value : String(raw);
                                  } else {
                                    val = row[`meas${j + 1}`] || '-';
                                  }
                                  return (
                                    <td key={j} className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{val}</td>
                                  );
                                })}
                                <td className="border border-black p-1 text-center font-bold bg-gray-50" style={{ padding: '0px 2px', fontSize: '10px' }}>{avgDisplay}</td>
                                <td className="border border-black p-1 text-center" style={{ padding: '0px 2px', fontSize: '10px' }}>{covDisplay}</td>
                                <td className="border border-black p-1 text-center font-bold" style={{ padding: '0px 2px', fontSize: '10px' }}>
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
                  );
                })()}

                {testData.outputConsistency.tolerance && (
                  <div className="bg-gray-50 p-4 print:p-1 rounded border" style={{ padding: '2px 4px', marginTop: '4px' }}>
                    <p className="text-sm print:text-[10px]" style={{ fontSize: '11px', margin: '2px 0' }}>
                      <strong>Acceptance Criteria:</strong> CoV {testData.outputConsistency.tolerance.operator || "<="} {testData.outputConsistency.tolerance.value || "0.05"}
                    </p>
                  </div>
                )}
              </div>
            )}
            {testData.lowContrastResolution && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={detailedSeq(9)} title="Low Contrast Resolution" />
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr className="bg-blue-50">
                        <td className="border border-black p-2 print:p-1 text-left font-medium">Diameter of the smallest size hole clearly resolved on the monitor</td>
                        <td className="border border-black p-2 print:p-1 text-center font-bold">{safeVal(testData.lowContrastResolution.smallestHoleSize || "1.0")} mm</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 print:p-1 text-left font-medium">Recommended performance standard</td>
                        <td className="border border-black p-2 print:p-1 text-center">3.0 mm hole pattern must be resolved</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {testData.highContrastResolution && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={detailedSeq(10)} title="High Contrast Resolution" />
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <tbody>
                      <tr className="bg-blue-50">
                        <td className="border border-black p-2 print:p-1 text-left font-medium">Bar strips resolved on the monitor</td>
                        <td className="border border-black p-2 print:p-1 text-center font-bold">{safeVal(testData.highContrastResolution.measuredLpPerMm || "1.0")} lp/mm</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 print:p-1 text-left font-medium">Recommended performance standard</td>
                        <td className="border border-black p-2 print:p-1 text-center">1.50 lp/mm pattern must be resolved</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </ReportPage>

        {/* DETAILED TEST RESULTS — PART 5 */}
        <ReportPage>
          <div className="report-pdf-last-main" style={{ width: "100%", flex: 1 }}>
            {testData.exposureRate && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={detailedSeq(11)} title="Exposure Rate at Table Top" />
                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th className="border border-black p-1 text-center font-bold">Distance (cm)</th>
                        <th className="border border-black p-1 text-center font-bold">Applied kV/mA</th>
                        <th className="border border-black p-1 text-center font-bold">Measured Exposure (cGy/min)</th>
                        <th className="border border-black p-1 text-center font-bold">Mode</th>
                        <th className="border border-black p-1 text-center font-bold">Tolerance</th>
                        <th className="border border-black p-1 text-center font-bold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(testData.exposureRate.rows) && testData.exposureRate.rows.length > 0 ? (
                        testData.exposureRate.rows.map((row: any, i: number) => {
                          const exposure = parseFloat(row.exposure || "0");
                          const isAec = row.remark === "AEC Mode";
                          const toleranceVal = isAec
                            ? parseFloat(testData.exposureRate.aecTolerance || "10")
                            : parseFloat(testData.exposureRate.nonAecTolerance || "5");
                          const isPass = exposure <= toleranceVal;
                          return (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                              <td className="border border-black p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>{safeVal(row.distance)} cm</td>
                              <td className="border border-black p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px' }}>{safeVal(row.appliedKv)} kV / {safeVal(row.appliedMa)} mA</td>
                              <td className="border border-black p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{safeVal(row.exposure)}</td>
                              <td className="border border-black p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{row.remark || "-"}</td>
                              <td className="border border-black p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>≤ {toleranceVal} cGy/min</td>
                              <td className="border border-black p-1 font-bold" style={{ padding: '0px 1px', fontSize: '11px' }}>
                                <span className={isPass ? "text-green-600" : "text-red-600"}>
                                  {isPass ? "PASS" : "FAIL"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="text-center">
                          <td className="border border-black p-1">-</td>
                          <td className="border border-black p-1 font-semibold">Exposure Rate</td>
                          <td className="border border-black p-1">{safeVal(testData.exposureRate.measuredValue)}</td>
                          <td className="border border-black p-1">-</td>
                          <td className="border border-black p-1">≤ 5 cGy/min</td>
                          <td className="border border-black p-1 font-bold">
                            <span className={testData.exposureRate.isPass ? "text-green-600" : "text-red-600"}>
                              {testData.exposureRate.isPass ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {testData.tubeHousingLeakage && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={detailedSeq(12)} title="Tube Housing Leakage" />

                {/* Technique Factors */}
                <div className="mb-4 print:mb-1">
                  <table className="border border-black text-sm mb-4 compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th className="border border-black p-1 text-center font-bold">FDD (cm)</th>
                        <th className="border border-black p-1 text-center font-bold">Applied kV</th>
                        <th className="border border-black p-1 text-center font-bold">Applied mA</th>
                        <th className="border border-black p-1 text-center font-bold">Time (sec)</th>
                        <th className="border border-black p-1 text-center font-bold">Workload</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center font-medium">
                        <td className="border border-black p-1">{safeVal(testData.tubeHousingLeakage.fcd)}</td>
                        <td className="border border-black p-1">{safeVal(testData.tubeHousingLeakage.kv)}</td>
                        <td className="border border-black p-1">{safeVal(testData.tubeHousingLeakage.ma)}</td>
                        <td className="border border-black p-1">{safeVal(testData.tubeHousingLeakage.time)}</td>
                        <td className="border border-black p-1">{safeVal(testData.tubeHousingLeakage.workload)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                  <table className="w-full border-2 border-black text-sm print:text-[8px] compact-table" style={{ fontSize: '10px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                    <thead className="bg-gray-100">
                      <tr className="bg-blue-50">
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold">Location</th>
                        <th colSpan={5} className="border border-black p-1 text-center font-bold">Exposure Level (mR/hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold">Result (mR in 1 hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold">Result (mGy in 1 hr)</th>
                        <th rowSpan={2} className="border border-black p-1 text-center font-bold">Remarks</th>
                      </tr>
                      <tr className="bg-gray-50 text-[10px]">
                        <th className="border border-black p-1 font-bold">Left</th>
                        <th className="border border-black p-1 font-bold">Right</th>
                        <th className="border border-black p-1 font-bold">Front</th>
                        <th className="border border-black p-1 font-bold">Back</th>
                        <th className="border border-black p-1 font-bold">Top</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testData.tubeHousingLeakage.leakageMeasurements?.map((row: any, i: number) => {
                        const maValue = parseFloat(testData.tubeHousingLeakage.ma || "0");
                        const workloadValue = parseFloat(testData.tubeHousingLeakage.workload || "0");
                        const values = [row.left, row.right, row.front, row.back, row.top].map((v: any) => parseFloat(v) || 0).filter((v: number) => v > 0);
                        const rowMax = values.length > 0 ? Math.max(...values) : 0;
                        const resMR = rowMax > 0 && maValue > 0 ? (workloadValue * rowMax) / (60 * maValue) : 0;
                        const resMGy = resMR / 114;
                        const isPass = resMGy <= 1.0;
                        return (
                          <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                            <td className="border border-black p-1 font-medium" style={{ padding: '0px 2px', fontSize: '11px' }}>{safeVal(row.location)}</td>
                            <td className="border border-black p-1" style={{ padding: '0px 2px', fontSize: '11px' }}>{safeVal(row.left)}</td>
                            <td className="border border-black p-1" style={{ padding: '0px 2px', fontSize: '11px' }}>{safeVal(row.right)}</td>
                            <td className="border border-black p-1" style={{ padding: '0px 2px', fontSize: '11px' }}>{safeVal(row.front)}</td>
                            <td className="border border-black p-1" style={{ padding: '0px 2px', fontSize: '11px' }}>{safeVal(row.back)}</td>
                            <td className="border border-black p-1" style={{ padding: '0px 2px', fontSize: '11px' }}>{safeVal(row.top)}</td>
                            <td className="border border-black p-1 font-semibold" style={{ padding: '0px 2px', fontSize: '11px' }}>{resMR > 0 ? resMR.toFixed(3) : safeVal(row.max)}</td>
                            <td className="border border-black p-1 font-semibold" style={{ padding: '0px 2px', fontSize: '11px' }}>{resMGy > 0 ? resMGy.toFixed(4) : safeVal(row.mgy)}</td>
                            <td className="border border-black p-1 font-bold" style={{ padding: '0px 2px', fontSize: '11px' }}>
                              <span className={isPass ? "text-green-600" : "text-red-600"}>
                                {row.result || (resMR > 0 ? (isPass ? "Pass" : "Fail") : "-")}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Formula and Note Block */}
                <div className="mt-4 space-y-2 print:mt-1">
                  <div className="bg-gray-50 p-2 border border-dashed border-black text-center font-mono text-[9px] print:text-[8px]">
                    Max Leakage (mR in 1 hr) = (Workload × Max Exposure) / (60 × mA) | [1 mGy = 114 mR]
                  </div>
                  <div className="bg-blue-50 p-2 border-l-4 border-blue-500 rounded text-[9px] print:text-[8px] leading-tight">
                    <strong>Note:</strong> The maximum leakage radiation from the X-ray tube housing and collimator, measured at a distance of 1 meter from the focus, averaged over an area of 100 cm², shall not exceed 1.0 mGy in one hour.
                  </div>
                </div>
              </div>
            )}
          </div>
        </ReportPage>

        {/* DETAILED TEST RESULTS — PART 6 */}
        <ReportPage>
          <div className="report-pdf-last-main" style={{ width: "100%", flex: 1 }}>
            {testData.radiationProtectionSurvey && (
              <div className="mb-4 test-section">
                <TestSectionTitle num={detailedSeq(13)} title="Details of Radiation Protection Survey" />

                {/* 1. Survey Details */}
                {(testData.radiationProtectionSurvey.surveyDate || testData.radiationProtectionSurvey.hasValidCalibration) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>1. Survey Details</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold w-1/2" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Date of Radiation Protection Survey</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{testData.radiationProtectionSurvey.surveyDate ? formatDate(testData.radiationProtectionSurvey.surveyDate) : "-"}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Whether Radiation Survey Meter used for the Survey has Valid Calibration Certificate</td>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(testData.radiationProtectionSurvey.hasValidCalibration)}</td>
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
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(testData.radiationProtectionSurvey.appliedCurrent)}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Applied Voltage (kV)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(testData.radiationProtectionSurvey.appliedVoltage)}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Exposure Time(s)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(testData.radiationProtectionSurvey.exposureTime)}</td>
                          </tr>
                          <tr style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                            <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Workload (mA min/week)</td>
                            <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(testData.radiationProtectionSurvey.workload)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Measured Maximum Radiation Levels */}
                {(testData.radiationProtectionSurvey.locations?.length > 0 || (testData.radiationProtectionSurvey.surveyRows && testData.radiationProtectionSurvey.surveyRows.length > 0)) && (
                  <div className="mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                    <h4 className="text-lg font-semibold mb-4 print:mb-1 print:text-xs" style={{ marginBottom: '4px', fontSize: '10px' }}>3. Measured Maximum Radiation Levels (mR/hr) at different Locations</h4>
                    <div className="overflow-x-auto mb-6 print:mb-1" style={{ marginBottom: '4px' }}>
                      <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>Location</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Max. Radiation Level</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>mR/week</th>
                            <th className="border border-black p-3 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000', textAlign: 'center' }}>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(testData.radiationProtectionSurvey.locations || testData.radiationProtectionSurvey.surveyRows || []).map((loc: any, i: number) => (
                            <tr key={i} className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 text-left" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{safeVal(loc.location)}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerHr != null ? `${safeVal(loc.mRPerHr)} mR/hr` : safeVal(loc.exposureRate)}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{loc.mRPerWeek != null ? `${safeVal(loc.mRPerWeek)} mR/week` : "-"}</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={safeVal(loc.result) === "PASS" || safeVal(loc.result) === "Pass" ? "text-green-600 font-semibold" : safeVal(loc.result) === "FAIL" || safeVal(loc.result) === "Fail" ? "text-red-600 font-semibold" : ""}>
                                  {safeVal(loc.result || loc.remarks)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </ReportPage>

        {/* DETAILED TEST RESULTS — PART 7 */}
        <ReportPage>
          <div className="report-pdf-last-main" style={{ width: "100%", flex: 1 }}>
            {testData.radiationProtectionSurvey && (
              <div className="mb-4 test-section">
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
                  const workerLocs = (testData.radiationProtectionSurvey.locations || []).filter((loc: any) => loc.category === "worker");
                  const publicLocs = (testData.radiationProtectionSurvey.locations || []).filter((loc: any) => loc.category === "public");
                  const maxWorkerWeekly = workerLocs.length ? Math.max(...workerLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3) : "0.000";
                  const maxPublicWeekly = publicLocs.length ? Math.max(...publicLocs.map((r: any) => parseFloat(r.mRPerWeek) || 0), 0).toFixed(3) : "0.000";
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
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxWorkerWeekly} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={workerResult === "Pass" ? "text-green-600 font-semibold" : workerResult === "Fail" ? "text-red-600 font-semibold" : ""}>{workerResult || "-"}</span>
                              </td>
                            </tr>
                            <tr className="text-center" style={{ height: 'auto', minHeight: '0', lineHeight: '1.0', padding: '0', margin: '0' }}>
                              <td className="border border-black p-3 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>For Public</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>{maxPublicWeekly} mR/week</td>
                              <td className="border border-black p-3 print:p-1" style={{ padding: '0px 1px', fontSize: '11px', lineHeight: '1.0', minHeight: '0', height: 'auto', borderColor: '#000000' }}>
                                <span className={publicResult === "Pass" ? "text-green-600 font-semibold" : publicResult === "Fail" ? "text-red-600 font-semibold" : ""}>{publicResult || "-"}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Fallback when no locations */}
                {(!testData.radiationProtectionSurvey.locations || testData.radiationProtectionSurvey.locations.length === 0) && (!testData.radiationProtectionSurvey.surveyRows || testData.radiationProtectionSurvey.surveyRows.length === 0) && (
                  <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                    <table className="w-full border-2 border-black text-sm compact-table" style={{ fontSize: '11px' }}>
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Parameter</th>
                          <th className="border border-black p-2 print:p-1 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Result</th>
                          <th className="border border-black p-2 print:p-1 bg-green-100 text-center" style={{ padding: '0px 1px', fontSize: '11px' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-center">
                          <td className="border border-black p-2 print:p-1 font-semibold" style={{ padding: '0px 1px', fontSize: '11px' }}>Radiation Protection Survey</td>
                          <td className="border border-black p-2 print:p-1" style={{ padding: '0px 1px', fontSize: '11px' }}>{testData.radiationProtectionSurvey.result || testData.radiationProtectionSurvey.remarks || "Complies with AERB limits"}</td>
                          <td className="border border-black p-2 print:p-1 font-bold text-green-600" style={{ padding: '0px 1px', fontSize: '11px' }}>PASS</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {Object.values(testData).every((v) => !v) && (
              <p className="text-center text-gray-500" style={{ marginTop: "32px", fontSize: "14px" }}>
                No detailed test results available for this report.
              </p>
            )}
          </div>
        </ReportPage>

        <ReportPage isLast>
          <div className="report-pdf-last-main" style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
            <ReportPdfPageDeclaration
              todayDate={todayDate}
              customerCity={placeValue}
              qrCode={report.qrCode}
              engineerName={report.engineerNameRPId}
              authorizedSignatoryName={report.authorizedSignatoryName}
              authorizedSignatorySignature={report.authorizedSignatorySignature}
            />
          </div>
        </ReportPage>

        <style>{`
        .fixed-report-pdf {
          font-family: "Times New Roman", Times, serif;
          color: #000;
          font-size: 11px;
          line-height: 1.3;
        }
        .fixed-report-pdf h1,
        .fixed-report-pdf h2,
        .fixed-report-pdf h3,
        .fixed-report-pdf h4 {
          font-family: "Times New Roman", Times, serif;
          font-weight: 700;
          color: #000;
        }
        .fixed-report-pdf table {
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          border-width: 0.1px !important;
          border-style: solid !important;
          border-color: #666 !important;
          text-align: center !important;
          width: 100%;
        }
        .fixed-report-pdf td,
        .fixed-report-pdf th {
          border-width: 0.1px !important;
          border-style: solid !important;
          border-color: #666 !important;
          box-sizing: border-box !important;
          vertical-align: middle !important;
          text-align: center !important;
          padding-top: 8px !important;
          padding-bottom: 8px !important;
          padding-left: 2px !important;
          padding-right: 2px !important;
          line-height: 1.1 !important;
        }
        .is-generating-pdf td,
        .is-generating-pdf th {
          padding-top: 4px !important;
          padding-bottom: 12px !important;
        }
        .fixed-report-pdf .report-pdf-page-shell,
        .fixed-report-pdf .report-pdf-last-page-shell {
          display: flex !important;
          flex-direction: column !important;
          min-height: 297mm !important;
          height: auto !important;
          box-sizing: border-box !important;
          background: white !important;
        }
        .fixed-report-pdf .report-pdf-last-main {
          flex: 1 1 auto !important;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          @page { margin: 0; size: A4; }
          .fixed-report-pdf { width: 210mm; margin: 0 auto; }
          .fixed-report-pdf .report-pdf-page-shell,
          .fixed-report-pdf .report-pdf-last-page-shell {
             margin: 0 !important;
             box-shadow: none !important;
             page-break-after: always !important;
          }
        }
      `}</style>
      </div>
    </>
  );
};

export default ViewServiceReportFixedRadioFluro;