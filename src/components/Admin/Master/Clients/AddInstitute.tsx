
import * as Yup from "yup"
import { Field, Form, Formik } from "formik"
import { Link, useNavigate, useParams } from "react-router-dom"
import { showMessage } from "../../../common/ShowMessage"
import { useState } from "react"
import FullScreenLoader from "../../../common/FullScreenLoader"
import { createInstituteByClientId } from "../../../../api"

const AddInstitute = () => {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const [loading, setLoading] = useState(false)

  const SubmittedForm = Yup.object().shape({
    eloraId: Yup.string().required("Please fill the Field"),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Please fill the Field"),
    email: Yup.string().email("Invalid email").required("Please fill the Email"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
      .required("Please fill the Field"),
  })

  return (
    <>
      {loading && <FullScreenLoader message="Adding institute, please wait..." />}
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
          <Link to={`/admin/clients/${clientId}/institutes`} className="text-primary">
            Institutes
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Add Institute
          </Link>
        </li>
      </ol>
      <Formik
        initialValues={{
          eloraId: "",
          password: "",
          email: "",
          phone: "",
        }}
        validationSchema={SubmittedForm}
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          setLoading(true)
          try {
            const response = await createInstituteByClientId(clientId, values)
            console.log("🚀 ~ onSubmit={ ~ response:", response)
            showMessage("Institute added successfully!", "success")
            navigate(`/admin/clients/preview/${clientId}`)
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
              showMessage(message || "Failed to add institute", "error")
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
              <h5 className="font-semibold text-lg mb-4">Institute Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className={submitCount ? (errors.eloraId ? "has-error" : "has-success") : ""}>
                  <label htmlFor="eloraId">ELORA ID </label>
                  <Field name="eloraId" type="text" id="eloraId" placeholder="Enter ELORA ID" className="form-input" />
                  {submitCount && errors.eloraId ? <div className="text-danger mt-1">{errors.eloraId}</div> : null}
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

export default AddInstitute
