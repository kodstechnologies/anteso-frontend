import React from "react";
import IconFile from "../../Icon/IconFile";

interface HistoryRecord {
    date?: string;
    status?: string;
    pdfUrl?: string;
    _id?: string;
}

interface QuotationHistoryProps {
    historyLoading: boolean;
    historyError: string | null;
    uniqueHistory: HistoryRecord[];
    quotationPdfUrl?: string;
}

const QuotationHistory: React.FC<QuotationHistoryProps> = ({
    historyLoading,
    historyError,
    uniqueHistory,
    quotationPdfUrl = "",
}) => {
    return (
        <div className="mt-8 flex justify-center">
            <div
                className="bg-white rounded-lg shadow-sm p-6 w-full border border-gray-200"
                style={{ maxWidth: "793px" }}
            >
                <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center justify-center">
                    <IconFile className="w-6 h-6 mr-2 text-blue-600" />
                    Quotation History
                </h3>

                {historyLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                        <p className="text-sm text-gray-500">Loading history…</p>
                    </div>
                ) : historyError ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <svg className="w-12 h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-600 font-medium">{historyError}</p>
                    </div>
                ) : uniqueHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-md">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-base text-gray-600 font-medium mb-1">No revision history available</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-md">
                        <table className="w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date & Time</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">PDF</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {uniqueHistory.map((rec, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-800">
                                            {new Date(rec.date || "").toLocaleString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                                    rec.status === "Accepted"
                                                        ? "bg-green-100 text-green-800"
                                                        : rec.status === "Rejected"
                                                          ? "bg-red-100 text-red-800"
                                                          : "bg-yellow-100 text-yellow-800"
                                                }`}
                                            >
                                                {rec.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {rec.pdfUrl || quotationPdfUrl ? (
                                                <a
                                                    href={rec.pdfUrl || quotationPdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    View PDF
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotationHistory;
