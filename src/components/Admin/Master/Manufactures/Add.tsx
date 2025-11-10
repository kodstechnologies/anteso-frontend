// ─────────────────────────────────────────────────────────────────────────────
//  AddManufacture.tsx
// ─────────────────────────────────────────────────────────────────────────────
import type React from "react";
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { Link, useNavigate } from "react-router-dom";
import { showMessage } from "../../../common/ShowMessage";
import { useEffect, useState } from "react";
import { createManufacturer, getAllStates } from "../../../../api";

// ───── QA-TESTS (system + custom) ─────────────────────────────────────────────
const systemQaTests = [
    { label: "FIXED X RAY", value: "FIXED_X_RAY", price: 3500, system: true },
    { label: "MOBILE X RAY", value: "MOBILE_X_RAY", price: 2500, system: true },
    { label: "C ARM", value: "C_ARM", price: 3000, system: true },
    { label: "MAMMOGRAP", value: "MAMMOGRAP", price: 4000, system: true },
    { label: "CATH LAB", value: "CATH_LAB", price: 5000, system: true },
    { label: "CT SCAN", value: "CT_SCAN", price: 6000, system: true },
    { label: "TATKAL QA", value: "TATKAL_QA", price: 5000, system: true },
];

// ───── SERVICES (default + system flag) ─────────────────
const defaultServices = [
    { label: "Institute Registration", value: "INSTITUTE_REGISTRATION", amount: 0, system: true },
    { label: "Procurement", value: "PROCUREMENT", amount: 0, system: true },
    { label: "License", value: "LICENSE", amount: 0, system: true },
];

const AddManufacture = () => {
    const navigate = useNavigate();

    // ── QA-TEST state ───────────────────────────────────────────────────────
    const [qaOptions, setQaOptions] = useState(systemQaTests);
    const [newQaName, setNewQaName] = useState("");
    const [newQaPrice, setNewQaPrice] = useState("");

    // ── SERVICE state ───────────────────────────────────────────────────────
    const [serviceOptions, setServiceOptions] = useState(defaultServices);
    const [newSrvName, setNewSrvName] = useState("");
    const [newSrvAmount, setNewSrvAmount] = useState("");

    // ── STATES dropdown ─────────────────────────────────────────────────────
    const [stateOptions, setStateOptions] = useState<string[]>([]);

    // ── FETCH STATES ────────────────────────────────────────────────────────
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

    // ── YUP SCHEMA ───────────────────────────────────────────────────────────
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
        services: Yup.array()
            .of(Yup.string())
            .min(1, "Please select at least one service"),

        travel: Yup.string().required("Please select travel type"),

        // Fixed cost as STRING to avoid "0" error
        fixedCost: Yup.string().when("travel", {
            is: "fixed",
            then: (schema) =>
                schema
                    .required("Fixed cost is required")
                    .test("is-positive-number", "Enter a valid amount", (val) => {
                        if (!val) return false;
                        const num = Number(val);
                        return !isNaN(num) && num >= 0;
                    }),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

    const submitForm = async (values: any, { resetForm }: any) => {
        try {
            const qaPayload = values.qaTests.map((v: string) => {
                const opt = qaOptions.find((o) => o.value === v);
                return { testName: opt?.label ?? v, price: opt?.price ?? 0 };
            });

            const servicePayload = values.services.map((v: string) => {
                const opt = serviceOptions.find((o) => o.value === v);
                return {
                    serviceName: opt?.label ?? v,
                    amount: opt?.amount ?? 0,
                };
            });

            // ── FINAL payload ───────────────────────────────────────────────────
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

            const res = await createManufacturer(payload);
            const { statusCode, message } = res.data;

            if (statusCode === 201) {
                showMessage(message || "Manufacturer created successfully", "success");
                resetForm();
                navigate("/admin/manufacture");
            } else if (statusCode === 400) {
                showMessage(message || "Validation error — check phone/email", "warning");
            } else if (statusCode === 401) {
                showMessage("Unauthorized: Please login again.", "error");
            } else {
                showMessage(message || "Something went wrong", "error");
            }
        } catch (e: any) {
            console.error(e);
            showMessage("Server error: Failed to create manufacturer", "error");
        }
    };

    // ── RENDER ───────────────────────────────────────────────────────────────
    return (
        <>
            {/* Breadcrumb */}
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
                    Add Manufacture
                </li>
            </ol>

            <h5 className="font-semibold text-lg mb-4">Manufacturer</h5>

            <Formik
                initialValues={{
                    manufactureName: "",
                    address: "",
                    email: "",
                    phone: "",
                    city: "",
                    state: "",
                    pinCode: "",
                    branch: "",
                    mouValidity: "",
                    contactPersonName: "",
                    qaTests: [] as string[],
                    services: [] as string[],
                    travel: "",
                    fixedCost: "",
                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, touched, setFieldValue, values }) => (
                    <Form className="space-y-5">

                        {/* ────────────────────── BASIC DETAILS ────────────────────── */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                {/* ── Manufacture Name ── */}
                                <div className={submitCount && errors.manufactureName && touched.manufactureName ? "has-error" : ""}>
                                    <label htmlFor="manufactureName">Manufacture Name</label>
                                    <Field name="manufactureName" type="text" id="manufactureName"
                                        placeholder="Enter Manufacture Name" className="form-input" />
                                    { errors.manufactureName && touched.manufactureName && (
                                        <div className="text-danger mt-1">{errors.manufactureName}</div>
                                    )}
                                </div>

                                {/* ── Address ── */}
                                <div className={submitCount && errors.address && touched.address ? "has-error" : ""}>
                                    <label htmlFor="address">Full Address</label>
                                    <Field name="address" type="text" id="address"
                                        placeholder="Enter Full Address" className="form-input" />
                                    { errors.address && touched.address && (
                                        <div className="text-danger mt-1">{errors.address}</div>
                                    )}
                                </div>

                                {/* ── City ── */}
                                <div className={submitCount && errors.city && touched.city ? "has-error" : ""}>
                                    <label htmlFor="city">City</label>
                                    <Field name="city" type="text" id="city"
                                        placeholder="Enter City" className="form-input" />
                                    { errors.city && touched.city && (
                                        <div className="text-danger mt-1">{errors.city}</div>
                                    )}
                                </div>

                                {/* ── Contact Person ── */}
                                <div className={submitCount && errors.contactPersonName && touched.contactPersonName ? "has-error" : ""}>
                                    <label htmlFor="contactPersonName">Contact Person Name</label>
                                    <Field name="contactPersonName" type="text" id="contactPersonName"
                                        placeholder="Enter Contact Person Name" className="form-input" />
                                    {errors.contactPersonName && touched.contactPersonName && (
                                        <div className="text-danger mt-1">{errors.contactPersonName}</div>
                                    )}
                                </div>

                                {/* ── State ── */}
                                <div className={submitCount && errors.state && touched.state ? "has-error" : ""}>
                                    <label htmlFor="state">State</label>
                                    <Field as="select" name="state" id="state" className="form-input">
                                        <option value="">Select State</option>
                                        {stateOptions.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </Field>
                                    { errors.state && touched.state && (
                                        <div className="text-danger mt-1">{errors.state}</div>
                                    )}
                                </div>

                                {/* ── Pin Code ── */}
                                <div className={submitCount && errors.pinCode && touched.pinCode ? "has-error" : ""}>
                                    <label htmlFor="pinCode">Pin Code</label>
                                    <Field
                                        name="pinCode"
                                        type="text"
                                        id="pinCode"
                                        placeholder="Enter Pin Code"
                                        className="form-input"
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                            setFieldValue("pinCode", e.target.value);
                                        }}
                                    />
                                    { errors.pinCode && touched.pinCode && (
                                        <div className="text-danger mt-1">{errors.pinCode}</div>
                                    )}
                                </div>

                                {/* ── Branch ── */}
                                <div className={submitCount && errors.branch && touched.branch ? "has-error" : ""}>
                                    <label htmlFor="branch">Branch</label>
                                    <Field name="branch" type="text" id="branch"
                                        placeholder="Enter Branch" className="form-input" />
                                    { errors.branch && touched.branch && (
                                        <div className="text-danger mt-1">{errors.branch}</div>
                                    )}
                                </div>

                                {/* ── Email ── */}
                                <div className={submitCount && errors.email && touched.email ? "has-error" : ""}>
                                    <label htmlFor="email">Email</label>
                                    <Field name="email" type="email" id="email"
                                        placeholder="Enter Email" className="form-input" />
                                    { errors.email && touched.email && (
                                        <div className="text-danger mt-1">{errors.email}</div>
                                    )}
                                </div>

                                {/* ── Phone ── */}
                                <div className={submitCount && errors.phone && touched.phone ? "has-error" : ""}>
                                    <label htmlFor="phone">Phone</label>
                                    <Field
                                        name="phone"
                                        type="text"
                                        id="phone"
                                        placeholder="Enter Phone Number"
                                        className="form-input"
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                            setFieldValue("phone", e.target.value);
                                        }}
                                    />
                                    { errors.phone && touched.phone && (
                                        <div className="text-danger mt-1">{errors.phone}</div>
                                    )}
                                </div>

                                {/* ── MOU Validity ── */}
                                <div className={submitCount && errors.mouValidity && touched.mouValidity ? "has-error" : ""}>
                                    <label htmlFor="mouValidity">MOU Validity</label>
                                    <Field
                                        name="mouValidity"
                                        type="date"
                                        id="mouValidity"
                                        className="form-input"
                                        min={new Date().toISOString().split("T")[0]}
                                    />
                                    {errors.mouValidity && touched.mouValidity && (
                                        <div className="text-danger mt-1">{errors.mouValidity}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ────────────────────── QA TEST SECTION ────────────────────── */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">QA Test</h5>

                            <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-center max-w-[36rem] font-semibold text-sm text-gray-700">
                                    <div className="w-1/2">QA Test</div>
                                    <div className="w-24 text-center">Price ₹</div>
                                    <div className="w-20 text-right">Action</div>
                                </div>

                                {/* List */}
                                {qaOptions.map((opt, idx) => (
                                    <div key={opt.value} className="flex items-center max-w-[36rem] gap-2">
                                        {/* Checkbox + label */}
                                        <div className="flex items-center gap-2 w-1/2">
                                            <Field
                                                type="checkbox"
                                                name="qaTests"
                                                value={opt.value}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const checked = e.target.checked;
                                                    const cur = values.qaTests || [];
                                                    setFieldValue(
                                                        "qaTests",
                                                        checked ? [...cur, opt.value] : cur.filter((t: string) => t !== opt.value)
                                                    );
                                                }}
                                            />
                                            <label className="text-sm">{opt.label}</label>
                                        </div>

                                        {/* Price */}
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
                                                placeholder="₹"
                                            />
                                        </div>

                                        {/* Delete (only custom) */}
                                        <div className="w-20 text-right">
                                            {!opt.system && (
                                                <button
                                                    type="button"
                                                    className="btn btn-danger"
                                                    onClick={() => {
                                                        setQaOptions(qaOptions.filter((_, i) => i !== idx));
                                                        setFieldValue(
                                                            "qaTests",
                                                            values.qaTests.filter((t: string) => t !== opt.value)
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add new QA */}
                                <div className="mt-4 flex flex-wrap items-center gap-3 max-w-[36rem]">
                                    <input
                                        type="text"
                                        placeholder="New QA Test Name"
                                        className="form-input w-1/2"
                                        value={newQaName}
                                        onChange={(e) => setNewQaName(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price ₹"
                                        className="form-input w-24"
                                        value={newQaPrice}
                                        onChange={(e) => setNewQaPrice(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            const name = newQaName.trim();
                                            if (!name) return showMessage("Enter a name", "error");
                                            const value = name.toUpperCase().replace(/\s+/g, "_");
                                            if (qaOptions.some((o) => o.value === value))
                                                return showMessage("Already exists", "warning");

                                            setQaOptions([
                                                ...qaOptions,
                                                { label: name, value, price: Number(newQaPrice) || 0, system: false },
                                            ]);
                                            setNewQaName("");
                                            setNewQaPrice("");
                                            showMessage("QA test added", "success");
                                        }}
                                    >
                                        + Add QA Test
                                    </button>
                                </div>

                                {/* Update All (optional) */}
                                <div className="flex justify-end mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => showMessage("QA Test prices updated", "success")}
                                    >
                                        Update All
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ────────────────────── SERVICES SECTION ────────────────────── */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Services</h5>

                            <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-center max-w-[36rem] font-semibold text-sm text-gray-700">
                                    <div className="w-1/2">Service</div>
                                    <div className="w-24 text-center">Amount ₹</div>
                                    <div className="w-20 text-right">Action</div>
                                </div>

                                {/* List */}
                                {serviceOptions.map((opt, idx) => (
                                    <div key={opt.value} className="flex items-center max-w-[36rem] gap-2">
                                        {/* Checkbox + label */}
                                        <div className="flex items-center gap-2 w-1/2">
                                            <Field
                                                type="checkbox"
                                                name="services"
                                                value={opt.value}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const checked = e.target.checked;
                                                    const cur = values.services || [];
                                                    setFieldValue(
                                                        "services",
                                                        checked ? [...cur, opt.value] : cur.filter((t: string) => t !== opt.value)
                                                    );
                                                }}
                                            />
                                            <label className="text-sm">{opt.label}</label>
                                        </div>

                                        {/* Amount – show empty when 0 */}
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

                                        {/* Delete – only for custom (non-system) services */}
                                        <div className="w-20 text-right">
                                            {opt.system !== true && (
                                                <button
                                                    type="button"
                                                    className="btn btn-danger"
                                                    onClick={() => {
                                                        setServiceOptions(serviceOptions.filter((_, i) => i !== idx));
                                                        setFieldValue(
                                                            "services",
                                                            values.services.filter((t: string) => t !== opt.value)
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add new Service */}
                                <div className="mt-4 flex flex-wrap items-center gap-3 max-w-[36rem]">
                                    <input
                                        type="text"
                                        placeholder="New Service Name"
                                        className="form-input w-1/2"
                                        value={newSrvName}
                                        onChange={(e) => setNewSrvName(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Amount ₹"
                                        className="form-input w-24"
                                        value={newSrvAmount}
                                        onChange={(e) => setNewSrvAmount(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            const name = newSrvName.trim();
                                            if (!name) return showMessage("Enter a name", "error");
                                            const value = name.toUpperCase().replace(/\s+/g, "_");
                                            if (serviceOptions.some((o) => o.value === value))
                                                return showMessage("Already exists", "warning");

                                            setServiceOptions([
                                                ...serviceOptions,
                                                {
                                                    label: name,
                                                    value,
                                                    amount: Number(newSrvAmount) || 0,
                                                    system: false,
                                                },
                                            ]);
                                            setNewSrvName("");
                                            setNewSrvAmount("");
                                            showMessage("Service added", "success");
                                        }}
                                    >
                                        + Add Service
                                    </button>
                                </div>

                                {/* Update All (optional) */}
                                <div className="flex justify-end mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => showMessage("Service amounts updated", "success")}
                                    >
                                        Update All
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ────────────────────── TRAVEL COST ────────────────────── */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Travel Cost</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount && errors.travel && touched.travel ? "has-error" : ""}>
                                    <label htmlFor="travel">Travel Cost Type</label>
                                    <Field as="select" name="travel" id="travel" className="form-input">
                                        <option value="">Select Travel Cost Type</option>
                                        <option value="actual">Actual Cost</option>
                                        <option value="fixed">Fixed Cost</option>
                                    </Field>
                                    { errors.travel && touched.travel && (
                                        <div className="text-danger mt-1">{errors.travel}</div>
                                    )}
                                </div>

                                {values.travel === "fixed" && (
                                    <div className={submitCount && errors.fixedCost && touched.fixedCost ? "has-error" : ""}>
                                        <label htmlFor="fixedCost">Enter Fixed Cost (₹)</label>
                                        <Field
                                            name="fixedCost"
                                            type="number"
                                            id="fixedCost"
                                            placeholder="Enter Fixed Cost"
                                            className="form-input"
                                        />
                                        { errors.fixedCost && touched.fixedCost && (
                                            <div className="text-danger mt-1">{errors.fixedCost}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ────────────────────── SUBMIT ────────────────────── */}
                        <div className="flex justify-end mt-5">
                            <button type="submit" className="btn btn-success">
                                Submit
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default AddManufacture;