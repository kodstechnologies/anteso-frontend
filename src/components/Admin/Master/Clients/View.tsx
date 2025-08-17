"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Edit, Trash2, Building2, Eye } from "lucide-react"
import * as Yup from "yup"
import { Field, Form, Formik } from "formik"
import {
  getAllClients,
  getAllHospitalsByClientId,
  deleteHospitalByClientIdAndHospitalId,
  createHospitalByClientId,
} from "../../../../api"
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
  equipment: Equipment[]
}

const ViewClients: React.FC = () => {
  const navigate = useNavigate()
  const { clientId } = useParams()
  console.log("🚀 ~ ViewClients ~ clientId:", clientId)

  const [clients, setClients] = useState<Client[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients data
        const clientsRes = await getAllClients()
        console.log("🚀 ~ fetchClients ~ res:", clientsRes.data.clients)
        setClients(clientsRes?.data?.clients || [])

        // If clientId is provided, fetch hospital data
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
      const hospitalData = await getAllHospitalsByClientId(id)
      console.log("Hospitals:", hospitalData)

      // Update state with fetched data
      setHospitals(hospitalData.data || [])
    } catch (error) {
      console.error("Error fetching hospital data:", error)
      // Set empty array on error
      setHospitals([])
    }
  }

  const handleViewClient = async (client: Client) => {
    setSelectedClient(client)
    await fetchClientData(client.id.toString())
  }

  const handleEditHospital = (hospitalId: number | string) => {
    console.log("Navigating to edit hospital with ID:", hospitalId)
    navigate(`/admin/clients/preview/${clientId}/edit-hospital/${hospitalId}`)
  }

  const handleViewHospital = (hospitalId: number | string) => {
    navigate(`/admin/clients/preview/${clientId}/${hospitalId}`)
  }

  const handleDeleteClick = (id: number | string, name: string) => {
    setDeleteItem({ type: "hospital", id, name })
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem || !clientId) return

    setDeleteLoading(true)
    try {
      await deleteHospitalByClientIdAndHospitalId(clientId, deleteItem.id)
      setHospitals(hospitals.filter((h) => (h._id || h.id) !== deleteItem.id))
      showMessage("Hospital deleted successfully!", "success")
      setShowDeleteModal(false)
      setDeleteItem(null)
    } catch (error: any) {
      console.error("Error deleting hospital:", error)
      const message = error?.response?.data?.message || "Failed to delete hospital"
      showMessage(message, "error")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <>
      {deleteLoading && <FullScreenLoader message="Deleting hospital, please wait..." />}
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
          <span className="text-gray-900">View Client Hospitals</span>
        </nav>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Hospitals</h3>
                <p className="text-2xl font-bold text-blue-600">{hospitals.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md mb-6">

          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Hospital</h3>
            <Formik
              initialValues={{
                name: "",
                address: "",
                phone: "",
                gstNo: "",
                branch: "",
              }}
              validationSchema={SubmittedForm}
              onSubmit={async (values, { setSubmitting, setFieldError, resetForm }) => {
                setLoading(true)
                try {
                  const response = await createHospitalByClientId(clientId, values)
                  console.log("🚀 ~ onSubmit={ ~ response:", response)
                  showMessage("Hospital added successfully!", "success")
                  resetForm()
                  // Refresh hospital data
                  await fetchClientData(clientId!)
                } catch (error: any) {
                  const message = error?.response?.data?.message
                  console.log("🚀 ~ onSubmit ~ message:", message)
                  if (message?.includes("phone")) {
                    setFieldError("phone", message)
                  } else if (message?.includes("gstNo")) {
                    setFieldError("gstNo", message)
                  } else {
                    showMessage(message || "Failed to add hospital", "error")
                  }
                } finally {
                  setSubmitting(false)
                  setLoading(false)
                }
              }}
            >
              {({ errors, submitCount, touched }) => (
                <Form className="space-y-5">

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className={submitCount ? (errors.name ? "has-error" : "has-success") : ""}>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <Field
                        name="name"
                        type="text"
                        id="name"
                        placeholder="Enter Hospital Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {submitCount && errors.name ? (
                        <div className="text-red-500 text-sm mt-1">{errors.name}</div>
                      ) : null}
                    </div>
                    <div className={submitCount ? (errors.address ? "has-error" : "has-success") : ""}>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <Field
                        name="address"
                        type="text"
                        id="address"
                        placeholder="Enter Address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {submitCount && errors.address ? (
                        <div className="text-red-500 text-sm mt-1">{errors.address}</div>
                      ) : (
                        ""
                      )}
                    </div>
                    <div className={submitCount ? (errors.phone ? "has-error" : "has-success") : ""}>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <Field
                        name="phone"
                        type="text"
                        id="phone"
                        placeholder="Enter Phone Number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={10}
                      />
                      {submitCount && errors.phone ? (
                        <div className="text-red-500 text-sm mt-1">{errors.phone}</div>
                      ) : (
                        ""
                      )}
                    </div>
                    <div className={submitCount ? (errors.gstNo ? "has-error" : "has-success") : ""}>
                      <label htmlFor="gstNo" className="block text-sm font-medium text-gray-700 mb-1">
                        GST Number
                      </label>
                      <Field
                        name="gstNo"
                        type="text"
                        id="gstNo"
                        placeholder="Enter GST Number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={15}
                      />
                      {submitCount && errors.gstNo ? (
                        <div className="text-red-500 text-sm mt-1">{errors.gstNo}</div>
                      ) : (
                        ""
                      )}
                    </div>
                    <div className={submitCount ? (errors.branch ? "has-error" : "has-success") : ""}>
                      <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                        Branch
                      </label>
                      <Field
                        name="branch"
                        type="text"
                        id="branch"
                        placeholder="Enter Branch"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {submitCount && errors.branch ? (
                        <div className="text-red-500 text-sm mt-1">{errors.branch}</div>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
                    >
                      Add Hospital
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        {/* Hospital Overview Card */}


        {/* Hospitals Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Hospitals</h3>
            </div>

            {/* Hospitals Table */}
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
                      Email
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
                    <tr key={hospital._id || hospital.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hospital.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.email || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.gstNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hospital.branch}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewHospital(hospital._id || hospital.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="View Hospital"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditHospital(hospital._id || hospital.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          title="Edit Hospital"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteClick(
                              hospital._id || hospital.id,
                              hospital.name || `Hospital ${hospital._id || hospital.id}`,
                            )
                          }
                          className="text-red-600 hover:text-red-900"
                          title="Delete Hospital"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {hospitals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No hospitals found. Use the form above to add a hospital.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ViewClients
