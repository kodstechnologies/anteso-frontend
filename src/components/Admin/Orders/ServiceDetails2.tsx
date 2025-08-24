"use client"

import { useState, useEffect } from "react"
import {
    Wrench,
    Settings,
    Zap,
    ChevronDown,
    Upload,
    Download,
    Eye,
    Check,
    Loader2,
    AlertCircle,
    Edit,
} from "lucide-react"
import { getMachineDetails } from "../../../api" // Adjust path as needed
import {
    getAllTechnicians,
    getAllOfficeStaff,
    assignToTechnicianByQA,
    getAssignedTechnicianName,
    getMachineUpdates,
    assignToOfficeStaff,
    completeStatusAndReport,
} from "../../../api"

const statusOptions = ["pending", "inprogress", "completed", "generated", "paid"]

interface Technician {
    _id: string
    name: string
    phone: number
    email: string
    role: string
}

interface OfficeStaff {
    _id: string
    name: string
    phone: number
    email: string
    role: string
}

interface MachineData {
    id: string
    machineType: string
    equipmentId: string
    workTypeName: string
    status: string
    workTypes: Array<{
        id: string
        name: string
        description: string
        assignedStaff?: number
        pendingTasks?: number
        backendFields?: {
            serialNo: string
            modelName: string
            remark: string
            fileUrl: string
            imageUrl: string
        }
        reportNumber?: string
        urlNumber?: string
        assignedTechnicianName?: string
        assignmentStatus?: string
        serviceId?: string
    }>
}

interface ServicesCardProps {
    orderId?: string
}

export default function ServicesCard({ orderId }: ServicesCardProps) {
    const STORAGE_KEYS = {
        expandedItems: "services-expanded-items",
        assignments: "services-assignments",
        selectedEmployees: "services-selected-employees",
        selectedStaff: "services-selected-staff",
        selectedStatuses: "services-selected-statuses",
        uploadedFileNames: "services-uploaded-file-names",
    }

    const [expandedItems, setExpandedItems] = useState<string[]>([])
    const [assignments, setAssignments] = useState<
        Record<
            string,
            {
                employeeId?: string
                staffId?: string
                status?: string
                isAssigned?: boolean
                uploadedFile?: File | null
                technicianName?: string
                assignmentStatus?: string
            }
        >
    >({})
    const [selectedEmployees, setSelectedEmployees] = useState<Record<string, string>>({})
    const [selectedStaff, setSelectedStaff] = useState<Record<string, string>>({})
    const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({})
    const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({})

    const [machineData, setMachineData] = useState<MachineData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [technicians, setTechnicians] = useState<Technician[]>([])
    const [officeStaff, setOfficeStaff] = useState<OfficeStaff[]>([])
    const [loadingDropdowns, setLoadingDropdowns] = useState(true)
    const [assigningTechnician, setAssigningTechnician] = useState<Record<string, boolean>>({})

    const [editingWorkType, setEditingWorkType] = useState<Record<string, boolean>>({})
    const [assigningStaff, setAssigningStaff] = useState<Record<string, boolean>>({})

    const saveToLocalStorage = (key: string, data: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(data))
        } catch (error) {
            console.error("Error saving to localStorage:", error)
        }
    }

    const loadFromLocalStorage = (key: string, defaultValue: any = null) => {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : defaultValue
        } catch (error) {
            console.error("Error loading from localStorage:", error)
            return defaultValue
        }
    }

    const fetchDropdownData = async () => {
        try {
            setLoadingDropdowns(true)
            const [techniciansData, staffData] = await Promise.all([getAllTechnicians(), getAllOfficeStaff()])

            console.log("🚀 ~ fetchDropdownData ~ technicians:", techniciansData)
            console.log("🚀 ~ fetchDropdownData ~ office staff:", staffData)

            setTechnicians(techniciansData || [])
            setOfficeStaff(staffData || [])
        } catch (error) {
            console.error("Error fetching dropdown data:", error)
            // Set empty arrays as fallback
            setTechnicians([])
            setOfficeStaff([])
        } finally {
            setLoadingDropdowns(false)
        }
    }

    const fetchExistingAssignments = async (machineDataArray: MachineData[]) => {
        if (!orderId) return

        try {
            const assignmentPromises: Promise<any>[] = []
            const workTypeMapping: Array<{ workTypeId: string; serviceId: string; workTypeName: string }> = []

            // Collect all work types that need to be checked for assignments
            machineDataArray.forEach((service) => {
                service.workTypes.forEach((workType) => {
                    if (workType.name === "QA Raw") {
                        // Only check QA Raw for technician assignments
                        const serviceId = workType.id.split("-")[0]
                        const workTypeName = service.workTypeName

                        workTypeMapping.push({
                            workTypeId: workType.id,
                            serviceId,
                            workTypeName,
                        })

                        // Add promise to check for existing assignment
                        assignmentPromises.push(
                            getAssignedTechnicianName(orderId, serviceId, workTypeName)
                                .then((response) => ({
                                    workTypeId: workType.id,
                                    success: true,
                                    data: response.data,
                                }))
                                .catch(() => ({
                                    workTypeId: workType.id,
                                    success: false,
                                    data: null,
                                })),
                        )
                    }
                })
            })

            if (assignmentPromises.length === 0) return

            const results = await Promise.all(assignmentPromises)

            // Process results and update state
            const newAssignments: Record<string, any> = {}
            const updatedMachineData = machineDataArray.map((service) => ({
                ...service,
                workTypes: service.workTypes.map((workType) => {
                    const result = results.find((r) => r.workTypeId === workType.id)

                    if (result && result.success && result.data.technicianName) {
                        // Found existing assignment
                        newAssignments[workType.id] = {
                            isAssigned: true,
                            technicianName: result.data.technicianName,
                            assignmentStatus: result.data.status,
                        }

                        return {
                            ...workType,
                            assignedTechnicianName: result.data.technicianName,
                            assignmentStatus: result.data.status,
                        }
                    }

                    return workType
                }),
            }))

            // Update states with backend data
            setAssignments(newAssignments)
            setMachineData(updatedMachineData)

            console.log("[v0] Fetched existing assignments:", newAssignments)
        } catch (error) {
            console.error("[v0] Error fetching existing assignments:", error)
        }
    }

    const fetchMachineData = async () => {
        if (!orderId) {
            setError("Order ID is required")
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)
            const response = await getMachineDetails(orderId)
            console.log("🚀 ~ fetchMachineData ~ response:", response)

            // API returns an array, so take the first element
            const machineData = Array.isArray(response) ? response[0] : response

            if (!machineData) {
                throw new Error("No machine data found")
            }

            const workTypeDetails = machineData.workTypeDetails || []

            const transformedData: MachineData[] = workTypeDetails.map((workTypeDetail: any, index: number) => {
                const createWorkTypes = () => {
                    const workTypes = []
                    const cardId = `${machineData._id}-${index}`

                    // Always create QA Raw for each card
                    workTypes.push({
                        id: `${cardId}-qa-raw`,
                        name: "QA Raw",
                        description: "Quality assurance for raw materials",
                        backendFields: {
                            serialNo: machineData.equipmentNo || "N/A",
                            modelName: machineData.machineModel || "N/A",
                            remark: workTypeDetail.remark || "N/A",
                            fileUrl: workTypeDetail.viewFile?.[0] || "",
                            imageUrl: workTypeDetail.viewFile?.[1] || "",
                        },
                        serviceId: "default-service-id", // You may need to adjust this
                    })

                    // Always create QA Test for each card
                    workTypes.push({
                        id: `${cardId}-qa-test`,
                        name: "QA Test",
                        description: "Quality testing procedures",
                        reportNumber: "N/A", // Will be populated from backend later
                        urlNumber: "N/A", // Will be populated from backend later
                        serviceId: "default-service-id", // You may need to adjust this
                    })

                    // Always create Elora for each card
                    workTypes.push({
                        id: `${cardId}-elora`,
                        name: "Elora",
                        description: "Advanced processing operations",
                        reportNumber: "N/A", // Will be populated from backend later
                        urlNumber: "N/A", // Will be populated from backend later
                        serviceId: "default-service-id", // You may need to adjust this
                    })

                    return workTypes
                }

                return {
                    id: `${machineData._id}-${index}`,
                    machineType: machineData.machineType || "Unknown Machine",
                    equipmentId: machineData.equipmentNo || "N/A",
                    workTypeName: workTypeDetail.workType || "General Work", // Show specific work type name
                    status: workTypeDetail.status || "pending", // Use status from workTypeDetail
                    workTypes: createWorkTypes(),
                }
            })

            setMachineData(transformedData)

            await fetchExistingAssignments(transformedData)
        } catch (err: any) {
            console.error("Error fetching machine data:", err)
            setError(err.message || "Failed to fetch machine data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const loadedExpandedItems = loadFromLocalStorage(STORAGE_KEYS.expandedItems, [])
        const loadedSelectedEmployees = loadFromLocalStorage(STORAGE_KEYS.selectedEmployees, {})
        const loadedSelectedStaff = loadFromLocalStorage(STORAGE_KEYS.selectedStaff, {})
        const loadedSelectedStatuses = loadFromLocalStorage(STORAGE_KEYS.selectedStatuses, {})
        const loadedFileNames = loadFromLocalStorage(STORAGE_KEYS.uploadedFileNames, {})

        setExpandedItems(loadedExpandedItems)
        setSelectedEmployees(loadedSelectedEmployees)
        setSelectedStaff(loadedSelectedStaff)
        setSelectedStatuses(loadedSelectedStatuses)

        const mockFiles: Record<string, File | null> = {}
        Object.entries(loadedFileNames).forEach(([key, fileName]) => {
            if (fileName) {
                mockFiles[key] = new File([""], fileName as string, { type: "application/octet-stream" })
            }
        })
        setUploadedFiles(mockFiles)

        fetchMachineData()
        fetchDropdownData()
    }, [orderId])

    const getWorkTypeIcon = (workType: string) => {
        switch (workType.toLowerCase()) {
            case "qa raw":
                return <Wrench className="h-4 w-4" />
            case "qa test":
                return <Settings className="h-4 w-4" />
            case "elora":
                return <Zap className="h-4 w-4" />
            default:
                return <Settings className="h-4 w-4" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "inprogress":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "completed":
                return "bg-green-100 text-green-800 border-green-200"
            case "generated":
                return "bg-purple-100 text-purple-800 border-purple-200"
            case "paid":
                return "bg-emerald-100 text-emerald-800 border-emerald-200"
            case "active":
                return "bg-green-100 text-green-800 border-green-200"
            case "maintenance":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "inactive":
                return "bg-red-100 text-red-800 border-red-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getAvailableStatuses = (currentStatus: string) => {
        const currentIndex = statusOptions.indexOf(currentStatus)
        return statusOptions.slice(currentIndex)
    }

    const handleEmployeeAssign = async (workTypeId: string) => {
        const employeeId = selectedEmployees[workTypeId]
        if (!employeeId || !orderId) return

        try {
            setAssigningTechnician((prev) => ({ ...prev, [workTypeId]: true }))

            const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)

            if (!workType) throw new Error("Work type not found")

            const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))

            if (!parentService) throw new Error("Parent service not found")

            const serviceId = workType.id.split("-")[0]
            const workTypeName = parentService.workTypeName

            console.log("🚀 ~ handleEmployeeAssign ~ workTypeName from service:", workTypeName)
            console.log("🚀 ~ handleEmployeeAssign ~ employeeId:", employeeId)
            console.log("🚀 ~ handleEmployeeAssign ~ serviceId:", serviceId)
            console.log("🚀 ~ handleEmployeeAssign ~ orderId:", orderId)

            await assignToTechnicianByQA(orderId, serviceId, employeeId, workTypeName)

            const assignedTechResponse = await getAssignedTechnicianName(orderId, serviceId, workTypeName)
            const { technicianName, status } = assignedTechResponse.data

            const machineUpdatesResponse = await getMachineUpdates(employeeId, orderId, serviceId, workTypeName)
            const { updatedService } = machineUpdatesResponse.data

            setAssignments((prev) => ({
                ...prev,
                [workTypeId]: {
                    ...prev[workTypeId],
                    employeeId,
                    isAssigned: true,
                    technicianName,
                    assignmentStatus: status,
                },
            }))

            setMachineData((prevData) =>
                prevData.map((service) => ({
                    ...service,
                    workTypes: service.workTypes.map((wt) =>
                        wt.id === workTypeId
                            ? {
                                ...wt,
                                assignedTechnicianName: technicianName,
                                assignmentStatus: status,
                                backendFields: {
                                    ...wt.backendFields,
                                    serialNo: updatedService.machineModel || wt.backendFields?.serialNo || "N/A",
                                    modelName: updatedService.machineModel || wt.backendFields?.modelName || "N/A",
                                    remark: updatedService.remark || wt.backendFields?.remark || "N/A",
                                    fileUrl: updatedService.rawFile || wt.backendFields?.fileUrl || "",
                                    imageUrl: wt.backendFields?.imageUrl || "",
                                },
                            }
                            : wt,
                    ),
                })),
            )

            console.log("[v0] Assignment successful:", { technicianName, status, updatedService })
        } catch (error: any) {
            console.error("[v0] Assignment failed:", error)
            alert(`Failed to assign technician: ${error.message}`)
        } finally {
            setAssigningTechnician((prev) => ({ ...prev, [workTypeId]: false }))
        }
    }

    const handleStaffAssign = async (workTypeId: string) => {
        const staffId = selectedStaff[workTypeId]
        const status = selectedStatuses[workTypeId] || "pending"

        if (!staffId || !orderId) return

        try {
            setAssigningStaff((prev) => ({ ...prev, [workTypeId]: true }))

            const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
            if (!workType) throw new Error("Work type not found")

            const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))
            if (!parentService) throw new Error("Parent service not found")

            const serviceId = workType.id.split("-")[0]
            const workTypeName = parentService.workTypeName

            // Use different API calls based on status
            if (status === "completed" || status === "paid") {
                // Use completeStatusAndReport API
                await completeStatusAndReport(
                    staffId, // technicianId (using staffId here)
                    orderId,
                    serviceId,
                    status,
                    {}, // payload - can be extended as needed
                    workTypeName,
                    uploadedFiles[workTypeId] ? [uploadedFiles[workTypeId]] : undefined,
                )
            } else {
                // Use assignToOfficeStaff API for other statuses
                await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, status)
            }

            setAssignments((prev) => ({
                ...prev,
                [workTypeId]: {
                    ...prev[workTypeId],
                    staffId,
                    status,
                    isAssigned: true,
                },
            }))

            setSelectedStatuses((prev) => ({
                ...prev,
                [workTypeId]: status,
            }))

            // Save to localStorage
            const newAssignments = {
                ...assignments,
                [workTypeId]: { staffId, status, isAssigned: true },
            }
            saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)

            const newStatuses = { ...selectedStatuses, [workTypeId]: status }
            saveToLocalStorage(STORAGE_KEYS.selectedStatuses, newStatuses)

            console.log("[v0] Staff assignment successful:", { staffId, status, workTypeName })
        } catch (error: any) {
            console.error("[v0] Staff assignment failed:", error)
            alert(`Failed to assign staff: ${error.message}`)
        } finally {
            setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
        }
    }

    const handleEditToggle = (workTypeId: string) => {
        setEditingWorkType((prev) => ({
            ...prev,
            [workTypeId]: !prev[workTypeId],
        }))
    }

    const handleStatusSave = async (workTypeId: string) => {
        const staffId = assignments[workTypeId]?.staffId
        const newStatus = selectedStatuses[workTypeId]

        if (!staffId || !orderId || !newStatus) return

        try {
            setAssigningStaff((prev) => ({ ...prev, [workTypeId]: true }))

            const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
            if (!workType) throw new Error("Work type not found")

            const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))
            if (!parentService) throw new Error("Parent service not found")

            const serviceId =workType.id.split("-")[0]
            const workTypeName = parentService.workTypeName

            // Use different API calls based on status
            if (newStatus === "completed" || newStatus === "paid") {
                // Use completeStatusAndReport API
                const response = await completeStatusAndReport(
                    staffId,
                    orderId,
                    serviceId,
                    newStatus,
                    {}, // payload - can be extended as needed
                    workTypeName,
                    uploadedFiles[workTypeId] ? [uploadedFiles[workTypeId]] : undefined,
                )

                // Update report number if returned from API
                if (response.data && response.data.reportNumber) {
                    setMachineData((prevData) =>
                        prevData.map((service) => ({
                            ...service,
                            workTypes: service.workTypes.map((wt) =>
                                wt.id === workTypeId ? { ...wt, reportNumber: response.data.reportNumber } : wt,
                            ),
                        })),
                    )
                }
            } else {
                // Use assignToOfficeStaff API for other statuses
                await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, newStatus)
            }

            setAssignments((prev) => ({
                ...prev,
                [workTypeId]: {
                    ...prev[workTypeId],
                    status: newStatus,
                },
            }))

            // Save to localStorage
            const newStatuses = { ...selectedStatuses, [workTypeId]: newStatus }
            saveToLocalStorage(STORAGE_KEYS.selectedStatuses, newStatuses)

            // Exit edit mode
            setEditingWorkType((prev) => ({ ...prev, [workTypeId]: false }))

            console.log("[v0] Status update successful:", { newStatus, workTypeName })
        } catch (error: any) {
            console.error("[v0] Status update failed:", error)
            alert(`Failed to update status: ${error.message}`)
        } finally {
            setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
        }
    }

    const handleStatusUpdate = (workTypeId: string, newStatus: string) => {
        setSelectedStatuses((prev) => {
            const newStatuses = { ...prev, [workTypeId]: newStatus }
            saveToLocalStorage(STORAGE_KEYS.selectedStatuses, newStatuses)
            return newStatuses
        })
        setAssignments((prev) => {
            const newAssignments = {
                ...prev,
                [workTypeId]: { ...prev[workTypeId], status: newStatus },
            }
            saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)
            return newAssignments
        })
    }

    const handleFileUpload = (workTypeId: string, file: File) => {
        setUploadedFiles((prev) => {
            const newFiles = { ...prev, [workTypeId]: file }
            const fileNames = Object.entries(newFiles).reduce(
                (acc, [key, fileObj]) => {
                    acc[key] = fileObj?.name || null
                    return acc
                },
                {} as Record<string, string | null>,
            )
            saveToLocalStorage(STORAGE_KEYS.uploadedFileNames, fileNames)
            return newFiles
        })
        setAssignments((prev) => {
            const newAssignments = {
                ...prev,
                [workTypeId]: { ...prev[workTypeId], uploadedFile: file },
            }
            saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)
            return newAssignments
        })
        setTimeout(() => {
            handleStatusUpdate(workTypeId, "generated")
        }, 1000)
    }

    const toggleAccordion = (itemId: string) => {
        setExpandedItems((prev) => {
            const newItems = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
            saveToLocalStorage(STORAGE_KEYS.expandedItems, newItems)
            return newItems
        })
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Services Management</h1>
                    <p className="text-gray-600">Loading machine data...</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Fetching machine details...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6 p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Services Management</h1>
                    <p className="text-gray-600">Error loading machine data</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load machine data</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={fetchMachineData}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Services Management</h1>
                <p className="text-gray-600">Manage your equipment and work types</p>
            </div>

            <div className="grid gap-6">
                {machineData.map((service) => (
                    <div key={service.id} className="shadow-lg border-0 bg-white rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <h2 className="text-xl font-semibold text-gray-900">{service.machineType}</h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="font-medium">Equipment ID: {service.equipmentId}</span>
                                        <span className="font-medium">Work Type: {service.workTypeName}</span>{" "}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                                    {service.status}
                                </span>
                            </div>
                        </div>

                        <div className="divide-y">
                            {service.workTypes.map((workType) => (
                                <div key={workType.id} className="border-b last:border-b-0">
                                    <button
                                        onClick={() => toggleAccordion(workType.id)}
                                        className="w-full px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getWorkTypeIcon(workType.name)}
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">{workType.name}</div>
                                                <div className="text-sm text-gray-500">{workType.description}</div>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform ${expandedItems.includes(workType.id) ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ${expandedItems.includes(workType.id) ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                                            }`}
                                    >
                                        <div className="px-6 pb-4">
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                                {workType.name === "QA Raw" && (
                                                    <div className="space-y-4">
                                                        {!assignments[workType.id]?.isAssigned ? (
                                                            <div className="space-y-3">
                                                                <label className="block text-sm font-medium text-gray-700">Assign Engineer</label>
                                                                <div className="flex gap-2">
                                                                    <select
                                                                        value={selectedEmployees[workType.id] || ""}
                                                                        onChange={(e) => {
                                                                            setSelectedEmployees((prev) => {
                                                                                const newSelection = { ...prev, [workType.id]: e.target.value }
                                                                                saveToLocalStorage(STORAGE_KEYS.selectedEmployees, newSelection)
                                                                                return newSelection
                                                                            })
                                                                        }}
                                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        disabled={loadingDropdowns || assigningTechnician[workType.id]}
                                                                    >
                                                                        <option value="">
                                                                            {loadingDropdowns ? "Loading engineers..." : "Select Engineer"}
                                                                        </option>
                                                                        {technicians.map((tech) => (
                                                                            <option key={tech._id} value={tech._id}>
                                                                                {tech.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={() => handleEmployeeAssign(workType.id)}
                                                                        disabled={
                                                                            !selectedEmployees[workType.id] ||
                                                                            loadingDropdowns ||
                                                                            assigningTechnician[workType.id]
                                                                        }
                                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                                                                    >
                                                                        {assigningTechnician[workType.id] && <Loader2 className="h-4 w-4 animate-spin" />}
                                                                        {assigningTechnician[workType.id] ? "Assigning..." : "Assign"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2 text-green-600">
                                                                    <Check className="h-4 w-4" />
                                                                    <span className="font-medium">
                                                                        Assigned to:{" "}
                                                                        {workType.assignedTechnicianName ||
                                                                            technicians.find((tech) => tech._id === assignments[workType.id]?.employeeId)
                                                                                ?.name ||
                                                                            "Unknown"}
                                                                    </span>
                                                                    {workType.assignmentStatus && (
                                                                        <span
                                                                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(workType.assignmentStatus)}`}
                                                                        >
                                                                            {workType.assignmentStatus}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="p-3 bg-white rounded-md border">
                                                                        <label className="text-xs text-gray-500">Serial Number</label>
                                                                        <p className="font-medium">{workType.backendFields?.serialNo}</p>
                                                                    </div>
                                                                    <div className="p-3 bg-white rounded-md border">
                                                                        <label className="text-xs text-gray-500">Model Name</label>
                                                                        <p className="font-medium">{workType.backendFields?.modelName}</p>
                                                                    </div>
                                                                    <div className="p-3 bg-white rounded-md border">
                                                                        <label className="text-xs text-gray-500">Remark</label>
                                                                        <p className="font-medium">{workType.backendFields?.remark}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                                                                        <Eye className="h-4 w-4" />
                                                                        View File
                                                                    </button>
                                                                    <button className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
                                                                        <Eye className="h-4 w-4" />
                                                                        View Image
                                                                    </button>
                                                                    <button className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors">
                                                                        <Download className="h-4 w-4" />
                                                                        Download
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {workType.name === "QA Test" && (
                                                    <div className="space-y-4">
                                                        {!assignments[workType.id]?.isAssigned ? (
                                                            <div className="space-y-3">
                                                                <label className="block text-sm font-medium text-gray-700">Assign Staff & Status</label>
                                                                <div className="flex gap-2">
                                                                    <select
                                                                        value={selectedStaff[workType.id] || ""}
                                                                        onChange={(e) => {
                                                                            setSelectedStaff((prev) => {
                                                                                const newSelection = { ...prev, [workType.id]: e.target.value }
                                                                                saveToLocalStorage(STORAGE_KEYS.selectedStaff, newSelection)
                                                                                return newSelection
                                                                            })
                                                                        }}
                                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        disabled={loadingDropdowns || assigningStaff[workType.id]}
                                                                    >
                                                                        <option value="">{loadingDropdowns ? "Loading staff..." : "Select Staff"}</option>
                                                                        {officeStaff.map((staff) => (
                                                                            <option key={staff._id} value={staff._id}>
                                                                                {staff.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <select
                                                                        value={selectedStatuses[workType.id] || "pending"}
                                                                        onChange={(e) => {
                                                                            setSelectedStatuses((prev) => {
                                                                                const newStatuses = { ...prev, [workType.id]: e.target.value }
                                                                                saveToLocalStorage(STORAGE_KEYS.selectedStatuses, newStatuses)
                                                                                return newStatuses
                                                                            })
                                                                        }}
                                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        disabled={assigningStaff[workType.id]}
                                                                    >
                                                                        {statusOptions.map((status) => (
                                                                            <option key={status} value={status}>
                                                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={() => handleStaffAssign(workType.id)}
                                                                        disabled={
                                                                            !selectedStaff[workType.id] || loadingDropdowns || assigningStaff[workType.id]
                                                                        }
                                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                                                                    >
                                                                        {assigningStaff[workType.id] && <Loader2 className="h-4 w-4 animate-spin" />}
                                                                        {assigningStaff[workType.id] ? "Assigning..." : "Assign"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2 text-green-600">
                                                                        <Check className="h-4 w-4" />
                                                                        <span className="font-medium">
                                                                            Assigned to:{" "}
                                                                            {officeStaff.find((staff) => staff._id === assignments[workType.id]?.staffId)
                                                                                ?.name || "Unknown"}
                                                                        </span>
                                                                        <span
                                                                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedStatuses[workType.id] || "pending")}`}
                                                                        >
                                                                            {selectedStatuses[workType.id] || "pending"}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleEditToggle(workType.id)}
                                                                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                        Edit
                                                                    </button>
                                                                </div>

                                                                {editingWorkType[workType.id] && (
                                                                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                                                        <div className="flex gap-2 items-center">
                                                                            <label className="text-sm font-medium text-blue-700">Update Status:</label>
                                                                            <select
                                                                                value={selectedStatuses[workType.id] || "pending"}
                                                                                onChange={(e) => {
                                                                                    setSelectedStatuses((prev) => ({
                                                                                        ...prev,
                                                                                        [workType.id]: e.target.value,
                                                                                    }))
                                                                                }}
                                                                                className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                disabled={assigningStaff[workType.id]}
                                                                            >
                                                                                {statusOptions.map((status) => (
                                                                                    <option key={status} value={status}>
                                                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                            <button
                                                                                onClick={() => handleStatusSave(workType.id)}
                                                                                disabled={assigningStaff[workType.id]}
                                                                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-1"
                                                                            >
                                                                                {assigningStaff[workType.id] && <Loader2 className="h-3 w-3 animate-spin" />}
                                                                                {assigningStaff[workType.id] ? "Saving..." : "Save"}
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleEditToggle(workType.id)}
                                                                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {(selectedStatuses[workType.id] === "completed") && (
                                                                        <div className="space-y-3 p-3 bg-green-50 rounded-md border border-green-200">
                                                                            <label className="block text-sm font-medium text-green-700">
                                                                                Upload File (Optional)
                                                                            </label>
                                                                            <input
                                                                                type="file"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0]
                                                                                    if (file) handleFileUpload(workType.id, file)
                                                                                }}
                                                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700"
                                                                            />

                                                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                                                <div className="p-2 bg-white rounded border">
                                                                                    <label className="text-xs text-gray-500">Report Number</label>
                                                                                    <p className="font-medium text-sm">{workType.reportNumber}</p>
                                                                                </div>
                                                                                <div className="p-2 bg-white rounded border">
                                                                                    <label className="text-xs text-gray-500">URL Number</label>
                                                                                    <p className="font-medium text-sm">{workType.urlNumber}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                {uploadedFiles[workType.id] && (
                                                                    <div className="p-3 bg-green-50 rounded-md border border-green-200">
                                                                        <div className="flex items-center gap-2 text-green-700">
                                                                            <Upload className="h-4 w-4" />
                                                                            <span className="text-sm font-medium">
                                                                                Uploaded: {uploadedFiles[workType.id]?.name}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {workType.name === "Elora" && (
                                                    <div className="space-y-4">
                                                        {!assignments[workType.id]?.isAssigned ? (
                                                            <div className="space-y-3">
                                                                <label className="block text-sm font-medium text-gray-700">Assign Staff</label>
                                                                <div className="flex gap-2">
                                                                    <select
                                                                        value={selectedStaff[workType.id] || ""}
                                                                        onChange={(e) => {
                                                                            setSelectedStaff((prev) => {
                                                                                const newSelection = { ...prev, [workType.id]: e.target.value }
                                                                                saveToLocalStorage(STORAGE_KEYS.selectedStaff, newSelection)
                                                                                return newSelection
                                                                            })
                                                                        }}
                                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        disabled={loadingDropdowns}
                                                                    >
                                                                        <option value="">{loadingDropdowns ? "Loading staff..." : "Select Staff"}</option>
                                                                        {officeStaff.map((staff) => (
                                                                            <option key={staff._id} value={staff._id}>
                                                                                {staff.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={() => handleStaffAssign(workType.id)}
                                                                        disabled={!selectedStaff[workType.id] || loadingDropdowns}
                                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                                                    >
                                                                        Assign
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2 text-green-600">
                                                                    <Check className="h-4 w-4" />
                                                                    <span className="font-medium">
                                                                        Assigned to:{" "}
                                                                        {officeStaff.find((staff) => staff._id === assignments[workType.id]?.staffId)
                                                                            ?.name || "Unknown"}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-sm font-medium text-gray-700">Status:</label>
                                                                        <span
                                                                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedStatuses[workType.id] || "pending")}`}
                                                                        >
                                                                            {selectedStatuses[workType.id] || "pending"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <select
                                                                            value={selectedStatuses[workType.id] || "pending"}
                                                                            onChange={(e) => handleStatusUpdate(workType.id, e.target.value)}
                                                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        >
                                                                            {getAvailableStatuses(selectedStatuses[workType.id] || "pending").map(
                                                                                (status) => (
                                                                                    <option key={status} value={status}>
                                                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                                    </option>
                                                                                ),
                                                                            )}
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                {selectedStatuses[workType.id] === "completed" && (
                                                                    <div className="space-y-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                                                                        <label className="block text-sm font-medium text-blue-700">Upload File</label>
                                                                        <input
                                                                            type="file"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0]
                                                                                if (file) handleFileUpload(workType.id, file)
                                                                            }}
                                                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                                                        />

                                                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                                                            <div className="p-2 bg-white rounded border">
                                                                                <label className="text-xs text-gray-500">Report Number</label>
                                                                                <p className="font-medium text-sm">{workType.reportNumber}</p>
                                                                            </div>
                                                                            <div className="p-2 bg-white rounded border">
                                                                                <label className="text-xs text-gray-500">URL Number</label>
                                                                                <p className="font-medium text-sm">{workType.urlNumber}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {uploadedFiles[workType.id] && (
                                                                    <div className="p-3 bg-green-50 rounded-md border border-green-200">
                                                                        <div className="flex items-center gap-2 text-green-700">
                                                                            <Upload className="h-4 w-4" />
                                                                            <span className="text-sm font-medium">
                                                                                Uploaded: {uploadedFiles[workType.id]?.name}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
