
import type React from "react"
import { useEffect, useState } from "react"
import * as Yup from "yup"
import { FieldArray, Field, Form, Formik, ErrorMessage, type FieldProps } from "formik"
import { Link, useNavigate } from "react-router-dom"
import Select from "react-select"
import { showMessage } from "../../common/ShowMessage"
import { addEnquiry, allEmployees } from "../../../api/index" // Update this path

// Define interfaces
interface OptionType {
    value: string
    label: string
}

interface MultiSelectFieldProps {
    name: string
    options: OptionType[]
}

interface Service {
    machineType: string
    equipmentNo: string
    workType: string[]
    machineModel: string
}

interface FormValues {
    hospitalName: string
    fullAddress: string
    city: string
    district: string
    state: string
    pinCode: string
    branch: string
    contactPerson: string
    emailAddress: string
    contactNumber: string
    designation: string
    specialInstructions: string
    services: Service[]
    additionalServices: Record<string, string | undefined>
}

// Custom component for multi-select field
const MultiSelectField: React.FC<MultiSelectFieldProps> = ({ name, options }) => (
    <Field name={name}>
        {({ field, form }: FieldProps) => (
            <div>
                <Select
                    isMulti
                    options={options}
                    className="w-full" // makes it fill the container
                    classNamePrefix="select"
                    value={options.filter((option) => field.value?.includes(option.value))}
                    onChange={(selectedOptions) =>
                        form.setFieldValue(name, selectedOptions ? selectedOptions.map((option: OptionType) => option.value) : [])
                    }
                    onBlur={() => form.setFieldTouched(name, true)}
                    menuPortalTarget={document.body}
                    styles={{
                        control: (base, state) => ({
                            ...base,
                            minHeight: "38px",
                            fontSize: "0.875rem",
                            padding: "0px 4px",
                            borderColor: state.isFocused ? "#3b82f6" : base.borderColor,
                            boxShadow: state.isFocused ? "0 0 0 0px #3b82f6" : base.boxShadow,
                        }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                />
                <div className="h-4">
                    <ErrorMessage name={name} component="div" className="text-red-500 text-sm" />
                </div>
            </div>
        )}
    </Field>
)

// Constants
const serviceOptions: string[] = [
    "INSTITUTE REGISTRATION",
    "RSO REGISTRATION, NOMINATION & APPROVAL",
    "DECOMMISSIONING, PRE OWNED PROCUREMENT, QA & LICENSE",
    "PROCUREMENT",
    "TLD BADGE",
    "LEAD SHEET",
    "LEAD GLASS",
    "LEAD APRON",
    "THYROID SHIELD",
    "GONAD SHIELD",
    "OTHERS",
]

const machineOptions: OptionType[] = [
    "Fixed X-Ray",
    "Mobile X-Ray",
    "C-Arm",
    "Cath Lab/Interventional Radiology",
    "Mammography",
    "CT Scan",
    "PET CT",
    "CT Simulator",
    "OPG",
    "CBCT",
    "BMD/DEXA",
    "Dental IOPA",
    "Dental Hand Held",
    "O Arm",
    "KV Imaging (OBI)",
    "Lead Apron Test",
    "Thyroid Shield Test",
    "Gonad Shield Test",
    "Radiation Survey of Radiation Facility",
    "Others",
].map((label) => ({ label, value: label }))

const specialInstructionsOptions: string[] = [
    "Immediantely (within 1-2 days)",
    "Urgent (Within a week)",
    "Soon (Within 2-3 weeks)",
    "Not urgent (just exploring)",
]

const workTypeOptions: OptionType[] = [
    { value: "Quality Assurance Test", label: "Quality Assurance Test" },
    { value: "License for Operation", label: "License for Operation" },
    { value: "Decommissioning", label: "Decommissioning" },
    { value: "Decommissioning and Recommissioning", label: "Decommissioning and Recommissioning" },
]

const AddEnquiry: React.FC = () => {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [employeeOptions, setEmployeeOptions] = useState<{ label: string; value: string }[]>([]);
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await allEmployees();
                console.log("🚀 ~ fetchEmployees ~ data:", data);

                const options = data.map((emp: any) => ({
                    label: `${emp.name} - employee`, // Add suffix here
                    value: emp._id, // Use _id as the unique identifier
                }));

                setEmployeeOptions(options);
            } catch (err) {
                console.error('Failed to load employees', err);
            }
        };

        fetchEmployees();
    }, []);


    // Yup validation schema
    const SubmittedForm = Yup.object().shape({
        leadOwner: Yup.string().required("Please fill the Field"),
        hospitalName: Yup.string().required("Please fill the Field"),
        fullAddress: Yup.string().required("Please fill the Field"),
        city: Yup.string().required("Please fill the Field"),
        district: Yup.string().required("Please fill the Field"),
        state: Yup.string().required("Please fill the Field"),
        pinCode: Yup.string()
            .matches(/^\d{6}$/, "PIN Code must be exactly 6 digits")
            .required("PIN Code is required"),
        branch: Yup.string().required("Please fill the Field"),
        contactPerson: Yup.string().required("Please fill the Field"),
        emailAddress: Yup.string().email("Invalid email").required("Please fill the Email"),
        contactNumber: Yup.string()
            .matches(/^\d{10}$/, "Contact Number must be exactly 10 digits")
            .required("Contact Number is required"),
        designation: Yup.string().required("Please fill the Field"),
        specialInstructions: Yup.string().required("Please fill this field"),
        services: Yup.array()
            .of(
                Yup.object().shape({
                    machineType: Yup.string().required("Required"),
                    equipmentNo: Yup.string().required("Required"),
                    workType: Yup.array().min(1, "At least one work type is required"),
                    machineModel: Yup.string().required("Required"),
                }),
            )
            .min(1, "At least one service is required"),
        additionalServices: Yup.object().shape(
            serviceOptions.reduce((schema, service) => {
                return { ...schema, [service]: Yup.string().nullable() }
            }, {}),
        ),
    })

    // Form submission handler
    const submitForm = async (values: FormValues, { setSubmitting, resetForm }: any) => {
        try {
            setIsSubmitting(true)

            // Generate enquiryID (e.g., ENQ001) - replace with actual logic to fetch existing enquiries
            const enquiryCount = 1 // Placeholder: Replace with actual count from enquiriesData or API
            // const newEnquiryID = `ENQ${String(enquiryCount).padStart(3, "0")}`
            const submissionValues = { ...values, }

            console.log("Submitting form with values:", submissionValues)

            // Make API call
            const response = await addEnquiry(submissionValues)

            console.log("API Response:", response)

            // Show success message
            showMessage("Enquiry submitted successfully!", "success")

            // Reset form
            resetForm()

            // Navigate to enquiry list
            navigate("/admin/enquiry")
        } catch (error: any) {
            console.error("Error submitting enquiry:", error)

            // Show error message
            const errorMessage = error?.message || "Failed to submit enquiry. Please try again."
            showMessage(errorMessage, "error")
        } finally {
            setIsSubmitting(false)
            setSubmitting(false)
        }
    }

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/enquiry" className="text-primary">
                        Enquiry
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Add Enquiry
                    </Link>
                </li>
            </ol>
            <h5 className="font-semibold text-lg mb-4">Enquiry Form</h5>
            <Formik
                initialValues={{
                    leadOwner: "",
                    hospitalName: "",
                    fullAddress: "",
                    city: "",
                    district: "",
                    state: "",
                    pinCode: "",
                    branch: "",
                    contactPerson: "",
                    emailAddress: "",
                    contactNumber: "",
                    designation: "",
                    specialInstructions: "",
                    services: [{ machineType: "", equipmentNo: "1", workType: [], machineModel: "" }],
                    additionalServices: serviceOptions.reduce(
                        (acc, service) => {
                            acc[service] = undefined
                            return acc
                        },
                        {} as Record<string, string | undefined>,
                    ),
                    attachment: "",
                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, values, setFieldValue, isSubmitting: formikSubmitting }) => (
                    <Form className="space-y-5">
                        {/* Basic Details */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                                <div className={submitCount && errors.leadOwner ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="leadOwner">Lead Owner</label>
                                    <Field as="select" name="leadOwner" className="form-input">
                                        <option value="">Select Lead Owner</option>
                                        {employeeOptions.map((emp) => (
                                            <option key={emp.value} value={emp.value}>
                                                {emp.label}
                                            </option>
                                        ))}
                                    </Field>
                                    {submitCount && errors.leadOwner ? (
                                        <div className="text-danger mt-1">{errors.leadOwner}</div>
                                    ) : null}
                                </div>

                                <div className={submitCount && errors.hospitalName ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="hospitalName">Hospital Name</label>
                                    <Field
                                        name="hospitalName"
                                        type="text"
                                        id="hospitalName"
                                        placeholder="Enter Hospital Name"
                                        className="form-input"
                                    />
                                    {submitCount && errors.hospitalName ? (
                                        <div className="text-danger mt-1">{errors.hospitalName}</div>
                                    ) : null}
                                </div>
                                <div className={submitCount && errors.fullAddress ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="fullAddress">Full Address</label>
                                    <Field
                                        name="fullAddress"
                                        type="text"
                                        id="fullAddress"
                                        placeholder="Enter Full Address"
                                        className="form-input"
                                    />
                                    {submitCount && errors.fullAddress ? (
                                        <div className="text-danger mt-1">{errors.fullAddress}</div>
                                    ) : null}
                                </div>
                                <div className={submitCount && errors.city ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="city">City</label>
                                    <Field name="city" type="text" id="city" placeholder="Enter City Name" className="form-input" />
                                    {submitCount && errors.city ? <div className="text-danger mt-1">{errors.city}</div> : null}
                                </div>
                                <div className={submitCount && errors.district ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="district">District</label>
                                    <Field
                                        name="district"
                                        type="text"
                                        id="district"
                                        placeholder="Enter District Name"
                                        className="form-input"
                                    />
                                    {submitCount && errors.district ? <div className="text-danger mt-1">{errors.district}</div> : null}
                                </div>
                                <div className={submitCount && errors.state ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="state">State</label>
                                    <Field name="state" type="text" id="state" placeholder="Enter State Name" className="form-input" />
                                    {submitCount && errors.state ? <div className="text-danger mt-1">{errors.state}</div> : null}
                                </div>
                                <div className={submitCount && errors.pinCode ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="pinCode">PIN Code</label>
                                    <Field
                                        name="pinCode"
                                        type="text"
                                        id="pinCode"
                                        placeholder="Enter PIN Code"
                                        className="form-input"
                                        maxLength={6} // ✅ Prevent more than 6 digits
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/[^0-9]/g, ""); // ✅ Allow only numbers
                                        }}
                                    />
                                    {submitCount && errors.pinCode ? (
                                        <div className="text-danger mt-1">{errors.pinCode}</div>
                                    ) : null}
                                </div>

                                <div className={submitCount && errors.branch ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="branch">Branch Name</label>
                                    <Field name="branch" type="text" id="branch" placeholder="Enter Branch Name" className="form-input" />
                                    {submitCount && errors.branch ? <div className="text-danger mt-1">{errors.branch}</div> : null}
                                </div>
                                <div className={submitCount && errors.contactPerson ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="contactPerson">Contact Person Name</label>
                                    <Field
                                        name="contactPerson"
                                        type="text"
                                        id="contactPerson"
                                        placeholder="Enter Contact Person Name"
                                        className="form-input"
                                    />
                                    {submitCount && errors.contactPerson ? (
                                        <div className="text-danger mt-1">{errors.contactPerson}</div>
                                    ) : null}
                                </div>
                                <div className={submitCount && errors.emailAddress ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="emailAddress">Email Address</label>
                                    <Field
                                        name="emailAddress"
                                        type="text"
                                        id="emailAddress"
                                        placeholder="Enter Email Address"
                                        className="form-input"
                                    />
                                    {submitCount && errors.emailAddress ? (
                                        <div className="text-danger mt-1">{errors.emailAddress}</div>
                                    ) : null}
                                </div>
                                <div className={submitCount && errors.contactNumber ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="contactNumber">Contact Number</label>
                                    <Field
                                        name="contactNumber"
                                        type="text"
                                        id="contactNumber"
                                        placeholder="Enter Contact Number"
                                        className="form-input"
                                        maxLength={10} // ✅ Prevent more than 10 digits
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/[^0-9]/g, ""); // ✅ Allow only numbers
                                        }}
                                    />
                                    {submitCount && errors.contactNumber ? (
                                        <div className="text-danger mt-1">{errors.contactNumber}</div>
                                    ) : null}
                                </div>
                                <div className={submitCount && errors.designation ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="designation">Designation</label>
                                    <Field
                                        name="designation"
                                        type="text"
                                        id="designation"
                                        placeholder="Enter Designation"
                                        className="form-input"
                                    />
                                    {submitCount && errors.designation ? (
                                        <div className="text-danger mt-1">{errors.designation}</div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* Services Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Services</h5>
                            <FieldArray name="services">
                                {({ push, remove }) => (
                                    <>
                                        {values.services.map((_, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
                                                {/* Machine Type */}
                                                <div className="md:col-span-4">
                                                    <label className="text-sm font-semibold text-gray-700">Machine Type</label>
                                                    <Field as="select" name={`services.${index}.machineType`} className="form-select w-full">
                                                        <option value="">Select Machine Type</option>
                                                        {machineOptions.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </Field>
                                                    <div className="h-4">
                                                        <ErrorMessage
                                                            name={`services.${index}.machineType`}
                                                            component="div"
                                                            className="text-red-500 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                {/* equipment/document No. */}
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-semibold text-gray-700">Equipment ID/Serial No.</label>
                                                    <Field
                                                        type="text"
                                                        name={`services.${index}.equipmentNo`}
                                                        placeholder="Enter Equipment ID/Serial No."
                                                        className="form-input w-full"
                                                    />
                                                    <div className="h-4">
                                                        <ErrorMessage
                                                            name={`services.${index}.equipmentNo`}
                                                            component="div"
                                                            className="text-red-500 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Work Type */}
                                                <div className="md:col-span-4">
                                                    <label className="text-sm font-semibold text-gray-700">Type Of Work</label>
                                                    <MultiSelectField name={`services.${index}.workType`} options={workTypeOptions} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-semibold text-gray-700">Machine Model</label>
                                                    <Field
                                                        type="text"
                                                        name={`services.${index}.machineModel`}
                                                        placeholder="Enter Machine Model"
                                                        className="form-input w-full"
                                                    />
                                                    <div className="h-4">
                                                        <ErrorMessage
                                                            name={`services.${index}.machineModel`}
                                                            component="div"
                                                            className="text-red-500 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Remove Button */}
                                                {values.services.length > 1 && (
                                                    <div className="md:col-span-1 flex justify-end">
                                                        <button type="button" onClick={() => remove(index)} className="mb-4 text-red-500 text-xs">
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {/* Add Another Machine */}
                                        <button
                                            type="button"
                                            onClick={() => push({ machineType: "", equipmentNo: 1, workType: [], machineModel: "" })}
                                            className="btn btn-primary w-full sm:w-auto"
                                        >
                                            + Add Another Machine
                                        </button>
                                    </>
                                )}
                            </FieldArray>
                        </div>

                        {/* Additional Services */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Additional Services</h5>
                            {serviceOptions.map((service) => (
                                <div
                                    key={service}
                                    className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4 py-2 border-b border-gray-200"
                                >
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={values.additionalServices[service] !== undefined}
                                            onChange={() => {
                                                if (values.additionalServices[service] !== undefined) {
                                                    setFieldValue(`additionalServices.${service}`, undefined) // Uncheck
                                                } else {
                                                    setFieldValue(`additionalServices.${service}`, "") // Check with empty string
                                                }
                                            }}
                                            className={`form-checkbox h-5 w-5 transition-colors duration-200 ${values.additionalServices[service] !== undefined ? "text-blue-600" : "text-gray-400"}`}
                                        />
                                        <span>{service}</span>
                                    </div>
                                    {values.additionalServices[service] !== undefined && (
                                        <div className="sm:col-span-2 mt-2 sm:mt-0">
                                            <Field
                                                type="text"
                                                name={`additionalServices.${service}`}
                                                placeholder="Enter info..."
                                                className="form-input w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* specialInstructions */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Special Instructions</h5>
                            {/* Side-by-side layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Special Instructions Field */}
                                <div className={submitCount && errors.specialInstructions ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="specialInstructions" className="block mb-1 font-medium">
                                        Special Instructions
                                    </label>
                                    <Field
                                        name="specialInstructions"
                                        type="text"
                                        id="specialInstructions"
                                        placeholder="Enter special instruction"
                                        className="form-input"
                                    />
                                    {submitCount > 0 && errors.specialInstructions && <p className="text-red-500 text-sm mt-1">{errors.specialInstructions}</p>}
                                </div>
                                {/* Attachment Upload Field */}
                                <div className={submitCount && errors.attachment ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="attachment" className="block mb-1 font-medium">
                                        Attach QA Requirement List
                                    </label>
                                    <Field name="attachment" type="file" id="attachment" className="form-input" />
                                    {submitCount > 0 && errors.attachment && <div className="text-danger mt-1">{errors.attachment}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="w-full mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success mt-4" disabled={isSubmitting || formikSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    )
}

export default AddEnquiry
