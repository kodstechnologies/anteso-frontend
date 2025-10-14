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
    RefreshCw,
    ImageIcon,
    FileText,
} from "lucide-react"
import { getAssignedStaffName, getMachineDetails } from "../../../api" // Adjust path as needed
import {
    getAllTechnicians,
    getAllOfficeStaff,
    assignToTechnicianByQA,
    getAssignedTechnicianName,
    getMachineUpdates,
    assignToOfficeStaff,
    completeStatusAndReport,
    editDocuments,
    getReportNumbers,
    assignToOfficeStaffByElora, // Import assignToOfficeStaffByElora
} from "../../../api"

const statusOptions = ["pending", "in progress", "complete", "generated", "paid"]

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
            uploadFile?: string
            viewFile?: string[]
            reportStatus?: string
            qaTestReportNumber: any
            reportURLNumber: any

        }
        reportNumber?: string
        urlNumber?: string
        assignedTechnicianName?: string
        assignmentStatus?: string
        serviceId?: string
    }>
    rawPhoto?: string[]
}

interface ServicesCardProps {
    orderId?: any
}
interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    message: string;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    onClose,
    title,
    message,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-2">{title}</h2>
                <p className="text-gray-700 mb-4">{message}</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function ServicesCard({ orderId }: ServicesCardProps) {
    const STORAGE_KEYS = {
        assignments: `assignments_${orderId}`,
        selectedStatuses: `selectedStatuses_${orderId}`,
        reportNumbers: `reportNumbers_${orderId}`,
        verificationResponses: `verificationResponses_${orderId}`,
        expandedItems: `expandedItems_${orderId}`,
        selectedEmployees: `selectedEmployees_${orderId}`,
        selectedStaff: `selectedStaff_${orderId}`,
        uploadedFileNames: `uploadedFileNames_${orderId}`,
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
                isReassigned?: boolean
            }
        >
    >({})
    const [selectedEmployees, setSelectedEmployees] = useState<Record<string, string>>({})
    const [selectedStaff, setSelectedStaff] = useState<Record<string, string>>({})
    const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({})
    // const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({})
    const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | undefined>>({})

    const [verificationResponses, setVerificationResponses] = useState<
        Record<string, { field1: string; field2: string }>
    >({})

    const [machineData, setMachineData] = useState<MachineData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [technicians, setTechnicians] = useState<Technician[]>([])
    const [officeStaff, setOfficeStaff] = useState<OfficeStaff[]>([])
    const [loadingDropdowns, setLoadingDropdowns] = useState(true)
    const [assigningTechnician, setAssigningTechnician] = useState<Record<string, boolean>>({})

    const [editingWorkType, setEditingWorkType] = useState<Record<string, boolean>>({})
    const [assigningStaff, setAssigningStaff] = useState<Record<string, boolean>>({})
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    const showModal = (title: string, message: string) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
    };

    const hideModal = () => {
        setModalOpen(false);
    };
    const [reportNumbers, setReportNumbers] = useState<Record<
        string,
        { qatest?: { qaTestReportNumber: string; reportULRNumber: string, reportStatus: any }; elora?: { qaTestReportNumber: string; reportULRNumber: string } }
    >>({});


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

            setTechnicians(techniciansData.data || [])
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

    // const fetchExistingAssignments = async () => {
    //     try {
    //         const assignmentPromises: Promise<any>[] = []
    //         const workTypeMapping: Array<{ workTypeId: string; serviceId: string; workTypeName: string }> = []

    //         // Collect all work types that need to be checked for assignments
    //         machineData.forEach((service) => {
    //             service.workTypes.forEach((workType) => {
    //                 if (workType.name === "QA Raw") {
    //                     // Only check QA Raw for technician assignments
    //                     const serviceId = workType.id.split("-")[0]
    //                     const workTypeName = service.workTypeName
    //                     const mappedWorkType = getWorkTypeIdentifier(workTypeName) // Apply mapping here

    //                     workTypeMapping.push({
    //                         workTypeId: workType.id,
    //                         serviceId,
    //                         workTypeName,
    //                     })

    //                     // Add promise to check for existing assignment
    //                     assignmentPromises.push(
    //                         getAssignedTechnicianName(orderId, serviceId, mappedWorkType) // Use mapped work type
    //                             .then((response) => ({
    //                                 workTypeId: workType.id,
    //                                 serviceId,
    //                                 workTypeName,
    //                                 assignedTechnician: response.data.assignedTechnician,
    //                             }))
    //                             .catch((error) => {
    //                                 console.error(`Error fetching assignment for ${workTypeName}:`, error)
    //                                 return {
    //                                     workTypeId: workType.id,
    //                                     serviceId,
    //                                     workTypeName,
    //                                     assignedTechnician: null,
    //                                 }
    //                             }),
    //                     )
    //                 }
    //             })
    //         })

    //         if (assignmentPromises.length === 0) return

    //         const results = await Promise.all(assignmentPromises)

    //         // Process results and update state
    //         const newAssignments: Record<string, any> = {}
    //         const updatedMachineData = machineData.map((service) => ({
    //             ...service,
    //             workTypes: service.workTypes.map((workType) => {
    //                 const result = results.find((r) => r.workTypeId === workType.id)

    //                 if (result && result.assignedTechnician) {
    //                     // Found existing assignment
    //                     newAssignments[workType.id] = {
    //                         isAssigned: true,
    //                         technicianName: result.assignedTechnician.name,
    //                         assignmentStatus: result.assignedTechnician.status,
    //                     }

    //                     return {
    //                         ...workType,
    //                         assignedTechnicianName: result.assignedTechnician.name,
    //                         assignmentStatus: result.assignedTechnician.status,
    //                     }
    //                 }

    //                 return workType
    //             }),
    //         }))

    //         // Update states with backend data
    //         setAssignments(newAssignments)
    //         setMachineData(updatedMachineData)

    //         console.log("[v0] Fetched existing assignments:", newAssignments)
    //     } catch (error) {
    //         console.error("[v0] Error fetching existing assignments:", error)
    //     }
    // }

    const fetchExistingAssignments = async () => {
        try {
            const assignmentPromises: Promise<any>[] = []
            const workTypeMapping: Array<{ workTypeId: string; serviceId: string; workTypeName: string }> = []

            // Collect all work types that need to be checked for assignments
            machineData.forEach((service) => {
                service.workTypes.forEach((workType) => {
                    const serviceId = workType.id.split("-")[0]
                    const workTypeName = service.workTypeName

                    workTypeMapping.push({
                        workTypeId: workType.id,
                        serviceId,
                        workTypeName,
                    })

                    if (workType.name === "QA Raw") {
                        // Technician assignment for QA Raw
                        assignmentPromises.push(
                            getAssignedTechnicianName(orderId, serviceId, workTypeName)
                                .then((response) => ({
                                    workTypeId: workType.id,
                                    serviceId,
                                    workTypeName,
                                    assignedTechnician: response.data.assignedTechnician,
                                }))
                                .catch((error) => {
                                    console.error(`Error fetching technician assignment for ${workTypeName}:`, error)
                                    return {
                                        workTypeId: workType.id,
                                        serviceId,
                                        workTypeName,
                                        assignedTechnician: null,
                                    }
                                }),
                        )
                    } else if (workType.name === "QA Test" || workType.name === "Elora") {
                        // Staff assignment for QA Test and Elora - assume getAssignedStaffName API exists
                        // Replace with actual API call, e.g., getAssignedStaffName(orderId, serviceId, workTypeName)
                        assignmentPromises.push(
                            getAssignedStaffName(orderId, serviceId, workTypeName) // Add this API import if needed
                                .then((response) => ({
                                    workTypeId: workType.id,
                                    serviceId,
                                    workTypeName,
                                    assignedStaff: response.data.assignedStaff, // Assume response structure similar to technician
                                }))
                                .catch((error) => {
                                    console.error(`Error fetching staff assignment for ${workTypeName}:`, error)
                                    return {
                                        workTypeId: workType.id,
                                        serviceId,
                                        workTypeName,
                                        assignedStaff: null,
                                    }
                                }),
                        )
                    }
                })
            })

            if (assignmentPromises.length === 0) return

            const results = await Promise.all(assignmentPromises)

            // Process results and update state
            const newAssignments: Record<string, any> = {}
            const updatedMachineData = machineData.map((service) => ({
                ...service,
                workTypes: service.workTypes.map((workType) => {
                    const result = results.find((r) => r.workTypeId === workType.id)

                    if (workType.name === "QA Raw" && result?.assignedTechnician) {
                        // Technician assignment
                        newAssignments[workType.id] = {
                            isAssigned: true,
                            employeeId: result.assignedTechnician._id, // Assume _id in response
                            technicianName: result.assignedTechnician.name,
                            assignmentStatus: result.assignedTechnician.status,
                        }

                        return {
                            ...workType,
                            assignedTechnicianName: result.assignedTechnician.name,
                            assignmentStatus: result.assignedTechnician.status,
                        }
                    } else if ((workType.name === "QA Test" || workType.name === "Elora") && result?.assignedStaff) {
                        // Staff assignment
                        newAssignments[workType.id] = {
                            isAssigned: true,
                            staffId: result.assignedStaff._id, // Assume _id in response
                            status: result.assignedStaff.status,
                        }

                        return {
                            ...workType,
                            assignedStaffName: result.assignedStaff.name, // Add this field if needed for display
                            assignmentStatus: result.assignedStaff.status,
                        }
                    }

                    return workType
                }),
            }))

            // Update states with backend data
            setAssignments((prev) => ({ ...prev, ...newAssignments }))
            setMachineData(updatedMachineData)

            // Save updated assignments to localStorage
            saveToLocalStorage(STORAGE_KEYS.assignments, { ...assignments, ...newAssignments })

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

            const machinesArray = Array.isArray(response) ? response : [response]

            if (!machinesArray || machinesArray.length === 0) {
                throw new Error("No machine data found")
            }

            const allTransformedData: MachineData[] = []

            machinesArray.forEach((machineData: any) => {
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
                                serialNo: machineData.serialNumber || machineData.equipmentNo || "N/A",
                                modelName: machineData.machineModel || "N/A",
                                remark: machineData.remark || "N/A",
                                fileUrl: workTypeDetail.viewFile?.[0] || "",
                                imageUrl: workTypeDetail.viewFile?.[1] || "",
                                uploadFile: workTypeDetail.uploadFile || "",
                                viewFile: workTypeDetail.viewFile || [],
                                reportURLNumber: workTypeDetail.QAtest?.reportULRNumber || 'N/A',
                                qaTestReportNumber: workTypeDetail.QAtest?.qaTestReportNumber || 'N/A',
                                reportStatus: workTypeDetail.QAtest?.reportStatus || 'pending',
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
                        rawPhoto: machineData.rawPhoto || [],
                    }
                })

                allTransformedData.push(...transformedData)
            })

            setMachineData(allTransformedData)

            // Populate initial reportNumbers from machine data
            const initialReportNumbers: Record<string, any> = {};
            allTransformedData.forEach((service) => {
                if (service.workTypeName === "Quality Assurance Test") {
                    const qaRawWorkType = service.workTypes.find((wt) => wt.name === "QA Raw");
                    if (qaRawWorkType && qaRawWorkType.backendFields) {
                        initialReportNumbers[service.id] = {
                            qatest: {
                                reportStatus: qaRawWorkType.backendFields.reportStatus,
                                qaTestReportNumber: qaRawWorkType.backendFields.qaTestReportNumber,
                                reportULRNumber: qaRawWorkType.backendFields.reportURLNumber,
                            },
                        };
                    }
                }
            });
            setReportNumbers(initialReportNumbers);
            saveToLocalStorage(STORAGE_KEYS.reportNumbers, initialReportNumbers);

            await fetchExistingAssignments()
        } catch (err: any) {
            console.error("Error fetching machine data:", err)
            setError(err.message || "Failed to fetch machine data")
        } finally {
            setLoading(false)
        }
    }

    const handleViewFile = (workTypeId: string) => {
        const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)

        const fileUrl = workType?.backendFields?.fileUrl
        if (fileUrl && fileUrl !== "") {
            window.open(fileUrl, "_blank")
        } else {
            alert("No file available to view")
        }
    }

    const handleViewImage = (workTypeId: string) => {
        const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)

        const imageUrl = workType?.backendFields?.imageUrl
        if (imageUrl && imageUrl !== "") {
            window.open(imageUrl, "_blank")
        } else {
            // Check if there are images in rawPhoto array
            const service = machineData.find((s) => s.workTypes.some((wt) => wt.id === workTypeId))
            if (service && service.rawPhoto && service.rawPhoto.length > 0) {
                window.open(service.rawPhoto[0], "_blank")
            } else {
                alert("No image available to view")
            }
        }
    }

    const handleDownload = (workTypeId: string) => {
        const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)

        const fileUrl = workType?.backendFields?.fileUrl
        if (fileUrl && fileUrl !== "") {
            // Create a temporary anchor element to trigger download
            const link = document.createElement("a")
            link.href = fileUrl
            link.download = `file-${workTypeId}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } else {
            alert("No file available to download")
        }
    }

    useEffect(() => {
        const loadedExpandedItems = loadFromLocalStorage(STORAGE_KEYS.expandedItems, [])
        const loadedSelectedEmployees = loadFromLocalStorage(STORAGE_KEYS.selectedEmployees, {})
        const loadedSelectedStaff = loadFromLocalStorage(STORAGE_KEYS.selectedStaff, {})
        const loadedSelectedStatuses = loadFromLocalStorage(STORAGE_KEYS.selectedStatuses, {})
        const loadedFileNames = loadFromLocalStorage(STORAGE_KEYS.uploadedFileNames, {})
        const loadedReportNumbers = loadFromLocalStorage(STORAGE_KEYS.reportNumbers, {})
        const loadedAssignments = loadFromLocalStorage(STORAGE_KEYS.assignments, {})
        const savedVerificationResponses = loadFromLocalStorage(STORAGE_KEYS.verificationResponses, {})

        setExpandedItems(loadedExpandedItems)
        setSelectedEmployees(loadedSelectedEmployees)
        setSelectedStaff(loadedSelectedStaff)
        setSelectedStatuses(loadedSelectedStatuses)
        setReportNumbers(loadedReportNumbers)
        setAssignments(loadedAssignments)
        setVerificationResponses(savedVerificationResponses)

        // const mockFiles: Record<string, File | null> = {}
        const mockFiles: Record<string, File | undefined> = {}

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
            case "in progress":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "complete":
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
            case "accepted":
                return "bg-green-100 text-green-800 border-green-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getAvailableStatuses = (currentStatus: string, isReassigned = false) => {
        if (isReassigned) {
            return statusOptions // Allow all statuses if reassigned
        }
        const currentIndex = statusOptions.indexOf(currentStatus)
        return statusOptions.slice(currentIndex) // Only allow forward progression
    }

    const canReassign = (currentStatus: string) => {
        const statusIndex = statusOptions.indexOf(currentStatus)
        const completeIndex = statusOptions.indexOf("complete")
        return statusIndex < completeIndex
    }

    const isFileUploadMandatory = (status: string) => {
        return status === "complete"
    }

    // const handleEmployeeAssign = async (workTypeId: string) => {
    //     const employeeId = selectedEmployees[workTypeId]
    //     if (!employeeId || !orderId) return

    //     try {
    //         setAssigningTechnician((prev) => ({ ...prev, [workTypeId]: true }))

    //         const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)

    //         if (!workType) throw new Error("Work type not found")

    //         const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))

    //         if (!parentService) throw new Error("Parent service not found")

    //         const serviceId = workType.id.split("-")[0]
    //         const workTypeName = parentService.workTypeName || "Unknown Work Type";

    //         console.log("🚀 ~ handleEmployeeAssign ~ workTypeName from service:", workTypeName)
    //         console.log("🚀 ~ handleEmployeeAssign ~ employeeId:", employeeId)
    //         console.log("🚀 ~ handleEmployeeAssign ~ serviceId:", serviceId)
    //         console.log("🚀 ~ handleEmployeeAssign ~ orderId:", orderId)

    //         await assignToTechnicianByQA(orderId, serviceId, employeeId, workTypeName)

    //         const assignedTechResponse = await getAssignedTechnicianName(orderId, serviceId, workTypeName)
    //         const { technicianName, status } = assignedTechResponse.data

    //         const machineUpdatesResponse = await getMachineUpdates(employeeId, orderId, serviceId, workTypeName)
    //         console.log("🚀 ~ handleEmployeeAssign ~ machineUpdatesResponse:", machineUpdatesResponse)
    //         const { updatedService } = machineUpdatesResponse.data

    //         setAssignments((prev) => ({
    //             ...prev,
    //             [workTypeId]: {
    //                 ...prev[workTypeId],
    //                 employeeId,
    //                 isAssigned: true,
    //                 technicianName,
    //                 assignmentStatus: status,
    //             },
    //         }))

    //         setMachineData((prevData) =>
    //             prevData.map((service) => ({
    //                 ...service,
    //                 workTypes: service.workTypes.map((wt) =>
    //                     wt.id === workTypeId
    //                         ? {
    //                             ...wt,
    //                             assignedTechnicianName: technicianName,
    //                             assignmentStatus: status,
    //                             backendFields: {
    //                                 ...wt.backendFields,
    //                                 serialNo: updatedService.machineModel || wt.backendFields?.serialNo || "N/A",
    //                                 modelName: updatedService.machineModel || wt.backendFields?.modelName || "N/A",
    //                                 remark: updatedService.remark || wt.backendFields?.remark || "N/A",
    //                                 fileUrl: updatedService.rawFile || wt.backendFields?.fileUrl || "",
    //                                 imageUrl: wt.backendFields?.imageUrl || "",
    //                             },
    //                         }
    //                         : wt,
    //                 ),
    //             })),
    //         )

    //         console.log("[v0] Assignment successful:", { technicianName, status, updatedService })
    //     } catch (error: any) {
    //         console.error("[v0] Assignment failed:", error)
    //         alert(`Failed to assign technician: ${error.message}`)
    //     } finally {
    //         setAssigningTechnician((prev) => ({ ...prev, [workTypeId]: false }))
    //     }
    // }



    // const handleEmployeeAssign = async (workTypeId: string) => {
    //     const employeeId = selectedEmployees[workTypeId]
    //     if (!employeeId || !orderId) return

    //     try {
    //         setAssigningTechnician((prev) => ({ ...prev, [workTypeId]: true }))

    //         const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)

    //         if (!workType) throw new Error("Work type not found")

    //         const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))

    //         if (!parentService) throw new Error("Parent service not found")

    //         const serviceId = workType.id.split("-")[0]
    //         const workTypeName = parentService.workTypeName || "Unknown Work Type";

    //         console.log("🚀 ~ handleEmployeeAssign ~ workTypeName from service:", workTypeName)
    //         console.log("🚀 ~ handleEmployeeAssign ~ employeeId:", employeeId)
    //         console.log("🚀 ~ handleEmployeeAssign ~ serviceId:", serviceId)
    //         console.log("🚀 ~ handleEmployeeAssign ~ orderId:", orderId)

    //         await assignToTechnicianByQA(orderId, serviceId, employeeId, workTypeName)

    //         const assignedTechResponse = await getAssignedTechnicianName(orderId, serviceId, workTypeName)
    //         const { technicianName, status } = assignedTechResponse.data

    //         const machineUpdatesResponse = await getMachineUpdates(employeeId, orderId, serviceId, workTypeName)
    //         console.log("🚀 ~ handleEmployeeAssign ~ machineUpdatesResponse:", machineUpdatesResponse)
    //         const { updatedService } = machineUpdatesResponse.data

    //         const newAssignments = {
    //             ...assignments,
    //             [workTypeId]: {
    //                 employeeId,
    //                 isAssigned: true,
    //                 technicianName,
    //                 assignmentStatus: status,
    //                 isReassigned: false,
    //             },
    //         }

    //         setAssignments((prev) => ({
    //             ...prev,
    //             [workTypeId]: {
    //                 ...prev[workTypeId],
    //                 employeeId,
    //                 isAssigned: true,
    //                 technicianName,
    //                 assignmentStatus: status,
    //                 isReassigned: false,
    //             },
    //         }))

    //         saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)

    //         setMachineData((prevData) =>
    //             prevData.map((service) => ({
    //                 ...service,
    //                 workTypes: service.workTypes.map((wt) =>
    //                     wt.id === workTypeId
    //                         ? {
    //                             ...wt,
    //                             assignedTechnicianName: technicianName,
    //                             assignmentStatus: status,
    //                             backendFields: {
    //                                 ...wt.backendFields,
    //                                 serialNo: updatedService.machineModel || wt.backendFields?.serialNo || "N/A",
    //                                 modelName: updatedService.machineModel || wt.backendFields?.modelName || "N/A",
    //                                 remark: updatedService.remark || wt.backendFields?.remark || "N/A",
    //                                 fileUrl: updatedService.rawFile || wt.backendFields?.fileUrl || "",
    //                                 imageUrl: wt.backendFields?.imageUrl || "",
    //                             },
    //                         }
    //                         : wt,
    //                 ),
    //             })),
    //         )

    //         console.log("[v0] Assignment successful:", { technicianName, status, updatedService })
    //     } catch (error: any) {
    //         console.error("[v0] Assignment failed:", error)
    //         alert(`Failed to assign technician: ${error.message}`)
    //     } finally {
    //         setAssigningTechnician((prev) => ({ ...prev, [workTypeId]: false }))
    //     }
    // }

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
            const workTypeName = parentService.workTypeName || "Unknown Work Type";

            console.log("🚀 ~ handleEmployeeAssign ~ workTypeName from service:", workTypeName)
            console.log("🚀 ~ handleEmployeeAssign ~ employeeId:", employeeId)
            console.log("🚀 ~ handleEmployeeAssign ~ serviceId:", serviceId)
            console.log("🚀 ~ handleEmployeeAssign ~ orderId:", orderId)

            await assignToTechnicianByQA(orderId, serviceId, employeeId, workTypeName)

            const assignedTechResponse = await getAssignedTechnicianName(orderId, serviceId, workTypeName)
            const { technicianName, status } = assignedTechResponse.data

            const machineUpdatesResponse = await getMachineUpdates(employeeId, orderId, serviceId, workTypeName)
            console.log("🚀 ~ handleEmployeeAssign ~ machineUpdatesResponse:", machineUpdatesResponse)
            const { updatedService } = machineUpdatesResponse.data

            // Extract QA Test report numbers
            const qaWorkTypeDetail = updatedService.workTypeDetails?.find((wtd: any) => wtd.workType === workTypeName)
            const reportURLNumber = qaWorkTypeDetail?.QAtest?.reportULRNumber || 'N/A'
            console.log("🚀 ~ handleEmployeeAssign ~ reportURLNumber:", reportURLNumber)
            const qaTestReportNumber = qaWorkTypeDetail?.QAtest?.qaTestReportNumber || 'N/A'
            console.log("🚀 ~ handleEmployeeAssign ~ qaTestReportNumber:", qaTestReportNumber)
            const reportStatus = qaWorkTypeDetail?.QAtest?.reportStatus || 'pending'

            const newAssignments = {
                ...assignments,
                [workTypeId]: {
                    employeeId,
                    isAssigned: true,
                    technicianName,
                    assignmentStatus: status,
                    isReassigned: false,
                },
            }

            setAssignments((prev) => ({
                ...prev,
                [workTypeId]: {
                    ...prev[workTypeId],
                    employeeId,
                    isAssigned: true,
                    technicianName,
                    assignmentStatus: status,
                    isReassigned: false,
                },
            }))

            saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)

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
                                    reportURLNumber,
                                    qaTestReportNumber,
                                    reportStatus,
                                },
                            }
                            : wt,
                    ),
                })),
            )

            // Update reportNumbers
            setReportNumbers((prev) => {
                const updated = {
                    ...prev,
                    [parentService.id]: {
                        ...prev[parentService.id],
                        qatest: {
                            qaTestReportNumber: qaTestReportNumber,
                            reportULRNumber: reportURLNumber,
                            reportStatus,
                        },
                    },
                };
                saveToLocalStorage(STORAGE_KEYS.reportNumbers, updated);
                return updated;
            });

            // Removed the immediate refetch to avoid race condition where backend might not be updated yet

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

        if (assignments[workTypeId]?.isAssigned && !assignments[workTypeId]?.isReassigned) {
            alert("This work type is already assigned. Use 'Edit' or 'Reassign' to modify the assignment.")
            setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
            return
        }

        try {
            setAssigningStaff((prev) => ({ ...prev, [workTypeId]: true }))

            const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
            if (!workType) throw new Error("Work type not found")

            const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))
            if (!parentService) throw new Error("Parent service not found")

            const serviceId = workType.id.split("-")[0]
            const workTypeName = parentService.workTypeName || "Unknown Work Type";

            if (workType.name === "Elora") {
                await assignToOfficeStaffByElora(orderId, serviceId, staffId, workTypeName, status)
            } else if (status === "complete" || status === "generated" || status === "paid") {
                // Use completeStatusAndReport API with correct parameter order
                const res = await completeStatusAndReport(
                    staffId, // technicianId
                    orderId,
                    serviceId,
                    workTypeName, // mapped work type name
                    status,
                    {}, // payload - can be extended as needed
                    uploadedFiles[workTypeId], // file
                    workTypeName, // reportType
                )

                console.log("🚀 ~ handleStaffAssign ~ res?.data?.qaTestReportNumber:", res?.data?.qaTestReportNumber)
                console.log("🚀 ~ handleStaffAssign ~ res?.data?.reportULRNumber:", res?.data?.reportULRNumber)

                if (res?.data?.qaTestReportNumber && res?.data?.reportULRNumber) {
                    const identifier = res.data.reportFor;
                    setReportNumbers((prev) => {
                        const newReportNumbers = {
                            ...prev,
                            [parentService.id]: {
                                ...prev[parentService.id],
                                [identifier]: {
                                    qaTestReportNumber: res.data.qaTestReportNumber,
                                    reportULRNumber: res.data.reportULRNumber,
                                },
                            },
                        };
                        saveToLocalStorage(STORAGE_KEYS.reportNumbers, newReportNumbers);
                        return newReportNumbers;
                    });
                }
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
                    isReassigned: false, // Clear reassign flag after successful assignment
                },
            }))

            setSelectedStatuses((prev) => ({
                ...prev,
                [workTypeId]: status,
            }))

            // Save to localStorage
            const newAssignments = {
                ...assignments,
                [workTypeId]: { staffId, status, isAssigned: true, isReassigned: false }, // Clear reassign flag in localStorage
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

    const getWorkTypeIdentifier = (workTypeName: string): string => {
        const workTypeMap: { [key: string]: string } = {
            "Quality Assurance Test": "qatest",
            "QA Test": "qatest",
            "License for Operation": "elora",
            Elora: "elora",
        }
        return workTypeMap[workTypeName] || workTypeName.toLowerCase().replace(/\s+/g, "")
    }

    const fetchReportNumbers = async (parentService: any, workType: any) => {
        try {
            const workTypeIdentifier = getWorkTypeIdentifier(parentService.workTypeName)

            if (workTypeIdentifier !== "qatest" && workTypeIdentifier !== "elora") {
                console.log(
                    `[v0] Skipping report numbers for work type: ${parentService.workTypeName} (mapped to: ${workTypeIdentifier})`,
                )
                return
            }

            console.log(
                `[v0] Fetching report numbers for work type: ${parentService.workTypeName} (mapped to: ${workTypeIdentifier})`,
            )

            const response = await getReportNumbers(
                orderId,
                parentService.id,
                workType.assignedTechnicianId || "default-technician",
                workTypeIdentifier,
            )

            if (response?.data?.reportNumbers) {
                const reportData = response.data.reportNumbers[workTypeIdentifier]
                if (reportData) {
                    const newReportNumbers = {
                        ...reportNumbers,
                        [parentService.id]: {
                            ...reportNumbers[parentService.id],
                            [workTypeIdentifier]: reportData,
                        },
                    }
                    setReportNumbers(newReportNumbers)
                    saveToLocalStorage(STORAGE_KEYS.reportNumbers, newReportNumbers)
                    console.log(`[v0] Report numbers fetched and saved:`, reportData)
                }
            }
        } catch (error) {
            console.error(`[v0] Error fetching report numbers:`, error)
        }
    }

    // const handleStatusSave = async (workTypeId: string) => {
    //     const staffId = assignments[workTypeId]?.staffId
    //     const newStatus = selectedStatuses[workTypeId]
    //     const currentStatus = assignments[workTypeId]?.status || "pending"

    //     if (!staffId || !orderId || !newStatus) return

    //     const currentIndex = statusOptions.indexOf(currentStatus)
    //     const newIndex = statusOptions.indexOf(newStatus)
    //     const isReassigned = assignments[workTypeId]?.isReassigned

    //     if (!isReassigned && newIndex < currentIndex) {
    //         alert("Cannot go back to previous status!")
    //         return
    //     }

    //     if (isFileUploadMandatory(newStatus) && !uploadedFiles[workTypeId]) {
    //         alert("File upload is mandatory for complete status!")
    //         return
    //     }

    //     try {
    //         setAssigningStaff((prev) => ({ ...prev, [workTypeId]: true }))

    //         const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
    //         // console.log("🚀 ~ handleStatusSave ~ workType:", workType.name)
    //         if (!workType) throw new Error("Work type not found")
    //         // const repor
    //         const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))
    //         if (!parentService) throw new Error("Parent service not found")

    //         const serviceId = workType.id.split("-")[0]
    //         const workTypeName = parentService.workTypeName || "Unknown Work Type";

    //         if (newStatus === "complete" || newStatus === "generated" || newStatus === "paid") {
    //             const res = await completeStatusAndReport(
    //                 staffId, // technicianId
    //                 orderId,
    //                 serviceId,
    //                 workTypeName, // mapped work type name
    //                 newStatus,
    //                 {}, // payload
    //                 uploadedFiles[workTypeId], // file
    //                 workType.name, // reportType
    //             )

    //             console.log("🚀 ~ handleStatusSave ~ res?.data?.qaTestReportNumber:", res)
    //             // console.log("🚀 ~ handleStatusSave ~ res?.data?.reportULRNumber:", res?.data?.reportULRNumber)

    //             if (res?.data?.qaTestReportNumber && res?.data?.reportULRNumber) {
    //                 const identifier = res.data.reportFor;
    //                 setReportNumbers((prev) => {
    //                     const newReportNumbers = {
    //                         ...prev,
    //                         [parentService.id]: {
    //                             ...prev[parentService.id],
    //                             [identifier]: {
    //                                 qaTestReportNumber: res.data.qaTestReportNumber,
    //                                 reportULRNumber: res.data.reportULRNumber,
    //                             },
    //                         },
    //                     };
    //                     saveToLocalStorage(STORAGE_KEYS.reportNumbers, newReportNumbers);
    //                     return newReportNumbers;
    //                 });
    //             }
    //         } else {
    //             if (assignments[workTypeId]?.isAssigned && workType.name !== "Elora") {
    //                 await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, newStatus)
    //             } else if (workType.name === "Elora") {
    //                 await assignToOfficeStaffByElora(orderId, serviceId, staffId, workTypeName, newStatus)
    //             } else {
    //                 // This case should ideally not be hit if isAssigned is true, but as a fallback
    //                 await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, newStatus)
    //             }
    //         }

    //         const newAssignments = {
    //             ...assignments,
    //             [workTypeId]: {
    //                 ...assignments[workTypeId],
    //                 status: newStatus,
    //                 isReassigned: false, // Clear reassign flag after status change
    //             },
    //         }

    //         setAssignments(newAssignments)
    //         setSelectedStatuses((prev) => ({ ...prev, [workTypeId]: newStatus }))

    //         // Save to localStorage
    //         saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)
    //         saveToLocalStorage(STORAGE_KEYS.selectedStatuses, { ...selectedStatuses, [workTypeId]: newStatus })

    //         console.log("[v0] Status update successful:", { newStatus, workTypeName })
    //     } catch (error: any) {
    //         console.error("[v0] Status update failed:", error)
    //         alert(`Failed to update status: ${error.message}`)
    //     } finally {
    //         setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
    //     }
    // }




    // const handleStatusSave = async (workTypeId: string) => {
    //     const staffId = assignments[workTypeId]?.staffId
    //     const newStatus = selectedStatuses[workTypeId]
    //     const currentStatus = assignments[workTypeId]?.status || "pending"

    //     if (!staffId || !orderId || !newStatus) return

    //     const currentIndex = statusOptions.indexOf(currentStatus)
    //     const newIndex = statusOptions.indexOf(newStatus)
    //     const isReassigned = assignments[workTypeId]?.isReassigned

    //     if (!isReassigned && newIndex < currentIndex) {
    //         alert("Cannot go back to previous status!")
    //         return
    //     }

    //     if (isFileUploadMandatory(newStatus) && !uploadedFiles[workTypeId]) {
    //         alert("File upload is mandatory for complete status!")
    //         return
    //     }

    //     try {
    //         setAssigningStaff((prev) => ({ ...prev, [workTypeId]: true }))

    //         const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
    //         if (!workType) throw new Error("Work type not found")

    //         const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))
    //         if (!parentService) throw new Error("Parent service not found")

    //         const serviceId = workType.id.split("-")[0]
    //         const workTypeName = parentService.workTypeName || "Unknown Work Type";

    //         // For complete/generated/paid statuses, backend may return updated reportStatus
    //         if (newStatus === "complete" || newStatus === "generated" || newStatus === "paid") {
    //             const res = await completeStatusAndReport(
    //                 staffId, // technicianId
    //                 orderId,
    //                 serviceId,
    //                 workTypeName, // mapped work type name
    //                 newStatus,
    //                 {}, // payload
    //                 uploadedFiles[workTypeId], // file
    //                 workType.name, // reportType
    //             )

    //             if (res?.data?.reportStatus) {
    //                 // Save reportStatus instead of report numbers
    //                 const identifier = res.data.reportFor; // e.g., 'qatest'
    //                 setReportNumbers((prev) => {
    //                     const newReportStatus = {
    //                         ...prev,
    //                         [parentService.id]: {
    //                             ...prev[parentService.id],
    //                             [identifier]: {
    //                                 reportStatus: res.data.reportStatus
    //                             },
    //                         },
    //                     }
    //                     saveToLocalStorage(STORAGE_KEYS.reportNumbers, newReportStatus)
    //                     return newReportStatus
    //                 })
    //             }
    //         } else {
    //             if (assignments[workTypeId]?.isAssigned && workType.name !== "Elora") {
    //                 await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, newStatus)
    //             } else if (workType.name === "Elora") {
    //                 await assignToOfficeStaffByElora(orderId, serviceId, staffId, workTypeName, newStatus)
    //             } else {
    //                 await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, newStatus)
    //             }
    //         }

    //         const newAssignments = {
    //             ...assignments,
    //             [workTypeId]: {
    //                 ...assignments[workTypeId],
    //                 status: newStatus,
    //                 isReassigned: false,
    //             },
    //         }

    //         setAssignments(newAssignments)
    //         setSelectedStatuses((prev) => ({ ...prev, [workTypeId]: newStatus }))

    //         saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)
    //         saveToLocalStorage(STORAGE_KEYS.selectedStatuses, { ...selectedStatuses, [workTypeId]: newStatus })

    //         console.log("[v0] Status update successful:", { newStatus, workTypeName })
    //     } catch (error: any) {
    //         console.error("[v0] Status update failed:", error)
    //         alert(`Failed to update status: ${error.message}`)
    //     } finally {
    //         setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
    //     }
    // }
    // const handleStatusUpdate = (workTypeId: string, newStatus: string) => {
    //     if (isFileUploadMandatory(newStatus) && !uploadedFiles[workTypeId]) {
    //         alert("File upload is mandatory for complete status!")
    //         return
    //     }

    //     setSelectedStatuses((prev) => {
    //         const newStatuses = { ...prev, [workTypeId]: newStatus }
    //         saveToLocalStorage(STORAGE_KEYS.selectedStatuses, newStatuses)
    //         return newStatuses
    //     })
    //     setAssignments((prev) => {
    //         const newAssignments = {
    //             ...prev,
    //             [workTypeId]: { ...prev[workTypeId], status: newStatus },
    //         }
    //         saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)
    //         return newAssignments
    //     })
    // }
    // const handleFileUpload = (workTypeId: string, file: File) => {
    //     setUploadedFiles((prev) => {
    //         const newFiles = { ...prev, [workTypeId]: file }
    //         const fileNames = Object.entries(newFiles).reduce(
    //             (acc, [key, fileObj]) => {
    //                 acc[key] = fileObj?.name || null
    //                 return acc
    //             },
    //             {} as Record<string, string | null>,
    //         )
    //         saveToLocalStorage(STORAGE_KEYS.uploadedFileNames, fileNames)
    //         return newFiles
    //     })
    //     setAssignments((prev) => {
    //         const newAssignments = {
    //             ...prev,
    //             [workTypeId]: { ...prev[workTypeId], uploadedFile: file },
    //         }
    //         saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)
    //         return newAssignments
    //     })
    //     setTimeout(() => {
    //         handleStatusUpdate(workTypeId, "generated")
    //     }, 1000)
    // }




    const handleStatusSave = async (workTypeId: string) => {
        const staffId = assignments[workTypeId]?.staffId
        const newStatus = selectedStatuses[workTypeId]
        const currentStatus = assignments[workTypeId]?.status || "pending"

        if (!staffId || !orderId || !newStatus) return

        const currentIndex = statusOptions.indexOf(currentStatus)
        const newIndex = statusOptions.indexOf(newStatus)
        const isReassigned = assignments[workTypeId]?.isReassigned

        if (!isReassigned && newIndex < currentIndex) {
            showModal('Warning', "Cannot go back to previous status!");
            return
        }

        if (isFileUploadMandatory(newStatus) && !uploadedFiles[workTypeId]) {
            showModal('Warning', "File upload is mandatory for complete status!");
            return
        }

        try {
            setAssigningStaff((prev) => ({ ...prev, [workTypeId]: true }))

            const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
            if (!workType) throw new Error("Work type not found")

            const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))
            if (!parentService) throw new Error("Parent service not found")

            const serviceId = workType.id.split("-")[0]
            const workTypeName = parentService.workTypeName || "Unknown Work Type";

            // For complete/generated/paid statuses, backend may return updated reportStatus
            if (newStatus === "complete" || newStatus === "generated" || newStatus === "paid") {
                const res = await completeStatusAndReport(
                    staffId, // technicianId
                    orderId,
                    serviceId,
                    workTypeName, // mapped work type name
                    newStatus,
                    {}, // payload
                    uploadedFiles[workTypeId], // file
                    workType.name, // reportType
                )

                if (res?.data?.reportStatus) {
                    // Save reportStatus instead of report numbers
                    const identifier = res.data.reportFor; // e.g., 'qatest'
                    setReportNumbers((prev) => {
                        const newReportStatus = {
                            ...prev,
                            [parentService.id]: {
                                ...prev[parentService.id],
                                [identifier]: {
                                    reportStatus: res.data.reportStatus
                                },
                            },
                        }
                        saveToLocalStorage(STORAGE_KEYS.reportNumbers, newReportStatus)
                        return newReportStatus
                    })
                }
            } else {
                if (assignments[workTypeId]?.isAssigned && workType.name !== "Elora") {
                    await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, newStatus)
                } else if (workType.name === "Elora") {
                    await assignToOfficeStaffByElora(orderId, serviceId, staffId, workTypeName, newStatus)
                } else {
                    await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, newStatus)
                }
            }

            const newAssignments = {
                ...assignments,
                [workTypeId]: {
                    ...assignments[workTypeId],
                    status: newStatus,
                    isReassigned: false,
                },
            }

            setAssignments(newAssignments)
            setSelectedStatuses((prev) => ({ ...prev, [workTypeId]: newStatus }))

            saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)
            saveToLocalStorage(STORAGE_KEYS.selectedStatuses, { ...selectedStatuses, [workTypeId]: newStatus })

            console.log("[v0] Status update successful:", { newStatus, workTypeName })
        } catch (error: any) {
            console.error("[v0] Status update failed:", error)
            showModal('Error', `Failed to update status: ${error.message}`);
        } finally {
            setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
        }
    }


    const handleStatusUpdate = (workTypeId: string, newStatus: string) => {
        if (isFileUploadMandatory(newStatus) && !uploadedFiles[workTypeId]) {
            showModal('Warning', "File upload is mandatory for complete status!");
            return
        }

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

    const getFileTypeAndIcon = (url: string) => {
        const extension = url.split(".").pop()?.toLowerCase()
        switch (extension) {
            case "pdf":
                return { type: "PDF", icon: "📄", color: "text-red-600 bg-red-50 border-red-200" }
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "webp":
                return { type: "Image", icon: "🖼️", color: "text-green-600 bg-green-50 border-green-200" }
            case "doc":
            case "docx":
                return { type: "Word", icon: "📝", color: "text-blue-600 bg-blue-50 border-blue-200" }
            case "xls":
            case "xlsx":
                return { type: "Excel", icon: "📊", color: "text-emerald-600 bg-emerald-50 border-emerald-200" }
            default:
                return { type: "File", icon: "📁", color: "text-gray-600 bg-gray-50 border-gray-200" }
        }
    }

    const getFilenameFromUrl = (url: string) => {
        try {
            const urlParts = url.split("/")
            const filename = urlParts[urlParts.length - 1]
            // Remove timestamp prefix if present (e.g., "1757787332999-logo-sm.png" -> "logo-sm.png")
            return filename.replace(/^\d+-/, "")
        } catch {
            return "Unknown File"
        }
    }

    // const handleReassign = (workTypeId: string) => {
    //     const currentStatus = assignments[workTypeId]?.status || "pending"
    //     console.log("🚀 ~ handleReassign ~ currentStatus:", currentStatus)

    //     if (!canReassign(currentStatus)) {
    //         alert("Cannot reassign after complete status!")
    //         return
    //     }

    //     setAssignments((prev) => ({
    //         ...prev,
    //         [workTypeId]: {
    //             ...prev[workTypeId],
    //             isReassigned: true,
    //         },
    //     }))

    //     // Save to localStorage
    //     const newAssignments = {
    //         ...assignments,
    //         [workTypeId]: { ...assignments[workTypeId], isReassigned: true },
    //     }
    //     saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)
    // }

    const handleReassign = (workTypeId: string) => {
        const currentStatus = assignments[workTypeId]?.status || "pending"
        console.log("🚀 ~ handleReassign ~ currentStatus:", currentStatus)

        if (!canReassign(currentStatus)) {
            alert("Cannot reassign after complete status!")
            return
        }

        setAssignments((prev) => ({
            ...prev,
            [workTypeId]: {
                ...prev[workTypeId],
                isAssigned: false,
                isReassigned: true,
            },
        }))

        // Save to localStorage
        const newAssignments = {
            ...assignments,
            [workTypeId]: { ...assignments[workTypeId], isAssigned: false, isReassigned: true },
        }
        saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)
    }
    const handleFileEdit = async (workTypeId: string, fileType: "upload" | "view", fileIndex?: number) => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "*/*"

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            try {
                const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)

                if (!workType) {
                    alert("Work type not found")
                    return
                }

                const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))
                console.log("🚀 ~ handleFileEdit ~ parentService:", parentService)

                if (!parentService) {
                    alert("Parent service not found")
                    return
                }

                const uploadFile = fileType === "upload" ? file : null
                const viewFiles = fileType === "view" ? [file] : []

                // Get the assigned technician ID, fallback to empty string if not assigned
                const technicianId = assignments[workTypeId]?.employeeId || ""

                // Use the work type name instead of parent service work type name
                const workTypeName = parentService.workTypeName || ""
                console.log("🚀 ~ handleStaffAssign ~ workTypeName:", workTypeName)
                console.log("🚀 ~ handleStaffAssign ~ workTypeName:", workTypeName)
                const serviceId = workType.id.split("-")[0]
                console.log("[v0] editDocuments params:", {
                    orderId: orderId || "",
                    serviceId: serviceId || "",
                    technicianId,
                    workTypeName,
                    uploadFile: uploadFile?.name,
                    viewFiles: viewFiles.map((f) => f.name),
                })

                await editDocuments(orderId || "", serviceId || "", technicianId, workTypeName, uploadFile, viewFiles)

                alert("File updated successfully!")
                // Refresh data to show updated files
                fetchMachineData()
            } catch (error) {
                console.error("Error updating file:", error)
                alert("Failed to update file")
            }
        }
        input.click()
    }

    const handleDownloadFile = (fileUrl: string, fileName: string) => {
        // ✅ Always open in a fresh new tab
        window.open(fileUrl, "_blank");

        // ✅ Trigger download in the background
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        link.target = "_blank"; // ensures download doesn’t override the opened tab
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


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
                                                {workType.name === "QA Raw" && service.workTypeName === "Quality Assurance Test" && (
                                                    <div className="space-y-4">
                                                        {(!assignments[workType.id]?.isAssigned || assignments[workType.id]?.isReassigned) ? (
                                                            <div className="space-y-3">
                                                                <label className="block text-sm font-medium text-gray-700">
                                                                    {assignments[workType.id]?.isReassigned ? "Reassign Engineer" : "Assign Engineer"}
                                                                </label>
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
                                                                        {assigningTechnician[workType.id] ? "Assigning..." : (assignments[workType.id]?.isReassigned ? "Reassign" : "Assign")}
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

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="p-3 bg-white rounded-md border">
                                                                        <label className="text-xs text-gray-500">Report URL Number</label>
                                                                        <p className="font-medium">{workType.backendFields?.reportURLNumber || 'N/A'}</p>
                                                                    </div>
                                                                    <div className="p-3 bg-white rounded-md border">
                                                                        <label className="text-xs text-gray-500">QA Test Report Number</label>
                                                                        <p className="font-medium">{workType.backendFields?.qaTestReportNumber || 'N/A'}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleReassign(workType.id)}
                                                                        className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                                                    >
                                                                        <RefreshCw className="h-4 w-4" />
                                                                        Reassign
                                                                    </button>
                                                                </div>

                                                                <div className="mt-4 space-y-3">
                                                                    <h4 className="text-sm font-medium text-gray-700">Available Files</h4>

                                                                    {workType.backendFields?.viewFile && workType.backendFields.viewFile.length > 0 && (
                                                                        <div className="space-y-2">
                                                                            <h4 className="text-sm font-medium text-gray-700">Raw Files:</h4>
                                                                            <div className="grid gap-2">
                                                                                {workType.backendFields.viewFile.map((fileUrl, index) => {
                                                                                    const fileName =
                                                                                        fileUrl.split("/").pop()?.split("?")[0] || `File ${index + 1}`
                                                                                    const fileExtension = fileName.split(".").pop()?.toLowerCase()
                                                                                    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
                                                                                        fileExtension || "",
                                                                                    )

                                                                                    return (
                                                                                        <div
                                                                                            key={index}
                                                                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                                                                        >
                                                                                            <div className="flex items-center gap-3">
                                                                                                {isImage ? (
                                                                                                    <ImageIcon className="h-5 w-5 text-blue-600" />
                                                                                                ) : (
                                                                                                    <FileText className="h-5 w-5 text-red-600" />
                                                                                                )}
                                                                                                <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                                                                                                    {fileName}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex gap-2">
                                                                                                {/* <button
                                                                                                    // onClick={() => handleViewFile(fileUrl)}
                                                                                                    onClick={() => handleDownloadFile(fileUrl, fileName)}

                                                                                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                                                                                >
                                                                                                    <Eye className="h-3 w-3" />
                                                                                                    View
                                                                                                </button> */}
                                                                                                <button
                                                                                                    onClick={() => handleDownloadFile(fileUrl, fileName)}
                                                                                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                                                                                >
                                                                                                    <Download className="h-3 w-3" />
                                                                                                    Download
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={() => handleFileEdit(workType.id, "view", index)}
                                                                                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                                                                                >
                                                                                                    <Edit className="h-3 w-3" />
                                                                                                    Edit
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* {workType.backendFields?.uploadFile && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Upload File:</h4>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-red-600" />
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                                        {workType.backendFields.uploadFile.split("/").pop()?.split("?")[0] ||
                                            "Upload File"}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            workType.backendFields?.uploadFile &&
                                            handleViewFile(workType.backendFields.uploadFile)
                                        }
                                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                    >
                                        <Eye className="h-3 w-3" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleFileEdit(workType.id, "upload")}
                                        className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                    >
                                        <Download className="h-3 w-3" />
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleFileEdit(workType.id, "upload")}
                                        className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                    >
                                        <Edit className="h-3 w-3" />
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    )} */}
                                                                    {workType.backendFields?.uploadFile && (
                                                                        <div className="space-y-2">
                                                                            <h4 className="text-sm font-medium text-gray-700">Photos:</h4>
                                                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                                                <div className="flex items-center gap-3">
                                                                                    <FileText className="h-5 w-5 text-red-600" />
                                                                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                                                                                        {workType.backendFields.uploadFile.split("/").pop()?.split("?")[0] ||
                                                                                            "Upload File"}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                    {/* View button */}
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            workType.backendFields?.uploadFile &&
                                                                                            handleDownloadFile(
                                                                                                workType.backendFields.uploadFile,
                                                                                                workType.backendFields.uploadFile.split("/").pop()?.split("?")[0] ||
                                                                                                "file"
                                                                                            )
                                                                                        }
                                                                                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                                                                    >
                                                                                        <Eye className="h-3 w-3" />
                                                                                        View
                                                                                    </button>

                                                                                    {/* ✅ Fixed Download button */}
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            workType.backendFields?.uploadFile &&
                                                                                            handleDownloadFile(
                                                                                                workType.backendFields.uploadFile,
                                                                                                workType.backendFields.uploadFile.split("/").pop()?.split("?")[0] ||
                                                                                                "file"
                                                                                            )
                                                                                        }
                                                                                        className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                                                                    >
                                                                                        <Download className="h-3 w-3" />
                                                                                        Download
                                                                                    </button>

                                                                                    {/* Edit button */}
                                                                                    <button
                                                                                        onClick={() => handleFileEdit(workType.id, "upload")}
                                                                                        className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                                                                    >
                                                                                        <Edit className="h-3 w-3" />
                                                                                        Edit
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Show message when no files are available */}
                                                                    {(!workType.backendFields?.viewFile ||
                                                                        workType.backendFields.viewFile.length === 0) &&
                                                                        !workType.backendFields?.uploadFile && (
                                                                            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-center">
                                                                                <p className="text-sm text-gray-500">No files available</p>
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {workType.name === "QA Test" && service.workTypeName === "Quality Assurance Test" && (
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
                                                            <div className="space-y-3">
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
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleEditToggle(workType.id)}
                                                                            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                                                        >
                                                                            <Edit className="h-3 w-3" />
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleReassign(workType.id)}
                                                                            className="flex items-center gap-2 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                                                        >
                                                                            <RefreshCw className="h-3 w-3" />
                                                                            Reassign
                                                                        </button>
                                                                    </div>
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

                                                                {(selectedStatuses[workType.id] === "complete" || selectedStatuses[workType.id] === "generated") && (
                                                                    <div className="space-y-3 p-3 bg-green-50 rounded-md border border-green-200">
                                                                        <label className="block text-sm font-medium text-green-700">
                                                                            Upload File
                                                                        </label>
                                                                        <input
                                                                            type="file"
                                                                            required
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0]
                                                                                if (file) handleFileUpload(workType.id, file)
                                                                            }}
                                                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700"
                                                                        />

                                                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                                                            <div className="p-2 bg-white rounded border">
                                                                                <label className="text-xs text-gray-500">QA Test Report Status</label>

                                                                                <span
                                                                                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reportNumbers[service.id]?.qatest?.reportStatus || "pending")
                                                                                        }`}
                                                                                >
                                                                                    {reportNumbers[service.id]?.qatest?.reportStatus || "pending"}
                                                                                </span>
                                                                            </div>
                                                                            {/* <div className="p-2 bg-white rounded border">
                                                                                <label className="text-xs text-gray-500">Report ULR Number</label>
                                                                                <p className="font-medium text-sm">
                                                                                    {reportNumbers[service.id]?.qatest?.reportULRNumber || "N/A"}
                                                                                </p>
                                                                            </div> */}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* {uploadedFiles[workType.id] && assignments[workType.id]?.status === "complete" && (
                                                                    <div className="mt-4 space-y-3">
                                                                        <h4 className="font-medium text-gray-900">Verification Response from Technician</h4>
                                                                        <div className="space-y-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Verification Field 1"
                                                                                value={verificationResponses[workType.id]?.field1 || ""}
                                                                                onChange={(e) => {
                                                                                    const newResponses = {
                                                                                        ...verificationResponses,
                                                                                        [workType.id]: {
                                                                                            ...verificationResponses[workType.id],
                                                                                            field1: e.target.value,
                                                                                        },
                                                                                    }
                                                                                    setVerificationResponses(newResponses)
                                                                                    saveToLocalStorage(STORAGE_KEYS.verificationResponses, newResponses)
                                                                                }}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Verification Field 2"
                                                                                value={verificationResponses[workType.id]?.field2 || ""}
                                                                                onChange={(e) => {
                                                                                    const newResponses = {
                                                                                        ...verificationResponses,
                                                                                        [workType.id]: {
                                                                                            ...verificationResponses[workType.id],
                                                                                            field2: e.target.value,
                                                                                        },
                                                                                    }
                                                                                    setVerificationResponses(newResponses)
                                                                                    saveToLocalStorage(STORAGE_KEYS.verificationResponses, newResponses)
                                                                                }}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )} */}

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
                                                            <div className="space-y-3">
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
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleEditToggle(workType.id)}
                                                                            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                                                        >
                                                                            <Edit className="h-3 w-3" />
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleReassign(workType.id)}
                                                                            className="flex items-center gap-2 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                                                        >
                                                                            <RefreshCw className="h-3 w-3" />
                                                                            Reassign
                                                                        </button>
                                                                    </div>
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

                                                                {(selectedStatuses[workType.id] === "complete" ||
                                                                    selectedStatuses[workType.id] === "generated"
                                                                ) && (
                                                                        <div className="space-y-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                                                                            <label className="block text-sm font-medium text-blue-700">
                                                                                Upload File
                                                                            </label>
                                                                            <input
                                                                                type="file"
                                                                                required
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0]
                                                                                    if (file) handleFileUpload(workType.id, file)
                                                                                }}
                                                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                                                            />

                                                                            {/* <div className="grid grid-cols-2 gap-3 mt-3">
                                                                                <div className="p-2 bg-white rounded border">
                                                                                    <label className="text-xs text-gray-500">Elora Report Number</label>
                                                                                    <p className="font-medium text-sm">
                                                                                        {reportNumbers[service.id]?.elora?.qaTestReportNumber || "N/A"}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="p-2 bg-white rounded border">
                                                                                    <label className="text-xs text-gray-500">Report ULR Number</label>
                                                                                    <p className="font-medium text-sm">
                                                                                        {reportNumbers[service.id]?.elora?.reportULRNumber || "N/A"}
                                                                                    </p>
                                                                                </div>
                                                                            </div> */}
                                                                        </div>
                                                                    )}

                                                                {/* {uploadedFiles[workType.id] && assignments[workType.id]?.status === "complete" &s& (
                                                                    <div className="mt-4 space-y-3">
                                                                        <h4 className="font-medium text-gray-900">Verification Response from Technician</h4>
                                                                        <div className="space-y-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Verification Field 1"
                                                                                value={verificationResponses[workType.id]?.field1 || ""}
                                                                                onChange={(e) => {
                                                                                    const newResponses = {
                                                                                        ...verificationResponses,
                                                                                        [workType.id]: {
                                                                                            ...verificationResponses[workType.id],
                                                                                            field1: e.target.value,
                                                                                        },
                                                                                    }
                                                                                    setVerificationResponses(newResponses)
                                                                                    saveToLocalStorage(STORAGE_KEYS.verificationResponses, newResponses)
                                                                                }}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Verification Field 2"
                                                                                value={verificationResponses[workType.id]?.field2 || ""}
                                                                                onChange={(e) => {
                                                                                    const newResponses = {
                                                                                        ...verificationResponses,
                                                                                        [workType.id]: {
                                                                                            ...verificationResponses[workType.id],
                                                                                            field2: e.target.value,
                                                                                        },
                                                                                    }
                                                                                    setVerificationResponses(newResponses)
                                                                                    saveToLocalStorage(STORAGE_KEYS.verificationResponses, newResponses)
                                                                                }}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )} */}

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
            <ConfirmModal
                open={modalOpen}
                onClose={hideModal}
                title={modalTitle}
                message={modalMessage}
            />
        </div>
    )
}