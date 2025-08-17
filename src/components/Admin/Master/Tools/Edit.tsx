import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { toolsData } from '../../../../data';

const EditTool = () => {
    const navigate = useNavigate();
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
                initialValues={{
                    nomenclature: toolsData[0].nomenclature,
                    manufacturer: toolsData[0].manufacturer,
                    model: toolsData[0].model,
                    srNo: toolsData[0].srNo,
                    calibrationCertificateNo: toolsData[0].calibrationCertificateNo,
                    calibrationValidTill: toolsData[0].calibrationValidTill,
                    range: toolsData[0].range,
                    toolID: toolsData[0].toolID,
                    engineerName: toolsData[0].engineerName,
                    submitDate: toolsData[0].submitDate,
                    issueDate: toolsData[0].issueDate,
                }}
                validationSchema={SubmittedForm}
                onSubmit={() => { }}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Tools Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount ? (errors.nomenclature ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="name">Nomenclature </label>
                                    <Field name="nomenclature" type="text" id="nnomenclatureame" placeholder="Enter State Name" className="form-input" />
                                    {submitCount && errors.nomenclature ? <div className="text-danger mt-1">{errors.nomenclature}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.manufacturer ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="manufacturer">Manufacturer </label>
                                    <Field name="manufacturer" type="text" id="manufacturer" placeholder="Enter State Name" className="form-input" />
                                    {submitCount && errors.manufacturer ? <div className="text-danger mt-1">{errors.manufacturer}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.model ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="model">Model </label>
                                    <Field name="model" type="text" id="model" placeholder="Enter State Name" className="form-input" />
                                    {submitCount && errors.model ? <div className="text-danger mt-1">{errors.model}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.srNo ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="srNo">Sr No </label>
                                    <Field name="srNo" type="text" id="srNo" placeholder="Enter State Name" className="form-input" />
                                    {submitCount && errors.srNo ? <div className="text-danger mt-1">{errors.srNo}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.calibrationCertificateNo ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="calibrationCertificateNo">Calibration Certificate Number</label>
                                    <Field name="calibrationCertificateNo" type="text" id="calibrationCertificateNo" placeholder="Enter State Name" className="form-input" />
                                    {submitCount && errors.calibrationCertificateNo ? <div className="text-danger mt-1">{errors.calibrationCertificateNo}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.calibrationValidTill ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="calibrationValidTill">Calibration Valid Till</label>
                                    <Field name="calibrationValidTill" type="date" id="calibrationValidTill" className="form-input" />
                                    {submitCount && errors.calibrationValidTill ? <div className="text-danger mt-1">{errors.calibrationValidTill}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.range ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="range">Range</label>
                                    <Field name="range" type="text" id="range" placeholder="Enter Range" className="form-input" />
                                    {submitCount && errors.range ? <div className="text-danger mt-1">{errors.range}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.toolID ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="toolID">Tool ID</label>
                                    <Field name="toolID" type="text" id="toolID" className="form-input" placeholder="Enter Tool ID" />
                                    {submitCount && errors.toolID ? <div className="text-danger mt-1">{errors.toolID}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.engineerName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="engineerName">Engineer Assigned</label>
                                    <Field name="engineerName" type="text" id="engineerName" className="form-input" placeholder="Enter Engineer Name" />
                                    {submitCount && errors.engineerName ? <div className="text-danger mt-1">{errors.engineerName}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.issueDate ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="issueDate">Issue Date</label>
                                    <Field name="issueDate" type="text" id="issueDate" className="form-input" placeholder="Enter Issue date" />
                                    {submitCount && errors.issueDate ? <div className="text-danger mt-1">{errors.issueDate}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.submitDate ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="submitDate">Submit Date</label>
                                    <Field name="submitDate" type="text" id="submitDate" className="form-input" placeholder="Enter Submit Date" />
                                    {submitCount && errors.submitDate ? <div className="text-danger mt-1">{errors.submitDate}</div> : ''}
                                </div>
                            </div>
                        </div>

                        {/* <button
                            type="submit"
                            className="btn btn-primary !mt-6"
                            onClick={() => {
                                if (touched.name && !errors.name) {
                                    submitForm();
                                }
                            }}
                        >
                            Submit Form
                        </button> */}
                        <div className="w-[98%] mb-6 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-success mt-4"
                                onClick={() => {
                                    if (touched.nomenclature && !errors.nomenclature) {
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
