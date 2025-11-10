import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { FaAngleRight } from "react-icons/fa6"
import logoA from "../../../assets/quotationImg/NABLlogo.png"
import signature from "../../../assets/quotationImg/signature.png"
import qrcode from "../../../assets/quotationImg/qrcode.png"
import logo from "../../../assets/logo/logo-sm.png"
import IconTrashLines from "../../Icon/IconTrashLines"
import { getEnquiryById, createQuotationByEnquiryId, getAllDealers, getNextQuotationNumber, getAllEmployees, getAllManufacturer } from "../../../api"
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
    <table className="w-full text-xs mb-6">
        <thead className={headerBg}>
            <tr>
                {/* REMOVED: <th className="p-2 text-[.7rem]">{title}</th> */}
                <th className="text-[.7rem]">S.NO</th>
                <th className="text-[.7rem] w-36">{title === "A" ? "TYPE OF MACHINE" : "ADDITIONAL SERVICE"}</th>
                <th className="text-[.7rem]">DESCRIPTION</th>
                <th className="text-[.7rem]">QTY</th>
                <th className="text-[.7rem]">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            {items.map((item, i) => (
                <tr key={item.id} className="border-b">
                    {/* REMOVED: <td className="p-2 text-[.7rem]">{item.type}</td> */}
                    <td className="text-[.7rem]">{i + 1}</td>  {/* ← 1, 2, 3… */}
                    <td className="text-[.7rem]">{item.title}</td>
                    <td className="text-[.7rem]">
                        {showEditableDescription ? (
                            <input
                                value={item.description || ""}
                                onChange={(e) => onItemChange(i, "description", e.target.value)}
                                className="w-full border rounded p-1 text-[.7rem]"
                            />
                        ) : (
                            <input
                                value={item.description || ""}
                                onChange={() => { }}
                                className="w-full border rounded p-1 text-[.7rem] bg-gray-100 cursor-not-allowed"
                                disabled
                            />
                        )}
                    </td>
                    <td>
                        <input
                            value={item.quantity}
                            onChange={() => { }}
                            type="number"
                            readOnly
                            className={`
                                border rounded p-1 text-right text-[.7rem] w-16
                                ${item.type === "A" ? "bg-white" : "bg-gray-100 cursor-not-allowed"}
                            `}
                        />
                    </td>
                    <td className="text-[.7rem] ">
                        <input
                            value={item.price || ""}
                            onChange={(e) => onItemChange(i, "price", e.target.value)}
                            type="number"
                            className="border rounded p-1 text-right text-[.7rem] w-24 font-semibold"
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
                    getAllEmployees(),
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
                                    <span className="font-bold">{enquiryData?.hospitalName.toUpperCase() || "N/A"}</span>
                                    <br />
                                    {enquiryData?.fullAddress || "N/A"}
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
                            <InfoRow label="Email" value={enquiryData?.emailAddress || "N/A"} isEmail />
                            <InfoRow label="Contact" value={enquiryData?.customer?.phone || "N/A"} />
                            <tr className="text-[.7rem]">
                                <td className="font-bold">From:</td>
                                <td className="pl-2" colSpan={2}>
                                    <select
                                        className="text-[.7rem] border border-gray-300 rounded px-1 focus:outline-none w-full"
                                        value={selectedIndex}
                                        onChange={(e) => setSelectedIndex(Number(e.target.value))}
                                    >
                                        {people.map((person, index) => (
                                            <option key={person._id} value={index}>
                                                {person.name} ({person.type})
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                {/* Only show selected person's phone */}
                                <td className="pl-2">{people[selectedIndex]?.phone || ""}</td>
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

                    {/* Adjusted Layout: Discount Box and QR/Bank Details Side by Side */}
                    <div className="flex justify-between items-start gap-6 mt-4">
                        <div className="w-64 text-right space-y-1 text-xs">
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
                            <div className="text-center" style={{ lineHeight: "5px" }}>
                                <br />
                                <p className="font-bold text-[.6rem]">OUR ACCOUNT DETAILS</p>
                                <p className="pb-10 mt-2 font-bold text-[.6rem]">
                                    <span>GST NO:</span> 07AAMCA8142J1ZE
                                </p>
                            </div>
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
                        {/* Left: Discount/Totals Box */}
                        <div className="space-y-1 w-60 p-3 border rounded-md bg-gray-50">
                            {/* Discount Toggle Row */}
                            <div className="flex items-center justify-between gap-2 text-[.8rem]">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="discountCheck"
                                        checked={isDiscountApplied}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setIsDiscountApplied(checked);
                                            if (checked) {
                                                setDiscount(1); // start discount from 1 when checked
                                            } else {
                                                setDiscount(0); // reset discount when unchecked
                                            }
                                        }}
                                        className="appearance-none h-5 w-5 border-2 border-gray-400 cursor-pointer transition-all duration-200 checked:bg-blue-500 checked:border-blue-500 checked:after:block after:content-['✔'] after:text-white after:text-xs after:text-center after:leading-4"
                                    />
                                    <label htmlFor="discountCheck" className="font-semibold cursor-pointer">
                                        Apply Discount %
                                    </label>
                                </div>

                                {/* Discount input only if checked */}
                                {isDiscountApplied && (
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                                        className="w-16 text-sm text-right border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-green-300"
                                    />
                                )}
                            </div>

                            {/* Totals */}
                            {[
                                ["Subtotal", calculations.subtotal],
                                ...(isDiscountApplied ? [[`Discount (${discount}%)`, -calculations.discountAmount]] : []),
                                ["Total (Before GST)", isDiscountApplied ? calculations.totalAmount : calculations.subtotal],
                                [`GST (${GST_RATE}%)`, calculations.gstAmount],
                                ["Total (Including GST)", calculations.totalWithGst],
                            ].map(([label, amount], i) => (
                                <div
                                    key={i}
                                    className={`flex justify-between text-[.8rem] ${label === "Total (Including GST)" ? "text-green-700 font-semibold" : ""}`}
                                >
                                    <span>{label}:</span>
                                    <span>
                                        {label.toString().includes("Discount") ? "- " : ""}₹ {Math.abs(amount as number).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Right: QR Code and Bank Details */}

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

                {/* Footer - Adjusted to only include left and middle */}
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
                    {/* <div className="text-center" style={{ lineHeight: "5px" }}>
                        <p className="font-bold text-[.6rem]">OUR ACCOUNT DETAILS</p>
                        <p className="pb-10 mt-2 font-bold text-[.6rem]">
                            <span>GST NO:</span> 07AAMCA8142J1ZE
                        </p>
                    </div> */}
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
            {/* Inside AddQuotation.tsx (or wherever you’re using it) */}
            <div className="quotation-error-modal">
                <ConfirmModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onConfirm={() => setModalOpen(false)}
                    title="Quotation Submission Failed"
                    message={modalMessage}
                />
            </div>


            {/* Use a little CSS trick to hide the second (Delete) button */}
            <style>
                {`
    /* Hide Delete button only inside this page */
    .quotation-error-modal button.bg-red-600 {
        display: none !important;
    }
    /* Rename Cancel to Close for clarity */
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