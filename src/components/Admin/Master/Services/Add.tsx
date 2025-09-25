import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';

const AddServices = () => {
    const SubmittedForm = Yup.object().shape({
        serviceType: Yup.string().required('Please fill the Field'),
        serviceName: Yup.string().required('Please fill the Field'),
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
                    <Link to="/admin/services" className="text-primary hover:underline">
                        <span>Services</span>
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Add</span>
                </li>
            </ul>
            <Formik
                initialValues={{
                    serviceType: '',
                    serviceName: '',
                }}
                validationSchema={SubmittedForm}
                onSubmit={() => {}}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className={submitCount ? (errors.serviceType ? 'has-error' : 'has-success') : ''}>
                            <label htmlFor="serviceType">Service Type</label>
                            <Field name="serviceType" type="text" id="serviceType" placeholder="Enter Service Type" className="form-input" />
                            {submitCount ? errors.serviceType ? <div className="text-danger mt-1">{errors.serviceType}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                        </div>
                        <div className={submitCount ? (errors.serviceName ? 'has-error' : 'has-success') : ''}>
                            <label htmlFor="serviceName">Service Name</label>
                            <Field name="serviceName" type="text" id="serviceName" placeholder="Enter Service Name" className="form-input" />
                            {submitCount ? errors.serviceName ? <div className="text-danger mt-1">{errors.serviceName}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary !mt-6"
                            onClick={() => {
                                if (touched.serviceType && !errors.serviceType) {
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

export default AddServices;
