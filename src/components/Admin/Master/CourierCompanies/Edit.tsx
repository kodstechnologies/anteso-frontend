import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { courierCompanies } from '../../../../data';

const EditCourierCompanie = () => {
    const SubmittedForm = Yup.object().shape({
        status: Yup.string().required('Please fill the Field'),
        companyName: Yup.string().required('Please fill the Field'),
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
                    <Link to="/admin/courier-companies" className="text-primary">
                        Courier Companies
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Courier Companies
                    </Link>
                </li>
            </ol>
            <Formik
                initialValues={{
                    companyName: courierCompanies[0].companyName,
                    status: courierCompanies[0].status.tooltip,
                }}
                validationSchema={SubmittedForm}
                onSubmit={() => {}}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className={submitCount ? (errors.status ? 'has-error' : 'has-success') : ''}>
                            <label htmlFor="status">Status</label>
                            <Field as="select" name="status" className="form-select">
                                <option value="" disabled>
                                    Open this select menu
                                </option>
                                <option value="Active">Active</option>
                                <option value="Deactive">Deactive</option>
                            </Field>
                            {submitCount ? (
                                errors.status ? (
                                    <div className=" text-danger mt-1">{errors.status}</div>
                                ) : (
                                    <div className=" text-[#1abc9c] mt-1">Example valid custom select feedback</div>
                                )
                            ) : (
                                ''
                            )}
                        </div>
                        <div className={submitCount ? (errors.companyName ? 'has-error' : 'has-success') : ''}>
                            <label htmlFor="companyName">Company Name</label>
                            <Field name="companyName" type="text" id="companyName" placeholder="Enter Company Name" className="form-input" />
                            {submitCount ? errors.companyName ? <div className="text-danger mt-1">{errors.companyName}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                        </div>

                        <div className="w-full mb-6 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-success !mt-6"
                                onClick={() => {
                                    if (touched.companyName && !errors.companyName) {
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

export default EditCourierCompanie;
