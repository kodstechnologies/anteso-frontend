import React from 'react';
import * as Yup from 'yup';
import { FieldArray, Field, Form, Formik, ErrorMessage, FieldProps } from 'formik';
import { showMessage } from '../../components/common/ShowMessage';
import Select from 'react-select';
import logo from '../../assets/logo/logo.png';

interface OptionType {
    value: string;
    label: string;
}

interface MultiSelectFieldProps {
    name: string;
    options: OptionType[];
}

// Custom component for multi-select field
const MultiSelectField: React.FC<MultiSelectFieldProps> = ({ name, options }) => (
    <Field name={name}>
        {({ field, form }: FieldProps) => (
            <div>
                <Select
                    isMulti
                    options={options}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    value={options.filter((option) => field.value?.includes(option.value))}
                    onChange={(selectedOptions) => {
                        form.setFieldValue(name, selectedOptions ? selectedOptions.map((option: OptionType) => option.value) : []);
                    }}
                    onBlur={() => form.setFieldTouched(name, true)}
                    menuPortalTarget={document.body} // 👈 portal
                    styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }), // 👈 set high z-index
                    }}
                />
                <ErrorMessage name={name} component="div" className="text-red-500 text-sm" />
            </div>
        )}
    </Field>
);

type Service = {
    machineType: string;
    equipmentNo: number;
    workType: string[];
};

type FormValues = {
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
};

const serviceOptions = [
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

const machineOptions = [
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

const urgencyOptions = ['Immediantely (within 1-2 days)', 'Urgent (Within a week)', 'Soon (Within 2-3 weeks)', 'Not urgent (just exploring)'];

const workTypeOptions = [
    { value: 'Quality Assurance Test', label: 'Quality Assurance Test' },
    { value: ' License for Operation', label: ' License for Operation' },
    { value: 'Decommissioning', label: 'Decommissioning' },
    { value: 'Decommissioning and Recommissioning', label: 'Decommissioning and Recommissioning' },
];

const AddEnquiry = () => {
    const SubmittedForm = Yup.object().shape({
        leadOwner: Yup.string().required('Please fill the Field'),

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
        additionalServices: Yup.object().shape({
            'INSTITUTE REGISTRATION': Yup.string(),
            'RSO REGISTRATION, NOMINATION & APPROVAL': Yup.string(),
            'DECOMMISSIONING, PRE OWNED PROCUREMENT, QA & LICENSE': Yup.string(),
            PROCUREMENT: Yup.string(),
            'TLD BADGE': Yup.string(),
            'LEAD SHEET': Yup.string(),
            'LEAD GLASS': Yup.string(),
            'LEAD APRON': Yup.string(),
            'THYROID SHIELD': Yup.string(),
            'GONAD SHIELD': Yup.string(),
            OTHERS: Yup.string(),
        }),
    });

    const submitForm = (values: FormValues) => {
        console.log('Form submitted with values:', values);
        showMessage('Form submitted successfully', 'success');
    };

    return (
        <div className="fixed w-[100vw] h-[100vh] left-0 top-0 z-50 sm:px-20 sm:py-4 overflow-y-scroll bg-white">
            <img src={logo} alt="" className="h-14 mt-4 mb-8" />

            <h5 className="font-semibold text-lg mb-4">Enquiry Form</h5>

            <Formik
                initialValues={{
                    leadOwner: '',
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
                    attachment: ''

                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, touched, values, setFieldValue }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                                <div className={submitCount && errors.leadOwner ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="leadOwner">Lead Owner</label>
                                    {/* <MultiSelectField name={`leadOwner`} options={dealerOptions} /> */}
                                    <Field name="leadOwner" type="text" id="leadOwner" placeholder="Enter Lead Owner" className="form-input" />

                                    {submitCount && errors.leadOwner ? <div className="text-danger mt-1">{errors.leadOwner}</div> : null}
                                </div>
                                <div className={submitCount ? (errors.hospitalName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="hospitalName">Hospital Name </label>
                                    <Field name="hospitalName" type="text" id="hospitalName" placeholder="Enter Hospital Name" className="form-input" />
                                    {submitCount ? errors.hospitalName ? <div className="text-danger mt-1">{errors.hospitalName}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.fullAddress ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="fullAddress">Full Address </label>
                                    <Field name="fullAddress" type="text" id="fullAddress" placeholder="Enter Full Address" className="form-input" />
                                    {submitCount ? errors.fullAddress ? <div className="text-danger mt-1">{errors.fullAddress}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.city ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="city">City</label>
                                    <Field name="city" type="text" id="city" placeholder="Enter City Name" className="form-input" />
                                    {submitCount ? errors.city ? <div className="text-danger mt-1">{errors.city}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.state ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="state">State</label>
                                    <Field name="state" type="text" id="state" placeholder="Enter State Name" className="form-input" />
                                    {submitCount ? errors.state ? <div className="text-danger mt-1">{errors.state}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.pinCode ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="pinCode">PIN Code</label>
                                    <Field name="pinCode" type="text" id="pinCode" placeholder="Enter PIN Code" className="form-input" />
                                    {submitCount ? errors.pinCode ? <div className="text-danger mt-1">{errors.pinCode}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.contactPerson ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="contactPerson">Contact Person Name</label>
                                    <Field name="contactPerson" type="text" id="contactPerson" placeholder="Enter Contact Person Name" className="form-input" />
                                    {submitCount ? errors.contactPerson ? <div className="text-danger mt-1">{errors.contactPerson}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>

                                <div className={submitCount ? (errors.emailAddress ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="emailAddress">Email Address</label>
                                    <Field name="emailAddress" type="text" id="emailAddress" placeholder="Enter Email Address" className="form-input" />
                                    {submitCount ? errors.emailAddress ? <div className="text-danger mt-1">{errors.emailAddress}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>

                                <div className={submitCount ? (errors.contactNumber ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="contactNumber">Contact Number</label>
                                    <Field name="contactNumber" type="text" id="contactNumber" placeholder="Enter Contact Number" className="form-input" />
                                    {submitCount ? errors.contactNumber ? <div className="text-danger mt-1">{errors.contactNumber}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>

                                <div className={submitCount ? (errors.designation ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="designation">Designation</label>
                                    <Field name="designation" type="text" id="designation" placeholder="Enter Designation" className="form-input" />
                                    {submitCount ? errors.designation ? <div className="text-danger mt-1">{errors.designation}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
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
                                                    <Field as="select" name={`services.${index}.machineType`} className="form-select w-full border-gray-300 rounded-md text-gray-700">
                                                        <option value="">Select machine type</option>
                                                        <option>Fixed X-Ray</option>
                                                        <option>Mobile X-Ray</option>
                                                        <option>C-Arm</option>
                                                        <option>Cath Lab/Interventional Radiology</option>
                                                        <option>Mammography</option>
                                                        <option>CT Scan</option>
                                                        <option>PET CT</option>
                                                        <option>CT Simulator</option>
                                                        <option>OPG</option>
                                                        <option>CBCT</option>
                                                        <option>BMD/DEXA</option>
                                                        <option>Dental IOPA</option>
                                                        <option>Dental Hand Held</option>
                                                        <option>O Arm</option>
                                                        <option>KV Imaging (OBI)</option>
                                                        <option>Lead Apron Test</option>
                                                        <option>Thyroid Shield Test</option>
                                                        <option>Gonad Shield Test</option>
                                                        <option>Radiation Survey of Radiation Facility</option>
                                                        <option>Others</option>
                                                    </Field>
                                                    <ErrorMessage name={`services.${index}.machineType`} component="div" className="text-red-500 text-sm" />
                                                </div>

                                                {/* equipmentNo */}
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-semibold text-gray-700">Equipment ID/Serial No.</label>
                                                    <Field type="text" name="Equipment No" placeholder="Equipment ID/Serial No." className="form-input w-full" />
                                                    <ErrorMessage name={`services.${index}.equipmentNo`} component="div" className="text-red-500 text-sm" />
                                                </div>

                                                {/* Work Type */}
                                                <div className="md:col-span-5">
                                                    <label className="text-sm font-semibold text-gray-700">Type Of Work</label>
                                                    <MultiSelectField name={`services.${index}.workType`} options={workTypeOptions} />
                                                </div>

                                                {/* Remove Button */}
                                                {values.services.length > 1 && (
                                                    <div className="md:col-span-1 flex justify-end">
                                                        <button type="button" onClick={() => remove(index)} className="text-red-500 text-xs">
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

                        {/* Urgency */}
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

                                {/* Attachment Upload Field */}
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

                        {/* Submit Button */}
                        <div className="w-full mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success mt-4">
                                Submit Enquiry
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default AddEnquiry;
