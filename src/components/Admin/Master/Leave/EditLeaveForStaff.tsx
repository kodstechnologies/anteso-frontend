import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import { showMessage } from '../../../common/ShowMessage';
import { getStaffLeaveById, editStaffLeaveById } from '../../../../api/index';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  id: string;
  name?: string;
}

interface LeaveData {
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: string;
  employee: string;
}

const LeaveSchema = Yup.object().shape({
  startDate: Yup.date().required('Start Date is required'),
  endDate: Yup.date()
    .required('End Date is required')
    .min(Yup.ref('startDate'), 'End Date cannot be before Start Date'),
  leaveType: Yup.string().required('Select Leave Type'),
  reason: Yup.string().required('Please enter a reason'),
  status: Yup.string().required('Please select status'),
});

const getEmployeeIdFromToken = (): string | null => {
  const token = Cookies.get('accessToken');
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.id;
  } catch (err) {
    console.error('Invalid token', err);
    return null;
  }
};

const EditLeave = () => {
  const navigate = useNavigate();
  const { id: leaveId } = useParams<{ id: string }>();
  const [initialValues, setInitialValues] = useState<LeaveData>({
    startDate: '',
    endDate: '',
    leaveType: '',
    reason: '',
    status: '',
    employee: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeave = async () => {
      const staffId = getEmployeeIdFromToken();
      if (!staffId) {
        showMessage('User not authenticated', 'error');
        navigate('/admin/leave');
        return;
      }

      try {
        const res = await getStaffLeaveById(staffId, leaveId!);
        // Access the actual leave object correctly
        const leave = res?.data?.data; // <-- fix here

        if (!leave) {
          showMessage('Leave not found', 'error');
          navigate('/admin/leave');
          return;
        }

        setInitialValues({
          startDate: leave.startDate ? leave.startDate.slice(0, 10) : '',
          endDate: leave.endDate ? leave.endDate.slice(0, 10) : '',
          leaveType: leave.leaveType || '',
          reason: leave.reason || '',
          status: leave.status || '',
          employee: staffId,
        });
      } catch (err: any) {
        showMessage(err.message || 'Failed to fetch leave', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchLeave();
  }, [leaveId, navigate]);


  const handleSubmit = async (
    values: LeaveData,
    { setSubmitting }: FormikHelpers<LeaveData>
  ) => {
    const staffId = getEmployeeIdFromToken();
    if (!staffId) {
      showMessage('User not authenticated', 'error');
      navigate('/admin/leave');
      return;
    }

    try {
      await editStaffLeaveById(staffId, leaveId!, values); // Pass updated values
      showMessage('Leave updated successfully', 'success');
      navigate('/admin/staff-leave/all');
    } catch (err: any) {
      showMessage(err.message || 'Failed to update leave', 'error');
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) return <div className="text-gray-600 p-6">Loading...</div>;

  return (
    <div>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={LeaveSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, submitCount, values }) => (
          <Form className="space-y-5">
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Edit Leave</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Start Date */}
                <div className={submitCount && errors.startDate ? 'has-error' : ''}>
                  <label htmlFor="startDate">Start Date</label>
                  <Field type="date" name="startDate" className="form-input" />
                  {errors.startDate && <div className="text-danger mt-1">{errors.startDate}</div>}
                </div>

                {/* End Date */}
                <div className={submitCount && errors.endDate ? 'has-error' : ''}>
                  <label htmlFor="endDate">End Date</label>
                  <Field
                    type="date"
                    name="endDate"
                    className="form-input"
                    min={values.startDate || ''}
                  />
                  {errors.endDate && <div className="text-danger mt-1">{errors.endDate}</div>}
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
                  {errors.leaveType && <div className="text-danger mt-1">{errors.leaveType}</div>}
                </div>

                {/* Reason */}
                <div className={submitCount && errors.reason ? 'has-error' : ''}>
                  <label htmlFor="reason">Reason</label>
                  <Field as="textarea" name="reason" rows={3} className="form-input" />
                  {errors.reason && <div className="text-danger mt-1">{errors.reason}</div>}
                </div>

                {/* Status */}
                {/* Status */}
                <div className={submitCount && errors.status ? 'has-error' : ''}>
                  <label htmlFor="status">Status</label>
                  <Field
                    as="select"
                    name="status"
                    className="form-select"
                    disabled // <-- disable editing
                  >
                    <option value="">Select status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </Field>
                  {errors.status && <div className="text-danger mt-1">{errors.status}</div>}
                </div>

              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn btn-success mt-4">
                Update Leave
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditLeave;
