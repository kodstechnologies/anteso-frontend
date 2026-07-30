/** Strip query/hash so signed S3/CloudFront URLs still detect .xlsx/.csv correctly. */
export const getUrlPathForExtension = (url: string): string => {
  return String(url || "").split("?")[0].split("#")[0].toLowerCase();
};

export const isExcelFileUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const path = getUrlPathForExtension(url);
  return path.endsWith(".xlsx") || path.endsWith(".xls");
};

export const isCsvFileUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return getUrlPathForExtension(url).endsWith(".csv");
};

export const isSpreadsheetFileUrl = (url?: string | null): boolean => {
  return isExcelFileUrl(url) || isCsvFileUrl(url);
};

/** Dedupe spreadsheet URLs (ignore query/hash for identity). */
export const uniqueSpreadsheetUrls = (
  urls: Array<string | null | undefined>
): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!url || !isSpreadsheetFileUrl(url)) continue;
    const key = getUrlPathForExtension(url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
};

/** Prefer explicit multi-url list, fall back to single csvFileUrl. */
export const resolvePrefillSpreadsheetUrls = (
  csvFileUrl?: string | null,
  csvFileUrls?: Array<string | null | undefined> | null
): string[] => {
  return uniqueSpreadsheetUrls([...(csvFileUrls || []), csvFileUrl]);
};
