import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface GeneratePDFOptions {
  elementId: string;
  filename: string;
  buttonSelector?: string;
  onProgress?: (message: string) => void;
}

/**
 * Generate PDF from HTML element with fixed alignment and multi-page support.
 * Captures each A4 page shell individually for perfect alignment, with fallback for standard elements.
 */
export const generatePDF = async ({
  elementId,
  filename,
  buttonSelector = '.download-pdf-btn',
  onProgress
}: GeneratePDFOptions): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  // Find the button to show loading state
  const btn = document.querySelector(buttonSelector) as HTMLButtonElement;
  const originalButtonText = btn?.textContent || 'Download PDF';

  const updateButton = (text: string, disabled: boolean = false) => {
    if (btn) {
      btn.textContent = text;
      btn.disabled = disabled;
    }
    if (onProgress) {
      onProgress(text);
    }
  };

  try {
    updateButton('Preparing Report...', true);

    // Detect if the report uses the shell-based pagination system
    const shells = element.querySelectorAll('.report-pdf-page-shell, .report-pdf-last-page-shell');

    // COMMON HELPER: Fixes tables and images in cloned elements for better canvas output
    const prepareClonedElement = (clonedElement: HTMLElement) => {
      // Fix tables to ensure they don't look broken in canvas
      const tables = clonedElement.querySelectorAll('table');
      tables.forEach((table) => {
        const tableEl = table as HTMLElement;
        tableEl.style.width = '100%';
        tableEl.style.borderCollapse = 'collapse';
        const cells = tableEl.querySelectorAll('th, td');
        cells.forEach((cell) => {
          const cellEl = cell as HTMLElement;
          cellEl.style.border = '0.5px solid #000';
        });
      });

      // Ensure images are fully visible
      const images = clonedElement.querySelectorAll('img');
      images.forEach((img) => {
        (img as HTMLElement).style.maxWidth = '100%';
      });

      // Hide things that shouldn't be in the PDF
      const hideElements = clonedElement.querySelectorAll('.print\\:hidden, button');
      hideElements.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
    };

    if (shells.length > 0) {
      /**
       * SHELL-BASED PAGINATION (NEW / PREFERRED)
       * Captures each page shell individually to guarantee 1:1 matching with the Web UI.
       */
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;

      for (let i = 0; i < shells.length; i++) {
        const shell = shells[i] as HTMLElement;
        updateButton(`Generating Page ${i + 1} of ${shells.length}...`, true);

        const canvas = await html2canvas(shell, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          onclone: (clonedDoc: Document) => {
            // Find the shell in the cloned document
            // html2canvas clones the WHOLE document, then looks for the element.
            // But we passed 'shell' (the specific element).
            // Actually, html2canvas (clonedDoc) logic is slightly tricky when passing an element.
            // It clones the whole document and finds the element in the clone.
            // Since we might have multiple shells, we find the one at the same index.
            const clonedShells = clonedDoc.querySelectorAll('.report-pdf-page-shell, .report-pdf-last-page-shell');
            const clonedShell = clonedShells[i] as HTMLElement;
            if (clonedShell) {
              clonedShell.classList.add('is-generating-pdf');
              clonedShell.style.margin = '0';
              clonedShell.style.boxShadow = 'none';
              clonedShell.style.width = '210mm';
              clonedShell.style.height = '297mm';
              clonedShell.style.minHeight = '297mm';
              clonedShell.style.maxHeight = '297mm';
              clonedShell.style.overflow = 'hidden';
              prepareClonedElement(clonedShell);
            }
          }
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) pdf.addPage();

        // Add the image. If the shell somehow exceeds one page (e.g. data overflow), 
        // we center it or let it spill (most shells are exactly A4).
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      }

      pdf.save(filename);
    } else {
      /**
       * FALLBACK: CONTINUOUS CAPTURE (OLD)
       * Captures the entire element and slices it mathematically into A4 pages.
       */
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        onclone: (clonedDoc: Document) => {
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            clonedElement.classList.add('is-generating-pdf');
            clonedElement.style.width = '210mm';
            clonedElement.style.margin = '0';
            clonedElement.style.padding = '0';
            prepareClonedElement(clonedElement);
          }
        }
      });

      updateButton('Generating File...', true);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
    }

    updateButton(originalButtonText, false);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    updateButton(originalButtonText, false);
    throw error;
  }
};

/**
 * Estimates the number of A4 pages for a given element.
 */
export const estimateReportPages = (elementId: string): number => {
  const element = document.getElementById(elementId);
  if (!element) return 1;
  const A4_HEIGHT_PX = 1120;
  const shells = element.querySelectorAll('.report-pdf-page-shell, .report-pdf-last-page-shell');
  if (shells.length > 0) {
    let total = 0;
    shells.forEach(shell => {
      const h = (shell as HTMLElement).offsetHeight;
      total += Math.max(1, Math.ceil(h / A4_HEIGHT_PX));
    });
    return total;
  }
  const totalHeight = element.offsetHeight;
  return Math.max(1, Math.ceil(totalHeight / A4_HEIGHT_PX));
};