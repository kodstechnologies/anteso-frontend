// import * as Yup from 'yup';
// import { Field, Form, Formik } from 'formik';
// import { Link } from 'react-router-dom';
// import { showMessage } from '../../../common/ShowMessage';
// import Select from 'react-select'; // Import react-select

// // Define the options for QA Test checkboxes with their respective prices
// const qaTestOptions = [
//     { label: 'FIXED X RAY', value: 'FIXED_X_RAY', price: 3500 },
//     { label: 'MOBILE X RAY', value: 'MOBILE_X_RAY', price: 2500 },
//     { label: 'C ARM', value: 'C_ARM', price: 3000 },
//     { label: 'MAMMOGRAP', value: 'MAMMOGRAP', price: 4000 },
//     { label: 'CATH LAB', value: 'CATH_LAB', price: 5000 },
//     { label: 'CT SCAN', value: 'CT_SCAN', price: 6000 },
//     { label: 'TATKAL QA', value: 'TATKAL_QA', price: 5000 },
// ];

// const option = {
//     value: String,
//     label: String,
// };

// // Define the options for the Services multi-select dropdown
// const serviceOptions = [
//     { label: 'Institute Registration', value: 'INSTITUTE_REGISTRATION' },
//     { label: 'Procurement', value: 'PROCUREMENT' },
//     { label: 'License', value: 'LICENSE' },
// ];

// const AddDealerAndManufacturer = () => {
//     // Yup validation schema
//     const SubmittedForm = Yup.object().shape({
//         hospitalName: Yup.string().required('Please fill the Field'),
//         address: Yup.string().required('Please fill the Field'),
//         city: Yup.string().required('Please fill the Field'),
//         state: Yup.string().required('Please fill the Field'),
//         contactPersonName: Yup.string().required('Please fill the Field'),
//         phone: Yup.string().required('Please fill the Field'),
//         email: Yup.string().email('Invalid email format').required('Please fill the Field'),
//         procurementNumber: Yup.string().required('Please fill the Field'),
//         procurementExpiryDate: Yup.string().required('Please fill the Field'),
//         partyCode: Yup.string().required('Please fill the Field'),
//         branch: Yup.string().required('Please fill the Field'),
//         qaTests: Yup.array().min(1, 'Please select at least one QA Test'),
//         services: Yup.array().min(1, 'Please select at least one service'), // Validation for multi-select
//         travel: Yup.number().required('Please fill the Field').min(0, 'Travel cost cannot be negative'),
//         actual: Yup.number().required('Please fill the Field').min(0, 'Actual cost cannot be negative'),
//         fixed: Yup.number().required('Please fill the Field').min(0, 'Fixed cost cannot be negative'),
//     });

//     // Form submission handler
//     const submitForm = (values: any) => {
//         console.log('Form Values:', values); // For debugging
//         showMessage('Form submitted successfully', 'success');
//     };

//     return (
//         <>
//             <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
//                 <li>
//                     <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
//                         Dashboard
//                     </Link>
//                 </li>
//                 <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
//                     <Link to="/admin/dealer-and-manufacture" className="text-primary">
//                         Dealer And Manufacture
//                     </Link>
//                 </li>
//                 <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
//                     <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
//                         Add Dealer And Manufacture
//                     </Link>
//                 </li>
//             </ol>

//             <h5 className="font-semibold text-lg mb-4">Manufacturer</h5>
//             <Formik
//                 initialValues={{
//                     hospitalName: '',
//                     address: '',
//                     city: '',
//                     state: '',
//                     contactPersonName: '',
//                     phone: '',
//                     email: '',
//                     procurementNumber: '',
//                     procurementExpiryDate: '',
//                     partyCode: '',
//                     branch: '',
//                     qaTests: [],
//                     services: [], // Array for multi-select
//                     travel: '',
//                     actual: '',
//                     fixed: '',
//                 }}
//                 validationSchema={SubmittedForm}
//                 onSubmit={submitForm}
//             >
//                 {({ errors, submitCount, touched, setFieldValue, values }) => (
//                     <Form className="space-y-5">
//                         {/* Basic Details Section */}
//                         <div className="panel">
//                             <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//                                 <div className={submitCount && errors.hospitalName ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="hospitalName">Hospital Name</label>
//                                     <Field name="hospitalName" type="text" id="hospitalName" placeholder="Enter Hospital Name" className="form-input" />
//                                     {submitCount && errors.hospitalName ? (
//                                         <div className="text-danger mt-1">{errors.hospitalName}</div>
//                                     ) : submitCount ? (
//                                         <div className="text-success mt-1">Looks Good!</div>
//                                     ) : null}
//                                 </div>
//                                 <div className={submitCount && errors.address ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="address">Full Address</label>
//                                     <Field name="address" type="text" id="address" placeholder="Enter Full Address" className="form-input" />
//                                     {submitCount && errors.address ? (
//                                         <div className="text-danger mt-1">{errors.address}</div>
//                                     ) : submitCount ? (
//                                         <div className="text-success mt-1">Looks Good!</div>
//                                     ) : null}
//                                 </div>
//                                 <div className={submitCount && errors.city ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="city">City</label>
//                                     <Field name="city" type="text" id="city" placeholder="Enter City" className="form-input" />
//                                     {submitCount && errors.city ? <div className="text-danger mt-1">{errors.city}</div> : submitCount ? <div className="text-success mt-1">Looks Good!</div> : null}
//                                 </div>
//                                 <div className={submitCount && errors.state ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="state">State</label>
//                                     <Field name="state" type="text" id="state" placeholder="Enter State" className="form-input" />
//                                     {submitCount && errors.state ? <div className="text-danger mt-1">{errors.state}</div> : submitCount ? <div className="text-success mt-1">Looks Good!</div> : null}
//                                 </div>
//                                 <div className={submitCount && errors.partyCode ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="partyCode">Party Code</label>
//                                     <Field name="partyCode" type="text" id="partyCode" className="form-input" placeholder="Enter Party Code" />
//                                     {submitCount && errors.partyCode ? (
//                                         <div className="text-danger mt-1">{errors.partyCode}</div>
//                                     ) : submitCount ? (
//                                         <div className="text-success mt-1">Looks Good!</div>
//                                     ) : null}
//                                 </div>
//                                 {/* <div className={submitCount && errors.branch ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="branch">Branch</label>
//                                     <Field name="branch" type="text" id="branch" className="form-input" placeholder="Enter Branch" />
//                                     {submitCount && errors.branch ? <div className="text-danger mt-1">{errors.branch}</div> : submitCount ? <div className="text-success mt-1">Looks Good!</div> : null}
//                                 </div>
//                                 <div className={submitCount && errors.contactPersonName ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="contactPersonName">Contact Person Name</label>
//                                     <Field name="contactPersonName" type="text" id="contactPersonName" placeholder="Enter Contact Person Name" className="form-input" />
//                                     {submitCount && errors.contactPersonName ? (
//                                         <div className="text-danger mt-1">{errors.contactPersonName}</div>
//                                     ) : submitCount ? (
//                                         <div className="text-success mt-1">Looks Good!</div>
//                                     ) : null}
//                                 </div> */}
//                                 {/* <div className={submitCount && errors.phone ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="phone">Phone</label>
//                                     <Field name="phone" type="text" id="phone" placeholder="Enter Phone" className="form-input" />
//                                     {submitCount && errors.phone ? <div className="text-danger mt-1">{errors.phone}</div> : submitCount ? <div className="text-success mt-1">Looks Good!</div> : null}
//                                 </div>
//                                 <div className={submitCount && errors.email ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="email">Email</label>
//                                     <Field name="email" type="email" id="email" placeholder="Enter Email" className="form-input" />
//                                     {submitCount && errors.email ? <div className="text-danger mt-1">{errors.email}</div> : submitCount ? <div className="text-success mt-1">Looks Good!</div> : null}
//                                 </div> */}
//                                 {/* <div className={submitCount && errors.procurementNumber ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="procurementNumber">Procurement Number</label>
//                                     <Field name="procurementNumber" type="text" id="procurementNumber" placeholder="Enter Procurement Number" className="form-input" />
//                                     {submitCount && errors.procurementNumber ? (
//                                         <div className="text-danger mt-1">{errors.procurementNumber}</div>
//                                     ) : submitCount ? (
//                                         <div className="text-success mt-1">Looks Good!</div>
//                                     ) : null}
//                                 </div> */}
//                                 {/* <div className={submitCount && errors.procurementExpiryDate ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="procurementExpiryDate">Procurement Expiry Date</label>
//                                     <Field name="procurementExpiryDate" type="date" id="procurementExpiryDate" className="form-input" />
//                                     {submitCount && errors.procurementExpiryDate ? (
//                                         <div className="text-danger mt-1">{errors.procurementExpiryDate}</div>
//                                     ) : submitCount ? (
//                                         <div className="text-success mt-1">Looks Good!</div>
//                                     ) : null}
//                                 </div> */}
//                             </div>
//                         </div>

//                         {/* QA Test Section */}
//                         <div className="panel">
//                             <h5 className="font-semibold text-lg mb-4">QA Test</h5>
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//                                 {qaTestOptions.map((option) => (
//                                     <div key={option.value} className="flex items-center">
//                                         <Field
//                                             type="checkbox"
//                                             name="qaTests"
//                                             value={option.value}
//                                             id={option.value}
//                                             className="form-checkbox"
//                                             onChange={(e: any) => {
//                                                 const checked = e.target.checked;
//                                                 const currentTests = values.qaTests || [];
//                                                 if (checked) {
//                                                     setFieldValue('qaTests', [...currentTests, option.value]);
//                                                 } else {
//                                                     setFieldValue(
//                                                         'qaTests',
//                                                         currentTests.filter((test) => test !== option.value)
//                                                     );
//                                                 }
//                                             }}
//                                         />
//                                         <label htmlFor={option.value} className="ml-2">
//                                             {option.label} (₹{option.price})
//                                         </label>
//                                     </div>
//                                 ))}
//                             </div>
//                             {/* {submitCount && errors?.qaTests && <div className="text-danger mt-2">{errors.qaTests}</div>} */}
//                         </div>

//                         {/* Services Section */}
//                         <div className="panel">
//                             <h5 className="font-semibold text-lg mb-4">Services</h5>
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//                                 <div className={submitCount && errors.services ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="services" className="block mb-1">
//                                         Select Services
//                                     </label>
//                                     <Select
//                                         isMulti
//                                         name="services"
//                                         options={serviceOptions}
//                                         className="basic-multi-select"
//                                         classNamePrefix="select"
//                                         onChange={(selectedOptions) => {
//                                             const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
//                                             setFieldValue('services', values);
//                                         }}
//                                         value={serviceOptions.filter((option) => values.services.includes(option.value))}
//                                         placeholder="Select Services..."
//                                     />
//                                     {submitCount && errors.services ? (
//                                         <div className="text-danger mt-1">{errors.services}</div>
//                                     ) : submitCount ? (
//                                         <div className="text-success mt-1">Looks Good!</div>
//                                     ) : null}
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Other Section */}
//                         <div className="panel">
//                             <h5 className="font-semibold text-lg mb-4">Other</h5>
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//                                 <div className={submitCount && errors.travel ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="travel">Travel Cost</label>
//                                     <Field name="travel" type="number" id="travel" placeholder="Enter Travel Cost" className="form-input" />
//                                     {submitCount && errors.travel ? <div className="text-danger mt-1">{errors.travel}</div> : submitCount ? <div className="text-success mt-1">Looks Good!</div> : null}
//                                 </div>
//                                 <div className={submitCount && errors.actual ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="actual">Actual Cost</label>
//                                     <Field name="actual" type="number" id="actual" placeholder="Enter Actual Cost" className="form-input" />
//                                     {submitCount && errors.actual ? <div className="text-danger mt-1">{errors.actual}</div> : submitCount ? <div className="text-success mt-1">Looks Good!</div> : null}
//                                 </div>
//                                 <div className={submitCount && errors.fixed ? 'has-error' : submitCount ? 'has-success' : ''}>
//                                     <label htmlFor="fixed">Fixed Cost</label>
//                                     <Field name="fixed" type="number" id="fixed" placeholder="Enter Fixed Cost" className="form-input" />
//                                     {submitCount && errors.fixed ? <div className="text-danger mt-1">{errors.fixed}</div> : submitCount ? <div className="text-success mt-1">Looks Good!</div> : null}
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Submit Button */}
//                         <div className="flex justify-end mt-5">
//                             <button type="submit" className="btn btn-primary">
//                                 Submit
//                             </button>
//                         </div>
//                     </Form>
//                 )}
//             </Formik>
//         </>
//     );
// };

// export default AddDealerAndManufacturer;

import React from 'react';

function Add() {
    return <div>Add</div>;
}

export default Add;
