import React from 'react';
import * as Yup from 'yup';
import { FieldArray, Field, Form, Formik, ErrorMessage, FieldProps } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { showMessage } from '../../common/ShowMessage';
import Breadcrumb, { BreadcrumbItem } from '../../common/Breadcrumb';
import IconHome from '../../Icon/IconHome';
import IconBox from '../../Icon/IconBox';
import IconBook from '../../Icon/IconBook';

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
    machineModel: string

}

interface FormValues {
    hospitalName: string;
    fullAddress: string;
    city: string;
    district: string;
    state: string;
    pinCode: string;
    branch: string,
    contactPerson: string;
    emailAddress: string;
    contactNumber: string;
    designation: string;
    urgency: string;
    services: Service[];
    additionalServices: Record<string, string | undefined>;
    enquiryID?: string; // Optional for generating ENQ ID
    sysId: string;


}

// Custom component for multi-select field
const MultiSelectField: React.FC<MultiSelectFieldProps> = ({ name, options }) => (
    <Field name={name}>
        {({ field, form }: FieldProps) => (
            <div>
                <Select
                    isMulti
                    options={options}
                    className="w-full" // makes it fill the container
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
const urgency: string[] = ['Normal', 'Tatkal']
const workTypeOptions: OptionType[] = [
    { value: 'Quality Assurance Test', label: 'Quality Assurance Test' },
    { value: ' License for Operation', label: ' License for Operation' },
    { value: 'Decommissioning', label: 'Decommissioning' },
    { value: 'Decommissioning and Recommissioning', label: 'Decommissioning and Recommissioning' },
];

const dealerOptions: OptionType[] = [
    { value: 'Dealer 1', label: 'Dealer 1' },
    { value: 'Dealer 2', label: 'Dealer 2' },
    { value: 'Dealer 3', label: 'Dealer 3' },
    { value: 'Dealer 4', label: 'Dealer 4' },
];

const CreateOrder: React.FC = () => {
    const navigate = useNavigate();
    // Yup validation schema
    const SubmittedForm = Yup.object().shape({
        leadOwner: Yup.string().required('Please fill the Field'),
        hospitalName: Yup.string().required('Please fill the Field'),
        fullAddress: Yup.string().required('Please fill the Field'),
        city: Yup.string().required('Please fill the Field'),
        district: Yup.string().required('Please fill the Field'),
        state: Yup.string().required('Please fill the Field'),
        pinCode: Yup.string().required('Please fill the Field'),
        branch: Yup.string().required('Please fill the Field'),
        contactPerson: Yup.string().required('Please fill the Field'),
        emailAddress: Yup.string().email('Invalid email').required('Please fill the Email'),
        contactNumber: Yup.string()
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .required('Please fill the Field'),
        designation: Yup.string().required('Please fill the Field'),
        // advanceAmount: Yup.string().required('Please fill the Field'),
        // urgency: Yup.string().required('Please select an urgency'),
        services: Yup.array()
            .of(
                Yup.object().shape({
                    machineType: Yup.string().required('Required'),
                    equipmentNo: Yup.number().required('Required').positive().integer(),
                    workType: Yup.array().min(1, 'At least one work type is required'),
                    machineModel: Yup.string().required('Required'),
                })
            )
            .min(1, 'At least one service is required'),
        additionalServices: Yup.object().shape(
            serviceOptions.reduce((schema, service) => {
                return { ...schema, [service]: Yup.string().nullable() };
            }, {})
        ),
        enquiryID: Yup.string().nullable(),
        sysId: Yup.string().required('Please fill the Field'),
        procNo: Yup.string().required('Please fill the Field'),
        procExpiryDate: Yup.date()
            .required('Please fill the Expiry Date')
            .typeError('Invalid date format'),

    });

    // Form submission handler
    const submitForm = (values: FormValues) => {
        // Generate enquiryID (e.g., ENQ001) - replace with actual logic to fetch existing enquiries
        const enquiryCount = 1; // Placeholder: Replace with actual count from enquiriesData or API
        const newEnquiryID = `ENQ${String(enquiryCount).padStart(3, '0')}`;
        const submissionValues = { ...values, enquiryID: newEnquiryID };

        console.log('Form submitted with values:', submissionValues);
        showMessage('Form submitted successfully', 'success');
        navigate('/admin/orders');
        // TODO: Save submissionValues to enquiriesData or API
    };
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Orders', to: '/admin/orders', icon: <IconBox /> },
        { label: 'Create Order', icon: <IconBook /> },
    ];
    return (
        <>
            {/* <Breadcrumb items={breadcrumbItems} /> */}
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/orders" className="text-primary">
                        Order
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        create Order
                    </Link>
                </li>
            </ol>

            <h5 className="font-semibold text-lg mb-4">Create Order</h5>

            <Formik
                initialValues={{
                    leadOwner: '',
                    hospitalName: '',
                    fullAddress: '',
                    city: '',
                    district: '',
                    state: '',
                    pinCode: '',
                    branch: '',
                    contactPerson: '',
                    emailAddress: '',
                    contactNumber: '',
                    designation: '',
                    // advanceAmount: '',
                    workOrder: null,
                    urgency: '',
                    services: [{ machineType: '', equipmentNo: 1, workType: [], machineModel: '' }],
                    additionalServices: serviceOptions.reduce((acc, service) => {
                        acc[service] = undefined;
                        return acc;
                    }, {} as Record<string, string | undefined>),
                    enquiryID: '',
                    sysId: '',

                    procNo: '',
                    procExpiryDate: '',
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
                                <div className={submitCount && errors.leadOwner ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="leadOwner">Lead Owner</label>
                                    {/* <MultiSelectField name={`leadOwner`} options={dealerOptions} /> */}
                                    <Field name="leadOwner" type="text" id="leadOwner" placeholder="Enter Lead Owner" className="form-input" />

                                    {submitCount && errors.leadOwner ? <div className="text-danger mt-1">{errors.leadOwner}</div> : null}
                                </div>
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
                                <div className={submitCount && errors.city ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="District">District</label>
                                    <Field name="District" type="text" id="District" placeholder="Enter District Name" className="form-input" />
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
                                <div className={submitCount && errors.branch ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="branch">Branch Name</label>
                                    <Field name="branch" type="text" id="branch" placeholder="Enter Branch Name" className="form-input" />
                                    {submitCount && errors.branch ? <div className="text-danger mt-1">{errors.branch}</div> : null}
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
                                {/* <div className={submitCount && errors.advanceAmount ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="advanceAmount">Advance Amount</label>
                                    <Field name="advanceAmount" type="text" id="advanceAmount" placeholder="Enter advanceAmount" className="form-input" />
                                    {submitCount && errors.advanceAmount ? <div className="text-danger mt-1">{errors.advanceAmount}</div> : null}
                                </div> */}
                                <div className={submitCount && errors.workOrder ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="workOrder">Work Order Copy</label>
                                    <Field name="workOrder" type="file" id="workOrder" placeholder="Enter workOrder" className="form-input" />
                                    {submitCount && errors.workOrder ? <div className="text-danger mt-1">{errors.workOrder}</div> : null}
                                </div>
                                <div className={submitCount && errors.sysId ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="branch">Party Code/Sys ID</label>
                                    <Field name="sysId" type="text" id="sysId" placeholder="Enter Party Code/Sys ID" className="form-input" />
                                    {submitCount && errors.sysId ? <div className="text-danger mt-1">{errors.sysId}</div> : null}
                                </div>
                                {/* PROC NO / PO NO */}
                                <div className={submitCount && errors.procNo ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="procNo">PROC NO / PO NO</label>
                                    <Field name="procNo" type="text" id="procNo" placeholder="Enter PROC NO / PO NO" className="form-input" />
                                    {submitCount && errors.procNo ? <div className="text-danger mt-1">{errors.procNo}</div> : null}
                                </div>

                                {/* PROC Expiry Date */}
                                <div className={submitCount && errors.procExpiryDate ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="procExpiryDate">PROC Expiry Date</label>
                                    <Field name="procExpiryDate" type="date" id="procExpiryDate" className="form-input" />
                                    {submitCount && errors.procExpiryDate ? <div className="text-danger mt-1">{errors.procExpiryDate}</div> : null}
                                </div>

                                <FieldArray name="services">
                                    {({ push, remove }) => (
                                        <>
                                            {values.services.map((service, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
                                                    <div className="md:col-span-12">
                                                        <label className="text-sm font-semibold text-gray-700">Urgency</label>

                                                        <Field
                                                            as="select"
                                                            name={`urgency.${index}.urgency`}
                                                            className="form-select w-full"
                                                        >
                                                            <option value="">Select Urgency Type</option>
                                                            {urgency.map((option) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </Field>

                                                        {/* ✅ Move ErrorMessage INSIDE the .map loop so index is available */}
                                                        <div className="h-4">
                                                            <ErrorMessage
                                                                name={`services.${index}.urgency`}
                                                                component="div"
                                                                className="text-red-500 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                            ))}
                                        </>
                                    )}
                                </FieldArray>
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

                                                {/* equipmentNo */}
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-semibold text-gray-700">Equipment ID/Serial No.</label>
                                                    <Field type="text" name="equipmentNo" placeholder="Enter Equipment ID/Serial No" className="form-input w-full" />
                                                    <div className="h-4">
                                                        <ErrorMessage name={`services.${index}.equipmentNo`} component="div" className="text-red-500 text-sm" />
                                                    </div>
                                                </div>

                                                {/* Work Type */}
                                                <div className="md:col-span-4">
                                                    <label className="text-sm font-semibold text-gray-700">Type Of Work</label>
                                                    <MultiSelectField name={`services.${index}.workType`} options={workTypeOptions} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-semibold text-gray-700">Machine Model</label>
                                                    <Field type="text" name="machinemodel" placeholder="Enter Machine Model" className="form-input w-full" />
                                                    <div className="h-4">
                                                        <ErrorMessage name={`services.${index}.machinemodel`} component="div" className="text-red-500 text-sm" />
                                                    </div>
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
                                        <button type="button" onClick={() => push({ machineType: '', quantity: 1, workType: [] })} className="btn btn-primary w-full sm:w-auto">
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

                        {/* Urgency */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Special Instructions</h5>
                            <div className="grid grid-cols-1   gap-4">
                                <Field name="urgency" type="text" id="emailAddress" placeholder="Enter special instruction" className="form-input" />
                            </div>
                            {submitCount && errors.urgency ? <p className="text-red-500 text-sm mt-1">{errors.urgency}</p> : <></>}
                        </div>

                        {/* Submit Button */}
                        <div className="w-full mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success mt-4">
                                Create Order
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default CreateOrder;
