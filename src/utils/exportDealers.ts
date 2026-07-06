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
import { formatGeneratedAtForExport, getExportFileNameDateStamp } from './tableDateFilter';

export type DealerExportRow = {
    dealerId: string;
    name: string;
    address: string;
    pincode: string;
    branch: string;
    createdBy: string;
};

export type DealerExportFilters = {
    dealerId?: string;
    name?: string;
    pincode?: string;
    branch?: string;
    search?: string;
};

const DEALER_EXPORT_HEADERS = ['DEL ID', 'Dealer Name', 'Address', 'Pincode', 'Branch', 'Created By'] as const;

const formatCreatedBy = (record: Record<string, any>) => {
    const creator = record.createdBy;
    if (!creator) return '-';
    if (record.createdByModel === 'Admin' || creator.role === 'admin') {
        return `Admin (${creator.email || '-'})`;
    }
    if (creator.role === 'Employee') {
        const techType = creator.technicianType ? creator.technicianType.replace('-', ' ') : '';
        return `${techType ? `${techType} - ` : ''}(${creator.email || '-'})`;
    }
    return creator.name || creator.email || '-';
};

export const mapDealerToExportRow = (item: Record<string, any>): DealerExportRow => ({
    dealerId: item.dealerId || '-',
    name: item.name || '-',
    address: item.address || '-',
    pincode: item.pincode || item.pinCode || '-',
    branch: item.branch || '-',
    createdBy: formatCreatedBy(item),
});

const rowsToMatrix = (rows: DealerExportRow[]) =>
    rows.map((row) => [row.dealerId, row.name, row.address, row.pincode, row.branch, row.createdBy]);

const buildFilterSummary = (filters: DealerExportFilters, totalRecords: number) => {
    const summary: string[][] = [
        ['Dealers Export'],
        ['Generated At', formatGeneratedAtForExport()],
        ['Total Records', String(totalRecords)],
    ];

    const appliedFilters: Array<[string, string | undefined]> = [
        ['DEL ID', filters.dealerId],
        ['Name', filters.name],
        ['Pincode', filters.pincode],
        ['Branch', filters.branch],
        ['Search', filters.search],
    ];

    appliedFilters.forEach(([label, value]) => {
        const trimmed = String(value || '').trim();
        if (trimmed) summary.push([label, trimmed]);
    });

    summary.push(['']);
    return summary;
};

const getExportFileName = (extension: string) => `dealers-export-${getExportFileNameDateStamp()}.${extension}`;

const PDF_MARGIN = 14;
const CARD_GAP = 8;
const CARD_PADDING = 5;
const CARD_HEADER_HEIGHT = 10;
const LINE_HEIGHT = 4.8;

type CardField = { label: string; value: string; fullWidth?: boolean };

const getDealerCardFields = (row: DealerExportRow): CardField[] => [
    { label: 'Dealer Name', value: row.name, fullWidth: true },
    { label: 'Address', value: row.address, fullWidth: true },
    { label: 'Pincode', value: row.pincode },
    { label: 'Branch', value: row.branch },
    { label: 'Created By', value: row.createdBy, fullWidth: true },
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
            height += Math.max(rowHeight, Math.max(LINE_HEIGHT, nextLines.length * LINE_HEIGHT)) + 2;
            i += 1;
        } else {
            height += rowHeight + 2;
        }
    }

    return height + CARD_PADDING;
};

const drawPdfSummary = (doc: jsPDF, filters: DealerExportFilters, totalRecords: number) => {
    const summary = buildFilterSummary(filters, totalRecords).slice(1, -1);
    let y = PDF_MARGIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Dealers Export', PDF_MARGIN, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    summary.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, PDF_MARGIN, y);
        y += 5;
    });
    return y + 4;
};

const drawDealerCard = (doc: jsPDF, row: DealerExportRow, index: number, startY: number, contentWidth: number) => {
    const x = PDF_MARGIN;
    const fields = getDealerCardFields(row);
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
    doc.text(`Dealer ${index + 1}  |  DEL ID: ${row.dealerId}`, x + CARD_PADDING, y + 6.5);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    const innerX = x + CARD_PADDING;
    let cursorY = y + CARD_HEADER_HEIGHT + CARD_PADDING;
    const colWidth = (contentWidth - CARD_PADDING * 2 - 6) / 2;
    const valueWidth = colWidth - 34;
    const fullValueWidth = contentWidth - CARD_PADDING * 2 - 34;

    const drawField = (field: CardField, fieldX: number, fieldY: number, valueMaxWidth: number) => {
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
            cursorY += drawField(field, innerX, cursorY, fullValueWidth);
            continue;
        }
        const next = fields[i + 1];
        if (next && !next.fullWidth) {
            const leftHeight = drawField(field, innerX, cursorY, valueWidth);
            const rightHeight = drawField(next, innerX + colWidth + 6, cursorY, valueWidth);
            cursorY += Math.max(leftHeight, rightHeight);
            i += 1;
        } else {
            cursorY += drawField(field, innerX, cursorY, valueWidth);
        }
    }

    return y + cardHeight + CARD_GAP;
};

export const exportDealersToPdf = (dealers: Record<string, any>[], filters: DealerExportFilters) => {
    const rows = dealers.map(mapDealerToExportRow);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const contentWidth = doc.internal.pageSize.getWidth() - PDF_MARGIN * 2;
    let y = drawPdfSummary(doc, filters, rows.length);
    rows.forEach((row, index) => {
        y = drawDealerCard(doc, row, index, y, contentWidth);
    });
    doc.save(getExportFileName('pdf'));
};

export const exportDealersToExcel = (dealers: Record<string, any>[], filters: DealerExportFilters) => {
    const rows = dealers.map(mapDealerToExportRow);
    const sheetData = [
        ...buildFilterSummary(filters, rows.length),
        Array.from(DEALER_EXPORT_HEADERS),
        ...rowsToMatrix(rows),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dealers');
    XLSX.writeFile(workbook, getExportFileName('xlsx'));
};

export const exportDealersToWord = async (dealers: Record<string, any>[], filters: DealerExportFilters) => {
    const rows = dealers.map(mapDealerToExportRow);
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
        children: DEALER_EXPORT_HEADERS.map(
            (header) =>
                new TableCell({
                    width: { size: 16, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, size: 16 })] })],
                }),
        ),
    });

    const dataRows = rowsToMatrix(rows).map(
        (row) =>
            new TableRow({
                children: row.map(
                    (cell) =>
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 14 })] })],
                        }),
                ),
            }),
    );

    const document = new Document({
        sections: [
            {
                properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
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
