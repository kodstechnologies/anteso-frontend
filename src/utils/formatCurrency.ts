/** Parse monetary values from API / table rows (number, string, Decimal-like objects). */
export const parseAmount = (value: unknown): number => {
    if (value == null || value === '') return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'object' && value !== null) {
        const decimal = (value as { $numberDecimal?: string }).$numberDecimal;
        if (decimal != null) {
            const parsed = Number(decimal);
            return Number.isFinite(parsed) ? parsed : 0;
        }
    }

    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatAmount = (value: unknown): string => {
    const amount = parseAmount(value);
    return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
};

/** UI / Excel / Word — Unicode rupee symbol is supported. */
export const formatCurrencyDisplay = (value: unknown): string => `₹${formatAmount(value)}`;

/**
 * PDF export — jsPDF default fonts cannot render ₹ (U+20B9), so use ASCII "Rs." prefix.
 */
export const formatCurrencyForPdf = (value: unknown): string => `Rs. ${formatAmount(value)}`;

/** Generic export (Excel/Word) — same safe formatting, Rs. avoids font issues in some viewers. */
export const formatCurrencyForExport = (value: unknown): string => `Rs. ${formatAmount(value)}`;
