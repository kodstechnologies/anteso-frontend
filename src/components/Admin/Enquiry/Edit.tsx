import React from 'react';
import * as Yup from 'yup';
import { FieldArray, Field, Form, Formik, ErrorMessage, FieldProps } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { showMessage } from '../../common/ShowMessage';

// Define interfaces
interface OptionType {
    value: string;
    label: string;
}

interface MultiSelectFieldProps {
    name: string;
    options: OptionType[];
}

interface Service {
    machineType: string;
    equipmentNo: number;
    workType: string[];
}

interface FormValues {
    hospitalName: string;
    fullAddress: string;
    city: string;
    state: string;
    pinCode: string;
    contactPerson: string;
    emailAddress: string;
    contactNumber: string;
    designation: string;
    urgency: string;
    services: Service[];
    additionalServices: Record<string, string | undefined>;
    enquiryID?: string; // Optional for generating ENQ ID
}

// Custom component for multi-select field
const MultiSelectField: React.FC<MultiSelectFieldProps> = ({ name, options }) => (
    <Field name={name}>
        {({ field, form }: FieldProps) => (
            <div>
                <Select
                    isMulti
                    options={options}
                    className="w-full"
                    classNamePrefix="select"
                    value={options.filter((option) => field.value?.includes(option.value))}
                    onChange={(selectedOptions) =>
                        form.setFieldValue(
                            name,
                            selectedOptions ? selectedOptions.map((option: OptionType) => option.value) : []
                        )
                    }
                    onBlur={() => form.setFieldTouched(name, true)}
                    menuPortalTarget={document.body}
                    styles={{
                        control: (base, state) => ({
                            ...base,
                            minHeight: '38px',
                            fontSize: '0.875rem',
                            padding: '0px 4px',
                            borderColor: state.isFocused ? '#3b82f6' : base.borderColor,
                            boxShadow: state.isFocused ? '0 0 0 0px #3b82f6' : base.boxShadow,
                        }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                />
                <div className="h-4">
                    <ErrorMessage name={name} component="div" className="text-red-500 text-sm" />
                </div>
            </div>
        )}
    </Field>
);

// Constants
const serviceOptions: string[] = [
    'INSTITUTE REGISTRATION',
    'RSO REGISTRATION, NOMINATION & APPROVAL',
    'DECOMMISSIONING, PRE OWNED PROCUREMENT, QA & LICENSE',
    'PROCUREMENT',
    'TLD BADGE',
    'LEAD SHEET',
    'LEAD GLASS',
    'LEAD APRON',
    'THYROID SHIELD',
    'GONAD SHIELD',
    'OTHERS',
];

const machineOptions: OptionType[] = [
    'Fixed X-Ray',
    'Mobile X-Ray',
    'C-Arm',
    'Cath Lab/Interventional Radiology',
    'Mammography',
    'CT Scan',
    'PET CT',
    'CT Simulator',
    'OPG',
    'CBCT',
    'BMD/DEXA',
    'Dental IOPA',
    'Dental Hand Held',
    'O Arm',
    'KV Imaging (OBI)',
    'Lead Apron Test',
    'Thyroid Shield Test',
    'Gonad Shield Test',
    'Radiation Survey of Radiation Facility',
    'Others',
].map((label) => ({ label, value: label }));

const urgencyOptions: string[] = ['Immediantely (within 1-2 days)', 'Urgent (Within a week)', 'Soon (Within 2-3 weeks)', 'Not urgent (just exploring)'];

const workTypeOptions: OptionType[] = [
    { value: 'Quality Assurance Test', label: 'Quality Assurance Test' },
    { value: ' License for Operation', label: ' License for Operation' },
    { value: 'Decommissioning', label: 'Decommissioning' },
    { value: 'Decommissioning and Recommissioning', label: 'Decommissioning and Recommissioning' },
];

const EditEnquiry: React.FC = () => {
    const navigate = useNavigate();
    // Yup validation schema
    const SubmittedForm = Yup.object().shape({
        hospitalName: Yup.string().required('Please fill the Field'),
        fullAddress: Yup.string().required('Please fill the Field'),
        city: Yup.string().required('Please fill the Field'),
        state: Yup.string().required('Please fill the Field'),
        pinCode: Yup.string().required('Please fill the Field'),
        contactPerson: Yup.string().required('Please fill the Field'),
        emailAddress: Yup.string().email('Invalid email').required('Please fill the Email'),
        contactNumber: Yup.string()
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .required('Please fill the Field'),
        designation: Yup.string().required('Please fill the Field'),
        urgency: Yup.string().required('Please select an urgency'),
        services: Yup.array()
            .of(
                Yup.object().shape({
                    machineType: Yup.string().required('Required'),
                    equipmentNo: Yup.number().required('Required').positive().integer(),
                    workType: Yup.array().min(1, 'At least one work type is required'),
                })
            )
            .min(1, 'At least one service is required'),
        additionalServices: Yup.object().shape(
            serviceOptions.reduce((schema, service) => {
                return { ...schema, [service]: Yup.string().nullable() };
            }, {})
        ),
        enquiryID: Yup.string().nullable(),
    });

    // Form submission handler
    const submitForm = (values: FormValues) => {
        // Generate enquiryID (e.g., ENQ001) - replace with actual logic to fetch existing enquiries
        const enquiryCount = 1; // Placeholder: Replace with actual count from enquiriesData or API
        const newEnquiryID = `ENQ${String(enquiryCount).padStart(3, '0')}`;
        const submissionValues = { ...values, enquiryID: newEnquiryID };

        console.log('Form submitted with values:', submissionValues);
        showMessage('Form submitted successfully', 'success');
        navigate('/admin/enquiry');
        // TODO: Save submissionValues to enquiriesData or API
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
                    <Link to="/admin/enquiry" className="text-primary">
                        Enquiry
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Add Enquiry
                    </Link>
                </li>
            </ol>

            <h5 className="font-semibold text-lg mb-4">Enquiry Form</h5>

            <Formik
                initialValues={{
                    hospitalName: '',
                    fullAddress: '',
                    city: '',
                    state: '',
                    pinCode: '',
                    contactPerson: '',
                    emailAddress: '',
                    contactNumber: '',
                    designation: '',
                    urgency: '',
                    services: [{ machineType: '', equipmentNo: 1, workType: [] }],
                    additionalServices: serviceOptions.reduce((acc, service) => {
                        acc[service] = undefined;
                        return acc;
                    }, {} as Record<string, string | undefined>),
                    enquiryID: '',
                    attachment: '',
                    

                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, values, setFieldValue }) => (
                    <Form className="space-y-5">
                        {/* Basic Details */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                                <div className={submitCount && errors.hospitalName ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="hospitalName">Hospital Name</label>
                                    <Field name="hospitalName" type="text" id="hospitalName" placeholder="Enter Hospital Name" className="form-input" />
                                    {submitCount && errors.hospitalName ? <div className="text-danger mt-1">{errors.hospitalName}</div> : null}
                                </div>
                                <div className={submitCount && errors.fullAddress ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="fullAddress">Full Address</label>
                                    <Field name="fullAddress" type="text" id="fullAddress" placeholder="Enter Full Address" className="form-input" />
                                    {submitCount && errors.fullAddress ? <div className="text-danger mt-1">{errors.fullAddress}</div> : null}
                                </div>
                                <div className={submitCount && errors.city ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="city">City</label>
                                    <Field name="city" type="text" id="city" placeholder="Enter City Name" className="form-input" />
                                    {submitCount && errors.city ? <div className="text-danger mt-1">{errors.city}</div> : null}
                                </div>
                                <div className={submitCount && errors.state ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="state">State</label>
                                    <Field name="state" type="text" id="state" placeholder="Enter State Name" className="form-input" />
                                    {submitCount && errors.state ? <div className="text-danger mt-1">{errors.state}</div> : null}
                                </div>
                                <div className={submitCount && errors.pinCode ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="pinCode">PIN Code</label>
                                    <Field name="pinCode" type="text" id="pinCode" placeholder="Enter PIN Code" className="form-input" />
                                    {submitCount && errors.pinCode ? <div className="text-danger mt-1">{errors.pinCode}</div> : null}
                                </div>
                                <div className={submitCount && errors.contactPerson ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="contactPerson">Contact Person Name</label>
                                    <Field name="contactPerson" type="text" id="contactPerson" placeholder="Enter Contact Person Name" className="form-input" />
                                    {submitCount && errors.contactPerson ? <div className="text-danger mt-1">{errors.contactPerson}</div> : null}
                                </div>
                                <div className={submitCount && errors.emailAddress ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="emailAddress">Email Address</label>
                                    <Field name="emailAddress" type="text" id="emailAddress" placeholder="Enter Email Address" className="form-input" />
                                    {submitCount && errors.emailAddress ? <div className="text-danger mt-1">{errors.emailAddress}</div> : null}
                                </div>
                                <div className={submitCount && errors.contactNumber ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="contactNumber">Contact Number</label>
                                    <Field name="contactNumber" type="text" id="contactNumber" placeholder="Enter Contact Number" className="form-input" />
                                    {submitCount && errors.contactNumber ? <div className="text-danger mt-1">{errors.contactNumber}</div> : null}
                                </div>
                                <div className={submitCount && errors.designation ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="designation">Designation</label>
                                    <Field name="designation" type="text" id="designation" placeholder="Enter Designation" className="form-input" />
                                    {submitCount && errors.designation ? <div className="text-danger mt-1">{errors.designation}</div> : null}
                                </div>
                            </div>
                        </div>

                        {/* Services Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Services</h5>
                            <FieldArray name="services">
                                {({ push, remove }) => (
                                    <>
                                        {values.services.map((_, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
                                                {/* Machine Type */}
                                                <div className="md:col-span-4">
                                                    <label className="text-sm font-semibold text-gray-700">Machine Type</label>
                                                    <Field as="select" name={`services.${index}.machineType`} className="form-select w-full">
                                                        <option value="">Select Machine Type</option>
                                                        {machineOptions.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </Field>
                                                    <div className="h-4">
                                                        <ErrorMessage name={`services.${index}.machineType`} component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                </div>

                                                {/* equipment/document No. */}
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-semibold text-gray-700">Equipment ID/Serial No.</label>
                                                    <Field type="text" name="equipmentNo" placeholder="Equipment ID/Serial No" className="form-input w-full" />
                                                    <div className="h-4">
                                                        <ErrorMessage name={`services.${index}.equipmentNo`} component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                </div>

                                                {/* Work Type */}
                                                <div className="md:col-span-5">
                                                    <label className="text-sm font-semibold text-gray-700">Type Of Work</label>
                                                    <MultiSelectField name={`services.${index}.workType`} options={workTypeOptions} />
                                                </div>

                                                {/* Remove Button */}
                                                {values.services.length > 1 && (
                                                    <div className="md:col-span-1 flex justify-end">
                                                        <button type="button" onClick={() => remove(index)} className="mb-4 text-red-500 text-xs">
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add Another Machine */}
                                        <button type="button" onClick={() => push({ machineType: '', equipmentNo: 1, workType: [] })} className="btn btn-primary w-full sm:w-auto">
                                            + Add Another Machine
                                        </button>
                                    </>
                                )}
                            </FieldArray>
                        </div>

                        {/* Additional Services */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Additional Services</h5>
                            {serviceOptions.map((service) => (
                                <div key={service} className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4 py-2 border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={values.additionalServices[service] !== undefined}
                                            onChange={() => {
                                                if (values.additionalServices[service] !== undefined) {
                                                    setFieldValue(`additionalServices.${service}`, undefined); // Uncheck
                                                } else {
                                                    setFieldValue(`additionalServices.${service}`, ''); // Check with empty string
                                                }
                                            }}
                                            className={`form-checkbox h-5 w-5 transition-colors duration-200 ${values.additionalServices[service] !== undefined ? 'text-blue-600' : 'text-gray-400'}`}
                                        />
                                        <span>{service}</span>
                                    </div>

                                    {values.additionalServices[service] !== undefined && (
                                        <div className="sm:col-span-2 mt-2 sm:mt-0">
                                            <Field type="text" name={`additionalServices.${service}`} placeholder="Enter info..." className="form-input w-full" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Special Instructions</h5>

                            {/* Side-by-side layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Special Instructions Field */}
                                <div className={submitCount && errors.urgency ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="urgency" className="block mb-1 font-medium">Special Instructions</label>
                                    <Field
                                        name="urgency"
                                        type="text"
                                        id="urgency"
                                        placeholder="Enter special instruction"
                                        className="form-input"
                                    />
                                    {submitCount > 0 && errors.urgency && (
                                        <p className="text-red-500 text-sm mt-1">{errors.urgency}</p>
                                    )}
                                </div>

                                <div className={submitCount && errors.attachment ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="attachment" className="block mb-1 font-medium">Upload Attachment</label>
                                    <Field
                                        name="attachment"
                                        type="file"
                                        id="attachment"
                                        className="form-input"
                                    />
                                    {submitCount > 0 && errors.attachment && (
                                        <div className="text-danger mt-1">{errors.attachment}</div>
                                    )}
                                </div>

                            </div>
                        </div>
                        {/* Urgency */}
                        {/* <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Urgency</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:w-1/2 gap-4">
                                {urgencyOptions.map((option) => (
                                    <label key={option} className="flex items-center gap-2">
                                        <Field type="radio" name="urgency" value={option} />
                                        {option}
                                    </label>
                                ))}
                            </div>
                            {submitCount && errors.urgency ? <p className="text-red-500 text-sm mt-1">{errors.urgency}</p> : <></>}
                        </div> */}

                        {/* Submit Button */}
                        <div className="w-full mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success mt-4">
                                Submit Enquiry
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default EditEnquiry;
