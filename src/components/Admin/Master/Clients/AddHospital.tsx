
import * as Yup from "yup"
import { Field, Form, Formik } from "formik"
import { Link, useNavigate, useParams } from "react-router-dom"
import { showMessage } from "../../../common/ShowMessage"
import { useState, useEffect } from "react"
import FullScreenLoader from "../../../common/FullScreenLoader"
import { Plus, Edit, Trash2, GraduationCap, Shield } from "lucide-react"
import {
  createHospitalByClientId,
  getAllIstitutesByhospitalId,
  getAllRsosByhospitalId,
  deleteInstituteByHospitalIdAndInstituteId,
  deleteRsoByHospitalIdAndRsoId,
} from "../../../../api"

// Define interfaces
interface Institute {
  id: number
  _id?: string
  eloraId: string
  password: string
  email: string
  phone: string
  name?: string
}

interface RSO {
  id: number
  _id?: string
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

const AddHospital = () => {
  const navigate = useNavigate()
  const { clientId, hospitalId } = useParams()
  console.log("🚀 ~ AddHospital ~ clientId:", clientId)

  console.log("🚀 ~  ~ hospitalId:", hospitalId)

  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [institutes, setInstitutes] = useState<Institute[]>([])
  const [rsos, setRsos] = useState<RSO[]>([])
  const [activeTab, setActiveTab] = useState<"institutes" | "rsos">("institutes")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: number | string; name: string } | null>(null)

  const SubmittedForm = Yup.object().shape({
    name: Yup.string().required("Please fill the Field"),
    address: Yup.string().required("Please fill the Field"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
      .required("Please fill the Field"),
    gstNo: Yup.string().required("Please fill the Field"),
    branch: Yup.string().required("Please fill the Field"),
  })

  // Fetch institutes and RSOs on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (hospitalId) {
        try {
          const [instituteData, rsoData] = await Promise.all([
            getAllIstitutesByhospitalId(hospitalId),
            getAllRsosByhospitalId(hospitalId),
          ])

          setInstitutes(instituteData.data || [])
          setRsos(rsoData.data || [])
        } catch (error) {
          console.error("Error fetching data:", error)
          setInstitutes([])
          setRsos([])
        }
      }
    }
    fetchData()
  }, [hospitalId])

  const handleAddEntity = (entityType: "institute" | "rso") => {
    navigate(`/admin/clients/preview/${clientId}/${hospitalId}/add-${entityType}`)
  }

  const handleEditEntity = (entityId: number | string, entityType: "institute" | "rso") => {
    console.log("Navigating to edit with ID:", entityId, "Entity Type:", entityType)
    navigate(`/admin/clients/preview/${hospitalId}/edit-${entityType}/${entityId}`)
  }

  const handleDeleteClick = (type: string, id: number | string, name: string) => {
    setDeleteItem({ type, id, name })
    setShowDeleteModal(true)
  }
  const handleDeleteConfirm = async () => {
    if (!deleteItem || !hospitalId) return

    setDeleteLoading(true)
    try {
      switch (deleteItem.type) {
        case "institute":
          await deleteInstituteByHospitalIdAndInstituteId(hospitalId, deleteItem.id)
          setInstitutes(institutes.filter((i) => (i._id || i.id) !== deleteItem.id))
          showMessage("Institute deleted successfully!", "success")
          break
        case "rso":
          await deleteRsoByHospitalIdAndRsoId(hospitalId, deleteItem.id)
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

  return (
    <>
      {(loading || deleteLoading) && (
        <FullScreenLoader message={loading ? "Adding hospital, please wait..." : "Deleting item, please wait..."} />
      )}

      {/* Breadcrumb */}
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
        <li>
          <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Dashboard
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="/admin/clients" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Clients
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to={`/admin/clients/preview/${hospitalId}`} className="text-primary">
            Client Details
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            View Hospital
          </Link>
        </li>
      </ol>

      {/* Hospital Form */}


      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Institutes</h3>
              <p className="text-2xl font-bold text-green-600">{institutes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">RSOs</h3>
              <p className="text-2xl font-bold text-purple-600">{rsos.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Institutes and RSOs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("institutes")}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === "institutes"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Institutes ({institutes.length})
            </button>
            <button
              onClick={() => setActiveTab("rsos")}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === "rsos"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              RSOs ({rsos.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Institutes Tab */}
          {activeTab === "institutes" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Institutes</h3>
                <button
                  onClick={() => handleAddEntity("institute")}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Institute
                </button>
              </div>
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
                      <tr key={institute._id || institute.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{institute.eloraId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{institute.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{institute.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditEntity(institute._id || institute.id, "institute")}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Edit Institute"
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
                            title="Delete Institute"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {institutes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          No institutes found. Click "Add Institute" to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* RSOs Tab */}
          {activeTab === "rsos" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">RSOs</h3>
                <button
                  onClick={() => handleAddEntity("rso")}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add RSO
                </button>
              </div>
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
                      <tr key={rso._id || rso.id}>
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
                            title="Edit RSO"
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
                            title="Delete RSO"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rsos.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No RSOs found. Click "Add RSO" to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
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
    </>
  )
}

export default AddHospital
