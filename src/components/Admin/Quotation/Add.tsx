import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import logoA from "../../../assets/quotationImg/NABLlogo.png"
import signature from "../../../assets/quotationImg/signature.png"
import qrcode from "../../../assets/quotationImg/qrcode.png"
import logo from "../../../assets/logo/anteso-logo2.png"
import IconTrashLines from "../../Icon/IconTrashLines"
import { getEnquiryById, createQuotationByEnquiryId, getAllDealers, getNextQuotationNumber, getAllActiveEmployees, getAllManufacturer } from "../../../api"
import { showMessage } from "../../common/ShowMessage"
import ConfirmModal from "../../common/ConfirmModal"

type Item = {
    type: string
    id: number
    name?: string;
    title: string
    description?: string
    quantity: string
    price: string
    amount: string
}
interface ServiceItem extends Item {
    id: any
    machineType: string;
    equipmentNo?: string;
    machineModel?: string;
    serialNumber?: string;
    remark?: string;
    totalAmount?: number;
}

interface AdditionalServiceItem extends Item {
    id: any
    name: string;
    description?: string;
    totalAmount?: number;
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
    // items: {
    //     categoryA: Item[]
    //     categoryB: Item[]
    // }
    items: {
        services: ServiceItem[]
        additionalServices: AdditionalServiceItem[]
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
    "Customers have to provide their eLora login credentials while renewing their license. When necessary, the customer must also provide the TLD badge numbers.",
    "Quotation is only for the equipment mentioned above. Charges for any additional parameter will be charged extra.",
    "Repeated Q/A for failed equipments & Repeated visit for same machine will be charged extra.",
    "QA Reports will be submitted only after the bank realizes 100% of the payment, & in exceptional circumstances, the minimum time frame for sharing QA reports will be 24 hours.",
    "QA reports for dental x-ray machines have a five-year validity period, whereas x-ray machine QA reports have a two-year validity period.",
    "Prices are valid for the duration of this quotation, after which they are subject to change without notice.",
    "Service execution will begin within two weeks after receipt of the formal Purchase Order.",
    'All payments should be made by DD, e-Transfer or Cheque payable to "ANTESO Biomedical (OPC) Pvt. Ltd."',
    "Terms of payment: 100% payment in advance.",
    "If the consumer chooses to pay by cheque they should only send it to our registered address.",
    "The QA test will be conducted as per AERB guidelines; Anteso will not be held accountable if a machine malfunctions during the test.",
    "During institute registration / RSO registration, the system will send a unique OTP to the customer's registered mobile number or email address. The customer is required to share it to complete the registration process.",
    "The customer must check and validate their email address before sharing it, as we will be utilizing it exactly as it appears in the document. It can't be retrieved later.",
    "Please share the GST No. with work order if applicable, else we will consider it in unregistered and no future claims will be entertained.",
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

// const ItemsTable: React.FC<{
//     title: string
//     headerBg: string
//     items: Item[]
//     onItemChange: (index: number, key: StringItemKeys, value: string) => void
//     showEditableDescription?: boolean
// }> = ({ title, headerBg, items, onItemChange, showEditableDescription = false }) => (
//     <table className="w-full text-xs mb-6">
//         <thead className={headerBg}>
//             <tr>
//                 <th className="p-2 text-[.7rem]">{title}</th>
//                 <th className="text-[.7rem]">S.NO</th>
//                 <th className="text-[.7rem] w-36">{title === "A" ? "TYPE OF MACHINE" : "ADDITIONAL SERVICE"}</th>
//                 <th className="text-[.7rem]">DESCRIPTION</th>
//                 <th className="text-[.7rem]">QTY</th>
//                 {/* <th className="text-[.7rem]">RATE</th> */}
//                 <th className="text-[.7rem]">TOTAL</th>
//             </tr>
//         </thead>
//         <tbody>
//             {items.map((item, i) => (
//                 <tr key={item.id} className="border-b">
//                     <td className="p-2 text-[.7rem]">{item.type}</td>
//                     <td className="text-[.7rem]">{item.id}</td>
//                     <td className="text-[.7rem]">{item.title}</td>
//                     {/* <td className="text-[.7rem]">
//                         {showEditableDescription ? (
//                             <input
//                                 value={item.description || ""}
//                                 onChange={(e) => onItemChange(i, "description", e.target.value)}
//                                 className="w-full border rounded p-1 text-[.7rem]"
//                             />
//                         ) : (
//                             item.description
//                         )}
//                     </td> */}
//                     <td className="text-[.7rem]">
//                         <input
//                             value={item.description || ""}
//                             onChange={(e) => onItemChange(i, "description", e.target.value)}
//                             className="w-full border rounded p-1 text-[.7rem] bg-gray-100 cursor-not-allowed"
//                             disabled // ✅ make it read-only
//                         />
//                     </td>

//                     {["quantity", "price"].map((field) => (
//                         <td key={field}>
//                             <input
//                                 value={item[field as keyof Item] as string}
//                                 onChange={(e) => onItemChange(i, field as StringItemKeys, e.target.value)}
//                                 type="number"
//                                 required
//                                 readOnly={field === "quantity"}
//                                 className={`border rounded p-1 text-right text-[.7rem] ${field === "quantity" ? "w-16 bg-gray-100 cursor-not-allowed" : field === "price" ? "w-20" : "w-24"
//                                     }`}
//                             />
//                         </td>
//                     ))}

//                 </tr>
//             ))}
//         </tbody>
//     </table>
// )


// const ItemsTable: React.FC<{
//     title: string
//     headerBg: string
//     items: Item[]
//     onItemChange: (index: number, key: StringItemKeys, value: string) => void
//     showEditableDescription?: boolean
// }> = ({ title, headerBg, items, onItemChange, showEditableDescription = false }) => (
//     <table className="w-full text-xs mb-6">
//         <thead className={headerBg}>
//             <tr>
//                 <th className="p-2 text-[.7rem]">{title}</th>
//                 <th className="text-[.7rem]">S.NO</th>
//                 <th className="text-[.7rem] w-36">{title === "A" ? "TYPE OF MACHINE" : "ADDITIONAL SERVICE"}</th>
//                 <th className="text-[.7rem]">DESCRIPTION</th>
//                 <th className="text-[.7rem]">QTY</th>
//                 <th className="text-[.7rem]">RATE</th>
//             </tr>
//         </thead>
//         <tbody>
//             {items.map((item, i) => (
//                 <tr key={item.id} className="border-b">
//                     <td className="p-2 text-[.7rem]">{item.type}</td>
//                     <td className="text-[.7rem]">{item.id}</td>
//                     <td className="text-[.7rem]">{item.title}</td>
//                     {/* ✅ Conditional for description: Editable only for B (additional services) */}
//                     <td className="text-[.7rem]">
//                         {showEditableDescription ? (
//                             <input
//                                 value={item.description || ""}
//                                 onChange={(e) => onItemChange(i, "description", e.target.value)}
//                                 className="w-full border rounded p-1 text-[.7rem]" // Editable for B, no disabled
//                             />
//                         ) : (
//                             <input
//                                 value={item.description || ""}
//                                 onChange={() => { }} // No-op for A
//                                 className="w-full border rounded p-1 text-[.7rem] bg-gray-100 cursor-not-allowed"
//                                 disabled // Read-only for A (services)
//                             />
//                         )}
//                     </td>
//                     {/* ✅ Quantity input (read-only for both) */}
//                     {/* <td>
//                         <input
//                             value={item.quantity}
//                             onChange={() => { }} // No-op
//                             type="number"
//                             readOnly
//                             className="border rounded p-1 text-right text-[.7rem] w-16 bg-gray-100 cursor-not-allowed"
//                         />
//                     </td> */}
//                     <td>
//                         <input
//                             value={item.quantity}
//                             onChange={() => { }}               // no-op
//                             type="number"
//                             readOnly
//                             className={`
//             border rounded p-1 text-right text-[.7rem] w-16
//             ${item.type === "A" ? "bg-white" : "bg-gray-100 cursor-not-allowed"}
//         `}
//                         />
//                     </td>
//                     {/* ✅ TOTAL field: Editable for both A and B (services now allow adding/editing total) */}
//                     <td className="text-[.7rem] text-right">
//                         <input
//                             value={item.price || ""}                     // <-- show price, NOT amount
//                             onChange={(e) => onItemChange(i, "price", e.target.value)}
//                             type="number"
//                             className="border rounded p-1 text-right text-[.7rem] w-24 font-semibold"
//                         />
//                     </td>
//                 </tr>
//             ))}
//         </tbody>
//     </table>
// )

const ItemsTable: React.FC<{
    title: string
    headerBg: string
    items: Item[]
    onItemChange: (index: number, key: StringItemKeys, value: string) => void
    showEditableDescription?: boolean
}> = ({ title, headerBg, items, onItemChange, showEditableDescription = false }) => (
    <table className="w-full text-xs mb-6 border border-gray-400 border-collapse">
        <thead>
            <tr>
                <th
                    className="text-[.7rem] border border-gray-400 px-1.5 py-0.5"
                    style={{ backgroundColor: "#2563eb", color: "#ffffff", lineHeight: "1rem" }}
                >
                    S.NO
                </th>
                <th
                    className="text-[.7rem] w-36 border border-gray-400 px-1.5 py-0.5"
                    style={{ backgroundColor: "#2563eb", color: "#ffffff", lineHeight: "1rem" }}
                >
                    {title === "A" ? "TYPE OF MACHINE" : "ADDITIONAL SERVICE"}
                </th>
                <th
                    className="text-[.7rem] min-w-[320px] border border-gray-400 px-1.5 py-0.5"
                    style={{ backgroundColor: "#2563eb", color: "#ffffff", lineHeight: "1rem" }}
                >
                    DESCRIPTION
                </th>
                <th
                    className="text-[.7rem] border border-gray-400 px-1.5 py-0.5"
                    style={{ backgroundColor: "#2563eb", color: "#ffffff", lineHeight: "1rem" }}
                >
                    QTY
                </th>
                <th
                    className="text-[.7rem] border border-gray-400 px-1.5 py-0.5"
                    style={{ backgroundColor: "#2563eb", color: "#ffffff", lineHeight: "1rem" }}
                >
                    TOTAL
                </th>
            </tr>
        </thead>
        <tbody>
            {items.map((item, i) => (
                <tr key={item.id}>
                    <td className="text-[.7rem] border border-gray-400 px-1.5 py-0.5" style={{ lineHeight: "1rem" }}>{i + 1}</td>
                    <td className="text-[.7rem] border border-gray-400 px-1.5 py-0.5" style={{ lineHeight: "1rem" }}>{item.title}</td>
                    <td className="text-[.7rem] border border-gray-400 px-1.5 py-0.5">
                        {showEditableDescription ? (
                            <textarea
                                value={item.description || ""}
                                onChange={(e) => onItemChange(i, "description", e.target.value)}
                                rows={1}
                                className="w-full min-w-[320px] border rounded p-0.5 text-[.7rem] resize-y"
                                style={{ lineHeight: "1rem" }}
                            />
                        ) : (
                            <textarea
                                value={item.description || ""}
                                onChange={() => { }}
                                rows={1}
                                className="w-full min-w-[320px] border rounded p-0.5 text-[.7rem] bg-gray-100 cursor-not-allowed resize-none"
                                style={{ lineHeight: "1rem" }}
                                disabled
                            />
                        )}
                    </td>
                    <td className="border border-gray-400 px-1.5 py-0.5">
                        <input
                            value={item.quantity}
                            onChange={() => { }}
                            type="number"
                            readOnly
                            className={`
                                border rounded p-0.5 text-right text-[.7rem] w-16
                                ${item.type === "A" ? "bg-white" : "bg-gray-100 cursor-not-allowed"}
                            `}
                        />
                    </td>
                    <td className="text-[.7rem] border border-gray-400 px-1.5 py-0.5">
                        <input
                            value={item.price || ""}
                            onChange={(e) => onItemChange(i, "price", e.target.value)}
                            type="number"
                            className="border rounded p-0.5 text-right text-[.7rem] w-24 font-semibold"
                        />
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
)


const AddQuotation: React.FC = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    // console.log("🚀 ~ AddQuotation ~ id:", id)
    // State
    const [discount, setDiscount] = useState<number>(10)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [enquiryData, setEnquiryData] = useState<any>(null)
    const [newTerm, setNewTerm] = useState("")
    const [terms, setTerms] = useState(INITIAL_TERMS.map((text, index) => ({ id: index + 1, text })))
    const [quotationNumber, setQuotationNumber] = useState("QUO001")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dealers, setDealers] = useState<any[]>([])   // store dealers here
    const [isDiscountApplied, setIsDiscountApplied] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [manufacturers, setManufacturers] = useState<any[]>([]) // NEW
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
    // useEffect(() => {
    //     const fetchEnquiry = async () => {
    //         if (!id) return
    //         try {
    //             const data = await getEnquiryById(id)
    //             console.log("🚀 ~ fetched enquiry data:", data)
    //             setEnquiryData(data)

    //             // Machines → aitems
    //             // ✅ Correct (backend sends "services")
    //             if (Array.isArray(data.services)) {
    //                 const serviceData: Item[] = data.services.map((service: any, idx: number) => ({
    //                     id: service._id,
    //                     type: "A",
    //                     title: service.machineType || "",
    //                     description: service.workTypeDetails
    //                         ? service.workTypeDetails.map((w: any) => w.workType).join(", ")
    //                         : "",
    //                     quantity: "1",
    //                     price: service.totalAmount ? service.totalAmount.toString() : "",
    //                     amount: service.totalAmount ? service.totalAmount.toString() : "",
    //                 }));
    //                 setAItems(serviceData);
    //             }


    //             // Additional Services → bitems
    //             if (Array.isArray(data.additionalServices)) {
    //                 const serviceData: Item[] = data.additionalServices.map((service: any) => ({
    //                     id: service._id, // ✔️ Use ObjectId from DB
    //                     type: "B",
    //                     title: service.name || "",
    //                     description: service.description || "",
    //                     quantity: "1",
    //                     price: "",
    //                     amount: "",
    //                 }));
    //                 setBItems(serviceData);

    //             } else if (typeof data.additionalServices === "object") {
    //                 // if backend sends object
    //                 const serviceData: Item[] = Object.values(data.additionalServices).map(
    //                     (service: any) => ({
    //                         id: service._id, // ✅ Use ObjectId from MongoDB
    //                         type: "B",
    //                         title: service.name || "",
    //                         description: service.description || "",
    //                         quantity: "1",
    //                         price: "",
    //                         amount: "",
    //                     })
    //                 )

    //                 setBItems(serviceData)
    //             }

    //         } catch (err) {
    //             console.error("Failed to fetch enquiry:", err)
    //         }
    //     }
    //     fetchEnquiry()
    // }, [id])

    useEffect(() => {
        const fetchEnquiry = async () => {
            if (!id) return
            try {
                const data = await getEnquiryById(id)
                setEnquiryData(data)

                // ---------- SERVICES (A) ----------
                if (Array.isArray(data.services)) {
                    const serviceData: Item[] = data.services.map((service: any) => ({
                        id: service._id,
                        type: "A",
                        title: service.machineType || "",
                        description: service.workTypeDetails
                            ? service.workTypeDetails.map((w: any) => w.workType).join(", ")
                            : "",
                        // <-- REAL QUANTITY FROM BACKEND
                        quantity: service.quantity?.toString() ?? "1",
                        price: service.totalAmount ? service.totalAmount.toString() : "",
                        amount: "",                     // will be filled by handleItemChange
                    }));
                    setAItems(serviceData);
                }

                // ---------- ADDITIONAL SERVICES (B) ----------
                if (Array.isArray(data.additionalServices)) {
                    const addData: Item[] = data.additionalServices.map((service: any) => ({
                        id: service._id,
                        type: "B",
                        title: service.name || "",
                        description: service.description || "",
                        quantity: "1",                 // <-- ALWAYS 1
                        price: "",
                        amount: "",
                    }));
                    setBItems(addData);
                }
                // … (object fallback unchanged)
            } catch (err) { /* … */ }
        }
        fetchEnquiry()
    }, [id])

    const [people, setPeople] = useState<any[]>([])
    useEffect(() => {
        const fetchNextQuotationNumber = async () => {
            try {
                const res = await getNextQuotationNumber();
                // Assuming your API returns something like { data: { nextNumber: "QUO001" } }
                if (res?.data?.nextNumber) {
                    setQuotationNumber(res.data.nextNumber);
                }
            } catch (err) {
                console.error("Failed to fetch next quotation number", err);
                // fallback if needed
                setQuotationNumber("QUO001");
            }
        };

        fetchNextQuotationNumber();
    }, []);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empRes, dealerRes, manufacturerRes] = await Promise.all([
                    getAllActiveEmployees(),
                    getAllDealers(),
                    getAllManufacturer()
                ]);

                // === 1. EMPLOYEES ===
                const employeeList = (empRes?.data || []).map((e: any) => ({
                    ...e,
                    type: "employee",
                }));

                // === 2. DEALERS ===
                const dealerList = (dealerRes?.data?.dealers || []).map((d: any) => ({
                    ...d,
                    type: "dealer",
                }));

                // === 3. MANUFACTURERS ===
                const manufacturerList = (manufacturerRes?.data?.data || []).map((m: any) => ({
                    ...m,
                    type: "manufacturer",
                }));

                // Optional: Store separately if needed elsewhere
                setEmployees(employeeList);
                setDealers(dealerList);
                setManufacturers(manufacturerList);

                // === UNIFIED DROPDOWN LIST ===
                const unifiedPeople = [...employeeList, ...dealerList, ...manufacturerList];
                setPeople(unifiedPeople);

                console.log("Unified People:", unifiedPeople);

            } catch (error: any) {
                console.error("Error fetching people data:", error);
                const msg = error?.response?.data?.message || "Failed to load contacts.";
                setModalMessage(msg);
                setModalOpen(true);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!enquiryData?.leadOwner || !Array.isArray(people) || people.length === 0) return;

        const leadOwnerId = String(enquiryData.leadOwner?.id || "").trim();
        const leadOwnerName = String(enquiryData.leadOwner?.name || "").trim().toLowerCase();

        const matchedIndex = people.findIndex((person) => {
            const personId = String(person?._id || "").trim();
            const personName = String(person?.name || "").trim().toLowerCase();

            if (leadOwnerId && personId && personId === leadOwnerId) return true;
            if (!leadOwnerId && leadOwnerName && personName === leadOwnerName) return true;
            return false;
        });

        if (matchedIndex >= 0) {
            setSelectedIndex(matchedIndex);
        }
    }, [enquiryData, people]);


    // Handlers
    // const handleItemChange = (
    //     listSetter: React.Dispatch<React.SetStateAction<Item[]>>,
    //     items: Item[],
    //     index: number,
    //     key: StringItemKeys,
    //     value: string,
    // ) => {
    //     // Prevent quantity changes
    //     if (key === "quantity") return

    //     const updated = [...items]
    //     updated[index][key] = value
    //     if (key === "price") {
    //         const qty = Number.parseFloat(updated[index].quantity) || 1
    //         const price = Number.parseFloat(updated[index].price) || 0
    //         updated[index].amount = (qty * price).toString()
    //     }
    //     listSetter(updated)
    // }


    // const handleItemChange = (
    //     listSetter: React.Dispatch<React.SetStateAction<Item[]>>,
    //     items: Item[],
    //     index: number,
    //     key: StringItemKeys,
    //     value: string,
    // ) => {
    //     if (key === "quantity") return;

    //     const updated = [...items];
    //     updated[index][key] = value;

    //     if (key === "price") {
    //         const qty = Number.parseFloat(updated[index].quantity) || 1;
    //         const price = Number.parseFloat(updated[index].price) || 0;
    //         updated[index].amount = (qty * price).toString();  // 👈 Works for both
    //     }

    //     listSetter(updated);
    // };

    const handleItemChange = (
        listSetter: React.Dispatch<React.SetStateAction<Item[]>>,
        items: Item[],
        index: number,
        key: StringItemKeys,
        value: string,
    ) => {
        if (key === "quantity") return;               // quantity never changes

        const updated = [...items];
        updated[index][key] = value;

        if (key === "price") {
            const qty = Number.parseFloat(updated[index].quantity) || 1;
            const price = Number.parseFloat(value) || 0;
            // amount = qty × price  → used only for the grand total
            updated[index].amount = (qty * price).toString();
        }

        listSetter(updated);
    };

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

    // Calculations including GST
    const GST_RATE = 18; // 18%

    const calculations = {
        // aitemsTotal: aitems.reduce((sum, item) => sum + Number.parseFloat(item.amount || "0"), 0),
        // bitemsTotal: bitems.reduce((sum, item) => sum + Number.parseFloat(item.amount || "0"), 0),
        aitemsTotal: aitems.reduce((sum, item) => sum + Number.parseFloat(item.amount || "0"), 0),
        bitemsTotal: bitems.reduce((sum, item) => sum + Number.parseFloat(item.amount || "0"), 0),
        get subtotal() {
            return this.aitemsTotal + this.bitemsTotal;
        },
        get discountAmount() {
            return (this.subtotal * discount) / 100;
        },
        get totalAmount() {
            return this.subtotal - this.discountAmount;
        },
        get gstAmount() {
            return (this.totalAmount * GST_RATE) / 100;
        },
        get totalWithGst() {
            return this.totalAmount + this.gstAmount;
        },
    };



    const handleSubmitQuotation = async () => {
        const invalidAItems = aitems.filter(item => !item.amount || parseFloat(item.amount) <= 0);
        const invalidBItems = bitems.filter(item => !item.amount || parseFloat(item.amount) <= 0);

        if (invalidAItems.length > 0 || invalidBItems.length > 0) {
            setModalMessage("Please ensure all Total fields are filled correctly non-negative and non-zero");
            setModalOpen(true);
            return;
        }

        setIsSubmitting(true); try {

            // const serviceSnapshots: ServiceItem[] = aitems.map((s) => {
            //     const qty = Number.parseFloat(s.quantity) || 1;
            //     const price = Number.parseFloat(s.price || "0");
            //     const total = qty * price;

            //     return {
            //         // id: typeof s.id === "number" ? s.id : Number(s.id),
            //         id: String(s.id),
            //         type: s.type || "A",
            //         title: s.title,
            //         description: s.description || "",
            //         quantity: s.quantity || "1",
            //         price: s.price || "0",
            //         amount: total.toString(),   // match string type
            //         machineType: s.title,
            //         equipmentNo: (s as any).equipmentNo,
            //         machineModel: (s as any).machineModel,
            //         serialNumber: (s as any).serialNumber,
            //         remark: (s as any).remark,
            //         totalAmount: total,
            //     };
            // });

            // const additionalServiceSnapshots: AdditionalServiceItem[] = bitems.map((s) => {
            //     const qty = Number.parseFloat(s.quantity) || 1;
            //     const price = Number.parseFloat(s.price || "0");
            //     const total = qty * price;
            //     console.log("🚀 ~ handleSubmitQuotation ~ total:", total)
            //     console.log("🚀 ~ handleSubmitQuotation ~ total:", total)

            //     return {
            //         // id: s.id?.toString() || "",
            //         // id: typeof s.id === "number" ? s.id : Number(s.id),
            //         id: String(s.id),
            //         type: s.type || "B",
            //         title: s.title,
            //         description: s.description || "",
            //         quantity: s.quantity || "1",
            //         price: s.price || "0",
            //         amount: total.toString(),
            //         name: s.title,
            //         totalAmount: total,
            //     };
            // });



            const serviceSnapshots: ServiceItem[] = aitems.map((s) => {
                const qty = Number.parseFloat(s.quantity) || 1;
                const price = Number.parseFloat(s.price || "0");
                const total = qty * price;

                return {
                    id: String(s.id),
                    type: s.type || "A",
                    title: s.title,
                    description: s.description || "",
                    quantity: s.quantity,
                    price: s.price || "0",           // per-unit price
                    amount: total.toString(),        // qty × price (for display in PDF)
                    machineType: s.title,
                    totalAmount: total,              // backend field
                };
            });

            const additionalServiceSnapshots: AdditionalServiceItem[] = bitems.map((s) => {
                const qty = Number.parseFloat(s.quantity) || 1;
                const price = Number.parseFloat(s.price || "0");
                const total = qty * price;

                return {
                    id: String(s.id),
                    type: s.type || "B",
                    title: s.title,
                    description: s.description || "",
                    quantity: s.quantity,
                    price: s.price || "0",
                    amount: total.toString(),
                    name: s.title,
                    totalAmount: total,
                };
            });
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
                    // id: employees[selectedIndex]?._id || "",
                    // name: employees[selectedIndex]?.name || "",
                    // phone: employees[selectedIndex]?.phone || 0,
                    id: people[selectedIndex]?._id || "",
                    name: people[selectedIndex]?.name || "",
                    phone: people[selectedIndex]?.phone || 0,
                },
                items: {
                    services: serviceSnapshots,
                    additionalServices: additionalServiceSnapshots,
                },
                calculations: {
                    subtotal: calculations.subtotal,
                    discount: discount,
                    discountAmount: calculations.discountAmount,
                    totalAmount: calculations.totalAmount,
                },
                // termsAndConditions: terms.map(t => t.text),
                termsAndConditions: terms.map(t => ({ id: t.id, text: t.text })),

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
            };

            console.log("Submitting quotation data:", quotationData);

            const response = await createQuotationByEnquiryId(quotationData, id);

            console.log("Quotation created successfully:", response);
            showMessage("Quotation submitted successfully!");
            navigate("/admin/enquiry");
        } catch (error: any) {
            console.error("Failed to submit quotation:", error);
            const errorMessage =
                error?.response?.data?.message || error?.message || "Failed to submit quotation. Please try again.";

            // Instead of alert:
            setModalMessage(errorMessage);
            setModalOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };


    const machineTypes = [
        ...new Set(aitems.map((item) => item.title).filter(Boolean)),
    ].join(", ");

    const additionalServiceNames = bitems
        .map((item) => item.title || item.name)
        .filter(Boolean)
        .join(", ");

    const toAddress = [
        enquiryData?.hospitalName,
        enquiryData?.fullAddress,
        enquiryData?.city,
        enquiryData?.district,
        enquiryData?.state && enquiryData?.pinCode
            ? `${enquiryData.state}-${enquiryData.pinCode}`
            : enquiryData?.state || enquiryData?.pinCode,
    ]
        .filter(Boolean)
        .join(", ");

    const quotationDescriptionParts = [
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

    return (
        <div className="w-full min-h-screen bg-gray-50 px-8 absolute top-0 left-0 z-50 lg:px-[15%]">
            <style>{STYLES}</style>
            <div
                className="mx-auto px-6 pb-5 pt-0 bg-white"
                style={{ width: "793px", maxWidth: "100%", boxSizing: "border-box" }}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <img src={logo || "/placeholder.svg"} alt="Logo B" className="h-20" />
                        <p className="font-bold text-[.6rem]">AERB Registration No. 14-AFSXE-2148</p>
                    </div>
                    <div className="text-center pt-2">
                        <h1 className="text-xl font-bold uppercase">Quotation</h1>
                    </div>
                    <div className="text-right">
                        <img src={logoA || "/placeholder.svg"} alt="Logo A" className="h-20 ml-auto" />
                        <p className="font-bold text-[.6rem]">NABL Accreditation No TC-9843</p>
                    </div>
                </div>

                {/* Company and Recipient Info */}
                <div className="flex w-full justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="text-[.7rem]" style={{ lineHeight: "1.35rem" }}>
                            <div className="flex">
                                <span className="font-bold shrink-0 w-[4.5rem]">Date:</span>
                                <span>
                                    {new Date().toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex mt-1">
                                <span className="font-bold shrink-0 w-[4.5rem]">To</span>
                                <div style={{ lineHeight: "18px" }}>
                                    {enquiryData?.contactPerson && (
                                        <>
                                            <span className="font-bold">{enquiryData.contactPerson}</span>
                                            <br />
                                        </>
                                    )}
                                    <span className="font-bold">
                                        {(enquiryData?.hospitalName || "N/A").toUpperCase()}
                                    </span>
                                    <br />
                                    {enquiryData?.fullAddress || "N/A"}
                                    {(enquiryData?.city || enquiryData?.district || enquiryData?.state) && (
                                        <>
                                            <br />
                                            {[enquiryData?.city, enquiryData?.district]
                                                .filter(Boolean)
                                                .join(", ")}
                                            {enquiryData?.state
                                                ? `, ${enquiryData.state}${enquiryData?.pinCode ? `-${enquiryData.pinCode}` : ""}`
                                                : ""}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex mt-2">
                                <span className="font-bold shrink-0 w-[4.5rem]">Email-</span>
                                <a
                                    href={`mailto:${enquiryData?.emailAddress || ""}`}
                                    className="text-blue-600 hover:underline"
                                >
                                    {enquiryData?.emailAddress || "N/A"}
                                </a>
                            </div>
                            <div className="flex">
                                <span className="font-bold shrink-0 w-[4.5rem]">Contact.-</span>
                                <span>
                                    {enquiryData?.contactNumber ||
                                        enquiryData?.customer?.phone ||
                                        "N/A"}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="font-bold shrink-0">From: </span>
                                <select
                                    className="text-[.7rem] border border-gray-300 rounded px-1 focus:outline-none max-w-[12rem]"
                                    value={selectedIndex}
                                    onChange={(e) => setSelectedIndex(Number(e.target.value))}
                                >
                                    {people.map((person, index) => (
                                        <option key={person._id} value={index}>
                                            {person.name} ({person.type})
                                        </option>
                                    ))}
                                </select>
                                <span className="inline-block w-6" />
                                <span className="font-bold">M: </span>
                                <span>{people[selectedIndex]?.phone || ""}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-shrink-0 text-left pt-6" style={{ lineHeight: "17px" }}>
                        <p className="font-bold text-black text-[.7rem]">ANTESO Biomedical (OPC) Pvt. Ltd.</p>
                        <p className="text-[.7rem]">Flat No. 290, 2nd Floor, Block D,</p>
                        <p className="text-[.7rem]">Pocket 7, Sector 6, Rohini,</p>
                        <p className="text-[.7rem]">New Delhi – 110 085, INDIA</p>
                        <p className="text-[.7rem]">Mobile: +91 8470909720 / 8951818690</p>
                        <p className="text-[.7rem]">Email: info@antesobiomedicalopc.com</p>
                    </div>
                </div>

                <div className="w-full text-[.7rem] font-bold mt-3" style={{ lineHeight: "1.3rem" }}>
                    <span>QUOTATION : </span>
                    <input
                        type="text"
                        value={quotationNumber}
                        onChange={(e) => setQuotationNumber(e.target.value)}
                        className="text-[.7rem] font-bold border border-gray-300 rounded px-1 focus:outline-none mr-1"
                    />
                    <span>{quotationDescriptionParts}</span>
                </div>
                <div className="w-full text-[.7rem] mb-2 mt-0.5" style={{ lineHeight: "1.3rem" }}>
                    <span className="font-bold">EXPIRES: </span>
                    <span>30 days from above date</span>
                </div>

                {/* Items Tables */}
                <div>
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
                </div>

                {/* Totals */}
                <div className="mt-2 w-full">
                    <div className="flex items-center justify-end gap-2 text-[.65rem] mb-1">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="discountCheck"
                                checked={isDiscountApplied}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setIsDiscountApplied(checked);
                                    if (checked) {
                                        setDiscount(1);
                                    } else {
                                        setDiscount(0);
                                    }
                                }}
                                className="appearance-none h-4 w-4 border-2 border-gray-400 cursor-pointer transition-all duration-200 checked:bg-blue-500 checked:border-blue-500 checked:after:block after:content-['✔'] after:text-white after:text-[10px] after:text-center after:leading-3"
                            />
                            <label htmlFor="discountCheck" className="font-semibold cursor-pointer">
                                Apply Discount %
                            </label>
                        </div>
                        {isDiscountApplied && (
                            <input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                                className="w-14 text-[.65rem] text-right border rounded px-1 py-0.5 focus:outline-none focus:ring focus:ring-green-300"
                            />
                        )}
                    </div>
                    <table className="w-full text-xs border border-gray-400 border-collapse" style={{ lineHeight: "12px" }}>
                        <tbody>
                            <tr>
                                <td className="border border-gray-400 px-1.5 py-0.5 text-gray-900 font-bold text-[.6rem] w-[70%]">Subtotal</td>
                                <td className="border border-gray-400 px-1.5 py-0.5 text-[.7rem] font-bold text-right">
                                    ₹{calculations.subtotal.toLocaleString("en-IN")}
                                </td>
                            </tr>
                            {isDiscountApplied && (
                                <tr>
                                    <td className="border border-gray-400 px-1.5 py-0.5 text-gray-900 font-bold text-[.6rem]">Discount</td>
                                    <td className="border border-gray-400 px-1.5 py-0.5 text-[.7rem] font-bold text-right">{discount}%</td>
                                </tr>
                            )}
                            <tr>
                                <td className="border border-gray-400 px-1.5 py-0.5 text-gray-900 font-bold text-[.6rem]">GST Rate</td>
                                <td className="border border-gray-400 px-1.5 py-0.5 text-[.7rem] font-bold text-right">{GST_RATE}%</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 px-1.5 py-0.5 text-gray-900 font-bold text-[.6rem]">GST Amount</td>
                                <td className="border border-gray-400 px-1.5 py-0.5 text-[.7rem] font-bold text-right">
                                    ₹{calculations.gstAmount.toLocaleString("en-IN")}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 px-1.5 py-0.5 text-gray-900 font-bold text-[.6rem]">TOTAL</td>
                                <td className="border border-gray-400 px-1.5 py-0.5 text-[.7rem] font-bold text-right">
                                    ₹{calculations.totalWithGst.toLocaleString("en-IN")}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <br />
                <hr />

                {/* Terms & Conditions */}
                <div className="mt-4" style={{ paddingTop: "36px" }}>
                    <h4 className="text-sm font-semibold text-gray-800">Terms & Conditions:</h4>
                    <div
                        className="mt-1 space-y-1 text-gray-700 text-[.65rem]"
                        style={{ lineHeight: "1.25rem" }}
                    >
                        {terms.map((term) => (
                            <div key={term.id} className="flex gap-1 items-start">
                                <span className="shrink-0">-</span>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={term.text}
                                        onChange={(e) => handleTerms.edit(term.id, e.target.value)}
                                        className="w-full p-1 text-xs border rounded"
                                    />
                                    <button
                                        onClick={() => handleTerms.delete(term.id)}
                                        className="text-red-500 text-xs mt-0.5"
                                    >
                                        <IconTrashLines />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4">
                        <input
                            type="text"
                            value={newTerm}
                            onChange={(e) => setNewTerm(e.target.value)}
                            placeholder="Add new condition"
                            className="w-full p-1 text-xs border rounded"
                        />
                        <button
                            onClick={handleTerms.add}
                            className="mt-1 px-3 py-1 text-xs bg-green-600 text-white rounded"
                        >
                            Add Term
                        </button>
                    </div>
                </div>

                {/* Footer — signature | QR, then 3-col bank row */}
                <div className="mt-4 w-full">
                    <div className="flex flex-nowrap justify-between items-start gap-4 w-full">
                        <div className="flex-shrink-0">
                            <img
                                src={signature || "/placeholder.svg"}
                                alt="Signature"
                                className="h-36 w-auto object-contain object-left"
                            />
                        </div>

                        <div className="flex-shrink-0 w-[15rem] flex flex-col items-center text-center">
                            <img
                                src={qrcode || "/placeholder.svg"}
                                alt="QR Code"
                                className="h-28 w-28 object-contain"
                            />
                            <div className="mt-0.5 flex flex-col items-center text-gray-900">
                                <div className="w-28 mx-auto text-[.4rem] text-left" style={{ lineHeight: "8px" }}>
                                    <div className="flex gap-1 items-start">
                                        <span className="whitespace-nowrap shrink-0">Merchant Name :</span>
                                        <span className="break-words">ANTESO BIOMEDICAL PRIVATE LIMITED</span>
                                    </div>
                                    <div className="flex gap-1 items-start">
                                        <span className="whitespace-nowrap shrink-0">Mobile Number :</span>
                                        <span>8470909720</span>
                                    </div>
                                </div>
                                <div
                                    className="mt-0.5 w-full text-center text-[.4rem] px-1"
                                    style={{ lineHeight: "10px" }}
                                >
                                    <p>Steps to Pay UPI QR Code</p>
                                    <p>
                                        Open UPI app &gt; Select Type to Pay &gt; Scan QR Code &gt; Enter Amount
                                    </p>
                                </div>
                            </div>
                            <hr className="bg-gray-700 h-[1.5px] mt-0.5 mb-0 w-full" />
                        </div>
                    </div>

                    <div
                        className="flex flex-nowrap justify-between items-start gap-3 w-full mt-0.5 text-[.6rem]"
                        style={{ lineHeight: "11px" }}
                    >
                        <div className="flex-1 min-w-0 text-left">
                            <p>
                                <span className="font-medium">A/C No.:</span> 50200007211263
                            </p>
                            <p>
                                <span className="font-medium">IFSC :</span> HDFC0000711
                            </p>
                            <p>HDFC BANK PUSHPANJALI ENCLAVE PITAMPURA</p>
                        </div>
                        <div className="flex-1 min-w-0 text-center">
                            <p className="font-bold">OUR ACCOUNT DETAILS</p>
                            <p className="font-bold">
                                <span>GST NO :</span> 07AAMCA8142J1ZE
                            </p>
                        </div>
                        <div className="flex-1 min-w-0 text-left pl-6">
                            <p>
                                <span className="font-medium">A/C No</span> 344305001088
                            </p>
                            <p>
                                <span className="font-medium">IFSC Code</span> ICIC0003443
                            </p>
                            <p>ICICI BANK ROHINI</p>
                        </div>
                    </div>
                </div>

                <div className="mt-3 text-center text-[.6rem]" style={{ lineHeight: "12px" }}>
                    <p>
                        For any enquiry contact us{" "}
                        <a href="#" className="text-blue-800">
                            business.quote@antesobiomedicalopc.com / antesobiomedical@gmail.com
                        </a>
                    </p>
                    <p>Feel free to call us & Thank you for your enquiry</p>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSubmitQuotation}
                        disabled={isSubmitting}
                        className={`px-6 py-2 text-white rounded ${
                            isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Quotation"}
                    </button>
                </div>
            </div>

            <div className="quotation-error-modal">
                <ConfirmModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onConfirm={() => setModalOpen(false)}
                    title="Quotation Submission Failed"
                    message={modalMessage}
                />
            </div>

            <style>
                {`
    .quotation-error-modal button.bg-red-600 {
        display: none !important;
    }
    .quotation-error-modal button.bg-gray-200::after {
       
    }
    .quotation-error-modal button.bg-gray-200 {
        font-weight: 500;
    }
`}
            </style>
        </div>
    )
}

export default AddQuotation