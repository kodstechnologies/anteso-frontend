import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { statesData } from '../../../../data';

const AddCity = () => {
    const SubmittedForm = Yup.object().shape({
        stateName: Yup.string().required('Please fill the Field'),
        cityName: Yup.string().required('Please fill the Field'),
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
                    <span>Add</span>
                </li>
            </ul>
            <Formik
                initialValues={{
                    stateName: '',
                    cityName: '',
                }}
                validationSchema={SubmittedForm}
                onSubmit={() => {}}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className={submitCount ? (errors.stateName ? 'has-error' : 'has-success') : ''}>
                            <label htmlFor="stateName">State Name </label>
                            <Field as="select" name="stateName" className="form-select">
                                <option value="" disabled>
                                    Open this select menu
                                </option>
                                {statesData.map((state) => (
                                    <option key={state.id} value={state.stateName}>
                                        {state.stateName}
                                    </option>
                                ))}
                            </Field>
                            {submitCount ? (
                                errors.stateName ? (
                                    <div className=" text-danger mt-1">{errors.stateName}</div>
                                ) : (
                                    <div className=" text-[#1abc9c] mt-1">Example valid custom select feedback</div>
                                )
                            ) : (
                                ''
                            )}
                        </div>
                        <div className={submitCount ? (errors.cityName ? 'has-error' : 'has-success') : ''}>
                            <label htmlFor="cityName">City Name </label>
                            <Field name="cityName" type="text" id="cityName" placeholder="Enter City Name" className="form-input" />

                            {submitCount ? errors.cityName ? <div className="text-danger mt-1">{errors.cityName}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
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

export default AddCity;
