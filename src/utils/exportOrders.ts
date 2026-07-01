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
import { formatCreatedAtDisplay } from './tableDateFilter';

export type OrderExportRow = {
    srfNumber: string;
    procNoOrPoNo: string;
    leadOwner: string;
    leadOwnerType: string;
    procExpiryDate: string;
    partyCodeOrSysId: string;
    hospitalName: string;
    fullAddress: string;
    city: string;
    district: string;
    state: string;
    pinCode: string;
    branchName: string;
    emailAddress: string;
    contactNumber: string;
    status: string;
    createdAt: string;
};

export type OrderExportFilters = {
    branchName?: string;
    city?: string;
    district?: string;
    emailAddress?: string;
    contactNumber?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
};

const ORDER_EXPORT_HEADERS = [
    'SRF NO',
    'PROC NO/PO NO',
    'Lead Owner',
    'Type',
    'PROC Expiry Date',
    'Party Code/ Sys ID',
    'Institute Name',
    'Address',
    'City',
    'District',
    'State',
    'Pin',
    'Branch Name',
    'Customer Email',
    'Customer Mobile',
    'Status',
    'Created At',
] as const;

const formatProcExpiryDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const mapOrderToExportRow = (order: Record<string, any>): OrderExportRow => ({
    srfNumber: order.srfNumber || '-',
    procNoOrPoNo: order.procNoOrPoNo || '-',
    leadOwner: order.leadOwner || '-',
    leadOwnerType: order.leadOwnerType || '-',
    procExpiryDate: formatProcExpiryDate(order.procExpiryDate),
    partyCodeOrSysId: order.partyCodeOrSysId || '-',
    hospitalName: order.hospitalName || '-',
    fullAddress: order.fullAddress || '-',
    city: order.city || '-',
    district: order.district || '-',
    state: order.state || '-',
    pinCode: order.pinCode || '-',
    branchName: order.branchName || '-',
    emailAddress: order.emailAddress || '-',
    contactNumber: order.contactNumber || '-',
    status: order.status || '-',
    createdAt: formatCreatedAtDisplay(order.createdAt),
});

const rowsToMatrix = (rows: OrderExportRow[]) =>
    rows.map((row) => [
        row.srfNumber,
        row.procNoOrPoNo,
        row.leadOwner,
        row.leadOwnerType,
        row.procExpiryDate,
        row.partyCodeOrSysId,
        row.hospitalName,
        row.fullAddress,
        row.city,
        row.district,
        row.state,
        row.pinCode,
        row.branchName,
        row.emailAddress,
        row.contactNumber,
        row.status,
        row.createdAt,
    ]);

const buildFilterSummary = (filters: OrderExportFilters, totalRecords: number) => {
    const summary: string[][] = [
        ['Orders Export'],
        ['Generated At', new Date().toLocaleString('en-GB')],
        ['Total Records', String(totalRecords)],
    ];

    const appliedFilters: Array<[string, string | undefined]> = [
        ['Branch Name', filters.branchName],
        ['City', filters.city],
        ['District', filters.district],
        ['Customer Email', filters.emailAddress],
        ['Customer Mobile', filters.contactNumber],
        ['From Date', filters.dateFrom],
        ['To Date', filters.dateTo],
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

const getExportFileName = (extension: string) => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    return `orders-export-${dateStamp}.${extension}`;
};

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

const getOrderCardFields = (row: OrderExportRow): CardField[] => [
    { label: 'PROC NO/PO NO', value: row.procNoOrPoNo },
    { label: 'Lead Owner', value: row.leadOwner },
    { label: 'Type', value: row.leadOwnerType },
    { label: 'PROC Expiry Date', value: row.procExpiryDate },
    { label: 'Party Code/ Sys ID', value: row.partyCodeOrSysId },
    { label: 'Institute Name', value: row.hospitalName, fullWidth: true },
    { label: 'Address', value: row.fullAddress, fullWidth: true },
    { label: 'City', value: row.city },
    { label: 'District', value: row.district },
    { label: 'State', value: row.state },
    { label: 'Pin', value: row.pinCode },
    { label: 'Branch Name', value: row.branchName, fullWidth: true },
    { label: 'Customer Email', value: row.emailAddress },
    { label: 'Customer Mobile', value: row.contactNumber },
    { label: 'Created At', value: row.createdAt, fullWidth: true },
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

const drawPdfSummary = (doc: jsPDF, filters: OrderExportFilters, totalRecords: number) => {
    const summary = buildFilterSummary(filters, totalRecords).slice(1, -1);
    let y = PDF_MARGIN;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Orders Export', PDF_MARGIN, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    summary.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, PDF_MARGIN, y);
        y += 5;
    });

    return y + 4;
};

const drawOrderCard = (
    doc: jsPDF,
    row: OrderExportRow,
    index: number,
    startY: number,
    contentWidth: number,
) => {
    const x = PDF_MARGIN;
    const fields = getOrderCardFields(row);
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

    doc.setFillColor(41, 98, 255);
    doc.roundedRect(x, y, contentWidth, CARD_HEADER_HEIGHT, 2, 2, 'F');
    doc.rect(x, y + CARD_HEADER_HEIGHT - 2, contentWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Order ${index + 1}  |  SRF NO: ${row.srfNumber}`, x + CARD_PADDING, y + 6.5);
    doc.text(`Status: ${row.status}`, x + contentWidth - CARD_PADDING, y + 6.5, { align: 'right' });

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

export const exportOrdersToPdf = (
    orders: Record<string, any>[],
    filters: OrderExportFilters,
) => {
    const rows = orders.map(mapOrderToExportRow);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PDF_MARGIN * 2;

    let y = drawPdfSummary(doc, filters, rows.length);

    rows.forEach((row, index) => {
        y = drawOrderCard(doc, row, index, y, contentWidth);
    });

    doc.save(getExportFileName('pdf'));
};

export const exportOrdersToExcel = (
    orders: Record<string, any>[],
    filters: OrderExportFilters,
) => {
    const rows = orders.map(mapOrderToExportRow);
    const sheetData = [
        ...buildFilterSummary(filters, rows.length),
        Array.from(ORDER_EXPORT_HEADERS),
        ...rowsToMatrix(rows),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, getExportFileName('xlsx'));
};

export const exportOrdersToWord = async (
    orders: Record<string, any>[],
    filters: OrderExportFilters,
) => {
    const rows = orders.map(mapOrderToExportRow);
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
        children: ORDER_EXPORT_HEADERS.map(
            (header) =>
                new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
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
                            width: { size: 8, type: WidthType.PERCENTAGE },
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
