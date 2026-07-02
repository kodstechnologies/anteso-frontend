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
} from 'docx';
import { format } from 'date-fns';

export const formatDateDDMMYYYY = (value: string | Date | null | undefined): string => {
    if (!value) return '-';

    const date =
        value instanceof Date
            ? value
            : (() => {
                const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (isoMatch) {
                    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
                }
                return new Date(value);
            })();

    if (Number.isNaN(date.getTime())) return String(value);
    return format(date, 'dd-MM-yyyy');
};

const formatGeneratedAt = () => format(new Date(), 'dd-MM-yyyy HH:mm');

export type AttendanceSummaryExportData = {
    employee: {
        empId: string;
        name: string;
        email?: string;
        phone?: string;
        designation?: string;
        department?: string;
        dateOfJoining?: string;
        workingDays?: number | string;
    };
    period: string;
    dailyAttendance: Array<{ date: string; status: string }>;
};

const getExportFileName = (employeeName: string, extension: string) => {
    const safeName = employeeName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'employee';
    const dateStamp = format(new Date(), 'dd-MM-yyyy');
    return `attendance-summary-${safeName}-${dateStamp}.${extension}`;
};

const buildEmployeeRows = (data: AttendanceSummaryExportData) => [
    ['Employee ID', data.employee.empId || '-'],
    ['Employee Name', data.employee.name || '-'],
    ['Email', data.employee.email || '-'],
    ['Phone', data.employee.phone || '-'],
    ['Designation', data.employee.designation || '-'],
    ['Department', data.employee.department || '-'],
    ['Join Date', data.employee.dateOfJoining || '-'],
    ['Period', data.period],
];

const buildDailyRows = (data: AttendanceSummaryExportData) => {
    const rows: string[][] = [[''], ['Daily Attendance'], ['Date', 'Status']];
    if (data.dailyAttendance.length === 0) {
        rows.push(['No daily records', '-']);
    } else {
        data.dailyAttendance.forEach(({ date, status }) => {
            rows.push([date, status]);
        });
    }
    return rows;
};

const buildSheetData = (data: AttendanceSummaryExportData) => [
    ['Attendance Summary Report'],
    ['Generated At', formatGeneratedAt()],
    [''],
    ...buildEmployeeRows(data),
    ...buildDailyRows(data),
];

const drawPdfSection = (doc: jsPDF, title: string, rows: string[][], startY: number) => {
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = startY;

    if (y > 250) {
        doc.addPage();
        y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    rows.forEach(([label, value]) => {
        if (y > 280) {
            doc.addPage();
            y = margin;
        }
        doc.text(`${label}: ${value}`, margin, y);
        y += 6;
    });

    return y + 4;
};

export const exportAttendanceSummaryToPdf = (data: AttendanceSummaryExportData) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Attendance Summary Report', margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated At: ${formatGeneratedAt()}`, margin, 28);

    let y = drawPdfSection(
        doc,
        'Employee Details',
        [
            ['Employee ID', data.employee.empId || '-'],
            ['Name', data.employee.name || '-'],
            ['Email', data.employee.email || '-'],
            ['Phone', data.employee.phone || '-'],
            ['Designation', data.employee.designation || '-'],
            ['Department', data.employee.department || '-'],
            ['Join Date', data.employee.dateOfJoining || '-'],
            ['Period', data.period],
        ],
        36,
    );

    if (data.dailyAttendance.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        if (y > 250) {
            doc.addPage();
            y = margin;
        }
        doc.text('Daily Attendance', margin, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        data.dailyAttendance.forEach(({ date, status }) => {
            if (y > 280) {
                doc.addPage();
                y = margin;
            }
            doc.text(`${date}: ${status}`, margin, y);
            y += 6;
        });
    }

    doc.save(getExportFileName(data.employee.name, 'pdf'));
};

export const exportAttendanceSummaryToExcel = (data: AttendanceSummaryExportData) => {
    const sheetData = buildSheetData(data);
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Summary');
    XLSX.writeFile(workbook, getExportFileName(data.employee.name, 'xlsx'));
};

const buildWordTable = (headers: string[], rows: string[][]) =>
    new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: headers.map(
                    (header) =>
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: header, bold: true, size: 20 })],
                                }),
                            ],
                        }),
                ),
            }),
            ...rows.map(
                (row) =>
                    new TableRow({
                        children: row.map(
                            (cell) =>
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: cell, size: 18 })],
                                        }),
                                    ],
                                }),
                        ),
                    }),
            ),
        ],
    });

export const exportAttendanceSummaryToWord = async (data: AttendanceSummaryExportData) => {
    const dailyRows = data.dailyAttendance.length
        ? data.dailyAttendance.map(({ date, status }) => [date, status])
        : [['No daily records', '-']];

    const document = new Document({
        sections: [
            {
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: 'Attendance Summary Report', bold: true, size: 32 })],
                        spacing: { after: 120 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Generated At: ${formatGeneratedAt()}`,
                                size: 20,
                            }),
                        ],
                        spacing: { after: 160 },
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: 'Employee Details', bold: true, size: 24 })],
                        spacing: { after: 80 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Employee ID: ${data.employee.empId || '-'}`, size: 20 }),
                        ],
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `Name: ${data.employee.name || '-'}`, size: 20 })],
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `Email: ${data.employee.email || '-'}`, size: 20 })],
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `Department: ${data.employee.department || '-'}`, size: 20 })],
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `Period: ${data.period}`, size: 20 })],
                        spacing: { after: 160 },
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: 'Daily Attendance', bold: true, size: 24 })],
                        spacing: { after: 80 },
                    }),
                    buildWordTable(['Date', 'Status'], dailyRows),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(document);
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = getExportFileName(data.employee.name, 'docx');
    link.click();
    URL.revokeObjectURL(url);
};

export const buildAttendanceExportData = (
    employeeDetails: any,
    attendanceMap: Record<string, string>,
    periodDate: Date = new Date(),
): AttendanceSummaryExportData => {
    const dailyAttendance = Object.entries(attendanceMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, status]) => ({
            date: formatDateDDMMYYYY(date),
            status,
        }));

    return {
        employee: {
            empId: employeeDetails?.empId || '-',
            name: employeeDetails?.name || '-',
            email: employeeDetails?.email,
            phone: employeeDetails?.phone,
            designation: employeeDetails?.designation,
            department: employeeDetails?.department,
            dateOfJoining: employeeDetails?.dateOfJoining
                ? formatDateDDMMYYYY(employeeDetails.dateOfJoining)
                : '-',
            workingDays: employeeDetails?.workingDays,
        },
        period: format(periodDate, 'MMMM yyyy'),
        dailyAttendance,
    };
};
