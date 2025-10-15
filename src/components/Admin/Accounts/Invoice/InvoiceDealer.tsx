import React, { useEffect, useState, useRef } from "react";
import { getInvoiceById, uploadInvoice } from "../../../../api"; // added uploadInvoice API
import antesoLogo from "../../../../assets/logo/logo-sm.png";
import signature from "../../../../assets/quotationImg/signature.png";
import qrcode from "../../../../assets/quotationImg/qrcode.png";
import { useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";

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
                setInvoice(res.data.data);
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
        const opt:any = {
            margin: 0.2,
            filename: `Invoice_${invoice.invoiceId}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
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
            const opt :any= {
                margin: 0.2,
                filename: `Invoice_${invoice.invoiceId}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2 },
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
            alert("Invoice uploaded successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to upload invoice.");
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
        email: "-",
        phone: "-",
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
    const gst = invoice.igst || invoice.cgst + invoice.sgst || 0;
    const total = invoice.grandtotal || subTotal + gst;
    const isCustomer = invoice.type === "Customer";

    const customerItems = invoice.services?.map((s: any, index: number) => ({
        id: index + 1,
        description: s.description,
        hsn: s.hsnno || "-",
        qty: s.quantity || 0,
        rate: s.rate || 0,
        amount: (s.rate ?? 0) * (s.quantity ?? 0),
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
                        {isCustomer ? (
                            <table className="w-full table-fixed border border-black border-collapse text-[4px] sm:text-xs">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-black px-1 py-1 text-xs">S No</th>
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
                                            <td className="border border-black px-1 py-1 text-xs">{item.description}</td>
                                            <td className="border border-black px-1 py-1 text-xs">{item.hsn}</td>
                                            <td className="border border-black px-1 py-1 text-xs">{item.qty}</td>
                                            <td className="border border-black px-1 py-1 text-xs">₹{(item.rate ?? 0).toLocaleString("en-IN")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                        )}
                    </div>

                    {/* Totals */}
                    <div className="text-right mt-4 space-y-1">
                        <p><strong>Sub Total:</strong> ₹{(subTotal ?? 0).toLocaleString("en-IN")}</p>
                        <p><strong>GST:</strong> ₹{(gst ?? 0).toLocaleString("en-IN")}</p>
                        <p className="text-sm font-bold">Total: ₹{(total ?? 0).toLocaleString("en-IN")}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col md:flex-row justify-between gap-6 mt-auto text-[10px] sm:text-xs">
                        <div>
                            <h2 className="font-semibold">Bank Details:</h2>
                            <p><strong>Name:</strong> ANTESO Biomedical OPC Pvt. Ltd.</p>
                            <p><strong>A/C No:</strong> 50200007211263 HDFC BANK</p>
                            <p><strong>IFSC:</strong> HDFC0000711</p>
                            <p><strong>Branch:</strong> Pushpanjali Enclave, Pitampura New Delhi</p>
                        </div>
                        <div>
                            <img src={qrcode} alt="QR Code" className="h-20 w-20 object-contain" />
                        </div>
                        <div className="text-right">
                            <p><strong>For ANTESO Biomedical OPC Pvt. Ltd.</strong></p>
                            <img src={signature} alt="Signature" className="h-14 ml-auto" />
                            <p><strong>Authorized Signatory</strong></p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end mt-4 print:hidden gap-2">
                    <button
                        onClick={handleDownloadPdf}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded"
                    >
                        Download PDF
                    </button>
                    <button
                        onClick={handleUploadInvoice}
                        disabled={uploading}
                        className={`bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {uploading ? "Uploading..." : "Upload Invoice"}
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2 rounded"
                    >
                        Print Invoice
                    </button>
                </div>

            </div>
        </div>
    );
};

export default InvoiceDealer;
