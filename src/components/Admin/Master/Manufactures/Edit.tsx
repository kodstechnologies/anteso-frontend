import * as Yup from "yup";
import { Field, Form, Formik, FieldArray } from "formik";
import { Link, useNavigate, useParams } from "react-router-dom";
import { showMessage } from "../../../common/ShowMessage";
import { useEffect, useState } from "react";
import { editManufacturerById, getManufacturerById, getAllStates } from "../../../../api";
import Cookies from "js-cookie";

const systemQaTests = [
    { label: "FIXED X RAY", value: "FIXED_X_RAY", price: 3500, system: true },
    { label: "MOBILE X RAY", value: "MOBILE_X_RAY", price: 2500, system: true },
    { label: "C ARM", value: "C_ARM", price: 3000, system: true },
    { label: "MAMMOGRAP", value: "MAMMOGRAP", price: 4000, system: true },
    { label: "CATH LAB", value: "CATH_LAB", price: 5000, system: true },
    { label: "CT SCAN", value: "CT_SCAN", price: 6000, system: true },
    { label: "TATKAL QA", value: "TATKAL_QA", price: 5000, system: true },
];

// ───── SYSTEM SERVICES ────────────────────────────────────────────────────
const defaultServices = [
    { label: "Institute Registration", value: "INSTITUTE_REGISTRATION", amount: 0, system: true },
    { label: "Procurement", value: "PROCUREMENT", amount: 0, system: true },
    { label: "License", value: "LICENSE", amount: 0, system: true },
];

const EditManufacture = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [stateOptions, setStateOptions] = useState<string[]>([]);
    const [qaOptions, setQaOptions] = useState(systemQaTests);
    const [serviceOptions, setServiceOptions] = useState(defaultServices);
    const [newQaName, setNewQaName] = useState("");
    const [newQaPrice, setNewQaPrice] = useState("");
    const [newSrvName, setNewSrvName] = useState("");
    const [newSrvAmount, setNewSrvAmount] = useState("");

    // ── FETCH STATES ───────────────────────────────────────────────────────
    useEffect(() => {
        const fetchStates = async () => {
            try {
                const res = await getAllStates();
                setStateOptions(res.data.data || []);
            } catch (e) {
                console.error("Failed to fetch states:", e);
            }
        };
        fetchStates();
    }, []);

    // ── FETCH MANUFACTURER DATA ───────────────────────────────────────────
    const [initialValues, setInitialValues] = useState<any>({
        manufactureName: "",
        address: "",
        city: "",
        state: "",
        pinCode: "",
        branch: "",
        mouValidity: "",
        email: "",
        phone: "",
        contactPersonName: "",
        qaTests: [] as string[],
        services: [] as string[],
        travel: "",
        fixedCost: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const res = await getManufacturerById(id);
                const data = res.data.data;

                // Merge system + custom QA tests
                const allQaTests = [...systemQaTests];
                const selectedQa = data.qaTests?.map((t: any) => {
                    const existing = allQaTests.find(o => o.label === t.testName);
                    if (existing) {
                        existing.price = t.price;
                        return existing.value;
                    } else {
                        const newValue = t.testName.toUpperCase().replace(/\s+/g, "_");
                        allQaTests.push({ label: t.testName, value: newValue, price: t.price, system: false });
                        return newValue;
                    }
                }) || [];

                // Merge system + custom services
                const allServices = [...defaultServices];
                const selectedServices = data.services?.map((s: any) => {
                    const existing = allServices.find(o => o.label === s.serviceName);
                    if (existing) {
                        existing.amount = s.amount;
                        return existing.value;
                    } else {
                        const newValue = s.serviceName.toUpperCase().replace(/\s+/g, "_");
                        allServices.push({ label: s.serviceName, value: newValue, amount: s.amount, system: false });
                        return newValue;
                    }
                }) || [];

                setQaOptions(allQaTests);
                setServiceOptions(allServices);

                setInitialValues({
                    manufactureName: data.name || "",
                    address: data.address || "",
                    city: data.city || "",
                    state: data.state || "",
                    pinCode: data.pincode || "",
                    branch: data.branch || "",
                    mouValidity: data.mouValidity?.split("T")[0] || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    contactPersonName: data.contactPersonName || "",
                    qaTests: selectedQa,
                    services: selectedServices,
                    travel: data.travelCost === "Actual Cost" ? "actual" : "fixed",
                    fixedCost: data.travelCost === "Fixed Cost" ? (data.cost || "") : "",
                });
            } catch (error) {
                console.error("Error fetching manufacturer:", error);
                showMessage("Failed to load manufacturer details", "error");
            }
        };
        fetchData();
    }, [id]);

    // ── VALIDATION SCHEMA ──────────────────────────────────────────────────
    const SubmittedForm = Yup.object().shape({
        manufactureName: Yup.string().required("Please fill the Field"),
        address: Yup.string().required("Please fill the Field"),
        city: Yup.string().required("Please fill the Field"),
        state: Yup.string().required("Please fill the Field"),
        pinCode: Yup.string()
            .matches(/^\d{6}$/, "Pin code must be 6 digits")
            .required("Please fill the Field"),
        branch: Yup.string().required("Please fill the Field"),
        mouValidity: Yup.string().required("Please fill the Field"),
        email: Yup.string().email("Invalid email").required("Please enter email"),
        phone: Yup.string()
            .matches(/^\d{10}$/, "Phone must be 10 digits")
            .required("Please enter phone number"),
        contactPersonName: Yup.string().required("Please enter contact person name"),
        qaTests: Yup.array().of(Yup.string()),
        services: Yup.array().of(Yup.string()).min(1, "Select at least one service"),
        travel: Yup.string().required("Please select travel type"),
        fixedCost: Yup.string().when("travel", {
            is: "fixed",
            then: (schema) =>
                schema
                    .required("Fixed cost is required")
                    .test("is-positive", "Enter valid amount", (val) => {
                        const num = Number(val);
                        return !isNaN(num) && num >= 0;
                    }),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

    // ── SUBMIT HANDLER ─────────────────────────────────────────────────────
    const handleSubmit = async (values: any, { setSubmitting }: any) => {
        try {
            const qaPayload = values.qaTests.map((v: string) => {
                const opt = qaOptions.find(o => o.value === v);
                return { testName: opt?.label ?? v, price: opt?.price ?? 0 };
            });

            const servicePayload = values.services.map((v: string) => {
                const opt = serviceOptions.find(o => o.value === v);
                return { serviceName: opt?.label ?? v, amount: opt?.amount ?? 0 };
            });

            const payload: any = {
                name: values.manufactureName,
                email: values.email,
                phone: values.phone,
                address: values.address,
                city: values.city,
                state: values.state,
                pincode: values.pinCode,
                branch: values.branch,
                mouValidity: values.mouValidity,
                contactPersonName: values.contactPersonName,
                qaTests: qaPayload,
                services: servicePayload,
                travelCost: values.travel === "actual" ? "Actual Cost" : "Fixed Cost",
            };

            if (values.travel === "fixed") payload.cost = values.fixedCost;

            await editManufacturerById(id!, payload);
            showMessage("Manufacturer updated successfully", "success");
            navigate("/admin/manufacture");
        } catch (error: any) {
            console.error("Error updating manufacturer:", error);
            showMessage(error.message || "Update failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/manufacture" className="text-primary">
                        Manufacture
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    Edit Manufacture
                </li>
            </ol>

            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={SubmittedForm}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, submitCount, isSubmitting, values, setFieldValue }) => (
                    <Form className="space-y-5">

                        {/* ── BASIC DETAILS ── */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                <div className={submitCount && errors.manufactureName && touched.manufactureName ? "has-error" : ""}>
                                    <label>Manufacture Name </label>
                                    <Field name="manufactureName" className="form-input" placeholder="Enter Name" />
                                    {errors.manufactureName && touched.manufactureName && typeof errors.manufactureName === "string" && (
                                        <div className="text-danger mt-1">{errors.manufactureName}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.address && touched.address ? "has-error" : ""}>
                                    <label>Address </label>
                                    <Field name="address" className="form-input" placeholder="Enter Address" />
                                    {errors.address && touched.address && typeof errors.address === "string" && (
                                        <div className="text-danger mt-1">{errors.address}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.city && touched.city ? "has-error" : ""}>
                                    <label>City </label>
                                    <Field name="city" className="form-input" placeholder="Enter City" />
                                    {errors.city && touched.city && typeof errors.city === "string" && (
                                        <div className="text-danger mt-1">{errors.city}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.state && touched.state ? "has-error" : ""}>
                                    <label>State </label>
                                    <Field as="select" name="state" className="form-input">
                                        <option value="">Select State</option>
                                        {stateOptions.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </Field>
                                    {errors.state && touched.state && typeof errors.state === "string" && (
                                        <div className="text-danger mt-1">{errors.state}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.pinCode && touched.pinCode ? "has-error" : ""}>
                                    <label>Pin Code </label>
                                    <Field
                                        name="pinCode"
                                        className="form-input"
                                        placeholder="6 digits"
                                        onInput={(e: any) => {
                                            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                            setFieldValue("pinCode", e.target.value);
                                        }}
                                    />
                                    {errors.pinCode && touched.pinCode && typeof errors.pinCode === "string" && (
                                        <div className="text-danger mt-1">{errors.pinCode}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.branch && touched.branch ? "has-error" : ""}>
                                    <label>Branch </label>
                                    <Field name="branch" className="form-input" placeholder="Enter Branch" />
                                    {errors.branch && touched.branch && typeof errors.branch === "string" && (
                                        <div className="text-danger mt-1">{errors.branch}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.email && touched.email ? "has-error" : ""}>
                                    <label>Email </label>
                                    <Field name="email" type="email" className="form-input" placeholder="Enter Email" />
                                    {errors.email && touched.email && typeof errors.email === "string" && (
                                        <div className="text-danger mt-1">{errors.email}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.phone && touched.phone ? "has-error" : ""}>
                                    <label>Phone </label>
                                    <Field
                                        name="phone"
                                        className="form-input"
                                        placeholder="10 digits"
                                        onInput={(e: any) => {
                                            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                            setFieldValue("phone", e.target.value);
                                        }}
                                    />
                                    {errors.phone && touched.phone && typeof errors.phone === "string" && (
                                        <div className="text-danger mt-1">{errors.phone}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.contactPersonName && touched.contactPersonName ? "has-error" : ""}>
                                    <label>Contact Person </label>
                                    <Field name="contactPersonName" className="form-input" placeholder="Enter Name" />
                                    {errors.contactPersonName && touched.contactPersonName && typeof errors.contactPersonName === "string" && (
                                        <div className="text-danger mt-1">{errors.contactPersonName}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.mouValidity && touched.mouValidity ? "has-error" : ""}>
                                    <label>MOU Validity </label>
                                    <Field name="mouValidity" type="date" className="form-input" />
                                    {errors.mouValidity && touched.mouValidity && typeof errors.mouValidity === "string" && (
                                        <div className="text-danger mt-1">{errors.mouValidity}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* ── QA TESTS ── */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">QA Tests</h5>
                            <div className="space-y-3">
                                <div className="flex items-center max-w-[36rem] font-semibold text-sm text-gray-700">
                                    <div className="w-1/2">QA Test</div>
                                    <div className="w-24 text-center">Price ₹</div>
                                    <div className="w-20 text-right">Action</div>
                                </div>

                                {qaOptions.map((opt, idx) => (
                                    <div key={opt.value} className="flex items-center max-w-[36rem] gap-2">
                                        <div className="flex items-center gap-2 w-1/2">
                                            <Field
                                                type="checkbox"
                                                name="qaTests"
                                                value={opt.value}
                                                className="form-checkbox"
                                                onChange={(e: any) => {
                                                    const checked = e.target.checked;
                                                    const cur = values.qaTests || [];
                                                    setFieldValue("qaTests", checked ? [...cur, opt.value] : cur.filter((t: string) => t !== opt.value));
                                                }}
                                            />
                                            <label className="text-sm">{opt.label}</label>
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                value={opt.price}
                                                onChange={(e) => {
                                                    const newP = Number(e.target.value) || 0;
                                                    const upd = [...qaOptions];
                                                    upd[idx].price = newP;
                                                    setQaOptions(upd);
                                                }}
                                                className="form-input w-full text-sm"
                                            />
                                        </div>
                                        <div className="w-20 text-right">
                                            {!opt.system && (
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => {
                                                        setQaOptions(qaOptions.filter((_, i) => i !== idx));
                                                        setFieldValue("qaTests", values.qaTests.filter((t: string) => t !== opt.value));
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-4 flex flex-wrap items-center gap-3 max-w-[36rem]">
                                    <input
                                        type="text"
                                        placeholder="New QA Test"
                                        className="form-input w-1/2"
                                        value={newQaName}
                                        onChange={(e) => setNewQaName(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        className="form-input w-24"
                                        value={newQaPrice}
                                        onChange={(e) => setNewQaPrice(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            const name = newQaName.trim();
                                            if (!name) return showMessage("Enter name", "error");
                                            const value = name.toUpperCase().replace(/\s+/g, "_");
                                            if (qaOptions.some(o => o.value === value)) return showMessage("Already exists", "warning");
                                            setQaOptions([...qaOptions, { label: name, value, price: Number(newQaPrice) || 0, system: false }]);
                                            setNewQaName("");
                                            setNewQaPrice("");
                                        }}
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── SERVICES ── */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Services</h5>
                            <div className="space-y-3">
                                <div className="flex items-center max-w-[36rem] font-semibold text-sm text-gray-700">
                                    <div className="w-1/2">Service</div>
                                    <div className="w-24 text-center">Amount ₹</div>
                                    <div className="w-20 text-right">Action</div>
                                </div>

                                {serviceOptions.map((opt, idx) => (
                                    <div key={opt.value} className="flex items-center max-w-[36rem] gap-2">
                                        <div className="flex items-center gap-2 w-1/2">
                                            <Field
                                                type="checkbox"
                                                name="services"
                                                value={opt.value}
                                                className="form-checkbox"
                                                onChange={(e: any) => {
                                                    const checked = e.target.checked;
                                                    const cur = values.services || [];
                                                    setFieldValue("services", checked ? [...cur, opt.value] : cur.filter((t: string) => t !== opt.value));
                                                }}
                                            />
                                            <label className="text-sm">{opt.label}</label>
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                value={opt.amount === 0 ? "" : opt.amount}
                                                onChange={(e) => {
                                                    const newA = Number(e.target.value) || 0;
                                                    const upd = [...serviceOptions];
                                                    upd[idx].amount = newA;
                                                    setServiceOptions(upd);
                                                }}
                                                className="form-input w-full text-sm"
                                                placeholder="₹"
                                            />
                                        </div>
                                        <div className="w-20 text-right">
                                            {!opt.system && (
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => {
                                                        setServiceOptions(serviceOptions.filter((_, i) => i !== idx));
                                                        setFieldValue("services", values.services.filter((t: string) => t !== opt.value));
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-4 flex flex-wrap items-center gap-3 max-w-[36rem]">
                                    <input
                                        type="text"
                                        placeholder="New Service"
                                        className="form-input w-1/2"
                                        value={newSrvName}
                                        onChange={(e) => setNewSrvName(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        className="form-input w-24"
                                        value={newSrvAmount}
                                        onChange={(e) => setNewSrvAmount(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            const name = newSrvName.trim();
                                            if (!name) return showMessage("Enter name", "error");
                                            const value = name.toUpperCase().replace(/\s+/g, "_");
                                            if (serviceOptions.some(o => o.value === value)) return showMessage("Already exists", "warning");
                                            setServiceOptions([...serviceOptions, { label: name, value, amount: Number(newSrvAmount) || 0, system: false }]);
                                            setNewSrvName("");
                                            setNewSrvAmount("");
                                        }}
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── TRAVEL COST ── */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Travel Cost</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount && errors.travel && touched.travel ? "has-error" : ""}>
                                    <label>Travel Cost Type *</label>
                                    <Field as="select" name="travel" className="form-input">
                                        <option value="">Select</option>
                                        <option value="actual">Actual Cost</option>
                                        <option value="fixed">Fixed Cost</option>
                                    </Field>
                                    {errors.travel && touched.travel && typeof errors.travel === "string" && (
                                        <div className="text-danger mt-1">{errors.travel}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.travel && touched.travel ? "has-error" : ""}>
                                    <label>Travel Cost Type *</label>
                                    <Field as="select" name="travel" className="form-input">
                                        <option value="">Select</option>
                                        <option value="actual">Actual Cost</option>
                                        <option value="fixed">Fixed Cost</option>
                                    </Field>
                                    {errors.travel && touched.travel && typeof errors.travel === "string" && (
                                        <div className="text-danger mt-1">{errors.travel}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-5">
                            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                                {isSubmitting ? "Updating..." : "Update Manufacturer"}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default EditManufacture;