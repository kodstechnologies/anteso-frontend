import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { engineersData } from '../../../../data';

const EditEngineer = () => {
    const navigate = useNavigate();
    const SubmittedForm = Yup.object().shape({
        name: Yup.string().required('Please fill the Field'),
        email: Yup.string().email('Invalid email').required('Please fill the Email'),
        phone: Yup.string()
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .required('Please fill the Field'),
        empId: Yup.string().required('Please fill the Field'),
        role: Yup.string().required('Please fill the Field'),
        tools: Yup.array().of(Yup.string()).min(1, 'Please select at least one tool').required('Please select at least one tool'),

        status: Yup.string().required('Please fill the Field'),
    });
    const submitForm = () => {
        showMessage('Form submitted successfully', 'success');
        navigate('/admin/engineers');
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
                    <Link to="/admin/engineers" className="text-primary">
                        Employee
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Employee
                    </Link>
                </li>
            </ol>
            <Formik
                initialValues={{
                    name: engineersData[0].name,
                    email: engineersData[0].email,
                    phone: engineersData[0].phone,
                    empId: engineersData[0].empId,
                    role: engineersData[0].role,
                    tools: engineersData[0].tools,
                    status: engineersData[0].status.tooltip,
                }}
                validationSchema={SubmittedForm}
                onSubmit={() => {}}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Employee Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount ? (errors.status ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="status">Status</label>
                                    <Field as="select" name="status" className="form-select">
                                        <option value="" disabled>
                                            Open this select menu
                                        </option>
                                        <option value="Active">Active</option>
                                        <option value="Deactive">Deactive</option>
                                    </Field>
                                    {submitCount && errors.status ? <div className=" text-danger mt-1">{errors.status}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.name ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="name">Name </label>
                                    <Field name="name" type="text" id="name" placeholder="Enter Name" className="form-input" />
                                    {submitCount && errors.name ? <div className="text-danger mt-1">{errors.name}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.email ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="email">Email </label>
                                    <Field name="email" type="text" id="email" placeholder="Enter Email Address" className="form-input" />
                                    {submitCount && errors.email ? <div className="text-danger mt-1">{errors.email}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.phone ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="phone">Phone </label>
                                    <Field name="phone" type="number" id="phone" placeholder="Enter Phone Number" className="form-input" />
                                    {submitCount && errors.phone ? <div className="text-danger mt-1">{errors.phone}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.empId ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="empId">Employee ID </label>
                                    <Field name="empId" type="text" id="empId" placeholder="Enter Emp ID" className="form-input" />
                                    {submitCount && errors.empId ? <div className="text-danger mt-1">{errors.empId}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.role ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="role">Role</label>
                                    <Field as="select" name="role" className="form-select">
                                        <option value="" disabled>
                                            Open this select menu
                                        </option>
                                        <option value="Office Staff">Office Staff</option>
                                        <option value="Engineer">Engineer</option>
                                    </Field>
                                    {submitCount && errors.role ? <div className=" text-danger mt-1">{errors.role}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.tools ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="tools">Tools </label>
                                    <Field name="tools" type="text" id="tools" placeholder="Enter Tools" className="form-input" />
                                    {submitCount && errors.tools ? <div className="text-danger mt-1">{errors.tools}</div> : ''}
                                </div>
                            </div>
                        </div>

                        <div className="w-full mb-6 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-success !mt-6"
                                onClick={() => {
                                    if (touched.name && !errors.name) {
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

export default EditEngineer;
