'use client';

import type React from 'react';

import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import Select from 'react-select';
import { useState } from 'react';

// Define the options for QA Test checkboxes with their respective prices
const qaTestOptions = [
    { label: 'FIXED X RAY', value: 'FIXED_X_RAY', price: 3500 },
    { label: 'MOBILE X RAY', value: 'MOBILE_X_RAY', price: 2500 },
    { label: 'C ARM', value: 'C_ARM', price: 3000 },
    { label: 'MAMMOGRAP', value: 'MAMMOGRAP', price: 4000 },
    { label: 'CATH LAB', value: 'CATH_LAB', price: 5000 },
    { label: 'CT SCAN', value: 'CT_SCAN', price: 6000 },
    { label: 'TATKAL QA', value: 'TATKAL_QA', price: 5000 },
];

// Define the options for the Services multi-select dropdown
const serviceOptions = [
    { label: 'Institute Registration', value: 'INSTITUTE_REGISTRATION' },
    { label: 'Procurement', value: 'PROCUREMENT' },
    { label: 'License', value: 'LICENSE' },
];

const AddManufacture = () => {
    // Initialize state for editable QA test options
    const [editableOptions, setEditableOptions] = useState(qaTestOptions);

    // Yup validation schema
    const SubmittedForm = Yup.object().shape({
        manufactureName: Yup.string().required('Please fill the Field'),
        address: Yup.string().required('Please fill the Field'),
        city: Yup.string().required('Please fill the Field'),
        state: Yup.string().required('Please fill the Field'),
        pinCode: Yup.string().required('Please fill the Field'),
        branch: Yup.string().required('Please fill the Field'),
        mouValidity: Yup.string().required('Please fill the Field'),
        qaTests: Yup.array().min(1, 'Please select at least one QA Test'),
        services: Yup.array().min(1, 'Please select at least one service'),
        travel: Yup.number().required('Please fill the Field').min(0, 'Travel cost cannot be negative'),
        actual: Yup.number().required('Please fill the Field').min(0, 'Actual cost cannot be negative'),
        fixed: Yup.number().required('Please fill the Field').min(0, 'Fixed cost cannot be negative'),
    });

    // Form submission handler
    const submitForm = (values: any) => {
        // Include the updated prices in the submitted values
        const updatedValues = {
            ...values,
            qaTests: values.qaTests.map((test: string) => {
                const option = editableOptions.find((opt) => opt.value === test);
                return { value: test, price: option?.price || 0 };
            }),
        };
        console.log('Form Values:', updatedValues);
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
                        Add Manufacture
                    </Link>
                </li>
            </ol>

            <h5 className="font-semibold text-lg mb-4">Manufacturer</h5>
            <Formik
                initialValues={{
                    manufactureName: '',
                    address: '',
                    city: '',
                    state: '',

                    pinCode: '',
                    branch: '',
                    mouValidity: '',
                    qaTests: [] as string[],
                    services: [] as string[],
                    travel: '',
                    actual: '',
                    fixed: '',
                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, touched, setFieldValue, values }) => (
                    <Form className="space-y-5">
                        {/* Basic Details Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount ? (errors.manufactureName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="manufactureName">Manufacture Name </label>
                                    <Field name="manufactureName" type="text" id="manufactureName" placeholder="Enter Manufacture Name" className="form-input" />
                                    {submitCount && errors.manufactureName ? <div className="text-danger mt-1">{errors.manufactureName}</div> : null}
                                </div>
                                <div className={submitCount && errors.address ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="address">Full Address</label>
                                    <Field name="address" type="text" id="address" placeholder="Enter Full Address" className="form-input" />
                                    {submitCount && errors.address ? <div className="text-danger mt-1">{errors.address}</div> : null}
                                </div>
                                <div className={submitCount && errors.city ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="city">City</label>
                                    <Field name="city" type="text" id="city" placeholder="Enter City" className="form-input" />
                                    {submitCount && errors.city ? <div className="text-danger mt-1">{errors.city}</div> : null}
                                </div>
                                <div className={submitCount && errors.state ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="state">State</label>
                                    <Field name="state" type="text" id="state" placeholder="Enter State" className="form-input" />
                                    {submitCount && errors.state ? <div className="text-danger mt-1">{errors.state}</div> : null}
                                </div>
                                <div className={submitCount && errors.pinCode ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="pinCode">Pin Code</label>
                                    <Field name="pinCode" type="text" id="pinCode" className="form-input" placeholder="Enter Pin Code" />
                                    {submitCount && errors.pinCode ? <div className="text-danger mt-1">{errors.pinCode}</div> : null}
                                </div>
                                <div className={submitCount && errors.branch ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="branch">Branch</label>
                                    <Field name="branch" type="text" id="branch" className="form-input" placeholder="Enter Branch" />
                                    {submitCount && errors.branch ? <div className="text-danger mt-1">{errors.branch}</div> : null}
                                </div>
                                <div className={submitCount && errors.mouValidity ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="mouValidity">Mou Validity</label>
                                    <Field name="mouValidity" type="text" id="mouValidity" className="form-input" placeholder="Enter Mou Validity" />
                                    {submitCount && errors.mouValidity ? <div className="text-danger mt-1">{errors.mouValidity}</div> : null}
                                </div>
                            </div>
                        </div>

                        {/* QA Test Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">QA Test</h5>
                            <div className="space-y-4">
                                {editableOptions.map((option) => (
                                    <div key={option.value} className="flex items-center justify-between rounded-md max-w-[30rem]">
                                        <div className="flex items-center gap-3 ">
                                            <Field
                                                type="checkbox"
                                                name="qaTests"
                                                value={option.value}
                                                id={option.value}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const checked = e.target.checked;
                                                    const currentTests = values.qaTests || [];
                                                    if (checked) {
                                                        setFieldValue('qaTests', [...currentTests, option.value]);
                                                    } else {
                                                        setFieldValue(
                                                            'qaTests',
                                                            currentTests.filter((test: string) => test !== option.value)
                                                        );
                                                    }
                                                }}
                                            />
                                            <label htmlFor={option.value} className="text-base text-[12px] pt-2 ">
                                                {option.label}
                                            </label>
                                        </div>
                                        <input
                                            type="number"
                                            value={option.price}
                                            onChange={(e) => {
                                                const newPrice = Number.parseFloat(e.target.value) || 0;
                                                setEditableOptions(editableOptions.map((opt) => (opt.value === option.value ? { ...opt, price: newPrice } : opt)));
                                            }}
                                            className="w-28 p-2 border rounded-md text-[1rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Price ₹"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Services Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Services</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount && errors.services ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="services" className="block mb-1">
                                        Select Services
                                    </label>
                                    <Select
                                        isMulti
                                        name="services"
                                        options={serviceOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        onChange={(selectedOptions) => {
                                            const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
                                            setFieldValue('services', values);
                                        }}
                                        value={serviceOptions.filter((option) => Array.isArray(values.services) && values.services.includes(option.value))}
                                        placeholder="Select Services..."
                                        menuPortalTarget={document.body} // 👈 portal
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }), // 👈 set high z-index
                                        }}
                                    />
                                    {submitCount && errors.services ? <div className="text-danger mt-1">{errors.services}</div> : null}
                                </div>
                            </div>
                        </div>

                        {/* Other Section */}
                        {/* <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Other</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount && errors.travel ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="travel">Travel Cost</label>
                                    <Field name="travel" type="number" id="travel" placeholder="Enter Travel Cost" className="form-input" />
                                    {submitCount && errors.travel ? <div className="text-danger mt-1">{errors.travel}</div> : null}
                                </div>
                                <div className={submitCount && errors.actual ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="actual">Actual Cost</label>
                                    <Field name="actual" type="number" id="actual" placeholder="Enter Actual Cost" className="form-input" />
                                    {submitCount && errors.actual ? <div className="text-danger mt-1">{errors.actual}</div> : null}
                                </div>
                                <div className={submitCount && errors.fixed ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="fixed">Fixed Cost</label>
                                    <Field name="fixed" type="number" id="fixed" placeholder="Enter Fixed Cost" className="form-input" />
                                    {submitCount && errors.fixed ? <div className="text-danger mt-1">{errors.fixed}</div> : null}
                                </div>
                            </div>
                        </div> */}

                        <div className="panel">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount && errors.travel ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="travel">Travel Cost</label>
                                    <Field as="select" name="travel" id="travel" className="form-input">
                                        <option value="">Select Travel Cost Type</option>
                                        <option value="actual">Actual Cost</option>
                                        <option value="fixed">Fixed Cost</option>
                                    </Field>
                                    {submitCount && errors.travel ? <div className="text-danger mt-1">{errors.travel}</div> : null}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end mt-5">
                            <button type="submit" className="btn btn-success">
                                Submit
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default AddManufacture;
