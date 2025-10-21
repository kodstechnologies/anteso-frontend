import * as Yup from "yup";
import { Field, Form, Formik, FieldArray } from "formik";
import { Link, useNavigate, useParams } from "react-router-dom";
import { showMessage } from "../../../common/ShowMessage";
import { useEffect, useState } from "react";
import { editManufacturerById } from "../../../../api";
import { getManufacturerById } from "../../../../api"; // assuming you have a fetch API
import Cookies from "js-cookie";

const EditManufacture = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [initialValues, setInitialValues] = useState({
        manufactureName: "",
        address: "",
        contactPersonName: "",
        pinCode: "",
        branch: "",
        mouValidity: "",
        qaTests: [""],
    });

    // ✅ Validation Schema
    const SubmittedForm = Yup.object().shape({
        manufactureName: Yup.string().required("Please fill the Field"),
        address: Yup.string().required("Please fill the Field"),
        contactPersonName: Yup.string().required("Please fill the Field"),
        pinCode: Yup.string()
            .required("Please fill the Field")
            .matches(/^\d{6}$/, "Pin Code must be exactly 6 digits"),
        branch: Yup.string().required("Please fill the Field"),
        mouValidity: Yup.string().required("Please fill the Field"),
        qaTests: Yup.array().of(Yup.string().required("Please fill the Field")),
    });

    // ✅ Fetch existing manufacturer data by ID
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = Cookies.get("accessToken");
                const res = await getManufacturerById(id);
                const data = res.data.data || {};
                setInitialValues({
                    manufactureName: data.name || "",
                    address: data.address || "",
                    contactPersonName: data.contactPersonName || "",
                    pinCode: data.pincode || "",
                    branch: data.branch || "",
                    mouValidity: data.mouValidity || "",
                    qaTests: data.qaTests?.length ? data.qaTests : [""],
                });
            } catch (error) {
                console.error("Error fetching manufacturer:", error);
                showMessage("Failed to load manufacturer details", "error");
            }
        };
        fetchData();
    }, [id]);

    // ✅ Submit updated manufacturer data
    const handleSubmit = async (values: any, { setSubmitting }: any) => {
        try {
            const payload = {
                name: values.manufactureName,
                address: values.address,
                contactPersonName: values.contactPersonName,
                pincode: values.pinCode,
                branch: values.branch,
                mouValidity: values.mouValidity,
                qaTests: values.qaTests,
            };
            await editManufacturerById(id, payload);
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
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Manufacture
                    </Link>
                </li>
            </ol>

            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={SubmittedForm}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, submitCount, isSubmitting, values }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Edit Manufacturer</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Manufacture Name */}
                                <div className={submitCount ? (errors.manufactureName ? "has-error" : "has-success") : ""}>
                                    <label htmlFor="manufactureName">Manufacture Name</label>
                                    <Field name="manufactureName" type="text" id="manufactureName" className="form-input" placeholder="Enter Manufacture Name" />
                                    {submitCount > 0 && errors.manufactureName && <div className="text-danger mt-1">{errors.manufactureName}</div>}
                                </div>

                                {/* Address */}
                                <div className={submitCount ? (errors.address ? "has-error" : "has-success") : ""}>
                                    <label htmlFor="address">Address</label>
                                    <Field name="address" type="text" id="address" className="form-input" placeholder="Enter Address" />
                                    {submitCount > 0 && errors.address && <div className="text-danger mt-1">{errors.address}</div>}
                                </div>

                                {/* Contact Person */}
                                <div className={submitCount ? (errors.contactPersonName ? "has-error" : "has-success") : ""}>
                                    <label htmlFor="contactPersonName">Contact Person Name</label>
                                    <Field name="contactPersonName" type="text" id="contactPersonName" className="form-input" placeholder="Enter Contact Person Name" />
                                    {submitCount > 0 && errors.contactPersonName && <div className="text-danger mt-1">{errors.contactPersonName}</div>}
                                </div>

                                {/* Pin Code */}
                                <div className={submitCount ? (errors.pinCode ? "has-error" : "has-success") : ""}>
                                    <label htmlFor="pinCode">Pin Code</label>
                                    <Field
                                        name="pinCode"
                                        type="text"
                                        id="pinCode"
                                        className="form-input"
                                        placeholder="Enter Pin Code"
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                        }}
                                    />
                                    {submitCount > 0 && errors.pinCode && <div className="text-danger mt-1">{errors.pinCode}</div>}
                                </div>

                                {/* Branch */}
                                <div className={submitCount ? (errors.branch ? "has-error" : "has-success") : ""}>
                                    <label htmlFor="branch">Branch</label>
                                    <Field name="branch" type="text" id="branch" className="form-input" placeholder="Enter Branch" />
                                    {submitCount > 0 && errors.branch && <div className="text-danger mt-1">{errors.branch}</div>}
                                </div>

                                {/* Mou Validity */}
                                <div className={submitCount ? (errors.mouValidity ? "has-error" : "has-success") : ""}>
                                    <label htmlFor="mouValidity">MOU Validity</label>
                                    <Field name="mouValidity" type="text" id="mouValidity" className="form-input" placeholder="Enter MOU Validity" />
                                    {submitCount > 0 && errors.mouValidity && <div className="text-danger mt-1">{errors.mouValidity}</div>}
                                </div>

                                {/* QA Tests (Dynamic FieldArray) */}
                                <div className="col-span-3">
                                    <label>QA Tests</label>
                                    <FieldArray
                                        name="qaTests"
                                        render={(arrayHelpers) => (
                                            <div className="space-y-2">
                                                {values.qaTests.map((test, index) => (
                                                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                                        {/* Test Name */}
                                                        <div>
                                                            <Field
                                                                name={`qaTests.${index}.testName`}
                                                                type="text"
                                                                className="form-input"
                                                                placeholder={`Enter Test Name ${index + 1}`}
                                                            />
                                                        </div>

                                                        {/* Price */}
                                                        <div>
                                                            <Field
                                                                name={`qaTests.${index}.price`}
                                                                type="number"
                                                                className="form-input"
                                                                placeholder="Enter Price"
                                                            />
                                                        </div>

                                                        {/* Remove Button */}
                                                        <div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger"
                                                                onClick={() => arrayHelpers.remove(index)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Add QA Test */}
                                                <button
                                                    type="button"
                                                    className="btn btn-primary mt-2"
                                                    onClick={() => arrayHelpers.push({ testName: "", price: "" })}
                                                >
                                                    + Add QA Test
                                                </button>
                                            </div>
                                        )}
                                    />
                                </div>

                            </div>
                        </div>

                        <div className="w-[98%] mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success mt-4" disabled={isSubmitting}>
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
