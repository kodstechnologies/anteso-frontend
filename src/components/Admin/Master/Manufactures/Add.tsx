import type React from "react";
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { Link, useNavigate } from "react-router-dom";
import { showMessage } from "../../../common/ShowMessage";
import Select from "react-select";
import { useEffect, useState } from "react";
import { createManufacturer, getAllStates } from "../../../../api"; // ✅ Import your API

// Define the options for QA Test checkboxes with their respective prices
const qaTestOptions = [
    { label: "FIXED X RAY", value: "FIXED_X_RAY", price: 3500, system: true },
    { label: "MOBILE X RAY", value: "MOBILE_X_RAY", price: 2500, system: true },
    { label: "C ARM", value: "C_ARM", price: 3000, system: true },
    { label: "MAMMOGRAP", value: "MAMMOGRAP", price: 4000, system: true },
    { label: "CATH LAB", value: "CATH_LAB", price: 5000, system: true },
    { label: "CT SCAN", value: "CT_SCAN", price: 6000, system: true },
    { label: "TATKAL QA", value: "TATKAL_QA", price: 5000, system: true },
];

// Define the options for the Services multi-select dropdown
const serviceOptions = [
    { label: "Institute Registration", value: "INSTITUTE_REGISTRATION" },
    { label: "Procurement", value: "PROCUREMENT" },
    { label: "License", value: "LICENSE" },
];

const AddManufacture = () => {
    const [editableOptions, setEditableOptions] = useState(qaTestOptions);
    const [newQaTestPrice, setNewQaTestPrice] = useState("");
    const [newQaTestName, setNewQaTestName] = useState("");
    const [stateOptions, setStateOptions] = useState<string[]>([]); // For states dropdown

    const navigate = useNavigate();

    // Yup validation schema
    const SubmittedForm = Yup.object().shape({
        manufactureName: Yup.string().required("Please fill the Field"),
        address: Yup.string().required("Please fill the Field"),
        city: Yup.string().required("Please fill the Field"),
        state: Yup.string().required("Please fill the Field"),
        pinCode: Yup.string().required("Please fill the Field"),
        branch: Yup.string().required("Please fill the Field"),
        mouValidity: Yup.string().required("Please fill the Field"),
        qaTests: Yup.array(), // ✅ No longer required
        services: Yup.array().min(1, "Please select at least one service"),
        travel: Yup.string().required("Please select travel type"),
        email: Yup.string().email("Invalid email").required("Please enter email"),
        phone: Yup.string().required("Please enter phone number"),
        contactPersonName: Yup.string().required("Please enter contact person name"),
    });

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const res = await getAllStates();
                // Assuming res.data.data is the array of state names
                setStateOptions(res.data.data || []);
            } catch (error) {
                console.error("Failed to fetch states:", error);
            }
        };
        fetchStates();
    }, []);
    // Form submission handler
    // Form submission handler
    const submitForm = async (values: any, { resetForm }: any) => {
        try {
            const payload: any = {
                name: values.manufactureName,
                email: values.email || "",
                phone: values.phone || "",
                password: values.password || "",
                address: values.address,
                city: values.city,
                state: values.state,
                pincode: values.pinCode,
                branch: values.branch,
                mouValidity: values.mouValidity,
                contactPersonName: values.contactPersonName,
                qaTests: values.qaTests.map((test: string) => {
                    const option = editableOptions.find((opt) => opt.value === test);
                    return {
                        testName: option?.label || test,
                        price: option?.price || 0,
                    };
                }),
                services: values.services,
                travelCost: values.travel === "actual" ? "Actual Cost" : "Fixed Cost",
            };

            // ✅ Add cost only if "Fixed Cost" is selected
            if (values.travel === "fixed") {
                payload.cost = values.fixedCost;
            }

            const res = await createManufacturer(payload);
            const { statusCode, message } = res.data;

            // ✅ Handle based on backend statusCode
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

            console.log("🚀 ~ submitForm response:", res.data);
        } catch (error: any) {
            console.error("❌ submitForm error:", error);
            showMessage("Server error: Failed to create manufacturer", "error");
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
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Add Manufacture
                    </Link>
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
                        {/* Basic Details Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount ? (errors.manufactureName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="manufactureName">Manufacture Name </label>
                                    <Field name="manufactureName" type="text" id="manufactureName" placeholder="Enter Manufacture Name" className="form-input" />
                                    {submitCount && errors.manufactureName ? <div className="text-danger mt-1">{errors.manufactureName}</div> : null}
                                </div>
                                <div className={submitCount && errors.address ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="address">Full Address</label>
                                    <Field name="address" type="text" id="address" placeholder="Enter Full Address" className="form-input" />
                                    {submitCount && errors.address ? <div className="text-danger mt-1">{errors.address}</div> : null}
                                </div>
                                <div className={submitCount && errors.city ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="city">City</label>
                                    <Field name="city" type="text" id="city" placeholder="Enter City" className="form-input" />
                                    {submitCount && errors.city ? <div className="text-danger mt-1">{errors.city}</div> : null}
                                </div>
                                <div className={submitCount && errors.contactPersonName ? 'has-error' : submitCount ? 'has-success' : ''}>
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

                                <div className={submitCount && errors.state ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="state">State</label>
                                    <Field
                                        as="select"
                                        name="state"
                                        id="state"
                                        className="form-input"
                                    >
                                        <option value="">Select State</option>
                                        {stateOptions.map((state) => (
                                            <option key={state} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </Field>
                                    {submitCount && errors.state ? (
                                        <div className="text-danger mt-1">{errors.state}</div>
                                    ) : null}
                                </div>
                                {/* <div className={submitCount && errors.pinCode ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="pinCode">Pin Code</label>
                                    <Field name="pinCode" type="text" id="pinCode" className="form-input" placeholder="Enter Pin Code" />
                                    {submitCount && errors.pinCode ? <div className="text-danger mt-1">{errors.pinCode}</div> : null}
                                </div> */}
                                <div className={submitCount && errors.pinCode ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="pinCode">Pin Code</label>
                                    <Field
                                        name="pinCode"
                                        type="text"
                                        id="pinCode"
                                        placeholder="Enter Pin Code"
                                        className="form-input"
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
                                            setFieldValue("pinCode", e.target.value);
                                        }}
                                    />
                                    {submitCount && errors.pinCode ? <div className="text-danger mt-1">{errors.pinCode}</div> : null}
                                </div>
                                <div className={submitCount && errors.branch ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="branch">Branch</label>
                                    <Field name="branch" type="text" id="branch" className="form-input" placeholder="Enter Branch" />
                                    {submitCount && errors.branch ? <div className="text-danger mt-1">{errors.branch}</div> : null}
                                </div>
                                <div className={submitCount && errors.email ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="email">Email</label>
                                    <Field name="email" type="email" id="email" placeholder="Enter Email" className="form-input" />
                                    {submitCount && errors.email ? <div className="text-danger mt-1">{errors.email}</div> : null}
                                </div>

                                {/* <div className={submitCount && errors.phone ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="phone">Phone</label>
                                    <Field name="phone" type="text" id="phone" placeholder="Enter Phone Number" className="form-input" />
                                    {submitCount && errors.phone ? <div className="text-danger mt-1">{errors.phone}</div> : null}
                                </div> */}

                                <div className={submitCount && errors.phone ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="phone">Phone</label>
                                    <Field
                                        name="phone"
                                        type="text"
                                        id="phone"
                                        placeholder="Enter Phone Number"
                                        className="form-input"
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); // Only digits, max 10
                                            setFieldValue("phone", e.target.value);
                                        }}
                                    />
                                    {submitCount && errors.phone ? <div className="text-danger mt-1">{errors.phone}</div> : null}
                                </div>

                                {/* <div className={submitCount && errors.mouValidity ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="mouValidity">Mou Validity</label>
                                    <Field
                                        name="mouValidity"
                                        type="date"
                                        id="mouValidity"
                                        className="form-input"
                                    />
                                    {submitCount && errors.mouValidity ? (
                                        <div className="text-danger mt-1">{errors.mouValidity}</div>
                                    ) : null}
                                </div> */}
                                <div className={submitCount && errors.mouValidity ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="mouValidity">Mou Validity</label>
                                    <Field
                                        name="mouValidity"
                                        type="date"
                                        id="mouValidity"
                                        className="form-input"
                                        min={new Date().toISOString().split("T")[0]} // ✅ disables past dates
                                    />
                                    {submitCount && errors.mouValidity ? (
                                        <div className="text-danger mt-1">{errors.mouValidity}</div>
                                    ) : null}
                                </div>

                            </div>
                        </div>

                        {/* QA Test Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">QA Test</h5>

                            <div className="space-y-3">
                                {/* Header Row for Labels */}
                                <div className="flex items-center max-w-[36rem] font-semibold text-sm text-gray-700">
                                    <div className="w-1/2">QA Test</div>
                                    <div className="w-24 text-center">Price ₹</div>
                                    <div className="w-20 text-right">Action</div>
                                </div>

                                {editableOptions.map((option, index) => (
                                    <div key={option.value} className="flex items-center max-w-[36rem] gap-2">
                                        {/* QA Test Checkbox & Label */}
                                        <div className="flex items-center gap-2 w-1/2">
                                            <Field
                                                type="checkbox"
                                                name="qaTests"
                                                value={option.value}
                                                id={option.value}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const checked = e.target.checked;
                                                    const currentTests = values.qaTests || [];
                                                    if (checked) {
                                                        setFieldValue('qaTests', [...currentTests, option.value]);
                                                    } else {
                                                        setFieldValue(
                                                            'qaTests',
                                                            currentTests.filter((test: string) => test !== option.value)
                                                        );
                                                    }
                                                }}
                                            />
                                            <label htmlFor={option.value} className="text-sm">
                                                {option.label}
                                            </label>
                                        </div>

                                        {/* Price Input */}
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                value={option.price}
                                                onChange={(e) => {
                                                    const newPrice = parseFloat(e.target.value) || 0;
                                                    const updatedOptions = [...editableOptions];
                                                    updatedOptions[index].price = newPrice;
                                                    setEditableOptions(updatedOptions);
                                                }}
                                                className="form-input w-full text-sm"
                                                placeholder="₹"
                                            />
                                        </div>

                                        {/* Delete Button */}
                                        <div className="w-20 text-right">
                                            {!option.system && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditableOptions(editableOptions.filter((_, i) => i !== index));
                                                        setFieldValue(
                                                            'qaTests',
                                                            values.qaTests.filter((test: string) => test !== option.value)
                                                        );
                                                    }}
                                                    // className="text-red-600 text-xs"
                                                    className="btn btn-danger"

                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add New QA Test Inputs */}
                                <div className="mt-4 flex flex-wrap items-center gap-3 max-w-[36rem]">
                                    <input
                                        type="text"
                                        placeholder="New QA Test Name"
                                        className="form-input w-1/2"
                                        value={newQaTestName}
                                        onChange={(e) => setNewQaTestName(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price ₹"
                                        className="form-input w-24"
                                        value={newQaTestPrice}
                                        onChange={(e) => setNewQaTestPrice(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            const trimmedName = newQaTestName.trim();
                                            const formattedValue = trimmedName.toUpperCase().replace(/\s+/g, '_');
                                            const isDuplicate = editableOptions.some(opt => opt.value === formattedValue);

                                            if (!trimmedName) {
                                                showMessage('Please enter QA test name.', 'error');
                                                return;
                                            }
                                            if (isDuplicate) {
                                                showMessage('This QA test already exists.', 'warning');
                                                return;
                                            }

                                            const newOption = {
                                                label: trimmedName,
                                                value: formattedValue,
                                                price: parseFloat(newQaTestPrice) || 0,
                                                system: false,
                                            };

                                            setEditableOptions([...editableOptions, newOption]);
                                            setNewQaTestName('');
                                            setNewQaTestPrice('');
                                            showMessage('QA test added.', 'success');
                                        }}
                                    >
                                        + Add QA Test
                                    </button>
                                </div>

                                <div className="flex justify-end mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            showMessage('QA Test prices updated successfully.', 'success');
                                        }}
                                    >
                                        Update All
                                    </button>
                                </div>
                            </div>
                        </div>


                        {/* Services Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Services</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount && errors.services ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="services" className="block mb-1">
                                        Select Services
                                    </label>
                                    <Select
                                        isMulti
                                        name="services"
                                        options={serviceOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        onChange={(selectedOptions) => {
                                            const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
                                            setFieldValue('services', values);
                                        }}
                                        value={serviceOptions.filter((option) => Array.isArray(values.services) && values.services.includes(option.value))}
                                        placeholder="Select Services..."
                                        menuPortalTarget={document.body} // 👈 portal
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }), // 👈 set high z-index
                                        }}
                                    />
                                    {submitCount && errors.services ? <div className="text-danger mt-1">{errors.services}</div> : null}
                                </div>
                            </div>
                        </div>

                        {/* Other Section */}
                        {/* <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Other</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount && errors.travel ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="travel">Travel Cost</label>
                                    <Field name="travel" type="number" id="travel" placeholder="Enter Travel Cost" className="form-input" />
                                    {submitCount && errors.travel ? <div className="text-danger mt-1">{errors.travel}</div> : null}
                                </div>
                                <div className={submitCount && errors.actual ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="actual">Actual Cost</label>
                                    <Field name="actual" type="number" id="actual" placeholder="Enter Actual Cost" className="form-input" />
                                    {submitCount && errors.actual ? <div className="text-danger mt-1">{errors.actual}</div> : null}
                                </div>
                                <div className={submitCount && errors.fixed ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="fixed">Fixed Cost</label>
                                    <Field name="fixed" type="number" id="fixed" placeholder="Enter Fixed Cost" className="form-input" />
                                    {submitCount && errors.fixed ? <div className="text-danger mt-1">{errors.fixed}</div> : null}
                                </div>
                            </div>
                        </div> */}
                        {/* 
                        <div className="panel">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount && errors.travel ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="travel">Travel Cost</label>
                                    <Field as="select" name="travel" id="travel" className="form-input">
                                        <option value="">Select Travel Cost Type</option>
                                        <option value="actual">Actual Cost</option>
                                        <option value="fixed">Fixed Cost</option>
                                    </Field>
                                    {submitCount && errors.travel ? <div className="text-danger mt-1">{errors.travel}</div> : null}
                                </div>
                            </div>
                        </div> */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Travel Cost</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Travel Type Dropdown */}
                                <div className={submitCount && errors.travel ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="travel">Travel Cost Type</label>
                                    <Field as="select" name="travel" id="travel" className="form-input">
                                        <option value="">Select Travel Cost Type</option>
                                        <option value="actual">Actual Cost</option>
                                        <option value="fixed">Fixed Cost</option>
                                    </Field>
                                    {submitCount && errors.travel ? <div className="text-danger mt-1">{errors.travel}</div> : null}
                                </div>

                                {/* Conditional Fixed Cost Field */}
                                {values.travel === "fixed" && (
                                    <div className={submitCount && errors.fixedCost ? 'has-error' : submitCount ? 'has-success' : ''}>
                                        <label htmlFor="fixedCost">Enter Fixed Cost (₹)</label>
                                        <Field
                                            name="fixedCost"
                                            type="number"
                                            id="fixedCost"
                                            placeholder="Enter Fixed Cost"
                                            className="form-input"
                                        />
                                        {submitCount && errors.fixedCost ? (
                                            <div className="text-danger mt-1">{errors.fixedCost}</div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Submit Button */}
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
