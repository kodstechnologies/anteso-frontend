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
