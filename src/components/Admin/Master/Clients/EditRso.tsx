"use client"

import * as Yup from "yup"
import { Field, Form, Formik } from "formik"
import { Link, useNavigate, useParams } from "react-router-dom"
import { showMessage } from "../../../common/ShowMessage"
import { useState, useEffect } from "react"
import FullScreenLoader from "../../../common/FullScreenLoader"
import { getRsoByHospitalIdAndRsoId, editRsohospitalIdandRsoId } from "../../../../api"

interface RsoData {
  rsoId: string
  password: string
  email: string
  phone: string
  rpId: string
  tldBadge: string
  validity: string
  attachment?: string | File
}

const EditRSO = () => {
  const navigate = useNavigate()
  const { clientId, hospitalId, rsoId } = useParams<{ clientId: string; hospitalId: string; rsoId: string }>()
  console.log("EditRSO rsoId:", rsoId)
  console.log("EditRSO hospitalId:", hospitalId)
  console.log("EditRSO clientId:", clientId)
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<RsoData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const SubmittedForm = Yup.object().shape({
    rsoId: Yup.string().required("Please fill the RSO ID"),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Please fill the Password"),
    email: Yup.string().email("Invalid email").required("Please fill the Email"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
      .required("Please fill the Phone"),
    rpId: Yup.string().required("Please fill the RP ID"),
    tldBadge: Yup.string().required("Please fill the TLD Badge"),
    validity: Yup.string().required("Please fill the Validity Date"),
    attachment: Yup.mixed().optional(), // No restrictions
  })

  useEffect(() => {
    const fetchRsoData = async () => {
      if (!hospitalId || !rsoId) {
        showMessage("Invalid RSO data", "error")
        navigate(`/admin/clients/preview/${clientId}/${hospitalId}`)
        return
      }
      try {
        setDataLoading(true)
        const response = await getRsoByHospitalIdAndRsoId(hospitalId, rsoId)
        console.log("fetchRsoData response:", response)

        const rsoData = response.data || response
        setInitialData({
          rsoId: rsoData.rsoId || "",
          password: rsoData.password || "",
          email: rsoData.email || "",
          phone: rsoData.phone || "",
          rpId: rsoData.rpId || "",
          tldBadge: rsoData.tldBadge || "",
          validity: rsoData.validity ? rsoData.validity.split("T")[0] : "", // Format date for input
          attachment: rsoData.attachment || "",
        })
      } catch (error) {
        console.error("Error fetching RSO data:", error)
        showMessage("Failed to load RSO data", "error")
        navigate(`/admin/clients/preview/${clientId}/${hospitalId}`)
      } finally {
        setDataLoading(false)
      }
    }

    fetchRsoData()
  }, [rsoId, hospitalId, clientId, navigate])

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
          <Link to={`/admin/clients/preview/${clientId}`} className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Client Details
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to={`/admin/clients/preview/${clientId}/${hospitalId}`} className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Hospital Details
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="#" className="text-primary">
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
          const formData = new FormData()

            // Append all fields except attachment
            ; (Object.keys(values) as (keyof typeof values)[]).forEach((key) => {
              if (key !== "attachment") {
                formData.append(key, values[key] as any)
              }
            })

          // Append file if selected
          if (values.attachment && values.attachment instanceof File) {
            formData.append("attachment", values.attachment)
          }

          try {
            const response = await editRsohospitalIdandRsoId(hospitalId, rsoId, formData)
            console.log("onSubmit response:", response)
            showMessage("RSO updated successfully!", "success")
            navigate(`/admin/clients/preview/${clientId}/${hospitalId}`)
          } catch (error: any) {
            const message = error?.response?.data?.message
            console.log("onSubmit message:", message)
            if (message?.includes("email")) setFieldError("email", message)
            else if (message?.includes("phone")) setFieldError("phone", message)
            else if (message?.includes("rsoId")) setFieldError("rsoId", message)
            else if (message?.includes("rpId")) setFieldError("rpId", message)
            else if (message?.includes("tldBadge")) setFieldError("tldBadge", message)
            else if (message?.includes("validity")) setFieldError("validity", message)
            else showMessage(message || "Failed to update RSO", "error")
          } finally {
            setSubmitting(false)
            setLoading(false)
          }
        }}
      >
        {({ values, setFieldValue, errors, submitCount }) => (
          <Form className="space-y-5">
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Edit RSO Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className={submitCount ? (errors.rsoId ? "has-error" : "has-success") : ""}>
                  <label htmlFor="rsoId">RSO ID</label>
                  <Field name="rsoId" type="text" id="rsoId" placeholder="Enter RSO ID" className="form-input" />
                  {submitCount && errors.rsoId ? <div className="text-danger mt-1">{errors.rsoId}</div> : null}
                </div>

                <div className={submitCount ? (errors.password ? "has-error" : "has-success") : ""}>
                  <label htmlFor="password">Password</label>
                  <div className="relative">
                    <Field
                      name="password"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Enter Password"
                      className="form-input pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {submitCount && errors.password ? <div className="text-danger mt-1">{errors.password}</div> : ""}
                </div>

                <div className={submitCount ? (errors.email ? "has-error" : "has-success") : ""}>
                  <label htmlFor="email">Email</label>
                  <Field name="email" type="email" id="email" placeholder="Enter Email Address" className="form-input" />
                  {submitCount && errors.email ? <div className="text-danger mt-1">{errors.email}</div> : ""}
                </div>

                <div className={submitCount ? (errors.phone ? "has-error" : "has-success") : ""}>
                  <label htmlFor="phone">Phone</label>
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

                <div className={submitCount ? (errors.rpId ? "has-error" : "has-success") : ""}>
                  <label htmlFor="rpId">RP ID</label>
                  <Field name="rpId" type="text" id="rpId" placeholder="Enter RP ID" className="form-input" />
                  {submitCount && errors.rpId ? <div className="text-danger mt-1">{errors.rpId}</div> : ""}
                </div>

                <div className={submitCount ? (errors.tldBadge ? "has-error" : "has-success") : ""}>
                  <label htmlFor="tldBadge">TLD Badge</label>
                  <Field name="tldBadge" type="text" id="tldBadge" placeholder="Enter TLD Badge" className="form-input" />
                  {submitCount && errors.tldBadge ? <div className="text-danger mt-1">{errors.tldBadge}</div> : ""}
                </div>

                <div className={submitCount ? (errors.validity ? "has-error" : "has-success") : ""}>
                  <label htmlFor="validity">Validity</label>
                  <Field
                    name="validity"
                    type="date"
                    id="validity"
                    placeholder="Select Validity Date"
                    className="form-input"
                  />
                  {submitCount && errors.validity ? <div className="text-danger mt-1">{errors.validity}</div> : ""}
                </div>

                {/* Attachment Field */}
                <div className={submitCount ? (errors.attachment ? "has-error" : "") : ""}>
                  <label htmlFor="attachment">Attachment (upload new file)</label>

                  {/* Current file */}
                  {initialData?.attachment && typeof initialData.attachment === "string" && (
                    <div className="mb-2 text-sm text-gray-600">
                      Current: <a href={initialData.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View File</a>
                    </div>
                  )}

                  {/* File Input */}
                  <input
                    id="attachment"
                    name="attachment"
                    type="file"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0]
                      if (file) {
                        setFieldValue("attachment", file)
                      }
                    }}
                    className="form-input file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />

                  {/* Selected file name */}
                  {values.attachment && values.attachment instanceof File && (
                    <p className="mt-1 text-sm text-green-600">Selected: {values.attachment.name}</p>
                  )}

                  {submitCount && errors.attachment ? (
                    <div className="text-danger mt-1">{errors.attachment as string}</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="w-full mb-6 flex justify-end gap-4">
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

export default EditRSO