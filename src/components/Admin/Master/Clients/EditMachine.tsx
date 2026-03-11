import * as Yup from "yup"
import { Field, Form, Formik } from "formik"
import { Link, useNavigate, useParams } from "react-router-dom"
import { showMessage } from "../../../common/ShowMessage"
import { useState, useEffect } from "react"
import FullScreenLoader from "../../../common/FullScreenLoader"
import { getMachineById, updateMachine } from "../../../../api"

const EditMachine = () => {
    const navigate = useNavigate()
    const { clientId, hospitalId, machineId } = useParams()
    const [loading, setLoading] = useState(false)
    const [dataLoading, setDataLoading] = useState(true)
    const [initialValues, setInitialValues] = useState<any>(null)

    useEffect(() => {
        const fetchMachine = async () => {
            if (!machineId || !hospitalId) return
            try {
                const data = await getMachineById(machineId, hospitalId)
                setInitialValues({
                    machineType: data.machineType || "",
                    make: data.make || "",
                    model: data.model || "",
                    serialNumber: data.serialNumber || "",
                    equipmentId: data.equipmentId || "",
                    qaValidity: data.qaValidity ? new Date(data.qaValidity).toISOString().split('T')[0] : "",
                    licenseValidity: data.licenseValidity ? new Date(data.licenseValidity).toISOString().split('T')[0] : "",
                    qaReportAttachment: null,
                    licenseReportAttachment: null,
                    rawDataAttachment: null,
                })
            } catch (error: any) {
                showMessage(error.message || "Failed to fetch machine details", "error")
                navigate(`/admin/clients/preview/${clientId}/${hospitalId}`)
            } finally {
                setDataLoading(false)
            }
        }
        fetchMachine()
    }, [machineId, hospitalId, clientId, navigate])

    const SubmittedForm = Yup.object().shape({
        machineType: Yup.string().required("Please fill the Machine Type"),
        make: Yup.string().required("Please fill the Make"),
        model: Yup.string().required("Please fill the Model"),
        serialNumber: Yup.string().required("Please fill the Serial Number"),
        equipmentId: Yup.string().required("Please fill the Equipment ID"),
        qaValidity: Yup.date().required("Please fill the QA Validity"),
        licenseValidity: Yup.date().required("Please fill the License Validity"),
    })

    if (dataLoading) return <div className="p-5">Loading...</div>

    return (
        <>
            {loading && <FullScreenLoader message="Updating machine, please wait..." />}
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
                    <Link to={`/admin/clients/preview/${clientId}/${hospitalId}`} className="text-primary">
                        Hospital Details
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Machine
                    </Link>
                </li>
            </ol>
            <Formik
                initialValues={initialValues}
                validationSchema={SubmittedForm}
                enableReinitialize={true}
                onSubmit={async (values, { setSubmitting }) => {
                    setLoading(true)
                    try {
                        const formData = new FormData();
                        Object.entries(values).forEach(([key, value]) => {
                            if (value !== null && value !== undefined) {
                                if (value instanceof File) {
                                    formData.append(key, value);
                                } else {
                                    formData.append(key, String(value));
                                }
                            }
                        });

                        await updateMachine(machineId!, formData);
                        showMessage("Machine updated successfully!", "success")
                        navigate(`/admin/clients/preview/${clientId}/${hospitalId}`)
                    } catch (error: any) {
                        showMessage(error.message || "Failed to update machine", "error")
                    } finally {
                        setSubmitting(false)
                        setLoading(false)
                    }
                }}
            >
                {({ errors, submitCount, touched, setFieldValue }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Edit Machine Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className={submitCount && errors.machineType ? "has-error" : ""}>
                                    <label htmlFor="machineType">Machine Type</label>
                                    <Field as="select" name="machineType" id="machineType" className="form-select">
                                        <option value="">Select Machine Type</option>
                                        <option value="Fixed X-Ray">Fixed X-Ray</option>
                                        <option value="Mobile X-Ray">Mobile X-Ray</option>
                                        <option value="C-Arm">C-Arm</option>
                                        <option value="Cath Lab/Interventional Radiology">Cath Lab/Interventional Radiology</option>
                                        <option value="Mammography">Mammography</option>
                                        <option value="CT Scan">CT Scan</option>
                                        <option value="PET CT">PET CT</option>
                                        <option value="CT Simulator">CT Simulator</option>
                                        <option value="OPG">OPG</option>
                                        <option value="CBCT">CBCT</option>
                                        <option value="BMD/DEXA">BMD/DEXA</option>
                                        <option value="Dental IOPA">Dental IOPA</option>
                                        <option value="Dental Hand Held">Dental Hand Held</option>
                                        <option value="O Arm">O Arm</option>
                                        <option value="KV Imaging (OBI)">KV Imaging (OBI)</option>
                                        <option value="Lead Apron Test">Lead Apron Test</option>
                                        <option value="Thyroid Shield Test">Thyroid Shield Test</option>
                                        <option value="Gonad Shield Test">Gonad Shield Test</option>
                                        <option value="Radiation Survey of Radiation Facility">Radiation Survey of Radiation Facility</option>
                                        <option value="Others">Others</option>
                                    </Field>
                                    {submitCount && errors.machineType ? <div className="text-danger mt-1">{errors.machineType as string}</div> : null}
                                </div>
                                <div className={submitCount && errors.make ? "has-error" : ""}>
                                    <label htmlFor="make">Make</label>
                                    <Field name="make" type="text" id="make" className="form-input" />
                                    {submitCount && errors.make ? <div className="text-danger mt-1">{errors.make as string}</div> : null}
                                </div>
                                <div className={submitCount && errors.model ? "has-error" : ""}>
                                    <label htmlFor="model">Model</label>
                                    <Field name="model" type="text" id="model" className="form-input" />
                                    {submitCount && errors.model ? <div className="text-danger mt-1">{errors.model as string}</div> : null}
                                </div>
                                <div className={submitCount && errors.serialNumber ? "has-error" : ""}>
                                    <label htmlFor="serialNumber">Serial Number</label>
                                    <Field name="serialNumber" type="text" id="serialNumber" className="form-input" />
                                    {submitCount && errors.serialNumber ? <div className="text-danger mt-1">{errors.serialNumber as string}</div> : null}
                                </div>
                                <div className={submitCount && errors.equipmentId ? "has-error" : ""}>
                                    <label htmlFor="equipmentId">Equipment ID</label>
                                    <Field name="equipmentId" type="text" id="equipmentId" className="form-input" />
                                    {submitCount && errors.equipmentId ? <div className="text-danger mt-1">{errors.equipmentId as string}</div> : null}
                                </div>
                                <div className={submitCount && errors.qaValidity ? "has-error" : ""}>
                                    <label htmlFor="qaValidity">QA Validity</label>
                                    <Field name="qaValidity" type="date" id="qaValidity" className="form-input" />
                                    {submitCount && errors.qaValidity ? <div className="text-danger mt-1">{errors.qaValidity as string}</div> : null}
                                </div>
                                <div className={submitCount && errors.licenseValidity ? "has-error" : ""}>
                                    <label htmlFor="licenseValidity">License Validity</label>
                                    <Field name="licenseValidity" type="date" id="licenseValidity" className="form-input" />
                                    {submitCount && errors.licenseValidity ? <div className="text-danger mt-1">{errors.licenseValidity as string}</div> : null}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                                <div>
                                    <label htmlFor="qaReportAttachment">QA Report Attachment (New)</label>
                                    <input
                                        type="file"
                                        id="qaReportAttachment"
                                        onChange={(e) => setFieldValue("qaReportAttachment", e.target.files?.[0])}
                                        className="form-input"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="licenseReportAttachment">License Report Attachment (New)</label>
                                    <input
                                        type="file"
                                        id="licenseReportAttachment"
                                        onChange={(e) => setFieldValue("licenseReportAttachment", e.target.files?.[0])}
                                        className="form-input"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="rawDataAttachment">Raw Data Attachment (New)</label>
                                    <input
                                        type="file"
                                        id="rawDataAttachment"
                                        onChange={(e) => setFieldValue("rawDataAttachment", e.target.files?.[0])}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="w-full flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => navigate(`/admin/clients/preview/${clientId}/${hospitalId}`)}
                                className="btn btn-outline-danger"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-success">
                                Update Machine
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    )
}

export default EditMachine
