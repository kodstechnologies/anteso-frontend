"use client"

import type React from "react"
import { useEffect, useState } from "react"
import * as Yup from "yup"
import { FieldArray, Field, Form, Formik, ErrorMessage, type FieldProps } from "formik"
import { Link, useNavigate } from "react-router-dom"
import Select from "react-select"
import { showMessage } from "../../common/ShowMessage"
import type { BreadcrumbItem } from "../../common/Breadcrumb"
import IconHome from "../../Icon/IconHome"
import IconBox from "../../Icon/IconBox"
import IconBook from "../../Icon/IconBook"
import { allEmployees, createOrder } from "../../../api"

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
    equipmentNo: number
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
    branchName: string
    contactPersonName: string
    emailAddress: string
    contactNumber: string
    designation: string
    urgency: string
    services: Service[]
    additionalServices: Record<string, string | undefined>
    enquiryID?: string // Optional for generating ENQ ID
    partyCodeOrSysId: string
    procNoOrPoNo: string
    procExpiryDate: string
    instruction: string
}

interface Employee {
    _id: string
    name: string
    email?: string
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({ name, options }) => (
    <Field name={name}>
        {({ field, form }: FieldProps) => (
            <div>
                <Select
                    isMulti
                    options={options}
                    className="w-full"
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

const urgencyOptions: string[] = [
    "Immediantely (within 1-2 days)",
    "Urgent (Within a week)",
    "Soon (Within 2-3 weeks)",
    "Not urgent (just exploring)",
]
const urgency: string[] = ["normal", "tatkal"]
const workTypeOptions: OptionType[] = [
    { value: "Quality Assurance Test", label: "Quality Assurance Test" },
    { value: " License for Operation", label: " License for Operation" },
    { value: "Decommissioning", label: "Decommissioning" },
    { value: "Decommissioning and Recommissioning", label: "Decommissioning and Recommissioning" },
]

const dealerOptions: OptionType[] = [
    { value: "Dealer 1", label: "Dealer 1" },
    { value: "Dealer 2", label: "Dealer 2" },
    { value: "Dealer 3", label: "Dealer 3" },
    { value: "Dealer 4", label: "Dealer 4" },
]

const CreateOrder: React.FC = () => {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await allEmployees()
                setEmployees(data)
            } catch (error) {
                console.error("Error fetching employees:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchEmployees()
    }, [])

    const SubmittedForm = Yup.object().shape({
        leadOwner: Yup.string().required("Please fill the Field"),
        hospitalName: Yup.string().required("Please fill the Field"),
        fullAddress: Yup.string().required("Please fill the Field"),
        city: Yup.string().required("Please fill the Field"),
        district: Yup.string().required("Please fill the Field"),
        state: Yup.string().required("Please fill the Field"),
        pinCode: Yup.string().required("Please fill the Field"),
        branchName: Yup.string().required("Please fill the Field"),
        contactPersonName: Yup.string().required("Please fill the Field"),
        emailAddress: Yup.string().email("Invalid email").required("Please fill the Email"),
        contactNumber: Yup.string()
            .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
            .required("Please fill the Field"),
        designation: Yup.string().required("Please fill the Field"),
        services: Yup.array()
            .of(
                Yup.object().shape({
                    machineType: Yup.string().required("Required"),
                    equipmentNo: Yup.number().required("Required").positive().integer(),
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
        enquiryID: Yup.string().nullable(),
        partyCodeOrSysId: Yup.string().required("Please fill the Field"),
        procNoOrPoNo: Yup.string().required("Please fill the Field"),
        procExpiryDate: Yup.date().required("Please fill the Expiry Date").typeError("Invalid date format"),
        instruction: Yup.string()
    })

    const submitForm = async (values: FormValues) => {
        setIsSubmitting(true)
        try {
            const enquiryCount = 1
            const newEnquiryID = `ENQ${String(enquiryCount).padStart(3, "0")}`
            const submissionValues = { ...values, enquiryID: newEnquiryID }
            console.log("Form submitted with values:", submissionValues)
            const response = await createOrder(submissionValues)
            console.log("Order created successfully:", response)
            showMessage("Order created successfully", "success")
            navigate("/admin/orders")
        } catch (error: any) {
            console.error("Error creating order:", error)
            showMessage(error.message || "Failed to create order", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Dashboard", to: "/", icon: <IconHome /> },
        { label: "Orders", to: "/admin/orders", icon: <IconBox /> },
        { label: "Create Order", icon: <IconBook /> },
    ]

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/orders" className="text-primary">
                        Order
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        create Order
                    </Link>
                </li>
            </ol>

            <h5 className="font-semibold text-lg mb-4">Create Order</h5>

            <Formik
                initialValues={{
                    leadOwner: "",
                    hospitalName: "",
                    fullAddress: "",
                    city: "",
                    district: "",
                    state: "",
                    pinCode: "",
                    branchName: "",
                    contactPersonName: "",
                    emailAddress: "",
                    contactNumber: "",
                    designation: "",
                    workOrderCopy: null,
                    urgency: "",
                    services: [{ machineType: "", equipmentNo: 1, workType: [], machineModel: "" }],
                    additionalServices: serviceOptions.reduce(
                        (acc, service) => {
                            acc[service] = undefined
                            return acc
                        },
                        {} as Record<string, string | undefined>,
                    ),
                    enquiryID: "",
                    partyCodeOrSysId: "",
                    procNoOrPoNo: "",
                    procExpiryDate: "",
                    instruction: ""
                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, values, setFieldValue }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                                <div className={submitCount && errors.leadOwner ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="leadOwner">Lead Owner</label>
                                    <Field as="select" name="leadOwner" id="leadOwner" className="form-input">
                                        <option value="">Select Lead Owner</option>
                                        {loading ? (
                                            <option disabled>Loading...</option>
                                        ) : (
                                            employees.map((emp) => (
                                                <option key={emp._id} value={emp._id}>
                                                    {emp.name} - Employee
                                                </option>
                                            ))
                                        )}
                                    </Field>
                                    <ErrorMessage name="leadOwner" component="div" className="text-danger mt-1" />
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
                                        maxLength={6}
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/[^0-9]/g, ''); // only numbers
                                        }}
                                    />

                                    {submitCount && errors.pinCode ? <div className="text-danger mt-1">{errors.pinCode}</div> : null}
                                </div>
                                <div className={submitCount && errors.branchName ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="branchName">Branch Name</label>
                                    <Field name="branchName" type="text" id="branchName" placeholder="Enter Branch Name" className="form-input" />
                                    {submitCount && errors.branchName ? <div className="text-danger mt-1">{errors.branchName}</div> : null}
                                </div>
                                <div className={submitCount && errors.contactPersonName ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="contactPersonName">Contact Person Name</label>
                                    <Field
                                        name="contactPersonName"
                                        type="text"
                                        id="contactPersonName"
                                        placeholder="Enter Contact Person Name"
                                        className="form-input"
                                    />
                                    {submitCount && errors.contactPersonName ? (
                                        <div className="text-danger mt-1">{errors.contactPersonName}</div>
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
                                        maxLength={10} // restrict typing to 10 digits
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/[^0-9]/g, ""); // allow only numbers
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
                                <div className={submitCount && errors.workOrderCopy ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="workOrderCopy">Work Order Copy</label>
                                    <Field
                                        name="workOrderCopy"
                                        type="file"
                                        id="workOrderCopy"
                                        placeholder="Enter workOrderCopy"
                                        className="form-input"
                                    />
                                    {submitCount && errors.workOrderCopy ? <div className="text-danger mt-1">{errors.workOrderCopy}</div> : null}
                                </div>
                                <div className={submitCount && errors.partyCodeOrSysId ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="partyCodeOrSysId">Party Code/Sys ID</label>
                                    <Field
                                        name="partyCodeOrSysId"
                                        type="text"
                                        id="partyCodeOrSysId"
                                        placeholder="Enter Party Code/Sys ID"
                                        className="form-input"
                                    />
                                    {submitCount && errors.partyCodeOrSysId ? <div className="text-danger mt-1">{errors.partyCodeOrSysId}</div> : null}
                                </div>
                                <div className={submitCount && errors.procNoOrPoNo ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="procNoOrPoNo">PROC NO / PO NO</label>
                                    <Field
                                        name="procNoOrPoNo"
                                        type="text"
                                        id="procNoOrPoNo"
                                        placeholder="Enter PROC NO / PO NO"
                                        className="form-input"
                                    />
                                    {submitCount && errors.procNoOrPoNo ? <div className="text-danger mt-1">{errors.procNoOrPoNo}</div> : null}
                                </div>
                                <div className={submitCount && errors.procExpiryDate ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="procExpiryDate">PROC Expiry Date</label>
                                    <Field name="procExpiryDate" type="date" id="procExpiryDate" className="form-input" />
                                    {submitCount && errors.procExpiryDate ? (
                                        <div className="text-danger mt-1">{errors.procExpiryDate}</div>
                                    ) : null}
                                </div>
                                {/* ✅ Urgency Dropdown at root level (not inside services) */}
                                <div className={submitCount && errors.urgency ? "has-error" : submitCount ? "has-success" : ""}>
                                    <label htmlFor="urgency">Urgency</label>
                                    <Field as="select" name="urgency" id="urgency" className="form-select w-full">
                                        <option value="">Select Urgency Type</option>
                                        {urgency.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </Field>
                                    <ErrorMessage name="urgency" component="div" className="text-danger mt-1" />
                                </div>

                            </div>
                        </div>
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Services</h5>
                            <FieldArray name="services">
                                {({ push, remove }) => (
                                    <>
                                        {values.services.map((_, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
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
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-semibold text-gray-700">Equipment ID/Serial No.</label>
                                                    <Field
                                                        type="text"
                                                        name={`services.${index}.equipmentNo`}
                                                        placeholder="Enter Equipment ID/Serial No"
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
                                                {values.services.length > 1 && (
                                                    <div className="md:col-span-1 flex justify-end">
                                                        <button type="button" onClick={() => remove(index)} className="mb-4 text-red-500 text-xs">
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
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
                                                    setFieldValue(`additionalServices.${service}`, undefined)
                                                } else {
                                                    setFieldValue(`additionalServices.${service}`, "")
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
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Special Instructions</h5>
                            <div className="grid grid-cols-1 gap-4">
                                <Field
                                    name="instruction"   // ✅ corrected
                                    type="text"
                                    id="instruction"     // ✅ corrected
                                    placeholder="Enter special instruction"
                                    className="form-input"
                                />
                            </div>
                            {submitCount && errors.instruction ? (
                                <p className="text-red-500 text-sm mt-1">{errors.instruction}</p>
                            ) : null}
                        </div>
                        <div className="w-full mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success mt-4" disabled={isSubmitting}>
                                {isSubmitting ? "Creating Order..." : "Create Order"}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    )
}

export default CreateOrder
