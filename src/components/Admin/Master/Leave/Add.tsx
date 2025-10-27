import * as Yup from 'yup';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { addLeave, getAllEmployees } from '../../../../api';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const leaveSchema = Yup.object().shape({
  employee: Yup.string().required('Please select an employee'),
  startDate: Yup.date().required('Start Date is required'),
  endDate: Yup.date()
    .required('End Date is required')
    .min(Yup.ref('startDate'), 'End Date cannot be before Start Date'),
  leaveType: Yup.string().required('Select Leave Type'),
  reason: Yup.string().required('Please enter a reason'),
});

const Add = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch all employees on page load
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await getAllEmployees();
        console.log("✅ Employees fetched:", res);
        if (res?.data) {
          setEmployees(res.data);
        } else {
          setEmployees([]);
        }
      } catch (error: any) {
        console.error("❌ Failed to fetch employees:", error);
        showMessage(error.message || "Failed to load employees", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // 🔹 Handle form submission
  const submitLeaveForm = async (
    values: {
      employee: string;
      startDate: string;
      endDate: string;
      leaveType: string;
      reason: string;
    },
    { resetForm }: FormikHelpers<{
      employee: string;
      startDate: string;
      endDate: string;
      leaveType: string;
      reason: string;
    }>
  ) => {
    try {
      await addLeave(values);
      showMessage('Leave Submitted Successfully', 'success');
      resetForm();
      navigate('/admin/leave');
    } catch (error: any) {
      showMessage(error.message || 'Failed to submit leave', 'error');
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
        <li>
          <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Dashboard
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="/admin/leave" className="text-primary">
            Leave
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Add Leave
          </Link>
        </li>
      </ol>

      <Formik
        initialValues={{
          employee: '',
          startDate: '',
          endDate: '',
          leaveType: '',
          reason: '',
        }}
        validationSchema={leaveSchema}
        onSubmit={submitLeaveForm}
      >
        {({ errors, submitCount, values }) => (
          <Form className="space-y-5">
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Leave Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* 🔹 Employee Dropdown */}
                <div className={submitCount && errors.employee ? 'has-error' : ''}>
                  <label htmlFor="employee">Employee</label>
                  <Field as="select" name="employee" className="form-select">
                    <option value="">Select Employee</option>
                    {loading ? (
                      <option disabled>Loading employees...</option>
                    ) : employees.length > 0 ? (
                      employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.technicianType || 'No Designation'})
                        </option>
                      ))
                    ) : (
                      <option disabled>No employees available</option>
                    )}
                  </Field>
                  {errors.employee && (
                    <div className="text-danger">{errors.employee}</div>
                  )}
                </div>

                {/* Start Date */}
                {/* <div className={submitCount && errors.startDate ? 'has-error' : ''}>
                  <label htmlFor="startDate">Start Date</label>
                  <Field name="startDate" type="date" className="form-input" />
                  {errors.startDate && (
                    <div className="text-danger">{errors.startDate}</div>
                  )}
                </div> */}

                {/* End Date */}
                {/* <div className={submitCount && errors.endDate ? 'has-error' : ''}>
                  <label htmlFor="endDate">End Date</label>
                  <Field
                    name="endDate"
                    type="date"
                    className="form-input"
                    min={values.startDate || ""} // restrict calendar
                  />
                  {errors.endDate && (
                    <div className="text-danger">{errors.endDate}</div>
                  )}
                </div> */}

                {/* Start Date */}
                <div className={submitCount && errors.startDate ? 'has-error' : ''}>
                  <label htmlFor="startDate">Start Date</label>
                  <Field
                    name="startDate"
                    type="date"
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]} // ⛔ Disable past dates
                  />
                  {errors.startDate && (
                    <div className="text-danger">{errors.startDate}</div>
                  )}
                </div>

                {/* End Date */}
                <div className={submitCount && errors.endDate ? 'has-error' : ''}>
                  <label htmlFor="endDate">End Date</label>
                  <Field
                    name="endDate"
                    type="date"
                    className="form-input"
                    min={values.startDate || new Date().toISOString().split('T')[0]} // ⛔ Disable past & ensure after startDate
                  />
                  {errors.endDate && (
                    <div className="text-danger">{errors.endDate}</div>
                  )}
                </div>


                {/* Leave Type */}
                <div className={submitCount && errors.leaveType ? 'has-error' : ''}>
                  <label htmlFor="leaveType">Leave Type</label>
                  <Field as="select" name="leaveType" className="form-select">
                    <option value="">Select</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Maternity/Paternity">Maternity/Paternity</option>
                    <option value="Leave without pay">Leave without pay</option>
                    <option value="Leave with pay">Leave with pay</option>
                  </Field>
                  {errors.leaveType && (
                    <div className="text-danger">{errors.leaveType}</div>
                  )}
                </div>

                {/* Reason */}
                <div className={submitCount && errors.reason ? 'has-error' : ''}>
                  <label htmlFor="reason">Reason</label>
                  <Field name="reason" as="textarea" className="form-input" rows={3} />
                  {errors.reason && (
                    <div className="text-danger">{errors.reason}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn btn-success mt-4">
                Submit
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Add;
