import React, { useState } from 'react';
import logoA from '../../../assets/quotationImg/NABLlogo.png';
import logoB from '../../../assets/quotationImg/images.jpg';
import signature from '../../../assets/quotationImg/signature.png';
import qrcode from '../../../assets/quotationImg/qrcode.png';
import { useNavigate } from 'react-router-dom';
import { FaAngleRight } from 'react-icons/fa6';

type Item = {
    type: string;
    id: number;
    title: string;
    description?: string; // Changed from services to description
    quantity: string;
    price: string;
    amount: string;
};

const contactList = [
    { name: 'Anjana Thakur', phone: '9317509720' },
    { name: 'Khalid Khan', phone: '8091750188' },
    { name: 'Ramesh Verma', phone: '9876543210' },
];

const AddQuotation: React.FC = () => {
    const navigate = useNavigate();
    const [discount, setDiscount] = useState<number>(10);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const handleNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedIndex(parseInt(e.target.value));
    };

    const [aitems, setAItems] = useState<Item[]>([
        {
            type: '',
            id: 1,
            title: 'CT SCAN',
            description: 'QA + LICENSE + DECOMMISSIONING', // Changed from services
            quantity: '2',
            price: '',
            amount: '',
        },
    ]);

    const [bitems, setBItems] = useState<Item[]>([
        {
            type: '',
            id: 1,
            title: 'INSTITUTE REGISTRATION',
            description: '',
            quantity: '',
            price: '',
            amount: '',
        },
        {
            type: '',
            id: 2,
            title: 'LEAD SHEET',
            description: "SIZE 7' X 4' FROM REMARKS 20 SQ FEET",
            quantity: '',
            price: '',
            amount: '',
        },
    ]);

    // Restrict key to string-compatible properties
    type StringItemKeys = 'type' | 'title' | 'description' | 'quantity' | 'price' | 'amount'; // Changed services to description

    const handleItemChange = (listSetter: React.Dispatch<React.SetStateAction<Item[]>>, items: Item[], index: number, key: StringItemKeys, value: string) => {
        const updated = [...items];
        updated[index][key] = value;

        // Auto-calculate amount only when quantity or price changes
        if (key === 'quantity' || key === 'price') {
            const qty = parseFloat(updated[index].quantity) || 0;
            const price = parseFloat(updated[index].price) || 0;
            updated[index].amount = (qty * price).toString();
        }

        listSetter(updated);
    };

    const aitemsTotal = aitems.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
    const bitemsTotal = bitems.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
    const subtotal = aitemsTotal + bitemsTotal;
    const discountAmount = (subtotal * discount) / 100;
    const totalAmount = subtotal - discountAmount;

    const quotationSubmited = () => navigate('/admin/enquiry');

    const [terms, setTerms] = useState([
        {
            id: 1,
            text: 'In case of License renewal, eLora ID and Password need to be provided by you.',
        },
        {
            id: 2,
            text: 'The quotation applies only to the equipment mentioned above. Charges for any additional parameters will be extra.',
        },
        {
            id: 3,
            text: 'Repeated Q/A for failed equipment and repeated visits for the same machine will be charged extra.',
        },
        {
            id: 4,
            text: 'Share your GST number with the work order if applicable; otherwise, the order will be considered unregistered and no future claims will be entertained.',
        },
    ]);

    const [newTerm, setNewTerm] = useState('');

    const handleAdd = () => {
        if (!newTerm.trim()) return;
        const newItem = {
            id: Date.now(),
            text: newTerm,
        };
        setTerms((prev) => [...prev, newItem]);
        setNewTerm('');
    };

    const handleEdit = (id: number, newText: string) => {
        setTerms((prev) => prev.map((term) => (term.id === id ? { ...term, text: newText } : term)));
    };

    const handleDelete = (id: number) => {
        setTerms((prev) => prev.filter((term) => term.id !== id));
    };

    return (
        <div className="w-full min-h-screen bg-gray-50 p-8 absolute top-0 left-0 z-50 lg:px-[15%]">
            {/* Add custom CSS for input focus */}
            <style>
                {`
                    input:focus {
                        outline: none;
                        border-color: #3b82f6; /* Tailwind's blue-500 */
                        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); /* Custom focus ring */
                        text-decoration: none;
                    }
                    input {
                        text-decoration: none;
                    }
                `}
            </style>
            <div className="max-w-6xl mx-auto rounded-lg p-6 bg-white w-[50rem]">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <img src={logoB} alt="Logo B" className="h-20 mb-2" />
                        <p className="text-sm font-bold text-[.5rem]">AERB Registration No. 14-AFSXE-2148</p>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold uppercase">Quotation</h1>
                    </div>
                    <div className="text-right">
                        <img src={logoA} alt="Logo A" className="h-20 ml-auto mb-2" />
                        <p className="text-sm font-bold text-[.5rem]">NABL Accreditation No TC-9843</p>
                    </div>
                </div>

                {/* Company and Recipient Info */}
                <div className="flex w-full justify-between mb-4">
                    <div>
                        <table
                            className="text-sm w-full"
                            style={{
                                lineHeight: '1.5rem',
                            }}
                        >
                            <tr className="text-[.7rem]">
                                <td>Date:</td>
                                <td className="pl-2">22-Nov-2024</td>
                            </tr>
                            <tr className="text-[.7rem]">
                                <td className="font-bold pb-4">To:</td>
                                <td
                                    className="pl-2"
                                    style={{
                                        lineHeight: '20px',
                                    }}
                                >
                                    <span className="font-bold">CIVIL HOSPITAL KOTLI</span>
                                    <br />
                                    KOTLI, MANDI, HIMACHAL PRADESH-175003
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div
                        className=""
                        style={{
                            lineHeight: '17px',
                        }}
                    >
                        <p className="font-bold text-black text-[.7rem]">ANTESO Biomedical (OPC) Pvt. Ltd.</p>
                        <p className="text-[.7rem]">Flat No. 290, 2nd Floor, Block D,</p>
                        <p className="text-[.7rem]">Pocket 7, Sector 6, Rohini,</p>
                        <p className="text-[.7rem]">New Delhi – 110 085, INDIA</p>
                        <p className="text-[.7rem]">Mobile: +91 8470909720 / 8951818690</p>
                        <p className="text-[.7rem]">Email: info@antesobiomedicalopc.com</p>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="mb-4 bg-gray-50 p-2">
                    <table className="text-sm w-full  max-w-[20rem]">
                        <tr className="text-[.7rem]">
                            <td className="font-bold">Email:</td>
                            <td className="pl-2">
                                <a href="mailto:khalid020288@gmail.com" className="text-blue-600 hover:underline">
                                    khalid020288@gmail.com
                                </a>
                            </td>
                        </tr>
                        <tr className="text-[.7rem]">
                            <td className="font-bold">Contact:</td>
                            <td className="pl-2">80917 50188</td>
                        </tr>
                        {/* <tr className="text-[.7rem]">
                            <td className="font-bold">From:</td>
                            <td className="pl-2">
                                Anjana Thakur
                                </td>
                            <td className="font-bold">Phone</td>
                            <td className="pl-2">9317509720</td>
                        </tr> */}
                        <tr className="text-[.7rem]   rounded px-1 focus:outline-none focus:ring-0">
                            <td className="font-bold">From:</td>
                            <td className="pl-2">
                                <select className="text-[.7rem] border border-gray-300 rounded px-1 focus:outline-none" value={selectedIndex} onChange={handleNameChange}>
                                    {contactList.map((contact, index) => (
                                        <option value={index} key={index}>
                                            {contact.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="font-bold">Phone</td>
                            <td className="pl-2">{contactList[selectedIndex].phone}</td>
                        </tr>

                        <tr className="h-5"></tr>
                        <tr className="text-[.7rem]">
                            <td className="font-bold">Quotation:</td>
                            <td className="pl-2 font-bold">QUO001</td>
                        </tr>
                        <tr className="text-[.7rem]">
                            <td className="font-bold">Expires:</td>
                            <td className="pl-2">30 days from above date</td>
                        </tr>
                    </table>
                </div>

                {/* Items Table */}
                <div>
                    <h2 className="font-semibold text-gray-800 mb-4 text-[.8rem]">Quotation Details</h2>
                    <table className="w-full text-xs mb-6">
                        <thead className="bg-blue-600">
                            <tr className="bg-gray-600">
                                <th className="p-2 text-[.7rem]">A</th>
                                <th className="text-[.7rem]">S.NO</th>
                                <th className="text-[.7rem] w-36">TYPE OF MACHINE</th>
                                <th className="text-[.7rem]">DESCRIPTION</th>
                                <th className="text-[.7rem]">QTY</th>
                                <th className="text-[.7rem]">RATE</th>
                                <th className="text-[.7rem]">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aitems.map((item, i) => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-2 text-[.7rem]">{item.type}</td>
                                    <td className="text-[.7rem]">{item.id}</td>
                                    <td className="text-[.7rem]">{item.title}</td>
                                    <td className="text-[.7rem]">{item.description}</td>
                                    <td>
                                        <input
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(setAItems, aitems, i, 'quantity', e.target.value)}
                                            type="number"
                                            className="w-16 border rounded p-1 text-right text-[.7rem]"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={item.price}
                                            onChange={(e) => handleItemChange(setAItems, aitems, i, 'price', e.target.value)}
                                            type="number"
                                            className="w-20 border rounded p-1 text-right text-[.7rem]"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={item.amount}
                                            onChange={(e) => handleItemChange(setAItems, aitems, i, 'amount', e.target.value)}
                                            type="number"
                                            className="w-24 border rounded p-1 text-right text-[.7rem]"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <table className="w-full text-xs mb-6">
                        <thead className="bg-blue-200">
                            <tr>
                                <th className="text-[.7rem]">B</th>
                                <th className="text-[.7rem]">S.NO</th>
                                <th className="text-[.7rem]">ADDITIONAL SERVICE</th>
                                <th className="text-[.7rem]">DESCRIPTION</th>
                                <th className="text-[.7rem]">QTY</th>
                                <th className="text-[.7rem]">RATE</th>
                                <th className="text-[.7rem]">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bitems.map((item, i) => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-2 text-[.7rem]">{item.type}</td>
                                    <td className="text-[.7rem]">{item.id}</td>
                                    <td className="text-[.7rem]">{item.title}</td>
                                    <td className="text-[.7rem]">
                                        <input
                                            value={item.description || ''}
                                            onChange={(e) => handleItemChange(setBItems, bitems, i, 'description', e.target.value)}
                                            className="w-full border rounded p-1 text-[.7rem]"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(setBItems, bitems, i, 'quantity', e.target.value)}
                                            type="number"
                                            className="w-16 border rounded p-1 text-right text-[.7rem]"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={item.price}
                                            onChange={(e) => handleItemChange(setBItems, bitems, i, 'price', e.target.value)}
                                            type="number"
                                            className="w-20 border rounded p-1 text-right text-[.7rem]"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={item.amount}
                                            onChange={(e) => handleItemChange(setBItems, bitems, i, 'amount', e.target.value)}
                                            type="number"
                                            className="w-24 border rounded p-1 text-right text-[.7rem]"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end gap-8 text-sm font-medium">
                        <div className="space-y-1 gap-4 w-60 p-3">
                            <div className="flex items-center justify-between gap-2 text-[.8rem]">
                                <label className="font-semibold">Discount %</label>
                                <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-16 text-sm text-right border rounded px-2 py-1" />
                            </div>
                            <div className="flex justify-between text-[.8rem]">
                                <span>Subtotal:</span>
                                <span>₹ {subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-[.8rem]">
                                <span>Discount ({discount}%):</span>
                                <span>- ₹ {discountAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-green-700 text-[.8rem]">
                                <span>Total:</span>
                                <span>₹ {totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button onClick={quotationSubmited} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Submit Quotation
                        </button>
                    </div>
                </div>

                {/* <div className="mt-4">
                    <h4 className="m-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Terms & Conditions:</h4>
                    <ul
                        className="list-disc list-outside pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-[.65rem] leading-relaxed"
                        style={{
                            lineHeight: '10px',
                        }}
                    >
                        <li>In case of License renewal, eLora ID and Password need to be provided by you.</li>
                        <li>The quotation applies only to the equipment mentioned above. Charges for any additional parameters will be extra.</li>
                        <li>Repeated Q/A for failed equipment and repeated visits for the same machine will be charged extra.</li>
                        <li>QA reports will be submitted only after bank realization of 100% payment. In urgent cases, a minimum of 24 hours is required to share the QA report.</li>
                        <li>QA reports are valid for 2 years for X-Ray Machines and 5 years for Dental X-Rays.</li>
                        <li>Prices are valid only for the duration of this quotation and are subject to change thereafter.</li>
                        <li>Services will commence within a week of receiving a formal Purchase Order.</li>
                        <li>All payments must be made by DD, e-Transfer, or Cheque payable to “ANTESO Biomedical (OPC) Pvt. Ltd.”</li>
                        <li>Terms of payment: 100% advance payment.</li>
                        <li>Cheques must be couriered by the customer to our registered address.</li>
                        <li>QA tests will follow AERB guidelines. We are not responsible for any machine breakdowns during testing.</li>
                        <li>For institute or RSO registration, OTPs will be sent for verification. Please share them promptly.</li>
                        <li>Please ensure the accuracy of email IDs before sharing, as they will be used as-is and cannot be recovered later.</li>
                        <li className="text-green-600">
                            Share your GST number with the work order if applicable; otherwise, the order will be considered unregistered and no future claims will be entertained.
                        </li>
                    </ul>
                </div> */}
                <div className="mt-4">
                    <h4 className="m-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Terms & Conditions:</h4>

                    <ul className="list-disc list-outside pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-[.65rem]">
                        {terms.map((term) => (
                            <li key={term.id}>
                                <input type="text" value={term.text} onChange={(e) => handleEdit(term.id, e.target.value)} className="w-full p-1 text-xs border rounded" />
                                <div className="flex gap-2 mt-1">
                                    <button onClick={() => handleDelete(term.id)} className="text-red-500 text-xs">
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4 pl-6">
                        <input type="text" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} placeholder="Add new condition" className="w-full p-1 text-xs border rounded" />
                        <button onClick={handleAdd} className="mt-1 px-3 py-1 text-xs bg-green-600 text-white rounded">
                            Add Term
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex justify-between items-end text-xs">
                    <div>
                        <img src={signature} alt="Signature" className="mb-2 h-24" />
                        <div
                            className="space-y-1"
                            style={{
                                lineHeight: '10px',
                            }}
                        >
                            <p className="text-[.6rem]">
                                <span className="font-medium">A/C No.:</span> 50200007211263
                            </p>
                            <p className="text-[.6rem]">
                                <span className="font-medium">IFSC:</span> HDFC0000711
                            </p>
                            <p className="text-[.6rem]">HDFC BANK PUSHPANJALI ENCLAVE PITAMPURA</p>
                        </div>
                    </div>

                    <div
                        className="text-center"
                        style={{
                            lineHeight: '5px',
                        }}
                    >
                        <p className="font-bold text-[.6rem]">OUR ACCOUNT DETAILS</p>
                        <p className="pb-10 mt-2 font-bold text-[.6rem]">
                            <span>GST NO:</span> 07AAMCA8142J1ZE
                        </p>
                    </div>

                    <div className="text-right space-y-1">
                        <img src={qrcode} alt="QR Code" className="h-20 mx-auto mb-2" />
                        <table className="h-4">
                            <tr
                                style={{
                                    fontSize: '.4rem',
                                }}
                            >
                                <td className="pb-3 text-end">Merchant Name:</td>
                                <td className="w-[7rem] leading-none text-start pl-2">ANTESO BIOMEDICAL PRIVATE LIMITED</td>
                            </tr>
                            <tr
                                style={{
                                    fontSize: '.4rem',
                                }}
                            >
                                <td className="text-end">Mobile Number:</td>
                                <td className="text-start pl-2">8470909720</td>
                            </tr>
                        </table>
                        <div
                            className="text-center text-[.4rem]"
                            style={{
                                lineHeight: '8px',
                            }}
                        >
                            <p>Steps to PAy UPI QR Code</p>
                            <p className="flex justify-center items-center flex-wrap w-[10rem]">
                                Oppen UPI app <FaAngleRight /> Select Type to Pay <FaAngleRight /> Scan QR Code <FaAngleRight /> Enter Amount
                            </p>
                        </div>

                        <hr className="bg-gray-700 h-[1.5px]" />
                        <div>
                            <div className="w-[7rem] m-auto">
                                <p className="text-left text-[.6rem]">
                                    <span className="font-medium text-[.6rem]">A/C No:</span> 344305001088
                                </p>
                                <p className="text-left text-[.6rem]">
                                    <span className="font-medium text-[.6rem]">IFSC Code:</span> ICIC0003443
                                </p>
                                <p className="text-[.6rem] text-left">ICICI BANK ROHINI</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="overflow-x-auto mt-8 text-center"
                    style={{
                        lineHeight: '1rem',
                    }}
                >
                    <p className="text-[.6rem]">
                        For any enquiry contact us{' '}
                        <a href="#" className="text-blue-800">
                            info@antesobiomedicalopc.com or antesobiomedical@gmail.com
                        </a>
                    </p>
                    <p className="text-[.6rem]">Feel free to call us & Thank you for your enquiry</p>
                </div>
            </div>
        </div>
    );
};

export default AddQuotation;
