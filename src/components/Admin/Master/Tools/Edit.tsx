import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { getByToolId } from '../../../../api';   // ✅ your tool API
import { getEngineerByToolId } from '../../../../api'; // ✅ your engineer API

const EditTool = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // ✅ toolId from URL (/admin/tools/edit/:id)

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
    useEffect(() => {
        const fetchData = async () => {
            try {
                const toolRes = await getByToolId(id!); // backend returns { statusCode, data, ... }
                console.log("🚀 ~ fetchData ~ toolRes:", toolRes)
                const engineerRes = await getEngineerByToolId(id!); // backend returns { engineer, tool }

                const tool = toolRes.data; // ApiResponse wrapper
                const engineer = engineerRes.engineer;

                setInitialValues({
                    nomenclature: tool.nomenclature || '',
                    manufacturer: tool.manufacturer || '',
                    model: tool.model || '',
                    srNo: tool.SrNo || '',
                    calibrationCertificateNo: tool.calibrationCertificateNo || '',
                    calibrationValidTill: tool.calibrationValidTill?.split('T')[0] || '',
                    range: tool.range || '',
                    toolID: tool.toolId || '',
                    engineerName: engineer?.name || '', // ✅ from engineer API
                    issueDate: engineerRes.tool?.issueDate?.split('T')[0] || '',
                    submitDate: engineerRes.tool?.submitDate?.split('T')[0] || '',
                });
            } catch (error) {
                console.error("❌ Error fetching tool/engineer:", error);
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
                onSubmit={() => { }}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Tools Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Nomenclature */}
                                <div className={submitCount ? (errors.nomenclature ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="nomenclature">Nomenclature </label>
                                    <Field name="nomenclature" type="text" className="form-input" />
                                    {submitCount && errors.nomenclature && <div className="text-danger mt-1">{errors.nomenclature}</div>}
                                </div>

                                {/* Manufacturer */}
                                <div className={submitCount ? (errors.manufacturer ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="manufacturer">Manufacturer </label>
                                    <Field name="manufacturer" type="text" className="form-input" />
                                    {submitCount && errors.manufacturer && <div className="text-danger mt-1">{errors.manufacturer}</div>}
                                </div>

                                {/* Model */}
                                <div className={submitCount ? (errors.model ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="model">Model </label>
                                    <Field name="model" type="text" className="form-input" />
                                    {submitCount && errors.model && <div className="text-danger mt-1">{errors.model}</div>}
                                </div>

                                {/* Sr No */}
                                <div className={submitCount ? (errors.srNo ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="srNo">Sr No </label>
                                    <Field name="srNo" type="text" className="form-input" />
                                    {submitCount && errors.srNo && <div className="text-danger mt-1">{errors.srNo}</div>}
                                </div>

                                {/* Calibration Certificate */}
                                <div className={submitCount ? (errors.calibrationCertificateNo ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="calibrationCertificateNo">Calibration Certificate Number</label>
                                    <Field name="calibrationCertificateNo" type="text" className="form-input" />
                                    {submitCount && errors.calibrationCertificateNo && <div className="text-danger mt-1">{errors.calibrationCertificateNo}</div>}
                                </div>

                                {/* Calibration Valid Till */}
                                <div className={submitCount ? (errors.calibrationValidTill ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="calibrationValidTill">Calibration Valid Till</label>
                                    <Field name="calibrationValidTill" type="date" className="form-input" />
                                    {submitCount && errors.calibrationValidTill && <div className="text-danger mt-1">{errors.calibrationValidTill}</div>}
                                </div>

                                {/* Range */}
                                <div className={submitCount ? (errors.range ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="range">Range</label>
                                    <Field name="range" type="text" className="form-input" />
                                    {submitCount && errors.range && <div className="text-danger mt-1">{errors.range}</div>}
                                </div>

                                {/* Tool ID */}
                                <div className={submitCount ? (errors.toolID ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="toolID">Tool ID</label>
                                    <Field name="toolID" type="text" className="form-input" />
                                    {submitCount && errors.toolID && <div className="text-danger mt-1">{errors.toolID}</div>}
                                </div>

                                {/* Engineer Name (from engineer API) */}
                                <div className={submitCount ? (errors.engineerName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="engineerName">Engineer Assigned</label>
                                    <Field name="engineerName" type="text" className="form-input" />
                                    {submitCount && errors.engineerName && <div className="text-danger mt-1">{errors.engineerName}</div>}
                                </div>

                                {/* Issue Date */}
                                <div className={submitCount ? (errors.issueDate ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="issueDate">Issue Date</label>
                                    <Field name="issueDate" type="date" className="form-input" />
                                    {submitCount && errors.issueDate && <div className="text-danger mt-1">{errors.issueDate}</div>}
                                </div>

                                {/* Submit Date */}
                                <div className={submitCount ? (errors.submitDate ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="submitDate">Submit Date</label>
                                    <Field name="submitDate" type="date" className="form-input" />
                                    {submitCount && errors.submitDate && <div className="text-danger mt-1">{errors.submitDate}</div>}
                                </div>
                            </div>
                        </div>

                        <div className="w-[98%] mb-6 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-success mt-4"
                                onClick={() => {
                                    if (!errors.nomenclature) {
                                        submitForm();
                                    }
                                }}
                            >
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
