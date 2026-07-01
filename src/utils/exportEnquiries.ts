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

export type EnquiryExportRow = {
    enquiryId: string;
    createdAt: string;
    hospitalName: string;
    fullAddress: string;
    city: string;
    district: string;
    state: string;
    pinCode: string;
    branch: string;
    contactPerson: string;
    emailAddress: string;
    contactNumber: string;
    designation: string;
    quotationStatus: string;
    remark: string;
};

export type EnquiryExportFilters = {
    city?: string;
    district?: string;
    pinCode?: string;
    branch?: string;
    emailAddress?: string;
    contactNumber?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
};

const ENQUIRY_EXPORT_HEADERS = [
    'ENQ ID',
    'Created At',
    'Hospital Name',
    'Full Address',
    'City',
    'District',
    'State',
    'Pincode',
    'Branch Name',
    'Contact Person',
    'Email',
    'Phone',
    'Designation',
    'Quotation',
    'Remark',
] as const;

export const mapEnquiryToExportRow = (item: Record<string, any>): EnquiryExportRow => ({
    enquiryId: item.enquiryID || item.enquiryId || '-',
    createdAt: formatCreatedAtDisplay(item.createdAt),
    hospitalName: item.hName || item.hospitalName || '-',
    fullAddress: item.fullAddress || '-',
    city: item.city || '-',
    district: item.district || '-',
    state: item.state || '-',
    pinCode: item.pincode || item.pinCode || '-',
    branch: item.branch || '-',
    contactPerson: item.contactperson || item.contactPerson || '-',
    emailAddress: item.email || item.emailAddress || '-',
    contactNumber: item.phone || item.contactNumber || '-',
    designation: item.designation || '-',
    quotationStatus: item.quotation || item.quotationStatus || '-',
    remark: item.remark || item.quotation?.rejectionRemark || '-',
});

const rowsToMatrix = (rows: EnquiryExportRow[]) =>
    rows.map((row) => [
        row.enquiryId,
        row.createdAt,
        row.hospitalName,
        row.fullAddress,
        row.city,
        row.district,
        row.state,
        row.pinCode,
        row.branch,
        row.contactPerson,
        row.emailAddress,
        row.contactNumber,
        row.designation,
        row.quotationStatus,
        row.remark,
    ]);

const buildFilterSummary = (filters: EnquiryExportFilters, totalRecords: number) => {
    const summary: string[][] = [
        ['Enquiries Export'],
        ['Generated At', new Date().toLocaleString('en-GB')],
        ['Total Records', String(totalRecords)],
    ];

    const appliedFilters: Array<[string, string | undefined]> = [
        ['City', filters.city],
        ['District', filters.district],
        ['Pincode', filters.pinCode],
        ['Branch Name', filters.branch],
        ['Email', filters.emailAddress],
        ['Phone', filters.contactNumber],
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
    return `enquiries-export-${dateStamp}.${extension}`;
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

const getEnquiryCardFields = (row: EnquiryExportRow): CardField[] => [
    { label: 'Created At', value: row.createdAt },
    { label: 'Quotation', value: row.quotationStatus },
    { label: 'Hospital Name', value: row.hospitalName, fullWidth: true },
    { label: 'Full Address', value: row.fullAddress, fullWidth: true },
    { label: 'City', value: row.city },
    { label: 'District', value: row.district },
    { label: 'State', value: row.state },
    { label: 'Pincode', value: row.pinCode },
    { label: 'Branch Name', value: row.branch, fullWidth: true },
    { label: 'Contact Person', value: row.contactPerson },
    { label: 'Designation', value: row.designation },
    { label: 'Email', value: row.emailAddress },
    { label: 'Phone', value: row.contactNumber },
    { label: 'Remark', value: row.remark, fullWidth: true },
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

const drawPdfSummary = (doc: jsPDF, filters: EnquiryExportFilters, totalRecords: number) => {
    const summary = buildFilterSummary(filters, totalRecords).slice(1, -1);
    let y = PDF_MARGIN;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Enquiries Export', PDF_MARGIN, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    summary.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, PDF_MARGIN, y);
        y += 5;
    });

    return y + 4;
};

const drawEnquiryCard = (
    doc: jsPDF,
    row: EnquiryExportRow,
    index: number,
    startY: number,
    contentWidth: number,
) => {
    const x = PDF_MARGIN;
    const fields = getEnquiryCardFields(row);
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
    doc.text(`Enquiry ${index + 1}  |  ENQ ID: ${row.enquiryId}`, x + CARD_PADDING, y + 6.5);
    doc.text(`Quotation: ${row.quotationStatus}`, x + contentWidth - CARD_PADDING, y + 6.5, { align: 'right' });

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

export const exportEnquiriesToPdf = (
    enquiries: Record<string, any>[],
    filters: EnquiryExportFilters,
) => {
    const rows = enquiries.map(mapEnquiryToExportRow);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - PDF_MARGIN * 2;

    let y = drawPdfSummary(doc, filters, rows.length);

    rows.forEach((row, index) => {
        y = drawEnquiryCard(doc, row, index, y, contentWidth);
    });

    doc.save(getExportFileName('pdf'));
};

export const exportEnquiriesToExcel = (
    enquiries: Record<string, any>[],
    filters: EnquiryExportFilters,
) => {
    const rows = enquiries.map(mapEnquiryToExportRow);
    const sheetData = [
        ...buildFilterSummary(filters, rows.length),
        Array.from(ENQUIRY_EXPORT_HEADERS),
        ...rowsToMatrix(rows),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Enquiries');
    XLSX.writeFile(workbook, getExportFileName('xlsx'));
};

export const exportEnquiriesToWord = async (
    enquiries: Record<string, any>[],
    filters: EnquiryExportFilters,
) => {
    const rows = enquiries.map(mapEnquiryToExportRow);
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
        children: ENQUIRY_EXPORT_HEADERS.map(
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
