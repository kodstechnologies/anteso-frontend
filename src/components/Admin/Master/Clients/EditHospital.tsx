"use client"

import * as Yup from "yup"
import { Field, Form, Formik } from "formik"
import { Link, useNavigate, useParams } from "react-router-dom"
import { showMessage } from "../../../common/ShowMessage"
import { useState, useEffect } from "react"
import FullScreenLoader from "../../../common/FullScreenLoader"
// You'll need to create these API functions
import { getHospitalByClientIdAndHospitalId, editHospitalByClientIDandHospitalId } from "../../../../api"

interface HospitalData {
  name: string
  address: string
  phone: string
  gstNo: string
  branch: string
}

const EditHospital = () => {
  const navigate = useNavigate()
  const { clientId, hospitalId } = useParams()
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<HospitalData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

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
    const fetchHospitalData = async () => {
      try {
        setDataLoading(true)
        const response = await getHospitalByClientIdAndHospitalId(clientId, hospitalId)
        console.log("🚀 ~ fetchHospitalData ~ response:", response)

        const hospitalData = response.data || response
        setInitialData({
          name: hospitalData.name || "",
          address: hospitalData.address || "",
          phone: hospitalData.phone || "",
          gstNo: hospitalData.gstNo || "",
          branch: hospitalData.branch || "",
        })
      } catch (error) {
        console.error("Error fetching hospital data:", error)
        showMessage("Failed to load hospital data", "error")
        navigate(`/admin/clients/preview/${clientId}`)
      } finally {
        setDataLoading(false)
      }
    }

    if (hospitalId) {
      fetchHospitalData()
    }
  }, [hospitalId, clientId, navigate])

  if (dataLoading) {
    return <div className="flex justify-center items-center h-64">Loading hospital data...</div>
  }

  if (!initialData) {
    return <div className="flex justify-center items-center h-64">Hospital not found</div>
  }

  return (
    <>
      {loading && <FullScreenLoader message="Updating hospital, please wait..." />}
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
          <Link to={`/admin/clients/preview/${clientId}`} className="text-primary">
            Client Details
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Edit Hospital
          </Link>
        </li>
      </ol>
      <Formik
        initialValues={initialData}
        validationSchema={SubmittedForm}
        enableReinitialize={true}
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          setLoading(true)
          try {
            const response = await editHospitalByClientIDandHospitalId(clientId, hospitalId, values)
            console.log("🚀 ~ onSubmit={ ~ response:", response)
            showMessage("Hospital updated successfully!", "success")
            navigate(`/admin/clients/preview/${clientId}`)
          } catch (error: any) {
            const message = error?.response?.data?.message
            console.log("🚀 ~ onSubmit ~ message:", message)
            if (message?.includes("phone")) {
              setFieldError("phone", message)
            } else if (message?.includes("gstNo")) {
              setFieldError("gstNo", message)
            } else {
              showMessage(message || "Failed to update hospital", "error")
            }
          } finally {
            setSubmitting(false)
            setLoading(false)
          }
        }}
      >
        {({ errors, submitCount, touched }) => (
          <Form className="space-y-5">
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Edit Hospital Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className={submitCount ? (errors.name ? "has-error" : "has-success") : ""}>
                  <label htmlFor="name">Name </label>
                  <Field name="name" type="text" id="name" placeholder="Enter Hospital Name" className="form-input" />
                  {submitCount && errors.name ? <div className="text-danger mt-1">{errors.name}</div> : null}
                </div>
                <div className={submitCount ? (errors.address ? "has-error" : "has-success") : ""}>
                  <label htmlFor="address">Address </label>
                  <Field name="address" type="text" id="address" placeholder="Enter Address" className="form-input" />
                  {submitCount && errors.address ? <div className="text-danger mt-1">{errors.address}</div> : ""}
                </div>
                <div className={submitCount ? (errors.phone ? "has-error" : "has-success") : ""}>
                  <label htmlFor="phone">Phone </label>
                  <Field
                    name="phone"
                    type="text"
                    id="phone"
                    placeholder="Enter Phone Number"
                    className="form-input"
                    maxLength={10}
                  />
                  {submitCount && errors.phone ? <div className="text-danger mt-1">{errors.phone}</div> : ""}
                </div>
                <div className={submitCount ? (errors.gstNo ? "has-error" : "has-success") : ""}>
                  <label htmlFor="gstNo">GST Number </label>
                  <Field
                    name="gstNo"
                    type="text"
                    id="gstNo"
                    placeholder="Enter GST Number"
                    className="form-input"
                    maxLength={15}
                  />                  {submitCount && errors.gstNo ? <div className="text-danger mt-1">{errors.gstNo}</div> : ""}
                </div>
                <div className={submitCount ? (errors.branch ? "has-error" : "has-success") : ""}>
                  <label htmlFor="branch">Branch </label>
                  <Field name="branch" type="text" id="branch" placeholder="Enter Branch" className="form-input" />
                  {submitCount && errors.branch ? <div className="text-danger mt-1">{errors.branch}</div> : ""}
                </div>
              </div>
            </div>
            <div className="w-full mb-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(`/admin/clients/preview/${clientId}`)}
                className="btn btn-outline-danger !mt-6"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-success !mt-6">
                Update Hospital
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  )
}

export default EditHospital
