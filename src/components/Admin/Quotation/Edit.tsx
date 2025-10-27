import React, { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { FaAngleRight, FaPlus, FaTrash } from "react-icons/fa6";
import { allEmployees, downloadQuotationPdf, getAllDealers, getQuotationByEEnquiryId, sendQuotation, updateQuotationById } from "../../../api";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../../../assets/logo/logo-sm.png";
import logoA from "../../../assets/quotationImg/NABLlogo.png";
import AntesoQRCode from '../../../assets/quotationImg/qrcode.png';
import Signature from '../../../assets/quotationImg/signature.png';
import SuccessAlert from "../../common/ShowSuccess";
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
}

const EditQuotation: React.FC = () => {
    const params = useParams();
    const id = params.id as string;
    console.log("🚀 ~ EditQuotation ~ id:", id);
    const pdfRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const acolumns = [
        { key: "type", label: "Type", class: "w-10" },
        { key: "id", label: "S.No", class: "w-10" },
        { key: "title", label: "Machine Type", class: "w-40" },
        { key: "description", label: "Work Type / Description", class: "w-60" },
        { key: "quantity", label: "Qty", class: "w-10 text-right" },
        { key: "amount", label: "Amount", class: "w-20 text-right" },
    ];

    const bcolumns = [
        { key: "type", label: "Type", class: "w-10" },
        { key: "id", label: "S.No", class: "w-10" },
        { key: "title", label: "Service Name", class: "w-40" },
        { key: "description", label: "Description", class: "w-60" },
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
        if (quotationData) {
            if (quotationData.assignedEmployee) {
                setSelectedOption({ ...quotationData.assignedEmployee, type: "Employee" });
            } else if (quotationData.dealer) {
                setSelectedOption({ ...quotationData.dealer, type: "Dealer" });
            }
        }
    }, [quotationData]);

    useEffect(() => {
        const fetchQuotationData = async () => {
            try {
                setLoading(true);
                console.log("🚀 ~ fetchQuotationData ~ calling API with id:", id);
                const response = await getQuotationByEEnquiryId(id);
                console.log("🚀 ~ fetchQuotationData ~ response:", response);
                const data = response.data.data;
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
                navigate(-1);
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
                margin: 0.1,
                filename: `Quotation_${quotationData.quotationId}.pdf`,
                image: { type: "jpeg" as const, quality: 0.95 },
                html2canvas: { scale: 1.5 },
                jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
            };

            const blob = await html2pdf().set(opt).from(pdfRef.current).outputPdf("blob");

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
                navigate(-1);
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
        type: "A",
        id: index + 1,
        title: service.machineType,
        description: service.workTypeDetails?.map((w: any) => w.workType).join(" + ") || "",
        quantity: "1",
        price: (service.totalAmount ?? 0).toString(),
        amount: (service.totalAmount ?? 0).toString(),
    })) || [];

    const bitems = editableAdditionalServices.map((service, index) => ({
        type: "B",
        id: index + 1,
        title: service.name,
        description: service.description || "Additional service",
        quantity: "1",
        price: (service.totalAmount ?? 0).toString(),
        amount: (service.totalAmount ?? 0).toString(),
    })) || [];

    // Calculations for PDF (using editable/quotation data)
    const subtotal = quotationData?.subtotal || 0;
    const discountPercentage = quotationData?.discount || 0;
    const discountAmount = Math.round(subtotal * (discountPercentage / 100) * 100) / 100;
    const gstRate = quotationData?.gstRate || 0;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
    const totalAmount = taxableAmount + gstAmount;



    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // QR and Bank Details component (moved beside calculations)
    const QrAndBankDetails = () => (
        <div className="text-left space-y-1 w-48 flex-shrink-0">
            <img src={AntesoQRCode} alt="QR Code" className="h-20 mx-auto mb-2" />
            <table className="h-4 w-full">
                <tr style={{ fontSize: ".4rem" }}>
                    <td className="pb-3 text-start">Merchant Name:</td>
                    <td className="leading-none text-end pr-2">
                        {editableCompanyDetails.name || "ANTESO BIOMEDICAL PRIVATE LIMITED"}
                    </td>
                </tr>
                <tr style={{ fontSize: ".4rem" }}>
                    <td className="text-start">Mobile Number:</td>
                    <td className="text-end pr-2">8470909720</td>
                </tr>
            </table>
            <div className="text-center text-[.4rem]" style={{ lineHeight: "8px" }}>
                <p>Steps to Pay UPI QR Code</p>
                <p className="flex justify-center items-center flex-wrap w-[10rem]">
                    Open UPI app <FaAngleRight /> Select Type to Pay <FaAngleRight /> Scan QR Code <FaAngleRight /> Enter
                    Amount
                </p>
            </div>

            <hr className="bg-gray-700 h-[1.5px]" />
            <div>
                <div className="w-full m-auto">
                    <p className="text-right text-[.6rem]">
                        <span className="font-medium text-[.6rem]">A/C No:</span> {editableBankDetails.accountNumber || "344305001088"}
                    </p>
                    <p className="text-right text-[.6rem]">
                        <span className="font-medium text-[.6rem]">IFSC Code:</span> {editableBankDetails.ifsc || "ICIC0003443"}
                    </p>
                    <p className="text-[.6rem] text-right">{editableBankDetails.bankName || "ICICI BANK ROHINI"}</p>
                </div>
            </div>
        </div>
    );

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
                    <label className="block text-sm font-medium mb-1">Assign Employee / Dealer</label>
                    <select
                        value={selectedOption?._id || ""}
                        onChange={(e) => {
                            const selected = options.find(o => o._id === e.target.value);
                            setSelectedOption(selected || null);
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                    >
                        <option value="" disabled>Select Employee / Dealer</option>
                        {options.map(opt => (
                            <option key={opt._id} value={opt._id}>
                                {opt.name} ({opt.designation})
                            </option>
                        ))}

                    </select>


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
                        <div key={service._id} className="border p-3 rounded-md mb-2">
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <input
                                    value={service.machineType}
                                    placeholder="Machine Type"
                                    className="px-2 py-1 border rounded text-sm"
                                    readOnly // Assuming machine type not editable
                                />
                                <input
                                    value={service.equipmentNo}
                                    placeholder="Equipment No"
                                    className="px-2 py-1 border rounded text-sm"
                                    readOnly
                                />
                                <input
                                    type="number"
                                    value={service.totalAmount}
                                    onChange={(e) => handleServiceAmountChange(service._id, Number(e.target.value))}
                                    placeholder="Total Amount"
                                    className="px-2 py-1 border rounded text-sm"
                                />
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
                        className="mx-auto rounded-lg px-4 bg-white"
                        style={{ width: "793px", maxWidth: "100%" }}
                    >
                        {/* Header - Same as View */}
                        <div className="flex justify-between items-start">
                            <div>
                                <img src={logo} alt="Company Logo" className="h-14" />
                                <p className="font-bold text-[.6rem]">AERB Registration No. 14-AFSXE-2148</p>
                            </div>
                            <div className="text-center">
                                <h1 className="text-xl font-bold uppercase">Quotation</h1>
                            </div>
                            <div className="text-right">
                                <img src={logoA} alt="NABL Logo" className="h-14 ml-auto" />
                                <p className="font-bold text-[.6rem]">NABL Accreditation No TC-9843</p>
                            </div>
                        </div>

                        {/* Company and Recipient Info - Use original data or editable if needed */}
                        <div className="flex w-full justify-between">
                            <div>
                                <table className="text-sm w-[20rem]" style={{ lineHeight: "1.5rem" }}>
                                    <tr className="text-[.7rem]">
                                        <td>Date:</td>
                                        <td className="pl-2">{formatDate(editableDate)}</td>
                                    </tr>
                                    <tr className="text-[.7rem]">
                                        <td className="font-bold pb-4">To:</td>
                                        <td className="pl-2" style={{ lineHeight: "20px" }}>
                                            <span className="font-bold">{quotationData.enquiry.hospitalName.toUpperCase()}</span>
                                            <br />
                                            {quotationData.enquiry.fullAddress}, {quotationData.enquiry.city}, {quotationData.enquiry.district},{" "}
                                            {quotationData.enquiry.state}-{quotationData.enquiry.pinCode}
                                        </td>
                                    </tr>
                                    <tr className="text-[.7rem]">
                                        <td className="font-bold">Email:</td>
                                        <td className="pl-2">
                                            <a href={`mailto:${quotationData.enquiry.emailAddress}`} className="text-blue-600 hover:underline">
                                                {quotationData.enquiry.emailAddress}
                                            </a>
                                        </td>
                                    </tr>
                                    <tr className="text-[.7rem]">
                                        <td className="font-bold">Contact:</td>
                                        <td className="pl-2">{quotationData.enquiry.contactNumber}</td>
                                    </tr>
                                    <tr className="text-[.7rem]">
                                        <td className="pl-4 font-bold w-[10rem]">Name:</td>
                                        <td className="pl-2" colSpan={3}>
                                            {quotationData.enquiry.contactPerson} &nbsp;&nbsp;
                                        </td>
                                    </tr>
                                    <tr className="text-[.7rem]">
                                        <td className="pl-4 font-bold w-[10rem]">Phone:</td>
                                        <td className="pl-2" colSpan={3}>
                                            {quotationData.enquiry.contactNumber} &nbsp;&nbsp;
                                        </td>
                                    </tr>
                                    <tr className="text-[.7rem]">
                                        <td className="font-bold">Enquiry ID:</td>
                                        <td className="pl-2 font-bold">{quotationData.enquiry.enquiryId}</td>
                                    </tr>
                                    <tr className="text-[.7rem]">
                                        <td className="font-bold">Quotation:</td>
                                        <td className="pl-2 font-bold">{quotationData.quotationId}</td>
                                    </tr>
                                    <tr className="text-[.7rem]">
                                        <td className="font-bold">Expires:</td>
                                        <td className="pl-2">30 days from above date</td>
                                    </tr>
                                </table>
                            </div>

                            <div style={{ lineHeight: "17px" }}>
                                <p className="font-bold text-black text-[.7rem]">
                                    {editableCompanyDetails.name || "ANTESO Biomedical (OPC) Pvt. Ltd."}
                                </p>
                                <p className="text-[.7rem]">{editableCompanyDetails.address || "Flat No. 290, 2nd Floor, Block D,"}</p>
                                <p className="text-[.7rem]">Pocket 7, Sector 6, Rohini,</p>
                                <p className="text-[.7rem]">New Delhi – 110 085, INDIA</p>
                                <p className="text-[.7rem]">Mobile: +91 8470909720 / 8951818690</p>
                                <p className="text-[.7rem]">Email: info@antesobiomedicalopc.com</p>
                            </div>
                        </div>

                        {/* Items Tables - Using editable items */}
                        <div className="mt-1">
                            {aitems.length > 0 && (
                                <table className="w-full text-xs mb-1">
                                    <thead>
                                        <tr>
                                            {acolumns.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className={`${column?.class} px-2 bg-gray-100 text-gray-900 font-bold text-[.6rem]`}
                                                >
                                                    {column.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aitems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-2 py-1 text-[.6rem]">{item.type}</td>
                                                <td className="px-2 py-1 text-[.6rem]">{item.id}</td>
                                                <td className="px-2 py-1 text-[.6rem]">{item.title}</td>
                                                <td className="px-2 py-1 text-[.6rem]">{item.description}</td>
                                                <td className="ltr:text-right rtl:text-left px-2 py-1 text-[.6rem]">{item.quantity}</td>
                                                <td className="ltr:text-right rtl:text-left px-2 py-1 text-[.6rem]">₹ {item.amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {bitems.length > 0 && (
                                <table className="w-full text-xs mb-6">
                                    <thead>
                                        <tr>
                                            {bcolumns.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className={`${column?.class} px-2 py-1 bg-gray-100 text-gray-900 font-bold text-[.6rem]`}
                                                >
                                                    {column.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bitems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-2 py-1 text-[.6rem]">{item.type}</td>
                                                <td className="px-2 py-1 text-[.6rem]">{item.id}</td>
                                                <td className="px-2 py-1 text-[.6rem]">{item.title}</td>
                                                <td className="px-2 py-1 text-[.6rem]">{item.description}</td>
                                                <td className="ltr:text-right rtl:text-left px-2 py-1 text-[.6rem]">₹ {item.amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Calculations and QR/Bank beside */}
                        <div className="flex justify-between items-start gap-4 px-4 mt-6">
                            <QrAndBankDetails />
                            <div className="w-52 space-y-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 text-gray-900 font-bold text-[.6rem]">SUBTOTAL</div>
                                    <div className="w-[37%] text-[.7rem] font-bold text-right">₹ {subtotal}</div>
                                </div>
                                <div className="flex items-center gap-4">

                                    <div className="flex-1 text-gray-900 font-bold text-[.6rem]">DISCOUNT ({discountPercentage}%)</div>
                                    <div className="w-[37%] text-[.7rem] font-bold text-right">₹ {discountAmount}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 text-gray-900 font-bold text-[.6rem]">GST ({gstRate}%)</div>
                                    <div className="w-[37%] text-[.7rem] font-bold text-right">₹ {gstAmount}</div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1 text-gray-900 font-bold text-[.6rem]">TOTAL</div>
                                    <div className="w-[37%] text-[.7rem] font-bold text-right">₹ {totalAmount}</div>
                                </div>
                            </div>
                        </div>
                        <br />
                        <hr />

                        <div className="mt-4">
                            <h4 className="ml-4 text-sm font-semibold text-gray-800 dark:text-gray-200">Terms & Conditions:</h4>
                            <ul
                                className="list-disc list-outside pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-[.65rem] leading-relaxed"
                                style={{ lineHeight: "10px" }}
                            >
                                {editableTerms.map((term, index) => {
                                    const text = typeof term === "string" ? term : term?.text ?? "";
                                    return (
                                        <li key={index} className={text.includes("GST") ? "text-green-600" : ""}>
                                            {text}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="overflow-x-auto mt-8 text-center" style={{ lineHeight: "1rem" }}>
                            <p className="text-[.6rem]">
                                For any enquiry contact us{" "}
                                <a href="#" className="text-blue-800">
                                    info@antesobiomedicalopc.com or antesobiomedical@gmail.com
                                </a>
                            </p>
                            <p className="text-[.6rem]">Feel free to call us & Thank you for your enquiry</p>
                        </div>

                        {/* Footer - now without QR right part */}
                        <div className="mt-4 flex justify-between items-end text-xs">
                            <div>
                                <img src={Signature} alt="Signature" className="mb-2 h-24" />
                                <div style={{ lineHeight: "10px" }} className="space-y-1">
                                    <p className="text-[.6rem]">
                                        <span className="font-medium">A/C No.:</span> {editableBankDetails.accountNumber || "50200007211263"}
                                    </p>
                                    <p className="text-[.6rem]">
                                        <span className="font-medium">IFSC:</span> {editableBankDetails.ifsc || "HDFC0000711"}
                                    </p>
                                    <p className="text-[.6rem]">{editableBankDetails.bankName || "HDFC BANK PUSHPANJALI ENCLAVE PITAMPURA"}</p>
                                </div>
                            </div>

                            <div style={{ lineHeight: "5px" }} className="text-center">
                                <p className="font-bold text-[.6rem]">OUR ACCOUNT DETAILS</p>
                                <p className="pb-10 mt-2 font-bold text-[.6rem]">
                                    <span>GST NO:</span> {editableCompanyDetails.gstin || "07AAMCA8142J1ZE"}
                                </p>
                            </div>
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
                        onClick={() => navigate(`/quotation/view/${id}`)}
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