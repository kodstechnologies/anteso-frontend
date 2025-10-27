// Updated EditInstitute component
"use client"

import * as Yup from "yup"
import { Field, Form, Formik } from "formik"
import { Link, useNavigate, useParams } from "react-router-dom"
import { showMessage } from "../../../common/ShowMessage"
import { useState, useEffect } from "react"
import FullScreenLoader from "../../../common/FullScreenLoader"
// You'll need to create these API functions
import { getInstituteByHospitalIdAndInstituteId, editInstituteByHospitalIdandInstituteId } from "../../../../api"

interface InstituteData {
  eloraId: string
  password: string
  email: string
  phone: string
}

const EditInstitute = () => {
  const navigate = useNavigate()
  const { clientId, hospitalId, instituteId } = useParams<{ clientId: string; hospitalId: string; instituteId: string }>()
  console.log("🚀 ~ EditInstitute ~ instituteId:", instituteId)
  console.log("🚀 ~ EditInstitute ~ hospitalId:", hospitalId)
  console.log("🚀 ~ EditInstitute ~ clientId:", clientId)
  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState<InstituteData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const SubmittedForm = Yup.object().shape({
    eloraId: Yup.string().required("Please fill the Field"),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Please fill the Field"),
    email: Yup.string().email("Invalid email").required("Please fill the Email"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
      .required("Please fill the Field"),
  })

  useEffect(() => {
    const fetchInstituteData = async () => {
      if (!hospitalId || !instituteId) {
        showMessage("Invalid institute data", "error")
        navigate(`/admin/clients/preview/${clientId}/${hospitalId}`)
        return
      }
      try {
        setDataLoading(true)
        const response = await getInstituteByHospitalIdAndInstituteId(hospitalId, instituteId)
        console.log("🚀 ~ fetchInstituteData ~ response:", response)

        const instituteData = response.data || response
        setInitialData({
          eloraId: instituteData.eloraId || "",
          password: instituteData.password || "",
          email: instituteData.email || "",
          phone: instituteData.phone || "",
        })
      } catch (error) {
        console.error("Error fetching institute data:", error)
        showMessage("Failed to load institute data", "error")
        navigate(`/admin/clients/preview/${clientId}/${hospitalId}`)
      } finally {
        setDataLoading(false)
      }
    }

    fetchInstituteData()
  }, [instituteId, hospitalId, clientId, navigate])

  if (dataLoading) {
    return <div className="flex justify-center items-center h-64">Loading institute data...</div>
  }

  if (!initialData) {
    return <div className="flex justify-center items-center h-64">Institute not found</div>
  }

  return (
    <>
      {loading && <FullScreenLoader message="Updating institute, please wait..." />}
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
            Edit Institute
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
            const response = await editInstituteByHospitalIdandInstituteId(hospitalId, instituteId, values)
            console.log("🚀 ~ onSubmit={ ~ response:", response)
            showMessage("Institute updated successfully!", "success")
            navigate(`/admin/clients/preview/${clientId}/${hospitalId}`)
          } catch (error: any) {
            const message = error?.response?.data?.message
            console.log("🚀 ~ onSubmit ~ message:", message)
            if (message?.includes("email")) {
              setFieldError("email", message)
            } else if (message?.includes("phone")) {
              setFieldError("phone", message)
            } else if (message?.includes("eloraId")) {
              setFieldError("eloraId", message)
            } else {
              showMessage(message || "Failed to update institute", "error")
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
              <h5 className="font-semibold text-lg mb-4">Edit Institute Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className={submitCount ? (errors.eloraId ? "has-error" : "has-success") : ""}>
                  <label htmlFor="eloraId">ELORA ID </label>
                  <Field name="eloraId" type="text" id="eloraId" placeholder="Enter ELORA ID" className="form-input" />
                  {submitCount && errors.eloraId ? <div className="text-danger mt-1">{errors.eloraId}</div> : null}
                </div>
                <div className={submitCount ? (errors.password ? "has-error" : "has-success") : ""}>
                  <label htmlFor="password">Password </label>
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
                    type="text"
                    id="phone"
                    placeholder="Enter Phone Number"
                    className="form-input"
                    maxLength={10}
                  />
                  {submitCount && errors.phone ? <div className="text-danger mt-1">{errors.phone}</div> : ""}
                </div>
              </div>
            </div>
            <div className="w-full mb-6 flex justify-end gap-4">

              <button type="submit" className="btn btn-success !mt-6">
                Update Institute
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  )
}

export default EditInstitute