import React, { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { FaAngleRight, FaPlus, FaTrash } from "react-icons/fa6";
import { allEmployees, downloadQuotationPdf, getAllDealers, getQuotationByEEnquiryId, sendQuotation, updateQuotationById } from "../../../api";
import { useNavigate, useParams } from "react-router-dom";
import SuccessAlert from "../../common/ShowSuccess";
import QuotationHeader from "./Header";
import QuotationFooter from "./Footer";
// import ErrorAlert from "../../common/ShowError";

interface Term {
    text: string;
    id?: number;
}

interface EditableQuotationData {
    _id: string;
    quotationId: string;
    quotationStatus?: string;
    date: string;
    subtotalAmount: number;
    assignedEmployee: any
    dealer: any
    pdfUrl: any
    enquiry: {
        _id: string;
        enquiryId: string;
        leadOwner?: { id?: string; name?: string } ;
        hospitalName: string;
        fullAddress: string;
        city: string;
        district: string;
        state: string;
        pinCode: string;
        contactPerson: string;
        emailAddress: string;
        contactNumber: string;
        services: Array<{
            machineType: string;
            equipmentNo: string;
            workTypeDetails: { workType: string; status: string; viewFile: string[] }[];
            machineModel: string;
            _id: string;
            totalAmount: number;
            quantity: any;
        }>;
        additionalServices: AdditionalServiceData[];
        specialInstructions: string;

    };
    gstRate: any;
    gstAmount: any;
    subtotal: any
    from: {
        name: string;
        email: string;
        _id: any;
    };
    discount: number;
    total: number;
    termsAndConditions: Array<string | Term>;
    // calculations?: {
    //     subtotal: number;
    //     discountAmount: number;
    //     totalAmount: number;
    // };
    bankDetails?: {
        accountNumber: string;
        ifsc: string;
        bankName: string;
    };
    companyDetails?: {
        name: string;
        address: string;
        gstin: string;
    };
   
}

interface AdditionalServiceData {
    _id: string;
    name: string;
    description?: string;
    totalAmount?: number;
}
type OptionType = {
    _id: string;
    name: string;
    type: "Employee" | "Dealer";
    [key: string]: any; // other fields like designation, companyName
};
interface ServiceItem {
    _id: string;
    machineType: string;
    equipmentNo: string;
    workTypeDetails: { workType: string; status: string; viewFile: string[] }[];
    machineModel: string;
    totalAmount: number;
    serialNumber: any
    quantity: any
    ServiceItem: any
}

const EditQuotation: React.FC = () => {
    const params = useParams();
    const id = params.id as string;
    const pdfRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const acolumns = [
        // { key: "type", label: "Type", class: "w-10" },
        { key: "id", label: "S.No", class: "w-10" },
        { key: "title", label: "TYPE OF MACHINE", class: "w-40" },
        { key: "description", label: "DESCRIPTION", class: "w-60" },
        { key: "quantity", label: "QTY", class: "w-10 text-right" },
        { key: "amount", label: "TOTAL", class: "w-20 text-right" },
    ];

    const bcolumns = [
        // { key: "type", label: "Type", class: "w-10" },
        { key: "id", label: "S.No", class: "w-10" },
        { key: "title", label: "ADDITIONAL SERVICES", class: "w-40" },
        { key: "description", label: "DESCRIPTION", class: "w-60" },
        { key: "amount", label: "Amount", class: "w-20 text-right" },
    ];

    const [quotationData, setQuotationData] = useState<EditableQuotationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSavingPdf, setIsSavingPdf] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);

    // Editable states
    const [editableDate, setEditableDate] = useState("");
    const [editableDiscount, setEditableDiscount] = useState(0);
    const [editableServices, setEditableServices] = useState<ServiceItem[]>([]);
    const [editableAdditionalServices, setEditableAdditionalServices] = useState<AdditionalServiceData[]>([]);
    const [editableTerms, setEditableTerms] = useState<Array<string | Term>>([]);
    const [editableBankDetails, setEditableBankDetails] = useState({
        accountNumber: "",
        ifsc: "",
        bankName: "",
    });
    const [editableCompanyDetails, setEditableCompanyDetails] = useState({
        name: "",
        address: "",
        gstin: "",
    });
    const [allEmployeesList, setAllEmployeesList] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [allOptions, setAllOptions] = useState<any[]>([]);
    const [selectedOption, setSelectedOption] = useState<any>(null);
    const [options, setOptions] = useState<OptionType[]>([]);
    const formatCurrency = (value: number): string => {
        return value.toFixed(2);
    };
    // const fetchData = async () => {
    //     try {
    //         const employeeData = await allEmployees(); // assume returns array
    //         const dealerData = await getAllDealers(); // full response

    //         const dealersArray = dealerData.data.dealers; // ✅ get the array

    //         // Combine employees and dealers
    //         const options = [
    //             ...employeeData.map((emp: any) => ({ ...emp, type: "Employee" })),
    //             ...dealersArray.map((d: any) => ({ ...d, type: "Dealer" })),
    //         ];

    //         setOptions(options);
    //     } catch (err) {
    //         console.error("Failed to fetch options:", err);
    //     }
    // };

    const fetchData = async () => {
        try {
            // 1️⃣ Fetch employees and dealers
            const employeeData = await allEmployees(); // returns array of employees
            const dealerData = await getAllDealers();  // full Axios response

            const dealersArray = dealerData.data.dealers;

            // 2️⃣ Combine into a single array with 'type'
            const combinedOptions: OptionType[] = [
                ...employeeData.map((emp: any) => ({
                    ...emp,
                    type: "Employee",
                    designation: emp.role || "", // optional for display
                })),
                ...dealersArray.map((d: any) => ({
                    ...d,
                    type: "Dealer",
                    designation: d.role || "Dealer", // <-- Use role here
                })),
            ];

            // 3️⃣ Set options
            setOptions(combinedOptions);

        } catch (err) {
            console.error("Failed to fetch options:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    useEffect(() => {
        if (!quotationData) return;

        const leadOwner = quotationData?.enquiry?.leadOwner as any;
        const leadOwnerId = String(leadOwner?.id || "").trim();
        const leadOwnerName = String(
            typeof leadOwner === "string" ? leadOwner : (leadOwner?.name || "")
        )
            .trim()
            .toLowerCase();

        // Prefer lead owner as requested in Edit Quotation Details dropdown
        if (options.length > 0 && (leadOwnerId || leadOwnerName)) {
            const matchedLeadOwner = options.find((opt) => {
                const optId = String(opt?._id || "").trim();
                const optName = String(opt?.name || "").trim().toLowerCase();
                if (leadOwnerId && optId === leadOwnerId) return true;
                if (!leadOwnerId && leadOwnerName && optName === leadOwnerName) return true;
                return false;
            });

            if (matchedLeadOwner) {
                setSelectedOption(matchedLeadOwner);
                return;
            }
        }

        // Fallback to existing assigned values
        if (quotationData.assignedEmployee) {
            setSelectedOption({ ...quotationData.assignedEmployee, type: "Employee" });
        } else if (quotationData.dealer) {
            setSelectedOption({ ...quotationData.dealer, type: "Dealer" });
        }
    }, [quotationData, options]);

    useEffect(() => {
        const fetchQuotationData = async () => {
            try {
                setLoading(true);
                const response = await getQuotationByEEnquiryId(id);
                const data = response.data.data;
                console.log("🚀 ~ fetchQuotationData ~ data:", data)
                setQuotationData(data);
                setError(null);

                // Initialize editable states
                setEditableDate(data.date);
                setEditableDiscount(data.discount || 0);
                setEditableServices(data.enquiry.services || []);
                setEditableAdditionalServices(data.enquiry.additionalServices || []);
                setEditableTerms(data.termsAndConditions || []);
                setEditableBankDetails(data.bankDetails || { accountNumber: "", ifsc: "", bankName: "" });
                setEditableCompanyDetails(data.companyDetails || { name: "", address: "", gstin: "" });
            } catch (err: any) {
                setError(err.message || "Failed to fetch quotation data");
                console.error("Error fetching quotation:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchQuotationData();
        }
    }, [id]);

    const updateCalculations = () => {
        if (!quotationData) return;
        const subtotal = editableServices.reduce((sum, service) => sum + (service.totalAmount || 0), 0) +
            editableAdditionalServices.reduce((sum, service) => sum + (service.totalAmount || 0), 0);
        const discountPercentage = editableDiscount;
        const discountAmount = subtotal * (discountPercentage / 100);
        const taxableAmount = subtotal - discountAmount;
        const gstRate = quotationData.gstRate || 0;
        const gstAmount = taxableAmount * (gstRate / 100);
        const total = taxableAmount + gstAmount;
        setQuotationData((prev) => prev ? {
            ...prev,
            subtotalAmount: subtotal,
            subtotal: subtotal,
            discount: discountPercentage,
            gstAmount,
            total
        } : null);
    };

    useEffect(() => {
        updateCalculations();
    }, [editableServices, editableAdditionalServices, editableDiscount]);

    const performUpdate = async () => {
        if (!quotationData) throw new Error("No quotation data");
        const subtotal = editableServices.reduce((sum, service) => sum + (service.totalAmount || 0), 0) +
            editableAdditionalServices.reduce((sum, service) => sum + (service.totalAmount || 0), 0);
        const discountPercentage = editableDiscount;
        const discountAmount = subtotal * (discountPercentage / 100);
        const taxableAmount = subtotal - discountAmount;
        const gstRate = quotationData.gstRate || 0;
        const gstAmount = taxableAmount * (gstRate / 100);
        const total = taxableAmount + gstAmount;
        const updateData = {
            date: editableDate,
            quotationNumber: quotationData.quotationId, // Keep existing or make editable if needed

            // ✅ Only one field: assignedEmployee holds either employee or dealer
            assignedEmployee: selectedOption || null,

            items: {
                services: editableServices.map((s) => ({
                    id: s._id,
                    machineType: s.machineType,
                    equipmentNo: s.equipmentNo,
                    machineModel: s.machineModel,
                    serialNumber: s.serialNumber || "",
                    remark: s.workTypeDetails?.map((w) => w.workType).join(", ") || "",
                    totalAmount: s.totalAmount || 0,
                })),
                additionalServices: editableAdditionalServices.map((s) => ({
                    id: s._id,
                    name: s.name,
                    description: s.description || "",
                    totalAmount: s.totalAmount || 0,
                })),
            },

            calculations: {
                subtotal: subtotal,
                discountAmount: discountAmount,
                totalAmount: total,
            },

            termsAndConditions: editableTerms,
            bankDetails: editableBankDetails,
            companyDetails: editableCompanyDetails,
            discount: discountPercentage,
            total: total,
        };

        const response = await updateQuotationById(id, updateData);
        console.log("🚀 ~ Update response:", response);

        setQuotationData(response.data.data); // Update with latest data
    };

    const handleUpdateQuotation = async () => {
        try {
            setEditError(null);
            await performUpdate();
            setSuccessMessage("saved successfully");
            setTimeout(() => {
                navigate(`/admin/quotation/view/${id}`, { replace: true });
            }, 2000);
        } catch (err: any) {
            setEditError(err.message || "Failed to update quotation");
            console.error("Error updating quotation:", err);
        }
    };

    const handleSaveAndUploadPdf = async () => {
        setEditError(null);
        setIsSavingPdf(true);
        try {
            // Generate and upload PDF first using current editable states
            if (!quotationData || !pdfRef.current) throw new Error("PDF ref not ready");

            const opt = {
                margin: 0.2,
                filename: `Quotation_${quotationData.quotationId}.pdf`,
                image: { type: "jpeg" as const, quality: 0.95 },
                html2canvas: { scale: 1.5 },
                jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
                pagebreak: {
                    mode: ["css", "legacy"],
                    avoid: [".no-break", ".pdf-section", "table", "tr", "td", "th", "img", "p", "li"],
                },
            };

            const worker = html2pdf().set(opt).from(pdfRef.current).toPdf();
            const pdf = await worker.get("pdf");
            const blob = pdf.output("blob");

            const file = new File([blob], `Quotation_${quotationData.quotationId}.pdf`, {
                type: "application/pdf",
            });

            const hospitalId = quotationData.from._id;
            const quotationId = quotationData._id;

            const res = await downloadQuotationPdf(quotationId, hospitalId, file);

            // Then perform the update
            await performUpdate();

            setSuccessMessage(`Quotation saved and PDF uploaded successfully!`);
            setTimeout(() => {
                navigate(`/admin/quotation/view/${id}`, { replace: true });
            }, 2000);
        } catch (err: any) {
            console.error("Error saving and uploading:", err);
            setEditError(err.message || "Failed to save and upload PDF");
        } finally {
            setIsSavingPdf(false);
        }
    };

    const handleServiceAmountChange = (serviceId: string, amount: number) => {
        setEditableServices((prev) =>
            prev.map((service) => (service._id === serviceId ? { ...service, totalAmount: amount } : service))
        );
    };

    const handleAdditionalServiceChange = (serviceId: string, field: keyof AdditionalServiceData, value: string | number) => {
        setEditableAdditionalServices((prev) =>
            prev.map((service) =>
                service._id === serviceId ? { ...service, [field]: value } : service
            )
        );
    };

    const handleAdditionalServiceAmountChange = (serviceId: string, amount: number) => {
        setEditableAdditionalServices((prev) =>
            prev.map((service) => (service._id === serviceId ? { ...service, totalAmount: amount } : service))
        );
    };

    const addTerm = () => {
        const newTerm: Term = { id: Date.now(), text: "" };
        setEditableTerms((prev) => [...prev, newTerm]);
    };

    // const updateTerm = (index: number, text: string) => {
    //     setEditableTerms((prev) =>
    //         prev.map((term, i) => (i === index ? { ...term, text } : term))
    //     );
    // };
    const updateTerm = (index: number, text: string) => {
        setEditableTerms(prev =>
            prev.map((term, i) =>
                i === index ? (typeof term === "string" ? text : { ...term, text }) : term
            )
        );
    };


    const removeTerm = (index: number) => {
        setEditableTerms((prev) => prev.filter((_, i) => i !== index));
    };

    // const handleUpdateQuotation = async () => {
    //     if (!quotationData) return;

    //     try {
    //         setIsUpdating(true);
    //         setEditError(null);

    //         const updateData = {
    //             date: editableDate,
    //             quotationNumber: quotationData.quotationId, // Keep existing or make editable if needed
    //             assignedEmployee: quotationData.assignedEmployee, // Assume not editable
    //             items: {
    //                 services: editableServices.map((s) => ({
    //                     id: s._id,
    //                     machineType: s.machineType,
    //                     equipmentNo: s.equipmentNo,
    //                     machineModel: s.machineModel,
    //                     serialNumber: s.serialNumber || "",
    //                     remark: s.workTypeDetails?.map((w) => w.workType).join(", ") || "",
    //                     totalAmount: s.totalAmount || 0,
    //                 })),
    //                 additionalServices: editableAdditionalServices.map((s) => ({
    //                     id: s._id,
    //                     name: s.name,
    //                     description: s.description || "",
    //                     totalAmount: s.totalAmount || 0,
    //                 })),
    //             },
    //             calculations: {
    //                 subtotal: quotationData.subtotalAmount,
    //                 discountAmount: editableDiscount, // ✅ fixed number
    //                 totalAmount: quotationData.total,
    //             },

    //             termsAndConditions: editableTerms,
    //             bankDetails: editableBankDetails,
    //             companyDetails: editableCompanyDetails,
    //             discount: editableDiscount,
    //             total: quotationData.total,
    //         };

    //         const response = await updateQuotationById(id, updateData);
    //         console.log("🚀 ~ Update response:", response);

    //         setQuotationData(response.data.data); // Update with latest data
    //         setSuccessMessage("Quotation updated successfully!");
    //     } catch (err: any) {
    //         setEditError(err.message || "Failed to update quotation");
    //         console.error("Error updating quotation:", err);
    //     } finally {
    //         setIsUpdating(false);
    //     }
    // };
    const handleSendQuotation = async () => {
        if (!quotationData) return;
        try {
            setIsSending(true);

            const hospitalId = quotationData.from._id;
            const enquiryId = quotationData.enquiry._id;
            const quotationId = quotationData._id;

            const pdfUrl = await sendQuotation(hospitalId, enquiryId, quotationId);
            console.log("🚀 ~ handleSendQuotation ~ pdfUrl:", pdfUrl)
            setSuccessMessage(`Quotation sent successfully! URL: ${pdfUrl}`);
        } catch (err: any) {
            console.error("Error sending quotation:", err);
            setEditError("Failed to send quotation");
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
        );
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
        );
    }

    // Items for PDF preview (using editable data)
    const aitems = editableServices.map((service, index) => ({
        // type: "A",
        id: index + 1,
        title: service.machineType,
        description: service.workTypeDetails?.map((w: any) => w.workType).join(" + ") || "",
        quantity: service.quantity?.toString() ?? "1",
        price: (service.totalAmount ?? 0).toString(),
        amount: (service.totalAmount ?? 0).toString(),
    })) || [];

    const bitems = editableAdditionalServices.map((service, index) => ({
        // type: "B",
        id: index + 1,
        title: service.name,
        description: service.description || "Additional service",
        quantity: "1",
        price: (service.totalAmount ?? 0).toString(),
        amount: (service.totalAmount ?? 0).toString(),
    })) || [];

    // Calculations for PDF (using editable/quotation data)
    // const subtotal = quotationData?.subtotal || 0;
    // const discountPercentage = quotationData?.discount || 0;
    // const discountAmount = Math.round(subtotal * (discountPercentage / 100) * 100) / 100;
    // const gstRate = quotationData?.gstRate || 0;
    // const taxableAmount = subtotal - discountAmount;
    // const gstAmount = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
    // const totalAmount = taxableAmount + gstAmount;
    const subtotal = quotationData?.subtotal || 0;
    const discountPercentage = quotationData?.discount || 0;
    const discountAmount = Number((subtotal * (discountPercentage / 100)).toFixed(2));
    const gstRate = quotationData?.gstRate || 0;
    const taxableAmount = Number((subtotal - discountAmount).toFixed(2));
    const gstAmount = Number((taxableAmount * (gstRate / 100)).toFixed(2));
    const totalAmount = Number((taxableAmount + gstAmount).toFixed(2));


    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const leadOwnerDisplayName = String(
        typeof quotationData?.enquiry?.leadOwner === "string"
            ? quotationData?.enquiry?.leadOwner
            : quotationData?.enquiry?.leadOwner?.name || ""
    ).trim();
    const hasSelectedOptionInList =
        !!selectedOption?._id && options.some((opt) => opt._id === selectedOption._id);

    const assignedEmployeeName =
        quotationData?.assignedEmployee?.name ||
        quotationData?.enquiry?.leadOwner?.name ||
        quotationData?.enquiry?.contactPerson ||
        "-";
    const assignedEmployeePhone = quotationData?.assignedEmployee?.phone || "-";

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
        quotationData?.enquiry.hospitalName,
        quotationData?.enquiry.fullAddress,
        quotationData?.enquiry.city,
        quotationData?.enquiry.district,
        `${quotationData?.enquiry.state}-${quotationData?.enquiry.pinCode}`,
    ]
        .filter(Boolean)
        .join(", ");

    const quotationDescription = [
        quotationData?.quotationId,
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

    return (
        <div className="w-full min-h-screen bg-gray-50 px-8 absolute top-0 left-0 z-50 lg:px-[15%]">
            {successMessage && (
                <SuccessAlert message={successMessage} onClose={() => setSuccessMessage(null)} />
            )}
            {/* {editError && (
                <ErrorAlert message={editError} onClose={() => setEditError(null)} />
            )} */}

            {/* Editable Form Section */}
            <div className="mb-6 p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Edit Quotation Details</h2>
                <div className="mb-4">
                    {/* <label className="block text-sm font-medium mb-1">Assigned Employee</label> */}
                    <input
                        type="text"
                        value={
                            quotationData?.assignedEmployee?.name
                                ? `${quotationData.assignedEmployee.name}`
                                : "N/A"
                        }
                        className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                        readOnly
                    />
                </div>
                <div className="mb-4">
                    {/* <label className="block text-sm font-medium mb-1">Assigned Employee / Dealer</label> */}
                    {/* <select
                        value={
                            hasSelectedOptionInList
                                ? selectedOption?._id
                                : leadOwnerDisplayName
                                    ? "__lead_owner_fallback__"
                                    : ""
                        }
                        onChange={(e) => {
                            const selected = options.find(o => o._id === e.target.value);
                            setSelectedOption(selected || null);
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                        disabled
                    >
                        <option value="" disabled>Select Employee / Dealer</option>
                        {!hasSelectedOptionInList && !!leadOwnerDisplayName && (
                            <option value="__lead_owner_fallback__">
                                {leadOwnerDisplayName} 
                            </option>
                        )}
                        {options.map(opt => (
                            <option key={opt._id} value={opt._id}>
                                {opt.name} ({opt.designation})
                            </option>
                        ))}

                    </select> */}


                </div>

                {/* Date and Discount */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                            type="date"
                            value={editableDate.split("T")[0]}
                            onChange={(e) => setEditableDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Discount (%)</label>
                        <input
                            type="number"
                            value={editableDiscount}
                            onChange={(e) => setEditableDiscount(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-md"
                            min="0"
                            max="100"
                            step="0.01"
                        />
                    </div>
                </div>

                {/* Services Editing */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Services</h3>
                    {editableServices.map((service) => (
                        <div key={service._id} className="border p-3 rounded-md mb-3 bg-gray-50">
                            {/* Single Row: 4 Inputs */}
                            <div className="grid grid-cols-12 gap-2 items-center">
                                {/* Machine Type */}
                                <div className="col-span-3">
                                    <input
                                        value={service.machineType}
                                        placeholder="Machine Type"
                                        className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                                        readOnly
                                    />
                                </div>

                                {/* Quantity (Disabled) */}
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        value={service.quantity ?? 1}
                                        placeholder="Qty"
                                        className="w-full px-2 py-1.5 border rounded text-sm bg-gray-100 text-gray-700"
                                        readOnly
                                        disabled
                                    />
                                </div>

                                {/* Equipment No */}
                                <div className="col-span-3">
                                    <input
                                        value={service.equipmentNo}
                                        placeholder="Equipment No"
                                        className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                                        readOnly
                                    />
                                </div>

                                {/* Total Amount (Editable) */}
                                <div className="col-span-4">
                                    <input
                                        type="number"
                                        value={service.totalAmount}
                                        onChange={(e) => handleServiceAmountChange(service._id, Number(e.target.value))}
                                        placeholder="Total Amount"
                                        className="w-full px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Services Editing */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Additional Services</h3>
                    {editableAdditionalServices.map((service) => (
                        <div key={service._id} className="border p-3 rounded-md mb-2">
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <input
                                    value={service.name}
                                    placeholder="Service Name"
                                    className="px-2 py-1 border rounded text-sm col-span-1"
                                    readOnly
                                />
                                <input
                                    type="number"
                                    value={service.totalAmount}
                                    onChange={(e) => handleAdditionalServiceAmountChange(service._id, Number(e.target.value))}
                                    placeholder="Total Amount"
                                    className="px-2 py-1 border rounded text-sm col-span-1"
                                />
                                <input
                                    value={service.description || ''}
                                    placeholder="Description"
                                    onChange={(e) => handleAdditionalServiceChange(service._id, 'description', e.target.value)}
                                    className="px-2 py-1 border rounded text-sm col-span-2"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Terms & Conditions Editing */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Terms & Conditions</h3>
                    {editableTerms.map((term, index) => (
                        <div key={index} className="flex gap-2 items-center mb-2">
                            <input
                                value={typeof term === "string" ? term : term.text}
                                onChange={(e) => updateTerm(index, e.target.value)}
                                placeholder="Term text"
                                className="flex-1 px-2 py-1 border rounded text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => removeTerm(index)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <FaTrash size={14} />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addTerm}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                    >
                        <FaPlus size={12} /> Add Term
                    </button>
                </div>

                {/* Bank & Company Details */}
                {/* <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <h4 className="text-sm font-medium mb-2">Bank Details</h4>
                        <input
                            value={editableBankDetails.accountNumber}
                            onChange={(e) => setEditableBankDetails({ ...editableBankDetails, accountNumber: e.target.value })}
                            placeholder="Account Number"
                            className="w-full px-2 py-1 border rounded text-sm mb-1"
                        />
                        <input
                            value={editableBankDetails.ifsc}
                            onChange={(e) => setEditableBankDetails({ ...editableBankDetails, ifsc: e.target.value })}
                            placeholder="IFSC"
                            className="w-full px-2 py-1 border rounded text-sm mb-1"
                        />
                        <input
                            value={editableBankDetails.bankName}
                            onChange={(e) => setEditableBankDetails({ ...editableBankDetails, bankName: e.target.value })}
                            placeholder="Bank Name"
                            className="w-full px-2 py-1 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-2">Company Details</h4>
                        <input
                            value={editableCompanyDetails.name}
                            onChange={(e) => setEditableCompanyDetails({ ...editableCompanyDetails, name: e.target.value })}
                            placeholder="Company Name"
                            className="w-full px-2 py-1 border rounded text-sm mb-1"
                        />
                        <input
                            value={editableCompanyDetails.address}
                            onChange={(e) => setEditableCompanyDetails({ ...editableCompanyDetails, address: e.target.value })}
                            placeholder="Address"
                            className="w-full px-2 py-1 border rounded text-sm mb-1"
                        />
                        <input
                            value={editableCompanyDetails.gstin}
                            onChange={(e) => setEditableCompanyDetails({ ...editableCompanyDetails, gstin: e.target.value })}
                            placeholder="GSTIN"
                            className="w-full px-2 py-1 border rounded text-sm"
                        />
                    </div>
                </div> */}

                <div className="flex gap-2">
                    {/* <button
                        onClick={handleUpdateQuotation}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center justify-center flex-1"
                    >
                        Save Changes
                    </button> */}
                    <button
                        onClick={handleSaveAndUploadPdf}
                        disabled={isSavingPdf}
                        className={`bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center justify-center flex-1 ${isSavingPdf ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                        {isSavingPdf ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving and Uploading...
                            </div>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </div>

            {/* PDF Preview */}
            {!quotationData ? (
                <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading quotation...</p>
                    </div>
                </div>
            ) : (
                <div ref={pdfRef}>
                    <div
                        className="mx-auto px-6 pb-5 pt-0 bg-white"
                        style={{ width: "793px", maxWidth: "100%", boxSizing: "border-box" }}
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
                            .terms-pdf-section {
                                break-inside: avoid;
                                page-break-inside: avoid;
                                padding-top: 36px;
                                margin-top: 8px;
                            }
                        `}</style>

                        {/* Header */}
                        <QuotationHeader
                            date={editableDate}
                            enquiry={quotationData.enquiry}
                            assignedEmployeeName={assignedEmployeeName}
                            assignedEmployeePhone={assignedEmployeePhone}
                            quotationDescription={quotationDescription}
                            formatDate={formatDate}
                        />

                        {/* Items Tables */}
                        <div className="mt-1">
                            {aitems.length > 0 && (
                                <table className="items-table w-full text-xs mb-1 border border-gray-400 border-collapse">
                                    <thead>
                                        <tr className="pdf-row-avoid">
                                            {acolumns.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className={`${column?.class} px-0.5 py-0 font-extrabold text-[.6rem] border-2 border-gray-400`}
                                                    style={{ backgroundColor: "#2563eb", color: "#ffffff", lineHeight: "0.6rem", height: "10px" }}
                                                >
                                                    {column.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aitems.map((item, i) => (
                                            <tr key={i} className="pdf-row-avoid" style={{ height: "9px" }}>
                                                <td className="px-0.5 py-0 text-[.6rem] border border-gray-400" style={{ lineHeight: "0.6rem" }}>{i + 1}</td>
                                                <td className="px-0.5 py-0 text-[.6rem] border border-gray-400" style={{ lineHeight: "0.6rem" }}>{item.title}</td>
                                                <td className="px-0.5 py-0 text-[.6rem] border border-gray-400" style={{ lineHeight: "0.6rem" }}>{item.description}</td>
                                                <td className="px-0.5 py-0 text-[.6rem] text-right border border-gray-400" style={{ lineHeight: "0.6rem" }}>{item.quantity}</td>
                                                <td className="px-0.5 py-0 text-[.6rem] text-right border border-gray-400" style={{ lineHeight: "0.6rem" }}>₹ {item.amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {bitems.length > 0 && (
                                <table className="items-table w-full text-xs mb-2 border border-gray-400 border-collapse">
                                    <thead>
                                        <tr className="pdf-row-avoid">
                                            {bcolumns.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className={`${column?.class} px-0.5 py-0 font-extrabold text-[.6rem] border-2 border-gray-400`}
                                                    style={{ backgroundColor: "#2563eb", color: "#ffffff", lineHeight: "0.6rem", height: "10px" }}
                                                >
                                                    {column.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bitems.map((item, i) => (
                                            <tr key={i} className="pdf-row-avoid" style={{ height: "9px" }}>
                                                <td className="px-0.5 py-0 text-[.6rem] border border-gray-400" style={{ lineHeight: "0.6rem" }}>{i + 1}</td>
                                                <td className="px-0.5 py-0 text-[.6rem] border border-gray-400" style={{ lineHeight: "0.6rem" }}>{item.title}</td>
                                                <td className="px-0.5 py-0 text-[.6rem] border border-gray-400" style={{ lineHeight: "0.6rem" }}>{item.description}</td>
                                                <td className="px-0.5 py-0 text-[.6rem] text-right border border-gray-400" style={{ lineHeight: "0.6rem" }}>₹ {item.amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Totals — full width */}
                        <div className="mt-2 pdf-section">
                            <table className="w-full text-xs border border-gray-400 border-collapse" style={{ lineHeight: "6px" }}>
                                <tbody>
                                    <tr style={{ height: "9px" }}>
                                        <td className="border border-gray-400 px-0.5 py-0 text-gray-900 font-bold text-[.6rem] w-[30%]" style={{ lineHeight: "6px" }}>Subtotal</td>
                                        <td className="border border-gray-400 px-0.5 py-0 text-[.7rem] font-bold text-right" style={{ lineHeight: "6px" }}>₹{formatCurrency(subtotal)}</td>
                                    </tr>
                                    <tr style={{ height: "9px" }}>
                                        <td className="border border-gray-400 px-0.5 py-0 text-gray-900 font-bold text-[.6rem]" style={{ lineHeight: "6px" }}>Discount</td>
                                        <td className="border border-gray-400 px-0.5 py-0 text-[.7rem] font-bold text-right" style={{ lineHeight: "6px" }}>{formatCurrency(discountPercentage)}%</td>
                                    </tr>
                                    <tr style={{ height: "9px" }}>
                                        <td className="border border-gray-400 px-0.5 py-0 text-gray-900 font-bold text-[.6rem]" style={{ lineHeight: "6px" }}>GST Rate</td>
                                        <td className="border border-gray-400 px-0.5 py-0 text-[.7rem] font-bold text-right" style={{ lineHeight: "6px" }}>{formatCurrency(gstRate)}%</td>
                                    </tr>
                                    <tr style={{ height: "9px" }}>
                                        <td className="border border-gray-400 px-0.5 py-0 text-gray-900 font-bold text-[.6rem]" style={{ lineHeight: "6px" }}>GST Amount</td>
                                        <td className="border border-gray-400 px-0.5 py-0 text-[.7rem] font-bold text-right" style={{ lineHeight: "6px" }}>₹{formatCurrency(gstAmount)}</td>
                                    </tr>
                                    <tr style={{ height: "9px" }}>
                                        <td className="border border-gray-400 px-0.5 py-0 text-gray-900 font-bold text-[.6rem]" style={{ lineHeight: "6px" }}>TOTAL</td>
                                        <td className="border border-gray-400 px-0.5 py-0 text-[.7rem] font-bold text-right" style={{ lineHeight: "6px" }}>₹ {formatCurrency(totalAmount)}</td>
                                    </tr>
                                    <tr style={{ height: "10px" }}>
                                        <td className="border border-gray-400 px-0.5 py-0 text-gray-900 font-bold text-[.6rem] whitespace-nowrap" style={{ lineHeight: "6px" }}>
                                            Total Amount (in words)
                                        </td>
                                        <td className="border border-gray-400 px-0.5 py-0 text-[.6rem] font-bold uppercase" style={{ lineHeight: "6px" }}>
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
                                className="mt-1 space-y-1 text-gray-700 dark:text-gray-300 text-[.65rem]"
                                style={{ lineHeight: "1.25rem" }}
                            >
                                {editableTerms.map((term, index) => {
                                    const text = typeof term === "string" ? term : term?.text ?? "";
                                    return (
                                        <p key={index} className={text.includes("GST") ? "text-green-600" : ""}>
                                            - {text}
                                        </p>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
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
            )}

            <div className="flex justify-end my-4 space-x-2">
                {/* {quotationData && !quotationData.pdfUrl && (
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
                )} */}

                {/* {quotationData?.pdfUrl && (
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
                )}

                {quotationData?.quotationStatus === "Rejected" && (
                    <button
                        onClick={() => navigate(`/admin/quotation/view/${id}`)}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        Back to View
                    </button>
                )} */}
            </div>
        </div>
    );
};

export default EditQuotation;