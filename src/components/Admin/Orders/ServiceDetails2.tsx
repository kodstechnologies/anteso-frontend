import React, { useState, useEffect } from "react"
import Swal from 'sweetalert2';

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
} from "lucide-react"
import { getAssignedStaffName, getMachineDetails } from "../../../api"
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
} from "../../../api"
import { useNavigate } from "react-router-dom";

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
        }
        reportUrl: any
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
            const [techniciansData, staffData] = await Promise.all([getActiveTechnicians(), getActiveStaffs()])

            setTechnicians(techniciansData.data || [])
            setOfficeStaff(staffData.data || [])
        } catch (error) {
            console.error("Error fetching dropdown data:", error)
            setTechnicians([])
            setOfficeStaff([])
        } finally {
            setLoadingDropdowns(false)
        }
    }
    const navigate = useNavigate();

    const fetchExistingAssignments = async (): Promise<MachineData[]> => {
        try {
            // If we already have assignments from localStorage or assignedStaffData, use them
            const existingAssignments = loadFromLocalStorage(STORAGE_KEYS.assignments, {});
            if (Object.keys(existingAssignments).length > 0) {
                setAssignments(existingAssignments);
                return machineData;
            }

            const assignmentPromises: Promise<any>[] = [];

            machineData.forEach((service) => {
                service.workTypes.forEach((workType) => {
                    const serviceId = workType.id.split("-")[0];
                    const workTypeName = service.workTypeName;

                    if (workType.name === "QA Raw") {
                        assignmentPromises.push(
                            getAssignedTechnicianName(orderId, serviceId, workTypeName)
                                .then((res) => ({
                                    workTypeId: workType.id,
                                    assignedTechnician: res.data.assignedTechnician,
                                }))
                                .catch((err) => {
                                    console.error(`Technician fetch error (${workTypeName}):`, err);
                                    return { workTypeId: workType.id, assignedTechnician: null };
                                })
                        );
                    } else {
                        assignmentPromises.push(
                            getAssignedStaffName(orderId, serviceId, workTypeName)
                                .then((res) => ({
                                    workTypeId: workType.id,
                                    assignedStaff: res.data.assignedStaff,
                                }))
                                .catch((err) => {
                                    console.error(`Staff fetch error (${workTypeName}):`, err);
                                    return { workTypeId: workType.id, assignedStaff: null };
                                })
                        );
                    }
                });
            });

            if (assignmentPromises.length === 0) return machineData;

            const results = await Promise.all(assignmentPromises);
            const freshAssignments: Record<string, any> = {};
            const updatedMachineData = machineData.map((service) => ({
                ...service,
                workTypes: service.workTypes.map((workType) => {
                    const apiResult = results.find((r) => r.workTypeId === workType.id);

                    if (workType.name === "QA Raw" && apiResult?.assignedTechnician) {
                        const tech = apiResult.assignedTechnician;
                        freshAssignments[workType.id] = {
                            isAssigned: true,
                            employeeId: tech._id,
                            technicianName: tech.name,
                            assignmentStatus: tech.status,
                        };
                        return {
                            ...workType,
                            assignedTechnicianName: tech.name,
                            assignedTechnicianId: tech._id,
                            assignmentStatus: tech.status,
                        };
                    }

                    if (apiResult?.assignedStaff) {
                        const staff = apiResult.assignedStaff;
                        // console.log("🚀 ~ fetchExistingAssignments ~ staff:", staff)
                        freshAssignments[workType.id] = {
                            isAssigned: true,
                            staffId: staff._id,
                            staffName: staff.name,
                            status: staff.status,
                        };
                        return {
                            ...workType,
                            assignedStaffName: staff.name,
                            assignedStaffId: staff._id,
                            assignmentStatus: staff.status,
                        };
                    }

                    return workType;
                }),
            }));

            setAssignments(freshAssignments);
            setMachineData(updatedMachineData);
            saveToLocalStorage(STORAGE_KEYS.assignments, freshAssignments);
            // console.log("[v0] Fresh assignments from API:", freshAssignments);
            return updatedMachineData;
        } catch (error) {
            console.error("[v0] Unexpected error in fetchExistingAssignments:", error);
            return machineData;
        }
    };

    // const fetchMachineData = async () => {
    //     if (!orderId) {
    //         setError("Order ID is required");
    //         setLoading(false);
    //         return;
    //     }

    //     try {
    //         setLoading(true);
    //         setError(null);
    //         const response = await getMachineDetails(orderId);
    //         console.log("🚀 ~ fetchMachineData ~ response:", response);

    //         const machinesArray = Array.isArray(response) ? response : [response];
    //         if (!machinesArray || machinesArray.length === 0) {
    //             throw new Error("No machine data found");
    //         }

    //         const allTransformedData: MachineData[] = [];
    //         const staffAssignments: Record<string, any> = {};

    //         machinesArray.forEach((machineData: any) => {
    //             const workTypeDetails = machineData.workTypeDetails || [];
    //             const transformedData: MachineData[] = workTypeDetails.map(
    //                 (workTypeDetail: any, index: number) => {
    //                     const createWorkTypes = () => {
    //                         const workTypes = [];
    //                         const cardId = `${machineData._id}-${index}`;

    //                         if (workTypeDetail.workType === "Quality Assurance Test") {
    //                             // ---- QA Raw ----
    //                             workTypes.push({
    //                                 id: `${cardId}-qa-raw`,
    //                                 name: "QA Raw",
    //                                 description: "",
    //                                 backendFields: {
    //                                     serialNo: machineData.serialNumber || machineData.equipmentNo || "N/A",
    //                                     modelName: machineData.machineModel || "N/A",
    //                                     remark: machineData.remark || "N/A",
    //                                     fileUrl: workTypeDetail.viewFile?.[0] || "",
    //                                     imageUrl: workTypeDetail.viewFile?.[1] || "",
    //                                     uploadFile: workTypeDetail.uploadFile || "",
    //                                     viewFile: workTypeDetail.viewFile || [],
    //                                     reportURLNumber: workTypeDetail.QAtest?.reportULRNumber || "N/A",
    //                                     qaTestReportNumber: workTypeDetail.QAtest?.qaTestReportNumber || "N/A",
    //                                     reportStatus: workTypeDetail.QAtest?.reportStatus || "pending",
    //                                     verificationRemark: workTypeDetail.QAtest?.remark || "",
    //                                 },
    //                                 serviceId: machineData._id,
    //                                 assignedTechnicianId: workTypeDetail.engineer || undefined,
    //                             });

    //                             // ✅ Save assigned Technician
    //                             staffAssignments[`${cardId}-qa-raw`] = {
    //                                 type: "Technician",
    //                                 id: workTypeDetail.engineer || null,
    //                             };

    //                             // ---- QA Test ----
    //                             workTypes.push({
    //                                 id: `${cardId}-qa-test`,
    //                                 name: "QA Test",
    //                                 description: "",
    //                                 reportNumber: "N/A",
    //                                 urlNumber: "N/A",
    //                                 serviceId: machineData._id,
    //                                 assignedStaffId: workTypeDetail.QAtest?.officeStaff || undefined,
    //                             });

    //                             // ✅ Save assigned Office Staff
    //                             staffAssignments[`${cardId}-qa-test`] = {
    //                                 type: "Office Staff",
    //                                 id: workTypeDetail.QAtest?.officeStaff || null,
    //                             };
    //                         } else {
    //                             // ---- Other Work Types ----
    //                             const customId = workTypeDetail.workType
    //                                 .toLowerCase()
    //                                 .replace(/[^a-z0-9]/g, "-");

    //                             workTypes.push({
    //                                 id: `${cardId}-${customId}`,
    //                                 name: workTypeDetail.workType,
    //                                 description: "",
    //                                 reportNumber: "N/A",
    //                                 urlNumber: "N/A",
    //                                 serviceId: machineData._id,
    //                                 assignedStaffId: workTypeDetail.elora || undefined,
    //                             });

    //                             // ✅ Save Elora (or any other office staff)
    //                             staffAssignments[`${cardId}-${customId}`] = {
    //                                 type: "Elora",
    //                                 id: workTypeDetail.elora || null,
    //                             };
    //                         }
    //                         return workTypes;
    //                     };

    //                     return {
    //                         id: `${machineData._id}-${index}`,
    //                         machineType: machineData.machineType || "Unknown Machine",
    //                         equipmentId: machineData.equipmentNo || "N/A",
    //                         workTypeName: workTypeDetail.workType || "General Work",
    //                         status: workTypeDetail.status || "pending",
    //                         workTypes: createWorkTypes(),
    //                         rawPhoto: machineData.rawPhoto || [],
    //                     };
    //                 }
    //             );
    //             allTransformedData.push(...transformedData);
    //         });

    //         // ✅ Store the staff assignments in React state
    //         setAssignedStaffData(staffAssignments);
    //         console.log("✅ Assigned Staff Data:", staffAssignments);

    //         // ------------------------
    //         // Machine Data + Reports
    //         // ------------------------
    //         setMachineData(allTransformedData);

    //         // Initialize report numbers with proper remark handling
    //         setReportNumbers((prevReportNumbers) => {
    //             const mergedReportNumbers = { ...prevReportNumbers };

    //             allTransformedData.forEach((service) => {
    //                 if (!mergedReportNumbers[service.id]) {
    //                     mergedReportNumbers[service.id] = {};
    //                 }

    //                 if (service.workTypeName === "Quality Assurance Test") {
    //                     const qaRawWorkType = service.workTypes.find(
    //                         (wt) => wt.name === "QA Raw"
    //                     );

    //                     if (qaRawWorkType && qaRawWorkType.backendFields) {
    //                         const currentQatest = mergedReportNumbers[service.id]?.qatest || {
    //                             qaTestReportNumber: "N/A",
    //                             reportULRNumber: "N/A",
    //                             reportStatus: "pending",
    //                             reportUrl: undefined,
    //                             remark: "",
    //                         };

    //                         const updatedQatest: ReportData = {
    //                             ...currentQatest,
    //                             reportStatus:
    //                                 qaRawWorkType.backendFields.reportStatus ||
    //                                 currentQatest.reportStatus ||
    //                                 "pending",
    //                             qaTestReportNumber:
    //                                 qaRawWorkType.backendFields.qaTestReportNumber ||
    //                                 currentQatest.qaTestReportNumber ||
    //                                 "N/A",
    //                             reportULRNumber:
    //                                 qaRawWorkType.backendFields.reportURLNumber ||
    //                                 currentQatest.reportULRNumber ||
    //                                 "N/A",
    //                             remark:
    //                                 qaRawWorkType.backendFields.verificationRemark ||
    //                                 currentQatest.remark ||
    //                                 "",
    //                         };

    //                         mergedReportNumbers[service.id].qatest = updatedQatest;
    //                     }
    //                 }

    //                 // Handle other work types (elora)
    //                 const otherWorkTypes = service.workTypes.filter(wt =>
    //                     wt.name !== "QA Raw" && wt.name !== "QA Test"
    //                 );

    //                 if (otherWorkTypes.length > 0) {
    //                     const workTypeIdentifier = getWorkTypeIdentifier(service.workTypeName);
    //                     if (!mergedReportNumbers[service.id][workTypeIdentifier]) {
    //                         mergedReportNumbers[service.id][workTypeIdentifier] = {
    //                             qaTestReportNumber: "N/A",
    //                             reportULRNumber: "N/A",
    //                             reportStatus: "pending",
    //                             reportUrl: undefined,
    //                             remark: "",
    //                         };
    //                     }
    //                 }
    //             });

    //             saveToLocalStorage(STORAGE_KEYS.reportNumbers, mergedReportNumbers);
    //             return mergedReportNumbers;
    //         });

    //         const updatedMachineDataWithAssignments = await fetchExistingAssignments();

    //         // ------------------------
    //         // Enhanced Report Numbers Fetch with better error handling
    //         // ------------------------
    //         const fetchAllReportNumbers = async () => {
    //             const reportPromises = [];

    //             for (const service of updatedMachineDataWithAssignments) {
    //                 const workTypeIdentifier = getWorkTypeIdentifier(service.workTypeName);
    //                 if (!["qatest", "elora"].includes(workTypeIdentifier)) continue;

    //                 let assigneeId: string = "";
    //                 let targetWorkType;

    //                 if (workTypeIdentifier === "qatest") {
    //                     targetWorkType = service.workTypes.find(
    //                         (wt) => wt.name === "QA Raw"
    //                     );
    //                     assigneeId = targetWorkType?.assignedTechnicianId ||
    //                         targetWorkType?.assignedStaffId ||
    //                         "";
    //                 } else {
    //                     targetWorkType = service.workTypes.find((wt) =>
    //                         wt.name.toLowerCase().includes("elora")
    //                     ) || service.workTypes[0];
    //                     assigneeId = targetWorkType?.assignedStaffId || "";
    //                 }

    //                 if (!assigneeId) {
    //                     console.log(`No assignee found for service ${service.id}, skipping report fetch`);
    //                     continue;
    //                 }

    //                 reportPromises.push(
    //                     getReportNumbers(
    //                         orderId,
    //                         service.id,
    //                         assigneeId,
    //                         workTypeIdentifier
    //                     )
    //                         .then((response) => {
    //                             if (response?.data?.reportNumbers?.[workTypeIdentifier]) {
    //                                 const reportData = response.data.reportNumbers[workTypeIdentifier];
    //                                 console.log(`📊 Report data for ${service.id}-${workTypeIdentifier}:`, reportData);

    //                                 return { serviceId: service.id, identifier: workTypeIdentifier, reportData };
    //                             }
    //                             return null;
    //                         })
    //                         .catch((error) => {
    //                             console.error(
    //                                 `Error fetching report numbers for ${service.id}:`,
    //                                 error
    //                             );
    //                             return null;
    //                         })
    //                 );
    //             }

    //             // Process all report promises
    //             const reportResults = await Promise.all(reportPromises);

    //             setReportNumbers((prev) => {
    //                 const updated = { ...prev };

    //                 reportResults.forEach((result) => {
    //                     if (!result) return;

    //                     const { serviceId, identifier, reportData } = result;
    //                     const current = updated[serviceId] || {};
    //                     const currentReport = current[identifier] || {
    //                         qaTestReportNumber: "N/A",
    //                         reportULRNumber: "N/A",
    //                         reportStatus: "pending",
    //                         reportUrl: undefined,
    //                         remark: "",
    //                     };

    //                     const updatedReport: ReportData = {
    //                         qaTestReportNumber:
    //                             reportData.qaTestReportNumber ||
    //                             currentReport.qaTestReportNumber ||
    //                             "N/A",
    //                         reportULRNumber:
    //                             reportData.reportULRNumber ||
    //                             currentReport.reportULRNumber ||
    //                             "N/A",
    //                         reportStatus:
    //                             reportData.reportStatus ||
    //                             currentReport.reportStatus ||
    //                             "pending",
    //                         reportUrl:
    //                             reportData.report ||
    //                             currentReport.reportUrl,
    //                         remark:
    //                             reportData.remark || // Ensure remark is always captured
    //                             currentReport.remark ||
    //                             "",
    //                     };

    //                     if (!updated[serviceId]) {
    //                         updated[serviceId] = {};
    //                     }
    //                     updated[serviceId][identifier] = updatedReport;
    //                 });

    //                 saveToLocalStorage(STORAGE_KEYS.reportNumbers, updated);
    //                 console.log("📊 Final report numbers after fetch:", updated);
    //                 return updated;
    //             });
    //         };

    //         await fetchAllReportNumbers();

    //         // Force a refresh of assignments to ensure latest data
    //         setTimeout(() => {
    //             fetchExistingAssignments();
    //         }, 1000);

    //     } catch (err: any) {
    //         console.error("Error fetching machine data:", err);
    //         setError(err.message || "Failed to fetch machine data");
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    // Initialize assignments from assignedStaffData when it changes


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

            const machinesArray = Array.isArray(response) ? response : [response];
            if (!machinesArray || machinesArray.length === 0) {
                throw new Error("No machine data found");
            }

            const allTransformedData: MachineData[] = [];
            const staffAssignments: Record<string, any> = {};

            machinesArray.forEach((machineData: any) => {
                const workTypeDetails = machineData.workTypeDetails || [];
                const transformedData: MachineData[] = workTypeDetails.map(
                    (workTypeDetail: any, index: number) => {
                        const createWorkTypes = () => {
                            const workTypes = [];
                            const cardId = `${machineData._id}-${index}`;

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
                                    },
                                    serviceId: machineData._id,
                                    assignedTechnicianId: workTypeDetail.engineer || undefined,
                                    assignedAtEngineer: workTypeDetail.assignedAt || undefined,
                                });

                                // ✅ Save assigned Technician
                                if (workTypeDetail.engineer) {
                                    staffAssignments[`${cardId}-qa-raw`] = {
                                        type: "Technician",
                                        id: workTypeDetail.engineer,
                                    };
                                }

                                // ---- QA Test ----
                                workTypes.push({
                                    id: `${cardId}-qa-test`,
                                    name: "QA Test",
                                    description: "",
                                    reportNumber: "N/A",
                                    urlNumber: "N/A",
                                    serviceId: machineData._id,
                                    assignedStaffId: workTypeDetail.QAtest?.officeStaff || undefined,
                                    assignedAtStaff: workTypeDetail.QAtest?.assignedAt,
                                    completedAt: workTypeDetail.completedAt || undefined,
                                    statusHistory: workTypeDetail.QAtest?.statusHistory || workTypeDetail.statusHistory || [],
                                });

                                // ✅ Save assigned Office Staff
                                if (workTypeDetail.QAtest?.officeStaff) {
                                    staffAssignments[`${cardId}-qa-test`] = {
                                        type: "Office Staff",
                                        id: workTypeDetail.QAtest?.officeStaff,
                                    };
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
                                });

                                // ✅ Save Elora (or any other office staff) - FIXED THIS PART
                                if (workTypeDetail.elora?.officeStaff?._id) {
                                    staffAssignments[`${cardId}-${customId}`] = {
                                        type: "Elora",
                                        id: workTypeDetail.elora.officeStaff._id,
                                    };
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

            const updatedMachineDataWithAssignments = await fetchExistingAssignments();

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

            // Force a refresh of assignments to ensure latest data
            setTimeout(() => {
                fetchExistingAssignments();
            }, 1000);

        } catch (err: any) {
            console.error("Error fetching machine data:", err);
            setError(err.message || "Failed to fetch machine data");
        } finally {
            setLoading(false);
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

    const getAvailableStatuses = (currentStatus: string, isReassigned = false) => {
        if (isReassigned) {
            return statusOptions
        }
        const currentIndex = statusOptions.indexOf(currentStatus)
        return statusOptions.slice(currentIndex)
    }

    const canReassign = (currentStatus: string) => {
        const statusIndex = statusOptions.indexOf(currentStatus)
        const completeIndex = statusOptions.indexOf("complete")
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
                response = await completeStatusAndReport(
                    staffId,
                    orderId,
                    serviceId,
                    workTypeName,
                    newStatus,
                    {},
                    uploadedFiles[workTypeId],
                    workType.name,
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
                            remark: reportData.remark || currentReport.remark, // Make sure remark is included
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

            // Refresh report numbers after status update to get latest remark
            if (isQATestService && workType.name === "QA Test") {
                await refreshReportNumbers(parentService.id, 'qatest', staffId);
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
            // console.log("[v0] Status update successful:", { newStatus, workTypeName })
        } catch (error: any) {
            console.error("[v0] Status update failed:", error)
            showModal('Error', `Failed to update status: ${error.message}`);
        } finally {
            setAssigningStaff((prev) => ({ ...prev, [workTypeId]: false }))
        }
    }

    // Add this function to refresh report numbers
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
            return filename.replace(/^\d+-/, "")
        } catch {
            return "Unknown File"
        }
    }

    const handleReassign = (workTypeId: string) => {
        const workType = machineData.flatMap((service) => service.workTypes).find((wt) => wt.id === workTypeId)
        if (!workType) return
        let currentStatus = assignments[workTypeId]?.status || "pending"
        if (workType.name === "QA Raw") {
            const qaTestId = workTypeId.replace('-qa-raw', '-qa-test')
            const qaTestStatus = assignments[qaTestId]?.status || selectedStatuses[qaTestId] || "pending"
            if (qaTestStatus === "generated") {
                showMessage("Cannot reassign QA Raw because QA Test status is generated!", 'warning')
                return
            }
        }
        if (!canReassign(currentStatus)) {
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
                                                                        <label className="text-xs text-gray-500">Report URL Number</label>
                                                                        <p className="font-medium">{workType.backendFields?.reportURLNumber || 'N/A'}</p>
                                                                    </div>
                                                                    <div className="p-3 bg-white rounded-md border">
                                                                        <label className="text-xs text-gray-500">QA Test Report Number</label>
                                                                        <p className="font-medium">{workType.backendFields?.qaTestReportNumber || 'N/A'}</p>
                                                                    </div>
                                                                </div>
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
                                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span>
                                                                        Staff assigned at: {formatDate(workType.assignedAtStaff)}
                                                                    </span>
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
                                                                {(selectedStatuses[workType.id] === "complete" || selectedStatuses[workType.id] === "generated" || selectedStatuses[workType.id] === "paid") && (
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

                                                                                        navigate("/admin/orders/generic-service-table", {
                                                                                            state: {
                                                                                                serviceId: cleanId,
                                                                                                machineType: service.machineType,
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
        </div>
    )
}