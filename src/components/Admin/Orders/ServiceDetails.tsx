"use client"

import { useEffect, useState, useCallback } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
    getAllOfficeStaff,
    getAllTechnicians,
    getMachineDetails,
    getQARaw,
    updateEmployeeWithStatus,
    assignToTechnicianByQA,
    assignToOfficeStaff,
    getAssignedTechnicianName,
    getAssignedStaffName,
} from "../../../api"
import SuccessAlert from "../../../components/common/SuccessAlert"

type Engineer = {
    _id: string
    empId: string
    name: string
}

type WorkTypeDetail = {
    _id: string
    workType: string
    serviceName?: string
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

type ExpandedMachineEntry = {
    machine: Machine
    workTypeDetail: WorkTypeDetail
    displayIndex: number
}

export default function MachinesAccordion({ orderId }: { orderId: string }) {
    const [openIndexes, setOpenIndexes] = useState<{ [entryIndex: number]: boolean }>({})
    const [engineers, setEngineers] = useState<Engineer[]>([])
    const [officeStaff, setOfficeStaff] = useState<Engineer[]>([])
    const [machines, setMachines] = useState<Machine[]>([])
    const [expandedEntries, setExpandedEntries] = useState<ExpandedMachineEntry[]>([])
    const [loading, setLoading] = useState(true)

    const [statusMap, setStatusMap] = useState<{ [serviceId: string]: string }>({})
    const [selectedEmployeeMap, setSelectedEmployeeMap] = useState<{ [serviceId: string]: string }>({})
    const [qaRawDetails, setQaRawDetails] = useState<any[]>([])
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [editableMap, setEditableMap] = useState<{ [serviceId: string]: boolean }>({})
    const [uploadedFileMap, setUploadedFileMap] = useState<{ [serviceId: string]: File | null }>({})

    const [qaRawAssignments, setQaRawAssignments] = useState<{ [serviceId: string]: boolean }>({})
    const [selectedTechnicianMap, setSelectedTechnicianMap] = useState<{ [serviceId: string]: string }>({})

    const [assignedTechnicianDetails, setAssignedTechnicianDetails] = useState<{ [serviceId: string]: any }>({})
    const [assignedStaffDetails, setAssignedStaffDetails] = useState<{ [serviceId: string]: any }>({})
    const workTypes = ["QA Raw", "QA Test", "Elora"]
    const toggleAccordion = (entryIndex: number) => {
        setOpenIndexes((prev) => ({
            ...prev,
            [entryIndex]: !prev[entryIndex],
        }))
    }

    const fetchData = useCallback(
        async (delay = 0) => {
            try {
                if (delay > 0) {
                    await new Promise((resolve) => setTimeout(resolve, delay))
                }
                setLoading(true)
                console.log("🚀 ~ Starting data fetch for orderId:", orderId)
                const [engRes, machineRes, officeRes, qaRawRes] = await Promise.all([
                    getAllTechnicians(),
                    getMachineDetails(orderId),
                    getAllOfficeStaff(),
                    getQARaw(orderId),
                ])

                console.log("🚀 ~ Raw API response:")
                console.log("Engineers:", engRes.data)
                console.log("Machines:", machineRes.data)
                console.log("Office Staff:", officeRes.data)
                console.log("QA Raw Details:", qaRawRes.data)
                setEngineers(engRes.data)
                setOfficeStaff(officeRes.data)
                setMachines(machineRes.data)
                setQaRawDetails(qaRawRes.data.qaRawDetails || [])

                const expanded: ExpandedMachineEntry[] = []
                let displayIndex = 1

                machineRes.data.forEach((machine: Machine) => {
                    if (machine.workTypeDetails && machine.workTypeDetails.length > 0) {
                        machine.workTypeDetails.forEach((actualWorkType) => {
                            expanded.push({
                                machine,
                                workTypeDetail: actualWorkType,
                                displayIndex: displayIndex++,
                            })
                        })
                    } else {
                        expanded.push({
                            machine,
                            workTypeDetail: {
                                _id: `${machine._id}-default`,
                                workType: "General",
                                status: "pending",
                                remark: "",
                            },
                            displayIndex: displayIndex++,
                        })
                    }
                })

                setExpandedEntries(expanded)
                const initialStatusMap: { [key: string]: string } = {}
                const initialSelectedEmployeeMap: { [key: string]: string } = {}
                const initialQaRawAssignments: { [key: string]: boolean } = {}

                console.log("🚀 ~ Processing expanded entries for assignments...")
                expanded.forEach((entry) => {
                    const { machine, workTypeDetail } = entry
                    workTypes.forEach((workType) => {
                        const serviceId = `${machine._id}-${workType.toLowerCase().replace(/\s+/g, "-")}`
                        const existingWorkType = machine.workTypeDetails?.find(
                            (wtd) => wtd.workType.toLowerCase() === workType.toLowerCase(),
                        )
                        console.log(`🚀 ~ Processing entry for ${workType}:`, entry)
                        initialStatusMap[serviceId] = existingWorkType?.status || "pending"
                        if (existingWorkType?.employee) {
                            console.log(`🚀 ~ Found employee in work type:`, existingWorkType.employee)
                            initialSelectedEmployeeMap[serviceId] = existingWorkType.employee

                            if (workType.toLowerCase().includes("qa") && workType.toLowerCase().includes("raw")) {
                                initialQaRawAssignments[serviceId] = true
                                console.log(`🚀 ~ Marked QA Raw as assigned for serviceId:`, serviceId)
                            }
                        }

                        if (workType.toLowerCase().includes("qa") && workType.toLowerCase().includes("raw")) {
                            console.log(`🚀 ~ Checking QA Raw details for machine:`, machine._id)

                            const qaRawData = qaRawRes.data.qaRawDetails?.find((detail: any) => {
                                const matches =
                                    detail.machineId === machine._id ||
                                    detail.serialNumber === machine._id.slice(-5) ||
                                    detail.serialNumber === machine.equipmentNo ||
                                    detail.machineModel === machine.machineModel

                                console.log(`🚀 ~ Checking QA Raw detail:`, detail, "Matches:", matches)
                                return matches
                            })

                            if (qaRawData) {
                                console.log(`🚀 ~ Found QA Raw data:`, qaRawData)

                                if (qaRawData.employeeName) {
                                    const assignedTechnician = engRes.data.find(
                                        (tech: Engineer) => tech.name.toLowerCase().trim() === qaRawData.employeeName.toLowerCase().trim(),
                                    )

                                    console.log(`🚀 ~ Looking for technician with name:`, qaRawData.employeeName)
                                    console.log(`🚀 ~ Found technician:`, assignedTechnician)

                                    if (assignedTechnician) {
                                        initialSelectedEmployeeMap[serviceId] = assignedTechnician._id
                                        initialQaRawAssignments[serviceId] = true
                                        console.log(`🚀 ~ Assigned technician ${assignedTechnician.name} to QA Raw`)
                                    }
                                }

                                if (qaRawData.employeeId) {
                                    const assignedTechnician = engRes.data.find((tech: Engineer) => tech._id === qaRawData.employeeId)
                                    if (assignedTechnician) {
                                        initialSelectedEmployeeMap[serviceId] = assignedTechnician._id
                                        initialQaRawAssignments[serviceId] = true
                                        console.log(`🚀 ~ Assigned technician by ID ${assignedTechnician.name} to QA Raw`)
                                    }
                                }
                            }
                        }
                    })
                })

                console.log("🚀 ~ Final initialized states:")
                console.log("Status Map:", initialStatusMap)
                console.log("Selected Employee Map:", initialSelectedEmployeeMap)
                console.log("QA Raw Assignments:", initialQaRawAssignments)

                setStatusMap(initialStatusMap)
                setSelectedEmployeeMap(initialSelectedEmployeeMap)
                setQaRawAssignments(initialQaRawAssignments)
            } catch (error) {
                console.error("🚀 ~ Error fetching data:", error)
                setErrorMessage("Failed to load data. Please refresh the page.")
            } finally {
                setLoading(false)
            }
        },
        [orderId],
    )
    useEffect(() => {
        if (orderId) {
            fetchData()
        }
    }, [orderId, fetchData])
    const handleQaRawAssignment = async (serviceId: string, machineId: string) => {
        try {
            const technicianId = selectedTechnicianMap[serviceId]
            if (!technicianId) {
                alert("Please select a technician before assigning.")
                return
            }

            console.log("🚀 ~ Assigning technician:", technicianId, "to service:", serviceId)

            const cleanServiceId = serviceId.includes("-") ? serviceId.split("-")[0] : machineId

            console.log("🚀 ~ Using clean service ID:", cleanServiceId)
            const currentEntry = expandedEntries.find((entry) => serviceId.startsWith(entry.machine._id))
            const actualWorkType = currentEntry?.workTypeDetail.workType || "qa-raw"
            await assignToTechnicianByQA(orderId, cleanServiceId, technicianId)
            try {
                const technicianDetails = await getAssignedTechnicianName(orderId, cleanServiceId, actualWorkType)
                setAssignedTechnicianDetails((prev) => ({
                    ...prev,
                    [serviceId]: technicianDetails.data,
                }))
            } catch (error) {
                console.error("Failed to fetch assigned technician details:", error)
            }
            setQaRawAssignments((prev) => ({ ...prev, [serviceId]: true }))
            setSelectedEmployeeMap((prev) => ({ ...prev, [serviceId]: technicianId }))
            setSuccessMessage("Technician assigned successfully!")
            setTimeout(() => setSuccessMessage(null), 3000)
            console.log("🚀 ~ Assignment successfull")
        } catch (error) {
            console.error("🚀 ~ Assignment failed:", error)
            setErrorMessage("Assignment failed!")
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }
    const handleQaTestUpdate = async (serviceId: string) => {
        try {
            const cleanServiceId = serviceId.includes("-") ? serviceId.split("-")[0] : serviceId
            const officeStaffId = selectedEmployeeMap[serviceId]
            const status = statusMap[serviceId]

            console.log("🚀 ~ Updating QA Test:", { cleanServiceId, officeStaffId, status })

            if (!officeStaffId) {
                alert("Please select an office staff member before updating.")
                return
            }

            const currentEntry = expandedEntries.find((entry) => serviceId.startsWith(entry.machine._id))
            const actualWorkType = currentEntry?.workTypeDetail.workType || "qa-test"

            await assignToOfficeStaff(orderId, cleanServiceId, officeStaffId, status)

            try {
                const staffDetails = await getAssignedStaffName(orderId, cleanServiceId, actualWorkType)
                setAssignedStaffDetails((prev) => ({
                    ...prev,
                    [serviceId]: staffDetails.data,
                }))
            } catch (error) {
                console.error("Failed to fetch assigned staff details:", error)
            }

            setSuccessMessage("Update successful!")
            setErrorMessage(null)
            setEditableMap((prev) => ({ ...prev, [serviceId]: false }))
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (error) {
            console.error("🚀 ~ QA Test update failed:", error)
            setErrorMessage("Update failed!")
            setSuccessMessage(null)
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }

    const handleOtherWorkTypeUpdate = async (serviceId: string) => {
        try {
            const cleanServiceId = serviceId.includes("-") ? serviceId.split("-")[0] : serviceId
            const employeeId = selectedEmployeeMap[serviceId]
            const status = statusMap[serviceId]

            if (!employeeId) {
                alert("Please select an employee before updating.")
                return
            }

            await updateEmployeeWithStatus(orderId, cleanServiceId, employeeId, status)

            await fetchData(1000)

            setSuccessMessage("Update successful!")
            setErrorMessage(null)
            setEditableMap((prev) => ({ ...prev, [serviceId]: false }))
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error(err)
            setErrorMessage("Update failed!")
            setSuccessMessage(null)
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="text-lg">Loading...</div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="bg-white mt-10 p-4 rounded-lg shadow-lg">
                {expandedEntries.map((entry, entryIndex) => {
                    const { machine, workTypeDetail, displayIndex } = entry

                    return (
                        <div
                            key={`${machine._id}-${workTypeDetail._id}-${entryIndex}`}
                            className="bg-gradient-to-t border border-gray-300 rounded-lg shadow-md p-4 mb-8"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 py-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                                <div className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">
                                    Machine {displayIndex} - {machine.machineType}
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
                                        <span className="font-semibold text-gray-600">Type Of Work:</span> {workTypeDetail.workType}
                                    </div>
                                </div>
                            </div>

                            {workTypes.map((workType, workTypeIndex) => {
                                const serviceId = `${machine._id}-${workType.toLowerCase().replace(/\s+/g, "-")}`
                                const accordionIndex = entryIndex * workTypes.length + workTypeIndex
                                const isQARaw = workType.toLowerCase().includes("qa") && workType.toLowerCase().includes("raw")
                                const isQATest = workType.toLowerCase().includes("qa") && workType.toLowerCase().includes("test")
                                const isEditable = editableMap[serviceId] || false
                                const isQaRawAssigned = qaRawAssignments[serviceId] || false

                                return (
                                    <div key={`${serviceId}-accordion`} className="border border-gray-300 rounded-lg shadow-sm mb-4">
                                        <button
                                            className="w-full flex items-center justify-between px-6 py-4 bg-gray-100 hover:bg-gray-200 text-left"
                                            onClick={() => toggleAccordion(accordionIndex)}
                                        >
                                            <span className="text-gray-800 font-medium">
                                                {workType}
                                                {selectedEmployeeMap[serviceId] && (
                                                    <span className="ml-2 text-sm text-green-600">(Assigned)</span>
                                                )}
                                            </span>
                                            {openIndexes[accordionIndex] ? (
                                                <ChevronUp className="w-5 h-5" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5" />
                                            )}
                                        </button>

                                        {openIndexes[accordionIndex] && (
                                            <div className="bg-white px-6 py-4 border-t text-sm text-gray-700 space-y-4">
                                                {isQARaw ? (
                                                    !isQaRawAssigned ? (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                                        Select Technician
                                                                    </label>
                                                                    <select
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                                        value={selectedTechnicianMap[serviceId] || ""}
                                                                        onChange={(e) =>
                                                                            setSelectedTechnicianMap((prev) => ({
                                                                                ...prev,
                                                                                [serviceId]: e.target.value,
                                                                            }))
                                                                        }
                                                                    >
                                                                        <option value="">Select Technician</option>
                                                                        {engineers.map((eng) => (
                                                                            <option key={eng._id} value={eng._id}>
                                                                                {`${eng.empId} - ${eng.name}`}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <button
                                                                    onClick={() => handleQaRawAssignment(serviceId, machine._id)}
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                                                                >
                                                                    Assign Technician
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                                        Assigned Technician
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            assignedTechnicianDetails[serviceId]?.technicianName ||
                                                                            engineers.find((eng) => eng._id === selectedEmployeeMap[serviceId])?.name ||
                                                                            "Loading..."
                                                                        }
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                        readOnly
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                                                    <input
                                                                        type="text"
                                                                        value={assignedTechnicianDetails[serviceId]?.status || "assigned"}
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                        readOnly
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                Other details will be shown once available from mobile app.
                                                            </div>
                                                        </div>
                                                    )
                                                ) : isQATest ? (
                                                    <>
                                                        {isEditable ? (
                                                            <>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Employee</label>
                                                                        <select
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                                            value={selectedEmployeeMap[serviceId] || ""}
                                                                            onChange={(e) =>
                                                                                setSelectedEmployeeMap((prev) => ({
                                                                                    ...prev,
                                                                                    [serviceId]: e.target.value,
                                                                                }))
                                                                            }
                                                                        >
                                                                            <option value="">Select Office Staff</option>
                                                                            {officeStaff.map((eng) => (
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
                                                                            value={statusMap[serviceId] || "pending"}
                                                                            onChange={(e) => {
                                                                                const updatedStatus = e.target.value
                                                                                setStatusMap((prev) => ({ ...prev, [serviceId]: updatedStatus }))
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
                                                                <div className="mt-4">
                                                                    <button
                                                                        onClick={() => handleQaTestUpdate(serviceId)}
                                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                                                                    >
                                                                        Update
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                                            Assigned Staff
                                                                        </label>
                                                                        <input
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                            value={
                                                                                assignedStaffDetails[serviceId]?.staffName ||
                                                                                officeStaff.find((eng) => eng._id === selectedEmployeeMap[serviceId])?.name ||
                                                                                "Not Assigned"
                                                                            }
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                                                        <input
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                            value={
                                                                                assignedStaffDetails[serviceId]?.status || statusMap[serviceId] || "pending"
                                                                            }
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="mt-4">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditableMap((prev) => ({ ...prev, [serviceId]: true }))
                                                                        }}
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {isEditable ? (
                                                            <>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Employee</label>
                                                                        <select
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                                            value={selectedEmployeeMap[serviceId] || ""}
                                                                            onChange={(e) =>
                                                                                setSelectedEmployeeMap((prev) => ({
                                                                                    ...prev,
                                                                                    [serviceId]: e.target.value,
                                                                                }))
                                                                            }
                                                                        >
                                                                            <option value="">Select Technician</option>
                                                                            {engineers.map((eng) => (
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
                                                                            value={statusMap[serviceId] || "pending"}
                                                                            onChange={(e) => {
                                                                                const updatedStatus = e.target.value
                                                                                setStatusMap((prev) => ({ ...prev, [serviceId]: updatedStatus }))
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
                                                                <div className="mt-4">
                                                                    <button
                                                                        onClick={() => handleOtherWorkTypeUpdate(serviceId)}
                                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                                                                    >
                                                                        Update
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Employee</label>
                                                                        <input
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                            value={
                                                                                engineers.find((eng) => eng._id === selectedEmployeeMap[serviceId])?.name ||
                                                                                "Not Assigned"
                                                                            }
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                                                        <input
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                                                            value={statusMap[serviceId] || "pending"}
                                                                            readOnly
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="mt-4">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditableMap((prev) => ({ ...prev, [serviceId]: true }))
                                                                        }}
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                {successMessage && <SuccessAlert message={successMessage} />}
                                                {errorMessage && (
                                                    <div className="flex items-start gap-3 bg-red-50 border border-red-300 text-red-800 rounded-lg p-4 shadow-md w-full max-w-md mt-4">
                                                        <svg
                                                            className="w-6 h-6 text-red-600 mt-0.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M12 9v2m0 4h.01M12 4v1m8.66 1.34l-.7.7M20 12h-1M4 12H3m1.34-6.66l.7.7M4 20l.7-.7M20 20l-.7-.7M16.24 7.76a9 9 0 11-8.48 0"
                                                            />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <p className="font-semibold">{errorMessage}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}