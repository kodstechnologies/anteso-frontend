import * as Yup from 'yup';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { showMessage } from '../../../common/ShowMessage';
import { addEmployee, getUnAssignedTools } from '../../../../api';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface Tool {
    _id: string;
    toolId: string;
    nomenclature: string;
    manufacturer: string;
    model: string;
    SrNo: string;
    calibrationCertificateNo: string;
    calibrationValidTill: string;
    range: string;
    certificate?: string;
}

interface FormValues {
    name: string;
    email: string;
    phone: string;
    technicianType: string;
    activeStatus: 'Active' | 'Inactive';
    toolIDs: string[];
    tools: { [toolID: string]: string };
    designation: string;
    department: string;
    dateOfJoining: string;
    workingDays: string;
    password?: string;
    // NEW – file refs (not sent to backend, just for UI)
    doc1?: File | null;
    doc2?: File | null;
    doc3?: File | null;
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------
const AddEngineer = () => {
    const navigate = useNavigate();
    const [toolsData, setToolsData] = useState<Tool[]>([]);
    const [loadingTools, setLoadingTools] = useState(false);

    // --------------------------------------------------------------
    // Load un-assigned tools
    // --------------------------------------------------------------
    useEffect(() => {
        const fetchTools = async () => {
            try {
                setLoadingTools(true);
                const res = await getUnAssignedTools();
                setToolsData(res.data);
            } catch (error) {
                console.error('Failed to load tools', error);
            } finally {
                setLoadingTools(false);
            }
        };
        fetchTools();
    }, []);

    // --------------------------------------------------------------
    // Validation schema
    // --------------------------------------------------------------
    const SubmittedForm = Yup.object().shape({
        name: Yup.string().required('Please fill the Field'),
        email: Yup.string().email('Invalid email').required('Please fill the Email'),
        phone: Yup.string()
            .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
            .required('Please fill the Field'),
        designation: Yup.string().required('Please fill the Field'),
        department: Yup.string().required('Please fill the Field'),
        dateOfJoining: Yup.string().required('Please fill the Field'),
        workingDays: Yup.number()
            .typeError('Working days must be a number')
            .integer('Working days must be a whole number')
            .required('Please fill the Field'),
        technicianType: Yup.string().required('Please fill the Field'),
        activeStatus: Yup.string().required('Please select status'),

        password: Yup.string().when('technicianType', {
            is: 'office-staff',
            then: (schema) =>
                schema
                    .required('Password is required for office staff')
                    .min(6, 'Password must be at least 6 characters long'),
            otherwise: (schema) => schema.notRequired(),
        }),

        toolIDs: Yup.array().of(Yup.string()).when('technicianType', {
            is: 'Engineer',
            then: (schema) => schema.min(1, 'Please select at least one tool'),
            otherwise: (schema) => schema.notRequired(),
        }),

        tools: Yup.object().when('technicianType', {
            is: 'Engineer',
            then: (schema) =>
                schema.test(
                    'tool-issue-dates',
                    'Each selected tool must have an issue date',
                    function (value: any) {
                        const { toolIDs } = this.parent;
                        if (!toolIDs || toolIDs.length === 0) return true;
                        return toolIDs.every((toolID: string) => !!value?.[toolID]);
                    }
                ),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

    // --------------------------------------------------------------
    // Form submit
    // --------------------------------------------------------------
    const submitForm = async (
        values: FormValues,
        { resetForm }: FormikHelpers<FormValues>
    ) => {
        try {
            // ---------- Build FormData ----------
            const payload = new FormData();

            // Basic fields
            payload.append('name', values.name);
            payload.append('phone', values.phone);
            payload.append('email', values.email);
            payload.append('technicianType', values.technicianType.toLowerCase());
            payload.append('status', values.activeStatus.toLowerCase());
            payload.append('designation', values.designation);
            payload.append('department', values.department);
            payload.append('dateOfJoining', values.dateOfJoining);
            payload.append('workingDays', values.workingDays);

            // Password (office-staff only)
            if (values.technicianType === 'office-staff' && values.password) {
                payload.append('password', values.password);
            }

            // Tools (engineer only)
            if (values.technicianType === 'Engineer') {
                const toolsArray = values.toolIDs.map((toolId) => ({
                    toolId,
                    issueDate: values.tools?.[toolId] || null,
                }));
                payload.append('tools', JSON.stringify(toolsArray));
            }

            // Documents (engineer only)
            if (values.technicianType === 'Engineer') {
                if (values.doc1) payload.append('doc1', values.doc1);
                if (values.doc2) payload.append('doc2', values.doc2);
                if (values.doc3) payload.append('doc3', values.doc3);
            }

            // ---------- API call ----------
            await addEmployee(payload);

            showMessage('Employee added successfully', 'success');
            resetForm();
            navigate('/admin/employee');
        } catch (error: any) {
            showMessage(error.message || 'Failed to add employee', 'error');
        }
    };

    // --------------------------------------------------------------
    // Render
    // --------------------------------------------------------------
    return (
        <>
            {/* Breadcrumb */}
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

            {/* No tools warning */}
            {!loadingTools && toolsData.length === 0 && (
                <div className="p-4 mb-4 text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg">
                    Warning: No tools available. Please{' '}
                    <Link to="/admin/tools/add" className="text-primary underline hover:text-primary/80">
                        add tools
                    </Link>{' '}
                    before assigning them to engineers.
                </div>
            )}

            {/* Formik */}
            <Formik<FormValues>
                initialValues={{
                    name: '',
                    email: '',
                    phone: '',
                    technicianType: '',
                    designation: '',
                    department: '',
                    dateOfJoining: '',
                    workingDays: '',
                    activeStatus: 'Active',
                    toolIDs: [],
                    tools: {},
                    doc1: null,
                    doc2: null,
                    doc3: null,
                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, values, setFieldValue }) => (
                    <Form className="space-y-5">
                        {/* ---------- Basic Details ---------- */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Basic Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Name */}
                                <div className={submitCount && errors.name ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="name">Name</label>
                                    <Field name="name" type="text" id="name" className="form-input" placeholder="Enter Name" />
                                    {submitCount > 0 && errors.name && <div className="text-danger mt-1">{errors.name}</div>}
                                </div>

                                {/* Email */}
                                <div className={submitCount && errors.email ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="email">Email</label>
                                    <Field name="email" type="email" id="email" className="form-input" placeholder="Enter Email" />
                                    {submitCount > 0 && errors.email && <div className="text-danger mt-1">{errors.email}</div>}
                                </div>

                                {/* Phone */}
                                <div className={submitCount && errors.phone ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="phone">Phone</label>
                                    <Field
                                        name="phone"
                                        type="text"
                                        id="phone"
                                        className="form-input"
                                        placeholder="Enter Phone"
                                        maxLength={10}
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        }}
                                    />
                                    {submitCount > 0 && errors.phone && <div className="text-danger mt-1">{errors.phone}</div>}
                                </div>

                                {/* Designation */}
                                <div className={submitCount && errors.designation ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="designation">Designation</label>
                                    <Field name="designation" type="text" id="designation" className="form-input" placeholder="Enter Designation" />
                                    {submitCount > 0 && errors.designation && <div className="text-danger mt-1">{errors.designation}</div>}
                                </div>

                                {/* Working Days */}
                                <div className={submitCount && errors.workingDays ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="workingDays">Working Days</label>
                                    <Field name="workingDays" type="number" id="workingDays" className="form-input" placeholder="Enter Working Days" />
                                    {submitCount > 0 && errors.workingDays && <div className="text-danger mt-1">{errors.workingDays}</div>}
                                </div>

                                {/* Date Of Joining */}
                                <div className={submitCount && errors.dateOfJoining ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="dateOfJoining">Date Of Joining</label>
                                    <Field name="dateOfJoining" type="date" id="dateOfJoining" className="form-input" />
                                    {submitCount > 0 && errors.dateOfJoining && <div className="text-danger mt-1">{errors.dateOfJoining}</div>}
                                </div>

                                {/* Department */}
                                <div className={submitCount && errors.department ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="department">Department</label>
                                    <Field name="department" type="text" id="department" className="form-input" placeholder="Enter Department" />
                                    {submitCount > 0 && errors.department && <div className="text-danger mt-1">{errors.department}</div>}
                                </div>

                                {/* Role */}
                                <div className={submitCount && errors.technicianType ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="technicianType">Role</label>
                                    <Field as="select" name="technicianType" className="form-select">
                                        <option value="" disabled>
                                            Select Role
                                        </option>
                                        <option value="office-staff">Office Staff</option>
                                        <option value="Engineer">Engineer</option>
                                    </Field>
                                    {submitCount > 0 && errors.technicianType && <div className="text-danger mt-1">{errors.technicianType}</div>}
                                </div>

                                {/* Status */}
                                <div className={submitCount && errors.activeStatus ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="activeStatus">Active Status</label>
                                    <Field as="select" name="activeStatus" className="form-select">
                                        <option value="" disabled>
                                            Select Status
                                        </option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </Field>
                                    {submitCount > 0 && errors.activeStatus && <div className="text-danger mt-1">{errors.activeStatus}</div>}
                                </div>
                            </div>
                        </div>

                        {/* ---------- Tools (Engineer only) ---------- */}
                        {values.technicianType === 'Engineer' && (
                            <div className="panel">
                                <h5 className="font-semibold text-lg mb-4">Tools</h5>
                                <div className="space-y-4 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded">
                                    {loadingTools ? (
                                        <p>Loading tools...</p>
                                    ) : toolsData.length === 0 ? (
                                        <p className="text-gray-500">No tools available</p>
                                    ) : (
                                        toolsData.map((tool: Tool) => {
                                            const isSelected = values.toolIDs.includes(tool._id);
                                            return (
                                                <div key={tool._id} className="border-b pb-2">
                                                    <label className="flex items-center space-x-2">
                                                        <Field
                                                            type="checkbox"
                                                            name="toolIDs"
                                                            value={tool._id}
                                                            className="form-checkbox h-5 w-5 text-primary"
                                                        />
                                                        <span>
                                                            {tool.nomenclature} ({tool.toolId})
                                                        </span>
                                                    </label>

                                                    {isSelected && (
                                                        <div className="mt-2 ml-6">
                                                            <label htmlFor={`tools.${tool._id}`} className="block text-sm">
                                                                Issue Date for {tool.toolId}
                                                            </label>
                                                            <Field
                                                                name={`tools.${tool._id}`}
                                                                type="date"
                                                                className="form-input"
                                                            />
                                                            {submitCount > 0 && (errors.tools as any)?.[tool._id] && (
                                                                <div className="text-danger text-sm mt-1">
                                                                    {(errors.tools as any)[tool._id]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ---------- Documents (Engineer only) ---------- */}
                        {values.technicianType === 'Engineer' && (
                            <div className="panel">
                                <h5 className="font-semibold text-lg mb-4">Upload Documents</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* doc1 */}
                                    <div>
                                        <label htmlFor="doc1" className="block mb-1">
                                            Document 1
                                        </label>
                                        <input
                                            id="doc1"
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="form-input"
                                            onChange={(e) => {
                                                const file = e.currentTarget.files?.[0] ?? null;
                                                setFieldValue('doc1', file);
                                            }}
                                        />
                                    </div>

                                    {/* doc2 */}
                                    <div>
                                        <label htmlFor="doc2" className="block mb-1">
                                            Document 2
                                        </label>
                                        <input
                                            id="doc2"
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="form-input"
                                            onChange={(e) => {
                                                const file = e.currentTarget.files?.[0] ?? null;
                                                setFieldValue('doc2', file);
                                            }}
                                        />
                                    </div>

                                    {/* doc3 */}
                                    <div>
                                        <label htmlFor="doc3" className="block mb-1">
                                            Document 3
                                        </label>
                                        <input
                                            id="doc3"
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="form-input"
                                            onChange={(e) => {
                                                const file = e.currentTarget.files?.[0] ?? null;
                                                setFieldValue('doc3', file);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ---------- Password (Office Staff only) ---------- */}
                        {values.technicianType === 'office-staff' && (
                            <div className={submitCount && errors.password ? 'has-error' : submitCount ? 'has-success' : ''}>
                                <label htmlFor="password">Password</label>
                                <Field
                                    name="password"
                                    type="password"
                                    id="password"
                                    className="form-input"
                                    placeholder="Enter Password"
                                />
                                {submitCount > 0 && errors.password && <div className="text-danger mt-1">{errors.password}</div>}
                            </div>
                        )}

                        {/* ---------- Submit ---------- */}
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