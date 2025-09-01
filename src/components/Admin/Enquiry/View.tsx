

import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import IconEye from "../../Icon/IconEye" // Assuming this path is correct in your project
import FormattedDate from "../../common/FormattedDate"

// Assuming this is your actual API function import
import { getEnquiryDetailsById } from "../../../api"
import Timeline from "../../common/AnimatedTimeline"
// Define interfaces
interface OptionType {
    value: string
    label: string
}
interface HospitalDetails {
    enquiryId: string
    hospitalName: string
    customer: {
        _id: string
        name: string
        phone: string | number
        email: string
    }
    services: {
        _id: string
        machineType: string
        equipmentNo: string | number
        machineModel: string
        serialNumber?: string
        remark?: string
        workTypeDetails: { workType: string; status: string }[]
    }[]
    additionalServices: Record<string, string>
    specialInstructions?: string
    attachment?: string
    enquiryStatusDates: {
        enquiredOn?: string
        quotationSentOn?: string
        approvedOn?: string
    }
}


// Constants (keeping as per original, though not directly used in this component's render)
const employeeOptions: OptionType[] = [
    { value: "Employee 1", label: "Employee 1" },
    { value: "Employee 2", label: "Employee 2" },
    { value: "Employee 3", label: "Employee 3" },
    { value: "Employee 4", label: "Employee 4" },
]
const View = () => {
    const { id } = useParams<{ id: string }>() // Use useParams from react-router-dom
    console.log("🚀 ~ View ~ id:", id)
    const [details, setDetails] = useState<HospitalDetails | null>(null)
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await getEnquiryDetailsById(id)
                console.log("🚀 ~ fetchDetails ~ response:", response)
                // FIX: Set the state with the 'response' directly, as getEnquiryDetailsById already returns the data object.
                setDetails(response)
            } catch (error) {
                console.error("Error fetching enquiry details:", error)
                // You might want to set an error state here to display an error message to the user
            }
        }
        if (id) {
            // Only fetch if id is available
            fetchDetails()
        }
    }, [id]) // Re-run effect if 'id' changes
    if (!details) return <div className="text-gray-600 p-6">Loading...</div>

    const fields = [
        { label: "Enquiry ID", value: details.enquiryId },
        { label: "Hospital Name", value: details.hospitalName },
        { label: "Contact Person Name", value: details.customer?.name },
        { label: "Email Address", value: details.customer?.email },
        { label: "Contact Number", value: details.customer?.phone },
    ]

    // Get keys from the additionalServices object to display them dynamically
    const additionalServiceKeys = Object.keys(details.additionalServices)

    return (
        <div>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark pb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/orders" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Orders
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to={`/admin/orders/${id}`} className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        View
                    </Link>
                </li>
            </ol>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Enquiry Details</h1>

            {/* Basic details */}
            <div className="bg-white p-6 rounded-xl shadow-xl">
                <h5 className="text-2xl font-bold text-gray-800 mb-6">Basic Details</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm text-gray-700">
                    {fields.map((field, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="text-xs uppercase text-gray-500 font-semibold mb-1">{field.label}</div>
                            <div className="text-gray-800 font-medium">{field.value}</div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Service details */}
            <div className="bg-white p-6 rounded-lg shadow-lg mt-5">
                <h5 className="text-lg font-bold text-gray-800 mb-6">Service Details</h5>
                <div className="flex flex-col md:flex-row">
                    <div className="basis-2/3 pr-0 md:pr-4 mb-4 md:mb-0">
                        {details.services.map((machine, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-lg shadow-lg border-2 mb-4 last:mb-0">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <span className="font-semibold text-gray-700">Machine Type:</span>
                                            <p className="text-gray-600 mt-1">{machine.machineType}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Equipment/Serial No.:</span>
                                            <p className="text-gray-600 mt-1">{machine.equipmentNo}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Type Of Work:</span>
                                            <p className="text-gray-600 mt-1">
                                                {machine.workTypeDetails.map((wt) => wt.workType).join(", ")}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Machine Model:</span>
                                            <p className="text-gray-600 mt-1">{machine.machineModel}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Timeline details={details} />

                </div>
            </div>

            {/* Additional Services */}
            <div className="bg-white p-6 rounded-lg shadow-lg mt-5">
                <h5 className="text-lg font-bold text-gray-800 mb-6">Additional Services</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm text-gray-700">
                    {additionalServiceKeys.map((serviceName, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="text-gray-800 font-medium">{serviceName}</div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Special Instruction */}
            <div className="bg-white p-6 rounded-lg shadow-lg mt-5">
                <h5 className="text-lg font-bold text-gray-800 mb-6"> Special Instruction</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm text-gray-700">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-gray-800 font-medium">Special Instruction</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">View File:</span>
                            <a
                                href="https://www.aerb.gov.in/images/PDF/RSO-eLORA-guidelines.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary"
                            >
                                <IconEye className="w-4.5 h-4.5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default View