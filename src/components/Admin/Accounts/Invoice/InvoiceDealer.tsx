import React, { useEffect, useState, useRef } from "react";
import { getInvoiceById, uploadInvoice } from "../../../../api"; // added uploadInvoice API
import antesoLogo from "../../../../assets/logo/anteso-logo2.png";
import signature from "../../../../assets/quotationImg/signature.png";
import { useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { showMessage } from "../../../../components/common/ShowMessage"; // Adjust the import path as needed

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigitWords = (n: number): string => {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${tens[t]}${o ? ` ${ones[o]}` : ""}`.trim();
};

const threeDigitWords = (n: number): string => {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const parts: string[] = [];
    if (h) parts.push(`${ones[h]} Hundred`);
    if (rest) parts.push(twoDigitWords(rest));
    return parts.join(" ");
};

const numberToIndianWords = (value: number): string => {
    const amount = Math.round(Number(value) || 0);
    if (amount === 0) return "Indian Rupees Zero Only";

    const crore = Math.floor(amount / 10000000);
    const lakh = Math.floor((amount % 10000000) / 100000);
    const thousand = Math.floor((amount % 100000) / 1000);
    const hundred = amount % 1000;

    const parts: string[] = [];
    if (crore) parts.push(`${threeDigitWords(crore)} Crore`);
    if (lakh) parts.push(`${threeDigitWords(lakh)} Lakh`);
    if (thousand) parts.push(`${threeDigitWords(thousand)} Thousand`);
    if (hundred) parts.push(threeDigitWords(hundred));

    return `Indian Rupees ${parts.join(" ")} Only`;
};

const stackedCell = (values: Array<string | undefined | null>) => {
    const lines = values.map((v) => String(v || "").trim()).filter(Boolean);
    if (!lines.length) return "-";
    return (
        <span className="block whitespace-pre-line break-all leading-[1.15] text-[7px]">
            {lines.join("\n")}
        </span>
    );
};

const cellClass = "border border-black px-[2px] py-[2px] align-top break-words leading-[1.15] text-[7px]";

const InvoiceDealer = () => {
    const { id } = useParams<{ id: string }>();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false); // new state for upload
    const [uploaded, setUploaded] = useState(false); // new state to track upload status

    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                if (!id) return;
                const res = await getInvoiceById(id);
                console.log("🚀 ~ fetchInvoice ~ res:", res)
                setInvoice(res.data.data);
                setUploaded(res.data.data.invoiceuploaded || false);
            } catch (err) {
                console.error("Error fetching invoice:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    const handleDownloadPdf = () => {
        if (!invoiceRef.current) return;
        const element = invoiceRef.current;
        const opt: any = {
            margin: 0.2,
            filename: `Invoice_${invoice.invoiceId}.pdf`,
            image: { type: "jpeg", quality: 0.85 }, // Reduced from 0.98 to 0.85 for smaller file size
            html2canvas: { scale: 1.5 }, // Reduced from 2 to 1.5 for smaller file size
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        };
        html2pdf().set(opt).from(element).save();
    };

    // New function to generate PDF blob and upload
    const handleUploadInvoice = async () => {
        if (!invoiceRef.current || !invoice) return;

        setUploading(true);
        try {
            const element = invoiceRef.current;
            const opt: any = {
                margin: 0.2,
                filename: `Invoice_${invoice.invoiceId}.pdf`,
                image: { type: "jpeg", quality: 0.85 }, // Reduced from 0.98 to 0.85 for smaller file size
                html2canvas: { scale: 1.5 }, // Reduced from 2 to 1.5 for smaller file size
                jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
            };

            // Generate PDF blob
            const pdfBlob = await new Promise<Blob>((resolve, reject) => {
                html2pdf()
                    .set(opt)
                    .from(element)
                    .outputPdf("blob")
                    .then((blob) => resolve(blob))
                    .catch((err) => reject(err));
            });

            // Convert to file
            const file = new File([pdfBlob], `Invoice_${invoice.invoiceId}.pdf`, { type: "application/pdf" });

            // Call API
            await uploadInvoice(invoice.orderId, file); // your API method
            showMessage("Invoice uploaded successfully!", "success");
            setUploaded(true);
        } catch (err) {
            console.error(err);
            showMessage("Failed to upload invoice.", "error");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (!invoice) return <p>No invoice found.</p>;

    const invoiceDetails = {
        invoiceDate: new Date(invoice.createdAt).toLocaleDateString("en-IN"),
        invoiceNo: invoice.invoiceId,
        billTo: invoice.buyerName,
        addressLine: invoice.address,
        gstin: invoice.gst || "-",
        email: invoice.order?.emailAddress || "-",
        phone: invoice.order?.contactNumber || "-",
    };

    const items = invoice.dealerHospitals?.map((d: any, index: number) => ({
        id: index + 1,
        partyCode: d.partyCode,
        hospital: d.hospitalName,
        location: d.location,
        state: d.dealerState,
        model: d.modelNo,
        srNo: d.srNo || "-",
        expense: d.amount,
    })) || [];

    const subTotal = invoice.subtotal || 0;
    const cgst = invoice.cgst || 0;
    const sgst = invoice.sgst || 0;
    const igst = invoice.igst || 0;
    const gst = cgst + sgst + igst;
    const discount = invoice.discount || 0;
    const total = invoice.grandtotal || subTotal + gst - discount;
    const isCustomer = invoice.type === "Customer";

    const customerItems = invoice.services?.map((s: any, index: number) => ({
        id: index + 1,
        machineType: s.machineType || "",
        description: s.description,
        hsn: s.hsnno || "-",
        qty: s.quantity || 0,
        rate: s.rate || 0,
        amount: Number(s.totalAmount ?? ((s.rate ?? 0) * (s.quantity ?? 0))),
    })) || [];

    const additionalServicesSource = Array.isArray(invoice.additionalServices) && invoice.additionalServices.length > 0
        ? invoice.additionalServices
        : (invoice.order?.additionalServices || []);

    const additionalServicesItems = additionalServicesSource.map((as: any, index: number) => ({
        id: index + 1,
        name: as.name,
        description: as.description,
        amount: as.totalAmount || 0,
    })) || [];

    return (
        <div className="w-full min-h-screen bg-gray-50 px-8 absolute top-0 left-0 z-50 lg:px-[15%]">
            <div className="w-full bg-white px-4 sm:px-6 md:px-8 py-4 text-[11px] sm:text-xs min-h-screen flex flex-col">
                <div className="max-w-[794px] mx-auto border border-black p-4 flex flex-col flex-grow" ref={invoiceRef}>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-black pb-2">
                        <img src={antesoLogo} alt="Logo" className="h-10 sm:h-12" />
                    </div>

                    {/* Top Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[11px]">
                        <div className="border border-black p-2">
                            <p><strong>INVOICE DATE:</strong> {invoiceDetails.invoiceDate}</p>
                            <h2 className="text-sm sm:text-base font-bold">ANTESO Biomedical</h2>
                            <p>ANTESO Biomedical OPC Pvt. Ltd.</p>
                            <p>Flat No 290, 2nd Floor, Block D, Pocket 7, Sec 6, Rohini, New Delhi-110085</p>
                            <p>Email: accounts@antesobiomedicalopc.com</p>
                            <p>Mobile: 8470909720, 8274394720</p>
                        </div>

                        <div className="border border-black p-2">
                            <p><strong>INVOICE NO.:</strong> {invoiceDetails.invoiceNo}</p>
                            <p><strong>Bill To:</strong> {invoiceDetails.billTo}</p>
                            <p>{invoiceDetails.addressLine}</p>
                            <p>Phone: {invoiceDetails.phone}</p>
                            <p>Email: {invoiceDetails.email}</p>
                            <p><strong>GST:</strong> {invoiceDetails.gstin}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mt-2 w-full overflow-hidden">
                        {/* {isCustomer ? (
                            <>
                                <table className="w-full table-fixed border border-black border-collapse text-[4px] sm:text-xs">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-black px-1 py-1 text-xs">S No</th>
                                            <th className="border border-black px-1 py-1 text-xs">Machine Type</th>
                                            <th className="border border-black px-1 py-1 text-xs">Description of Services</th>
                                            <th className="border border-black px-1 py-1 text-xs">HSN/SAC Number</th>
                                            <th className="border border-black px-1 py-1 text-xs">Quantity</th>
                                            <th className="border border-black px-1 py-1 text-xs">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerItems.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="border border-black px-1 py-1 text-xs">{item.id}</td>
                                                <td className="border border-black px-1 py-1 text-xs">{item.machineType}</td>
                                                <td className="border border-black px-1 py-1 text-xs">{item.description}</td>
                                                <td className="border border-black px-1 py-1 text-xs">{item.hsn}</td>
                                                <td className="border border-black px-1 py-1 text-xs">{item.qty}</td>
                                                <td className="border border-black px-1 py-1 text-xs">₹{item.amount.toLocaleString("en-IN")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {additionalServicesItems.length > 0 && (
                                    <div className="mt-2">
                                        <h3 className="text-sm font-bold mb-2">Additional Services</h3>
                                        <table className="w-full table-fixed border border-black border-collapse text-[4px] sm:text-xs">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border border-black px-1 py-1 text-xs">S No</th>
                                                    <th className="border border-black px-1 py-1 text-xs">Name</th>
                                                    <th className="border border-black px-1 py-1 text-xs">Description</th>
                                                    <th className="border border-black px-1 py-1 text-xs">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {additionalServicesItems.map((item: any) => (
                                                    <tr key={item.id}>
                                                        <td className="border border-black px-1 py-1 text-xs">{item.id}</td>
                                                        <td className="border border-black px-1 py-1 text-xs">{item.name}</td>
                                                        <td className="border border-black px-1 py-1 text-xs">{item.description}</td>
                                                        <td className="border border-black px-1 py-1 text-xs">₹{item.amount.toLocaleString("en-IN")}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        ) : (
                            <table className="w-full table-fixed border border-black border-collapse text-[4px] sm:text-xs">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-black px-1 py-1 text-xs">S No</th>
                                        <th className="border border-black px-1 py-1 text-xs">Party Code</th>
                                        <th className="border border-black px-1 py-1 text-xs">Hospital</th>
                                        <th className="border border-black px-1 py-1 text-xs">Location</th>
                                        <th className="border border-black px-1 py-1 text-xs">State</th>
                                        <th className="border border-black px-1 py-1 text-xs">Model</th>
                                        <th className="border border-black px-1 py-1 text-xs">Sr.No</th>
                                        <th className="border border-black px-1 py-1 text-xs">Expense</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="border border-black px-1 py-1 text-xs">{item.id}</td>
                                            <td className="border border-black px-1 py-1 text-xs">{item.partyCode}</td>
                                            <td className="border border-black px-1 py-1 text-xs">{item.hospital}</td>
                                            <td className="border border-black px-1 py-1 text-xs">{item.location}</td>
                                            <td className="border border-black px-1 py-1 text-xs">{item.state}</td>
                                            <td className="border border-black px-1 py-1 text-xs">{item.model}</td>
                                            <td className="border border-black px-1 py-1 text-xs">{item.srNo}</td>
                                            <td className="border border-black px-1 py-1 text-xs">₹{(item.expense ?? 0).toLocaleString("en-IN")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )} */}
                        {/* Dealer/Manufacturer Detailed Breakdown */}
                        {/* Customer Invoice - Services + Additional Services */}
                        {isCustomer ? (
                            <>
                                {/* Main Services Table */}
                                {invoice.services && invoice.services.length > 0 && (
                                    <div className="mt-2">
                                        <table className="w-full table-fixed border border-black border-collapse text-[10px]">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border border-black px-1 py-1 text-xs w-[6%]">S No</th>
                                                    <th className="border border-black px-1 py-1 text-xs w-[22%]">Machine Type</th>
                                                    <th className="border border-black px-1 py-1 text-xs w-[28%]">Description of Services</th>                                                    <th className="border border-black px-1 py-1 text-xs">HSN/SAC Number</th>
                                                    <th className="border border-black px-1 py-1 text-xs">Quantity</th>
                                                    {/* <th className="border border-black px-1 py-1 text-xs">Rate</th> */}
                                                    <th className="border border-black px-1 py-1 text-xs">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoice.services.map((item: any, index: number) => {
                                                    const amount = Number(item.totalAmount ?? ((item.rate || 0) * (item.quantity || 0)));
                                                    return (
                                                        <tr key={index}>
                                                            <td className="border border-black px-1 py-1 w-[6%] text-center">{index + 1}</td>
                                                            <td className="border border-black px-1 py-1 w-[22%] break-words whitespace-normal">{item.machineType || "-"}</td>
                                                            <td className="border border-black px-1 py-1 break-words">{item.description || "-"}</td>
                                                            <td className="border border-black px-1 py-1">{item.hsnno || "-"}</td>
                                                            <td className="border border-black px-1 py-1 text-right">{item.quantity || 0}</td>
                                                            {/* <td className="border border-black px-1 py-1 text-right">₹{(item.rate || 0).toLocaleString("en-IN")}</td> */}
                                                            <td className="border border-black px-1 py-1 text-right">₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Additional Services Table */}
                                {additionalServicesItems.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-sm font-bold mb-2">Additional Services</h3>
                                        <table className="w-full table-fixed border border-black border-collapse text-[10px]">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border border-black px-1 py-1 text-xs w-[6%]">S No</th>
                                                    <th className="border border-black px-1 py-1 text-xs w-[34%]">Name</th>
                                                    <th className="border border-black px-1 py-1 text-xs w-[40%]">Description</th>
                                                    <th className="border border-black px-1 py-1 text-xs">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {additionalServicesItems.map((item: any, index: number) => (
                                                    <tr key={index}>
                                                        <td className="border border-black px-1 py-1 w-[6%] text-center">{index + 1}</td>
                                                        <td className="border border-black px-1 py-1 w-[34%] break-words">{item.name || "-"}</td>
                                                        <td className="border border-black px-1 py-1">{item.description || "-"}</td>
                                                        <td className="border border-black px-1 py-1 text-right">
                                                            ₹{Number(item.amount || 0).toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="mt-2 overflow-x-auto">
                                <table className="w-full table-fixed border border-black border-collapse text-[7px]">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-black px-[2px] py-[2px] w-[5%] text-[7px] font-semibold leading-[1.15]">Sl No</th>
                                            <th className="border border-black px-[2px] py-[2px] w-[10%] text-[7px] font-semibold leading-[1.15]">Party Code</th>
                                            <th className="border border-black px-[2px] py-[2px] w-[16%] text-[7px] font-semibold leading-[1.15]">Name of the Hospital</th>
                                            <th className="border border-black px-[2px] py-[2px] w-[10%] text-[7px] font-semibold leading-[1.15]">Location</th>
                                            <th className="border border-black px-[2px] py-[2px] w-[10%] text-[7px] font-semibold leading-[1.15]">State</th>
                                            <th className="border border-black px-[2px] py-[2px] w-[12%] text-[7px] font-semibold leading-[1.15]">Model</th>
                                            <th className="border border-black px-[2px] py-[2px] w-[12%] text-[7px] font-semibold leading-[1.15]">Serial No</th>
                                            <th className="border border-black px-[2px] py-[2px] w-[15%] text-[7px] font-semibold leading-[1.15]">Machine Type</th>
                                            <th className="border border-black px-[2px] py-[2px] w-[10%] text-[7px] font-semibold leading-[1.15]">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(invoice.dealerHospitals || []).map((dh: any, dhIndex: number) => {
                                            const hospitalServices = Array.isArray(dh.services) ? dh.services : [];
                                            const relatedOrder = (invoice.orders || []).find(
                                                (o: any) => String(o?._id) === String(dh.orderId)
                                            ) || invoice.order;
                                            const location = dh.district || relatedOrder?.district || dh.city || dh.location || "-";
                                            const machineTypes = hospitalServices.length
                                                ? hospitalServices.map((s: any) => s.machineType)
                                                : [dh.machineType];
                                            const models = hospitalServices.length
                                                ? hospitalServices.map((s: any) => s.hsnno || s.machineModel)
                                                : [dh.modelNo];
                                            const serials = hospitalServices.length
                                                ? hospitalServices.map((s: any) => s.serialNumber)
                                                : [dh.serialNo, dh.srNo];
                                            const hospitalAmount = Number(
                                                dh.amount ??
                                                hospitalServices.reduce(
                                                    (sum: number, s: any) => sum + Number(s.totalAmount ?? ((s.rate || 0) * (s.quantity || 0))),
                                                    0
                                                )
                                            );

                                            return (
                                                <tr key={dh.orderId || dhIndex}>
                                                    <td className={`${cellClass} text-center`}>{dhIndex + 1}</td>
                                                    <td className={cellClass}>{dh.partyCode || "-"}</td>
                                                    <td className={cellClass}>{dh.hospitalName || "-"}</td>
                                                    <td className={cellClass}>{location}</td>
                                                    <td className={cellClass}>{dh.dealerState || relatedOrder?.state || "-"}</td>
                                                    <td className={cellClass}>{stackedCell(models)}</td>
                                                    <td className={cellClass}>{stackedCell(serials)}</td>
                                                    <td className={cellClass}>{stackedCell(machineTypes)}</td>
                                                    <td className={`${cellClass} text-right`}>
                                                        ₹{hospitalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {!isCustomer && (
                        <div className="mt-3 text-[11px]">
                            <p><strong>Amount Chargeable (in words):</strong> {numberToIndianWords(total)}</p>
                        </div>
                    )}

                    <div className="text-right mt-4 space-y-1">
                        <p><strong>Sub Total:</strong> ₹{Number(subTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        {discount > 0 && <p><strong>Discount:</strong> -₹{Number(discount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>}
                        <p>
                            <strong>
                                {igst > 0 && cgst <= 0 && sgst <= 0
                                    ? "GST (IGST @ 18%)"
                                    : cgst > 0 || sgst > 0
                                        ? "GST"
                                        : "GST (IGST @ 18%)"}:
                            </strong>{" "}
                            ₹{Number(gst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm font-bold">Total: ₹{Number(total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between gap-6 mt-auto text-[10px] sm:text-xs">
                        <div>
                            <h2 className="font-semibold">Bank Details:</h2>
                            <p><strong>Name:</strong> ANTESO Biomedical OPC Pvt. Ltd.</p>
                            <p><strong>A/C No:</strong> 50200007211263 HDFC BANK</p>
                            <p><strong>IFSC:</strong> HDFC0000711</p>
                            <p><strong>Branch:</strong> Pushpanjali Enclave, Pitampura New Delhi</p>
                        </div>
                        <div className="text-right">
                            <p><strong>For ANTESO Biomedical OPC Pvt. Ltd.</strong></p>
                            <img src={signature} alt="Signature" className="h-14 ml-auto" />
                            <p><strong>Authorized Signatory</strong></p>
                        </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-black text-[10px] sm:text-xs text-center">
                        Please make cheques payble to us :ANTESO Biomedical OPC Pvt. Ltd. For any Clarification this invoice, please email us on: accounts@antesobiomedicalopc.com
                    </div>
                </div>

                <div className="flex justify-end mt-4 print:hidden gap-2">
                    <button
                        onClick={handleDownloadPdf}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded"
                    >
                        Download PDF
                    </button>
                    {!uploaded && (
                        <button
                            onClick={handleUploadInvoice}
                            disabled={uploading}
                            className={`bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {uploading ? "Uploading..." : "Upload Invoice"}
                        </button>
                    )}
                    {/* <button
                        onClick={() => window.print()}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2 rounded"
                    >
                        Print Invoice
                    </button> */}
                </div>

            </div>
        </div>
    );
};

export default InvoiceDealer;