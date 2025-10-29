// src/pages/admin/employee/EditEngineer.tsx
import * as Yup from 'yup';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { showMessage } from '../../../common/ShowMessage';
import {
  getEmployeeById,
  editEmployee,
  getUnassignedTools,
} from '../../../../api';

type RoleValue = 'office staff' | 'engineer';
type StatusValue = 'active' | 'inactive';

type ToolOption = { id: string; name: string; code: string };

type ApiTool = {
  toolId: string;
  issueDate?: string;
};

type EmployeeApi = {
  _id: string;
  name: string;
  email: string;
  phone: string | number;
  technicianType: RoleValue | string;
  status: StatusValue | string;
  tools?: ApiTool[];
  designation?: string;
  workingDays?: number;
  dateOfJoining?: string;
  department?: string;

  // ---------- NEW ----------
  doc1?: string;
  doc2?: string;
  doc3?: string;
};

type FormValues = {
  name: string;
  email: string;
  phone: string;
  role: RoleValue | 'Engineer' | 'Office Staff';
  tools: string[];
  issueDates: Record<string, string>;
  status: StatusValue | 'Active' | 'Inactive';
  designation: string;
  workingDays: number | '';
  dateOfJoining: string;
  department: string;

  // ---------- NEW ----------
  doc1?: File | string | null;
  doc2?: File | string | null;
  doc3?: File | string | null;
};

const schema = Yup.object({
  name: Yup.string().required('Please fill the Field'),
  email: Yup.string().email('Invalid email').required('Please fill the Email'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
    .required('Please fill the Field'),
  role: Yup.string().required('Please fill the Field'),
  tools: Yup.array()
    .of(Yup.string())
    .when('role', {
      is: (val: string) => (val || '').toLowerCase() === 'engineer',
      then: (s) => s.min(1, 'Please select at least one tool'),
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
  }),
  status: Yup.string().required('Please fill the Field'),
  designation: Yup.string().required('Please fill the Designation'),
  workingDays: Yup.number().required('Please fill Working Days').min(0),
  dateOfJoining: Yup.string().required('Please fill Date of Joining'),
  department: Yup.string().required('Please fill the Department'),
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
  const [toolsList, setToolsList] = useState<ToolOption[]>([]);

  // --------------------------------------------------------------
  // 1. FETCH EMPLOYEE + TOOLS
  // --------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const empRes = await getEmployeeById(id);
        const emp = empRes.data as EmployeeApi;
        console.log("🚀 ~ fetchData ~ emp:", empRes.data)

        // ---- assigned tools (populated) ----
        const assignedTools: ToolOption[] = (emp.tools || [])
          .filter((t: any) => t?.toolId?._id)
          .map((t: any) => ({
            id: t.toolId._id,
            code: t.toolId.toolId,
            name: t.toolId.nomenclature,
          }));

        // ---- unassigned tools ----
        const unassignedRes = await getUnassignedTools();
        const unassignedTools: ToolOption[] = (unassignedRes?.data || []).map(
          (t: any) => ({
            id: t._id,
            code: t.toolId,
            name: t.nomenclature,
          })
        );

        // ---- merge (no duplicates) ----
        const mergedTools = [
          ...assignedTools,
          ...unassignedTools.filter(
            (u) => !assignedTools.some((a) => a.id === u.id)
          ),
        ];
        setToolsList(mergedTools);

        // ---- selected tools + issue dates ----
        const tools = (emp.tools || [])
          .filter((t: any) => t?.toolId?._id)
          .map((t: any) => t.toolId._id);

        const issueDates = (emp.tools || []).reduce<Record<string, string>>(
          (acc, t: any) => {
            if (t?.toolId?._id) {
              acc[t.toolId._id] = t.issueDate
                ? t.issueDate.split('T')[0]
                : '';
            }
            return acc;
          },
          {}
        );

        // ---- Formik initial values (WITH ORIGINAL DOC URLs) ----
        setInitialValues({
          name: emp.name || '',
          email: emp.email || '',
          phone: String(emp.phone ?? ''),
          role: normalizeRole(emp.technicianType),
          tools,
          issueDates,
          status: normalizeStatus(emp.status),

          designation: emp.designation || '',
          workingDays: emp.workingDays ?? '',
          dateOfJoining: emp.dateOfJoining
            ? emp.dateOfJoining.split('T')[0]
            : '',
          department: emp.department || '',

          // Store original URLs directly
          doc1: emp.doc1 ?? null,
          doc2: emp.doc2 ?? null,
          doc3: emp.doc3 ?? null,
        });
      } catch (err) {
        console.error('fetchData error:', err);
        showMessage('Failed to load employee data', 'error');
        navigate('/admin/employee');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // --------------------------------------------------------------
  // 2. SUBMIT HANDLER
  // --------------------------------------------------------------
  const handleSubmit = async (
    values: FormValues,
    _helpers: FormikHelpers<FormValues>
  ) => {
    try {
      const technicianType: RoleValue = normalizeRole(values.role as string);
      const status: StatusValue = normalizeStatus(values.status as string);

      const payload: Record<string, any> = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        technicianType,
        status,
        designation: values.designation,
        workingDays: Number(values.workingDays),
        dateOfJoining: values.dateOfJoining,
        department: values.department,
        tools:
          technicianType === 'engineer'
            ? values.tools.map((toolId) => ({
              toolId,
              issueDate: values.issueDates?.[toolId] || null,
            }))
            : [],
      };

      // Only send new files
      if (values.doc1 instanceof File) payload.doc1 = values.doc1;
      if (values.doc2 instanceof File) payload.doc2 = values.doc2;
      if (values.doc3 instanceof File) payload.doc3 = values.doc3;

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
    return <div className="text-center py-10">Loading...</div>;
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
        {({ errors, values, submitCount, setFieldValue, initialValues: initVals }) => (
          <Form className="space-y-5">
            {/* ---------- EMPLOYEE DETAILS ---------- */}
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Employee Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Status */}
                <div className={submitCount > 0 ? (errors.status ? 'has-error' : ' мног-success') : ''}>
                  <label htmlFor="status">Status</label>
                  <Field as="select" name="status" className="form-select">
                    <option value="" disabled>Open this select menu</option>
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
                        setFieldValue('tools', []);
                        setFieldValue('issueDates', {});
                      }
                    }}
                  >
                    <option value="" disabled>Open this select menu</option>
                    <option value="office staff">Office Staff</option>
                    <option value="engineer">Engineer</option>
                  </Field>
                  {submitCount > 0 && errors.role && (
                    <div className="text-danger mt-1">{String(errors.role)}</div>
                  )}
                </div>

                {/* Designation */}
                <div className={submitCount > 0 ? (errors.designation ? 'has-error' : 'has-success') : ''}>
                  <label htmlFor="designation">Designation</label>
                  <Field name="designation" type="text" className="form-input" placeholder="Enter Designation" />
                  {submitCount > 0 && errors.designation && (
                    <div className="text-danger mt-1">{String(errors.designation)}</div>
                  )}
                </div>

                {/* Working Days */}
                <div className={submitCount > 0 ? (errors.workingDays ? 'has-error' : 'has-success') : ''}>
                  <label htmlFor="workingDays">Working Days</label>
                  <Field name="workingDays" type="number" className="form-input" placeholder="Enter Working Days" min={0} />
                  {submitCount > 0 && errors.workingDays && (
                    <div className="text-danger mt-1">{String(errors.workingDays)}</div>
                  )}
                </div>

                {/* Date of Joining */}
                <div className={submitCount > 0 ? (errors.dateOfJoining ? 'has-error' : 'has-success') : ''}>
                  <label htmlFor="dateOfJoining">Date of Joining</label>
                  <Field name="dateOfJoining" type="date" className="form-input" />
                  {submitCount > 0 && errors.dateOfJoining && (
                    <div className="text-danger mt-1">{String(errors.dateOfJoining)}</div>
                  )}
                </div>

                {/* Department */}
                <div className={submitCount > 0 ? (errors.department ? 'has-error' : 'has-success') : ''}>
                  <label htmlFor="department">Department</label>
                  <Field name="department" type="text" className="form-input" placeholder="Enter Department" />
                  {submitCount > 0 && errors.department && (
                    <div className="text-danger mt-1">{String(errors.department)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* ---------- DOCUMENT UPLOADS ---------- */}

            {/* ---------- TOOLS (Engineer only) ---------- */}
            {(values.role || '').toLowerCase() === 'engineer' && (
              <div className="panel">
                <h5 className="font-semibold text-lg mb-4">Assigned Tools</h5>
                <div className="space-y-4 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded">
                  {toolsList.length > 0 ? (
                    toolsList.map((tool) => {
                      const isSelected = values.tools.includes(tool.id);
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
                              {tool.name} ({tool.code}) {isSelected ? (
                                <span className="text-green-500 text-sm">(Assigned)</span>
                              ) : (
                                <span className="text-gray-400 text-sm">(Available)</span>
                              )}
                            </span>
                          </label>

                          {isSelected && (
                            <div className="mt-2 ml-6">
                              <label htmlFor={`issueDates.${tool.id}`} className="block text-sm">
                                Issue Date for {tool.code}
                              </label>
                              <Field name={`issueDates.${tool.id}`} type="date" className="form-input" />
                              {submitCount > 0 && issueDatesError && (
                                <div className="text-danger text-sm mt-1">{String(issueDatesError)}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-500 italic">No tools available</div>
                  )}
                </div>
              </div>
            )}
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Documents (optional)</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(['doc1', 'doc2', 'doc3'] as const).map((key) => {
                  const currentUrl = (initVals as any)[key] ?? null; // Original URL from API
                  const currentValue = values[key]; // Current form value: File | string | null

                  // Determine if a new file is selected
                  const isNewFile = currentValue instanceof File;
                  const isExistingUrl = typeof currentUrl === 'string' && currentUrl;

                  // Extract filename
                  let fileName = '';
                  if (isNewFile) {
                    fileName = (currentValue as File).name;
                  } else if (isExistingUrl) {
                    // Extract filename from URL
                    try {
                      fileName = currentUrl.split('/').pop()?.split('?')[0] || key.toUpperCase();
                    } catch {
                      fileName = key.toUpperCase();
                    }
                  }

                  return (
                    <div key={key}>
                      <label className="block mb-1">{key.toUpperCase()}</label>

                      <input
                        type="file"
                        accept="*/*"
                        className="form-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setFieldValue(key, file); // null = keep old URL
                        }}
                      />

                      {fileName && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="truncate max-w-[180px]">{fileName}</span>

                          {/* Show "View" only if original URL exists AND no new file selected */}
                          {isExistingUrl && !isNewFile && (
                            <a
                              href={currentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline text-xs"
                            >
                              View
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---------- SUBMIT ---------- */}
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