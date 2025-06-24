import * as Yup from 'yup';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { showMessage } from '../../../common/ShowMessage';
import { toolsData } from '../../../../data';

// Define the interface for the tool data
interface Tool {
    id: number;
    nomenclature: string;
    manufacturer: string;
    model: string;
    srNo: string;
    calibrationCertificateNo: string;
    calibrationDate: string;
    calibrationValidTill: string;
    range: string;
    toolID: string;
}

const AddEngineer = () => {
    const [requiredTools, setRequiredTools] = useState(0);
    const navigate = useNavigate();

    // Validation schema for the form
    const SubmittedForm = Yup.object().shape({
        name: Yup.string().required('Please fill the Field'),
        email: Yup.string().email('Invalid email').required('Please fill the Email'),
        phone: Yup.string()
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .required('Please fill the Field'),
        empId: Yup.string().required('Please fill the Field'),
        role: Yup.string().required('Please fill the Field'),
        toolID: Yup.string().when('fieldName', {
            is: 'Engineer',
            then: (schema) => schema.required('Please select a tool'),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

    // Handle form submission
    const submitForm = async (
        values: {
            name: string;
            email: string;
            phone: string;
            empId: string;
            role: string;
            toolID: string;
        },
        {
            resetForm,
        }: FormikHelpers<{
            name: string;
            email: string;
            phone: string;
            empId: string;
            role: string;
            toolID: string;
        }>
    ) => {
        showMessage('Form submitted successfully', 'success');
        resetForm();
        setRequiredTools(0); // Reset required tools counter on submission
        navigate('/admin/engineers');
    };

    // Increment required tools count
    const handleRequireTool = () => {
        setRequiredTools((prev) => prev + 1);
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
                    <Link to="/admin/employee" className="text-primary">
                        Employee
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Add Employee
                    </Link>
                </li>
            </ol>
            <Formik
                initialValues={{
                    name: '',
                    email: '',
                    phone: '',
                    empId: '',
                    role: '',
                    toolID: '',
                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, touched, values }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount && errors.name ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="name">Name </label>
                                    <Field name="name" type="text" id="name" placeholder="Enter Name" className="form-input" />
                                    {submitCount && errors.name ? <div className="text-danger mt-1">{errors.name}</div> : ''}
                                </div>
                                <div className={submitCount && errors.email ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="email">Email </label>
                                    <Field name="email" type="text" id="email" placeholder="Enter Email Address" className="form-input" />
                                    {submitCount && errors.email ? <div className="text-danger mt-1">{errors.email}</div> : ''}
                                </div>
                                <div className={submitCount && errors.phone ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="phone">Phone </label>
                                    <Field name="phone" type="number" id="phone" placeholder="Enter Phone Number" className="form-input" />
                                    {submitCount && errors.phone ? <div className="text-danger mt-1">{errors.phone}</div> : ''}
                                </div>
                                <div className={submitCount && errors.empId ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="empId">Employee ID </label>
                                    <Field name="empId" type="text" id="empId" placeholder="Enter Emp ID" className="form-input" />
                                    {submitCount && errors.empId ? <div className="text-danger mt-1">{errors.empId}</div> : ''}
                                </div>
                                <div className={submitCount && errors.role ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="role">Role</label>
                                    <Field as="select" name="role" className="form-select">
                                        <option value="" disabled>
                                            Select Role
                                        </option>
                                        <option value="Office Staff">Office Staff</option>
                                        <option value="Engineer">Engineer</option>
                                    </Field>
                                    {submitCount && errors.role ? <div className="text-danger mt-1">{errors.role}</div> : ''}
                                </div>
                            </div>
                        </div>
                        {values.role === 'Engineer' && (
                            <div className="panel">
                                <h5 className="font-semibold text-lg mb-4">Tools</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className={submitCount && errors.toolID ? 'has-error' : submitCount ? 'has-success' : ''}>
                                        <label className="block mb-2">Select Tools</label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded">
                                            {toolsData.map((tool: Tool) => (
                                                <label key={tool.toolID} className="flex items-center space-x-2">
                                                    <Field type="checkbox" name="toolIDs" value={tool.toolID} className="form-checkbox h-5 w-5 text-primary" />
                                                    <span>
                                                        {tool.nomenclature} ({tool.toolID})
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        {submitCount && errors.toolID ? <div className="text-danger mt-1">{errors.toolID}</div> : ''}
                                    </div>
                                </div>
                                {/* <div className="mt-4">
                                    <h6 className="font-semibold">Required Tools: {requiredTools}</h6>
                                    <button type="button" className="btn btn-primary mt-2" onClick={handleRequireTool}>
                                        Require One More Tool
                                    </button>
                                </div> */}
                            </div>
                        )}
                        <div className="w-full mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success !mt-6">
                                Submit Form
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default AddEngineer;
