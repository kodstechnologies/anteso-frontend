import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Optimized PDF generation utility
 * Based on k2k-iot-frontend implementation with improved file size optimization
 */

interface GeneratePDFOptions {
  elementId: string;
  filename: string;
  buttonSelector?: string;
  onProgress?: (message: string) => void;
}

/**
 * Generate PDF from HTML element with optimized settings
 * Features:
 * - Optimized file size (scale: 1.5, JPEG quality: 0.85)
 * - Prevents table breaks
 * - Proper alignment handling
 * - Button state management
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

  updateButton('Generating PDF...', true);

  try {
    // Wait a bit to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      scale: 1.5, // Optimized for smaller file size while maintaining quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      removeContainer: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Remove all padding and margins from parent containers
          clonedElement.style.width = '210mm';
          clonedElement.style.maxWidth = 'none';
          clonedElement.style.margin = '0';
          clonedElement.style.padding = '20px';
          
          // Fix nested containers
          const nestedContainers = clonedElement.querySelectorAll('div');
          nestedContainers.forEach((div) => {
            const htmlDiv = div as HTMLElement;
            // Remove max-width constraints that cause issues
            if (htmlDiv.style.maxWidth || htmlDiv.classList.contains('max-w-5xl') || htmlDiv.classList.contains('max-w-7xl')) {
              htmlDiv.style.maxWidth = 'none';
              htmlDiv.style.width = '100%';
            }
            // Remove excessive padding that causes misalignment
            if (htmlDiv.classList.contains('p-8') || htmlDiv.classList.contains('p-10')) {
              htmlDiv.style.padding = '20px';
            }
          });

          // Fix tables - prevent breaks and ensure proper alignment
          const tables = clonedElement.querySelectorAll('table');
          tables.forEach((table) => {
            const htmlTable = table as HTMLElement;
            htmlTable.style.breakInside = 'avoid';
            htmlTable.style.width = '100%';
            htmlTable.style.borderCollapse = 'collapse';
            htmlTable.style.tableLayout = 'auto';
            
            // Ensure table cells don't break and align properly
            const cells = table.querySelectorAll('td, th');
            cells.forEach((cell) => {
              const htmlCell = cell as HTMLElement;
              htmlCell.style.breakInside = 'avoid';
              htmlCell.style.wordWrap = 'break-word';
              htmlCell.style.overflowWrap = 'break-word';
              htmlCell.style.verticalAlign = 'top';
            });
          });

          // Fix sections to prevent breaks
          const sections = clonedElement.querySelectorAll('section, div.mb-6, div.mb-8');
          sections.forEach((section) => {
            (section as HTMLElement).style.breakInside = 'avoid';
          });

          // Hide print buttons and other UI elements
          const buttons = clonedElement.querySelectorAll('button, .print\\:hidden');
          buttons.forEach((btn) => {
            (btn as HTMLElement).style.display = 'none';
          });
        }
      }
    });

    // Convert to JPEG with compression for much smaller file size
    const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG at 85% quality - good balance
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
    updateButton(originalButtonText, false);
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Failed to generate PDF. Please try again.');
    updateButton(originalButtonText, false);
    throw error;
  }
};

/**
 * Generate PDF and return as Blob (useful for uploading)
 */
export const generatePDFAsBlob = async ({
  elementId,
  filename,
  buttonSelector = '.download-pdf-btn',
  onProgress
}: GeneratePDFOptions): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

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

  updateButton('Generating PDF...', true);

  try {
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      removeContainer: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.style.width = '210mm';
          clonedElement.style.maxWidth = 'none';
          clonedElement.style.margin = '0';
          clonedElement.style.padding = '20px';
          
          const nestedContainers = clonedElement.querySelectorAll('div');
          nestedContainers.forEach((div) => {
            const htmlDiv = div as HTMLElement;
            if (htmlDiv.style.maxWidth || htmlDiv.classList.contains('max-w-5xl') || htmlDiv.classList.contains('max-w-7xl')) {
              htmlDiv.style.maxWidth = 'none';
              htmlDiv.style.width = '100%';
            }
            if (htmlDiv.classList.contains('p-8') || htmlDiv.classList.contains('p-10')) {
              htmlDiv.style.padding = '20px';
            }
          });

          const tables = clonedElement.querySelectorAll('table');
          tables.forEach((table) => {
            const htmlTable = table as HTMLElement;
            htmlTable.style.breakInside = 'avoid';
            htmlTable.style.width = '100%';
            htmlTable.style.borderCollapse = 'collapse';
            htmlTable.style.tableLayout = 'auto';
            
            const cells = table.querySelectorAll('td, th');
            cells.forEach((cell) => {
              const htmlCell = cell as HTMLElement;
              htmlCell.style.breakInside = 'avoid';
              htmlCell.style.wordWrap = 'break-word';
              htmlCell.style.overflowWrap = 'break-word';
              htmlCell.style.verticalAlign = 'top';
            });
          });

          const sections = clonedElement.querySelectorAll('section, div.mb-6, div.mb-8');
          sections.forEach((section) => {
            (section as HTMLElement).style.breakInside = 'avoid';
          });

          const buttons = clonedElement.querySelectorAll('button, .print\\:hidden');
          buttons.forEach((btn) => {
            (btn as HTMLElement).style.display = 'none';
          });
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const blob = pdf.output('blob');
    updateButton(originalButtonText, false);
    return blob;
  } catch (error) {
    console.error('PDF generation error:', error);
    updateButton(originalButtonText, false);
    throw error;
  }
};

/**
 * Simple PDF generation function (similar to k2k-iot-frontend style)
 * Usage: generateAndOpenPDF('report-content', 'report.pdf')
 */
export const generateAndOpenPDF = async (
  elementId: string,
  filename: string = 'document.pdf'
): Promise<void> => {
  return generatePDF({
    elementId,
    filename,
  });
};



