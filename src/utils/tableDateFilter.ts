/** Local calendar date YYYY-MM-DD for range comparisons */
export function getLocalDateKey(value: string | Date | undefined | null): string | null {
    if (value == null || value === '') return null;
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Inclusive range: empty from/to means open on that side */
export function isInDateRange(
    value: string | Date | undefined | null,
    dateFrom: string,
    dateTo: string,
): boolean {
    const key = getLocalDateKey(value);
    if (!key) {
        if (dateFrom || dateTo) return false;
        return true;
    }
    if (dateFrom && key < dateFrom) return false;
    if (dateTo && key > dateTo) return false;
    return true;
}

export function formatCreatedAtDisplay(value: string | Date | undefined | null): string {
    if (value == null || value === '') return '—';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
