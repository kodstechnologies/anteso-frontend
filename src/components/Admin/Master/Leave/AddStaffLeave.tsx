import * as Yup from 'yup';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import { useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { addLeave } from '../../../../api';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  id: string;
  name?: string;
  // add other fields stored in the token if needed
}

const leaveSchema = Yup.object().shape({
  startDate: Yup.date().required('Start Date is required'),
  endDate: Yup.date()
    .required('End Date is required')
    .min(Yup.ref('startDate'), 'End Date cannot be before Start Date'),
  leaveType: Yup.string().required('Select Leave Type'),
  reason: Yup.string().required('Please enter a reason'),
});

const getEmployeeIdFromToken = (): string | null => {
  const token = Cookies.get('accessToken'); // make sure this matches your backend cookie key
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    console.log("🚀 ~ getEmployeeIdFromToken ~ decoded:", decoded)
    console.log("🚀 ~ getEmployeeIdFromToken ~ decoded._id:", decoded.id)
    return decoded.id;
  } catch (err) {
    console.error('Invalid token', err);
    return null;
  }
};

const Add = () => {
  const navigate = useNavigate();

  const submitLeaveForm = async (
    values: {
      startDate: string;
      endDate: string;
      leaveType: string;
      reason: string;
    },
    { resetForm }: FormikHelpers<{
      startDate: string;
      endDate: string;
      leaveType: string;
      reason: string;
    }>
  ) => {
    const employeeId = getEmployeeIdFromToken();
    console.log("🚀 ~ submitLeaveForm ~ employeeId:", employeeId)
    if (!employeeId) {
      showMessage('User not authenticated', 'error');
      return;
    }

    try {
      const payload = { ...values, employee: employeeId };
      await addLeave(payload);
      showMessage('Leave Submitted Successfully', 'success');
      resetForm();
      navigate('/admin/staff-leave/all');
    } catch (error: any) {
      showMessage(error.message || 'Failed to submit leave', 'error');
    }
  };

  return (
    <div>
      <Formik
        initialValues={{
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
                {/* Start Date */}
                <div className={submitCount && errors.startDate ? 'has-error' : ''}>
                  <label htmlFor="startDate">Start Date</label>
                  <Field
                    name="startDate"
                    type="date"
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]} // disables past dates
                  />
                  {errors.startDate && <div className="text-danger">{errors.startDate}</div>}
                </div>


                {/* End Date */}
                <div className={submitCount && errors.endDate ? 'has-error' : ''}>
                  <label htmlFor="endDate">End Date</label>
                  <Field
                    name="endDate"
                    type="date"
                    className="form-input"
                    min={values.startDate || ""}
                  />
                  {errors.endDate && <div className="text-danger">{errors.endDate}</div>}
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
                  {errors.leaveType && <div className="text-danger">{errors.leaveType}</div>}
                </div>

                {/* Reason */}
                <div className={submitCount && errors.reason ? 'has-error' : ''}>
                  <label htmlFor="reason">Reason</label>
                  <Field name="reason" as="textarea" className="form-input" rows={3} />
                  {errors.reason && <div className="text-danger">{errors.reason}</div>}
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
