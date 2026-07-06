import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
    PageOrientation,
} from 'docx';
import { formatDateForExport, formatGeneratedAtForExport, getExportFileNameDateStamp } from './tableDateFilter';
import { formatCurrencyForExport, formatCurrencyForPdf } from './formatCurrency';

export type PaymentExportRow = {
    paymentId: string;
    srfClient: string;
    totalAmount: string;
    paymentAmount: string;
    paymentType: string;
    utrNumber: string;
    paymentMode: string;
    branchName: string;
    createdAt: string;
};

export type PaymentExportFilters = {
    paymentType?: string;
    paymentMode?: string;
    branchName?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
};

const PAYMENT_EXPORT_HEADERS = [
    'Payment ID',
    'SRF No.',
    'Total Amount',
    'Payment Amount',
    'Payment Type',
    'UTR Number',
    'Payment Mode',
    'Branch Name',
    'Created At',
] as const;

export const mapPaymentToExportRow = (
    payment: Record<string, any>,
    forPdf = false,
): PaymentExportRow => {
    const formatCurrency = forPdf ? formatCurrencyForPdf : formatCurrencyForExport;
    return {
        paymentId: payment.paymentId || '-',
        srfClient: payment.srfClient || '-',
        totalAmount: formatCurrency(payment.totalAmount),
        paymentAmount: formatCurrency(payment.paymentAmount),
        paymentType: payment.paymentType || '-',
        utrNumber: payment.utrNumber || '-',
        paymentMode: payment.paymentMode || '-',
        branchName: payment.branchName || '-',
        createdAt: formatDateForExport(payment.createdAt),
    };
};

const rowsToMatrix = (rows: PaymentExportRow[]) =>
    rows.map((row) => [
        row.paymentId,
        row.srfClient,
        row.totalAmount,
        row.paymentAmount,
        row.paymentType,
        row.utrNumber,
        row.paymentMode,
        row.branchName,
        row.createdAt,
    ]);

const buildFilterSummary = (filters: PaymentExportFilters, totalRecords: number) => {
    const summary: string[][] = [
        ['Payments Export'],
        ['Generated At', formatGeneratedAtForExport()],
        ['Total Records', String(totalRecords)],
    ];

    const appliedFilters: Array<[string, string | undefined]> = [
        ['Payment Type', filters.paymentType],
        ['Payment Mode', filters.paymentMode],
        ['Branch Name', filters.branchName],
        ['From Date', filters.dateFrom ? formatDateForExport(filters.dateFrom) : undefined],
        ['To Date', filters.dateTo ? formatDateForExport(filters.dateTo) : undefined],
        ['Search', filters.search],
    ];

    appliedFilters.forEach(([label, value]) => {
        const trimmed = String(value || '').trim();
        if (trimmed) {
            summary.push([label, trimmed]);
        }
    });

    summary.push(['']);
    return summary;
};

const getExportFileName = (extension: string) => `payments-export-${getExportFileNameDateStamp()}.${extension}`;

const PDF_MARGIN = 14;
const CARD_GAP = 8;
const CARD_PADDING = 5;
const CARD_HEADER_HEIGHT = 10;
const LINE_HEIGHT = 4.8;

type CardField = {
    label: string;
    value: string;
    fullWidth?: boolean;
};

const getPaymentCardFields = (row: PaymentExportRow): CardField[] => [
    { label: 'SRF No.', value: row.srfClient },
    { label: 'Total Amount', value: row.totalAmount, fullWidth: true },
    { label: 'Payment Amount', value: row.paymentAmount, fullWidth: true },
    { label: 'Payment Type', value: row.paymentType },
    { label: 'UTR Number', value: row.utrNumber },
    { label: 'Payment Mode', value: row.paymentMode },
    { label: 'Branch Name', value: row.branchName },
    { label: 'Created At', value: row.createdAt },
];

const measureCardHeight = (doc: jsPDF, fields: CardField[], contentWidth: number) => {
    const colWidth = (contentWidth - CARD_PADDING * 2 - 6) / 2;
    const valueWidth = colWidth - 34;
    const fullValueWidth = contentWidth - CARD_PADDING * 2 - 34;
    let height = CARD_HEADER_HEIGHT + CARD_PADDING;

    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const maxWidth = field.fullWidth ? fullValueWidth : valueWidth;
        const lines = doc.splitTextToSize(field.value || '-', maxWidth);
        const rowHeight = Math.max(LINE_HEIGHT, lines.length * LINE_HEIGHT);

        if (field.fullWidth) {
            height += rowHeight + 2;
            continue;
        }

        const next = fields[i + 1];
        if (next && !next.fullWidth) {
            const nextLines = doc.splitTextToSize(next.value || '-', valueWidth);
            const nextHeight = Math.max(LINE_HEIGHT, nextLines.length * LINE_HEIGHT);
            height += Math.max(rowHeight, nextHeight) + 2;
            i += 1;
        } else {
            height += rowHeight + 2;
        }
    }

    return height + CARD_PADDING;
};

const drawPdfSummary = (doc: jsPDF, filters: PaymentExportFilters, totalRecords: number) => {
    const summary = buildFilterSummary(filters, totalRecords).slice(1, -1);
    let y = PDF_MARGIN;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Payments Export', PDF_MARGIN, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    summary.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, PDF_MARGIN, y);
        y += 5;
    });

    return y + 4;
};

const drawPaymentCard = (
    doc: jsPDF,
    row: PaymentExportRow,
    index: number,
    startY: number,
    contentWidth: number,
) => {
    const x = PDF_MARGIN;
    const fields = getPaymentCardFields(row);
    const cardHeight = measureCardHeight(doc, fields, contentWidth);
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = startY;

    if (y + cardHeight > pageHeight - PDF_MARGIN) {
        doc.addPage();
        y = PDF_MARGIN;
    }

    doc.setDrawColor(210, 214, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, contentWidth, cardHeight, 2, 2, 'FD');

    doc.setFillColor(16, 185, 129); // green accent color for payments
    doc.roundedRect(x, y, contentWidth, CARD_HEADER_HEIGHT, 2, 2, 'F');
    doc.rect(x, y + CARD_HEADER_HEIGHT - 2, contentWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Payment ${index + 1}  |  ID: ${row.paymentId}`, x + CARD_PADDING, y + 6.5);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);

    const innerX = x + CARD_PADDING;
    let cursorY = y + CARD_HEADER_HEIGHT + CARD_PADDING;
    const colWidth = (contentWidth - CARD_PADDING * 2 - 6) / 2;
    const valueWidth = colWidth - 34;
    const fullValueWidth = contentWidth - CARD_PADDING * 2 - 34;

    const drawField = (field: CardField, fieldX: number, fieldY: number, width: number, valueMaxWidth: number) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${field.label}:`, fieldX, fieldY);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(field.value || '-', valueMaxWidth);
        doc.text(lines, fieldX + 34, fieldY);
        return Math.max(LINE_HEIGHT, lines.length * LINE_HEIGHT) + 2;
    };

    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];

        if (field.fullWidth) {
            cursorY += drawField(field, innerX, cursorY, contentWidth - CARD_PADDING * 2, fullValueWidth);
            continue;
        }

        const next = fields[i + 1];
        if (next && !next.fullWidth) {
            const leftHeight = drawField(field, innerX, cursorY, colWidth, valueWidth);
            const rightHeight = drawField(next, innerX + colWidth + 6, cursorY, colWidth, valueWidth);
            cursorY += Math.max(leftHeight, rightHeight);
            i += 1;
        } else {
            cursorY += drawField(field, innerX, cursorY, colWidth, valueWidth);
        }
    }

    return y + cardHeight + CARD_GAP;
};

export const exportPaymentsToPdf = (
    payments: Record<string, any>[],
    filters: PaymentExportFilters,
) => {
    const rows = payments.map((payment) => mapPaymentToExportRow(payment, true));
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PDF_MARGIN * 2;

    let y = drawPdfSummary(doc, filters, rows.length);

    rows.forEach((row, index) => {
        y = drawPaymentCard(doc, row, index, y, contentWidth);
    });

    doc.save(getExportFileName('pdf'));
};

export const exportPaymentsToExcel = (
    payments: Record<string, any>[],
    filters: PaymentExportFilters,
) => {
    const rows = payments.map(mapPaymentToExportRow);
    const sheetData = [
        ...buildFilterSummary(filters, rows.length),
        Array.from(PAYMENT_EXPORT_HEADERS),
        ...rowsToMatrix(rows),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
    XLSX.writeFile(workbook, getExportFileName('xlsx'));
};

export const exportPaymentsToWord = async (
    payments: Record<string, any>[],
    filters: PaymentExportFilters,
) => {
    const rows = payments.map(mapPaymentToExportRow);
    const summaryLines = buildFilterSummary(filters, rows.length);

    const summaryParagraphs = summaryLines.map((line) => {
        if (line.length === 1) {
            return new Paragraph({
                children: [new TextRun({ text: line[0], bold: true, size: 28 })],
                spacing: { after: 120 },
            });
        }
        return new Paragraph({
            children: [
                new TextRun({ text: `${line[0]}: `, bold: true, size: 20 }),
                new TextRun({ text: line[1] || '', size: 20 }),
            ],
            spacing: { after: 80 },
        });
    });

    const headerRow = new TableRow({
        children: PAYMENT_EXPORT_HEADERS.map(
            (header) =>
                new TableCell({
                    width: { size: 11, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: header, bold: true, size: 16 })],
                        }),
                    ],
                }),
        ),
    });

    const dataRows = rowsToMatrix(rows).map(
        (row) =>
            new TableRow({
                children: row.map(
                    (cell) =>
                        new TableCell({
                            width: { size: 11, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: String(cell), size: 14 })],
                                }),
                            ],
                        }),
                ),
            }),
    );

    const document = new Document({
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            orientation: PageOrientation.LANDSCAPE,
                        },
                    },
                },
                children: [
                    ...summaryParagraphs,
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [headerRow, ...dataRows],
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(document);
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = getExportFileName('docx');
    link.click();
    URL.revokeObjectURL(url);
};
