"use client"

import * as Yup from "yup"
import { Field, Form, Formik } from "formik"
import { Link, useNavigate, useParams } from "react-router-dom"
import { showMessage } from "../../../common/ShowMessage"
import { useState } from "react"
import FullScreenLoader from "../../../common/FullScreenLoader"
import { createRsoByHospitalId } from "../../../../api"

const AddRso = () => {
  const navigate = useNavigate()
  const { hospitalId } = useParams()
  console.log("🚀 ~ AddRso ~ hospitalId:", hospitalId)
  const [loading, setLoading] = useState(false)

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
    attachFile: Yup.mixed(),
  })

  return (
    <>
      {loading && <FullScreenLoader message="Adding RSO, please wait..." />}
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
            RSOs
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Add RSO
          </Link>
        </li>
      </ol>
      <Formik
        initialValues={{
          rsoId: "",
          password: "",
          email: "",
          phone: "",
          rpId: "",
          tldBadge: "",
          validity: "",
          attachFile: "",
        }}
        validationSchema={SubmittedForm}
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          setLoading(true)
          try {
            const formData = new FormData()

            Object.keys(values).forEach((key) => {
              if (key === "attachFile" && values[key]) {
                formData.append(key, values[key])
              } else if (key !== "attachFile") {
                formData.append(key, values[key])
              }
            })

            const response = await createRsoByHospitalId(hospitalId, formData)
            console.log("🚀 ~ onSubmit={ ~ response:", response)
            showMessage("RSO added successfully!", "success")
            navigate(`/admin/clients/preview/${hospitalId}/rso`)
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
              showMessage(message || "Failed to add RSO", "error")
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
              <h5 className="font-semibold text-lg mb-4">RSO Details</h5>
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
                    type="text"
                    id="phone"
                    placeholder="Enter Phone Number"
                    className="form-input"
                    maxLength={10}
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
                  <label htmlFor="attachFile">Attach File </label>
                  <input
                    name="attachFile"
                    type="file"
                    id="attachFile"
                    className="form-input"
                  // onChange={(event) => {
                  //   setFieldValue("attachFile", event.currentTarget.files[0])
                  // }}
                  />
                  {submitCount && errors.attachFile ? <div className="text-danger mt-1">{errors.attachFile}</div> : ""}
                </div>
              </div>
            </div>
            <div className="w-full mb-6 flex justify-end">
              <button type="submit" className="btn btn-success !mt-6">
                Submit Form
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  )
}

export default AddRso
