import * as Yup from 'yup';
import { Field, Form, Formik, FieldArray, ErrorMessage, FieldProps } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../common/ShowMessage';
import { orderData, serviceOptions, } from '../../../data';
import Select from 'react-select';

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
    advanceAmount: Yup.string().required('Please fill the Field'),
    services: Yup.array()
        .of(
            Yup.object().shape({
                machineType: Yup.string().required('Required'),
                equipmentNo: Yup.string().required('Required'),
                workType: Yup.array().min(1, 'At least one work type is required'),
            })
        )
        .min(1, 'At least one service is required'),
    additionalServices: Yup.object().shape(
        serviceOptions.reduce((schema, service) => {
            return { ...schema, [service]: Yup.string().nullable() };
        }, {}),

    ),
    enquiryID: Yup.string().nullable(),
    sysId: Yup.string().required('Please fill the Field'),
    procNo: Yup.string().required('Please fill the Field'),
    procExpiryDate: Yup.date().required('Please fill the Expiry Date').typeError('Invalid date format'),
});
interface OptionType {
    value: string;
    label: string;
}
interface MultiSelectFieldProps {
    name: string;
    options: OptionType[];
}
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

const workTypeOptions = [
    { value: 'Quality Assurance Test', label: 'Quality Assurance Test' },
    { value: 'License for Operation', label: 'License for Operation' },
    { value: 'Decommissioning', label: 'Decommissioning' },
    { value: 'Decommissioning and Recommissioning', label: 'Decommissioning and Recommissioning' },
];

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({ name, options }) => (
    <Field name={name}>
        {({ field, form }: FieldProps) => (
            <div>
                <Select
                    isMulti
                    options={options}
                    value={options.filter((option) => field.value?.includes(option.value))}
                    onChange={(selectedOptions) =>
                        form.setFieldValue(
                            name,
                            selectedOptions ? selectedOptions.map((option) => option.value) : []
                        )
                    }
                    onBlur={() => form.setFieldTouched(name, true)}
                    classNamePrefix="select"
                />
                <ErrorMessage name={name} component="div" className="text-red-500 text-sm" />
            </div>
        )}
    </Field>
);

const Edit = () => {
    const initialOrder = {
        ...(orderData[0] as any),
        services: [{ machineType: '', equipmentNo: '', workType: [] }],
        additionalServices:  {
            t1: 'included',
            t2: 'Dummy info for T2',
            t3: '',
            t4: '',
        },
        urgency: '',
        attachment: '',
    };


    const submitForm = () => {
        showMessage('Order updated successfully', 'success');
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
                    <Link to="/admin/orders" className="text-primary">
                        Orders
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Order
                    </Link>
                </li>
            </ol>

            <Formik
                initialValues={initialOrder}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, values }) => (
                    <Form className="space-y-6">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Edit Order</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.keys(initialOrder).map((key) => (
                                    typeof initialOrder[key] !== 'object' && (
                                        <div
                                            key={key}
                                            className={submitCount > 0 && errors[key] ? 'has-error' : submitCount > 0 ? 'has-success' : ''}
                                        >
                                            <label htmlFor={key} className="capitalize">
                                                {key.replace(/([A-Z])/g, ' $1')}
                                            </label>
                                            <Field
                                                name={key}
                                                type="text"
                                                id={key}
                                                placeholder={`Enter ${key}`}
                                                className="form-input"
                                            />
                                            {/* {submitCount > 0 && errors[key] && (
                                                <div className="text-danger mt-1">{errors[key]}</div>
                                            )} */}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Services</h5>
                            <FieldArray name="services">
                                {({ push, remove }) => (
                                    <>
                                        {values.services?.map(({ _, index }: any) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
                                                <div className="md:col-span-4">
                                                    <label className="text-sm font-semibold text-gray-700">Machine Type</label>
                                                    <Field as="select" name={`services.${index}.machineType`} className="form-select w-full">
                                                        <option value="">Select Machine Type</option>
                                                        {machineOptions.map((option) => (
                                                            <option key={option.value} value={option.value}>{option.label}</option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage name={`services.${index}.machineType`} component="div" className="text-red-500 text-sm" />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-semibold text-gray-700">Equipment ID/Serial No.</label>
                                                    <Field name={`services.${index}.equipmentNo`} placeholder="Enter Equipment ID/Serial No" className="form-input w-full" />
                                                    <ErrorMessage name={`services.${index}.equipmentNo`} component="div" className="text-red-500 text-sm" />
                                                </div>

                                                <div className="md:col-span-5">
                                                    <label className="text-sm font-semibold text-gray-700">Type Of Work</label>
                                                    <MultiSelectField name={`services.${index}.workType`} options={workTypeOptions} />
                                                </div>

                                                {values.services.length > 1 && (
                                                    <div className="md:col-span-1 flex justify-end">
                                                        <button type="button" onClick={() => remove(index)} className="mb-4 text-red-500 text-xs">Remove</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <button type="button" onClick={() => push({ machineType: '', equipmentNo: '', workType: [] })} className="btn btn-primary w-full sm:w-auto">
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
                                        <Field name={`additionalServices.${service}`}>
                                            {({ field, form }: FieldProps) => (
                                                <>
                                                    <input
                                                        type="checkbox"
                                                        
                                                        checked={field.value !== undefined}
                                                        onChange={() => {
                                                            if (field.value !== undefined) {
                                                                form.setFieldValue(`additionalServices.${service}`, undefined); // Uncheck
                                                            } else {
                                                                form.setFieldValue(`additionalServices.${service}`, 'info'); // Check with empty string
                                                            }
                                                        }}
                                                        className={`form-checkbox h-5 w-5 transition-colors duration-200 ${field.value !== undefined ? 'text-blue-600' : 'text-gray-400'}`}
                                                    />
                                                    <span>{service}</span>
                                                </>
                                            )}
                                        </Field>
                                    </div>

                                    <div className="sm:col-span-2 mt-2 sm:mt-0">
                                        {values.additionalServices[service] !== undefined && (
                                            <Field
                                                type="text"
                                                name={`additionalServices.${service}`}
                                                placeholder="Enter info..."
                                                className="form-input w-full"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>


                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Special Instructions</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={submitCount && errors.urgency ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <Field
                                        name="urgency"
                                        type="text"
                                        id="urgency"
                                        placeholder="Enter special instruction"
                                        className="form-input"
                                    />
                                    {/* {submitCount > 0 && errors.urgency && (
                                        <p className="text-red-500 text-sm mt-1">{errors.urgency}</p>
                                    )} */}
                                </div>


                            </div>
                        </div>

                        <div className="w-full flex justify-end">
                            <button type="submit" className="btn btn-success">Update Order</button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default Edit;
