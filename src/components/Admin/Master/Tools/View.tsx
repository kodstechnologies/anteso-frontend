import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FiTool, FiCalendar, FiPrinter,
} from 'react-icons/fi';
import {
    FaIdCard, FaToolbox, FaFileContract, FaHashtag, FaRegCalendarCheck,
    FaCalendarAlt,
    FaUserTie, FaHistory, FaFilePdf
} from 'react-icons/fa';
import { HiCpuChip } from 'react-icons/hi2';
import dayjs from 'dayjs';
import { getByToolId, toolHistory } from '../../../../api';
import logo from '../../../../assets/logo/anteso-logo2.png';
import nablLogo from '../../../../assets/quotationImg/NABLlogo.png';

interface ToolType {
    nomenclature: string;
    manufacture_date: string;
    model: string;
    SrNo: string;
    calibrationCertificateNo: string;
    calibrationValidTill: string;
    toolId: string;
    certificate: string;
    engineerName?: string;
    issueDate?: string;
    submitDate?: string;
    applicableMachines?: string[];
}

interface HistoryEntry {
    engineerName: string;
    issueDate: string | null;
    submitDate: string | null;
}

interface ToolHistoryData {
    engineer: { name: string } | null;
    issueDate: string | null;
    submitDate: string | null;
    isSubmitted: boolean;
    history: HistoryEntry[];
}

const formatDate = (date: string | null | undefined) =>
    date ? dayjs(date).format('DD-MM-YYYY') : '-';

const View: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [tool, setTool] = useState<ToolType | null>(null);
    const [historyData, setHistoryData] = useState<ToolHistoryData | null>(null);

    useEffect(() => {
        const fetchTool = async () => {
            if (!id) return;
            try {
                const res = await getByToolId(id);
                if (res?.data) {
                    setTool(res.data);
                }
            } catch (error) {
                console.error('Error fetching tool by ID:', error);
            }
        };

        const fetchHistory = async () => {
            if (!id) return;
            try {
                const res = await toolHistory(id);
                if (res?.data) {
                    setHistoryData(res.data);
                }
            } catch (error) {
                console.error('Error fetching tool history:', error);
            }
        };

        fetchTool();
        fetchHistory();
    }, [id]);

    const handlePrint = () => {
        if (!tool) return;

        const currentEngineer = historyData?.engineer?.name;
        const currentIssueDate = historyData?.issueDate;
        const currentSubmitDate = historyData?.submitDate;
        const isSubmitted = historyData?.isSubmitted;
        const historyEntries = historyData?.history || [];

        const resolveAssetUrl = (src: string) => {
            if (src.startsWith('http') || src.startsWith('data:')) return src;
            return `${window.location.origin}${src.startsWith('/') ? src : `/${src}`}`;
        };

        const historyRows = historyEntries.length > 0
            ? historyEntries.map((entry, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${entry.engineerName}</td>
                    <td>${formatDate(entry.issueDate)}</td>
                    <td>${formatDate(entry.submitDate)}</td>
                    <td>${entry.submitDate ? 'Submitted to office' : `Issued to ${entry.engineerName}`}</td>
                </tr>
            `).join('')
            : `<tr><td colspan="5" style="text-align:center;font-style:italic;">No assignment history recorded yet.</td></tr>`;

        const currentAssignmentBlock = currentEngineer ? `
            <div class="current-assignment">
                <p class="section-title">Current Assignment</p>
                <p>Assigned to: <strong>${currentEngineer}</strong></p>
                <p>Issue Date: <strong>${formatDate(currentIssueDate)}</strong></p>
                <p>Status: <strong>${isSubmitted && currentSubmitDate
                    ? `Submitted to office on ${formatDate(currentSubmitDate)}`
                    : `Issued to ${currentEngineer}`}</strong></p>
            </div>
        ` : '';

        const printHtml = `<!DOCTYPE html>
            <html>
                <head>
                    <title>Tool History</title>
                    <style>
                        @page { size: A4; margin: 0; }
                        html, body {
                            margin: 0;
                            padding: 20px;
                            font-family: Arial, Helvetica, sans-serif;
                            color: #000;
                            background: #fff;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
                        .header img { height: 80px; max-height: 80px; }
                        .header-center { text-align: center; padding-top: 8px; }
                        .header-center h1 { font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0; }
                        .header-right { text-align: right; }
                        .reg-text { font-size: 10px; font-weight: bold; margin-top: 4px; }
                        .tool-info { margin-bottom: 24px; font-size: 14px; line-height: 1.6; }
                        .tool-info-row { display: flex; }
                        .tool-info-label { font-weight: bold; width: 160px; flex-shrink: 0; }
                        .current-assignment { margin-bottom: 24px; padding: 12px; border: 1px solid #d1d5db; font-size: 14px; }
                        .section-title { font-weight: bold; margin: 0 0 4px; }
                        table { width: 100%; border-collapse: collapse; font-size: 13px; }
                        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                        thead tr { background-color: #f3f4f6; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <img src="${resolveAssetUrl(logo)}" alt="Anteso Biomedical" />
                            <p class="reg-text">AERB Registration No. 14-AFSXE-2148</p>
                        </div>
                        <div class="header-center">
                            <h1>Tool History</h1>
                        </div>
                        <div class="header-right">
                            <img src="${resolveAssetUrl(nablLogo)}" alt="NABL Accreditation" />
                            <p class="reg-text">NABL Accreditation No TC-9843</p>
                        </div>
                    </div>
                    <div class="tool-info">
                        <div class="tool-info-row"><span class="tool-info-label">Tool ID:</span><span>${tool.toolId}</span></div>
                        <div class="tool-info-row"><span class="tool-info-label">Tool Name:</span><span>${tool.nomenclature}</span></div>
                        <div class="tool-info-row"><span class="tool-info-label">Model:</span><span>${tool.model}</span></div>
                        <div class="tool-info-row"><span class="tool-info-label">Serial No:</span><span>${tool.SrNo}</span></div>
                        <div class="tool-info-row"><span class="tool-info-label">Calibration Valid Till:</span><span>${formatDate(tool.calibrationValidTill)}</span></div>
                        <div class="tool-info-row"><span class="tool-info-label">Print Date:</span><span>${dayjs().format('DD-MM-YYYY')}</span></div>
                    </div>
                    ${currentAssignmentBlock}
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Engineer</th>
                                <th>Issue Date</th>
                                <th>Submit Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${historyRows}</tbody>
                    </table>
                </body>
            </html>`;

        const iframe = document.createElement('iframe');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.style.position = 'fixed';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);

        const iframeWindow = iframe.contentWindow;
        const iframeDoc = iframeWindow?.document;
        if (!iframeWindow || !iframeDoc) {
            document.body.removeChild(iframe);
            return;
        }

        iframeDoc.open();
        iframeDoc.write(printHtml);
        iframeDoc.close();

        let cleanedUp = false;
        const cleanup = () => {
            if (cleanedUp) return;
            cleanedUp = true;
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        };

        const triggerPrint = () => {
            const mediaQueryList = iframeWindow.matchMedia('print');
            const onPrintChange = (event: MediaQueryListEvent) => {
                if (!event.matches) {
                    mediaQueryList.removeEventListener('change', onPrintChange);
                    cleanup();
                }
            };
            mediaQueryList.addEventListener('change', onPrintChange);
            iframeWindow.onafterprint = cleanup;

            iframeWindow.focus();
            iframeWindow.print();

            setTimeout(cleanup, 2000);
        };

        const images = Array.from(iframeDoc.images);
        if (images.length === 0) {
            triggerPrint();
            return;
        }

        let loadedCount = 0;
        const onImageDone = () => {
            loadedCount += 1;
            if (loadedCount === images.length) triggerPrint();
        };

        images.forEach((img) => {
            if (img.complete) {
                onImageDone();
            } else {
                img.onload = onImageDone;
                img.onerror = onImageDone;
            }
        });
    };

    if (!tool) return <div className="p-6 text-gray-600">Loading...</div>;

    const currentEngineer = historyData?.engineer?.name;
    const currentIssueDate = historyData?.issueDate;
    const currentSubmitDate = historyData?.submitDate;
    const isSubmitted = historyData?.isSubmitted;
    const historyEntries = historyData?.history || [];

    return (
        <>
            <div className="p-6">
                {/* Breadcrumbs */}
                <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                    <li>
                        <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                            Dashboard
                        </Link>
                    </li>
                    <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                        <Link to="/admin/tools" className="text-primary">
                            Tools
                        </Link>
                    </li>
                    <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                        <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                            View Tool
                        </Link>
                    </li>
                </ol>

                {/* Tool Details */}
                <div className="bg-white rounded-xl shadow-xl p-8">
                    <div className="mb-8 flex items-center gap-3">
                        <FiTool className="text-primary text-2xl" />
                        <h1 className="text-2xl font-bold text-gray-800">Tool Details</h1>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-700">
                        <Detail label="Tool ID" value={tool.toolId} icon={<FaIdCard />} />
                        <Detail label="Tool Name" value={tool.nomenclature} icon={<FaToolbox />} />
                        <Detail label="Model" value={tool.model} icon={<HiCpuChip />} />
                        <Detail label="Serial No" value={tool.SrNo} icon={<FaHashtag />} />
                        <Detail label="Calibration Certificate No" value={tool.calibrationCertificateNo} icon={<FaFileContract />} />
                        {tool.certificate && (
                            <Detail
                                label="Certificate"
                                value={
                                    <a
                                        href={tool.certificate}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline break-all"
                                    >
                                        View Certificate (PDF)
                                    </a>
                                }
                                icon={<FaFilePdf />}
                            />
                        )}
                        <Detail label="Calibration Valid Till" value={formatDate(tool.calibrationValidTill)} icon={<FaRegCalendarCheck />} />
                        <Detail label="Purchase Date" value={formatDate(tool.manufacture_date)} icon={<FiCalendar />} />
                    </div>
                </div>

                {/* Current Assignment Status */}
                <div className="bg-white rounded-xl shadow-xl p-8 mt-10">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaUserTie className="text-primary text-2xl" />
                            <h1 className="text-2xl font-bold text-gray-800">Current Assignment</h1>
                        </div>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <FiPrinter />
                            Print History
                        </button>
                    </div>

                    {currentEngineer ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-700">
                            <Detail label="Assigned To" value={currentEngineer} icon={<FaUserTie className="text-primary" />} />
                            <Detail label="Issue Date" value={formatDate(currentIssueDate)} icon={<FaCalendarAlt />} />
                            {isSubmitted && currentSubmitDate ? (
                                <div className="sm:col-span-2">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                                        <div className="text-xs uppercase text-green-600 font-semibold mb-1">
                                            Status
                                        </div>
                                        <div className="text-green-800 font-medium">
                                            Submitted to office on {formatDate(currentSubmitDate)}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Detail label="Status" value={`Issued to ${currentEngineer}`} icon={<FaHistory />} />
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">This tool is not currently assigned to any engineer.</p>
                    )}
                </div>

                {/* Assignment History */}
                <div className="bg-white rounded-xl shadow-xl p-8 mt-10">
                    <div className="mb-8 flex items-center gap-3">
                        <FaHistory className="text-primary text-2xl" />
                        <h1 className="text-2xl font-bold text-gray-800">Assignment History</h1>
                    </div>

                    {historyEntries.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 border-b">#</th>
                                        <th className="px-4 py-3 border-b">Engineer</th>
                                        <th className="px-4 py-3 border-b">Issue Date</th>
                                        <th className="px-4 py-3 border-b">Submit Date</th>
                                        <th className="px-4 py-3 border-b">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyEntries.map((entry, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium">{entry.engineerName}</td>
                                            <td className="px-4 py-3">{formatDate(entry.issueDate)}</td>
                                            <td className="px-4 py-3">{formatDate(entry.submitDate)}</td>
                                            <td className="px-4 py-3">
                                                {entry.submitDate ? (
                                                    <span className="text-green-700 font-medium">Submitted to office</span>
                                                ) : (
                                                    <span className="text-blue-700 font-medium">Issued to {entry.engineerName}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No assignment history recorded yet.</p>
                    )}
                </div>

                {/* Applicable Machines */}
                {tool.applicableMachines && tool.applicableMachines.length > 0 && (
                    <div className="bg-white rounded-xl shadow-xl p-8 mt-10">
                        <div className="mb-8 flex items-center gap-3">
                            <HiCpuChip className="text-primary text-2xl" />
                            <h1 className="text-2xl font-bold text-gray-800">Applicable Machines</h1>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {tool.applicableMachines.map((machine, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                    <span className="text-gray-700 font-medium">{machine}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

interface DetailProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
}

const Detail: React.FC<DetailProps> = ({ label, value, icon }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="text-xs uppercase text-gray-500 font-semibold mb-1 flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            {label}
        </div>
        <div className="text-gray-800 font-medium">{value}</div>
    </div>
);

export default View;
