import html2pdf from 'html2pdf.js';

/**
 * PDF generation utility - Based on k2k-iot-frontend implementation
 * Optimized for smaller file sizes while maintaining quality
 */

export interface GeneratePDFOptions {
  elementId: string;
  filename: string;
  buttonSelector?: string;
  onProgress?: (message: string) => void;
}

/**
 * Generate PDF directly from HTML element using jsPDF's html() method
 * Features:
 * - Direct HTML to PDF conversion (no intermediate image conversion)
 * - Automatic page breaks
 * - Preserves CSS styling
 * - Proper multi-page handling
 * - Button state management
 * - Progress callback support
 * 
 * Usage:
 * ```tsx
 * import { generatePDF } from '@/utils/generatePDF';
 * 
 * const handleDownload = () => {
 *   generatePDF({
 *     elementId: 'report-content',
 *     filename: 'report.pdf',
 *     onProgress: (msg) => console.log(msg)
 *   });
 * };
 * ```
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
    await new Promise(resolve => setTimeout(resolve, 200));

    // Configure html2pdf options
    // html2pdf.js automatically handles page breaks and converts HTML to PDF
    // Margin: [top, right, bottom, left] in mm - minimal margins
    const opt = {
      margin: [5, 5, 5, 5] as [number, number, number, number],
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
        onclone: (clonedDoc: Document) => {
          // Hide buttons and fixed elements in the cloned document
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
            // Set A4 width constraint
            // A4 width is 210mm, with 10mm margins on each side = 190mm content width
            // 190mm * 3.779527559 px/mm = ~718px at 96 DPI
            const CONTENT_WIDTH_PX = 718; // 190mm in pixels (accounting for 10mm margins)
            clonedElement.style.width = `${CONTENT_WIDTH_PX}px`;
            clonedElement.style.maxWidth = `${CONTENT_WIDTH_PX}px`;
          clonedElement.style.margin = '0 auto';
            clonedElement.style.padding = '10mm';
          clonedElement.style.boxSizing = 'border-box';

            // Hide buttons and fixed elements
            const buttons = clonedElement.querySelectorAll('button, .print\\:hidden');
            buttons.forEach((btn) => {
              (btn as HTMLElement).style.display = 'none';
            });
            
            const fixedElements = clonedElement.querySelectorAll('[class*="fixed"]');
            fixedElements.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
          
            // Remove all internal padding/margins from nested containers
          const allContainers = clonedElement.querySelectorAll('*');
          allContainers.forEach((el) => {
            const htmlEl = el as HTMLElement;
            
              // Reduce padding for PDF to minimize gaps
              // Keep minimal padding but reduce excessive spacing
              if (htmlEl.classList.contains('p-10')) {
                htmlEl.style.padding = '0';
            } else if (htmlEl.classList.contains('px-4') || htmlEl.classList.contains('py-4')) {
                htmlEl.style.padding = '0';
            }
            
            // Reduce large margins for PDF
            const computedMargin = window.getComputedStyle(htmlEl).margin;
            if (htmlEl.classList.contains('mt-20') || htmlEl.classList.contains('mt-16') || htmlEl.classList.contains('mt-12')) {
              htmlEl.style.marginTop = '16px'; // Reduce large top margins
            }
            if (htmlEl.classList.contains('mb-20') || htmlEl.classList.contains('mb-16') || htmlEl.classList.contains('mb-12')) {
              htmlEl.style.marginBottom = '16px'; // Reduce large bottom margins
            }
            
            // Remove min-height that forces excessive spacing
            if (htmlEl.style.minHeight && htmlEl.style.minHeight.includes('100vh') || htmlEl.style.minHeight.includes('screen')) {
              htmlEl.style.minHeight = 'auto';
            }
            if (htmlEl.classList.contains('min-h-screen')) {
              htmlEl.style.minHeight = 'auto';
            }
            
              // Remove margin classes
            if (htmlEl.classList.contains('mx-auto')) {
              htmlEl.style.marginLeft = '0';
              htmlEl.style.marginRight = '0';
            }
            
              // Remove max-width constraints that might be too wide
              if (htmlEl.classList.contains('max-w-5xl') || 
                  htmlEl.classList.contains('max-w-7xl') || 
                  htmlEl.classList.contains('max-w-6xl')) {
                htmlEl.style.maxWidth = '100%';
                htmlEl.style.width = '100%';
              }
              
            // Ensure all section containers respect max width
            if (htmlEl.tagName === 'SECTION' || htmlEl.classList.contains('section')) {
              htmlEl.style.maxWidth = '100%';
              htmlEl.style.width = '100%';
              htmlEl.style.boxSizing = 'border-box';
            }
          });

            // Fix overflow containers - remove overflow-x-auto and make content fit
            const overflowContainers = clonedElement.querySelectorAll('.overflow-x-auto, [class*="overflow"]');
          overflowContainers.forEach((container) => {
            const htmlContainer = container as HTMLElement;
            htmlContainer.style.overflowX = 'hidden'; // Changed to hidden to prevent overflow
            htmlContainer.style.overflow = 'hidden';
            htmlContainer.style.width = '100%';
            htmlContainer.style.maxWidth = '100%';
              htmlContainer.style.padding = '0';
            htmlContainer.style.boxSizing = 'border-box';
          });

            // Fix all tables to fit within page width - use fixed layout for better control
          const tables = clonedElement.querySelectorAll('table');
          tables.forEach((table) => {
            const htmlTable = table as HTMLElement;
            // Force table to fit exactly within container
            htmlTable.style.width = '100%';
            htmlTable.style.maxWidth = '100%';
            htmlTable.style.minWidth = '0';
            htmlTable.style.tableLayout = 'fixed';
            htmlTable.style.wordWrap = 'break-word';
            htmlTable.style.borderCollapse = 'collapse';
            htmlTable.style.borderSpacing = '0'; // Remove spacing between borders
            htmlTable.style.overflow = 'hidden'; // Prevent table overflow
            htmlTable.style.boxSizing = 'border-box';
            // Reduce border thickness for PDF - force 1px borders
            htmlTable.style.borderWidth = '1px';
            htmlTable.style.borderStyle = 'solid';
            htmlTable.style.borderColor = '#000000';
            
            // Remove alternating row backgrounds that can cause overlap issues
            // This MUST be done before processing cells to ensure cell backgrounds show through
            const tableRows = table.querySelectorAll('tr');
            const isCompact = htmlTable.classList.contains('compact-table');
            tableRows.forEach((row) => {
              const htmlRow = row as HTMLElement;
              // Remove bg-white and bg-gray-50 classes completely
              htmlRow.classList.remove('bg-white', 'bg-gray-50');
              // Force row background to transparent so cell backgrounds show through
              htmlRow.style.setProperty('background-color', 'transparent', 'important');
              htmlRow.style.setProperty('background', 'transparent', 'important');
              htmlRow.style.setProperty('background-image', 'none', 'important');
              // Remove any pseudo-elements that might create white overlays
              htmlRow.style.setProperty('position', 'relative', 'important');
              // Reduce row height aggressively for compact tables
              if (isCompact) {
                htmlRow.style.height = 'auto';
                htmlRow.style.minHeight = '0';
                htmlRow.style.lineHeight = '1.0';
                htmlRow.style.padding = '0';
                htmlRow.style.margin = '0';
              }
              // Also remove any inline or computed white backgrounds
              const rowBg = window.getComputedStyle(htmlRow).backgroundColor;
              if (rowBg === 'white' || rowBg === 'rgb(255, 255, 255)' || rowBg === 'rgba(255, 255, 255, 1)' || 
                  rowBg === 'rgb(249, 250, 251)' || rowBg === 'rgba(249, 250, 251, 1)') {
                htmlRow.style.setProperty('background-color', 'transparent', 'important');
                htmlRow.style.setProperty('background', 'transparent', 'important');
                htmlRow.style.setProperty('background-image', 'none', 'important');
              }
            });
            
            // Count columns to determine if we need smaller font
            const headerCells = table.querySelectorAll('thead th, thead td');
            const columnCount = headerCells.length || table.querySelectorAll('tr:first-child td').length;
            
            // Check if table has compact-table class for extra aggressive sizing
            const isCompactTable = htmlTable.classList.contains('compact-table');
            
            // More aggressive font sizing for wide tables
            if (isCompactTable) {
              htmlTable.style.fontSize = '11px'; // Increased for better readability while keeping height tight
            } else if (columnCount >= 7) {
              htmlTable.style.fontSize = '10px'; // Very small font for 7+ column tables
            } else if (columnCount >= 6) {
              htmlTable.style.fontSize = '11px'; // Small font for 6 column tables
            } else if (columnCount >= 5) {
              htmlTable.style.fontSize = '12px'; // Small font for 5 column tables
            } else {
              htmlTable.style.fontSize = '13px'; // Normal font for smaller tables
            }
            
            // Ensure table cells wrap text properly and fit within columns
            const cells = table.querySelectorAll('td, th');
            cells.forEach((cell, index) => {
              const htmlCell = cell as HTMLElement;
              htmlCell.style.wordWrap = 'break-word';
              htmlCell.style.overflowWrap = 'break-word';
              htmlCell.style.whiteSpace = 'normal';
              htmlCell.style.verticalAlign = 'middle';
              htmlCell.style.overflow = 'hidden';
              htmlCell.style.boxSizing = 'border-box';
              htmlCell.style.maxWidth = '100%';
              htmlCell.style.minWidth = '0'; // Allow columns to shrink below content width
              
              // Center align text in table cells for DETAILED TEST RESULTS section
              if (isCompactTable || table.closest('.test-section')) {
                htmlCell.style.textAlign = 'center';
              }
              
              // Remove rounded corners that can cause white overlap
              htmlCell.style.borderRadius = '0';
              // Ensure borders are properly rendered and black
              htmlCell.style.borderStyle = 'solid';
              htmlCell.style.borderWidth = '1px';
              htmlCell.style.borderColor = '#000000';
              
              // First, remove any white/gray background classes that might interfere
              htmlCell.classList.remove('bg-white', 'bg-gray-50');
              
              // Check for Pass/Fail cells by looking for text-green-800 or text-red-800 classes
              const isPassCell = htmlCell.classList.contains('text-green-800') || htmlCell.textContent?.trim() === 'Pass';
              const isFailCell = htmlCell.classList.contains('text-red-800') || htmlCell.textContent?.trim() === 'Fail';
              
              // Get computed background BEFORE making any changes
              const computedBg = window.getComputedStyle(htmlCell).backgroundColor;
              
              // Force Pass/Fail cell backgrounds - use !important to override any CSS
              if (htmlCell.classList.contains('bg-green-100') || htmlCell.classList.contains('bg-green-200') || isPassCell) {
                htmlCell.style.setProperty('background-color', '#dcfce7', 'important'); // green-100
                htmlCell.style.setProperty('background', '#dcfce7', 'important');
                htmlCell.style.setProperty('color', '#166534', 'important'); // green-800
              } else if (htmlCell.classList.contains('bg-red-100') || htmlCell.classList.contains('bg-red-200') || isFailCell) {
                htmlCell.style.setProperty('background-color', '#fee2e2', 'important'); // red-100
                htmlCell.style.setProperty('background', '#fee2e2', 'important');
                htmlCell.style.setProperty('color', '#991b1b', 'important'); // red-800
              } else {
                // For ALL regular cells (including rowSpan cells like "Parameters Used"), force transparent background
                // This ensures no white/gray background covers the text
                htmlCell.style.setProperty('background-color', 'transparent', 'important');
                htmlCell.style.setProperty('background', 'transparent', 'important');
                htmlCell.style.setProperty('background-image', 'none', 'important');
                htmlCell.style.setProperty('position', 'relative', 'important');
                htmlCell.style.setProperty('z-index', '1', 'important'); // Ensure cell content is on top
                
                // Remove any ::before and ::after pseudo-elements that might overlay
                // (This is done via CSS, so we ensure the cell itself has no background)
                
                // Also ensure the cell doesn't have any white color that might be covering text
                // Make sure text color is visible
                const textColor = window.getComputedStyle(htmlCell).color;
                if (!textColor || textColor === 'transparent' || textColor === 'rgba(0, 0, 0, 0)' || 
                    textColor === 'white' || textColor === 'rgb(255, 255, 255)') {
                  htmlCell.style.setProperty('color', '#000000', 'important'); // Ensure text is black
                }
              }
              
              // Remove nested spans/badges that might have white backgrounds
              const nestedSpans = htmlCell.querySelectorAll('span, div');
              nestedSpans.forEach((span) => {
                const spanEl = span as HTMLElement;
                spanEl.classList.remove('bg-white', 'bg-gray-50');
                spanEl.style.borderRadius = '0';
                spanEl.style.display = 'inline';
                
                // Check if span has colored background classes
                if (spanEl.classList.contains('bg-green-100') || spanEl.classList.contains('bg-green-200') || spanEl.classList.contains('text-green-800')) {
                  spanEl.style.setProperty('background-color', '#dcfce7', 'important');
                  spanEl.style.setProperty('background', '#dcfce7', 'important');
                  spanEl.style.setProperty('color', '#166534', 'important');
                } else if (spanEl.classList.contains('bg-red-100') || spanEl.classList.contains('bg-red-200') || spanEl.classList.contains('text-red-800')) {
                  spanEl.style.setProperty('background-color', '#fee2e2', 'important');
                  spanEl.style.setProperty('background', '#fee2e2', 'important');
                  spanEl.style.setProperty('color', '#991b1b', 'important');
                } else {
                  // Remove white backgrounds from nested elements
                  const spanBg = window.getComputedStyle(spanEl).backgroundColor;
                  if (spanBg === 'white' || spanBg === 'rgb(255, 255, 255)' || spanBg === 'rgba(255, 255, 255, 1)' ||
                      spanBg === 'rgb(249, 250, 251)' || spanBg === 'rgba(249, 250, 251, 1)') {
                    spanEl.style.setProperty('background-color', 'transparent', 'important');
                    spanEl.style.setProperty('background', 'transparent', 'important');
                  }
                }
              });
              
              // More aggressive padding reduction for wide tables
              if (isCompactTable) {
                htmlCell.style.padding = '0px 1px'; // Minimal padding for compact tables
                htmlCell.style.lineHeight = '1.0'; // Tight line height - keep at 1.0 to maintain height
                htmlCell.style.minHeight = '0'; // Remove min-height
                htmlCell.style.height = 'auto'; // Auto height
              } else if (columnCount >= 7) {
                htmlCell.style.padding = '0px 1px'; // Minimal padding for 7+ column tables
                htmlCell.style.lineHeight = '1.0';
              } else if (columnCount >= 6) {
                htmlCell.style.padding = '1px 2px';
                htmlCell.style.lineHeight = '1.1';
              } else if (columnCount >= 5) {
                htmlCell.style.padding = '1px 2px';
                htmlCell.style.lineHeight = '1.1';
              } else {
                htmlCell.style.padding = '2px 3px'; // Normal padding for smaller tables
                htmlCell.style.lineHeight = '1.2';
              }
              
              // Force remove any min-height or height constraints - keep height tight
              htmlCell.style.minHeight = '0';
              htmlCell.style.maxHeight = 'none';
              // Ensure font size is applied but line-height stays tight
              if (isCompactTable && !htmlCell.style.fontSize) {
                htmlCell.style.fontSize = '11px';
              }
            });
            
            // Calculate column widths proportionally for fixed layout
            if (columnCount > 0) {
              const percentageWidth = `${(100 / columnCount).toFixed(2)}%`;
              const firstRowCells = table.querySelectorAll('tr:first-child td, tr:first-child th, thead th');
              firstRowCells.forEach((cell) => {
                const htmlCell = cell as HTMLElement;
                htmlCell.style.width = percentageWidth;
                htmlCell.style.minWidth = '0'; // Allow columns to shrink
                htmlCell.style.maxWidth = percentageWidth; // Prevent columns from expanding
              });
            }
            
            // Wrap table parent container to ensure it doesn't overflow
            const tableParent = htmlTable.parentElement;
            if (tableParent) {
              const parentEl = tableParent as HTMLElement;
              parentEl.style.width = '100%';
              parentEl.style.maxWidth = '100%';
              parentEl.style.overflow = 'hidden';
              parentEl.style.boxSizing = 'border-box';
            }
          });

          }
        },
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as const,
        margin: [10, 10, 10, 10] // [top, right, bottom, left] margins in mm - consistent margins
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: ['table', 'tr', 'section', '.test-section']
      }
    };

    // Generate PDF - html2pdf.js handles page breaks automatically
    await html2pdf().set(opt).from(element).save();
    
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
    await new Promise(resolve => setTimeout(resolve, 200));

    // Configure html2pdf options
    // Margin: [top, right, bottom, left] in mm - minimal margins
    const opt = {
      margin: [5, 5, 5, 5] as [number, number, number, number],
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
        onclone: (clonedDoc: Document) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
            // Set A4 width constraint
            // A4 width is 210mm = 794px, with 5mm PDF margins on each side = 10mm = 38px total
            // Available width = 794px - 38px = 756px
            // Page divs have px-8 (32px) padding on each side = 64px total
            // Safe content width = 756px - 64px - 10px (safety margin) = 682px
            const CONTENT_WIDTH_PX = 682; // Accounting for PDF margins, page padding, and safety margin
            clonedElement.style.width = `${CONTENT_WIDTH_PX}px`;
            clonedElement.style.maxWidth = `${CONTENT_WIDTH_PX}px`;
          clonedElement.style.margin = '0';
            clonedElement.style.padding = '0';
          clonedElement.style.boxSizing = 'border-box';
            clonedElement.style.overflow = 'hidden'; // Prevent any overflow

            // Hide buttons and fixed elements
            const buttons = clonedElement.querySelectorAll('button, .print\\:hidden');
            buttons.forEach((btn) => {
              (btn as HTMLElement).style.display = 'none';
            });
            
            const fixedElements = clonedElement.querySelectorAll('[class*="fixed"]');
            fixedElements.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
          
            // Remove all internal padding/margins from nested containers
          const allContainers = clonedElement.querySelectorAll('*');
          allContainers.forEach((el) => {
            const htmlEl = el as HTMLElement;
            
              // Reduce padding for PDF to minimize gaps
              // Keep minimal padding but reduce excessive spacing
              if (htmlEl.classList.contains('p-10')) {
                htmlEl.style.padding = '0';
            } else if (htmlEl.classList.contains('px-4') || htmlEl.classList.contains('py-4')) {
                htmlEl.style.padding = '0';
            }
            
            // Reduce large margins for PDF
            const computedMargin = window.getComputedStyle(htmlEl).margin;
            if (htmlEl.classList.contains('mt-20') || htmlEl.classList.contains('mt-16') || htmlEl.classList.contains('mt-12')) {
              htmlEl.style.marginTop = '16px'; // Reduce large top margins
            }
            if (htmlEl.classList.contains('mb-20') || htmlEl.classList.contains('mb-16') || htmlEl.classList.contains('mb-12')) {
              htmlEl.style.marginBottom = '16px'; // Reduce large bottom margins
            }
            
            // Remove min-height that forces excessive spacing
            if (htmlEl.style.minHeight && htmlEl.style.minHeight.includes('100vh') || htmlEl.style.minHeight.includes('screen')) {
              htmlEl.style.minHeight = 'auto';
            }
            if (htmlEl.classList.contains('min-h-screen')) {
              htmlEl.style.minHeight = 'auto';
            }
            
              // Remove margin classes
            if (htmlEl.classList.contains('mx-auto')) {
              htmlEl.style.marginLeft = '0';
              htmlEl.style.marginRight = '0';
            }
            
              // Remove max-width constraints that might be too wide
              if (htmlEl.classList.contains('max-w-5xl') || 
                  htmlEl.classList.contains('max-w-7xl') || 
                  htmlEl.classList.contains('max-w-6xl')) {
                htmlEl.style.maxWidth = '100%';
                htmlEl.style.width = '100%';
              }
              
            // Ensure all section containers respect max width
            if (htmlEl.tagName === 'SECTION' || htmlEl.classList.contains('section')) {
              htmlEl.style.maxWidth = '100%';
              htmlEl.style.width = '100%';
              htmlEl.style.boxSizing = 'border-box';
            }
          });

            // Fix overflow containers - remove overflow-x-auto and make content fit
            const overflowContainers = clonedElement.querySelectorAll('.overflow-x-auto, [class*="overflow"]');
          overflowContainers.forEach((container) => {
            const htmlContainer = container as HTMLElement;
            htmlContainer.style.overflowX = 'hidden'; // Changed to hidden to prevent overflow
            htmlContainer.style.overflow = 'hidden';
            htmlContainer.style.width = '100%';
            htmlContainer.style.maxWidth = '100%';
              htmlContainer.style.padding = '0';
            htmlContainer.style.boxSizing = 'border-box';
          });

            // Fix all tables to fit within page width - use fixed layout for better control
          const tables = clonedElement.querySelectorAll('table');
          tables.forEach((table) => {
            const htmlTable = table as HTMLElement;
            htmlTable.style.width = '100%';
            htmlTable.style.maxWidth = '100%';
              // Use fixed layout to force columns to fit
              htmlTable.style.tableLayout = 'fixed';
              htmlTable.style.wordWrap = 'break-word';
            htmlTable.style.borderCollapse = 'collapse';
            // Reduce border thickness for PDF - force 1px borders
            htmlTable.style.borderWidth = '1px';
            htmlTable.style.borderStyle = 'solid';
            htmlTable.style.borderColor = '#000000';
              htmlTable.style.fontSize = '10px'; // Slightly smaller font for wide tables
              
              // Ensure table cells wrap text properly and fit within columns
            const cells = table.querySelectorAll('td, th');
              cells.forEach((cell, index) => {
              const htmlCell = cell as HTMLElement;
              htmlCell.style.wordWrap = 'break-word';
              htmlCell.style.overflowWrap = 'break-word';
                htmlCell.style.whiteSpace = 'normal';
              htmlCell.style.verticalAlign = 'top';
                htmlCell.style.overflow = 'hidden';
                // Minimal padding for wide tables
                htmlCell.style.padding = '2px 3px';
              htmlCell.style.boxSizing = 'border-box';
              // Reduce border thickness for PDF - force 1px borders
              htmlCell.style.borderWidth = '1px';
              htmlCell.style.borderStyle = 'solid';
              htmlCell.style.borderColor = '#000000';
            });
          });
          }
        },
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as const,
        margin: [10, 10, 10, 10] // [top, right, bottom, left] margins in mm - consistent margins
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: ['table', 'tr', 'section', '.test-section']
      }
    };

    // Generate PDF as blob - html2pdf.js handles page breaks automatically
    const blob = await html2pdf().set(opt).from(element).outputPdf('blob');
    
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

