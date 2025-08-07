"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Plus, Edit, Trash2, Building2, GraduationCap, Shield } from "lucide-react"
import {
    getAllClients,
    getAllHospitalsByClientId,
    getAllIstitutessByClientId,
    getAllRsosByClientId,
    deleteHospitalByClientIdAndHospitalId,
    deleteInstituteByClientIdAndInstituteId,
    deleteRsoByClientIdAndRsoId,
} from "../../../../api/index"
import { showMessage } from "../../../common/ShowMessage"
import FullScreenLoader from "../../../common/FullScreenLoader"

// Define interfaces
interface Hospital {
    id: number
    _id?: string // MongoDB ID if using MongoDB
    name: string
    address: string
    phone: string
    email?: string
    licenseNo?: string
    gstNo: string
    branch: string
}

interface Institute {
    id: number
    _id?: string // MongoDB ID if using MongoDB
    eloraId: string
    password: string
    email: string
    phone: string
    name?: string
}

interface RSO {
    id: number
    _id?: string // MongoDB ID if using MongoDB
    rsoId: string
    password: string
    email: string
    phone: string
    rpId: string
    tldBadge: string
    validity: string
    name?: string
    attachFile?: string
}

interface Equipment {
    id: number
    machineType: string
    model: string
    make: string
    serialNo: string
    equipID: string
    qaValidity: string
    licenseValidity: string
    status: string
    qaReportAttachment: string
    licenceAttachment: string
}

interface Client {
    id: number
    name: string
    email: string
    address: string
    phone: string
    business: string
    gstNo: string
    hospitals: Hospital[]
    institutes: Institute[]
    rsos: RSO[]
    equipment: Equipment[]
}

const ViewClients: React.FC = () => {
    const navigate = useNavigate()
    const { clientId } = useParams()
    console.log("🚀 ~ ViewClients ~ clientId:", clientId)

    const [clients, setClients] = useState<Client[]>([])
    const [hospitals, setHospitals] = useState<Hospital[]>([])
    const [institutes, setInstitutes] = useState<Institute[]>([])
    const [rsos, setRsos] = useState<RSO[]>([])
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<"hospitals" | "institutes" | "rsos">("hospitals")
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteItem, setDeleteItem] = useState<{ type: string; id: number | string; name: string } | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch clients data
                const clientsRes = await getAllClients()
                console.log("🚀 ~ fetchClients ~ res:", clientsRes.data.clients)
                setClients(clientsRes?.data?.clients || [])

                // If clientId is provided, fetch related data
                if (clientId) {
                    await fetchClientData(clientId)
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [clientId])

    const fetchClientData = async (id: string) => {
        try {
            const [hospitalData, instituteData, rsoData] = await Promise.all([
                getAllHospitalsByClientId(id),
                getAllIstitutessByClientId(id),
                getAllRsosByClientId(id),
            ])

            console.log("Hospitals:", hospitalData)
            console.log("Institutes:", instituteData)
            console.log("RSOs:", rsoData)

            // Update state with fetched data
            setHospitals(hospitalData.data || [])
            setInstitutes(instituteData.data || [])
            setRsos(rsoData.data || [])
        } catch (error) {
            console.error("Error fetching client data:", error)
            // Set empty arrays on error
            setHospitals([])
            setInstitutes([])
            setRsos([])
        }
    }

    const handleViewClient = async (client: Client) => {
        setSelectedClient(client)
        await fetchClientData(client.id.toString())
    }

    const handleAddEntity = (entityType: "hospitals" | "institutes" | "rsos") => {
        // Convert plural to singular for navigation
        const singularType = entityType.slice(0, -1) // removes 's' from end
        navigate(`/admin/clients/preview/${clientId}/add-${singularType}`)
    }

    const handleEditEntity = (entityId: number | string, entityType: "hospital" | "institute" | "rso") => {
        console.log("Navigating to edit with ID:", entityId, "Entity Type:", entityType)
        navigate(`/admin/clients/preview/${clientId}/edit-${entityType}/${entityId}`)
        console.log("🚀 ~ handleEditEntity ~ entityId:", entityId)
    }

    const handleDeleteClick = (type: string, id: number | string, name: string) => {
        setDeleteItem({ type, id, name })
        setShowDeleteModal(true)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteItem || !clientId) return

        setDeleteLoading(true)
        try {
            switch (deleteItem.type) {
                case "hospital":
                    await deleteHospitalByClientIdAndHospitalId(clientId, deleteItem.id)
                    setHospitals(hospitals.filter((h) => (h._id || h.id) !== deleteItem.id))
                    showMessage("Hospital deleted successfully!", "success")
                    break
                case "institute":
                    await deleteInstituteByClientIdAndInstituteId(clientId, deleteItem.id)
                    setInstitutes(institutes.filter((i) => (i._id || i.id) !== deleteItem.id))
                    showMessage("Institute deleted successfully!", "success")
                    break
                case "rso":
                    await deleteRsoByClientIdAndRsoId(clientId, deleteItem.id)
                    setRsos(rsos.filter((r) => (r._id || r.id) !== deleteItem.id))
                    showMessage("RSO deleted successfully!", "success")
                    break
                default:
                    console.error("Unknown delete type:", deleteItem.type)
            }

            setShowDeleteModal(false)
            setDeleteItem(null)
        } catch (error: any) {
            console.error("Error deleting item:", error)
            const message = error?.response?.data?.message || `Failed to delete ${deleteItem.type}`
            showMessage(message, "error")
        } finally {
            setDeleteLoading(false)
        }
    }

    const getEntityCounts = () => {
        return {
            hospitals: hospitals.length,
            institutes: institutes.length,
            rsos: rsos.length,
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>
    }

    const counts = getEntityCounts()

    return (
        <>
            {deleteLoading && <FullScreenLoader message="Deleting item, please wait..." />}
            <div className="container mx-auto p-6">
                {/* Breadcrumb */}
                <nav className="flex text-sm text-gray-500 mb-6">
                    <Link to="/" className="hover:text-gray-700">
                        Dashboard
                    </Link>
                    <span className="mx-2">/</span>
                    <Link to="/admin/clients" className="hover:text-gray-700">
                        Clients
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">View Client Details</span>
                </nav>

                {/* Client Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <Building2 className="h-8 w-8 text-blue-500" />
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">Hospitals</h3>
                                <p className="text-2xl font-bold text-blue-600">{counts.hospitals}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <GraduationCap className="h-8 w-8 text-green-500" />
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">Institutes</h3>
                                <p className="text-2xl font-bold text-green-600">{counts.institutes}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-purple-500" />
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">RSOs</h3>
                                <p className="text-2xl font-bold text-purple-600">{counts.rsos}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab("hospitals")}
                                className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === "hospitals"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                Hospitals ({counts.hospitals})
                            </button>
                            <button
                                onClick={() => setActiveTab("institutes")}
                                className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === "institutes"
                                        ? "border-green-500 text-green-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                Institutes ({counts.institutes})
                            </button>
                            <button
                                onClick={() => setActiveTab("rsos")}
                                className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === "rsos"
                                        ? "border-purple-500 text-purple-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                RSOs ({counts.rsos})
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Add Button */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {activeTab === "hospitals" && "Hospitals"}
                                {activeTab === "institutes" && "Institutes"}
                                {activeTab === "rsos" && "RSOs"}
                            </h3>
                            <button
                                onClick={() => handleAddEntity(activeTab)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add {activeTab.slice(0, -1)}
                            </button>
                        </div>

                        {/* Hospitals Tab */}
                        {activeTab === "hospitals" && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Address
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Phone
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                GST No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Branch
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {hospitals.map((hospital) => (
                                            <tr key={hospital.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {hospital.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.address}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.phone}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.gstNo}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.branch}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEditEntity(hospital._id || hospital.id, "hospital")}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                "hospital",
                                                                hospital._id || hospital.id,
                                                                hospital.name || `Hospital ${hospital._id || hospital.id}`,
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {hospitals.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                    No hospitals found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Institutes Tab */}
                        {activeTab === "institutes" && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Elora ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Phone
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {institutes.map((institute) => (
                                            <tr key={institute.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{institute.eloraId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{institute.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{institute.phone}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEditEntity(institute._id || institute.id, "institute")}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                "institute",
                                                                institute._id || institute.id,
                                                                institute.name || institute.eloraId || `Institute ${institute._id || institute.id}`,
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {institutes.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                                    No institutes found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* RSOs Tab */}
                        {activeTab === "rsos" && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                RSO ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Phone
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                RP ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                TLD Badge
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Validity
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {rsos.map((rso) => (
                                            <tr key={rso.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rso.rsoId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rso.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rso.phone}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rso.rpId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rso.tldBadge}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rso.validity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEditEntity(rso._id || rso.id, "rso")}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                "rso",
                                                                rso._id || rso.id,
                                                                rso.name || rso.rsoId || `RSO ${rso._id || rso.id}`,
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {rsos.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                                    No RSOs found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && deleteItem && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                    <Trash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mt-4">Delete {deleteItem.type}</h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-gray-500">
                                        Are you sure you want to delete "{deleteItem.name}"? This action cannot be undone.
                                    </p>
                                </div>
                                <div className="items-center px-4 py-3">
                                    <button
                                        onClick={handleDeleteConfirm}
                                        disabled={deleteLoading}
                                        className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 disabled:opacity-50"
                                    >
                                        {deleteLoading ? "Deleting..." : "Delete"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false)
                                            setDeleteItem(null)
                                        }}
                                        disabled={deleteLoading}
                                        className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default ViewClients
