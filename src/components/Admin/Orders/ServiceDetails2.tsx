import React, { useState, useEffect } from "react"
import Swal from 'sweetalert2';
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

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
    Trash2,
    Plus,
} from "lucide-react"
import { getAssignedStaffName, getMachineDetails, deleteMachineFromOrder, getCustomerFeedbackByOrderId } from "../../../api"
import {
    getActiveTechnicians,
    getActiveStaffs,
    assignToTechnicianByQA,
    getAssignedTechnicianName,
    getMachineUpdates,
    assignToOfficeStaff,
    completeStatusAndReport,
    editDocuments,
    getReportNumbers,
    assignToOfficeStaffByElora,
    updateServicePrice,
    getAllActiveEmployees,
    getAllManufacturer,
} from "../../../api"
import { useNavigate } from "react-router-dom";
import AddMachineModal from "./AddMachineModal";

const showMessage = (msg = '', type = 'success') => {
    const toast: any = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 4000,
        customClass: { container: 'toast' },
    });
    toast.fire({
        icon: type,
        title: msg,
        padding: '10px 20px',
    });
};

const statusOptions = ["pending", "in progress", "complete", "generated", "paid"]

const isQAWorkType = (workTypeName: string) => {
    return workTypeName === "Quality Assurance Test" || workTypeName === "Quality assurance testing";
}

const getFilteredStatusOptions = (workTypeName: string) => {
    if (isQAWorkType(workTypeName)) {
        return statusOptions;
    }
    return statusOptions.filter(status => status !== "generated" && status !== "paid");
}

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
        completedAt?: string
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
            verificationRemark: any
            assignedAtEngineer?: string | undefined;  // For QA Raw
            assignedAtStaff?: string | undefined    // For QA Test
            createdAt: string
            workOrderCopy?: string | null
            partyCodeOrSysId?: string | null
            procNoOrPoNo?: string | null
            procExpiryDate?: string | null
        }
        reportUrl: any
        qaTestSubmittedAt?: string
        reportNumber?: string
        urlNumber?: string
        assignedTechnicianName?: string
        assignedTechnicianId?: string
        assignedStaffName?: string
        assignedStaffId?: string
        assignmentStatus?: string
        serviceId?: string
        assignedAtEngineer?: string | undefined
        assignedAtStaff?: string | undefined
        statusHistory?: Array<{
            oldStatus: string
            newStatus: string
            updatedBy: {
                _id: string
                name: string
            }
            updatedAt: string
            remark?: string
        }>
        workOrderCopy?: string | null
        partyCodeOrSysId?: string | null
        procNoOrPoNo?: string | null
        procExpiryDate?: string | null
        formattedProcExpiryDate?: string | null
    }>
    rawPhoto?: string[]
    workOrderCopy?: string | null
    partyCodeOrSysId?: string | null
    procNoOrPoNo?: string | null
    procExpiryDate?: string | null
    formattedProcExpiryDate?: string | null
    price?: any
}

interface ServicesCardProps {
    orderId?: any
}

interface AdditionalServiceItem {
    name: string
    description?: string
    totalAmount?: number | string
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
const formatDate = (isoString?: string): string => {
    if (!isoString) return "Not assigned yet";
    return new Date(isoString).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
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
                staffName?: string
            }
        >
    >({})
    const [selectedEmployees, setSelectedEmployees] = useState<Record<string, string>>({})
    const [selectedStaff, setSelectedStaff] = useState<Record<string, string>>({})
    const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({})
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
    const [assignedStaffData, setAssignedStaffData] = useState<Record<string, any>>({});
    const [loadingAssignments, setLoadingAssignments] = useState(true)
    const [addMachineModalOpen, setAddMachineModalOpen] = useState(false)
    const [deletingMachineId, setDeletingMachineId] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
    const [employees, setEmployees] = useState<any[]>([])
    const [manufacturers, setManufacturers] = useState<any[]>([])
    const [leadOwnerId, setLeadOwnerId] = useState<string | null>(null)
    const [customerFeedback, setCustomerFeedback] = useState<string>("")
    const [additionalServices, setAdditionalServices] = useState<AdditionalServiceItem[]>([])

    type ReportData = {
        qaTestReportNumber: string;
        reportULRNumber: string;
        reportStatus: string;
        reportUrl?: any;
        remark?: any
    };

    const [reportNumbers, setReportNumbers] = useState<Record<
        string,
        { qatest?: ReportData; elora?: ReportData }
    >>({});

    const showModal = (title: string, message: string) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
    };

    const hideModal = () => {
        setModalOpen(false);
    };

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
            const [techniciansData, staffData, employeesData, manufacturersData] = await Promise.all([
                getActiveTechnicians(),
                getActiveStaffs(),
                getAllActiveEmployees(),
                getAllManufacturer()
            ])

            setTechnicians(techniciansData.data || [])
            setOfficeStaff(staffData.data || [])
            setEmployees(employeesData.data || [])
            const manufacturerList =
                Array.isArray(manufacturersData?.data?.data)
                    ? manufacturersData.data.data
                    : Array.isArray(manufacturersData?.data)
                        ? manufacturersData.data
                        : [];
            setManufacturers(manufacturerList)
        } catch (error) {
            console.error("Error fetching dropdown data:", error)
            setTechnicians([])
            setOfficeStaff([])
            setManufacturers([])
        } finally {
            setLoadingDropdowns(false)
        }
    }
    const navigate = useNavigate();

    // Get current user from JWT (for staff: disable assign when not assigned to them)
    useEffect(() => {
        const token = Cookies.get("accessToken");
        if (token) {
            try {
                const decoded: { id?: string; role?: string } = jwtDecode(token);
                setCurrentUserId(decoded.id || null);
                setCurrentUserRole(decoded.role || null);
            } catch {
                setCurrentUserId(null);
                setCurrentUserRole(null);
            }
        }
    }, []);

    const canAssignQARaw = (workType: { assignedTechnicianId?: string }, parentService: MachineData) => {
        if (currentUserRole === "admin") return true;

        // If the logged-in user is the QA Test staff for this service, allow them to edit QA Raw as well
        const qaTestWorkType = parentService.workTypes.find((wt: any) => wt.name === "QA Test");
        const isAssignedQATestStaff =
            qaTestWorkType &&
            qaTestWorkType.assignedStaffId &&
            currentUserId &&
            qaTestWorkType.assignedStaffId === currentUserId;

        if (isAssignedQATestStaff) {
            return true;
        }

        // Technicians / employees (or staff used for technicians) can manage QA Raw when it's unassigned or assigned to them
        if (currentUserRole === "Technician" || currentUserRole === "Employee" || currentUserRole === "staff") {
            return !workType.assignedTechnicianId || workType.assignedTechnicianId === currentUserId;
        }

        return false;
    };

    const canAssignQATest = (workType: { assignedStaffId?: string }) => {
        if (currentUserRole === "admin") return true;
        if (currentUserRole === "staff" || currentUserRole === "office-staff") {
            return !workType.assignedStaffId || workType.assignedStaffId === currentUserId;
        }
        return true;
    };

    const fetchMachineData = async () => {
        if (!orderId) {
            setError("Order ID is required");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await getMachineDetails(orderId);
            const extraServices = Array.isArray(response.additionalServices) ? response.additionalServices : [];
            setAdditionalServices(extraServices);

            // Access leadOwner and services from the new response structure
            const machinesArray = Array.isArray(response.services) ? response.services : [];
            setLeadOwnerId(response.leadOwner || null);

            if (!machinesArray || machinesArray.length === 0) {
                throw new Error("No machine data found");
            }

            const allTransformedData: MachineData[] = [];
            const staffAssignments: Record<string, any> = {};
            const initialAssignments: Record<string, any> = {};
            const initialSelectedStatuses: Record<string, string> = {};

            machinesArray.forEach((machineData: any) => {
                const workTypeDetails = machineData.workTypeDetails || [];
                // Store machineData for later use in navigation
                const machineDataRef = machineData;
                const transformedData: MachineData[] = workTypeDetails.map(
                    (workTypeDetail: any, index: number) => {
                        const createWorkTypes = () => {
                            const workTypes = [];
                            const cardId = `${machineData._id}-${index}`;

                            // ✅ Store common fields from machineData
                            const commonFields = {
                                workOrderCopy: machineData.workOrderCopy || null,
                                partyCodeOrSysId: machineData.partyCodeOrSysId || null,
                                procNoOrPoNo: machineData.procNoOrPoNo || null,
                                procExpiryDate: machineData.procExpiryDate || null,
                                formattedProcExpiryDate: machineData.formattedProcExpiryDate || null,
                            };

                            if (workTypeDetail.workType === "Quality Assurance Test") {
                                // ---- QA Raw ----
                                workTypes.push({
                                    id: `${cardId}-qa-raw`,
                                    name: "QA Raw",
                                    description: "",
                                    backendFields: {
                                        serialNo: machineData.serialNumber || machineData.equipmentNo || "N/A",
                                        modelName: machineData.machineModel || "N/A",
                                        remark: machineData.remark || "N/A",
                                        fileUrl: workTypeDetail.viewFile?.[0] || "",
                                        imageUrl: workTypeDetail.viewFile?.[1] || "",
                                        uploadFile: workTypeDetail.uploadFile || "",
                                        viewFile: workTypeDetail.viewFile || [],
                                        reportURLNumber: workTypeDetail.QAtest?.reportULRNumber || "N/A",
                                        qaTestReportNumber: workTypeDetail.QAtest?.qaTestReportNumber || "N/A",
                                        reportStatus: workTypeDetail.QAtest?.reportStatus || "pending",
                                        verificationRemark: workTypeDetail.QAtest?.remark || "",
                                        // ✅ Include the common fields
                                        workOrderCopy: machineData.workOrderCopy || null,
                                        partyCodeOrSysId: machineData.partyCodeOrSysId || null,
                                        procNoOrPoNo: machineData.procNoOrPoNo || null,
                                        procExpiryDate: machineData.procExpiryDate || null,
                                        formattedProcExpiryDate: machineData.formattedProcExpiryDate || null,
                                    },
                                    serviceId: machineData._id,
                                    assignedTechnicianId: workTypeDetail.engineer?._id || workTypeDetail.engineer || undefined,
                                    assignedTechnicianName: workTypeDetail.engineer?.name,
                                    assignmentStatus: workTypeDetail.engineer?.status,
                                    assignedAtEngineer: workTypeDetail.assignedAt || undefined,
                                    // ✅ Also include at workType level for easier access
                                    ...commonFields,
                                });

                                // ✅ Save assigned Technician
                                const eng = workTypeDetail.engineer;
                                if (eng) {
                                    staffAssignments[`${cardId}-qa-raw`] = {
                                        type: "Technician",
                                        id: eng._id || eng,
                                    };
                                    initialAssignments[`${cardId}-qa-raw`] = {
                                        isAssigned: true,
                                        employeeId: eng._id || eng,
                                        technicianName: eng.name || "",
                                        assignmentStatus: workTypeDetail.status
                                    };
                                    initialSelectedStatuses[`${cardId}-qa-raw`] = workTypeDetail.status || "pending";
                                }

                                // ---- QA Test ----
                                const qaTestStaff = workTypeDetail.QAtest?.officeStaff;
                                workTypes.push({
                                    id: `${cardId}-qa-test`,
                                    name: "QA Test",
                                    description: "",
                                    reportNumber: "N/A",
                                    urlNumber: "N/A",
                                    serviceId: machineData._id,
                                    assignedStaffId: qaTestStaff?._id || qaTestStaff || undefined,
                                    assignedStaffName: qaTestStaff?.name,
                                    assignmentStatus: qaTestStaff?.status,
                                    assignedAtStaff: workTypeDetail.QAtest?.assignedAt,
                                    completedAt: workTypeDetail.completedAt || undefined,
                                    statusHistory: workTypeDetail.QAtest?.statusHistory || workTypeDetail.statusHistory || [],
                                    qaTestSubmittedAt: workTypeDetail.QAtest?.qatestSubmittedAt || undefined,
                                    // ✅ Include the common fields for QA Test too
                                    ...commonFields,
                                });

                                // ✅ Save assigned Office Staff for QA Test
                                if (qaTestStaff) {
                                    staffAssignments[`${cardId}-qa-test`] = {
                                        type: "Office Staff",
                                        id: (qaTestStaff && qaTestStaff._id) || qaTestStaff,
                                    };
                                    initialAssignments[`${cardId}-qa-test`] = {
                                        isAssigned: true,
                                        staffId: (qaTestStaff && qaTestStaff._id) || qaTestStaff,
                                        staffName: (qaTestStaff && qaTestStaff.name) || "",
                                        status: workTypeDetail.QAtest?.status
                                    };
                                    initialSelectedStatuses[`${cardId}-qa-test`] = workTypeDetail.QAtest?.status || "pending";
                                }
                            } else {
                                // ---- Other Work Types ----
                                const customId = workTypeDetail.workType
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, "-");

                                workTypes.push({
                                    id: `${cardId}-${customId}`,
                                    name: workTypeDetail.workType,
                                    description: "",
                                    reportNumber: "N/A",
                                    urlNumber: "N/A",
                                    serviceId: machineData._id,
                                    assignedStaffId: workTypeDetail.elora?.officeStaff?._id || undefined,
                                    assignedStaffName: workTypeDetail.elora?.officeStaff?.name,
                                    assignmentStatus: workTypeDetail.elora?.officeStaff?.status,
                                    // ✅ Include the common fields for other work types
                                    ...commonFields,
                                });


                                // ✅ Save Elora (or any other office staff)
                                const eloraStaff = workTypeDetail.elora?.officeStaff;
                                if (eloraStaff) {
                                    staffAssignments[`${cardId}-${customId}`] = {
                                        type: "Elora",
                                        id: (eloraStaff && eloraStaff._id) || eloraStaff,
                                    };
                                    initialAssignments[`${cardId}-${customId}`] = {
                                        isAssigned: true,
                                        staffId: (eloraStaff && eloraStaff._id) || eloraStaff,
                                        staffName: (eloraStaff && eloraStaff.name) || "",
                                        status: workTypeDetail.status
                                    };
                                    initialSelectedStatuses[`${cardId}-${customId}`] = workTypeDetail.status || "pending";
                                }
                            }
                            return workTypes;
                        };

                        return {
                            id: `${machineData._id}-${index}`,
                            machineType: machineData.machineType || "Unknown Machine",
                            equipmentId: machineData.equipmentNo || "N/A",
                            workTypeName: workTypeDetail.workType || "General Work",
                            status: workTypeDetail.status || "pending",
                            workTypes: createWorkTypes(),
                            rawPhoto: machineData.rawPhoto || [],
                            price: machineData.price || null,
                            partyCodeOrSysId: machineData.partyCodeOrSysId || null,
                            procNoOrPoNo: machineData.procNoOrPoNo || null,
                            procExpiryDate: machineData.procExpiryDate || null,
                            formattedProcExpiryDate: machineData.formattedProcExpiryDate || null,
                            workOrderCopy: machineData.workOrderCopy || null,
                        };
                    }
                );
                allTransformedData.push(...transformedData);
            });

            // ✅ Store the staff assignments in React state AND localStorage
            setAssignedStaffData(staffAssignments);
            // console.log("✅ Assigned Staff Data:", staffAssignments);

            // Save to localStorage immediately
            saveToLocalStorage(`assignedStaffData_${orderId}`, staffAssignments);

            // ------------------------
            // Machine Data + Reports
            // ------------------------
            setMachineData(allTransformedData);

            // Initialize report numbers with proper remark handling
            setReportNumbers((prevReportNumbers) => {
                const mergedReportNumbers = { ...prevReportNumbers };

                allTransformedData.forEach((service) => {
                    if (!mergedReportNumbers[service.id]) {
                        mergedReportNumbers[service.id] = {};
                    }

                    if (service.workTypeName === "Quality Assurance Test") {
                        const qaRawWorkType = service.workTypes.find(
                            (wt) => wt.name === "QA Raw"
                        );

                        if (qaRawWorkType && qaRawWorkType.backendFields) {
                            const currentQatest = mergedReportNumbers[service.id]?.qatest || {
                                qaTestReportNumber: "N/A",
                                reportULRNumber: "N/A",
                                reportStatus: "pending",
                                reportUrl: undefined,
                                remark: "",
                            };

                            const updatedQatest: ReportData = {
                                ...currentQatest,
                                reportStatus:
                                    qaRawWorkType.backendFields.reportStatus ||
                                    currentQatest.reportStatus ||
                                    "pending",
                                qaTestReportNumber:
                                    qaRawWorkType.backendFields.qaTestReportNumber ||
                                    currentQatest.qaTestReportNumber ||
                                    "N/A",
                                reportULRNumber:
                                    qaRawWorkType.backendFields.reportURLNumber ||
                                    currentQatest.reportULRNumber ||
                                    "N/A",
                                remark:
                                    qaRawWorkType.backendFields.verificationRemark ||
                                    currentQatest.remark ||
                                    "",
                            };

                            mergedReportNumbers[service.id].qatest = updatedQatest;
                        }
                    }

                    // Handle other work types (elora)
                    const otherWorkTypes = service.workTypes.filter(wt =>
                        wt.name !== "QA Raw" && wt.name !== "QA Test"
                    );

                    if (otherWorkTypes.length > 0) {
                        const workTypeIdentifier = getWorkTypeIdentifier(service.workTypeName);
                        if (!mergedReportNumbers[service.id][workTypeIdentifier]) {
                            mergedReportNumbers[service.id][workTypeIdentifier] = {
                                qaTestReportNumber: "N/A",
                                reportULRNumber: "N/A",
                                reportStatus: "pending",
                                reportUrl: undefined,
                                remark: "",
                            };
                        }
                    }
                });

                saveToLocalStorage(STORAGE_KEYS.reportNumbers, mergedReportNumbers);
                return mergedReportNumbers;
            });

            const updatedMachineDataWithAssignments = allTransformedData;

            // ------------------------
            // Enhanced Report Numbers Fetch with better error handling
            // ------------------------
            const fetchAllReportNumbers = async () => {
                const reportPromises = [];

                for (const service of updatedMachineDataWithAssignments) {
                    const workTypeIdentifier = getWorkTypeIdentifier(service.workTypeName);
                    if (!["qatest", "elora"].includes(workTypeIdentifier)) continue;

                    let assigneeId: string = "";
                    let targetWorkType;

                    if (workTypeIdentifier === "qatest") {
                        targetWorkType = service.workTypes.find(
                            (wt) => wt.name === "QA Raw"
                        );
                        assigneeId = targetWorkType?.assignedTechnicianId ||
                            targetWorkType?.assignedStaffId ||
                            "";
                    } else {
                        targetWorkType = service.workTypes.find((wt) =>
                            wt.name.toLowerCase().includes("elora")
                        ) || service.workTypes[0];
                        assigneeId = targetWorkType?.assignedStaffId || "";
                    }

                    if (!assigneeId) {
                        // console.log(`No assignee found for service ${service.id}, skipping report fetch`);
                        continue;
                    }

                    reportPromises.push(
                        getReportNumbers(
                            orderId,
                            service.id,
                            assigneeId,
                            workTypeIdentifier
                        )
                            .then((response) => {
                                if (response?.data?.reportNumbers?.[workTypeIdentifier]) {
                                    const reportData = response.data.reportNumbers[workTypeIdentifier];
                                    // console.log(`📊 Report data for ${service.id}-${workTypeIdentifier}:`, reportData);

                                    return { serviceId: service.id, identifier: workTypeIdentifier, reportData };
                                }
                                return null;
                            })
                            .catch((error) => {
                                console.error(
                                    `Error fetching report numbers for ${service.id}:`,
                                    error
                                );
                                return null;
                            })
                    );
                }

                // Process all report promises
                const reportResults = await Promise.all(reportPromises);

                setReportNumbers((prev) => {
                    const updated = { ...prev };

                    reportResults.forEach((result) => {
                        if (!result) return;

                        const { serviceId, identifier, reportData } = result;
                        const current = updated[serviceId] || {};
                        const currentReport = current[identifier] || {
                            qaTestReportNumber: "N/A",
                            reportULRNumber: "N/A",
                            reportStatus: "pending",
                            reportUrl: undefined,
                            remark: "",
                        };

                        const updatedReport: ReportData = {
                            qaTestReportNumber:
                                reportData.qaTestReportNumber ||
                                currentReport.qaTestReportNumber ||
                                "N/A",
                            reportULRNumber:
                                reportData.reportULRNumber ||
                                currentReport.reportULRNumber ||
                                "N/A",
                            reportStatus:
                                reportData.reportStatus ||
                                currentReport.reportStatus ||
                                "pending",
                            reportUrl:
                                reportData.report ||
                                currentReport.reportUrl,
                            remark:
                                reportData.remark || // Ensure remark is always captured
                                currentReport.remark ||
                                "",
                        };

                        if (!updated[serviceId]) {
                            updated[serviceId] = {};
                        }
                        updated[serviceId][identifier] = updatedReport;
                    });

                    saveToLocalStorage(STORAGE_KEYS.reportNumbers, updated);
                    // console.log("📊 Final report numbers after fetch:", updated);
                    return updated;
                });
            };

            await fetchAllReportNumbers();

            // Save new assignments
            setAssignments(initialAssignments);
            saveToLocalStorage(STORAGE_KEYS.assignments, initialAssignments);

            // Save new statuses
            setSelectedStatuses(initialSelectedStatuses);
            saveToLocalStorage(STORAGE_KEYS.selectedStatuses, initialSelectedStatuses);

        } catch (err: any) {
            console.error("Error fetching machine data:", err);
            setError(err.message || "Failed to fetch machine data");
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerFeedback = async () => {
        if (!orderId) return;
        try {
            const response = await getCustomerFeedbackByOrderId(orderId);
            setCustomerFeedback(response?.customerFeedback || "");
        } catch (err) {
            setCustomerFeedback("");
        }
    };

    useEffect(() => {
        if (Object.keys(assignedStaffData).length > 0 && (technicians.length > 0 || officeStaff.length > 0)) {
            const newAssignments: Record<string, any> = {};
            const newSelectedEmployees: Record<string, string> = {};
            const newSelectedStaff: Record<string, string> = {};

            Object.entries(assignedStaffData).forEach(([workTypeId, assignment]) => {
                if (assignment.id) {
                    if (assignment.type === "Technician") {
                        const tech = technicians.find(t => t._id === assignment.id);
                        if (tech) {
                            newAssignments[workTypeId] = {
                                isAssigned: true,
                                employeeId: assignment.id,
                                technicianName: tech.name,
                                assignmentStatus: "assigned"
                            };
                            newSelectedEmployees[workTypeId] = assignment.id;
                        }
                    } else if (assignment.type === "Office Staff" || assignment.type === "Elora") {
                        const staff = officeStaff.find(s => s._id === assignment.id);
                        if (staff) {
                            newAssignments[workTypeId] = {
                                isAssigned: true,
                                staffId: assignment.id,
                                staffName: staff.name,
                                status: "assigned"
                            };
                            newSelectedStaff[workTypeId] = assignment.id;
                        }
                    }
                }
            });

            // Only update if we found assignments
            if (Object.keys(newAssignments).length > 0) {
                setAssignments(prev => ({ ...prev, ...newAssignments }));
                setSelectedEmployees(prev => ({ ...prev, ...newSelectedEmployees }));
                setSelectedStaff(prev => ({ ...prev, ...newSelectedStaff }));

                // Also save to localStorage
                saveToLocalStorage(STORAGE_KEYS.assignments, {
                    ...loadFromLocalStorage(STORAGE_KEYS.assignments, {}),
                    ...newAssignments
                });
                saveToLocalStorage(STORAGE_KEYS.selectedEmployees, {
                    ...loadFromLocalStorage(STORAGE_KEYS.selectedEmployees, {}),
                    ...newSelectedEmployees
                });
                saveToLocalStorage(STORAGE_KEYS.selectedStaff, {
                    ...loadFromLocalStorage(STORAGE_KEYS.selectedStaff, {}),
                    ...newSelectedStaff
                });
            }
        }
    }, [assignedStaffData, technicians, officeStaff]);

    // Update machineData with assignment names when technicians load
    useEffect(() => {
        if (machineData.length > 0 && technicians.length > 0 && !loadingDropdowns) {
            const newAssignments = { ...assignments };
            const newSelectedEmployees = { ...selectedEmployees };
            let updated = false;

            machineData.forEach((service) => {
                service.workTypes.forEach((workType) => {
                    if (
                        workType.name === "QA Raw" &&
                        workType.assignedTechnicianId &&
                        !newAssignments[workType.id]?.employeeId
                    ) {
                        const tech = technicians.find((t) => t._id === workType.assignedTechnicianId);
                        if (tech) {
                            newAssignments[workType.id] = {
                                isAssigned: true,
                                employeeId: workType.assignedTechnicianId,
                                technicianName: tech.name,
                            };
                            newSelectedEmployees[workType.id] = workType.assignedTechnicianId;
                            updated = true;
                        }
                    }
                });
            });

            if (updated) {
                setAssignments(newAssignments);
                setSelectedEmployees(newSelectedEmployees);
                saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments);
                saveToLocalStorage(STORAGE_KEYS.selectedEmployees, newSelectedEmployees);

                setMachineData((prev) =>
                    prev.map((s) => ({
                        ...s,
                        workTypes: s.workTypes.map((wt) => {
                            if (wt.name === "QA Raw" && wt.assignedTechnicianId) {
                                const tech = technicians.find((t) => t._id === wt.assignedTechnicianId);
                                return tech ? { ...wt, assignedTechnicianName: tech.name } : wt;
                            }
                            return wt;
                        }),
                    }))
                );
            }
        }
    }, [machineData, technicians, loadingDropdowns, assignments]);

    // Main initialization useEffect
    // useEffect(() => {
    //     const loadedExpandedItems = loadFromLocalStorage(STORAGE_KEYS.expandedItems, [])
    //     const loadedSelectedStatuses = loadFromLocalStorage(STORAGE_KEYS.selectedStatuses, {})
    //     const loadedFileNames = loadFromLocalStorage(STORAGE_KEYS.uploadedFileNames, {})
    //     const loadedReportNumbers = loadFromLocalStorage(STORAGE_KEYS.reportNumbers, {})
    //     const loadedAssignments = loadFromLocalStorage(STORAGE_KEYS.assignments, {})
    //     const savedVerificationResponses = loadFromLocalStorage(STORAGE_KEYS.verificationResponses, {})

    //     setExpandedItems(loadedExpandedItems)
    //     setSelectedStatuses(loadedSelectedStatuses)
    //     setReportNumbers(loadedReportNumbers)
    //     setAssignments(loadedAssignments)
    //     setVerificationResponses(savedVerificationResponses)

    //     const mockFiles: Record<string, File | undefined> = {}
    //     Object.entries(loadedFileNames).forEach(([key, fileName]) => {
    //         if (fileName) {
    //             mockFiles[key] = new File([""], fileName as string, { type: "application/octet-stream" })
    //         }
    //     })
    //     setUploadedFiles(mockFiles)

    //     fetchMachineData()
    //     fetchDropdownData()
    // }, [orderId])

    // Main initialization useEffect
    useEffect(() => {
        const loadedExpandedItems = loadFromLocalStorage(STORAGE_KEYS.expandedItems, [])
        const loadedSelectedStatuses = loadFromLocalStorage(STORAGE_KEYS.selectedStatuses, {})
        const loadedFileNames = loadFromLocalStorage(STORAGE_KEYS.uploadedFileNames, {})
        const loadedReportNumbers = loadFromLocalStorage(STORAGE_KEYS.reportNumbers, {})
        const loadedAssignments = loadFromLocalStorage(STORAGE_KEYS.assignments, {})
        const savedVerificationResponses = loadFromLocalStorage(STORAGE_KEYS.verificationResponses, {})

        // Load assigned staff data from localStorage
        const loadedAssignedStaffData = loadFromLocalStorage(`assignedStaffData_${orderId}`, {})
        setAssignedStaffData(loadedAssignedStaffData)

        setExpandedItems(loadedExpandedItems)
        setSelectedStatuses(loadedSelectedStatuses)
        setReportNumbers(loadedReportNumbers)
        setAssignments(loadedAssignments)
        setVerificationResponses(savedVerificationResponses)

        const mockFiles: Record<string, File | undefined> = {}
        Object.entries(loadedFileNames).forEach(([key, fileName]) => {
            if (fileName) {
                mockFiles[key] = new File([""], fileName as string, { type: "application/octet-stream" })
            }
        })
        setUploadedFiles(mockFiles)

        fetchMachineData()
        fetchDropdownData()
        fetchCustomerFeedback()
    }, [orderId])

    const handleViewFile = (workTypeId: string) => {
        const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
        const fileUrl = workType?.backendFields?.fileUrl
        if (fileUrl && fileUrl !== "") {
            window.open(fileUrl, "_blank")
        } else {
            showMessage("No file available to view", 'warning')
        }
    }

    const handleViewReport = (serviceId: string, identifier: 'qatest' | 'elora' = 'qatest') => {
        const reportUrl = reportNumbers[serviceId]?.[identifier]?.reportUrl;
        if (reportUrl && reportUrl !== '') {
            window.open(reportUrl, "_blank");
        } else {
            showMessage("No report available to view", 'warning')
        }
    };

    const handleViewImage = (workTypeId: string) => {
        const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
        const imageUrl = workType?.backendFields?.imageUrl
        if (imageUrl && imageUrl !== "") {
            window.open(imageUrl, "_blank")
        } else {
            const service = machineData.find((s) => s.workTypes.some((wt) => wt.id === workTypeId))
            if (service && service.rawPhoto && service.rawPhoto.length > 0) {
                window.open(service.rawPhoto[0], "_blank")
            } else {
                showMessage("No image available to view", 'warning')
            }
        }
    }

    const handleDownload = (workTypeId: string) => {
        const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
        const fileUrl = workType?.backendFields?.fileUrl
        if (fileUrl && fileUrl !== "") {
            const link = document.createElement("a")
            link.href = fileUrl
            link.download = `file-${workTypeId}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } else {
            showMessage("No file available to download", 'warning')
        }
    }

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

    const getAvailableStatuses = (currentStatus: string, workTypeName: string, isReassigned = false) => {
        const filteredOptions = getFilteredStatusOptions(workTypeName)
        if (isReassigned) {
            return filteredOptions
        }
        const currentIndex = filteredOptions.indexOf(currentStatus)
        return filteredOptions.slice(currentIndex >= 0 ? currentIndex : 0)
    }

    const canReassign = (currentStatus: string, workTypeName: string) => {
        const filteredOptions = getFilteredStatusOptions(workTypeName)
        const statusIndex = filteredOptions.indexOf(currentStatus)
        const completeIndex = filteredOptions.indexOf("complete")
        return statusIndex < completeIndex
    }

    const isFileUploadMandatory = (status: string) => {
        return status === "complete"
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
            const workTypeName = parentService.workTypeName || "Unknown Work Type";

            await assignToTechnicianByQA(orderId, serviceId, employeeId, workTypeName)
            const assignedTechResponse = await getAssignedTechnicianName(orderId, serviceId, workTypeName)
            const { technicianName, status } = assignedTechResponse.data
            const machineUpdatesResponse = await getMachineUpdates(employeeId, orderId, serviceId, workTypeName)
            // console.log("🚀 ~ handleEmployeeAssign ~ machineUpdatesResponse:", machineUpdatesResponse)
            const { updatedService } = machineUpdatesResponse.data

            const qaWorkTypeDetail = updatedService.workTypeDetails?.find((wtd: any) => wtd.workType === workTypeName)
            const reportURLNumber = qaWorkTypeDetail?.QAtest?.reportULRNumber || 'N/A'
            const qaTestReportNumber = qaWorkTypeDetail?.QAtest?.qaTestReportNumber || 'N/A'
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

            setMachineData((prevData: any) =>
                prevData.map((service: any) => ({
                    ...service,
                    workTypes: service.workTypes.map((wt: any) =>
                        wt.id === workTypeId
                            ? {
                                ...wt,
                                assignedTechnicianName: technicianName,
                                assignedTechnicianId: employeeId,
                                assignmentStatus: status,
                                backendFields: {
                                    ...wt.backendFields,
                                    serialNo:
                                        updatedService.serialNumber ||
                                        (service.equipmentId !== "N/A" ? service.equipmentId : "") ||
                                        wt.backendFields?.serialNo ||
                                        "N/A",
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

            setReportNumbers((prev) => {
                const updated = {
                    ...prev,
                    [parentService.id]: {
                        ...prev[parentService.id],
                        qatest: {
                            qaTestReportNumber: qaTestReportNumber,
                            reportULRNumber: reportURLNumber,
                            reportStatus,
                            reportUrl: undefined,
                        },
                    },
                };
                saveToLocalStorage(STORAGE_KEYS.reportNumbers, updated);
                return updated;
            });

            // console.log("[v0] Assignment successful:", { technicianName, status, updatedService })
        } catch (error: any) {
            console.error("[v0] Assignment failed:", error)
            showMessage(`Failed to assign technician: ${error.message}`, 'error')
        } finally {
            setAssigningTechnician((prev) => ({ ...prev, [workTypeId]: false }))
        }
    }

    const handleStaffAssign = async (workTypeId: string) => {
        const staffId = selectedStaff[workTypeId]
        const status = selectedStatuses[workTypeId] || "pending"

        if (!staffId || !orderId) return

        if (assignments[workTypeId]?.isAssigned && !assignments[workTypeId]?.isReassigned) {
            showMessage("This work type is already assigned. Use 'Edit' or 'Reassign' to modify the assignment.", 'warning')
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

            const isQATestService = parentService.workTypeName === "Quality Assurance Test"

            if (!isQATestService) {
                await assignToOfficeStaffByElora(orderId, serviceId, staffId, workTypeName, status)
            } else if (status === "complete" || status === "generated" || status === "paid") {
                const res = await completeStatusAndReport(
                    staffId,
                    orderId,
                    serviceId,
                    workTypeName,
                    status,
                    {},
                    uploadedFiles[workTypeId],
                    workTypeName,
                )

                if (res?.data?.linkedReport) {
                    const identifier = res.data.reportFor;
                    const reportData = res.data.linkedReport;
                    setReportNumbers((prev) => {
                        const newReportNumbers = {
                            ...prev,
                            [parentService.id]: {
                                ...prev[parentService.id],
                                [identifier]: {
                                    qaTestReportNumber: res.data.linkedReport.qaTestReportNumber,
                                    reportULRNumber: res.data.linkedReport.reportULRNumber,
                                    reportStatus: res.data.linkedReport.reportStatus,
                                    reportUrl: res.data.linkedReport.report,
                                    remark: reportData.remark,
                                },
                            },
                        };
                        saveToLocalStorage(STORAGE_KEYS.reportNumbers, newReportNumbers);
                        return newReportNumbers;
                    });
                }
            } else {
                await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, status)
            }

            setAssignments((prev) => ({
                ...prev,
                [workTypeId]: {
                    ...prev[workTypeId],
                    staffId,
                    status,
                    isAssigned: true,
                    isReassigned: false,
                },
            }))

            setSelectedStatuses((prev) => ({
                ...prev,
                [workTypeId]: status,
            }))

            const newAssignments = {
                ...assignments,
                [workTypeId]: { staffId, status, isAssigned: true, isReassigned: false },
            }
            saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)

            const newStatuses = { ...selectedStatuses, [workTypeId]: status }
            saveToLocalStorage(STORAGE_KEYS.selectedStatuses, newStatuses)

            // console.log("[v0] Staff assignment successful:", { staffId, status, workTypeName })
        } catch (error: any) {
            console.error("[v0] Staff assignment failed:", error)
            showMessage(`Failed to assign staff: ${error.message}`, 'error')
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

    const getWorkTypeIdentifier = (workTypeName: string): 'qatest' | 'elora' => {
        if (workTypeName === "Quality Assurance Test" || workTypeName === "QA Test") return "qatest";
        return "elora";
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
    //         showModal('Warning', "Cannot go back to previous status!");
    //         return
    //     }
    //     if (isFileUploadMandatory(newStatus) && !uploadedFiles[workTypeId]) {
    //         showModal('Warning', "File upload is mandatory for complete status!");
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
    //         const isQATestService = parentService.workTypeName === "Quality Assurance Test"

    //         let response;
    //         if (newStatus === "complete" || newStatus === "generated" || newStatus === "paid") {
    //             response = await completeStatusAndReport(
    //                 staffId,
    //                 orderId,
    //                 serviceId,
    //                 workTypeName,
    //                 newStatus,
    //                 {},
    //                 uploadedFiles[workTypeId],
    //                 workType.name,
    //             )

    //             if (response?.data?.linkedReport) {
    //                 const identifier = response.data.reportFor as 'qatest' | 'elora';
    //                 const reportData = response.data.linkedReport;

    //                 setReportNumbers((prev) => {
    //                     const current = prev[parentService.id] || {};
    //                     const currentReport = current[identifier] || {
    //                         qaTestReportNumber: 'N/A',
    //                         reportULRNumber: 'N/A',
    //                         reportStatus: 'pending',
    //                         reportUrl: undefined,
    //                         remark: '',
    //                     };

    //                     const updatedReport: ReportData = {
    //                         qaTestReportNumber: reportData.qaTestReportNumber || currentReport.qaTestReportNumber,
    //                         reportULRNumber: reportData.reportULRNumber || currentReport.reportULRNumber,
    //                         reportStatus: reportData.reportStatus || currentReport.reportStatus,
    //                         reportUrl: reportData.report || currentReport.reportUrl,
    //                         remark: reportData.remark || currentReport.remark,
    //                     };

    //                     const newReportStatus = {
    //                         ...prev,
    //                         [parentService.id]: {
    //                             ...current,
    //                             [identifier]: updatedReport,
    //                         },
    //                     }
    //                     saveToLocalStorage(STORAGE_KEYS.reportNumbers, newReportStatus)
    //                     return newReportStatus
    //                 })
    //             }
    //         } else {
    //             if (!isQATestService) {
    //                 await assignToOfficeStaffByElora(orderId, serviceId, staffId, workTypeName, newStatus)
    //             } else {
    //                 await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, newStatus)
    //             }
    //         }

    //         // Refresh report numbers after status update to get latest remark
    //         if (isQATestService && workType.name === "QA Test") {
    //             await refreshReportNumbers(parentService.id, 'qatest', staffId);
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

    //         // Auto-navigate to report for specific machines if status is complete
    //         if (newStatus === "complete" && [
    //             "C-Arm",
    //             "Mammography",
    //             "OBI",
    //             "KV Imaging (OBI)",
    //             "Bone Densitometer (BMD)",
    //             "BMD",
    //             "Radiography and Fluoroscopy",
    //             "Computed Tomography",
    //             "Dental Cone Beam CT",
    //             "Dental Intra",
    //             "Dental (Intra Oral)",
    //             "Dental Hand-held",
    //             "Dental (Hand-held)",
    //             "Radiography (Mobile)",
    //             "Radiography (Mobile) with HT",
    //             "Radiography (Portable)",
    //             "Radiography (Fixed)",
    //             "Interventional Radiology",
    //             "O-Arm",
    //             "Ortho Pantomography (OPG)",
    //             "Lead Apron/Thyroid Shield/Gonad Shield"
    //         ].includes(parentService.machineType)) {

    //             // Check if we have a valid token before navigating
    //             const token = Cookies.get("accessToken");
    //             if (!token) {
    //                 console.error("No access token found, cannot navigate");
    //                 showMessage("Session expired. Please login again.", 'error');
    //                 navigate("/login");
    //                 return;
    //             }

    //             try {
    //                 // Verify token is still valid (optional - you can decode to check expiry)
    //                 jwtDecode(token);
    //             } catch (error) {
    //                 console.error("Invalid token:", error);
    //                 showMessage("Session expired. Please login again.", 'error');
    //                 navigate("/login");
    //                 return;
    //             }

    //             const cleanId = parentService.id.replace(/-0$/, "");
    //             const firstQATest = parentService.workTypes.find((wt: any) => wt.name === "QA Raw");
    //             const createdAt = workType.qaTestSubmittedAt || firstQATest?.backendFields?.createdAt || null;
    //             const ulrNumber = reportNumbers[parentService.id]?.qatest?.reportULRNumber || firstQATest?.backendFields?.reportURLNumber || null;

    //             // Prefer uploaded Excel/file URL from complete response so report can pre-fill (e.g. Dental Cone Beam CT)
    //             const csvFileUrl = response?.data?.fileUrl ||
    //                 response?.data?.uploadedFileUrl ||
    //                 response?.data?.linkedReport?.fileUrl ||
    //                 response?.data?.linkedReport?.report ||
    //                 firstQATest?.backendFields?.uploadFile ||
    //                 firstQATest?.backendFields?.fileUrl ||
    //                 reportNumbers[parentService.id]?.qatest?.reportUrl ||
    //                 null;

    //             console.log('ServiceDetails2: Auto-navigating to report:', {
    //                 machineType: parentService.machineType,
    //                 serviceId: cleanId,
    //                 csvFileUrl
    //             });

    //             // Use setTimeout to ensure state updates are complete before navigation
    //             setTimeout(() => {
    //                 navigate("/admin/orders/generic-service-table", {
    //                     state: {
    //                         serviceId: cleanId,
    //                         machineType: parentService.machineType,
    //                         qaTestDate: workType.qaTestSubmittedAt || null,
    //                         createdAt: createdAt,
    //                         ulrNumber: ulrNumber,
    //                         csvFileUrl: csvFileUrl,
    //                     },
    //                 });
    //             }, 100);
    //         }
    //         // console.log("[v0] Status update successful:", { newStatus, workTypeName })
    //     } catch (error: any) {
    //         console.error("[v0] Status update failed:", error);
    //         if (error?.response?.status === 401) {
    //             showMessage("Session expired. Please login again.", 'error');
    //             navigate("/login");
    //         } else {
    //             showModal('Error', `Failed to update status: ${error?.message || 'Unknown error'}`);
    //         }
    //     } finally {
    //         setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
    //     }
    // }

    // Add this function to refresh report numbers

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
            const isQATestService = parentService.workTypeName === "Quality Assurance Test"

            let response;
            if (newStatus === "complete" || newStatus === "generated" || newStatus === "paid") {
                // For non-QA work types, we need to pass the actual work type name from the parent service
                // For QA work types, we should pass the specific work type (QA Test or QA Raw)
                const workTypeNameForReport = isQATestService ? workType.name : workTypeName;

                response = await completeStatusAndReport(
                    staffId,
                    orderId,
                    serviceId,
                    workTypeName,
                    newStatus,
                    {},
                    uploadedFiles[workTypeId],
                    getWorkTypeIdentifier(workTypeName), // Normalize to 'qatest' or 'elora'
                )

                if (response?.data?.linkedReport) {
                    const identifier = response.data.reportFor as 'qatest' | 'elora';
                    const reportData = response.data.linkedReport;

                    setReportNumbers((prev) => {
                        const current = prev[parentService.id] || {};
                        const currentReport = current[identifier] || {
                            qaTestReportNumber: 'N/A',
                            reportULRNumber: 'N/A',
                            reportStatus: 'pending',
                            reportUrl: undefined,
                            remark: '',
                        };

                        const updatedReport: ReportData = {
                            qaTestReportNumber: reportData.qaTestReportNumber || currentReport.qaTestReportNumber,
                            reportULRNumber: reportData.reportULRNumber || currentReport.reportULRNumber,
                            reportStatus: reportData.reportStatus || currentReport.reportStatus,
                            reportUrl: reportData.report || currentReport.reportUrl,
                            remark: reportData.remark || currentReport.remark,
                        };

                        const newReportStatus = {
                            ...prev,
                            [parentService.id]: {
                                ...current,
                                [identifier]: updatedReport,
                            },
                        }
                        saveToLocalStorage(STORAGE_KEYS.reportNumbers, newReportStatus)
                        return newReportStatus
                    })
                }
            } else {
                if (!isQATestService) {
                    await assignToOfficeStaffByElora(orderId, serviceId, staffId, workTypeName, newStatus)
                } else {
                    await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, newStatus)
                }
            }

            // Refresh report numbers after status update
            if (isQATestService && workType.name === "QA Test") {
                await refreshReportNumbers(parentService.id, 'qatest', staffId);
            }

            // Update machineData to sync the card status (header)
            setMachineData((prev: any) =>
                prev.map((s: any) =>
                    s.id === workTypeId ? { ...s, status: newStatus } : s
                )
            )

            const newAssignments = {
                ...assignments,
                [workTypeId]: {
                    ...assignments[workTypeId],
                    status: newStatus,
                    isReassigned: false,
                },
            }
            setAssignments(newAssignments)
            setSelectedStatuses((prev) => {
                const next = { ...prev, [workTypeId]: newStatus };
                saveToLocalStorage(STORAGE_KEYS.selectedStatuses, next);
                return next;
            });
            saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)

            // Auto-navigate logic for specific machine types (only for QA Test)
            if (isQATestService && newStatus === "complete" && [
                "C-Arm",
                "Mammography",
                "OBI",
                "KV Imaging (OBI)",
                "Bone Densitometer (BMD)",
                "BMD",
                "Radiography and Fluoroscopy",
                "Computed Tomography",
                "Dental Cone Beam CT",
                "Dental Intra",
                "Dental (Intra Oral)",
                "Dental Hand-held",
                "Radiography (Mobile)",
                "Radiography (Mobile) with HT",
                "Radiography (Portable)",
                "Radiography (Fixed)",
                "Interventional Radiology",
                "O-Arm",
                "Ortho Pantomography (OPG)",
                "Lead Apron/Thyroid Shield/Gonad Shield"
            ].includes(parentService.machineType)) {

                const token = Cookies.get("accessToken");
                if (!token) {
                    console.error("No access token found, cannot navigate");
                    showMessage("Session expired. Please login again.", 'error');
                    navigate("/login");
                    return;
                }

                try {
                    jwtDecode(token);
                } catch (error) {
                    console.error("Invalid token:", error);
                    showMessage("Session expired. Please login again.", 'error');
                    navigate("/login");
                    return;
                }

                const cleanId = parentService.id.replace(/-0$/, "");
                const firstQATest = parentService.workTypes.find((wt: any) => wt.name === "QA Raw");
                const createdAt = workType.qaTestSubmittedAt || firstQATest?.backendFields?.createdAt || null;
                const ulrNumber = reportNumbers[parentService.id]?.qatest?.reportULRNumber || firstQATest?.backendFields?.reportURLNumber || null;

                const csvFileUrl = response?.data?.fileUrl ||
                    response?.data?.uploadedFileUrl ||
                    response?.data?.linkedReport?.fileUrl ||
                    response?.data?.linkedReport?.report ||
                    firstQATest?.backendFields?.uploadFile ||
                    firstQATest?.backendFields?.fileUrl ||
                    reportNumbers[parentService.id]?.qatest?.reportUrl ||
                    null;

                console.log('ServiceDetails2: Auto-navigating to report:', {
                    machineType: parentService.machineType,
                    serviceId: cleanId,
                    csvFileUrl
                });

                setTimeout(() => {
                    navigate("/admin/orders/generic-service-table", {
                        state: {
                            serviceId: cleanId,
                            machineType: parentService.machineType,
                            qaTestDate: workType.qaTestSubmittedAt || null,
                            createdAt: createdAt,
                            ulrNumber: ulrNumber,
                            csvFileUrl: csvFileUrl,
                        },
                    });
                }, 100);
            }
        } catch (error: any) {
            console.error("[v0] Status update failed:", error);
            if (error?.response?.status === 401) {
                showMessage("Session expired. Please login again.", 'error');
                navigate("/login");
            } else {
                showModal('Error', `Failed to update status: ${error?.message || 'Unknown error'}`);
            }
        } finally {
            setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
        }
    }


    const refreshReportNumbers = async (serviceId: string, identifier: 'qatest' | 'elora', assigneeId: string) => {
        try {
            const response = await getReportNumbers(
                orderId,
                serviceId,
                assigneeId,
                identifier
            );

            if (response?.data?.reportNumbers?.[identifier]) {
                const reportData = response.data.reportNumbers[identifier];
                setReportNumbers((prev) => {
                    const current = prev[serviceId] || {};
                    const currentReport = current[identifier] || {
                        qaTestReportNumber: 'N/A',
                        reportULRNumber: 'N/A',
                        reportStatus: 'pending',
                        reportUrl: undefined,
                        remark: '',
                    };

                    const updatedReport: ReportData = {
                        qaTestReportNumber: reportData.qaTestReportNumber || currentReport.qaTestReportNumber,
                        reportULRNumber: reportData.reportULRNumber || currentReport.reportULRNumber,
                        reportStatus: reportData.reportStatus || currentReport.reportStatus,
                        reportUrl: reportData.report || currentReport.reportUrl,
                        remark: reportData.remark || currentReport.remark,
                    };

                    const updated = {
                        ...prev,
                        [serviceId]: {
                            ...current,
                            [identifier]: updatedReport,
                        },
                    };
                    saveToLocalStorage(STORAGE_KEYS.reportNumbers, updated);
                    return updated;
                });
            }
        } catch (error) {
            console.error(`Error refreshing report numbers for ${serviceId}:`, error);
        }
    };


    // Also update the handleStaffAssign function to include remark when updating report numbers
    // const handleStaffAssign = async (workTypeId: string) => {
    //     const staffId = selectedStaff[workTypeId]
    //     const status = selectedStatuses[workTypeId] || "pending"

    //     if (!staffId || !orderId) return

    //     if (assignments[workTypeId]?.isAssigned && !assignments[workTypeId]?.isReassigned) {
    //         showMessage("This work type is already assigned. Use 'Edit' or 'Reassign' to modify the assignment.", 'warning')
    //         setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
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

    //         const isQATestService = parentService.workTypeName === "Quality Assurance Test"

    //         let response;
    //         if (!isQATestService) {
    //             await assignToOfficeStaffByElora(orderId, serviceId, staffId, workTypeName, status)
    //         } else if (status === "complete" || status === "generated" || status === "paid") {
    //             response = await completeStatusAndReport(
    //                 staffId,
    //                 orderId,
    //                 serviceId,
    //                 workTypeName,
    //                 status,
    //                 {},
    //                 uploadedFiles[workTypeId],
    //                 workTypeName,
    //             )

    //             if (response?.data?.linkedReport) {
    //                 const identifier = response.data.reportFor;
    //                 const reportData = response.data.linkedReport;
    //                 setReportNumbers((prev) => {
    //                     const newReportNumbers = {
    //                         ...prev,
    //                         [parentService.id]: {
    //                             ...prev[parentService.id],
    //                             [identifier]: {
    //                                 qaTestReportNumber: reportData.qaTestReportNumber,
    //                                 reportULRNumber: reportData.reportULRNumber,
    //                                 reportStatus: reportData.reportStatus,
    //                                 reportUrl: reportData.report,
    //                                 remark: reportData.remark, // Make sure remark is included
    //                             },
    //                         },
    //                     };
    //                     saveToLocalStorage(STORAGE_KEYS.reportNumbers, newReportNumbers);
    //                     return newReportNumbers;
    //                 });
    //             }
    //         } else {
    //             await assignToOfficeStaff(orderId, serviceId, staffId, workTypeName, status)
    //         }

    //         // Refresh report numbers after assignment
    //         if (isQATestService && workType.name === "QA Test") {
    //             await refreshReportNumbers(parentService.id, 'qatest', staffId);
    //         }

    //         setAssignments((prev) => ({
    //             ...prev,
    //             [workTypeId]: {
    //                 ...prev[workTypeId],
    //                 staffId,
    //                 status,
    //                 isAssigned: true,
    //                 isReassigned: false,
    //             },
    //         }))

    //         setSelectedStatuses((prev) => ({
    //             ...prev,
    //             [workTypeId]: status,
    //         }))

    //         const newAssignments = {
    //             ...assignments,
    //             [workTypeId]: { staffId, status, isAssigned: true, isReassigned: false },
    //         }
    //         saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)

    //         const newStatuses = { ...selectedStatuses, [workTypeId]: status }
    //         saveToLocalStorage(STORAGE_KEYS.selectedStatuses, newStatuses)

    //         console.log("[v0] Staff assignment successful:", { staffId, status, workTypeName })
    //     } catch (error: any) {
    //         console.error("[v0] Staff assignment failed:", error)
    //         showMessage(`Failed to assign staff: ${error.message}`, 'error')
    //     } finally {
    //         setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
    //     }
    // }
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
        setMachineData((prev: any) =>
            prev.map((s: any) =>
                s.id === workTypeId ? { ...s, status: newStatus } : s
            )
        )
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
        const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId);
        const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId));
        const targetStatus = (parentService && isQAWorkType(parentService.workTypeName)) ? "generated" : "complete";

        setTimeout(() => {
            handleStatusUpdate(workTypeId, targetStatus)
        }, 1000)
    }

    const toggleAccordion = (itemId: string) => {
        setExpandedItems((prev) => {
            const newItems = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
            saveToLocalStorage(STORAGE_KEYS.expandedItems, newItems)
            return newItems
        })
    }

    const handleDeleteMachine = async (serviceId: string) => {
        if (!orderId) return;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You are about to delete this machine and all its associated reports. This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#4f46e5',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            customClass: {
                container: 'my-swal'
            }
        });

        if (result.isConfirmed) {
            setDeletingMachineId(serviceId);
            try {
                await deleteMachineFromOrder(orderId, serviceId);
                showMessage("Machine deleted successfully", "success");
                fetchMachineData();
            } catch (error: any) {
                showMessage(error?.message || "Failed to delete machine", "error");
            } finally {
                setDeletingMachineId(null);
            }
        }
    };

    const handleEditPrice = async (serviceId: string, currentPrice: number) => {
        const { value: newPrice } = await Swal.fire({
            title: 'Edit Price',
            input: 'number',
            inputLabel: 'Enter new price',
            inputValue: currentPrice,
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to write something!'
                }
                if (Number(value) < 0) {
                    return 'Price cannot be negative'
                }
            }
        });

        if (newPrice !== undefined && newPrice !== null) {
            try {
                await updateServicePrice(orderId as string, serviceId, Number(newPrice));
                showMessage('Price updated successfully');
                // Refresh data
                fetchMachineData();
            } catch (error: any) {
                showMessage(error.message || 'Failed to update price', 'error');
            }
        }
    };

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
            return filename.replace(/^\d+-/, "")
        } catch {
            return "Unknown File"
        }
    }

    const handleReassign = (workTypeId: string) => {
        const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
        if (!workType) return
        const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId))
        if (!parentService) return

        let currentStatus = assignments[workTypeId]?.status || "pending"
        if (workType.name === "QA Raw") {
            const qaTestId = workTypeId.replace('-qa-raw', '-qa-test')
            const qaTestStatus = assignments[qaTestId]?.status || selectedStatuses[qaTestId] || "pending"
            if (qaTestStatus === "generated") {
                showMessage("Cannot reassign QA Raw because QA Test status is generated!", 'warning')
                return
            }
        }
        if (!canReassign(currentStatus, parentService.workTypeName)) {
            showMessage("Cannot reassign after complete status!", 'warning')
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
        const newAssignments = {
            ...assignments,
            [workTypeId]: { ...assignments[workTypeId], isAssigned: false, isReassigned: true },
        }
        saveToLocalStorage(STORAGE_KEYS.assignments, newAssignments)
    }

    const handleFileEdit = async (workTypeId: string, fileType: "upload" | "view", fileIndex?: number) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "*/*";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId);
                if (!workType) {
                    showMessage("Work type not found", 'error')
                    return;
                }
                const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId));
                if (!parentService) {
                    showMessage("Parent service not found", 'error')
                    return;
                }
                const serviceId = workType.id.split("-")[0];
                const workTypeName = parentService.workTypeName || "";
                const technicianId = assignments[workTypeId]?.employeeId || "";
                let uploadFile: File | null = null;
                let viewFiles: File[] = [];
                let action: 'add' | 'replace_all' | 'replace' | 'delete' | undefined;
                let targetIndex: number | undefined;

                if (fileType === "upload") {
                    uploadFile = file;
                } else if (fileType === "view") {
                    if (fileIndex !== undefined) {
                        action = 'replace';
                        targetIndex = fileIndex;
                        viewFiles = [file];
                    } else {
                        action = 'add';
                        viewFiles = [file];
                    }
                }

                await editDocuments(
                    orderId || "",
                    serviceId || "",
                    technicianId,
                    workTypeName,
                    uploadFile,
                    viewFiles,
                    action,
                    targetIndex
                );
                showMessage(`${fileType === "upload" ? "Upload" : "Photo"} updated successfully!`, 'success')
                fetchMachineData();
            } catch (error) {
                console.error("Error updating file:", error);
                showMessage("Failed to update file", 'error')
            }
        };
        input.click();
    };

    const handleAddPhoto = async (workTypeId: string) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;
        input.onchange = async (e) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            if (files.length === 0) return;
            try {
                const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId);
                if (!workType) {
                    showMessage("Work type not found", 'error')
                    return;
                }
                const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId));
                if (!parentService) {
                    showMessage("Parent service not found", 'error')
                    return;
                }
                const serviceId = workType.id.split("-")[0];
                const workTypeName = parentService.workTypeName || "";
                const technicianId = assignments[workTypeId]?.employeeId || "";
                await editDocuments(
                    orderId || "",
                    serviceId || "",
                    technicianId,
                    workTypeName,
                    null,
                    files,
                    'add',
                    undefined
                );
                showMessage(`${files.length} photo(s) added successfully!`, 'success')
                fetchMachineData();
            } catch (error) {
                console.error("Error adding photo:", error);
                showMessage("Failed to add photo", 'error')
            }
        };
        input.click();
    };

    const handleDeleteFile = async (workTypeId: string, fileIndex: number) => {
        if (!confirm("Are you sure you want to delete this file?")) return;
        try {
            const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId);
            if (!workType) {
                showMessage("Work type not found", 'error')
                return;
            }
            const parentService = machineData.find((service) => service.workTypes.some((wt) => wt.id === workTypeId));
            if (!parentService) {
                showMessage("Parent service not found", 'error')
                return;
            }
            const serviceId = workType.id.split("-")[0];
            const workTypeName = parentService.workTypeName || "";
            const technicianId = assignments[workTypeId]?.employeeId || "";
            await editDocuments(
                orderId || "",
                serviceId || "",
                technicianId,
                workTypeName,
                null,
                [],
                'delete',
                fileIndex
            );
            showMessage("File deleted successfully!", 'success')
            fetchMachineData();
        } catch (error) {
            console.error("Error deleting file:", error);
            showMessage("Failed to delete file", 'error')
        }
    };

    const handleDownloadFile = (fileUrl: string, fileName: string) => {
        window.open(fileUrl, "_blank");
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        link.target = "_blank";
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
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Services Management</h1>
                    <p className="text-gray-600">Manage your equipment and work types</p>
                </div>
                <button
                    onClick={() => setAddMachineModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <Plus className="h-5 w-5" />
                    Add Machine
                </button>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Customer Feedback</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {customerFeedback?.trim() ? customerFeedback : "No feedback submitted yet."}
                </p>
            </div>

            {(() => {
                const selectedManufacturer = manufacturers.find((m: any) => String(m._id) === String(leadOwnerId));
                if (!selectedManufacturer) return null;
                const travelType = selectedManufacturer.travelCost || "-";
                const fixedCost =
                    travelType === "Fixed Cost" && selectedManufacturer.cost != null && selectedManufacturer.cost !== ""
                        ? `Rs. ${selectedManufacturer.cost}`
                        : "-";
                return (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-1">Manufacturer Travel Cost Details</h3>
                        <p className="text-sm text-blue-800">
                            <strong>Travel Cost Type:</strong> {travelType}
                        </p>
                        {travelType === "Fixed Cost" && (
                            <p className="text-sm text-blue-800 mt-1">
                                <strong>Fixed Travel Cost:</strong> {fixedCost}
                            </p>
                        )}
                    </div>
                );
            })()}
            <div className="grid gap-6">
                {machineData.map((service, index) => (
                    <div key={service.id} className="shadow-lg border-0 bg-white rounded-lg overflow-hidden relative">
                        {/* ✅ Add sequential number badge */}
                        {/* <div className="absolute -top-2 -left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-lg">
                            {index + 1}
                        </div> */}

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    {/* ✅ Show machine number in header too */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-blue-700">#{index + 1}</span>
                                        <h2 className="text-xl font-semibold text-gray-900">{service.machineType}</h2>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="font-medium">Equipment ID/Serial No: {service.equipmentId}</span>
                                        {/* ✅ Add Serial Number here */}
                                        {/* {service.workTypes[0]?.backendFields?.serialNo && service.workTypes[0]?.backendFields?.serialNo !== "N/A" && (
                                            <span className="font-medium">Serial No: {service.workTypes[0]?.backendFields?.serialNo}</span>
                                        )} */}
                                        <span className="font-medium">Work Type: {service.workTypeName}</span>
                                    </div>
                                    {/* ✅ Quick summary of important fields */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {/* {service.partyCodeOrSysId && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Party: {service.partyCodeOrSysId}
                                            </span>
                                        )}
                                        {service.procNoOrPoNo && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                PROC: {service.procNoOrPoNo}
                                            </span>
                                        )} */}
                                        {service.formattedProcExpiryDate && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Exp: {service.formattedProcExpiryDate}
                                            </span>
                                        )}
                                        {service.price != null && service.price > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    Price: ₹{service.price.toLocaleString()}
                                                </span>
                                                <button
                                                    onClick={() => handleEditPrice(service.id, service.price)}
                                                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"
                                                    title="Edit Price"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                                        {service.status}
                                    </span>
                                    {machineData.length > 1 && currentUserRole !== 'staff' && (
                                        <button
                                            onClick={() => handleDeleteMachine(service.workTypes[0]?.serviceId || service.id.split("-")[0])}
                                            disabled={deletingMachineId === (service.workTypes[0]?.serviceId || service.id.split("-")[0])}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Delete machine"
                                        >
                                            {deletingMachineId === (service.workTypes[0]?.serviceId || service.id.split("-")[0]) ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* ✅ Work Order Copy Link */}
                            {service.workOrderCopy && (
                                <div className="mt-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <a
                                        href={service.workOrderCopy}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                        View Work Order Copy
                                    </a>
                                </div>
                            )}
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
                                                            canAssignQARaw(workType, service) ? (
                                                                <div className="space-y-3">
                                                                    <label className="block text-sm font-medium text-gray-700">
                                                                        {assignments[workType.id]?.isReassigned ? "Reassign Engineer" : "Assign Engineer"}
                                                                    </label>
                                                                    <div className="flex gap-2">
                                                                        {technicians.length === 1 ? (
                                                                            <div className="flex items-center gap-2 flex-1">
                                                                                <span className="text-sm font-medium text-gray-700">{technicians[0].name}</span>
                                                                            </div>
                                                                        ) : (
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
                                                                        )}
                                                                        <button
                                                                            onClick={() => {
                                                                                if (technicians.length === 1) {
                                                                                    setSelectedEmployees((prev) => ({
                                                                                        ...prev,
                                                                                        [workType.id]: technicians[0]._id,
                                                                                    }));
                                                                                }
                                                                                handleEmployeeAssign(workType.id);
                                                                            }}
                                                                            disabled={
                                                                                technicians.length === 1
                                                                                    ? loadingDropdowns || assigningTechnician[workType.id]
                                                                                    : !selectedEmployees[workType.id] || loadingDropdowns || assigningTechnician[workType.id]
                                                                            }
                                                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                                                                        >
                                                                            {assigningTechnician[workType.id] && <Loader2 className="h-4 w-4 animate-spin" />}
                                                                            {assigningTechnician[workType.id] ? "Assigning..." : (
                                                                                technicians.length === 1
                                                                                    ? `${assignments[workType.id]?.isReassigned ? "Reassign" : "Assign"} ${technicians[0].name}`
                                                                                    : assignments[workType.id]?.isReassigned ? "Reassign" : "Assign"
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="p-3 bg-gray-100 rounded-md text-sm text-gray-600">
                                                                    Only admin or technicians can assign engineers to QA Raw.
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="space-y-4">
                                                                {/* <div className="flex items-center gap-2 text-green-600">
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
                                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                            </svg>
                                                                            <span>
                                                                                Engineer assigned at: {formatDate(workType.assignedAtEngineer)}
                                                                            </span>
                                                                        </div>
                                                                    </div> */}
                                                                <div className="space-y-3">
                                                                    {/* Assigned to + status badge */}
                                                                    <div className="flex items-center gap-3 text-green-600">
                                                                        <Check className="h-4 w-4 flex-shrink-0" />
                                                                        <span className="font-medium">
                                                                            Assigned to:{" "}
                                                                            {workType.assignedTechnicianName ||
                                                                                technicians.find((tech) => tech._id === assignments[workType.id]?.employeeId)?.name ||
                                                                                "Unknown"}
                                                                        </span>

                                                                        {workType.assignmentStatus && (
                                                                            <span
                                                                                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                                                    workType.assignmentStatus
                                                                                )}`}
                                                                            >
                                                                                {workType.assignmentStatus}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Assigned at – now nicely separated */}
                                                                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path
                                                                                fillRule="evenodd"
                                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                                                clipRule="evenodd"
                                                                            />
                                                                        </svg>
                                                                        <span>Engineer assigned at: {formatDate(workType.assignedAtEngineer)}</span>
                                                                    </div>

                                                                    {/* Optional: Completed at (if you added it) */}
                                                                    {["complete", "generated"].includes(selectedStatuses[workType.id] || service.status || "") &&
                                                                        workType.completedAt && (
                                                                            <div className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                                                                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path
                                                                                        fillRule="evenodd"
                                                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                                        clipRule="evenodd"
                                                                                    />
                                                                                </svg>
                                                                                <span>Completed at: {formatDate(workType.completedAt)}</span>
                                                                            </div>
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
                                                                        <label className="text-xs text-gray-500">Report ULR Number</label>
                                                                        <p className="font-medium">{workType.backendFields?.reportURLNumber || 'N/A'}</p>
                                                                    </div>
                                                                    <div className="p-3 bg-white rounded-md border">
                                                                        <label className="text-xs text-gray-500">QA Test Report Number</label>
                                                                        <p className="font-medium">{workType.backendFields?.qaTestReportNumber || 'N/A'}</p>
                                                                    </div>
                                                                </div>
                                                                {canAssignQARaw(workType, service) && (
                                                                    <div className="flex gap-2">
                                                                        {(() => {
                                                                            const qaTestId = workType.id.replace('-qa-raw', '-qa-test');
                                                                            const qaTestStatus = assignments[qaTestId]?.status || selectedStatuses[qaTestId] || "pending";
                                                                            const canReassignRaw = qaTestStatus !== "generated" && qaTestStatus !== "paid";
                                                                            return (
                                                                                <button
                                                                                    onClick={() => handleReassign(workType.id)}
                                                                                    disabled={!canReassignRaw}
                                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${canReassignRaw
                                                                                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                                        }`}
                                                                                >
                                                                                    <RefreshCw className="h-4 w-4" />
                                                                                    Reassign
                                                                                </button>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                )}
                                                                {/* Add this AFTER the remark section in QA Raw */}
                                                                {(workType.procNoOrPoNo || workType.formattedProcExpiryDate || workType.partyCodeOrSysId) && (
                                                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                                                        {/* Proc/PO No */}
                                                                        {workType.procNoOrPoNo && (
                                                                            <div className="p-3 bg-white rounded-md border">
                                                                                <label className="text-xs text-gray-500 font-medium">PROC/PO No</label>
                                                                                <p className="font-medium mt-1">{workType.procNoOrPoNo}</p>
                                                                            </div>
                                                                        )}

                                                                        {/* Proc Expiry Date */}
                                                                        {workType.formattedProcExpiryDate && (
                                                                            <div className="p-3 bg-white rounded-md border">
                                                                                <label className="text-xs text-gray-500 font-medium">PROC Expiry Date</label>
                                                                                <p className="font-medium mt-1">{workType.formattedProcExpiryDate}</p>
                                                                            </div>
                                                                        )}

                                                                        {/* Party Code */}
                                                                        {workType.partyCodeOrSysId && (
                                                                            <div className="p-3 bg-white rounded-md border">
                                                                                <label className="text-xs text-gray-500 font-medium">Party Code/Sys ID</label>
                                                                                <p className="font-medium mt-1">{workType.partyCodeOrSysId}</p>
                                                                            </div>
                                                                        )}

                                                                        {/* Work Order Copy Link */}
                                                                        {workType.workOrderCopy && (
                                                                            <div className="p-3 bg-white rounded-md border col-span-2">
                                                                                <label className="text-xs text-gray-500 font-medium">Work Order Copy</label>
                                                                                <div className="mt-1">
                                                                                    <a
                                                                                        href={workType.workOrderCopy}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                                                                    >
                                                                                        <FileText className="h-4 w-4" />
                                                                                        View Work Order Copy
                                                                                    </a>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <div className="mt-4 space-y-3">
                                                                    <h4 className="text-sm font-medium text-gray-700">Available Files</h4>
                                                                    {workType.backendFields?.uploadFile && (
                                                                        <div className="space-y-2">
                                                                            <h4 className="text-sm font-medium text-gray-700">Raw Files:</h4>
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
                                                                    {workType.backendFields?.viewFile && workType.backendFields.viewFile.length > 0 && (
                                                                        <div className="space-y-2">
                                                                            <h4 className="text-sm font-medium text-gray-700">Photos:</h4>
                                                                            <div className="max-h-48 overflow-y-auto">
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
                                                                        </div>
                                                                    )}
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
                                                            canAssignQATest(workType) ? (
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
                                                                            <option value="">{loadingDropdowns ? "Loading staff..." : "Select Staff----"}</option>
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
                                                                            {getFilteredStatusOptions(service.workTypeName).map((status) => (
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
                                                                <div className="p-3 bg-gray-100 rounded-md text-sm text-gray-600">
                                                                    You don't have permission to assign staff to this work type.
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2 text-green-600">
                                                                        <Check className="h-4 w-4" />
                                                                        <span className="font-medium">
                                                                            Assigned to:{" "}
                                                                            {assignments[workType.id]?.staffName ||
                                                                                officeStaff.find((s) => s._id === assignments[workType.id]?.staffId)?.name ||
                                                                                "Unknown"}
                                                                        </span>
                                                                        <span
                                                                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedStatuses[workType.id] || "pending")}`}
                                                                        >
                                                                            {selectedStatuses[workType.id] || "pending"}
                                                                        </span>

                                                                    </div>


                                                                    {canAssignQATest(workType) ? (
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => handleEditToggle(workType.id)}
                                                                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold 
                                                                                text-white rounded-xl 
                                                                                bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
                                                                                shadow-lg hover:shadow-xl 
                                                                                hover:scale-105 active:scale-95 
                                                                                transition-all duration-300"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
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
                                                                    ) : (
                                                                        <span className="text-xs text-gray-500">Only admin or the assigned staff can modify</span>
                                                                    )}

                                                                </div>
                                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span>
                                                                        Staff assigned at: {formatDate(workType.assignedAtStaff)}
                                                                    </span>
                                                                </div>
                                                                {canAssignQATest(workType) && editingWorkType[workType.id] && (
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
                                                                                {getFilteredStatusOptions(service.workTypeName).map((status) => (
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
                                                                {canAssignQATest(workType) && (selectedStatuses[workType.id] === "complete" || selectedStatuses[workType.id] === "generated" || selectedStatuses[workType.id] === "paid") && (
                                                                    <div className="space-y-3 p-3 bg-green-50 rounded-md border border-green-200">
                                                                        <label className="block text-sm font-medium text-green-700">
                                                                            Upload Generated Report for Verification
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

                                                                        <label className="block text-sm font-medium text-green-700">
                                                                            Generate Report
                                                                        </label>

                                                                        <div className="flex items-center gap-3">
                                                                            <>
                                                                                {console.log("Service object →", service)}
                                                                                <button
                                                                                    onClick={() => {
                                                                                        if (!service?.id || !service?.machineType) {
                                                                                            console.error("Cannot navigate: missing service.id or machineType", service);
                                                                                            alert("Invalid service data. Cannot generate report.");
                                                                                            return;
                                                                                        }

                                                                                        const cleanId = service.id.replace(/-0$/, "");
                                                                                        console.log("Navigating with:", { serviceId: cleanId, machineType: service.machineType });

                                                                                        // Get createdAt from the first QA test's createdAt (from backend)
                                                                                        // We need to get it from the original machineData response
                                                                                        // For now, use qaTestSubmittedAt as fallback, or get from firstTest
                                                                                        const firstQATest = service.workTypes.find((wt: any) => wt.name === "QA Raw");
                                                                                        // Try to get createdAt from the original response - it should be in firstTest.createdAt
                                                                                        // Since we don't have direct access, we'll use qaTestSubmittedAt or fetch it
                                                                                        // For Lead Apron, the createdAt is typically the first QA test's createdAt
                                                                                        const createdAt = workType.qaTestSubmittedAt ||
                                                                                            firstQATest?.backendFields?.createdAt ||
                                                                                            null;

                                                                                        // Get ULR number from reportNumbers
                                                                                        const ulrNumber = reportNumbers[service.id]?.qatest?.reportULRNumber ||
                                                                                            firstQATest?.backendFields?.reportURLNumber ||
                                                                                            null;

                                                                                        // Get file URL for mammography/OBI/BMD/FixedRadioFluro/CT Scan CSV/Excel file
                                                                                        let csvFileUrl = null;
                                                                                        if (
                                                                                            service.machineType === "C-Arm" ||
                                                                                            service.machineType === "Mammography" ||
                                                                                            service.machineType === "OBI" ||
                                                                                            service.machineType === "KV Imaging (OBI)" ||
                                                                                            service.machineType === "Bone Densitometer (BMD)" ||
                                                                                            service.machineType === "BMD" ||
                                                                                            service.machineType === "Radiography and Fluoroscopy" ||
                                                                                            service.machineType === "Computed Tomography" ||
                                                                                            service.machineType === "Dental Cone Beam CT" ||
                                                                                            service.machineType === "Dental Intra" ||
                                                                                            service.machineType === "Dental (Intra Oral)" ||
                                                                                            service.machineType === "Radiography (Mobile)" ||
                                                                                            service.machineType === "Radiography (Mobile) with HT" ||
                                                                                            service.machineType === "Radiography (Portable)" ||
                                                                                            service.machineType === "Radiography (Fixed)" ||
                                                                                            service.machineType === "Interventional Radiology" ||
                                                                                            service.machineType === "O-Arm" ||
                                                                                            service.machineType === "Ortho Pantomography (OPG)" ||
                                                                                            service.machineType === "Dental (Hand-held)" ||
                                                                                            service.machineType === "Dental Hand-held" ||
                                                                                            service.machineType === "Lead Apron/Thyroid Shield/Gonad Shield"
                                                                                        ) {
                                                                                            // First try to get uploadFile from QA Raw workType's backendFields (this is the file uploaded by engineer)
                                                                                            // Then fallback to reportUrl from reportNumbers (this is the file uploaded by office staff)
                                                                                            csvFileUrl = firstQATest?.backendFields?.uploadFile ||
                                                                                                firstQATest?.backendFields?.fileUrl ||
                                                                                                reportNumbers[service.id]?.qatest?.reportUrl ||
                                                                                                null;

                                                                                            console.log('ServiceDetails2: Getting csvFileUrl:', {
                                                                                                machineType: service.machineType,
                                                                                                uploadFile: firstQATest?.backendFields?.uploadFile,
                                                                                                reportUrl: reportNumbers[service.id]?.qatest?.reportUrl,
                                                                                                finalCsvFileUrl: csvFileUrl
                                                                                            });
                                                                                        }

                                                                                        navigate("/admin/orders/generic-service-table", {
                                                                                            state: {
                                                                                                serviceId: cleanId,
                                                                                                machineType: service.machineType,
                                                                                                qaTestDate: workType.qaTestSubmittedAt || null,
                                                                                                createdAt: createdAt,
                                                                                                ulrNumber: ulrNumber,
                                                                                                csvFileUrl: csvFileUrl, // Pass file URL for mammography
                                                                                            },
                                                                                        });
                                                                                    }}
                                                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                                                                >
                                                                                    Generate Report
                                                                                </button>
                                                                            </>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                                                            <div className="p-2 bg-white rounded border">
                                                                                <label className="text-xs text-gray-500">QA Test Report Status</label>
                                                                                <span
                                                                                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                                                        reportNumbers[service.id]?.qatest?.reportStatus || "pending"
                                                                                    )}`}
                                                                                >
                                                                                    {reportNumbers[service.id]?.qatest?.reportStatus || "pending"}
                                                                                </span>
                                                                            </div>
                                                                            {/* {reportNumbers[service.id]?.qatest?.remark && (
                                                                                    <div className="p-2 bg-yellow-50 rounded border col-span-2">
                                                                                        <label className="text-xs font-medium text-yellow-800">Debug Remark:</label>
                                                                                        <p className="text-sm text-yellow-900">{reportNumbers[service.id]?.qatest?.remark}</p>
                                                                                    </div>
                                                                                )} */}
                                                                            {reportNumbers[service.id]?.qatest?.reportStatus === "rejected" && (
                                                                                <div className="p-2 bg-white rounded border col-span-2">
                                                                                    <label className="text-xs text-gray-500 font-medium">Remark (Rejection Reason)</label>
                                                                                    <p className="mt-1 text-sm text-red-600 break-words bg-red-50 p-2 rounded border border-red-200">
                                                                                        {reportNumbers[service.id]?.qatest?.remark || "No remark provided"}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                            {reportNumbers[service.id]?.qatest?.reportUrl && (
                                                                                <div className="p-2 bg-white rounded border">
                                                                                    <label className="text-xs text-gray-500">Report URL</label>
                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                        <a
                                                                                            href={reportNumbers[service.id]?.qatest?.reportUrl}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="text-xs text-blue-600 hover:text-blue-800 truncate max-w-[150px]"
                                                                                        >
                                                                                            {reportNumbers[service.id]?.qatest?.reportUrl.split('/').pop() || 'View Report'}
                                                                                        </a>
                                                                                        <Eye
                                                                                            className="h-3 w-3 text-blue-600 cursor-pointer hover:text-blue-800"
                                                                                            onClick={() => handleViewReport(service.id, 'qatest')}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {uploadedFiles[workType.id] && (
                                                                    <div className="p-3 bg-green-50 rounded-md border border-green-200">
                                                                        <div className="flex items-start gap-2 text-green-700">
                                                                            <Upload className="h-4 w-4" />
                                                                            <span className="text-sm font-medium">
                                                                                Uploaded: {uploadedFiles[workType.id]?.name}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {["complete", "generated"].includes(selectedStatuses[workType.id]) && (
                                                                    <div className="text-xs text-green-600 font-medium flex items-center gap-1 mt-2">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                        </svg>
                                                                        <span>Status Completed at: {formatDate(workType.completedAt)}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                        )}
                                                        {/* ================ STATUS CHANGE HISTORY ================ */}
                                                        {workType.statusHistory && workType.statusHistory.length > 0 && (
                                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                                    <RefreshCw className="h-4 w-4" />
                                                                    Status Change History
                                                                </h4>
                                                                <div className="space-y-2 text-xs">
                                                                    {workType.statusHistory.map((hist: any, idx: number) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="flex items-start justify-between gap-3 p-2 bg-white rounded border hover:shadow-sm transition-shadow"
                                                                        >
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium text-gray-900">
                                                                                        {hist.updatedBy?.name || "Unknown User"}
                                                                                    </span>
                                                                                    <span className="text-gray-500">→</span>
                                                                                    <span
                                                                                        className={`px-2 py-0.5  rounded-full text-xs font-medium border ${hist.newStatus === "complete" || hist.newStatus === "generated"
                                                                                            ? "bg-green-100 text-green-800 border-green-300"
                                                                                            : hist.newStatus === "in progress"
                                                                                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                                                                                : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                                                                            }`}                                                                                    >
                                                                                        {/* {hist.oldStatus}  →  */}
                                                                                        {hist.newStatus}
                                                                                    </span>
                                                                                </div>
                                                                                {hist.remark && (
                                                                                    <p className="text-gray-600 mt-1 italic">"{hist.remark}"</p>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-right text-gray-500 whitespace-nowrap">
                                                                                {new Date(hist.updatedAt).toLocaleString("en-IN", {
                                                                                    dateStyle: "short",
                                                                                    timeStyle: "short",
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {(workType.name !== "QA Raw" && workType.name !== "QA Test") && (
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
                                                                        {getFilteredStatusOptions(service.workTypeName).map((status) => (
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
                                                                            {assignments[workType.id]?.staffName ||
                                                                                officeStaff.find((s) => s._id === assignments[workType.id]?.staffId)?.name ||
                                                                                "Unknown"}
                                                                        </span>
                                                                        <span
                                                                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedStatuses[workType.id] || "pending")}`}
                                                                        >
                                                                            {selectedStatuses[workType.id] || "pending"}
                                                                        </span>

                                                                    </div>
                                                                    {/* <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                            </svg>
                                                                            <span>Engineer assigned at: {formatDate(workTypeDetails?.assignedAt)}</span>
                                                                        </div> */}
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleEditToggle(workType.id)}
                                                                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold 
             text-white rounded-xl 
             bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
             shadow-lg hover:shadow-xl 
             hover:scale-105 active:scale-95 
             transition-all duration-300"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
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
                                                                                {getFilteredStatusOptions(service.workTypeName).map((status) => (
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
                                                                    selectedStatuses[workType.id] === "generated" ||
                                                                    selectedStatuses[workType.id] === "paid"
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
                                                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                                                {(() => {
                                                                                    const identifier = getWorkTypeIdentifier(service.workTypeName);
                                                                                    const reportStatus = reportNumbers[service.id]?.[identifier]?.reportStatus || "pending";
                                                                                    const reportUrl = reportNumbers[service.id]?.[identifier]?.reportUrl;
                                                                                    const reportRemark = reportNumbers[service.id]?.[identifier]?.remark;
                                                                                    return (
                                                                                        <>
                                                                                            {reportUrl && (
                                                                                                <div className="p-2 bg-white rounded border">
                                                                                                    <label className="text-xs text-gray-500">Report URL</label>
                                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                                        <a
                                                                                                            href={reportUrl}
                                                                                                            target="_blank"
                                                                                                            rel="noopener noreferrer"
                                                                                                            className="text-xs text-blue-600 hover:text-blue-800 truncate max-w-[150px]"
                                                                                                        >
                                                                                                            {reportUrl.split('/').pop() || 'View Report'}
                                                                                                        </a>
                                                                                                        <Eye
                                                                                                            className="h-3 w-3 text-blue-600 cursor-pointer hover:text-blue-800"
                                                                                                            onClick={() => handleViewReport(service.id, identifier)}
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </>
                                                                                    );
                                                                                })()}
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
            <ConfirmModal
                open={modalOpen}
                onClose={hideModal}
                title={modalTitle}
                message={modalMessage}
            />
            <AddMachineModal
                open={addMachineModalOpen}
                onClose={() => setAddMachineModalOpen(false)}
                orderId={orderId || ""}
                onSuccess={fetchMachineData}
                isEmployeeLead={employees.some(emp => emp._id === leadOwnerId)}
            />
        </div>
    )
}