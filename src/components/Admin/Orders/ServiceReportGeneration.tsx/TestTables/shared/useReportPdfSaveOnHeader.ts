import React from "react";

export type PdfSaveResult = { success: boolean; error?: string };

export function useReportPdfSaveOnHeader() {
  const [reportPreviewRefreshKey, setReportPreviewRefreshKey] = React.useState(0);
  const [autoSavePdfToken, setAutoSavePdfToken] = React.useState(0);
  const [pdfCaptureActive, setPdfCaptureActive] = React.useState(false);
  const reportPreviewLoadRef = React.useRef<{
    resolve?: () => void;
    reject?: (err: Error) => void;
  }>({});
  const pdfSaveCompleteRef = React.useRef<((result: PdfSaveResult) => void) | null>(null);

  const refreshReportPreview = (): Promise<void> =>
    new Promise((resolve, reject) => {
      reportPreviewLoadRef.current = { resolve, reject };
      setReportPreviewRefreshKey((prev) => prev + 1);
      setTimeout(() => {
        if (reportPreviewLoadRef.current.reject) {
          reportPreviewLoadRef.current.reject(new Error("Report preview refresh timed out"));
          reportPreviewLoadRef.current = {};
        }
      }, 30000);
    });

  const waitForPdfSave = (): Promise<PdfSaveResult> =>
    new Promise((resolve, reject) => {
      pdfSaveCompleteRef.current = resolve;
      setTimeout(() => {
        reject(new Error("PDF save timed out after 3 minutes"));
      }, 180000);
    });

  const saveReportPdfAfterHeader = async (): Promise<void> => {
    try {
      setPdfCaptureActive(true);
      const pdfSavePromise = waitForPdfSave();
      await refreshReportPreview();
      setAutoSavePdfToken((prev) => prev + 1);
      await pdfSavePromise;
    } catch (pdfErr) {
      console.error("Failed to save report PDF after saving header:", pdfErr);
    } finally {
      setPdfCaptureActive(false);
    }
  };

  const onReportLoaded = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        reportPreviewLoadRef.current.resolve?.();
        reportPreviewLoadRef.current = {};
      });
    });
  };

  const onPdfSaveComplete = (result: PdfSaveResult) => {
    pdfSaveCompleteRef.current?.(result);
    pdfSaveCompleteRef.current = null;
  };

  return {
    reportPreviewRefreshKey,
    autoSavePdfToken,
    pdfCaptureActive,
    saveReportPdfAfterHeader,
    onReportLoaded,
    onPdfSaveComplete,
  };
}
