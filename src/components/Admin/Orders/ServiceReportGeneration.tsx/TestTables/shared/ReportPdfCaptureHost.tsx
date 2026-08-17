import React from "react";

type ReportPdfCaptureHostProps = {
  active: boolean;
  serviceId: string;
  refreshKey: number;
  autoSavePdfToken: number;
  onReportLoaded: () => void;
  onPdfSaveComplete: (result: { success: boolean; error?: string }) => void;
  ViewComponent: React.ComponentType<{
    serviceIdProp?: string;
    embedded?: boolean;
    refreshKey?: number;
    onReportLoaded?: () => void;
    autoSavePdfToken?: number;
    onPdfSaveComplete?: (result: { success: boolean; error?: string }) => void;
    saveReportPdf?: (serviceId: string, reportPdfBase64: string) => Promise<unknown>;
    pdfFilenamePrefix?: string;
  }>;
  saveReportPdf: (serviceId: string, reportPdfBase64: string) => Promise<unknown>;
  pdfFilenamePrefix: string;
};

const ReportPdfCaptureHost: React.FC<ReportPdfCaptureHostProps> = ({
  active,
  serviceId,
  refreshKey,
  autoSavePdfToken,
  onReportLoaded,
  onPdfSaveComplete,
  ViewComponent,
  saveReportPdf,
  pdfFilenamePrefix,
}) => {
  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: "210mm",
        pointerEvents: "none",
        opacity: 0,
        overflow: "hidden",
        zIndex: -1,
      }}
    >
      <ViewComponent
        serviceIdProp={serviceId}
        embedded
        refreshKey={refreshKey}
        autoSavePdfToken={autoSavePdfToken}
        onReportLoaded={onReportLoaded}
        onPdfSaveComplete={onPdfSaveComplete}
        saveReportPdf={saveReportPdf}
        pdfFilenamePrefix={pdfFilenamePrefix}
      />
    </div>
  );
};

export default ReportPdfCaptureHost;
