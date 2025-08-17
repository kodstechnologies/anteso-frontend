import * as Yup from 'yup';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { showMessage } from '../../../common/ShowMessage';
import { toolsData } from '../../../../data';
import { addEmployee, getUnAssignedTools } from '../../../../api';

// Define the interface for the tool data
interface Tool {
    _id:string,
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
    activeStatus: 'Active',
    toolIDs: string[];
    tools: { [toolID: string]: string };
    designation: string,
    department: string,
    dateOfJoining: string,
    workingDays: string,

}

const AddEngineer = () => {
    const [requiredTools, setRequiredTools] = useState(0);
    const navigate = useNavigate();
    const [toolsData, setToolsData] = useState<Tool[]>([]);
    const [loadingTools, setLoadingTools] = useState(false);

    useEffect(() => {
        const fetchTools = async () => {
            try {
                setLoadingTools(true);
                const res = await getUnAssignedTools();
                // console.log("🚀 ~ fetchTools ~ res:", res)
                setToolsData(res.data); // adjust if your API returns a different shape
            } catch (error) {
                console.error("Failed to load tools", error);
            } finally {
                setLoadingTools(false);
            }
        };

        fetchTools();
    }, []);

    // Validation schema
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

    // Handle form submission
    const submitForm = async (
        values: FormValues,
        { resetForm }: FormikHelpers<FormValues>
    ) => {
        try {
            console.log('Submitting values:', values);

            const formattedPayload = {
                name: values.name,
                phone: values.phone,
                email: values.email,
                address: "", // Add address field if used elsewhere
                technicianType: values.technicianType.toLowerCase(), // 'Engineer' => 'engineer'
                status: values.activeStatus.toLowerCase(), // 'Active' => 'active'
                designation: values.designation,
                department: values.department,
                dateOfJoining: new Date(values.dateOfJoining),
                workingDays: Number(values.workingDays),
                tools: values.technicianType === "Engineer"
                    ? values.toolIDs.map(toolId => ({
                        toolId, // this is now the Mongo `_id`
                        issueDate: values.tools?.[toolId] || null
                    }))
                    : []

            };

            await addEmployee(formattedPayload);

            showMessage('Employee added successfully', 'success');
            resetForm();
            setRequiredTools(0);
            navigate('/admin/employee');
        } catch (error: any) {
            showMessage(error.message || 'Failed to add employee', 'error');
        }
    };

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

            {/* Formik Form */}
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

                }}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
            >
                {({ errors, submitCount, values }) => (
                    <Form className="space-y-5">
                        {/* Basic Details Panel */}
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
                                        maxLength={10} // extra safeguard
                                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        }}
                                    />
                                    {submitCount > 0 && errors.phone && (
                                        <div className="text-danger mt-1">{errors.phone}</div>
                                    )}
                                </div>

                                <div className={submitCount && errors.designation ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="designation">Designation</label>
                                    <Field name="designation" type="text" id="designation" className="form-input" placeholder="Enter Designation" />
                                    {submitCount > 0 && errors.designation && <div className="text-danger mt-1">{errors.designation}</div>}
                                </div>
                                <div className={submitCount && errors.workingDays ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="workingDays">Working Days</label>
                                    <Field name="workingDays" type="number" id="workingDays" className="form-input" placeholder="Enter Working Days" />
                                    {submitCount > 0 && errors.workingDays && <div className="text-danger mt-1">{errors.workingDays}</div>}
                                </div>
                                <div className={submitCount && errors.dateOfJoining ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="dateOfJoining">Date Of Joining</label>
                                    <Field name="dateOfJoining" type="date" id="dateOfJoining" className="form-input" placeholder="Enter Date Of Joining" />
                                    {submitCount > 0 && errors.dateOfJoining && <div className="text-danger mt-1">{errors.dateOfJoining}</div>}
                                </div>
                                <div className={submitCount && errors.department ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="department">Department</label>
                                    <Field name="department" type="text" id="department" className="form-input" placeholder="Enter Department" />
                                    {submitCount > 0 && errors.phone && <div className="text-danger mt-1">{errors.department}</div>}
                                </div>

                                {/* Emp ID */}
                                {/* <div className={submitCount && errors.empId ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="empId">Employee ID</label>
                                    <Field name="empId" type="text" id="empId" className="form-input" placeholder="Enter Employee ID" />
                                    {submitCount > 0 && errors.empId && <div className="text-danger mt-1">{errors.empId}</div>}
                                </div> */}

                                {/* Role */}
                                <div className={submitCount && errors.technicianType ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="technicianType">Role</label>
                                    <Field as="select" name="technicianType" className="form-select">
                                        <option value="" disabled>Select Role</option>
                                        <option value="Office Staff">Office Staff</option>
                                        <option value="Engineer">Engineer</option>
                                    </Field>
                                    {submitCount > 0 && errors.technicianType && <div className="text-danger mt-1">{errors.technicianType}</div>}
                                </div>

                                {/* Status */}
                                <div className={submitCount && errors.activeStatus ? 'has-error' : submitCount ? 'has-success' : ''}>
                                    <label htmlFor="activeStatus">Active Status</label>
                                    <Field as="select" name="activeStatus" className="form-select">
                                        <option value="" disabled>Select Status</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </Field>
                                    {submitCount > 0 && errors.activeStatus && (
                                        <div className="text-danger mt-1">{errors.activeStatus}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tools Panel */}
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
                                                        <span>{tool.nomenclature} ({tool.toolId})</span>
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
                                                            {submitCount > 0 && errors.tools?.[tool._id] && (
                                                                <div className="text-danger text-sm mt-1">
                                                                    {errors.tools[tool._id]}
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

                        {/* Submit */}
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
