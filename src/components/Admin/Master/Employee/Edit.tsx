// src/pages/admin/employee/EditEngineer.tsx
import * as Yup from 'yup';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { showMessage } from '../../../common/ShowMessage';
import { getEmployeeById, editEmployee } from '../../../../api';

type RoleValue = 'office staff' | 'engineer';
type StatusValue = 'active' | 'inactive';

type ToolOption = { id: string; name: string };

// TODO: replace with tools from your backend if needed
const toolsList: ToolOption[] = [
  { id: 'TL001', name: 'Caliper' },
  { id: 'TL002', name: 'Micrometer' },
  { id: 'TL003', name: 'Vernier Scale' },
];

type ApiTool = {
  toolId: string;        // readable id e.g. TL001 OR ObjectId (depending on your backend)
  issueDate?: string;    // ISO string
};

type EmployeeApi = {
  _id: string;
  name: string;
  email: string;
  phone: string | number;
  empId: string;
  technicianType: RoleValue | string; // backend may send lowercase
  status: StatusValue | string;
  tools?: ApiTool[];
};

type FormValues = {
  name: string;
  email: string;
  phone: string; // keep as string for inputs
  empId: string;
  role: RoleValue | 'Engineer' | 'Office Staff'; // UI may use capitalized option; we normalize
  tools: string[]; // list of selected tool ids (TL001, ...)
  issueDates: Record<string, string>; // map toolId -> yyyy-mm-dd
  status: StatusValue | 'Active' | 'Inactive';
};

const schema: Yup.Schema<FormValues> = Yup.object({
  name: Yup.string().required('Please fill the Field'),
  email: Yup.string().email('Invalid email').required('Please fill the Email'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
    .required('Please fill the Field'),
  empId: Yup.string().required('Please fill the Field'),
  role: Yup.string().required('Please fill the Field'),
  tools: Yup.array().of(Yup.string()).when('role', {
    is: (val: string) => (val || '').toLowerCase() === 'engineer',
    then: (s) => s.min(1, 'Please select at least one tool'),
    otherwise: (s) => s.notRequired(),
  }),
  issueDates: Yup.object().when('role', {
    is: (val: string) => (val || '').toLowerCase() === 'engineer',
    then: (s) =>
      s.test(
        'allToolsHaveDates',
        'Please provide issue dates for selected tools',
        function (value) {
          const v = value as Record<string, string> | undefined;
          const selected = (this.parent as FormValues).tools;
          if (!selected?.length) return true;
          return selected.every((toolId) => v?.[toolId]);
        }
      ),
    otherwise: (s) => s.notRequired(),
  }),
  status: Yup.string().required('Please fill the Field'),
});

const normalizeRole = (r: string): RoleValue =>
  (r || '').toLowerCase() === 'engineer' ? 'engineer' : 'office staff';

const normalizeStatus = (s: string): StatusValue =>
  (s || '').toLowerCase() === 'inactive' ? 'inactive' : 'active';

const EditEngineer = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load employee by id
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      try {
        const res = await getEmployeeById(id);
        const emp = (res?.data || res) as EmployeeApi;

        const tools = (emp.tools || []).map((t) => t.toolId);
        const issueDates = (emp.tools || []).reduce<Record<string, string>>((acc, t) => {
          if (t.toolId) acc[t.toolId] = t.issueDate ? t.issueDate.split('T')[0] : '';
          return acc;
        }, {});

        setInitialValues({
          name: emp.name || '',
          email: emp.email || '',
          phone: String(emp.phone ?? ''),
          empId: emp.empId || '',
          role: normalizeRole(emp.technicianType),
          tools,
          issueDates,
          status: normalizeStatus(emp.status),
        });
      } catch (err) {
        console.error(err);
        showMessage('Failed to load employee data', 'error');
        navigate('/admin/employee');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, navigate]);

  const handleSubmit = async (values: FormValues, _helpers: FormikHelpers<FormValues>) => {
    try {
      // Normalize role/status for backend
      const technicianType: RoleValue = normalizeRole(values.role as string);
      const status: StatusValue = normalizeStatus(values.status as string);

      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        empId: values.empId, // if backend allows editing, else remove
        technicianType,      // 'engineer' | 'office staff'
        status,              // 'active' | 'inactive'
        // Convert tools + issueDates to the array the backend expects
        tools:
          technicianType === 'engineer'
            ? values.tools.map((toolId) => ({
                toolId,
                issueDate: values.issueDates?.[toolId] || null,
              }))
            : [],
      };

      await editEmployee(id as string, payload);
      showMessage('Employee updated successfully', 'success');
      navigate('/admin/employee');
    } catch (err) {
      console.error(err);
      showMessage('Failed to update employee', 'error');
    }
  };

  const isEngineer = useMemo(
    () => (initialValues?.role || '').toLowerCase() === 'engineer',
    [initialValues?.role]
  );

  if (loading || !initialValues) {
    return <div>Loading...</div>;
  }

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
          <Link to="#">Edit Employee</Link>
        </li>
      </ol>

      <Formik<FormValues>
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={handleSubmit}
      >
        {({ errors, values, submitCount, setFieldValue }) => (
          <Form className="space-y-5">
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Employee Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Status */}
                <div className={submitCount > 0 ? (errors.status ? 'has-error' : 'has-success') : ''}>
                  <label htmlFor="status">Status</label>
                  <Field as="select" name="status" className="form-select">
                    <option value="" disabled>
                      Open this select menu
                    </option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Field>
                  {submitCount > 0 && errors.status && (
                    <div className="text-danger mt-1">{String(errors.status)}</div>
                  )}
                </div>

                {/* Name */}
                <div className={submitCount > 0 ? (errors.name ? 'has-error' : 'has-success') : ''}>
                  <label htmlFor="name">Name</label>
                  <Field name="name" type="text" className="form-input" placeholder="Enter Name" />
                  {submitCount > 0 && errors.name && (
                    <div className="text-danger mt-1">{String(errors.name)}</div>
                  )}
                </div>

                {/* Email */}
                <div className={submitCount > 0 ? (errors.email ? 'has-error' : 'has-success') : ''}>
                  <label htmlFor="email">Email</label>
                  <Field name="email" type="email" className="form-input" placeholder="Enter Email" />
                  {submitCount > 0 && errors.email && (
                    <div className="text-danger mt-1">{String(errors.email)}</div>
                  )}
                </div>

                {/* Phone */}
                <div className={submitCount > 0 ? (errors.phone ? 'has-error' : 'has-success') : ''}>
                  <label htmlFor="phone">Phone</label>
                  <Field
                    name="phone"
                    type="tel"
                    className="form-input"
                    placeholder="Enter Phone Number"
                    maxLength={10}
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 10);
                    }}
                  />
                  {submitCount > 0 && errors.phone && (
                    <div className="text-danger mt-1">{String(errors.phone)}</div>
                  )}
                </div>

                {/* Emp ID */}
                <div className={submitCount > 0 ? (errors.empId ? 'has-error' : 'has-success') : ''}>
                  <label htmlFor="empId">Employee ID</label>
                  <Field name="empId" type="text" className="form-input" placeholder="Enter Emp ID" />
                  {submitCount > 0 && errors.empId && (
                    <div className="text-danger mt-1">{String(errors.empId)}</div>
                  )}
                </div>

                {/* Role */}
                <div className={submitCount > 0 ? (errors.role ? 'has-error' : 'has-success') : ''}>
                  <label htmlFor="role">Role</label>
                  <Field
                    as="select"
                    name="role"
                    className="form-select"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const nextRole = e.target.value as FormValues['role'];
                      setFieldValue('role', nextRole);
                      if ((nextRole || '').toLowerCase() !== 'engineer') {
                        // clear tools if switching away from engineer
                        setFieldValue('tools', []);
                        setFieldValue('issueDates', {});
                      }
                    }}
                  >
                    <option value="" disabled>
                      Open this select menu
                    </option>
                    <option value="office staff">Office Staff</option>
                    <option value="engineer">Engineer</option>
                  </Field>
                  {submitCount > 0 && errors.role && (
                    <div className="text-danger mt-1">{String(errors.role)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Tools (only for Engineer) */}
            {(values.role || '').toLowerCase() === 'engineer' && (
              <div className="panel">
                <h5 className="font-semibold text-lg mb-4">Assigned Tools</h5>
                <div className="space-y-4 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded">
                  {toolsList.map((tool) => {
                    const isSelected = values.tools.includes(tool.id);
                    // TS-safe way to read nested error
                    const issueDatesError =
                      (errors.issueDates as unknown as Record<string, string> | undefined)?.[tool.id];

                    return (
                      <div key={tool.id} className="border-b pb-2">
                        <label className="flex items-center space-x-2">
                          <Field
                            type="checkbox"
                            name="tools"
                            value={tool.id}
                            className="form-checkbox h-5 w-5 text-primary"
                          />
                          <span>
                            {tool.name} ({tool.id})
                          </span>
                        </label>

                        {isSelected && (
                          <div className="mt-2 ml-6">
                            <label htmlFor={`issueDates.${tool.id}`} className="block text-sm">
                              Issue Date for {tool.id}
                            </label>
                            <Field name={`issueDates.${tool.id}`} type="date" className="form-input" />
                            {submitCount > 0 && issueDatesError && (
                              <div className="text-danger text-sm mt-1">{String(issueDatesError)}</div>
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
