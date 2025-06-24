import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { statesData } from '../../../../data';

const EditState = () => {
    const SubmittedForm = Yup.object().shape({
        stateName: Yup.string().required('Please fill the Field'),
        status: Yup.string().required('Please fill the Field'),
    });
    const submitForm = () => {
        showMessage('Form submitted successfully', 'success');
    };
    return (
        <>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to="/admin/state" className="text-primary hover:underline">
                        <span>State</span>
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Edit</span>
                </li>
            </ul>
            <Formik
                initialValues={{
                    stateName: statesData[0].stateName,
                    status: statesData[0].status.tooltip,
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
                        <div className={submitCount ? (errors.stateName ? 'has-error' : 'has-success') : ''}>
                            <label htmlFor="stateName">State Name </label>
                            <Field name="stateName" type="text" id="stateName" placeholder="Enter State Name" className="form-input" />

                            {submitCount ? errors.stateName ? <div className="text-danger mt-1">{errors.stateName}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary !mt-6"
                            onClick={() => {
                                if (touched.stateName && !errors.stateName) {
                                    submitForm();
                                }
                            }}
                        >
                            Submit Form
                        </button>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default EditState;
