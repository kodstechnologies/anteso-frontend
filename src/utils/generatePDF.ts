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
 * Captures the element using html2canvas and converts it to a professional PDF.
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

    // Give a small delay to ensure any dynamic content is settled
    await new Promise(resolve => setTimeout(resolve, 300));

    // Capture the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      onclone: (clonedDoc: Document) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Force layout for PDF generation
          clonedElement.style.width = '210mm';
          clonedElement.style.margin = '0';
          clonedElement.style.padding = '0';
          clonedElement.style.backgroundColor = '#ffffff';

          // Ensure all page shells have correct dimensions and spacing
          const pages = clonedElement.querySelectorAll('.report-pdf-page-shell, .report-pdf-last-page-shell');
          pages.forEach((page) => {
            const pageEl = page as HTMLElement;
            pageEl.style.width = '210mm';
            pageEl.style.minHeight = '297mm'; // A4 Height
            pageEl.style.boxSizing = 'border-box';
            pageEl.style.padding = '15mm'; // Standard margins
            pageEl.style.margin = '0';
            pageEl.style.display = 'flex';
            pageEl.style.flexDirection = 'column';
          });

          // Fix tables to ensure they don't look broken in canvas
const tables = clonedElement.querySelectorAll('table');

tables.forEach((table) => {
  const tableEl = table as HTMLElement;

  tableEl.style.width = '100%';
  tableEl.style.borderCollapse = 'collapse';

  const cells = tableEl.querySelectorAll('th, td');

  cells.forEach((cell) => {
    const cellEl = cell as HTMLElement;

    // ✅ BORDER FIX
    cellEl.style.border = '0.5px solid #000';

    // ❌ REMOVE THIS
    // cellEl.style.height = "100px !important";

    // ✅ HEIGHT FIX
    cellEl.style.height = 'auto';
    cellEl.style.minHeight = '40px';

    // ✅ PADDING
    cellEl.style.padding = '0';

    // ✅ WRAP CONTENT WITH GRID
    const wrapper = document.createElement('div');
    wrapper.style.display = 'grid';
    wrapper.style.alignItems = 'center';     // vertical center
    wrapper.style.justifyItems = 'center';   // horizontal center
    wrapper.style.height = '100%';
    wrapper.style.padding = '6px 10px';

    // move existing content inside wrapper
    while (cellEl.firstChild) {
      wrapper.appendChild(cellEl.firstChild);
    }

    cellEl.appendChild(wrapper);
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
        }
      }
    });

    updateButton('Generating PDF...', true);

    // Initialize jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png'); // Using PNG for better quality (less artifacting on text)

    // A4 dimensions in mm
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Add subsequent pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(filename);

    updateButton(originalButtonText, false);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    updateButton(originalButtonText, false);
    throw error;
  }
};

/**
 * Estimates the number of A4 pages for a given element.
 * Used by various reports to display total page count in headers.
 */
export const estimateReportPages = (elementId: string): number => {
  const element = document.getElementById(elementId);
  if (!element) return 1;

  // A4 height at 96 DPI is approximately 1122.5px.
  // We use 1120px to account for slight browser variations and margins.
  const A4_HEIGHT_PX = 1120;

  // Most reports use fixed-height shells for pages (.report-pdf-page-shell)
  const shells = element.querySelectorAll('.report-pdf-page-shell, .report-pdf-last-page-shell');

  if (shells.length > 0) {
    let total = 0;
    shells.forEach(shell => {
      const h = (shell as HTMLElement).offsetHeight;
      // If a shell is significantly larger than one A4 page, count it as multiple pages
      total += Math.max(1, Math.ceil(h / A4_HEIGHT_PX));
    });
    return total;
  }

  // Fallback for reports without explicit shells: estimate based on total height
  const totalHeight = element.offsetHeight;
  return Math.max(1, Math.ceil(totalHeight / A4_HEIGHT_PX));
};