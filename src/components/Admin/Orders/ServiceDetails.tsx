"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, EyeIcon as IconEye } from 'lucide-react'
import { getAllOfficeStaff, getAllTechnicians, getMachineDetails, getQARaw, updateEmployeeWithStatus } from "../../../api"
import SuccessAlert from "../../common/ShowSuccess"

type Engineer = {
    _id: string
    empId: string
    name: string
}

type WorkTypeDetail = {
    _id: string // Assuming _id is present as per type, even if console.log didn't show it
    workType: string
    serviceName?: string // Optional, as per console.log, but used in fallback
    status: string
    employee?: string
    uploadFile?: string
    viewFile?: string
    remark?: string
}

type Machine = {
    _id: string
    machineType: string
    equipmentNo: string
    machineModel: string
    workTypeDetails: WorkTypeDetail[]
}

export default function MachinesAccordion({ orderId }: { orderId: string }) {
    const [openIndexes, setOpenIndexes] = useState<{ [machineIndex: number]: number[] }>({})
    const [engineers, setEngineers] = useState<Engineer[]>([])
    const [officeStaff, setOfficeStaff] = useState<Engineer[]>([])
    const [machines, setMachines] = useState<Machine[]>([])
    const staticServices = ["QA Test", "Elora", "QA Raw"]
    const [statusMap, setStatusMap] = useState<{ [serviceId: string]: string }>({})
    const [selectedEmployeeMap, setSelectedEmployeeMap] = useState<{ [serviceId: string]: string }>({})
    const [serviceStates, setServiceStates] = useState<{
        [key: string]: { employee?: string; assigned?: boolean; status?: string; fileUploaded?: boolean; fileUrl?: string; remark?: string }
    }>({})
    const [qaRawDetails, setQaRawDetails] = useState<any[]>([])
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [editableMap, setEditableMap] = useState<{ [serviceId: string]: boolean }>({});
    const [uploadedFileMap, setUploadedFileMap] = useState<{ [serviceId: string]: File | null }>({});




    const toggleAccordion = (machineIndex: number, serviceIndex: number) => {
        setOpenIndexes((prev) => {
            const prevIndexes = prev[machineIndex] || []
            const isOpen = prevIndexes.includes(serviceIndex)
            const newIndexes = isOpen ? prevIndexes.filter((i) => i !== serviceIndex) : [...prevIndexes, serviceIndex]
            return { ...prev, [machineIndex]: newIndexes }
        })
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [engRes, machineRes, officeRes, qaRawRes] = await Promise.all([
                    getAllTechnicians(),
                    getMachineDetails(orderId),
                    getAllOfficeStaff(),
                    getQARaw(orderId)
                ])
                setEngineers(engRes.data)
                console.log("🚀 ~ fetchData ~ engRes.data:", engRes.data)
                setOfficeStaff(officeRes.data) // 👈 Add this
                console.log("🚀 ~ fetchData ~ officeRes.data:", officeRes.data)
                setMachines(machineRes.data)
                console.log("🚀 ~ fetchData ~ machineRes.data:", machineRes.data)
                setQaRawDetails(qaRawRes.data.qaRawDetails || [])
                console.log("🚀 ~ QA Raw Details:", qaRawRes.data.qaRawDetails)

                // Initialize statusMap and selectedEmployeeMap from fetched data
                const initialStatusMap: { [key: string]: string } = {}
                const initialSelectedEmployeeMap: { [key: string]: string } = {}
                machineRes.data.forEach((machine) => {
                    staticServices.forEach((staticServiceName) => {
                        const service =
                            machine.workTypeDetails.find((w) => w.workType?.toLowerCase() === staticServiceName.toLowerCase()) ||
                            ({
                                _id: `${machine._id}-${staticServiceName}`, // This is the composite ID used as key
                                serviceName: staticServiceName,
                                status: "pending",
                                remark: "",
                            } as WorkTypeDetail) // Cast to WorkTypeDetail to satisfy type
                        const serviceId = service._id || `${machine._id}-${staticServiceName}` // Ensure a key is always available

                        if (service.status) {
                            initialStatusMap[serviceId] = service.status
                        }
                        if (service.employee) {
                            initialSelectedEmployeeMap[serviceId] = service.employee
                        }
                    })
                })
                setStatusMap(initialStatusMap)
                setSelectedEmployeeMap(initialSelectedEmployeeMap)
            } catch (error) {
                console.error("Error fetching data:", error)
            }
        }
        fetchData()
    }, [orderId])

    return (
        <div className="space-y-8">
            <div className="bg-white mt-10 p-4 rounded-lg shadow-lg">
                {machines.map((machine, machineIndex) => (
                    <div key={machine._id} className="bg-gradient-to-t border border-gray-300 rounded-lg shadow-md p-4 mb-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 py-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                            <div className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">
                                Machine {machineIndex + 1} - {machine.machineType}
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 text-sm text-gray-700">
                                <div>
                                    <span className="font-semibold text-gray-600">Equipment ID:</span> {machine.equipmentNo}
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-600">Serial No:</span> {machine._id.slice(-5)}
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-600">Model:</span> {machine.machineModel}
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-600">Type Of Work:</span>{" "}
                                    {machine.workTypeDetails?.[0]?.workType || "N/A"}
                                </div>
                            </div>
                        </div>
                        {staticServices.map((staticServiceName, serviceIndex) => {
                            const service =
                                machine.workTypeDetails.find((w) => w.workType?.toLowerCase() === staticServiceName.toLowerCase()) ||
                                ({
                                    _id: `${machine._id}-${staticServiceName}`, // This is the composite ID used as key
                                    serviceName: staticServiceName,
                                    status: "pending",
                                    remark: "",
                                } as WorkTypeDetail) // Cast to WorkTypeDetail to satisfy type
                            console.log("🚀 ~ MachinesAccordion ~ service:", service)
                            const isQARaw = staticServiceName.toLowerCase() === "qa raw"
                            const serviceId = service._id || `${machine._id}-${staticServiceName}` // Use this for map lookups
                            const isEditable = editableMap[serviceId] || false;
                            return (
                                <div key={serviceId} className="border border-gray-300 rounded-lg shadow-sm mb-4">
                                    <button
                                        className="w-full flex items-center justify-between px-6 py-4 bg-gray-100 hover:bg-gray-200 text-left"
                                        onClick={() => toggleAccordion(machineIndex, serviceIndex)}
                                    >
                                        <span className="text-gray-800 font-medium">{service.serviceName}</span>
                                        {openIndexes[machineIndex]?.includes(serviceIndex) ? (
                                            <ChevronUp className="w-5 h-5" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5" />
                                        )}
                                    </button>
                                    {openIndexes[machineIndex]?.includes(serviceIndex) && (
                                        <div className="bg-white px-6 py-4 border-t text-sm text-gray-700 space-y-4">
                                            {/* QA RAW View Mode */}
                                            {isQARaw ? (() => {
                                                const raw = qaRawDetails.find((d) => d.serialNumber)
                                                return (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Employee Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={raw?.employeeName || "Not Assigned"}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                    readOnly
                                                                />
                                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Serial Number</label>
                                                                <input
                                                                    type="text"
                                                                    value={raw?.serialNumber || machine._id.slice(-5)}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                    readOnly
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Machine Model</label>
                                                                <input
                                                                    type="text"
                                                                    value={raw?.machineModel || machine.machineModel}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                    readOnly
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 mb-1">View File</label>
                                                                <a
                                                                    href={raw?.rawFile}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="block px-3 py-2 bg-gray-100 rounded border text-blue-600 underline"
                                                                >
                                                                    {raw?.rawFile ? "Open File" : "No File"}
                                                                </a>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 mb-1">View Photo</label>
                                                                {raw?.rawPhoto ? (
                                                                    <img src={raw.rawPhoto} alt="View Photo" className="max-w-xs border rounded shadow" />
                                                                ) : (
                                                                    <span className="block text-sm text-gray-400">No Photo Available</span>
                                                                )}
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Remark</label>
                                                                <textarea
                                                                    value={raw?.remark || ""}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                    rows={2}
                                                                    readOnly
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })()
                                                : (
                                                    // Default editable block for non-QA Raw services
                                                    <>
                                                        {isEditable ? (
                                                            <>
                                                                {/* Editable Fields */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Employee</label>
                                                                        <select
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                                            value={selectedEmployeeMap[serviceId] || service.employee || ""}
                                                                            onChange={(e) =>
                                                                                setSelectedEmployeeMap((prev) => ({
                                                                                    ...prev,
                                                                                    [serviceId]: e.target.value,
                                                                                }))
                                                                            }
                                                                        >
                                                                            {(staticServiceName.toLowerCase() === "elora" ? officeStaff : engineers).map((eng) => (
                                                                                <option key={eng._id} value={eng._id}>
                                                                                    {`${eng.empId} - ${eng.name}`}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                                                        <select
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                                            value={statusMap[serviceId] || service.status}
                                                                            onChange={(e) => {
                                                                                const updatedStatus = e.target.value;
                                                                                setStatusMap((prev) => ({ ...prev, [serviceId]: updatedStatus }));
                                                                            }}
                                                                        >
                                                                            <option value="pending">Pending</option>
                                                                            <option value="inprogress">In Progress</option>
                                                                            <option value="completed">Completed</option>
                                                                            <option value="generated">Generated</option>
                                                                            <option value="paid">Paid</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                {statusMap[serviceId] === "completed" && (
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Upload File</label>
                                                                        <input
                                                                            type="file"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0] || null;
                                                                                setUploadedFileMap((prev) => ({
                                                                                    ...prev,
                                                                                    [serviceId]: file,
                                                                                }));
                                                                            }}
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="mt-4">
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                const rawServiceId = service._id;
                                                                                const [cleanServiceId] = rawServiceId.split("-");
                                                                                const employeeId = selectedEmployeeMap[serviceId] || service.employee || "";
                                                                                const status = statusMap[serviceId] || service.status;
                                                                                if (!employeeId) {
                                                                                    alert(`Please select an ${staticServiceName.toLowerCase() === "elora" ? "office staff member" : "technician"} before updating.`);
                                                                                    return;
                                                                                }
                                                                                await updateEmployeeWithStatus(orderId, cleanServiceId, employeeId, status);
                                                                                setSuccessMessage("Update successful!");
                                                                                setErrorMessage(null);
                                                                                setEditableMap((prev) => ({ ...prev, [serviceId]: false }));
                                                                                setTimeout(() => setSuccessMessage(null), 3000);
                                                                            } catch (err) {
                                                                                console.error(err);
                                                                                setErrorMessage("Update failed!");
                                                                                setSuccessMessage(null);
                                                                                setTimeout(() => setErrorMessage(null), 3000);
                                                                            }
                                                                        }}
                                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                                                                    >
                                                                        Update
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* Non-editable view */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Employee</label>
                                                                        <input
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                            value={
                                                                                (staticServiceName.toLowerCase() === "elora"
                                                                                    ? officeStaff.find((eng) => eng._id === selectedEmployeeMap[serviceId] || service.employee)
                                                                                    : engineers.find((eng) => eng._id === selectedEmployeeMap[serviceId] || service.employee)
                                                                                )?.name || "Not Assigned"
                                                                            }
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                                                        <input
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                            value={statusMap[serviceId] || service.status}
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Edit Button */}
                                                                <div className="mt-4">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditableMap((prev) => ({ ...prev, [serviceId]: true }));
                                                                        }}
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}

                                                        {successMessage && <SuccessAlert message={successMessage} />}
                                                        {errorMessage && (
                                                            <div className="flex items-start gap-3 bg-red-50 border border-red-300 text-red-800 rounded-lg p-4 shadow-md w-full max-w-md mt-4">
                                                                <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 4v1m8.66 1.34l-.7.7M20 12h-1M4 12H3m1.34-6.66l.7.7M4 20l.7-.7M20 20l-.7-.7M16.24 7.76a9 9 0 11-8.48 0" />
                                                                </svg>
                                                                <div className="flex-1">
                                                                    <p className="font-semibold">{errorMessage}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Update buttons for QA Test and Elora */}
                                                        {/* {(staticServiceName.toLowerCase() === "qa test" || staticServiceName.toLowerCase() === "elora") && (
                                                            <div className="mt-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        try {
                                                                            const rawServiceId = service._id;
                                                                            const [cleanServiceId] = rawServiceId.split("-");
                                                                            const employeeId = selectedEmployeeMap[serviceId] || service.employee || "";
                                                                            const status = statusMap[serviceId] || service.status;

                                                                            if (!employeeId) {
                                                                                alert(`Please select an ${staticServiceName.toLowerCase() === "elora" ? "office staff member" : "technician"} before updating.`);
                                                                                return;
                                                                            }

                                                                            await updateEmployeeWithStatus(orderId, cleanServiceId, employeeId, status);

                                                                            setSuccessMessage("Update successful!");
                                                                            setErrorMessage(null);

                                                                            setTimeout(() => setSuccessMessage(null), 3000); // auto-dismiss
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                            setErrorMessage("Update failed!");
                                                                            setSuccessMessage(null);

                                                                            setTimeout(() => setErrorMessage(null), 3000); // auto-dismiss
                                                                        }
                                                                    }}

                                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                                                                >
                                                                    Update {staticServiceName.toLowerCase() === "elora" ? "Office Staff" : "Technician"}
                                                                </button>
                                                            </div>
                                                        )} */}
                                                    </>
                                                )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}