import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import { useState, useEffect } from "react"
// import { useParams } from "next/navigation"
import { downloadQuotationPdf, getQuotationByEEnquiryId, getQuotationHistory, sendQuotation } from "../../../api"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import SuccessAlert from "../../common/ShowSuccess";
import QuotationFooter from "./Footer";
import QuotationHeader from "./Header";
import QuotationHistory from "./History";

interface Term {
    text: string;
}
interface QuotationData {
    _id: string
    quotationId: string
    quotationStatus?: string;
    date: string
    subtotalAmount: any
    enquiry: {
        _id: string
        enquiryId: string
        hospitalName?: string
        fullAddress: string
        city: string
        district: string
        state: string
        pinCode: string
        contactPerson: string
        emailAddress: string
        contactNumber: string
        leadOwner?: {
            id?: string | null
            name?: string | null
        }
        services: Array<{
            machineType: string
            equipmentNo: string
            workTypeDetails: { workType: string; status: string; viewFile: string[] }[]
            machineModel: string
            _id: string
            totalAmount?: number
            quantity: any
        }>
        // additionalServices: Record<string, string>
        additionalServices: AdditionalServiceData[];
        specialInstructions: string

    },
    assignedEmployee?: {
        name?: string
        phone?: any
    } | null,
    from: {
        name: string
        email: string
        _id: any
    }
    discount: number
    total: number
    gstAmount: any
    gstRate: any
    subtotal: any
    // termsAndConditions: string[]
    termsAndConditions: Array<string | Term>
    isUploaded: any
    pdfUrl?: string;
}

interface AdditionalServiceData {
    _id: string;
    name: string;
    description?: string;
    totalAmount?: number;
}

interface Service {
    machineType: string
    equipmentNo: string
    workTypeDetails: { workType: string; status: string; viewFile: string[] }[]
    machineModel: string
    _id: string
    totalAmount?: number
    quantity: any
}


const ViewQuotation: React.FC = () => {
    const params = useParams()
    const id = params.id as string
    const pdfRef = useRef<HTMLDivElement>(null); // 👈 ref to capture PDF
    const navigate = useNavigate();

    const [quotationData, setQuotationData] = useState<QuotationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSavingPdf, setIsSavingPdf] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [quotationIdForHistory, setQuotationIdForHistory] = useState<string | null>(null);
    const formatNumber = (num: any): string => {
        return Number(num).toFixed(2);
    };

    const numberToWords = (amount: number): string => {
        const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"];
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

        if (amount === 0) return "Zero Rupees Only";

        const wholePart = Math.floor(amount);
        const paisaPart = Math.round((amount - wholePart) * 100);

        const convertBelow1000 = (n: number): string => {
            if (n === 0) return "";
            if (n < 20) return ones[n] + " ";
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "") + " ";
            return ones[Math.floor(n / 100)] + " Hundred " + convertBelow1000(n % 100);
        };

        const convertToWords = (n: number): string => {
            if (n === 0) return "";
            if (n < 1000) return convertBelow1000(n);
            if (n < 100000) return convertBelow1000(Math.floor(n / 1000)) + "Thousand " + convertBelow1000(n % 1000);
            if (n < 10000000) return convertBelow1000(Math.floor(n / 100000)) + "Lakh " + convertToWords(n % 100000);
            return convertBelow1000(Math.floor(n / 10000000)) + "Crore " + convertToWords(n % 10000000);
        };

        let result = convertToWords(wholePart).trim() + " Rupees";
        if (paisaPart > 0) result += " and " + convertToWords(paisaPart).trim() + " Paise";
        result += " Only";
        return result;
    };

    useEffect(() => {
        const fetchQuotationData = async () => {
            try {
                setLoading(true)
                const response = await getQuotationByEEnquiryId(id)
                console.log("🚀 ~ fetchQuotationData ~ response:", response)
                setQuotationData(response.data.data)
                setError(null)
            } catch (err: any) {
                setError(err.message || "Failed to fetch quotation data")
                console.error("Error fetching quotation:", err)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchQuotationData()
        }
    }, [id])
    useEffect(() => {
        if (!quotationData?._id) return;

        const fetchHistory = async () => {
            try {
                setHistoryLoading(true);
                const res = await getQuotationHistory(quotationData._id);
                console.log("🚀 ~ fetchHistory ~ res:", res)
                setHistory(res.data ?? []);
                setHistoryError(null);
            } catch (err: any) {
                setHistoryError(err.message || "Failed to load history");
                console.error(err);
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchHistory();
    }, [quotationData?._id]);
    const handleEditQuotation = () => {
        // Redirect to edit page with the same ID
        navigate(`/quotation/edit/${id}`);
    };
    const handleSaveAsPdf = async () => {
        if (!quotationData || !pdfRef.current) return;

        try {
            setIsSavingPdf(true)  // ✅ show loader

            // const opt = {
            //     margin: 0.2,
            //     filename: `Quotation_${quotationData.quotationId}.pdf`,
            //     image: { type: "jpeg" as const, quality: 0.98 },
            //     html2canvas: { scale: 2 },
            //     jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
            // };
            // const opt = {
            //     margin: 0.2,
            //     filename: `Quotation_${quotationData.quotationId}.pdf`,
            //     image: { type: "jpeg" as const, quality: 0.98 },
            //     html2canvas: { scale: 2 },
            //     jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
            // };
            const opt = {
                margin: [0.4, 0.45, 0.45, 0.45] as [number, number, number, number],
                filename: `Quotation_${quotationData.quotationId}.pdf`,
                image: { type: "jpeg" as const, quality: 0.95 },
                html2canvas: { scale: 1.5, useCORS: true },
                jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
                pagebreak: {
                    mode: ["css", "legacy"],
                    before: ".pdf-page-break",
                    avoid: [".no-break", ".pdf-section", ".terms-pdf-section", ".pdf-row-avoid", "img"],
                },
            };


            const worker = html2pdf().set(opt).from(pdfRef.current).toPdf();
            const pdf = await worker.get("pdf");
            const blob = pdf.output("blob");

            const file = new File([blob], `Quotation_${quotationData.quotationId}.pdf`, {
                type: "application/pdf",
            });

            // ✅ Use correct IDs
            const hospitalId = quotationData.from._id; // this is the hospital's _id
            const quotationId = quotationData._id;     // this is the quotation's _id

            const res = await downloadQuotationPdf(
                quotationId,
                hospitalId,
                file
            );

            // Update local state to reflect isUploaded: true
            // if (res.success) {
            //     if (res.quotation) {
            //         setQuotationData({ ...res.quotation, isUploaded: true, pdfUrl: res.pdfUrl });
            //     } else {
            //         setQuotationData({ ...quotationData, isUploaded: true, pdfUrl: res.pdfUrl });
            //     }
            //     setSuccessMessage(`PDF uploaded successfully!`);
            // } else {
            //     setSuccessMessage(`PDF uploaded successfully!`);
            // }


            // if (res.success) {
            //     if (res.quotation) {
            //         setQuotationData({ ...res.quotation, isUploaded: true, pdfUrl: res.pdfUrl });
            //     } else {
            //         setQuotationData({ ...quotationData, isUploaded: true, pdfUrl: res.pdfUrl });
            //     }
            //     setSuccessMessage(`PDF uploaded successfully!`);
            // } else {
            //     setSuccessMessage(`PDF uploaded successfully!`);
            // }
            if (res.success) {
                setQuotationData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        isUploaded: true,
                        pdfUrl: res.pdfUrl || prev.pdfUrl,
                    };
                });

                setSuccessMessage(`PDF uploaded successfully!`);
            } else {
                setSuccessMessage(`PDF uploaded successfully!`);
            }

        } catch (err: any) {
            console.error("PDF generation/upload error:", err);
            // alert("❌ Failed to generate or upload PDF");
            setSuccessMessage("❌ Failed to generate or upload PDF");

        } finally {
            setIsSavingPdf(false) // ✅ hide loader
        }
    };
    const handleSendQuotation = async () => {
        if (!quotationData) return;
        try {
            setIsSending(true);

            const hospitalId = quotationData.from._id; // hospital _id ✅
            const enquiryId = quotationData.enquiry._id; // <-- here you must use ObjectId
            const quotationId = quotationData._id; // quotation _id ✅

            const pdfUrl = await sendQuotation(hospitalId, enquiryId, quotationId);
            setSuccessMessage(`✅ Quotation sent successfully!`);
        } catch (err: any) {
            console.error("Error sending quotation:", err);
            setSuccessMessage("❌ Failed to send quotation");
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading quotation...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    if (!quotationData) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">No quotation data found</p>
            </div>
        )
    }

    const assignedEmployeeName =
        quotationData.assignedEmployee?.name ||
        quotationData.enquiry?.leadOwner?.name ||
        quotationData.enquiry?.contactPerson ||
        "-";
    const assignedEmployeePhone = quotationData.assignedEmployee?.phone || "-";

    const machineTypes = [
        ...new Set(
            (quotationData?.enquiry?.services || [])
                .map((s) => s.machineType)
                .filter(Boolean)
        ),
    ].join(", ");

    const additionalServiceNames = (quotationData?.enquiry?.additionalServices || [])
        .map((s) => s?.name)
        .filter(Boolean)
        .join(", ");

    const toAddress = [
        quotationData.enquiry.hospitalName,
        quotationData.enquiry.fullAddress,
        quotationData.enquiry.city,
        quotationData.enquiry.district,
        `${quotationData.enquiry.state}-${quotationData.enquiry.pinCode}`,
    ]
        .filter(Boolean)
        .join(", ");

    const quotationDescription = [
        quotationData.quotationId,
        machineTypes
            ? `Quotation for the QA test/s for ${machineTypes}`
            : "Quotation for the QA test/s",
        additionalServiceNames
            ? `and additional services ${additionalServiceNames}`
            : null,
        toAddress ? `for ${toAddress}` : null,
    ]
        .filter(Boolean)
        .join(" ");
    // const aitems =
    //     quotationData?.enquiry?.services?.map((service, index) => ({
    //         type: "A",
    //         id: index + 1,
    //         title: service.machineType,
    //         description: service.workTypeDetails?.map(w => w.workType).join(" + ") || "",
    //         quantity: service.equipmentNo,
    //         price: "100000",
    //         amount: (Number.parseInt(service.equipmentNo) * 100000).toString(),
    //     })) || []

    const aitems =
        quotationData?.enquiry?.services?.map((service: Service, index) => ({
            type: "A",
            id: index + 1,
            title: service.machineType,
            description: service.workTypeDetails?.map((w: any) => w.workType).join(" + ") || "",
            quantity: service.quantity?.toString() ?? "1",
            price: formatNumber(service.totalAmount ?? 0),
            amount: formatNumber(service.totalAmount ?? 0),
        })) || []

    // Split machines across PDF pages so overflow continues cleanly with gap
    const MACHINES_FIRST_PAGE = 5;
    const MACHINES_PER_NEXT_PAGE = 12;
    const machineChunks: typeof aitems[] = [];
    if (aitems.length > 0) {
        machineChunks.push(aitems.slice(0, MACHINES_FIRST_PAGE));
        for (let i = MACHINES_FIRST_PAGE; i < aitems.length; i += MACHINES_PER_NEXT_PAGE) {
            machineChunks.push(aitems.slice(i, i + MACHINES_PER_NEXT_PAGE));
        }
    }


    // const bitems = quotationData?.enquiry?.additionalServices
    //     ? Object.entries(quotationData.enquiry.additionalServices)
    //         .filter(([key, value]) => value !== "")
    //         .map(([key, value], index) => ({
    //             type: "B",
    //             id: index + 1,
    //             title: key,
    //             description: value || "Additional service",
    //             quantity: "1",
    //             price: "2000", // You may need to add pricing logic
    //             amount: "2000",
    //         }))
    //     : []

    // const bitems = quotationData?.enquiry?.additionalServices?.map(
    //     (service: AdditionalServiceData, index: number) => ({
    //         type: "B",
    //         id: index + 1,
    //         title: service.name,
    //         description: service.description || "Additional service",
    //         quantity: "1",
    //         price: (service.totalAmount ?? 0).toString(),
    //         amount: (service.totalAmount ?? 0).toString(),
    //     })
    // ) || []
    const bitems =
        quotationData?.enquiry?.additionalServices
            ?.filter((service): service is AdditionalServiceData => Boolean(service))
            ?.map((service, index) => ({
            type: "B",
            id: index + 1,
            title: service.name || "-",
            description: service.description,
            quantity: "1",
            price: formatNumber(service.totalAmount ?? 0),
            amount: formatNumber(service.totalAmount ?? 0),
        })) || []

    const acolumns = [
        // {
        //     key: "type",
        //     label: "A",
        // },
        {
            key: "id",
            label: "S.NO",
        },
        {
            key: "title",
            label: "TYPE OF MACHINE",
        },
        {
            key: "description", // Changed from services
            label: "DESCRIPTION",
        },
        {
            key: "quantity",
            label: "QTY",
            class: "ltr:text-right rtl:text-left",
        },
        // {
        //     key: "price",
        //     label: "RATE",
        //     class: "ltr:text-right rtl:text-left",
        // },
        {
            key: "amount",
            label: "TOTAL",
            class: "ltr:text-right rtl:text-left",
        },
    ]
    const bcolumns = [
        // {
        //     key: "type",
        //     label: "B",
        // },
        {
            key: "id",
            label: "S.NO",
        },
        {
            key: "title",
            label: "ADDITIONAL SERVICES",
        },
        {
            key: "description", // Changed from services
            label: "DESCRIPTION",
        },
        // {
        //     // key: "quantity",
        //     label: "QTY",
        //     class: "ltr:text-right rtl:text-left",
        // },
        // {
        //     key: "price",
        //     label: "RATE",
        //     class: "ltr:text-right rtl:text-left",
        // },
        {
            key: "amount",
            label: "TOTAL",
            class: "ltr:text-right rtl:text-left",
        },
    ]

    const discount = quotationData.discount; // 600
    const gstRate = quotationData.gstRate; // 600

    const travelCost: number = 0

    const aitemsTotal: number = aitems.reduce((sum, item) => {
        const amount = Number.parseFloat(item.amount) || 0
        return sum + amount
    }, 0)

    const bitemsTotal: number = bitems.reduce((sum, item) => {
        const amount = Number.parseFloat(item.amount) || 0
        return sum + amount
    }, 0)

    // const subtotal = quotationData.subtotalAmount; // 6000
    const subtotal = Number(
        quotationData.subtotal ??
        quotationData.subtotalAmount ??
        aitemsTotal + bitemsTotal
    );
    const discountAmount: number = (subtotal * discount) / 100
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = Number(
        quotationData.gstAmount ??
        ((taxableAmount * (gstRate || 0)) / 100)
    );
    const totalAmount = Number(quotationData.total ?? (taxableAmount + gstAmount));

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
    }

    const quotationPdfUrl = quotationData?.pdfUrl || "";

    const historySeen = new Set<string>();
    const uniqueHistory = (history || []).filter((rec: any) => {
        const key =
            rec?._id ||
            `${rec?.status || ""}|${rec?.date || ""}|${rec?.pdfUrl || ""}`;
        if (historySeen.has(key)) return false;
        historySeen.add(key);
        return true;
    });

    return (
        <div className="w-full min-h-screen bg-gray-50 px-8 absolute top-0 left-0 z-50 lg:px-[15%]">
            <div ref={pdfRef}>
                {/* <div className="max-w-6xl mx-auto rounded-lg px-4 bg-white w-[50rem]"> */}
                <div
                    className="mx-auto px-6 pb-5 pt-0 bg-white"
                    style={{ width: "793px", maxWidth: "100%", boxSizing: "border-box" }} // ~A4 portrait width at 96 DPI
                >
                    <style>{`
                        .pdf-section, .no-break {
                            break-inside: avoid;
                            page-break-inside: avoid;
                        }
                        .items-table {
                            break-inside: auto;
                            page-break-inside: auto;
                            width: 100%;
                        }
                        .items-table thead {
                            display: table-header-group;
                        }
                        .items-table tbody {
                            display: table-row-group;
                        }
                        .items-table tr.pdf-row-avoid {
                            break-inside: avoid;
                            page-break-inside: avoid;
                        }
                        .pdf-page-break {
                            break-before: page;
                            page-break-before: always;
                            display: block;
                            height: 0;
                            margin: 0;
                            padding: 0;
                            border: none;
                        }
                        .pdf-continued-gap {
                            padding-top: 28px;
                        }
                        .terms-pdf-section {
                            break-inside: avoid;
                            page-break-inside: avoid;
                            padding-top: 36px;
                            margin-top: 8px;
                        }
                    `}</style>

                    {/* Header */}
                    <QuotationHeader
                        date={quotationData.date}
                        enquiry={quotationData.enquiry}
                        assignedEmployeeName={assignedEmployeeName}
                        assignedEmployeePhone={assignedEmployeePhone}
                        quotationDescription={quotationDescription}
                        formatDate={formatDate}
                    />

                    {/* Items Tables — overflow machines continue on next page with gap */}
                    <div className="mt-1">
                        {machineChunks.map((chunk, chunkIndex) => {
                            const startIndex = chunkIndex === 0
                                ? 0
                                : MACHINES_FIRST_PAGE + (chunkIndex - 1) * MACHINES_PER_NEXT_PAGE;
                            return (
                                <div key={`machine-chunk-${chunkIndex}`}>
                                    {chunkIndex > 0 && <div className="pdf-page-break" />}
                                    <div className={chunkIndex > 0 ? "pdf-continued-gap" : ""}>
                                        <table className="items-table w-full text-xs mb-1 border border-black border-collapse">
                                            <thead>
                                                <tr className="pdf-row-avoid">
                                                    {acolumns.map((col) => (
                                                        <th
                                                            key={col.key}
                                                            className={`${col.class} px-0.5 py-0 font-extrabold text-[.6rem] border border-black`}
                                                            style={{ backgroundColor: "#2563eb", color: "#ffffff", lineHeight: "0.6rem", height: "10px" }}
                                                        >
                                                            {col.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {chunk.map((item, i) => (
                                                    <tr key={`${chunkIndex}-${i}`} className="pdf-row-avoid" style={{ height: "9px" }}>
                                                        <td className="px-0.5 py-0 text-[.6rem] border border-black" style={{ lineHeight: "0.6rem" }}>{startIndex + i + 1}</td>
                                                        <td className="px-0.5 py-0 text-[.6rem] border border-black" style={{ lineHeight: "0.6rem" }}>{item.title}</td>
                                                        <td className="px-0.5 py-0 text-[.6rem] border border-black" style={{ lineHeight: "0.6rem" }}>{item.description}</td>
                                                        <td className="px-0.5 py-0 text-[.6rem] text-right border border-black" style={{ lineHeight: "0.6rem" }}>{item.quantity}</td>
                                                        <td className="px-0.5 py-0 text-[.6rem] text-right border border-black" style={{ lineHeight: "0.6rem" }}>₹ {item.amount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}

                        {/* ────── B-ITEMS TABLE ────── */}
                        {bitems.length > 0 && (
                            <table className="items-table w-full text-xs mb-2 border border-black border-collapse">
                                <thead>
                                    <tr className="pdf-row-avoid">
                                        {bcolumns.map((col) => (
                                            <th
                                                key={col.key}
                                                className={`${col.class} px-0.5 py-0 font-extrabold text-[.6rem] border border-black`}
                                                style={{ backgroundColor: "#2563eb", color: "#ffffff", lineHeight: "0.6rem", height: "10px" }}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {bitems.map((item, i) => (
                                        <tr key={i} className="pdf-row-avoid" style={{ height: "9px" }}>
                                            <td className="px-0.5 py-0 text-[.6rem] border border-black" style={{ lineHeight: "0.6rem" }}>{i + 1}</td>
                                            <td className="px-0.5 py-0 text-[.6rem] border border-black" style={{ lineHeight: "0.6rem" }}>{item.title}</td>
                                            <td className="px-0.5 py-0 text-[.6rem] border border-black" style={{ lineHeight: "0.6rem" }}>{item.description}</td>
                                            <td className="px-0.5 py-0 text-[.6rem] text-right border border-black" style={{ lineHeight: "0.6rem" }}>₹ {item.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Totals — full width */}
                    <div className="mt-2 pdf-section">
                        <table className="w-full text-xs border border-black border-collapse" style={{ lineHeight: "6px" }}>
                            <tbody>
                                <tr style={{ height: "9px" }}>
                                    <td className="border border-black px-0.5 py-0 text-gray-900 font-bold text-[.6rem] w-[30%]" style={{ lineHeight: "6px" }}>Subtotal</td>
                                    <td className="border border-black px-0.5 py-0 text-[.7rem] font-bold text-right" style={{ lineHeight: "6px" }}>₹{formatNumber(subtotal)}</td>
                                </tr>
                                <tr style={{ height: "9px" }}>
                                    <td className="border border-black px-0.5 py-0 text-gray-900 font-bold text-[.6rem]" style={{ lineHeight: "6px" }}>Discount</td>
                                    <td className="border border-black px-0.5 py-0 text-[.7rem] font-bold text-right" style={{ lineHeight: "6px" }}>{formatNumber(discount)}%</td>
                                </tr>
                                <tr style={{ height: "9px" }}>
                                    <td className="border border-black px-0.5 py-0 text-gray-900 font-bold text-[.6rem]" style={{ lineHeight: "6px" }}>GST Rate</td>
                                    <td className="border border-black px-0.5 py-0 text-[.7rem] font-bold text-right" style={{ lineHeight: "6px" }}>{formatNumber(gstRate)}%</td>
                                </tr>
                                <tr style={{ height: "9px" }}>
                                    <td className="border border-black px-0.5 py-0 text-gray-900 font-bold text-[.6rem]" style={{ lineHeight: "6px" }}>GST Amount</td>
                                    <td className="border border-black px-0.5 py-0 text-[.7rem] font-bold text-right" style={{ lineHeight: "6px" }}>₹{formatNumber(gstAmount)}</td>
                                </tr>
                                <tr style={{ height: "9px" }}>
                                    <td className="border border-black px-0.5 py-0 text-gray-900 font-bold text-[.6rem]" style={{ lineHeight: "6px" }}>TOTAL</td>
                                    <td className="border border-black px-0.5 py-0 text-[.7rem] font-bold text-right" style={{ lineHeight: "6px" }}>₹ {formatNumber(totalAmount)}</td>
                                </tr>
                                <tr style={{ height: "10px" }}>
                                    <td className="border border-black px-0.5 py-0 text-gray-900 font-bold text-[.6rem] whitespace-nowrap" style={{ lineHeight: "6px" }}>
                                        Total Amount (in words)
                                    </td>
                                    <td className="border border-black px-0.5 py-0 text-[.6rem] font-bold uppercase" style={{ lineHeight: "6px" }}>
                                        {numberToWords(totalAmount)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <br />
                    <hr />

                    <div className="terms-pdf-section">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Terms & Conditions:</h4>
                        <div
                            className="mt-1 space-y-1 text-gray-700 dark:text-gray-300 text-[.65rem] font-bold"
                            style={{ lineHeight: "1.25rem" }}
                        >
                            {quotationData.termsAndConditions.map((term, index) => {
                                const text = typeof term === "string" ? term : term?.text ?? "";
                                return (
                                    <p key={index} className={text.includes("GST") ? "text-green-600" : ""}>
                                        - {text}
                                    </p>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer — matches reference: signature | QR, then 3-col bank row */}
                    <QuotationFooter />

                    <div className="mt-3 text-center no-break text-[.6rem]" style={{ lineHeight: "12px" }}>
                        <p>
                            For any enquiry contact us{" "}
                            <a href="#" className="text-blue-800">
                                business.quote@antesobiomedicalopc.com / antesobiomedical@gmail.com
                            </a>
                        </p>
                        <p>Feel free to call us & Thank you for your enquiry</p>
                    </div>
                </div>
            </div>

            {successMessage && (
                <SuccessAlert
                    message={successMessage}
                    onClose={() => setSuccessMessage(null)}
                />
            )}

            <div className="flex justify-end my-4 space-x-2">
                {/* Show Edit button only when status is Rejected */}
                {quotationData.quotationStatus === "Rejected" && (
                    <button
                        onClick={handleEditQuotation}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center justify-center"
                    >
                        Edit Quotation
                    </button>
                )}

                {/* Show Save & Upload only if status is "Created" and not uploaded */}
                {quotationData.quotationStatus === "Created" && !quotationData?.isUploaded && (
                    <button
                        onClick={handleSaveAsPdf}
                        disabled={isSavingPdf}
                        className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center ${isSavingPdf ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                        {isSavingPdf ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving PDF...
                            </div>
                        ) : (
                            "Save & Upload Quotation PDF"
                        )}
                    </button>
                )}

                {/* Show Send only if quotation has a PDF and status is Created */}
                {/* {quotationData.quotationStatus === "Created" && quotationData.pdfUrl && (
                    <button
                        onClick={handleSendQuotation}
                        disabled={isSending}
                        className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center ${isSending ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                        {isSending ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Sending...
                            </div>
                        ) : (
                            "Send Quotation"
                        )}
                    </button>
                )} */}

                {/* Show Reshare only if status is Rejected */}
                {/* {quotationData.quotationStatus === "Rejected" && quotationData.pdfUrl && (
                    <button
                        onClick={handleSendQuotation}
                        disabled={isSending}
                        className={`bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 flex items-center justify-center ${isSending ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                        {isSending ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Resharing...
                            </div>
                        ) : (
                            "Reshare Quotation"
                        )}
                    </button>
                )} */}
            </div>
            <QuotationHistory
                historyLoading={historyLoading}
                historyError={historyError}
                uniqueHistory={uniqueHistory}
                quotationPdfUrl={quotationPdfUrl}
            />
        </div>
    )
}

export default ViewQuotation