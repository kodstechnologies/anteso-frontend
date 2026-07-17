import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface GeneratePDFOptions {
  elementId: string;
  filename: string;
  buttonSelector?: string;
  onProgress?: (message: string) => void;
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const waitForImagesToLoad = async (root: HTMLElement): Promise<void> => {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        }),
    ),
  );
};

const resolveImageMimeType = (
  blob: Blob,
  url: string,
  responseHeaders?: Record<string, string>,
): string => {
  const headerType = responseHeaders?.['content-type']?.split(';')[0]?.trim();
  if (headerType?.startsWith('image/')) return headerType;
  if (blob.type?.startsWith('image/')) return blob.type;

  const extension = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'gif') return 'image/gif';

  return 'image/png';
};

const fetchImageAsDataUrl = async (url: string): Promise<string> => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  try {
    const { proxyFile } = await import('../api');
    const response = await proxyFile(url);
    const blob = response.data as Blob;

    if (blob.type === 'application/json') {
      throw new Error('Proxy returned JSON instead of image');
    }

    const mimeType = resolveImageMimeType(
      blob,
      url,
      response.headers as Record<string, string>,
    );
    const imageBlob = blob.type.startsWith('image/')
      ? blob
      : new Blob([blob], { type: mimeType });

    return await blobToDataUrl(imageBlob);
  } catch (proxyError) {
    console.warn('PDF: proxy fetch failed, trying direct load', url, proxyError);
  }

  return await new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error(`Unable to load image: ${url}`));
    image.src = url;
  });
};

const normalizeImageUrl = (url: string): string => {
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
};

const storeImageDataUrl = (map: Map<string, string>, url: string, dataUrl: string): void => {
  map.set(url, dataUrl);
  const normalized = normalizeImageUrl(url);
  if (normalized !== url) {
    map.set(normalized, dataUrl);
  }
};

const lookupImageDataUrl = (map: Map<string, string>, img: HTMLImageElement): string | undefined => {
  const candidates = [
    img.currentSrc,
    img.getAttribute('src') || '',
    img.src,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const dataUrl = map.get(candidate);
    if (dataUrl) return dataUrl;
    const normalized = normalizeImageUrl(candidate);
    const normalizedDataUrl = map.get(normalized);
    if (normalizedDataUrl) return normalizedDataUrl;
  }

  return undefined;
};

const collectExternalImageUrls = (root: HTMLElement): string[] => {
  const urls = new Set<string>();
  root.querySelectorAll('img').forEach((img) => {
    const src = img.currentSrc || img.getAttribute('src') || '';
    if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
      urls.add(src);
    }
  });
  return Array.from(urls);
};

const buildImageDataUrlMap = async (root: HTMLElement): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  const urls = collectExternalImageUrls(root);

  await Promise.all(
    urls.map(async (url) => {
      try {
        storeImageDataUrl(map, url, await fetchImageAsDataUrl(url));
      } catch (error) {
        console.warn('PDF: could not fetch image for export', url, error);
      }
    }),
  );

  return map;
};

const applyImageDataUrlMap = (root: HTMLElement, map: Map<string, string>): Array<() => void> => {
  const restoreFns: Array<() => void> = [];

  root.querySelectorAll('img').forEach((img) => {
    const dataUrl = lookupImageDataUrl(map, img);
    if (!dataUrl) return;

    const previousSrc = img.src;
    img.src = dataUrl;
    restoreFns.push(() => {
      img.src = previousSrc;
    });
  });

  return restoreFns;
};

const applyImageDataUrlMapToDocument = (doc: Document, map: Map<string, string>): void => {
  doc.querySelectorAll('img').forEach((img) => {
    const dataUrl = lookupImageDataUrl(map, img);
    if (dataUrl) {
      img.src = dataUrl;
    }
  });
};

const waitForImagesToDecode = async (root: HTMLElement): Promise<void> => {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      if (img.decode) {
        try {
          await img.decode();
        } catch {
          // ignore decode errors; html2canvas may still render
        }
      }
    }),
  );
};

export const embedExternalImagesForPdf = async (root: HTMLElement): Promise<() => void> => {
  const { restore } = await prepareImagesForPdfCapture(root);
  return restore;
};

export const prepareImagesForPdfCapture = async (
  root: HTMLElement,
): Promise<{ imageDataUrlMap: Map<string, string>; restore: () => void }> => {
  await waitForImagesToLoad(root);
  const imageDataUrlMap = await buildImageDataUrlMap(root);
  const restoreFns = applyImageDataUrlMap(root, imageDataUrlMap);
  await waitForImagesToDecode(root);

  return {
    imageDataUrlMap,
    restore: () => {
      restoreFns.forEach((restoreFn) => restoreFn());
    },
  };
};

export const applyEmbeddedImagesToClone = (
  doc: Document,
  imageDataUrlMap: Map<string, string>,
): void => {
  applyImageDataUrlMapToDocument(doc, imageDataUrlMap);
};

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
        tableEl.style.borderCollapse = 'collapse';
        const cells = tableEl.querySelectorAll('th, td');
        cells.forEach((cell) => {
          const cellEl = cell as HTMLElement;
          cellEl.style.border = '0.5px solid #000';
        });
      });

      // Ensure images are fully visible and embeddable in canvas output
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

      updateButton('Preparing images...', true);
      const imageDataUrlMap = await buildImageDataUrlMap(element);
      let generatedPageCount = 0;

      for (let i = 0; i < shells.length; i++) {
        const shell = shells[i] as HTMLElement;
        updateButton(`Generating Page ${i + 1} of ${shells.length}...`, true);

        const restoreFns = applyImageDataUrlMap(shell, imageDataUrlMap);
        await waitForImagesToDecode(shell);

        try {
          const canvas = await html2canvas(shell, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          imageTimeout: 15000,
          onclone: (clonedDoc: Document) => {
            applyImageDataUrlMapToDocument(clonedDoc, imageDataUrlMap);

            const clonedShells = clonedDoc.querySelectorAll('.report-pdf-page-shell, .report-pdf-last-page-shell');
            const clonedShell = clonedShells[i] as HTMLElement;
            if (clonedShell) {
              clonedShell.classList.add('is-generating-pdf');
              clonedShell.style.margin = '0';
              clonedShell.style.boxShadow = 'none';
              clonedShell.style.width = '210mm';
              clonedShell.style.height = 'auto';
              clonedShell.style.minHeight = '297mm';
              clonedShell.style.maxHeight = 'none';
              clonedShell.style.overflow = 'visible';

              prepareClonedElement(clonedShell);
            }
          }
        });

        const pageHeightInCanvasPixels = Math.floor((canvas.width * pageHeight) / imgWidth);
        const shellPageCount = Math.max(1, Math.ceil(canvas.height / pageHeightInCanvasPixels));

        for (let pageIndex = 0; pageIndex < shellPageCount; pageIndex++) {
          const sourceY = pageIndex * pageHeightInCanvasPixels;
          const sliceHeight = Math.min(pageHeightInCanvasPixels, canvas.height - sourceY);
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;

          const context = pageCanvas.getContext('2d');
          if (!context) throw new Error('Unable to create PDF page canvas');

          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          context.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight,
          );

          if (generatedPageCount > 0) pdf.addPage();

          const renderHeight = (sliceHeight * imgWidth) / canvas.width;
          pdf.addImage(
            pageCanvas.toDataURL('image/png'),
            'PNG',
            0,
            0,
            imgWidth,
            renderHeight,
            undefined,
            'FAST',
          );
          generatedPageCount += 1;
        }
        } finally {
          restoreFns.forEach((restore) => restore());
        }
      }

      pdf.save(filename);
    } else {
      /**
       * FALLBACK: CONTINUOUS CAPTURE (OLD)
       * Captures the entire element and slices it mathematically into A4 pages.
       */
      updateButton('Preparing images...', true);
      const imageDataUrlMap = await buildImageDataUrlMap(element);
      const restoreFns = applyImageDataUrlMap(element, imageDataUrlMap);
      await waitForImagesToDecode(element);

      try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        imageTimeout: 15000,
        onclone: (clonedDoc: Document) => {
          applyImageDataUrlMapToDocument(clonedDoc, imageDataUrlMap);

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
      } finally {
        restoreFns.forEach((restore) => restore());
      }
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