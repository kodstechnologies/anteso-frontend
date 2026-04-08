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
import { allEmployees, createOrder, getAllDealers, getAllEmployees, getAllManufacturer, getAllStates, getAllActiveEmployees } from "../../../api"
import AnimatedTrashIcon from "../../common/AnimatedTrashIcon"

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
    /** True when user chose "Others" and entered a custom machine type (saved to CustomMachine on backend). */
    fromOthers?: boolean
    equipmentNo: string
    workType: string[]
    machineModel: string
    quantity: any
    workOrderCopy?: File | null
    partyCodeOrSysId: string
    procNoOrPoNo: string
    procExpiryDate: string
    price?: number | string // ✅ added price
}

interface FormValues {
    leadOwner: any
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
    additionalServices: Record<string, { description: string; price: string } | null>
    enquiryID?: string // Optional for generating ENQ ID
    instruction: string
}

interface Employee {
    _id: string
    name: string
    email?: string
}

type StateType = {
    _id: string;
    name: string; // assuming backend sends `name` for state
};

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
    // "Fixed X-Ray",
    // "Mobile X-Ray",
    // "C-Arm",
    // "Cath Lab/Interventional Radiology",
    // "Mammography",
    // "CT Scan",
    // "PET CT",
    // "CT Simulator",
    // "OPG",
    // "CBCT",
    // "BMD/DEXA",
    // "Dental IOPA",
    // "Dental Hand Held",
    // "O Arm",
    // "KV Imaging (OBI)",
    // "Lead Apron Test",
    // "Thyroid Shield Test",
    // "Gonad Shield Test",
    // "Radiation Survey of Radiation Facility",
    // "Others",

    "Radiography (Fixed)",
    "Radiography (Mobile)",
    "Radiography (Portable)",
    "Radiography and Fluoroscopy",
    "Interventional Radiology",
    "C-Arm",
    "O-Arm",
    "Computed Tomography",
    "Mammography",
    "Dental Cone Beam CT",
    "Ortho Pantomography (OPG)",
    "Dental (Intra Oral)",
    "Dental (Hand-held)",
    "Bone Densitometer (BMD)",
    "KV Imaging (OBI)",
    "Radiography (Mobile) with HT",
    "Lead Apron/Thyroid Shield/Gonad Shield",
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
    { value: "License for Operation", label: "License for Operation" },
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
    const [dealers, setDealers] = useState<any[]>([])   // store dealers here
    const [states, setStates] = useState<StateType[]>([]);
    const [manufacturer, setManufacturers] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empResponse, dealerResponse, manufacturerResponse] = await Promise.all([
                    getAllActiveEmployees(), // ✅ replaced here
                    getAllDealers(),
                    getAllManufacturer()
                ]);

                // ✅ Employee list
                setEmployees(empResponse.data || []);

                // ✅ Dealer list (safe check)
                const dealerList = Array.isArray(dealerResponse.data.dealers)
                    ? dealerResponse.data.dealers
                    : [];

                setDealers(dealerList);
                const manufacturerList =
                    Array.isArray(manufacturerResponse?.data?.data)
                        ? manufacturerResponse.data.data
                        : Array.isArray(manufacturerResponse?.data)
                            ? manufacturerResponse.data
                            : [];

                setManufacturers(manufacturerList);

            } catch (error) {
                console.error("Error fetching employees or dealers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const res = await getAllStates();
                // console.log("🚀 ~ fetchStates ~ res:", res.data.data)
                setStates(res.data.data); // backend response shape (adjust key if needed)
            } catch (error) {
                console.error("Failed to fetch states:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStates();
    }, []);


    const SubmittedForm = Yup.object().shape({
        leadOwner: Yup.string().required("Please fill the Field"),
        hospitalName: Yup.string().required("Please fill the Field"),
        fullAddress: Yup.string().required("Please fill the Field"),
        city: Yup.string().required("Please fill the Field"),
        district: Yup.string(),
        state: Yup.string().required("Please fill the Field"),
        pinCode: Yup.string().required("Please fill the Field"),
        branchName: Yup.string(),
        contactPersonName: Yup.string().required("Please fill the Field"),
        emailAddress: Yup.string().email("Invalid email").required("Please fill the Email"),
        contactNumber: Yup.string()
            .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
            .required("Please fill the Field"),
        designation: Yup.string().required("Please fill the Field"),
        services: Yup.array()
            .of(
                Yup.object().shape({
                    machineType: Yup.string()
                        .required("Machine Type is required")
                        .test(
                            "not-others-without-custom",
                            "Please specify the custom machine type",
                            function (value) {
                                const { customMachineType } = this.parent;
                                if (value === "Others") {
                                    return !!customMachineType && customMachineType.trim().length > 0;
                                }
                                return true;
                            }
                        ),
                    customMachineType: Yup.string().when("machineType", {
                        is: "Others",
                        then: (schema) => schema.required("Please specify the machine type").min(2, "Too short"),
                        otherwise: (schema) => schema.optional().nullable(),
                    }),
                    equipmentNo: Yup.string(),
                    workType: Yup.array().min(1, "At least one work type is required"),
                    machineModel: Yup.string(),
                    quantity: Yup.number()               // ← NEW
                        .typeError("Must be a number")
                        .positive("Must be greater than 0")
                        .integer("Must be a whole number")
                        .required("Quantity is required"),
                    partyCodeOrSysId: Yup.string().required("Party Code/Sys ID is required"),
                    procNoOrPoNo: Yup.string(),
                    procExpiryDate: Yup.date().typeError("Invalid date format"),
                    price: Yup.number().typeError("Price must be a number").nullable()
                        .test(
                            "is-price-required",
                            "Price is required",
                            function (value) {
                                const { workType } = this.parent;
                                let leadOwner = null;
                                if (this.from) {
                                    for (let i = this.from.length - 1; i >= 0; i--) {
                                        if (this.from[i].value && this.from[i].value.leadOwner !== undefined) {
                                            leadOwner = this.from[i].value.leadOwner;
                                            break;
                                        }
                                    }
                                }

                                const isEmployeeLead = employees.some(emp => String(emp._id) === String(leadOwner));
                                // const isQATest = workType && Array.isArray(workType) && workType.includes("Quality Assurance Test");

                                if (isEmployeeLead) {
                                    return value !== null && value !== undefined && String(value).trim() !== "";
                                }
                                return true;
                            }
                        ),
                })
            )
            .min(1, "At least one service is required"),

        additionalServices: Yup.object().shape(
            serviceOptions.reduce((schema, service) => {
                return {
                    ...schema,
                    [service]: Yup.object().shape({
                        description: Yup.string().nullable(),
                        price: Yup.number().typeError("Price must be a number").nullable().optional()
                    }).nullable().optional()
                }
            }, {}),
        ),
        enquiryID: Yup.string().nullable(),
        instruction: Yup.string(),
        urgency: Yup.string()
            .oneOf(['normal', 'tatkal'], 'Select a valid urgency')
            .required('Urgency is required')
    })




    // const submitForm = async (values: FormValues) => {
    //     setIsSubmitting(true);
    //     try {
    //         const newEnquiryID = `ENQ${String(1).padStart(3, "0")}`;

    //         const formData = new FormData();

    //         // ── BASIC FIELDS ───────────────────────────────────────
    //         const basic = {
    //             leadOwner: values.leadOwner,
    //             hospitalName: values.hospitalName,
    //             fullAddress: values.fullAddress,
    //             city: values.city,
    //             district: values.district || "",
    //             state: values.state,
    //             pinCode: values.pinCode,
    //             branchName: values.branchName || "",
    //             contactPersonName: values.contactPersonName,
    //             emailAddress: values.emailAddress,
    //             contactNumber: values.contactNumber,
    //             designation: values.designation,
    //             urgency: values.urgency,
    //             specialInstructions: values.instruction || "",
    //             enquiryID: newEnquiryID,
    //         };
    //         Object.entries(basic).forEach(([k, v]) => formData.append(k, v as any));

    //         // Append services with their individual fields
    //         const servicesData = values.services.map(service => ({
    //             machineType: service.machineType,
    //             equipmentNo: service.equipmentNo || "",
    //             workType: service.workType || [],
    //             machineModel: service.machineModel || "",
    //             quantity: service.quantity,
    //             partyCodeOrSysId: service.partyCodeOrSysId,
    //             procNoOrPoNo: service.procNoOrPoNo || "",
    //             procExpiryDate: service.procExpiryDate || "",
    //         }));

    //         formData.append("services", JSON.stringify(servicesData));

    //         // Handle work order copies for each service
    //         values.services.forEach((service, index) => {
    //             if (service.workOrderCopy) {
    //                 formData.append(`service_${index}_workOrderCopy`, service.workOrderCopy);
    //             }
    //         });

    //         const additional: { name: string; description: string; totalAmount: number }[] = [];
    //         for (const [name, description] of Object.entries(values.additionalServices || {})) {
    //             if (description !== undefined) {  // ← CHANGED: allow empty string
    //                 additional.push({
    //                     name,
    //                     description: description || "",  // ensure string
    //                     totalAmount: 0
    //                 });
    //             }
    //         }
    //         formData.append("additionalServices", JSON.stringify(additional));

    //         const response = await createOrder(formData);
    //         showMessage("Order created successfully", "success");
    //         navigate("/admin/orders");
    //     } catch (error: any) {
    //         showMessage(error.message || "Failed to create order", "error");
    //     } finally {
    //         setIsSubmitting(false);
    //     }
    // };

    const submitForm2 = async (values: FormValues) => {
        console.log("values--------->", values);
    }

    // In your submitForm function:
    const submitForm = async (values: FormValues) => {
        console.log("values--------->", values);

        setIsSubmitting(true);
        try {
            const newEnquiryID = `ENQ${String(1).padStart(3, "0")}`;

            const formData = new FormData();

            // ── BASIC FIELDS ───────────────────────────────────────
            const basic = {
                leadOwner: values.leadOwner,
                hospitalName: values.hospitalName,
                fullAddress: values.fullAddress,
                city: values.city,
                district: values.district || "",
                state: values.state,
                pinCode: values.pinCode,
                branchName: values.branchName || "",
                contactPersonName: values.contactPersonName,
                emailAddress: values.emailAddress,
                contactNumber: values.contactNumber,
                designation: values.designation,
                urgency: values.urgency,
                specialInstructions: values.instruction || "",
                enquiryID: newEnquiryID,
            };
            Object.entries(basic).forEach(([k, v]) => formData.append(k, v as any));

            // If you want to keep single file upload for backward compatibility
            // You can upload the first service's file as the main workOrderCopy
            // if (values.services[0]?.workOrderCopy) {
            //     formData.append("workOrderCopy", values.services[0].workOrderCopy);
            // }

            // // Prepare services data without files
            // const servicesData = values.services.map(service => ({
            //     machineType: service.machineType,
            //     equipmentNo: service.equipmentNo || "",
            //     workType: service.workType || [],
            //     machineModel: service.machineModel || "",
            //     quantity: service.quantity,
            //     partyCodeOrSysId: service.partyCodeOrSysId,
            //     procNoOrPoNo: service.procNoOrPoNo || "",
            //     procExpiryDate: service.procExpiryDate || "",
            //     // File will be handled separately
            // }));

            // formData.append("services", JSON.stringify(servicesData));
            values.services.forEach((service, index) => {
                if (service.workOrderCopy instanceof File) {
                    // This format matches what your current backend expects
                    formData.append(`service_${index}_workOrderCopy`, service.workOrderCopy);

                    // Alternative popular formats (choose ONE):
                    // formData.append(`services[${index}][workOrderCopy]`, service.workOrderCopy);
                    // formData.append(`workOrderCopies[${index}]`, service.workOrderCopy);
                }
            });

            // Services JSON (keep as-is, but now files are sent separately)
            const servicesData = values.services.map(service => ({
                machineType: service.machineType,
                fromOthers: !!service.fromOthers,
                equipmentNo: service.equipmentNo || "",
                workType: service.workType || [],
                machineModel: service.machineModel || "",
                quantity: service.quantity,
                partyCodeOrSysId: service.partyCodeOrSysId,
                procNoOrPoNo: service.procNoOrPoNo || "",
                procExpiryDate: service.procExpiryDate || "",
                price: (employees.some(emp => emp._id === values.leadOwner))
                    ? (service.price || "")
                    : "",
                // ← Do NOT include workOrderCopy here anymore (it's sent as file)
            }));

            formData.append("services", JSON.stringify(servicesData));
            const additional: { name: string; description: string; totalAmount: any }[] = [];
            for (const [name, data] of Object.entries(values.additionalServices || {})) {
                if (data && typeof data === 'object') {
                    additional.push({
                        name,
                        description: data.description || "",
                        totalAmount: data.price || 0
                    });
                }
            }
            formData.append("additionalServices", JSON.stringify(additional));

            const response = await createOrder(formData);
            showMessage("Order created successfully", "success");
            navigate("/admin/orders");
        } catch (error: any) {
            showMessage(error.message || "Failed to create order", "error");
        } finally {
            setIsSubmitting(false);
        }
    };
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

            <Formik<FormValues>
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
                    urgency: "",
                    services: [{
                        machineType: "",
                        fromOthers: false,
                        equipmentNo: "",
                        workType: [],
                        machineModel: "",
                        quantity: "",
                        workOrderCopy: null,
                        partyCodeOrSysId: "",
                        procNoOrPoNo: "",
                        procExpiryDate: "",
                        price: ""
                    }],
                    additionalServices: serviceOptions.reduce(
                        (acc, service) => {
                            acc[service] = null
                            return acc
                        },
                        {} as Record<string, { description: string; price: string } | null>,
                    ),
                    enquiryID: "",
                    instruction: ""
                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}

            >
                {({ errors, submitCount, values, setFieldValue }) => {
                    if (submitCount > 0 && Object.keys(errors).length > 0) {
                        console.log("Form Validation Errors:", errors);
                    }
                    return (
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
                                            <>
                                                {employees.map((emp) => (
                                                    <option key={emp._id} value={emp._id}>
                                                        {emp.name} - Employee
                                                    </option>
                                                ))}
                                                {dealers.map((dealer) => (
                                                    <option key={dealer._id} value={dealer._id}>
                                                        {dealer.name} - Dealer
                                                    </option>
                                                ))}
                                                {manufacturer.map((m) => (
                                                    <option key={m._id} value={m._id}>
                                                        {m.name} - Manufacturer
                                                    </option>
                                                ))}

                                            </>
                                        )}
                                    </Field>
                                    <ErrorMessage name="leadOwner" component="div" className="text-danger mt-1" />
                                    {(() => {
                                        const selectedManufacturer = manufacturer.find((m) => String(m._id) === String(values.leadOwner));
                                        if (!selectedManufacturer) return null;
                                        const travelType = selectedManufacturer.travelCost || "-";
                                        const fixedCost =
                                            travelType === "Fixed Cost" && selectedManufacturer.cost != null && selectedManufacturer.cost !== ""
                                                ? `Rs. ${selectedManufacturer.cost}`
                                                : "-";
                                        return (
                                            <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
                                                <div><strong>Manufacturer Travel Cost:</strong> {travelType}</div>
                                                {travelType === "Fixed Cost" && (
                                                    <div><strong>Fixed Travel Cost:</strong> {fixedCost}</div>
                                                )}
                                            </div>
                                        );
                                    })()}
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
                                <div
                                    className={
                                        submitCount && errors.state ? "has-error" : submitCount ? "has-success" : ""
                                    }
                                >
                                    <label htmlFor="state">State</label>
                                    <Field
                                        as="select"
                                        name="state"
                                        id="state"
                                        className="form-input"
                                        disabled={loading}
                                    >
                                        <option value="">Select State</option>
                                        {states.map((st, index) => (
                                            <option key={index} value={String(st)}>
                                                {String(st)}
                                            </option>
                                        ))}
                                    </Field>
                                    {submitCount && errors.state ? (
                                        <div className="text-danger mt-1">{errors.state}</div>
                                    ) : null}
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
                                        {values.services.map((service, index) => {
                                            const selectedMachineType = service.machineType;
                                            const isOthersSelected = selectedMachineType === "Others" ||
                                                (!machineOptions.map(o => o.value).includes(selectedMachineType) && selectedMachineType);

                                            const selectedLeadOwner = values.leadOwner;
                                            const selectedDealer = dealers.find(d => String(d._id) === String(selectedLeadOwner));
                                            const selectedManufacturer = manufacturer.find(m => String(m._id) === String(selectedLeadOwner));

                                            const allowedTests = (selectedDealer?.qaTests || selectedManufacturer?.qaTests || []).map((t: any) => t.testName);
                                            const isRestricted = !!(selectedDealer || selectedManufacturer);

                                            return (
                                                <div key={index} className="border border-gray-200 rounded-lg p-5 mb-6 relative">
                                                    {values.services.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => remove(index)}
                                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
                                                        >
                                                            <AnimatedTrashIcon onClick={() => remove(index)} />
                                                        </button>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                        {/* Machine Type Dropdown */}
                                                        <div className="md:col-span-3">
                                                            <label className="text-sm font-semibold text-gray-700">Machine Type</label>
                                                            <Field
                                                                as="select"
                                                                name={`services.${index}.machineType`}
                                                                className="form-select w-full"
                                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                                    const value = e.target.value;
                                                                    if (value !== "Others") {
                                                                        setFieldValue(`services.${index}.machineType`, value);
                                                                        setFieldValue(`services.${index}.fromOthers`, false);
                                                                    } else {
                                                                        // User selected "Others" → keep "Others" temporarily, but allow typing
                                                                        setFieldValue(`services.${index}.machineType`, "Others");
                                                                        setFieldValue(`services.${index}.fromOthers`, true);
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">Select Machine Type</option>
                                                                {machineOptions.map((option) => {
                                                                    const isDisabled = isRestricted &&
                                                                        option.value !== "" &&
                                                                        option.value !== "Others" &&
                                                                        !allowedTests.includes(option.value);

                                                                    return (
                                                                        <option key={option.value} value={option.value} disabled={isDisabled}>
                                                                            {option.label}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </Field>
                                                            <ErrorMessage
                                                                name={`services.${index}.machineType`}
                                                                component="div"
                                                                className="text-red-500 text-sm mt-1"
                                                            />
                                                        </div>

                                                        {/* Show custom input if "Others" is selected OR user has typed a custom value */}
                                                        {isOthersSelected && (
                                                            <div className="md:col-span-3">
                                                                <label className="text-sm font-semibold text-gray-700">
                                                                    Specify Other Machine Type <span className="text-red-500">*</span>
                                                                </label>
                                                                <Field
                                                                    type="text"
                                                                    name={`services.${index}.machineType`}  // ← Important: bind directly to machineType!
                                                                    placeholder="e.g. LINAC, Brachytherapy, etc."
                                                                    className="form-input w-full mt-1"
                                                                    value={selectedMachineType === "Others" ? "" : selectedMachineType}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                        const customValue = e.target.value.trim();
                                                                        setFieldValue(`services.${index}.machineType`, customValue || "Others");
                                                                        setFieldValue(`services.${index}.fromOthers`, true);
                                                                    }}
                                                                />
                                                                <ErrorMessage
                                                                    name={`services.${index}.machineType`}
                                                                    component="div"
                                                                    className="text-red-500 text-sm mt-1"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Quantity */}
                                                        <div className="md:col-span-2">
                                                            <label className="text-sm font-semibold text-gray-700">Quantity</label>
                                                            <Field
                                                                type="number"
                                                                name={`services.${index}.quantity`}
                                                                placeholder="Qty"
                                                                min="1"
                                                                className="form-input w-full"
                                                            />
                                                            <ErrorMessage name={`services.${index}.quantity`} component="div" className="text-red-500 text-sm" />
                                                        </div>

                                                        {/* Equipment No. */}
                                                        <div className="md:col-span-2">
                                                            <label className="text-sm font-semibold text-gray-700">Equipment ID/Serial No.</label>
                                                            <Field
                                                                type="text"
                                                                name={`services.${index}.equipmentNo`}
                                                                placeholder="Enter ID"
                                                                className="form-input w-full"
                                                            />
                                                        </div>

                                                        {/* Work Type */}
                                                        <div className="md:col-span-3">
                                                            <label className="text-sm font-semibold text-gray-700">Type Of Work</label>
                                                            <MultiSelectField name={`services.${index}.workType`} options={workTypeOptions} />
                                                        </div>

                                                        {/* Machine Model */}
                                                        <div className="md:col-span-3">
                                                            <label className="text-sm font-semibold text-gray-700">Machine Model</label>
                                                            <Field
                                                                type="text"
                                                                name={`services.${index}.machineModel`}
                                                                placeholder="Enter Model"
                                                                className="form-input w-full"
                                                            />
                                                        </div>

                                                        {/* Party Code/Sys ID - MANDATORY */}
                                                        <div className="md:col-span-3">
                                                            <label className="text-sm font-semibold text-gray-700">Party Code/Sys ID <span className="text-red-500">*</span></label>
                                                            <Field
                                                                type="text"
                                                                name={`services.${index}.partyCodeOrSysId`}
                                                                placeholder="Enter Party Code/Sys ID"
                                                                className="form-input w-full"
                                                            />
                                                            <ErrorMessage name={`services.${index}.partyCodeOrSysId`} component="div" className="text-red-500 text-sm" />
                                                        </div>

                                                        {/* PROC NO/PO NO - OPTIONAL */}
                                                        <div className="md:col-span-3">
                                                            <label className="text-sm font-semibold text-gray-700">PROC NO/PO NO</label>
                                                            <Field
                                                                type="text"
                                                                name={`services.${index}.procNoOrPoNo`}
                                                                placeholder="Enter PROC NO/PO NO"
                                                                className="form-input w-full"
                                                            />
                                                        </div>

                                                        {/* PROC Expiry Date - OPTIONAL */}
                                                        <div className="md:col-span-3">
                                                            <label className="text-sm font-semibold text-gray-700">PROC Expiry Date</label>
                                                            <Field
                                                                name={`services.${index}.procExpiryDate`}
                                                                type="date"
                                                                className="form-input w-full"
                                                                min={new Date().toISOString().split("T")[0]}
                                                            />
                                                        </div>

                                                        {/* Work Order Copy - OPTIONAL */}
                                                        <div className="md:col-span-3">
                                                            <label className="text-sm font-semibold text-gray-700">Work Order Copy</label>
                                                            <input
                                                                type="file"
                                                                className="form-input w-full"
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                    setFieldValue(`services.${index}.workOrderCopy`, e.currentTarget.files?.[0] || null);
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Price - Visible only for employee leads */}
                                                        {(employees.some(emp => emp._id === values.leadOwner)) && (
                                                            <div className="md:col-span-3">
                                                                <label className="text-sm font-semibold text-gray-700">
                                                                    Price <span className="text-red-500">*</span>
                                                                </label>
                                                                <Field
                                                                    type="number"
                                                                    name={`services.${index}.price`}
                                                                    placeholder="Enter Price"
                                                                    className="form-input w-full"
                                                                />
                                                                <ErrorMessage name={`services.${index}.price`} component="div" className="text-red-500 text-sm mt-1" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Add button */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                push({
                                                    machineType: "",
                                                    fromOthers: false,
                                                    equipmentNo: "",
                                                    workType: [],
                                                    machineModel: "",
                                                    quantity: "",
                                                    workOrderCopy: null,
                                                    partyCodeOrSysId: "",
                                                    procNoOrPoNo: "",
                                                    procExpiryDate: "",
                                                    price: "" // ✅ added price
                                                })
                                            }
                                            className="btn btn-primary w-full sm:w-auto"
                                        >
                                            + Add Another Machine
                                        </button>

                                        {errors.services && typeof errors.services === "string" && (
                                            <div className="text-red-500 text-sm mt-2">{errors.services}</div>
                                        )}
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
                                            checked={!!values.additionalServices[service]}
                                            onChange={() => {
                                                if (values.additionalServices[service]) {
                                                    setFieldValue(`additionalServices.${service}`, null)
                                                } else {
                                                    setFieldValue(`additionalServices.${service}`, { description: "", price: "" })
                                                }
                                            }}
                                            className={`form-checkbox h-5 w-5 transition-colors duration-200 ${values.additionalServices[service] ? "text-blue-600" : "text-gray-400"}`}
                                        />
                                        <span>{service}</span>
                                    </div>
                                    {values.additionalServices[service] && (
                                        <div className="sm:col-span-2 mt-2 sm:mt-0 flex gap-4">
                                            <div className="flex-1">
                                                <Field
                                                    type="text"
                                                    name={`additionalServices.${service}.description`}
                                                    placeholder="Enter info..."
                                                    className="form-input w-full"
                                                />
                                            </div>
                                            {(employees.some(emp => emp._id === values.leadOwner) || dealers.some(d => d._id === values.leadOwner) || manufacturer.some(m => m._id === values.leadOwner)) && (
                                                <div className="w-1/3">
                                                    <Field
                                                        type="number"
                                                        name={`additionalServices.${service}.price`}
                                                        placeholder="Price"
                                                        className="form-input w-full"
                                                    />
                                                    <ErrorMessage name={`additionalServices.${service}.price`} component="div" className="text-red-500 text-sm mt-1" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Special Instructions</h5>
                            <div className="grid grid-cols-1 gap-4">
                                <Field
                                    name="instruction"
                                    type="text"
                                    id="instruction"
                                    placeholder="Enter special instruction"
                                    className="form-input"
                                />
                            </div>
                            {submitCount && errors.instruction ? (
                                <p className="text-red-500 text-sm mt-1">{errors.instruction}</p>
                            ) : null}
                        </div>
                        {Object.keys(errors).length > 0 && submitCount > 0 && (
                            <div className="panel bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                                <h5 className="text-red-800 dark:text-red-400 font-bold mb-2">Please fix the following errors to submit:</h5>
                                <ul className="list-disc list-inside text-red-700 dark:text-red-300 text-sm space-y-1">
                                    {Object.entries(errors).map(([key, value]) => {
                                        if (typeof value === 'string') return <li key={key}>{key}: {value}</li>;
                                        if (Array.isArray(value)) return <li key={key}>{key}: Fix errors in items</li>;
                                        if (typeof value === 'object') return <li key={key}>{key}: Check nested fields</li>;
                                        return null;
                                    })}
                                </ul>
                            </div>
                        )}

                        <div className="w-full mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success mt-4" disabled={isSubmitting}>
                                {isSubmitting ? "Creating Order..." : "Create Order"}
                            </button>
                        </div>
                    </Form>
                    )
                }}
            </Formik>
        </>
    )
}
export default CreateOrder