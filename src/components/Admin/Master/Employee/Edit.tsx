import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { engineersData } from '../../../../data';
import { useState } from 'react';

//  Hardcoded tools
const toolsList = [
    { id: 'TL001', name: 'Caliper' },
    { id: 'TL002', name: 'Micrometer' },
    { id: 'TL003', name: 'Vernier Scale' },
];

const EditEngineer = () => {
    const navigate = useNavigate();

    const SubmittedForm = Yup.object().shape({
        name: Yup.string().required('Please fill the Field'),
        email: Yup.string().email('Invalid email').required('Please fill the Email'),
        phone: Yup.string().matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').required('Please fill the Field'),
        empId: Yup.string().required('Please fill the Field'),
        role: Yup.string().required('Please fill the Field'),
        tools: Yup.array().of(Yup.string()).min(1, 'Please select at least one tool'),
        issueDates: Yup.object().when('role', {
            is: 'Engineer',
            then: (schema) =>
                Yup.object().test(
                    'allToolsHaveDates',
                    'Please provide issue dates for selected tools',
                    function (value: any) {
                        const { tools } = this.parent;
                        return tools?.every((tool: string) => value && value[tool]);
                    }
                ),
        }),
        status: Yup.string().required('Please fill the Field'),
    });

    const submitForm = (values: any) => {
        console.log(values);
        showMessage('Form submitted successfully', 'success');
        navigate('/admin/engineers');
    };

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">Dashboard</Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/engineers" className="text-primary">Employee</Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#">Edit Employee</Link>
                </li>
            </ol>

            <Formik
                initialValues={{
                    name: engineersData[0].name,
                    email: engineersData[0].email,
                    phone: engineersData[0].phone,
                    empId: engineersData[0].empId,
                    role: engineersData[0].role,
                    tools: engineersData[0].tools || [],
                    issueDates: {
                        TL001: '2024-01-01',
                        TL002: '2024-02-15',
                        TL003: '2024-03-10',
                    } as Record<string, string>,

                    status: engineersData[0].status.tooltip,
                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, values, submitCount }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Employee Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Status */}
                                <div className={submitCount > 0 ? (errors.status ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="status">Status</label>
                                    <Field as="select" name="status" className="form-select">
                                        <option value="" disabled>Open this select menu</option>
                                        <option value="Active">Active</option>
                                        <option value="Deactive">Deactive</option>
                                    </Field>
                                    {submitCount > 0 && errors.status && <div className="text-danger mt-1">{errors.status}</div>}
                                </div>

                                {/* Name */}
                                <div className={submitCount > 0 ? (errors.name ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="name">Name</label>
                                    <Field name="name" type="text" className="form-input" placeholder="Enter Name" />
                                    {submitCount > 0 && errors.name && <div className="text-danger mt-1">{errors.name}</div>}
                                </div>

                                {/* Email */}
                                <div className={submitCount > 0 ? (errors.email ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="email">Email</label>
                                    <Field name="email" type="text" className="form-input" placeholder="Enter Email" />
                                    {submitCount > 0 && errors.email && <div className="text-danger mt-1">{errors.email}</div>}
                                </div>

                                {/* Phone */}
                                <div className={submitCount > 0 ? (errors.phone ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="phone">Phone</label>
                                    <Field name="phone" type="number" className="form-input" placeholder="Enter Phone Number" />
                                    {submitCount > 0 && errors.phone && <div className="text-danger mt-1">{errors.phone}</div>}
                                </div>

                                {/* Emp ID */}
                                <div className={submitCount > 0 ? (errors.empId ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="empId">Employee ID</label>
                                    <Field name="empId" type="text" className="form-input" placeholder="Enter Emp ID" />
                                    {submitCount > 0 && errors.empId && <div className="text-danger mt-1">{errors.empId}</div>}
                                </div>

                                {/* Role */}
                                <div className={submitCount > 0 ? (errors.role ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="role">Role</label>
                                    <Field as="select" name="role" className="form-select">
                                        <option value="" disabled>Open this select menu</option>
                                        <option value="Office Staff">Office Staff</option>
                                        <option value="Engineer">Engineer</option>
                                    </Field>
                                    {submitCount > 0 && errors.role && <div className="text-danger mt-1">{errors.role}</div>}
                                </div>
                            </div>
                        </div>

                        {/* ✅ Conditionally show tools if role === 'Engineer' */}
                        {values.role === 'Engineer' && (
                            <div className="panel">
                                <h5 className="font-semibold text-lg mb-4">Assigned Tools</h5>
                                <div className="space-y-4 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded">
                                    {toolsList.map((tool) => {
                                        const isSelected = values.tools.includes(tool.id);
                                        return (
                                            <div key={tool.id} className="border-b pb-2">
                                                <label className="flex items-center space-x-2">
                                                    <Field
                                                        type="checkbox"
                                                        name="tools"
                                                        value={tool.id}
                                                        className="form-checkbox h-5 w-5 text-primary"
                                                    />
                                                    <span>{tool.name} ({tool.id})</span>
                                                </label>

                                                {/* Issue Date for each tool */}
                                                {isSelected && (
                                                    <div className="mt-2 ml-6">
                                                        <label htmlFor={`issueDates.${tool.id}`} className="block text-sm">
                                                            Issue Date for {tool.id}
                                                        </label>
                                                        <Field
                                                            name={`issueDates.${tool.id}`}
                                                            type="date"
                                                            className="form-input"
                                                        />
                                                        {submitCount > 0 && errors.issueDates?.[tool.id] && (
                                                            <div className="text-danger text-sm mt-1">{errors.issueDates[tool.id]}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
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

export default EditEngineer;