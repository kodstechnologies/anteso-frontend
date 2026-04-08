import React, { useEffect, useState, useCallback } from "react";
import {
    getAdditionalServicesByOrderId,
    getActiveStaffs,
    assignAdditionalServiceStaff,
    updateAdditionalServiceStatus,
    getAssignedStaffDetailsForAdditionalService
} from "../../../api/index";
import { useParams } from "react-router-dom";
import {
    Loader2,
    FileText,
    Upload,
    Edit3,
    CheckCircle,
    UserPlus,
    History,
    Eye,
    Clock,
    CheckCircle2,
    AlertCircle,
    X,
    ExternalLink,
    MessageSquare,
    Zap,
    Plus,
    IndianRupee
} from "lucide-react";
import { showMessage } from "../../../components/common/ShowMessage";

const AdditionalServices = () => {
    const [additionalServices, setAdditionalServices] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [historyModal, setHistoryModal] = useState<{ open: boolean; serviceId: string | null; data: any | null }>({
        open: false,
        serviceId: null,
        data: null
    });
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);

    const { orderId } = useParams();

    const fetchInitialData = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const [servicesData, staffData] = await Promise.all([
                getAdditionalServicesByOrderId(orderId),
                getActiveStaffs()
            ]);

            const servicesWithState = (servicesData.additionalServices || []).map((s: any) => ({
                ...s,
                status: s.status?.toLowerCase() || "pending",
                remark: s.remark ?? "",
                file: null,
            }));

            setAdditionalServices(servicesWithState);
            setStaffList(staffData.data || []);
            setSpecialInstructions(servicesData.specialInstructions || "");
        } catch (err: any) {
            setError(err.message);
            showMessage("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleChange = (id: string, field: string, value: any) => {
        setAdditionalServices((prev) =>
            prev.map((service) =>
                service._id === id ? { ...service, [field]: value } : service
            )
        );
    };

    const handleAssignStaff = async (serviceId: string, staffId: string) => {
        if (!staffId) return;
        setUpdatingIds((prev) => new Set([...prev, serviceId]));
        try {
            const res = await assignAdditionalServiceStaff(orderId!, serviceId, { assignedStaff: staffId });
            showMessage("Staff assigned successfully! Status set to Pending.", "success");

            setAdditionalServices(prev => prev.map(s =>
                s._id === serviceId ? { ...s, assignedStaff: staffId, status: "pending" } : s
            ));
        } catch (err: any) {
            showMessage(err.message || "Assignment failed", "error");
        } finally {
            setUpdatingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(serviceId);
                return newSet;
            });
        }
    };

    const handleStatusUpdate = async (service: any) => {
        if (!service.status) {
            showMessage("Please select a status", "error");
            return;
        }

        setUpdatingIds((prev) => new Set([...prev, service._id]));
        try {
            const formData = new FormData();
            formData.append("status", service.status);
            formData.append("remark", service.remark || "");
            if (service.file) {
                formData.append("file", service.file);
            }

            const res = await updateAdditionalServiceStatus(orderId!, service._id, formData);
            showMessage(`Status updated to ${service.status} ✅`, "success");

            setAdditionalServices((prev) =>
                prev.map((s) =>
                    s._id === service._id ? { ...s, ...res.service, file: null } : s
                )
            );
        } catch (err: any) {
            showMessage(err.message || "Update failed ❌", "error");
        } finally {
            setUpdatingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(service._id);
                return newSet;
            });
        }
    };

    const viewHistory = async (serviceId: string) => {
        setHistoryModal({ open: true, serviceId, data: null });
        setHistoryLoading(true);
        try {
            const data = await getAssignedStaffDetailsForAdditionalService(orderId!, serviceId);
            setHistoryModal(prev => ({ ...prev, data: data.data }));
        } catch (err: any) {
            showMessage(err.message || "Failed to load history", "error");
            setHistoryModal({ open: false, serviceId: null, data: null });
        } finally {
            setHistoryLoading(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    <p className="text-gray-500 font-medium animate-pulse">Synchronizing Additional Services...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-4 py-6 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="h-7 w-7 text-indigo-600" />
                        Additional Service Management
                    </h1>
                    {/* <p className="text-gray-500 mt-1">Track, assign, and manage supplementary project requirements</p> */}
                </div>
                {/* Special Instructions Tooltip/Card */}

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Services List */}
                <div className="xl:col-span-2 space-y-6">
                    {additionalServices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {additionalServices.map((service) => (
                                <div
                                    key={service._id}
                                    className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col"
                                >
                                    {/* Service Header */}
                                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 group-hover:bg-indigo-50/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                                {service.name}
                                            </h3>
                                            <span className={`px - 2.5 py - 0.5 rounded - full text - xs font - bold border ${getStatusStyles(service.status)} `}>
                                                {service.status.toUpperCase()}
                                            </span>
                                        </div>
                                        {/* <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                                            {service.description || "No description available."}
                                        </p> */}

                                        {/* Note and Price Section */}
                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">note</span>
                                                </div>
                                                <p className="text-sm font-semibold text-gray-700 leading-relaxed truncate">
                                                    {service.description || "-"}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Zap className="h-3.5 w-3.5 text-emerald-600" />
                                                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">price</span>
                                                </div>
                                                <p className="text-lg font-black text-emerald-700">
                                                    {service.totalAmount !== undefined && service.totalAmount !== null
                                                        ? `₹${service.totalAmount}`
                                                        : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4 flex-1">
                                        {/* Staff Assignment */}
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                                                <UserPlus className="h-3 w-3" /> Responsibility
                                            </label>
                                            <select
                                                disabled={updatingIds.has(service._id)}
                                                value={service.assignedStaff?._id || service.assignedStaff || ""}
                                                onChange={(e) => handleAssignStaff(service._id, e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                            >
                                                <option value="">Choose Staff Member...</option>
                                                {staffList.map((staff) => (
                                                    <option key={staff._id} value={staff._id}>
                                                        {staff.name} ({staff.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Status & Remark Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Status</label>
                                                <select
                                                    disabled={updatingIds.has(service._id)}
                                                    value={service.status}
                                                    onChange={(e) => handleChange(service._id, "status", e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="submitted">Submitted</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Remark</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={service.remark}
                                                        onChange={(e) => handleChange(service._id, "remark", e.target.value)}
                                                        placeholder="..."
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none pl-9"
                                                    />
                                                    <MessageSquare className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* File Upload Section */}
                                        {(service.status === 'submitted' || service.status === 'completed') && (
                                            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                                <label className="text-xs font-bold text-indigo-700 mb-2 flex items-center gap-2">
                                                    <Upload className="h-3.5 w-3.5" /> Attach Execution Report
                                                </label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => handleChange(service._id, "file", e.target.files?.[0])}
                                                    className="text-xs w-full file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-5 pt-0 mt-auto flex gap-3">
                                        <button
                                            onClick={() => handleStatusUpdate(service)}
                                            disabled={updatingIds.has(service._id)}
                                            className="grow flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {updatingIds.has(service._id) ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    Sync Update
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => viewHistory(service._id)}
                                            className="p-3 bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 rounded-xl transition-all active:scale-90"
                                            title="View Audit Trail"
                                        >
                                            <History className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                            <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-bold text-xl mb-1">Clean Slate!</h3>
                            <p className="text-gray-500">No additional services linked to this order yet.</p>
                        </div>
                    )}
                </div>

                {/* Right Sidebar: Quick Stats & Instructions */}
                <div className="space-y-8">
                    {/* Stats Card */}


                    {/* Full Instructions */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                        <h5 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Edit3 className="h-5 w-5 text-indigo-600" />
                            Special Instruction
                        </h5>
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 min-h-[150px]">
                            {specialInstructions ? (
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                    {specialInstructions}
                                </p>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6">
                                    <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                                    <p className="text-gray-400 text-sm italic">No special instruction provided</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit History Modal */}
            {historyModal.open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in transition-all">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <History className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Status Audit Trail</h2>
                                    <p className="text-indigo-100 text-xs">Complete transparency for service execution</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setHistoryModal({ open: false, serviceId: null, data: null })}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {historyLoading ? (
                                <div className="flex flex-col items-center py-20 gap-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                                    <p className="text-gray-400 font-medium">Retrieving history logs...</p>
                                </div>
                            ) : historyModal.data ? (
                                <div className="space-y-6">
                                    {/* Current Staff Info */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                                            {historyModal.data.assignedStaff?.name?.[0] || "?"}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Assigned To</p>
                                            <h4 className="text-lg font-bold text-gray-900">{historyModal.data.assignedStaff?.name || "Unassigned"}</h4>
                                            <p className="text-sm text-gray-500 italic">{historyModal.data.assignedStaff?.email || "N/A"}</p>
                                        </div>
                                        {historyModal.data.assignedAt && (
                                            <div className="ml-auto text-right border-l pl-4 border-gray-200">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Assigned At</p>
                                                <p className="text-xs text-gray-700 font-medium">{new Date(historyModal.data.assignedAt).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reports Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {historyModal.data.reports?.submittedReport && (
                                            <a
                                                href={historyModal.data.reports.submittedReport}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-blue-600 hover:text-white transition-all duration-300"
                                            >
                                                <FileText className="h-8 w-8 text-blue-600 group-hover:text-white" />
                                                <div className="text-left">
                                                    <p className="text-[10px] font-bold opacity-70 uppercase">Submitted Doc</p>
                                                    <p className="text-sm font-bold flex items-center gap-1.5">View Report <ExternalLink className="h-3 w-3" /></p>
                                                </div>
                                            </a>
                                        )}
                                        {historyModal.data.reports?.completedReport && (
                                            <a
                                                href={historyModal.data.reports.completedReport}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-green-600 hover:text-white transition-all duration-300"
                                            >
                                                <CheckCircle className="h-8 w-8 text-green-600 group-hover:text-white" />
                                                <div className="text-left">
                                                    <p className="text-[10px] font-bold opacity-70 uppercase">Final Doc</p>
                                                    <p className="text-sm font-bold flex items-center gap-1.5">View Completion <ExternalLink className="h-3 w-3" /></p>
                                                </div>
                                            </a>
                                        )}
                                    </div>

                                    {/* Log Timeline */}
                                    <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-indigo-100">
                                        {[...(historyModal.data.statusHistory || [])].reverse().map((log: any, idx: number) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute - left - [30px] top - 1.5 h - [12px] w - [12px] rounded - full ring - 4 ring - white shadow - sm ${idx === 0 ? 'bg-indigo-600 animate-pulse' : 'bg-indigo-200'} `} />
                                                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-gray-500">{log.oldStatus || "None"}</span>
                                                            <span className="text-gray-300">→</span>
                                                            <span className={`px - 2 py - 0.5 rounded text - [10px] font - black uppercase tracking - tighter ${getStatusStyles(log.newStatus)} `}>
                                                                {log.newStatus}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                            {new Date(log.updatedAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {/* <div className="flex items-center gap-2">
                                                        <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 uppercase">
                                                            {log.updatedBy?.name?.[0] || "U"}
                                                        </div>
                                                        <p className="text-xs text-gray-600">
                                                            Updated by <span className="font-bold text-gray-800">{log.updatedBy?.name}</span> ({log.updatedBy?.role || "Staff"})
                                                        </p>
                                                    </div> */}
                                                </div>
                                            </div>
                                        ))}
                                        {(!historyModal.data.statusHistory || historyModal.data.statusHistory.length === 0) && (
                                            <p className="text-center text-gray-400 italic py-4">No audit logs found for this service.</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center py-20 text-gray-400">Unable to retrieve server logs at this time.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdditionalServices;
