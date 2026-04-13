import html2pdf from 'html2pdf.js';

export interface GeneratePDFOptions {
  elementId: string;
  filename: string;
  buttonSelector?: string;
  onProgress?: (message: string) => void;
}

function injectHairlineStylesheet(clonedDoc: Document): void {
  const style = clonedDoc.createElement('style');
  style.textContent = `
    table {
      border-collapse: collapse !important;
      border-spacing: 0 !important;
      border-width: 0.5px !important;
      border-style: solid !important;
      border-color: #000000 !important;
      box-shadow: none !important;
      outline: none !important;
    }
    table td, table th {
      border-width: 0.5px !important;
      border-style: solid !important;
      border-color: #000000 !important;
      box-sizing: border-box !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      outline: none !important;
    }
    .border-2, .border-4, .border-8,
    .border-t-2, .border-b-2, .border-l-2, .border-r-2 {
      border-width: 0.5px !important;
    }
  `;
  clonedDoc.head.appendChild(style);
}

function applyHairlineBorders(root: HTMLElement): void {
  const tables = root.querySelectorAll('table');
  tables.forEach((table) => {
    const htmlTable = table as HTMLElement;
    htmlTable.style.borderCollapse = 'collapse';
    htmlTable.style.borderSpacing = '0';
    htmlTable.style.border = '0.5px solid #000';
    htmlTable.style.width = '100%';
    htmlTable.style.maxWidth = '100%';
    htmlTable.style.tableLayout = 'fixed';
    htmlTable.style.boxSizing = 'border-box';

    const isCompact = htmlTable.classList.contains('compact-table');
    const headerCells = table.querySelectorAll('thead th, thead td');
    const columnCount = headerCells.length || table.querySelectorAll('tr:first-child td').length;

    if (isCompact) {
      htmlTable.style.fontSize = '11px';
    } else if (columnCount >= 7) {
      htmlTable.style.fontSize = '10px';
    } else if (columnCount >= 5) {
      htmlTable.style.fontSize = '11px';
    } else {
      htmlTable.style.fontSize = '12px';
    }

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

    table.querySelectorAll('td, th').forEach((cell) => {
      const htmlCell = cell as HTMLElement;
      htmlCell.style.setProperty('border', '0.5px solid #000000', 'important');
      htmlCell.style.setProperty('border-width', '0.5px', 'important');
      htmlCell.style.setProperty('border-style', 'solid', 'important');
      htmlCell.style.setProperty('border-color', '#000000', 'important');
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

      htmlCell.classList.remove('bg-white', 'bg-gray-50');
      htmlCell.style.setProperty('background-color', 'transparent', 'important');
      htmlCell.style.setProperty('background', 'transparent', 'important');

      const textColor = window.getComputedStyle(htmlCell).color;
      if (!textColor || textColor === 'transparent' || textColor === 'rgba(0, 0, 0, 0)') {
        htmlCell.style.setProperty('color', '#000000', 'important');
      }

      htmlCell.querySelectorAll('span, div').forEach((span) => {
        const spanEl = span as HTMLElement;
        spanEl.classList.remove('bg-white', 'bg-gray-50');
        spanEl.style.borderRadius = '0';
        spanEl.style.display = 'inline';
        const spanBg = window.getComputedStyle(spanEl).backgroundColor;
        if (
          spanBg === 'white' ||
          spanBg === 'rgb(255, 255, 255)' ||
          spanBg === 'rgba(255, 255, 255, 1)' ||
          spanBg === 'rgb(249, 250, 251)' ||
          spanBg === 'rgba(249, 250, 251, 1)'
        ) {
          spanEl.style.setProperty('background-color', 'transparent', 'important');
          spanEl.style.setProperty('background', 'transparent', 'important');
        }
      });
    });

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

    const tableParent = htmlTable.parentElement;
    if (tableParent) {
      (tableParent as HTMLElement).style.width = '100%';
      (tableParent as HTMLElement).style.maxWidth = '100%';
      (tableParent as HTMLElement).style.overflow = 'hidden';
      (tableParent as HTMLElement).style.boxSizing = 'border-box';
    }
  });
}

/**
 * A4 page geometry (all in CSS px, before html2canvas scale factor).
 *
 * html2pdf uses jsPDF in 'mm' units.  A4 = 297 mm tall.
 * The internal conversion is:  px = mm * (72 / 25.4)  ≈ mm * 2.8346
 * So 297 mm  →  841.9 pt  →  but html2canvas works in CSS px (96 dpi).
 * At 96 dpi:  297 mm * (96 / 25.4) = 1122.5 CSS px  → round to 1122.
 *
 * margin: [5, 5, 5, 5] mm  →  top + bottom = 10 mm = 37.8 CSS px → ~38 px
 * USABLE = 1122 - 38 = 1084 CSS px
 *
 * If your footer is still slightly off, tweak USABLE_HEIGHT by ±10 px.
 */
const A4_PAGE_HEIGHT_PX = 1122;
const MARGIN_TB_PX = 38; // 5mm top + 5mm bottom at 96 dpi
const USABLE_HEIGHT_PX = A4_PAGE_HEIGHT_PX - MARGIN_TB_PX; // 1084

function buildOnClone(elementId: string, contentWidthPx: number) {
  return (clonedDoc: Document) => {
    injectHairlineStylesheet(clonedDoc);

    const clonedElement = clonedDoc.getElementById(elementId);
    if (!clonedElement) return;

    const preserveFixedReportLayout = clonedElement.classList.contains('fixed-report-pdf');

    clonedElement.style.width = `${contentWidthPx}px`;
    clonedElement.style.maxWidth = `${contentWidthPx}px`;
    clonedElement.style.margin = '0';
    clonedElement.style.padding = '0';
    clonedElement.style.boxSizing = 'border-box';
    clonedElement.style.overflow = 'visible';

    clonedElement.querySelectorAll('button, .print\\:hidden').forEach((btn) => {
      (btn as HTMLElement).style.display = 'none';
    });
    clonedElement.querySelectorAll('[class*="fixed"]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    if (preserveFixedReportLayout) {
      // --- Step 1: hairline borders ---
      clonedElement.querySelectorAll('table').forEach((t) => {
        const ht = t as HTMLElement;
        ht.style.setProperty('text-align', 'center', 'important');
        ht.style.setProperty('border-collapse', 'collapse', 'important');
        ht.style.setProperty('border-spacing', '0', 'important');
        ht.style.setProperty('border', '0.5px solid #000000', 'important');
        ht.style.setProperty('border-width', '0.5px', 'important');
        ht.style.setProperty('outline', 'none', 'important');
        ht.style.setProperty('box-shadow', 'none', 'important');
      });
      clonedElement.querySelectorAll('table td, table th').forEach((cell) => {
        const el = cell as HTMLElement;
        el.style.setProperty('text-align', 'center', 'important');
        el.style.setProperty('vertical-align', 'middle', 'important');
        el.style.setProperty('border', '0.5px solid #000000', 'important');
        el.style.setProperty('border-width', '0.5px', 'important');
        el.style.setProperty('border-style', 'solid', 'important');
        el.style.setProperty('border-color', '#000000', 'important');
        el.style.setProperty('box-sizing', 'border-box', 'important');
        el.style.setProperty('outline', 'none', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
        el.style.setProperty('border-radius', '0', 'important');
      });

      // --- Step 2: FOOTER PINNING via spacer injection ---
      //
      // html2pdf renders the whole DOM as one tall canvas, then slices it
      // into A4 pages.  CSS flexbox / margin-top:auto are irrelevant at
      // canvas-render time.  The ONLY way to pin the footer is to measure
      // each page shell's content height and inject an explicit spacer div
      // that fills the gap between the content and USABLE_HEIGHT_PX.
      //
      // Algorithm per shell:
      //   1. Strip flex (so scrollHeight gives real block height).
      //   2. Temporarily detach the footer, measure remaining content height.
      //   3. gap = USABLE_HEIGHT_PX - contentHeight
      //   4. Insert a spacer <div style="height: {gap}px"> before the footer.
      //   5. Re-attach footer, lock shell to USABLE_HEIGHT_PX.

      const shells = clonedElement.querySelectorAll<HTMLElement>(
        '.report-pdf-page-shell, .report-pdf-last-page-shell'
      );

      shells.forEach((shell) => {
        // Strip all layout that interferes with measurement
        shell.style.setProperty('display', 'block', 'important');
        shell.style.setProperty('min-height', '0', 'important');
        shell.style.setProperty('height', 'auto', 'important');
        shell.style.setProperty('max-height', 'none', 'important');
        shell.style.setProperty('overflow', 'visible', 'important');
        shell.style.setProperty('box-sizing', 'border-box', 'important');

        const footer = shell.querySelector<HTMLElement>('.report-pdf-footer-block');
        if (!footer) return;

        // Reset footer's own margin-top so it doesn't skew measurement
        footer.style.setProperty('margin-top', '0', 'important');
        footer.style.setProperty('flex-shrink', '0', 'important');

        // Measure content height WITHOUT the footer
        // We do this by checking the footer's offsetTop relative to the shell
        // — that is exactly "how tall is everything above the footer".
        // offsetTop is reliable here because we've set display:block above.
        const contentHeightAboveFooter = footer.offsetTop;
        const footerHeight = footer.offsetHeight;
        const totalNeeded = contentHeightAboveFooter + footerHeight;

        if (totalNeeded < USABLE_HEIGHT_PX) {
          const gap = USABLE_HEIGHT_PX - totalNeeded;
          const spacer = clonedDoc.createElement('div');
          spacer.setAttribute('aria-hidden', 'true');
          spacer.style.cssText = `
            display: block !important;
            width: 100% !important;
            height: ${gap}px !important;
            min-height: ${gap}px !important;
            max-height: ${gap}px !important;
            flex-shrink: 0 !important;
            overflow: hidden !important;
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          `;
          // Insert spacer immediately before the footer
          shell.insertBefore(spacer, footer);
        }

        // Lock shell to exact page height so html2pdf slices cleanly
        shell.style.setProperty('height', `${USABLE_HEIGHT_PX}px`, 'important');
        shell.style.setProperty('max-height', `${USABLE_HEIGHT_PX}px`, 'important');
        shell.style.setProperty('overflow', 'hidden', 'important');
        shell.style.setProperty('page-break-after', 'always', 'important');
        shell.style.setProperty('break-after', 'page', 'important');
      });

      return;
    }

    // Non-fixed-report path (unchanged)
    applyHairlineBorders(clonedElement);

    clonedElement.querySelectorAll('*').forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.classList.contains('p-10')) htmlEl.style.padding = '0';
      else if (htmlEl.classList.contains('px-4') || htmlEl.classList.contains('py-4')) htmlEl.style.padding = '0';
      if (htmlEl.classList.contains('mt-20') || htmlEl.classList.contains('mt-16') || htmlEl.classList.contains('mt-12')) htmlEl.style.marginTop = '16px';
      if (htmlEl.classList.contains('mb-20') || htmlEl.classList.contains('mb-16') || htmlEl.classList.contains('mb-12')) htmlEl.style.marginBottom = '16px';
      if (htmlEl.classList.contains('min-h-screen')) htmlEl.style.minHeight = 'auto';
      if (htmlEl.classList.contains('mx-auto')) { htmlEl.style.marginLeft = '0'; htmlEl.style.marginRight = '0'; }
      if (
        htmlEl.classList.contains('max-w-5xl') ||
        htmlEl.classList.contains('max-w-7xl') ||
        htmlEl.classList.contains('max-w-6xl')
      ) {
        htmlEl.style.maxWidth = '100%';
        htmlEl.style.width = '100%';
      }
      if (htmlEl.tagName === 'SECTION' || htmlEl.classList.contains('section')) {
        htmlEl.style.maxWidth = '100%';
        htmlEl.style.width = '100%';
        htmlEl.style.boxSizing = 'border-box';
      }
    });

    clonedElement.querySelectorAll('.overflow-x-auto, [class*="overflow"]').forEach((container) => {
      const c = container as HTMLElement;
      c.style.overflowX = 'hidden';
      c.style.overflow = 'hidden';
      c.style.width = '100%';
      c.style.maxWidth = '100%';
      c.style.padding = '0';
      c.style.boxSizing = 'border-box';
    });
  };
}

const PDF_OPT_BASE = {
  image: { type: 'jpeg' as const, quality: 0.98 },
  jsPDF: {
    unit: 'mm' as const,
    format: 'a4',
    orientation: 'portrait' as const,
  },
  pagebreak: {
    mode: ['css', 'legacy'],
    before: '.page-break-before',
    after: '.page-break-after',
    avoid: ['.test-section'],
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