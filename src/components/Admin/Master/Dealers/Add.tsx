import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { useState } from 'react';

// Predefined QA Test options
const qaTestOptions = [
    { label: 'FIXED X RAY', value: 'FIXED_X_RAY', price: 3500, system: true },
    { label: 'MOBILE X RAY', value: 'MOBILE_X_RAY', price: 2500, system: true },
    { label: 'C ARM', value: 'C_ARM', price: 3000, system: true },
    { label: 'MAMMOGRAP', value: 'MAMMOGRAP', price: 4000, system: true },
    { label: 'CATH LAB', value: 'CATH_LAB', price: 5000, system: true },
    { label: 'CT SCAN', value: 'CT_SCAN', price: 6000, system: true },
];

// Services (future enhancement)
const serviceOptions = [
    { label: 'Institute Registration', value: 'INSTITUTE_REGISTRATION' },
    { label: 'Procurement', value: 'PROCUREMENT' },
    { label: 'License', value: 'LICENSE' },
];

const AddDealer = () => {
    const navigate = useNavigate();
    const [editableOptions, setEditableOptions] = useState(qaTestOptions);
    const [newQaTestName, setNewQaTestName] = useState('');
    const [newQaTestPrice, setNewQaTestPrice] = useState('');

    const SubmittedForm = Yup.object().shape({
        dealersName: Yup.string().required('Please fill the Field'),
        address: Yup.string().required('Please fill the Field'),
        city: Yup.string().required('Please fill the Field'),
        state: Yup.string().required('Please fill the Field'),
        pinCode: Yup.string().required('Please fill the Field'),
        region: Yup.string().required('Please fill the Field'),
        branch: Yup.string().required('Please fill the Field'),
        mouValidity: Yup.string().required('Please fill the Field'),
        qaTests: Yup.array().min(1, 'Please select at least one QA Test'),
        services: Yup.array().min(1, 'Please select at least one service'),
        // travel: Yup.number().required('Please fill the Field').min(0, 'Travel cost cannot be negative'),
        // actual: Yup.number().required('Please fill the Field').min(0, 'Actual cost cannot be negative'),
        // fixed: Yup.number().required('Please fill the Field').min(0, 'Fixed cost cannot be negative'),
    });

    const submitForm = (values: any) => {
        const updatedValues = {
            ...values,
            qaTests: values.qaTests.map((test: string) => {
                const option = editableOptions.find((opt) => opt.value === test);
                return { value: test, price: option?.price || 0 };
            }),
        };
        console.log('Form Values:', updatedValues);
        showMessage('Form submitted successfully', 'success');
        navigate('/admin/dealer');
    };

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li><Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">Dashboard</Link></li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/dealer" className="text-primary">Dealer</Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#">Add Dealer</Link>
                </li>
            </ol>

            <h5 className="font-semibold text-lg mb-4">Dealer</h5>
            <Formik
                initialValues={{
                    dealersName: '',
                    address: '',
                    city: '',
                    state: '',
                    branch: '',
                    pinCode: '',
                    region: '',
                    mouValidity: '',
                    qaTests: [],
                    services: [],
                    // travel: '',
                    // actual: '',
                    // fixed: '',
                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, setFieldValue, values }) => (
                    <Form className="space-y-5">
                        {/* Basic Details Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* ... repeat fields ... */}
                                {/* Only showing one field here for brevity */}
                                <div className={submitCount && errors.dealersName ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="dealersName">Dealer Name</label>
                                    <Field name="dealersName" type="text" id="dealersName" placeholder="Enter Dealer Name" className="form-input" />
                                    {submitCount && errors.dealersName ? <div className="text-danger mt-1">{errors.dealersName}</div> : null}
                                </div>
                                {/* Add rest of the fields as in your previous version */}
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
                                    <Field name="mouValidity" type="date" id="mouValidity" className="form-input" placeholder="Enter Mou Validity" />
                                    {submitCount && errors.mouValidity ? <div className="text-danger mt-1">{errors.mouValidity}</div> : null}
                                </div>
                            </div>
                        </div>

                        {/* QA Test Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">QA Test</h5>
                            <div className="space-y-3 max-w-[40rem]">
                                {/* Table Header */}
                                <div className="flex items-center font-medium text-sm text-gray-600">
                                    <div className="w-1/2">QA Test</div>
                                    <div className="w-24 text-center">Price ₹</div>
                                    <div className="w-20 text-right">Action</div>
                                </div>

                                {/* QA Test Rows */}
                                {editableOptions.map((option, index) => (
                                    <div key={option.value} className="flex items-center gap-2">
                                        {/* QA Test Checkbox + Label */}
                                        <div className="flex items-center gap-2 w-1/2">
                                            <Field
                                                type="checkbox"
                                                name="qaTests"
                                                value={option.value}
                                                id={option.value}
                                                className="form-checkbox h-5 w-5"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const checked = e.target.checked;
                                                    const current = values.qaTests || [];
                                                    setFieldValue(
                                                        'qaTests',
                                                        checked
                                                            ? [...current, option.value]
                                                            : current.filter((t: string) => t !== option.value)
                                                    );
                                                }}
                                            />
                                            <label htmlFor={option.value} className="text-sm">
                                                {option.label}
                                            </label>
                                        </div>

                                        {/* Price Input */}
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                value={option.price}
                                                onChange={(e) => {
                                                    const newPrice = parseFloat(e.target.value) || 0;
                                                    const updated = [...editableOptions];
                                                    updated[index].price = newPrice;
                                                    setEditableOptions(updated);
                                                }}
                                                className="form-input w-full text-sm"
                                                placeholder="₹"
                                            />
                                        </div>

                                        {/* Delete Button */}
                                        <div className="w-20 text-right">
                                            {!option.system && (
                                                <button
                                                    type="button"
                                                    className="text-red-600 text-xs"
                                                    onClick={() => {
                                                        setEditableOptions(editableOptions.filter((_, i) => i !== index));
                                                        setFieldValue(
                                                            'qaTests',
                                                            values.qaTests.filter((test: string) => test !== option.value)
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add New QA Test */}
                                <div className="flex items-center gap-3 pt-4">
                                    <input
                                        type="text"
                                        placeholder="New QA Test Name"
                                        value={newQaTestName}
                                        onChange={(e) => setNewQaTestName(e.target.value)}
                                        className="form-input w-1/2"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price ₹"
                                        value={newQaTestPrice}
                                        onChange={(e) => setNewQaTestPrice(e.target.value)}
                                        className="form-input w-24"
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            const trimmed = newQaTestName.trim();
                                            const formattedValue = trimmed.toUpperCase().replace(/\s+/g, '_');
                                            const exists = editableOptions.some((opt) => opt.value === formattedValue);
                                            if (!trimmed) return showMessage('Please enter QA test name.', 'error');
                                            if (exists) return showMessage('This QA test already exists.', 'warning');

                                            const newTest = {
                                                label: trimmed,
                                                value: formattedValue,
                                                price: parseFloat(newQaTestPrice) || 0,
                                                system: false,
                                            };
                                            setEditableOptions([...editableOptions, newTest]);
                                            setNewQaTestName('');
                                            setNewQaTestPrice('');
                                            showMessage('QA test added.', 'success');
                                        }}
                                    >
                                        + Add
                                    </button>
                                </div>

                                {/* Update All Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => showMessage('QA Test prices updated successfully.', 'success')}
                                    >
                                        Update All
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end mt-5">
                            <button type="submit" className="btn btn-success">Submit</button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default AddDealer;
