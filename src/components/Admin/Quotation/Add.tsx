"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { FaAngleRight } from "react-icons/fa6"
import logoA from "../../../assets/quotationImg/NABLlogo.png"
import signature from "../../../assets/quotationImg/signature.png"
import qrcode from "../../../assets/quotationImg/qrcode.png"
import logo from "../../../assets/logo/logo-sm.png"
import IconTrashLines from "../../Icon/IconTrashLines"
import { allEmployees, getEnquiryById, createQuotationByEnquiryId } from "../../../api"
import { showMessage } from "../../common/ShowMessage"

type Item = {
    type: string
    id: number
    title: string
    description?: string
    quantity: string
    price: string
    amount: string
}

type Employee = {
    _id: string
    name: string
    phone: number
    email: string
    address: string
    role: string
    status: string
    technicianType: string
    tools: any[]
    createdAt: string
    updatedAt: string
    __v: number
}

type StringItemKeys = "type" | "title" | "description" | "quantity" | "price" | "amount"

type QuotationData = {
    date: string
    quotationNumber: string
    expiryDate: string
    customer: {
        name: string
        email: string
        phone: string
        hospitalName: string
    }
    assignedEmployee: {
        id: string
        name: string
        phone: number
    }
    items: {
        categoryA: Item[]
        categoryB: Item[]
    }
    calculations: {
        subtotal: number
        discount: number
        discountAmount: number
        totalAmount: number
    }
    termsAndConditions: Array<{
        id: number
        text: string
    }>
    bankDetails: {
        hdfc: {
            accountNumber: string
            ifsc: string
            branch: string
        }
        icici: {
            accountNumber: string
            ifsc: string
            branch: string
        }
    }
    companyDetails: {
        gstNumber: string
        aerbRegistration: string
        nablAccreditation: string
    }
}

const INITIAL_TERMS = [
    "In case of License renewal, eLora ID and Password need to be provided by you.",
    "The quotation applies only to the equipment mentioned above. Charges for any additional parameters will be extra.",
    "Repeated Q/A for failed equipment and repeated visits for the same machine will be charged extra.",
    "Share your GST number with the work order if applicable; otherwise, the order will be considered unregistered and no future claims will be entertained.",
]

const STYLES = `
    input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        text-decoration: none;
    }
    input { text-decoration: none; }
`

// Reusable Components
const InfoRow: React.FC<{ label: string; value: string; isEmail?: boolean }> = ({ label, value, isEmail }) => (
    <tr className="text-[.7rem]">
        <td className="font-bold">{label}:</td>
        <td className="pl-2">
            {isEmail ? (
                <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
                    {value}
                </a>
            ) : (
                value
            )}
        </td>
    </tr>
)

const ItemsTable: React.FC<{
    title: string
    headerBg: string
    items: Item[]
    onItemChange: (index: number, key: StringItemKeys, value: string) => void
    showEditableDescription?: boolean
}> = ({ title, headerBg, items, onItemChange, showEditableDescription = false }) => (
    <table className="w-full text-xs mb-6">
        <thead className={headerBg}>
            <tr>
                <th className="p-2 text-[.7rem]">{title}</th>
                <th className="text-[.7rem]">S.NO</th>
                <th className="text-[.7rem] w-36">{title === "A" ? "TYPE OF MACHINE" : "ADDITIONAL SERVICE"}</th>
                <th className="text-[.7rem]">DESCRIPTION</th>
                <th className="text-[.7rem]">QTY</th>
                {/* <th className="text-[.7rem]">RATE</th> */}
                <th className="text-[.7rem]">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            {items.map((item, i) => (
                <tr key={item.id} className="border-b">
                    <td className="p-2 text-[.7rem]">{item.type}</td>
                    <td className="text-[.7rem]">{item.id}</td>
                    <td className="text-[.7rem]">{item.title}</td>
                    <td className="text-[.7rem]">
                        {showEditableDescription ? (
                            <input
                                value={item.description || ""}
                                onChange={(e) => onItemChange(i, "description", e.target.value)}
                                className="w-full border rounded p-1 text-[.7rem]"
                            />
                        ) : (
                            item.description
                        )}
                    </td>
                    {["quantity", "price"].map((field) => (
                        <td key={field}>
                            <input
                                value={item[field as keyof Item] as string}
                                onChange={(e) => onItemChange(i, field as StringItemKeys, e.target.value)}
                                type="number"
                                readOnly={field === "quantity"}
                                className={`border rounded p-1 text-right text-[.7rem] ${field === "quantity" ? "w-16 bg-gray-100 cursor-not-allowed" : field === "price" ? "w-20" : "w-24"
                                    }`}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
)

const AddQuotation: React.FC = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    console.log("🚀 ~ AddQuotation ~ id:", id)

    // State
    const [discount, setDiscount] = useState<number>(10)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [enquiryData, setEnquiryData] = useState<any>(null)
    const [newTerm, setNewTerm] = useState("")
    const [terms, setTerms] = useState(INITIAL_TERMS.map((text, index) => ({ id: index + 1, text })))
    const [quotationNumber, setQuotationNumber] = useState("QUO001")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [aitems, setAItems] = useState<Item[]>([
        {
            type: "",
            id: 1,
            title: "CT SCAN",
            description: "QA + LICENSE + DECOMMISSIONING",
            quantity: "1",
            price: "",
            amount: "",
        },
    ])

    const [bitems, setBItems] = useState<Item[]>([
        { type: "", id: 1, title: "INSTITUTE REGISTRATION", description: "", quantity: "1", price: "", amount: "" },
        {
            type: "",
            id: 2,
            title: "LEAD SHEET",
            description: "SIZE 7' X 4' FROM REMARKS 20 SQ FEET",
            quantity: "1",
            price: "",
            amount: "",
        },
    ])

    // Effects
    useEffect(() => {
        const fetchEnquiry = async () => {
            if (!id) return
            try {
                const data = await getEnquiryById(id)
                console.log("🚀 ~ fetched enquiry data:", data)
                setEnquiryData(data)

                // Machines → aitems
                if (Array.isArray(data.machines)) {
                    const machineData: Item[] = data.machines.map((machine: any, index: number) => ({
                        id: index + 1,
                        type: "A",
                        title: machine.machineType || "",
                        description: Array.isArray(machine.workType) ? machine.workType.join(", ") : "",
                        quantity: "1",
                        price: "",
                        amount: "",
                    }))
                    setAItems(machineData)
                }

                // Additional Services → bitems
                if (data.additionalServices && typeof data.additionalServices === "object") {
                    const serviceData: Item[] = Object.entries(data.additionalServices).map(
                        ([key, value]: [string, any], index: number) => ({
                            id: index + 1,
                            type: "B",
                            title: key,
                            description: value || "",
                            quantity: "1",
                            price: "",
                            amount: "",
                        }),
                    )
                    setBItems(serviceData)
                }
            } catch (err) {
                console.error("Failed to fetch enquiry:", err)
            }
        }
        fetchEnquiry()
    }, [id])

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await allEmployees()
                console.log("🚀 ~ fetchEmployees ~ res:", res)
                setEmployees(res)
            } catch (error) {
                console.error("Failed to fetch employees", error)
            }
        }
        fetchEmployees()
    }, [])

    // Handlers
    const handleItemChange = (
        listSetter: React.Dispatch<React.SetStateAction<Item[]>>,
        items: Item[],
        index: number,
        key: StringItemKeys,
        value: string,
    ) => {
        // Prevent quantity changes
        if (key === "quantity") return

        const updated = [...items]
        updated[index][key] = value
        if (key === "price") {
            const qty = Number.parseFloat(updated[index].quantity) || 1
            const price = Number.parseFloat(updated[index].price) || 0
            updated[index].amount = (qty * price).toString()
        }
        listSetter(updated)
    }

    const handleTerms = {
        add: () => {
            if (!newTerm.trim()) return
            setTerms((prev) => [...prev, { id: Date.now(), text: newTerm }])
            setNewTerm("")
        },
        edit: (id: number, newText: string) => {
            setTerms((prev) => prev.map((term) => (term.id === id ? { ...term, text: newText } : term)))
        },
        delete: (id: number) => {
            setTerms((prev) => prev.filter((term) => term.id !== id))
        },
    }

    // Calculations
    const calculations = {
        aitemsTotal: aitems.reduce((sum, item) => sum + Number.parseFloat(item.amount || "0"), 0),
        bitemsTotal: bitems.reduce((sum, item) => sum + Number.parseFloat(item.amount || "0"), 0),
        get subtotal() {
            return this.aitemsTotal + this.bitemsTotal
        },
        get discountAmount() {
            return (this.subtotal * discount) / 100
        },
        get totalAmount() {
            return this.subtotal - this.discountAmount
        },
    }

    // Submit Handler
    const handleSubmitQuotation = async () => {
        setIsSubmitting(true)

        try {
            const quotationData: QuotationData = {
                date: new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }),
                quotationNumber,
                expiryDate: "30 days from above date",
                customer: {
                    name: enquiryData?.customer?.name || "",
                    email: enquiryData?.customer?.email || "",
                    phone: enquiryData?.customer?.phone || "",
                    hospitalName: enquiryData?.hospitalName || "",
                },
                assignedEmployee: {
                    id: employees[selectedIndex]?._id || "",
                    name: employees[selectedIndex]?.name || "",
                    phone: employees[selectedIndex]?.phone || 0,
                },
                items: {
                    categoryA: aitems.map((item) => ({ ...item, type: "A" })),
                    categoryB: bitems.map((item) => ({ ...item, type: "B" })),
                },
                calculations: {
                    subtotal: calculations.subtotal,
                    discount,
                    discountAmount: calculations.discountAmount,
                    totalAmount: calculations.totalAmount,
                },
                //  Save only text array
                termsAndConditions: terms.map((t) => t.text),

                bankDetails: {
                    hdfc: {
                        accountNumber: "50200007211263",
                        ifsc: "HDFC0000711",
                        branch: "HDFC BANK PUSHPANJALI ENCLAVE PITAMPURA",
                    },
                    icici: {
                        accountNumber: "344305001088",
                        ifsc: "ICIC0003443",
                        branch: "ICICI BANK ROHINI",
                    },
                },
                companyDetails: {
                    gstNumber: "07AAMCA8142J1ZE",
                    aerbRegistration: "14-AFSXE-2148",
                    nablAccreditation: "TC-9843",
                },
            }

            console.log("Submitting quotation data:", quotationData)

            const response = await createQuotationByEnquiryId(quotationData, id)

            console.log("Quotation created successfully:", response)
            showMessage("Quotation submitted successfully!")
            navigate("/admin/enquiry")
        } catch (error: any) {
            console.error("Failed to submit quotation:", error)
            const errorMessage =
                error?.response?.data?.message || error?.message || "Failed to submit quotation. Please try again."
            alert(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <div className="w-full min-h-screen bg-gray-50 p-8 absolute top-0 left-0 z-50 lg:px-[15%]">
            <style>{STYLES}</style>
            <div className="max-w-6xl mx-auto rounded-lg p-6 bg-white w-[50rem]">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <img src={logo || "/placeholder.svg"} alt="Logo B" className="h-20 mb-2" />
                        <p className="text-sm font-bold text-[.5rem]">AERB Registration No. 14-AFSXE-2148</p>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold uppercase">Quotation</h1>
                    </div>
                    <div className="text-right">
                        <img src={logoA || "/placeholder.svg"} alt="Logo A" className="h-20 ml-auto mb-2" />
                        <p className="text-sm font-bold text-[.5rem]">NABL Accreditation No TC-9843</p>
                    </div>
                </div>

                {/* Company Info */}
                <div className="flex w-full justify-between mb-4">
                    <table className="text-sm w-full" style={{ lineHeight: "1.5rem" }}>
                        <tbody>
                            <InfoRow
                                label="Date"
                                value={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            />
                            <tr className="text-[.7rem]">
                                <td className="font-bold pb-4">To:</td>
                                <td className="pl-2" style={{ lineHeight: "20px" }}>
                                    <span className="font-bold">{enquiryData?.customer?.name?.toUpperCase() || "N/A"}</span>
                                    <br />
                                    {enquiryData?.hospitalName || "N/A"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div style={{ lineHeight: "17px" }}>
                        <p className="font-bold text-black text-[.7rem]">ANTESO Biomedical (OPC) Pvt. Ltd.</p>
                        {[
                            "Flat No. 290, 2nd Floor, Block D,",
                            "Pocket 7, Sector 6, Rohini,",
                            "New Delhi – 110 085, INDIA",
                            "Mobile: +91 8470909720 / 8951818690",
                            "Email: info@antesobiomedicalopc.com",
                        ].map((line, i) => (
                            <p key={i} className="text-[.7rem]">
                                {line}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Contact Info */}
                <div className="mb-4 bg-gray-50 p-2">
                    <table className="text-sm w-full max-w-[20rem]">
                        <tbody>
                            <InfoRow label="Email" value={enquiryData?.customer?.email || "N/A"} isEmail />
                            <InfoRow label="Contact" value={enquiryData?.customer?.phone || "N/A"} />
                            <tr className="text-[.7rem]">
                                <td className="font-bold">From:</td>
                                <td className="pl-2">
                                    <select
                                        className="text-[.7rem] border border-gray-300 rounded px-1 focus:outline-none"
                                        value={selectedIndex}
                                        onChange={(e) => setSelectedIndex(Number(e.target.value))}
                                    >
                                        {employees.map((emp, index) => (
                                            <option key={emp._id} value={index}>
                                                {emp.name} (employee)
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="pl-2">{employees[selectedIndex]?.phone || ""}</td>
                            </tr>
                            <tr className="h-5"></tr>
                            <tr className="text-[.7rem]">
                                <td className="font-bold">Quotation:</td>
                                <td className="pl-2">
                                    <input
                                        type="text"
                                        value={quotationNumber}
                                        onChange={(e) => setQuotationNumber(e.target.value)}
                                        className="text-[.7rem] border border-gray-300 rounded px-1 focus:outline-none"
                                    />
                                </td>
                            </tr>
                            <InfoRow label="Expires" value="30 days from above date" />
                        </tbody>
                    </table>
                </div>

                {/* Items Tables */}
                <div>
                    <h2 className="font-semibold text-gray-800 mb-4 text-[.8rem]">Quotation Details</h2>
                    <ItemsTable
                        title="A"
                        headerBg="bg-gray-600"
                        items={aitems}
                        onItemChange={(i, key, value) => handleItemChange(setAItems, aitems, i, key, value)}
                    />
                    <ItemsTable
                        title="B"
                        headerBg="bg-blue-200"
                        items={bitems}
                        onItemChange={(i, key, value) => handleItemChange(setBItems, bitems, i, key, value)}
                        showEditableDescription
                    />

                    {/* Totals */}
                    <div className="flex justify-end gap-8 text-sm font-medium">
                        <div className="space-y-1 gap-4 w-60 p-3">
                            <div className="flex items-center justify-between gap-2 text-[.8rem]">
                                <label className="font-semibold">Discount %</label>
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                                    className="w-16 text-sm text-right border rounded px-2 py-1"
                                />
                            </div>
                            {[
                                ["Subtotal", calculations.subtotal],
                                [`Discount (${discount}%)`, -calculations.discountAmount],
                                ["Total", calculations.totalAmount],
                            ].map(([label, amount], i) => (
                                <div key={i} className={`flex justify-between text-[.8rem] ${i === 2 ? "text-green-700" : ""}`}>
                                    <span>{label}:</span>
                                    <span>
                                        {i === 1 ? "- " : ""}₹ {Math.abs(amount as number).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleSubmitQuotation}
                            disabled={isSubmitting}
                            className={`px-6 py-2 text-white rounded ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                }`}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Quotation"}
                        </button>
                    </div>
                </div>

                {/* Terms & Conditions */}
                <div className="mt-4">
                    <h4 className="m-3 text-sm font-semibold text-gray-800">Terms & Conditions:</h4>
                    <ul className="list-disc list-outside pl-6 space-y-2 text-gray-700 text-[.65rem]">
                        {terms.map((term) => (
                            <li key={term.id}>
                                <input
                                    type="text"
                                    value={term.text}
                                    onChange={(e) => handleTerms.edit(term.id, e.target.value)}
                                    className="w-full p-1 text-xs border rounded"
                                />
                                <div className="flex gap-2 mt-1">
                                    <button onClick={() => handleTerms.delete(term.id)} className="text-red-500 text-xs">
                                        <IconTrashLines />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pl-6">
                        <input
                            type="text"
                            value={newTerm}
                            onChange={(e) => setNewTerm(e.target.value)}
                            placeholder="Add new condition"
                            className="w-full p-1 text-xs border rounded"
                        />
                        <button onClick={handleTerms.add} className="mt-1 px-3 py-1 text-xs bg-green-600 text-white rounded">
                            Add Term
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex justify-between items-end text-xs">
                    <div>
                        <img src={signature || "/placeholder.svg"} alt="Signature" className="mb-2 h-24" />
                        <div className="space-y-1" style={{ lineHeight: "10px" }}>
                            {[
                                ["A/C No.", "50200007211263"],
                                ["IFSC", "HDFC0000711"],
                            ].map(([label, value]) => (
                                <p key={label} className="text-[.6rem]">
                                    <span className="font-medium">{label}:</span> {value}
                                </p>
                            ))}
                            <p className="text-[.6rem]">HDFC BANK PUSHPANJALI ENCLAVE PITAMPURA</p>
                        </div>
                    </div>
                    <div className="text-center" style={{ lineHeight: "5px" }}>
                        <p className="font-bold text-[.6rem]">OUR ACCOUNT DETAILS</p>
                        <p className="pb-10 mt-2 font-bold text-[.6rem]">
                            <span>GST NO:</span> 07AAMCA8142J1ZE
                        </p>
                    </div>
                    <div className="text-right space-y-1">
                        <img src={qrcode || "/placeholder.svg"} alt="QR Code" className="h-20 mx-auto mb-2" />
                        <table className="h-4">
                            <tbody>
                                {[
                                    ["Merchant Name:", "ANTESO BIOMEDICAL PRIVATE LIMITED"],
                                    ["Mobile Number:", "8470909720"],
                                ].map(([label, value]) => (
                                    <tr key={label} style={{ fontSize: ".4rem" }}>
                                        <td className={label.includes("Merchant") ? "pb-3 text-end" : "text-end"}>{label}</td>
                                        <td className={`text-start pl-2 ${label.includes("Merchant") ? "w-[7rem] leading-none" : ""}`}>
                                            {value}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="text-center text-[.4rem]" style={{ lineHeight: "8px" }}>
                            <p>Steps to PAy UPI QR Code</p>
                            <p className="flex justify-center items-center flex-wrap w-[10rem]">
                                Oppen UPI app <FaAngleRight /> Select Type to Pay <FaAngleRight /> Scan QR Code <FaAngleRight /> Enter
                                Amount
                            </p>
                        </div>
                        <hr className="bg-gray-700 h-[1.5px]" />
                        <div className="w-[7rem] m-auto">
                            {[
                                ["A/C No:", "344305001088"],
                                ["IFSC Code:", "ICIC0003443"],
                            ].map(([label, value]) => (
                                <p key={label} className="text-left text-[.6rem]">
                                    <span className="font-medium text-[.6rem]">{label}</span> {value}
                                </p>
                            ))}
                            <p className="text-[.6rem] text-left">ICICI BANK ROHINI</p>
                        </div>
                    </div>
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
            </div>
        </div>
    )
}

export default AddQuotation
