"use client"

import * as Yup from "yup"
import { Field, Form, Formik } from "formik"
import { Link, useNavigate, useParams } from "react-router-dom"
import { showMessage } from "../../../common/ShowMessage"
import { useState, useEffect } from "react"
import FullScreenLoader from "../../../common/FullScreenLoader"
// You'll need to create these API functions
import { getRsoByHospitalIdAndRsoId, editRsohospitalIdandRsoId } from "../../../../api"

interface RsoData {
  rsoId: string
  password: string
  email: string
  phone: string
  rpId: string
  tldBadge: string
  validity: string
  attachFile?: File | null
}

const EditRso = () => {
  const navigate = useNavigate()
  const { clientId, rsoId } = useParams()
  console.log("🚀 ~ EditRso ~ rsoId:", rsoId)
  console.log("🚀 ~ EditRso ~ clientId:", clientId)
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<RsoData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const SubmittedForm = Yup.object().shape({
    rsoId: Yup.string().required("Please fill the Field"),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Please fill the Field"),
    email: Yup.string().email("Invalid email").required("Please fill the Email"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
      .required("Please fill the Field"),
    rpId: Yup.string().required("Please fill the Field"),
    tldBadge: Yup.string().required("Please fill the Field"),
    validity: Yup.date().required("Please fill the Field"),
    attachFile: Yup.mixed().nullable(), // Optional for edit
  })
  
  useEffect(() => {
    const fetchRsoData = async () => {
      try {
        setDataLoading(true)
        console.log("🚀 ~ fetchRsoData ~ rsoId:", rsoId)
        console.log("🚀 ~ fetchRsoData ~ clientId:", clientId)
        const response = await getRsoByHospitalIdAndRsoId(clientId, rsoId)

        console.log("🚀 ~ fetchRsoData ~ response:", response)

        const rsoData = response.data || response
        setInitialData({
          rsoId: rsoData.rsoId || "",
          password: rsoData.password || "",
          email: rsoData.email || "",
          phone: rsoData.phone || "",
          rpId: rsoData.rpId || "",
          tldBadge: rsoData.tldBadge || "",
          validity: rsoData.validity || "",
          attachFile: null,
        })
      } catch (error) {
        console.error("Error fetching RSO data:", error)
        showMessage("Failed to load RSO data", "error")
        navigate(`/admin/clients/preview/${clientId}`)
      } finally {
        setDataLoading(false)
      }
    }

    if (rsoId) {
      fetchRsoData()
    }
  }, [rsoId, clientId, navigate])

  if (dataLoading) {
    return <div className="flex justify-center items-center h-64">Loading RSO data...</div>
  }

  if (!initialData) {
    return <div className="flex justify-center items-center h-64">RSO not found</div>
  }

  return (
    <>
      {loading && <FullScreenLoader message="Updating RSO, please wait..." />}
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
            Edit RSO
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
            const formData = new FormData()
            Object.keys(values).forEach((key) => {
              if (key === "attachFile" && values[key]) {
                formData.append(key, values[key])
              } else if (key !== "attachFile") {
                // formData.append(key, values[key])
              }
            })

            const response = await editRsohospitalIdandRsoId(clientId, rsoId, formData)
            console.log("🚀 ~ onSubmit={ ~ response:", response)
            showMessage("RSO updated successfully!", "success")
            navigate(`/admin/clients/preview/${clientId}`)
          } catch (error: any) {
            const message = error?.response?.data?.message
            console.log("🚀 ~ onSubmit ~ message:", message)
            if (message?.includes("email")) {
              setFieldError("email", message)
            } else if (message?.includes("phone")) {
              setFieldError("phone", message)
            } else if (message?.includes("rsoId")) {
              setFieldError("rsoId", message)
            } else {
              showMessage(message || "Failed to update RSO", "error")
            }
          } finally {
            setSubmitting(false)
            setLoading(false)
          }
        }}
      >
        {({ errors, submitCount, touched, setFieldValue }) => (
          <Form className="space-y-5">
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Edit RSO Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className={submitCount ? (errors.rsoId ? "has-error" : "has-success") : ""}>
                  <label htmlFor="rsoId">RSO ID </label>
                  <Field name="rsoId" type="text" id="rsoId" placeholder="Enter RSO ID" className="form-input" />
                  {submitCount && errors.rsoId ? <div className="text-danger mt-1">{errors.rsoId}</div> : null}
                </div>
                <div className={submitCount ? (errors.password ? "has-error" : "has-success") : ""}>
                  <label htmlFor="password">Password </label>
                  <Field
                    name="password"
                    type="password"
                    id="password"
                    placeholder="Enter Password"
                    className="form-input"
                  />
                  {submitCount && errors.password ? <div className="text-danger mt-1">{errors.password}</div> : ""}
                </div>
                <div className={submitCount ? (errors.email ? "has-error" : "has-success") : ""}>
                  <label htmlFor="email">Email </label>
                  <Field
                    name="email"
                    type="email"
                    id="email"
                    placeholder="Enter Email Address"
                    className="form-input"
                  />
                  {submitCount && errors.email ? <div className="text-danger mt-1">{errors.email}</div> : ""}
                </div>
                <div className={submitCount ? (errors.phone ? "has-error" : "has-success") : ""}>
                  <label htmlFor="phone">Phone </label>
                  <Field
                    name="phone"
                    type="number"
                    id="phone"
                    placeholder="Enter Phone Number"
                    className="form-input"
                  />
                  {submitCount && errors.phone ? <div className="text-danger mt-1">{errors.phone}</div> : ""}
                </div>
                <div className={submitCount ? (errors.rpId ? "has-error" : "has-success") : ""}>
                  <label htmlFor="rpId">RP ID </label>
                  <Field name="rpId" type="text" id="rpId" placeholder="Enter RP ID" className="form-input" />
                  {submitCount && errors.rpId ? <div className="text-danger mt-1">{errors.rpId}</div> : ""}
                </div>
                <div className={submitCount ? (errors.tldBadge ? "has-error" : "has-success") : ""}>
                  <label htmlFor="tldBadge">TLD Badge </label>
                  <Field
                    name="tldBadge"
                    type="text"
                    id="tldBadge"
                    placeholder="Enter TLD Badge"
                    className="form-input"
                  />
                  {submitCount && errors.tldBadge ? <div className="text-danger mt-1">{errors.tldBadge}</div> : ""}
                </div>
                <div className={submitCount ? (errors.validity ? "has-error" : "has-success") : ""}>
                  <label htmlFor="validity">Validity </label>
                  <Field name="validity" type="date" id="validity" className="form-input" />
                  {submitCount && errors.validity ? <div className="text-danger mt-1">{errors.validity}</div> : ""}
                </div>
                <div className={submitCount ? (errors.attachFile ? "has-error" : "has-success") : ""}>
                  <label htmlFor="attachFile">Attach File (Optional) </label>
                  <input
                    name="attachFile"
                    type="file"
                    id="attachFile"
                    className="form-input"
                    onChange={(event) => {
                      setFieldValue("attachFile", event.currentTarget.files?.[0] || null)
                    }}
                  />
                  {submitCount && errors.attachFile ? <div className="text-danger mt-1">{errors.attachFile}</div> : ""}
                  <small className="text-gray-500">Leave empty to keep existing file</small>
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
                Update RSO
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  )
}

export default EditRso
