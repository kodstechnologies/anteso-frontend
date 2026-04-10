import html2pdf from 'html2pdf.js';

export interface GeneratePDFOptions {
  elementId: string;
  filename: string;
  buttonSelector?: string;
  onProgress?: (message: string) => void;
}

/**
 * Applies hairline border fix to all tables/cells in a cloned element.
 * Must run for BOTH preserveFixedReportLayout=true and false.
 */
function applyHairlineBorders(root: HTMLElement): void {
  // Fix all tables
  const tables = root.querySelectorAll('table');
  tables.forEach((table) => {
    const htmlTable = table as HTMLElement;
    htmlTable.style.borderCollapse = 'collapse';
    htmlTable.style.borderSpacing = '0';
    htmlTable.style.border = '1px solid #000';
    htmlTable.style.width = '100%';
    htmlTable.style.maxWidth = '100%';
    htmlTable.style.tableLayout = 'fixed';
    htmlTable.style.boxSizing = 'border-box';

    const isCompact = htmlTable.classList.contains('compact-table');
    const headerCells = table.querySelectorAll('thead th, thead td');
    const columnCount = headerCells.length || table.querySelectorAll('tr:first-child td').length;

    // Font sizing by column count
    if (isCompact) {
      htmlTable.style.fontSize = '11px';
    } else if (columnCount >= 7) {
      htmlTable.style.fontSize = '10px';
    } else if (columnCount >= 5) {
      htmlTable.style.fontSize = '11px';
    } else {
      htmlTable.style.fontSize = '12px';
    }

    // Fix rows
    table.querySelectorAll('tr').forEach((row) => {
      const htmlRow = row as HTMLElement;
      htmlRow.style.setProperty('background-color', 'transparent', 'important');
      htmlRow.style.setProperty('background', 'transparent', 'important');
      if (isCompact) {
        htmlRow.style.height = 'auto';
        htmlRow.style.minHeight = '0';
        htmlRow.style.lineHeight = '1.1';
        htmlRow.style.padding = '0';
        htmlRow.style.margin = '0';
      }
    });

    // Fix cells
    table.querySelectorAll('td, th').forEach((cell) => {
      const htmlCell = cell as HTMLElement;
      // THE KEY FIX: force 1px border on every cell, no exceptions
      htmlCell.style.border = '1px solid #000';
      htmlCell.style.boxSizing = 'border-box';
      htmlCell.style.verticalAlign = 'middle';
      htmlCell.style.borderRadius = '0';
      htmlCell.style.wordWrap = 'break-word';
      htmlCell.style.overflowWrap = 'break-word';
      htmlCell.style.whiteSpace = 'normal';
      htmlCell.style.overflow = 'hidden';
      htmlCell.style.minWidth = '0';
      htmlCell.style.maxWidth = '100%';
      htmlCell.style.fontWeight = '400';
      htmlCell.style.minHeight = '0';
      htmlCell.style.maxHeight = 'none';

      if (table.closest('.test-section') || isCompact) {
        htmlCell.style.textAlign = 'center';
      }

      // Padding
      if (isCompact) {
        htmlCell.style.padding = '1px 2px';
        htmlCell.style.lineHeight = '1.1';
        htmlCell.style.height = 'auto';
        htmlCell.style.fontSize = '11px';
      } else if (columnCount >= 7) {
        htmlCell.style.padding = '1px 1px';
        htmlCell.style.lineHeight = '1.1';
      } else if (columnCount >= 5) {
        htmlCell.style.padding = '1px 2px';
        htmlCell.style.lineHeight = '1.1';
      } else {
        htmlCell.style.padding = '2px 4px';
        htmlCell.style.lineHeight = '1.2';
      }

      // Remove white/gray backgrounds (keep text visible)
      htmlCell.classList.remove('bg-white', 'bg-gray-50');
      htmlCell.style.setProperty('background-color', 'transparent', 'important');
      htmlCell.style.setProperty('background', 'transparent', 'important');

      // Ensure text is black
      const textColor = window.getComputedStyle(htmlCell).color;
      if (!textColor || textColor === 'transparent' || textColor === 'rgba(0, 0, 0, 0)') {
        htmlCell.style.setProperty('color', '#000000', 'important');
      }

      // Fix nested spans
      htmlCell.querySelectorAll('span, div').forEach((span) => {
        const spanEl = span as HTMLElement;
        spanEl.classList.remove('bg-white', 'bg-gray-50');
        spanEl.style.borderRadius = '0';
        spanEl.style.display = 'inline';
        const spanBg = window.getComputedStyle(spanEl).backgroundColor;
        if (spanBg === 'white' || spanBg === 'rgb(255, 255, 255)' || spanBg === 'rgba(255, 255, 255, 1)' ||
          spanBg === 'rgb(249, 250, 251)' || spanBg === 'rgba(249, 250, 251, 1)') {
          spanEl.style.setProperty('background-color', 'transparent', 'important');
          spanEl.style.setProperty('background', 'transparent', 'important');
        }
      });
    });

    // Even column widths for fixed layout
    if (columnCount > 0) {
      const pct = `${(100 / columnCount).toFixed(2)}%`;
      table.querySelectorAll('tr:first-child td, tr:first-child th, thead th').forEach((cell) => {
        const htmlCell = cell as HTMLElement;
        if (!htmlCell.style.width || htmlCell.style.width === '') {
          htmlCell.style.width = pct;
        }
        htmlCell.style.minWidth = '0';
      });
    }

    // Ensure parent doesn't overflow
    const tableParent = htmlTable.parentElement;
    if (tableParent) {
      (tableParent as HTMLElement).style.width = '100%';
      (tableParent as HTMLElement).style.maxWidth = '100%';
      (tableParent as HTMLElement).style.overflow = 'hidden';
      (tableParent as HTMLElement).style.boxSizing = 'border-box';
    }
  });
}

function buildOnClone(elementId: string, contentWidthPx: number) {
  return (clonedDoc: Document) => {
    const clonedElement = clonedDoc.getElementById(elementId);
    if (!clonedElement) return;

    const preserveFixedReportLayout = clonedElement.classList.contains('fixed-report-pdf');

    clonedElement.style.width = `${contentWidthPx}px`;
    clonedElement.style.maxWidth = `${contentWidthPx}px`;
    clonedElement.style.margin = '0';
    clonedElement.style.padding = '0';
    clonedElement.style.boxSizing = 'border-box';
    clonedElement.style.overflow = 'hidden';

    // Hide buttons and fixed UI elements
    clonedElement.querySelectorAll('button, .print\\:hidden').forEach((btn) => {
      (btn as HTMLElement).style.display = 'none';
    });
    clonedElement.querySelectorAll('[class*="fixed"]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    // For fixed report layout, preserve component-defined table spacing/styles
    // to avoid header/value overlap from aggressive clone-time compaction.
    if (preserveFixedReportLayout) {
      return;
    }

    // For non-fixed-report layouts, normalize table rendering.
    applyHairlineBorders(clonedElement);

    // Additional layout fixes for non-fixed-report layouts
    clonedElement.querySelectorAll('*').forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.classList.contains('p-10')) htmlEl.style.padding = '0';
      else if (htmlEl.classList.contains('px-4') || htmlEl.classList.contains('py-4')) htmlEl.style.padding = '0';
      if (htmlEl.classList.contains('mt-20') || htmlEl.classList.contains('mt-16') || htmlEl.classList.contains('mt-12')) htmlEl.style.marginTop = '16px';
      if (htmlEl.classList.contains('mb-20') || htmlEl.classList.contains('mb-16') || htmlEl.classList.contains('mb-12')) htmlEl.style.marginBottom = '16px';
      if (htmlEl.classList.contains('min-h-screen')) htmlEl.style.minHeight = 'auto';
      if (htmlEl.classList.contains('mx-auto')) { htmlEl.style.marginLeft = '0'; htmlEl.style.marginRight = '0'; }
      if (htmlEl.classList.contains('max-w-5xl') || htmlEl.classList.contains('max-w-7xl') || htmlEl.classList.contains('max-w-6xl')) {
        htmlEl.style.maxWidth = '100%'; htmlEl.style.width = '100%';
      }
      if (htmlEl.tagName === 'SECTION' || htmlEl.classList.contains('section')) {
        htmlEl.style.maxWidth = '100%'; htmlEl.style.width = '100%'; htmlEl.style.boxSizing = 'border-box';
      }
    });

    clonedElement.querySelectorAll('.overflow-x-auto, [class*="overflow"]').forEach((container) => {
      const c = container as HTMLElement;
      c.style.overflowX = 'hidden'; c.style.overflow = 'hidden';
      c.style.width = '100%'; c.style.maxWidth = '100%';
      c.style.padding = '0'; c.style.boxSizing = 'border-box';
    });
  };
}

const PDF_OPT_BASE = {
  image: { type: 'jpeg' as const, quality: 0.98 },
  jsPDF: {
    unit: 'mm' as const,
    format: 'a4',
    orientation: 'portrait' as const,
    margin: [10, 10, 10, 10],
  },
  pagebreak: {
    mode: ['avoid-all', 'css', 'legacy'],
    before: '.page-break-before',
    after: '.page-break-after',
    avoid: ['table', 'tr', 'section', '.test-section'],
  },
};

export const generatePDF = async ({
  elementId,
  filename,
  buttonSelector = '.download-pdf-btn',
  onProgress,
}: GeneratePDFOptions): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) { console.error(`Element with id "${elementId}" not found`); return; }

  const btn = document.querySelector(buttonSelector) as HTMLButtonElement;
  const originalButtonText = btn?.textContent || 'Download PDF';
  const updateButton = (text: string, disabled = false) => {
    if (btn) { btn.textContent = text; btn.disabled = disabled; }
    if (onProgress) onProgress(text);
  };

  updateButton('Generating PDF...', true);

  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const opt = {
      ...PDF_OPT_BASE,
      margin: [5, 5, 5, 5] as [number, number, number, number],
      filename,
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        onclone: buildOnClone(elementId, 718),
      },
    };

    await html2pdf().set(opt).from(element).save();
    updateButton(originalButtonText, false);
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Failed to generate PDF. Please try again.');
    updateButton(originalButtonText, false);
    throw error;
  }
};

export const generatePDFAsBlob = async ({
  elementId,
  filename,
  buttonSelector = '.download-pdf-btn',
  onProgress,
}: GeneratePDFOptions): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element with id "${elementId}" not found`);

  const btn = document.querySelector(buttonSelector) as HTMLButtonElement;
  const originalButtonText = btn?.textContent || 'Download PDF';
  const updateButton = (text: string, disabled = false) => {
    if (btn) { btn.textContent = text; btn.disabled = disabled; }
    if (onProgress) onProgress(text);
  };

  updateButton('Generating PDF...', true);

  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    const opt = {
      ...PDF_OPT_BASE,
      margin: [5, 5, 5, 5] as [number, number, number, number],
      filename,
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        onclone: buildOnClone(elementId, 682),
      },
    };

    const blob = await html2pdf().set(opt).from(element).outputPdf('blob');
    updateButton(originalButtonText, false);
    return blob;
  } catch (error) {
    console.error('PDF generation error:', error);
    updateButton(originalButtonText, false);
    throw error;
  }
};

export const generateAndOpenPDF = async (
  elementId: string,
  filename: string = 'document.pdf'
): Promise<void> => generatePDF({ elementId, filename });

export const estimateReportPages = (elementId: string): number => {
  const element = document.getElementById(elementId);
  if (!element) return 1;
  const withBreak = element.querySelectorAll(
    '[style*="page-break-after"], [style*="pageBreakAfter"], [style*="page-break-before"], [style*="pageBreakBefore"]'
  ).length;
  return Math.max(1, withBreak + 1);
};