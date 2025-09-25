import * as Yup from 'yup';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { addLeave } from '../../../../api/index'; // 👈 import your API call
import Cookies from 'js-cookie'; // in case needed for side effects

const leaveSchema = Yup.object().shape({
  startDate: Yup.date()
    .required('Start Date is required'),
  endDate: Yup.date()
    .required('End Date is required')
    .min(
      Yup.ref('startDate'),
      'End Date cannot be before Start Date'
    ),
  leaveType: Yup.string().required('Select Leave Type'),
  reason: Yup.string().required('Please enter a reason'),
});


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
    try {
      await addLeave(values); // 👈 API call
      showMessage('Leave Submitted Successfully', 'success');
      resetForm();
      navigate('/admin/leave');
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  return (
    <div>
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
          startDate: '',
          endDate: '',
          leaveType: '',
          reason: '',
        }}
        validationSchema={leaveSchema}
        onSubmit={submitLeaveForm}
      >
        {({ errors, touched, submitCount }) => (
          <Form className="space-y-5">
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Leave Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className={submitCount && errors.startDate ? 'has-error' : ''}>
                  <label htmlFor="startDate">Start Date</label>
                  <Field name="startDate" type="date" className="form-input" />
                  {errors.startDate && <div className="text-danger">{errors.startDate}</div>}
                </div>

                <div className={submitCount && errors.endDate ? 'has-error' : ''}>
                  <label htmlFor="endDate">End Date</label>
                  <Field name="endDate" type="date" className="form-input" />
                  {errors.endDate && <div className="text-danger">{errors.endDate}</div>}
                </div>

                <div className={submitCount && errors.leaveType ? 'has-error' : ''}>
                  <label htmlFor="leaveType">Leave Type</label>
                  <Field as="select" name="leaveType" className="form-select">
                    <option value="">Select</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Vacation</option>
                    <option value="Personal Leave">Personal Leave</option>
                    <option value="Maternity/Paternity">Maternity/Paternity</option>
                    <option value="Bereavement Leave">Bereavement Leave</option>
                  </Field>
                  {errors.leaveType && <div className="text-danger">{errors.leaveType}</div>}
                </div>

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
