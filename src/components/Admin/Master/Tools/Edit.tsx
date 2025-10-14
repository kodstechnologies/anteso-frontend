import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { getAllTechnicians, getByToolId, updateTool } from '../../../../api';
import { getEngineerByToolId } from '../../../../api';

const EditTool = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [technicians, setTechnicians] = useState<any[]>([]);

    const [initialValues, setInitialValues] = useState<any>(null);

    const SubmittedForm = Yup.object().shape({
        nomenclature: Yup.string().required('Please fill the Field'),
        manufacturer: Yup.string().required('Please fill the Field'),
        model: Yup.string().required('Please fill the Field'),
        srNo: Yup.string().required('Please fill the Field'),
        calibrationCertificateNo: Yup.string().required('Please fill the Field'),
        calibrationValidTill: Yup.string().required('Please fill the Field'),
        range: Yup.string().required('Please fill the Field'),
        toolID: Yup.string().required('Please fill the Field'),
        engineerName: Yup.string().required('Please fill the Field'),
        issueDate: Yup.string().required('Please fill the Field'),
        submitDate: Yup.string().required('Please fill the Field'),
    });

    const submitForm = () => {
        showMessage('Form submitted successfully', 'success');
        navigate('/admin/tools');
    };

    // ✅ Fetch tool + engineer
    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             const toolRes = await getByToolId(id!); // backend returns { statusCode, data, ... }
    //             console.log("🚀 ~ fetchData ~ toolRes:", toolRes)
    //             const engineerRes = await getEngineerByToolId(id!); // backend returns { engineer, tool }

    //             const tool = toolRes.data; // ApiResponse wrapper
    //             const engineer = engineerRes.engineer;

    //             setInitialValues({
    //                 nomenclature: tool.nomenclature || '',
    //                 manufacturer: tool.manufacturer || '',
    //                 model: tool.model || '',
    //                 srNo: tool.SrNo || '',
    //                 calibrationCertificateNo: tool.calibrationCertificateNo || '',
    //                 calibrationValidTill: tool.calibrationValidTill?.split('T')[0] || '',
    //                 range: tool.range || '',
    //                 toolID: tool.toolId || '',
    //                 engineerName: engineer?.name || '', // ✅ from engineer API
    //                 issueDate: engineerRes.tool?.issueDate?.split('T')[0] || '',
    //                 submitDate: engineerRes.tool?.submitDate?.split('T')[0] || '',
    //             });
    //         } catch (error) {
    //             console.error("❌ Error fetching tool/engineer:", error);
    //         }
    //     };
    //     fetchData();
    // }, [id]);

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             // ✅ Step 1: Always fetch tool details
    //             const toolRes = await getByToolId(id!);
    //             const tool = toolRes?.data || {};
    //             console.log("✅ Tool data:", tool);

    //             // ✅ Step 2: Try to fetch engineer (may fail)
    //             let engineer = null;
    //             let toolIssueDate = '';
    //             let toolSubmitDate = '';

    //             try {
    //                 const engineerRes = await getEngineerByToolId(id!);
    //                 engineer = engineerRes?.engineer || null;
    //                 toolIssueDate = engineerRes?.tool?.issueDate?.split('T')[0] || '';
    //                 toolSubmitDate = engineerRes?.tool?.submitDate?.split('T')[0] || '';
    //             } catch (err) {
    //                 console.warn("⚠️ No engineer found for this tool:", err);
    //             }

    //             // ✅ Step 3: Set all fields safely
    //             setInitialValues({
    //                 nomenclature: tool.nomenclature || '',
    //                 manufacturer: tool.manufacturer || '',
    //                 model: tool.model || '',
    //                 srNo: tool.SrNo || '',
    //                 calibrationCertificateNo: tool.calibrationCertificateNo || '',
    //                 calibrationValidTill: tool.calibrationValidTill?.split('T')[0] || '',
    //                 range: tool.range || '',
    //                 toolID: tool.toolId || '',
    //                 engineerName: engineer?.name || 'Not Assigned', // fallback label
    //                 issueDate: toolIssueDate,
    //                 submitDate: toolSubmitDate,
    //             });
    //         } catch (error) {
    //             console.error("❌ Error fetching tool details:", error);
    //         }
    //     };

    //     fetchData();
    // }, [id]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                // ✅ Step 1: Fetch all technicians for dropdown
                const allTechRes = await getAllTechnicians();
                setTechnicians(allTechRes?.technicians || allTechRes?.data || []); // handle both response shapes

                // ✅ Step 2: Always fetch tool details
                const toolRes = await getByToolId(id!);
                const tool = toolRes?.data || {};

                // ✅ Step 3: Try to fetch engineer (may fail)
                let engineer = null;
                let toolIssueDate = '';
                let toolSubmitDate = '';

                try {
                    const engineerRes = await getEngineerByToolId(id!);
                    engineer = engineerRes?.engineer || null;
                    toolIssueDate = engineerRes?.tool?.issueDate?.split('T')[0] || '';
                    toolSubmitDate = engineerRes?.tool?.submitDate?.split('T')[0] || '';
                } catch (err) {
                    console.warn("⚠️ No engineer found for this tool:", err);
                }

                // ✅ Step 4: Set form initial values
                setInitialValues({
                    nomenclature: tool.nomenclature || '',
                    manufacturer: tool.manufacturer || '',
                    model: tool.model || '',
                    srNo: tool.SrNo || '',
                    calibrationCertificateNo: tool.calibrationCertificateNo || '',
                    calibrationValidTill: tool.calibrationValidTill?.split('T')[0] || '',
                    range: tool.range || '',
                    toolID: tool.toolId || '',
                    // engineerName: engineer?.name || 'Not Assigned',
                    engineerName: engineer?._id || '', // store ObjectId here

                    issueDate: toolIssueDate,
                    submitDate: toolSubmitDate,
                });
            } catch (error) {
                console.error("❌ Error fetching data:", error);
            }
        };

        fetchData();
    }, [id]);


    if (!initialValues) {
        return <p>Loading tool details...</p>;
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
                    <Link to="/admin/tools" className="text-primary">
                        Tools
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Tools
                    </Link>
                </li>
            </ol>

            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={SubmittedForm}
                onSubmit={async (values, { setSubmitting }) => {
                    try {
                        // Prepare payload for backend
                        const payload = {
                            SrNo: values.srNo,
                            nomenclature: values.nomenclature,
                            manufacturer: values.manufacturer,
                            model: values.model,
                            calibrationCertificateNo: values.calibrationCertificateNo,
                            calibrationValidTill: values.calibrationValidTill,
                            range: values.range,
                            certificate: values.certificate,
                            toolStatus: values.toolStatus,
                            technician: values.engineerName, // <-- this is now the ObjectId from dropdown
                        };


                        await updateTool(id!, payload);

                        showMessage("Tool updated successfully!", "success");
                        navigate('/admin/tools');
                    } catch (error: any) {
                        showMessage(error.message || "Failed to update tool", "error");
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {({ submitCount }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Tools Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                {/* Nomenclature */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="nomenclature">Nomenclature </label>
                                    <Field name="nomenclature" type="text" className="form-input" />
                                    <ErrorMessage name="nomenclature">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Manufacturer */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="manufacturer">Manufacturer </label>
                                    <Field name="manufacturer" type="text" className="form-input" />
                                    <ErrorMessage name="manufacturer">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Model */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="model">Model </label>
                                    <Field name="model" type="text" className="form-input" />
                                    <ErrorMessage name="model">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Sr No */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="srNo">Sr No </label>
                                    <Field name="srNo" type="text" className="form-input" />
                                    <ErrorMessage name="srNo">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Calibration Certificate */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="calibrationCertificateNo">Calibration Certificate Number</label>
                                    <Field name="calibrationCertificateNo" type="text" className="form-input" />
                                    <ErrorMessage name="calibrationCertificateNo">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Calibration Valid Till */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="calibrationValidTill">Calibration Valid Till</label>
                                    <Field name="calibrationValidTill" type="date" className="form-input" />
                                    <ErrorMessage name="calibrationValidTill">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Range */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="range">Range</label>
                                    <Field name="range" type="text" className="form-input" />
                                    <ErrorMessage name="range">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Tool ID */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="toolID">Tool ID</label>
                                    <Field name="toolID" type="text" className="form-input" />
                                    <ErrorMessage name="toolID">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Engineer Name */}
                                {/* <Field name="engineerName" type="text" className="form-input" /> */}
                                {/* <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="engineerName">Engineer Assigned</label>
                                    <Field
                                        name="engineerName"
                                        type="text"
                                        disabled={initialValues.engineerName === "Not Assigned"}
                                        className="form-input disabled:bg-gray-100"
                                    />

                                    <ErrorMessage name="engineerName">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div> */}
                                {/* Engineer Name (Dropdown or Assigned Name) */}
                                {/* <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="engineerName">Engineer Assigned</label>

                                    {initialValues.engineerName === "Not Assigned" ? (
                                        <Field as="select" name="engineerName" className="form-select">
                                            <option value="">Select Engineer</option>
                                            {technicians.length > 0 ? (
                                                technicians.map((tech) => (
                                                    <option key={tech._id} value={tech.name}>
                                                        {tech.name}
                                                    </option>
                                                ))
                                            ) : (
                                                <option disabled>Loading engineers...</option>
                                            )}
                                        </Field>
                                    ) : (
                                        <Field
                                            name="engineerName"
                                            type="text"
                                            disabled
                                            className="form-input disabled:bg-gray-100"
                                        />
                                    )}

                                    <ErrorMessage name="engineerName">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div> */}

                                {/* <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="engineerName">Engineer Assigned</label>

                                    {initialValues.engineerName === "Not Assigned" ? (
                                        <Field as="select" name="engineerName" className="form-select">
                                            <option value="">Select Engineer</option>
                                            {technicians.map((tech) => (
                                                // Send tech._id instead of tech.name
                                                <option key={tech._id} value={tech._id}>
                                                    {tech.name}
                                                </option>
                                            ))}
                                        </Field>
                                    ) : (
                                        <Field
                                            name="engineerName"
                                            type="text"
                                            disabled
                                            className="form-input disabled:bg-gray-100"
                                        />
                                    )}

                                    <ErrorMessage name="engineerName">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div> */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="engineerName">Engineer Assigned</label>

                                    <Field as="select" name="engineerName" className="form-select">
                                        <option value="">Select Engineer</option>
                                        {technicians.map((tech) => (
                                            <option key={tech._id} value={tech._id}>
                                                {tech.name}
                                            </option>
                                        ))}
                                    </Field>

                                    <ErrorMessage name="engineerName">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>


                                {/* Issue Date */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="issueDate">Issue Date</label>
                                    <Field name="issueDate" type="date" className="form-input" />
                                    <ErrorMessage name="issueDate">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Submit Date */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="submitDate">Submit Date</label>
                                    <Field name="submitDate" type="date" className="form-input" />
                                    <ErrorMessage name="submitDate">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                            </div>
                        </div>

                        <div className="w-[98%] mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success mt-4">
                                Submit Form
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>

        </>
    );
};

export default EditTool;
