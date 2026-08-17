import { useEffect } from "react";
import { generatePDF } from "../../../../../../utils/generatePDF";

export interface EmbeddedViewReportPdfProps {
  serviceIdProp?: string;
  embedded?: boolean;
  refreshKey?: number;
  onReportLoaded?: () => void;
  autoSavePdfToken?: number;
  onPdfSaveComplete?: (result: { success: boolean; error?: string }) => void;
  saveReportPdf?: (serviceId: string, reportPdfBase64: string) => Promise<unknown>;
  pdfFilenamePrefix?: string;
}

export const getEmbeddedReportContentId = (embedded?: boolean) =>
  embedded ? "report-content-embed" : "report-content";

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read PDF blob"));
        return;
      }
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(new Error("Failed to read PDF blob"));
    reader.readAsDataURL(blob);
  });

export function useEmbeddedReportPdfAutoSave(options: {
  embedded?: boolean;
  autoSavePdfToken?: number;
  serviceId?: string | null;
  report: { testReportNumber?: string } | null;
  loading: boolean;
  isRefreshing: boolean;
  reportContentId: string;
  pdfFilenamePrefix: string;
  saveReportPdf?: (serviceId: string, reportPdfBase64: string) => Promise<unknown>;
  onPdfSaveComplete?: (result: { success: boolean; error?: string }) => void;
}) {
  const {
    embedded,
    autoSavePdfToken,
    serviceId,
    report,
    loading,
    isRefreshing,
    reportContentId,
    pdfFilenamePrefix,
    saveReportPdf,
    onPdfSaveComplete,
  } = options;

  useEffect(() => {
    if (!embedded || !autoSavePdfToken || !serviceId || !report || loading || isRefreshing || !saveReportPdf) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;

      try {
        const filename = `${pdfFilenamePrefix}-Report-${report.testReportNumber || "report"}.pdf`;
        const pdfBlob = await generatePDF({
          elementId: reportContentId,
          filename,
          skipDownload: true,
          scale: 1,
          captureOffScreen: true,
          buttonSelector: ".download-pdf-btn-hidden",
        });

        if (!pdfBlob) {
          throw new Error("PDF generation returned empty result");
        }

        const reportPdfBase64 = await blobToBase64(pdfBlob);
        await saveReportPdf(serviceId, reportPdfBase64);

        if (!cancelled) {
          onPdfSaveComplete?.({ success: true });
        }
      } catch (error: any) {
        if (!cancelled) {
          onPdfSaveComplete?.({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to save PDF",
          });
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    embedded,
    autoSavePdfToken,
    serviceId,
    report,
    loading,
    isRefreshing,
    reportContentId,
    pdfFilenamePrefix,
    saveReportPdf,
    onPdfSaveComplete,
  ]);
}

export async function saveGeneratedReportPdfToDb(options: {
  serviceId: string;
  reportContentId: string;
  testReportNumber?: string;
  pdfFilenamePrefix: string;
  saveReportPdf: (serviceId: string, reportPdfBase64: string) => Promise<unknown>;
}) {
  const { serviceId, reportContentId, testReportNumber, pdfFilenamePrefix, saveReportPdf } = options;
  const filename = `${pdfFilenamePrefix}-Report-${testReportNumber || "report"}.pdf`;
  const pdfBlob = await generatePDF({
    elementId: reportContentId,
    filename,
    buttonSelector: ".download-pdf-btn",
  });

  if (!pdfBlob) return;

  const reportPdfBase64 = await blobToBase64(pdfBlob);
  await saveReportPdf(serviceId, reportPdfBase64);
}
