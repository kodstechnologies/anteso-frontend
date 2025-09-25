import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { manufacturers } from '../../../../data';

const EditManufacture = () => {
    const SubmittedForm = Yup.object().shape({
        manufactureName: Yup.string().required('Please fill the Field'),
        address: Yup.string().required('Please fill the Field'),
        contactPersonName: Yup.string().required('Please fill the Field'),
        pinCode: Yup.string().required('Please fill the Field'),
        branch: Yup.string().required('Please fill the Field'),
        mouValidity: Yup.string().required('Please fill the Field'),
    });
    const submitForm = () => {
        showMessage('Form submitted successfully', 'success');
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
                initialValues={{
                    manufactureName: manufacturers[0].manufactureName,
                    address: manufacturers[0].address,
                    contactPersonName: manufacturers[0].contactPersonName,
                    pinCode: manufacturers[0].pinCode,
                    branch: manufacturers[0].branch,
                    mouValidity: manufacturers[0].mouValidity,
                }}
                validationSchema={SubmittedForm}
                onSubmit={() => {}}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Manufacturer Leads</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount ? (errors.manufactureName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="manufactureName">Manufacture Name </label>
                                    <Field name="manufactureName" type="text" id="manufactureName" placeholder="Enter Manufacture Name" className="form-input" />
                                    {submitCount && errors.manufactureName ? <div className="text-danger mt-1">{errors.manufactureName}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.address ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="address"> Address </label>
                                    <Field name="address" type="text" id="address" placeholder="Enter Address" className="form-input" />
                                    {submitCount && errors.address ? <div className="text-danger mt-1">{errors.address}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.contactPersonName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="contactPersonName">Contact Person Name </label>
                                    <Field name="contactPersonName" type="text" id="contactPersonName" placeholder="Enter Contact Person Name" className="form-input" />
                                    {submitCount && errors.contactPersonName ? <div className="text-danger mt-1">{errors.contactPersonName}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.pinCode ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="pinCode">Pin code </label>
                                    <Field name="pinCode" type="text" id="pinCode" placeholder="Enter Mobile Number" className="form-input" />
                                    {submitCount && errors.pinCode ? <div className="text-danger mt-1">{errors.pinCode}</div> : ''}
                                </div>

                                <div className={submitCount ? (errors.branch ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="branch" typeof="date">
                                        Branch
                                    </label>
                                    <Field name="branch" type="text" id="branch" className="form-input" placeholder="Enter Tool ID" />
                                    {submitCount && errors.branch ? <div className="text-danger mt-1">{errors.branch}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.mouValidity ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="mouValidity" typeof="date">
                                        Mou Validity
                                    </label>
                                    <Field name="mouValidity" type="text" id="mouValidity" className="form-input" placeholder="Enter Tool ID" />
                                    {submitCount && errors.mouValidity ? <div className="text-danger mt-1">{errors.mouValidity}</div> : ''}
                                </div>
                            </div>
                        </div>
                        <div className="w-[98%] mb-6 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-success mt-4"
                                onClick={() => {
                                    if (touched.manufactureName && !errors.manufactureName) {
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

export default EditManufacture;
