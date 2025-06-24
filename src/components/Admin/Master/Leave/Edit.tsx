import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { leaveData } from '../../../../data';
import { isValid, parse } from 'date-fns';
const EditLeave = () => {
    const navigate = useNavigate();

    const LeaveSchema = Yup.object().shape({
        startDate: Yup.date()
            .transform((value, originalValue) => {
                const parsedDate = parse(originalValue, 'dd/MM/yyyy', new Date());
                return isValid(parsedDate) ? parsedDate : new Date('');
            })
            .typeError('Invalid start date format')
            .required('Start date is required'),

        endDate: Yup.date()
            .transform((value, originalValue) => {
                const parsedDate = parse(originalValue, 'dd/MM/yyyy', new Date());
                return isValid(parsedDate) ? parsedDate : new Date('');
            })
            .typeError('Invalid end date format')
            .min(
                Yup.ref('startDate'),
                'End date can’t be before start date'
            )
            .required('End date is required'),

        leaveType: Yup.string().required('Leave type is required'),
        reason: Yup.string().required('Reason is required'),
        status: Yup.object({
            tooltip: Yup.string().required('Status tooltip is required'),
            color: Yup.string().required('Status color is required'),
        }).required('Status is required'),
    });

    const handleSubmit = () => {
        showMessage('Leave updated successfully', 'success');
        navigate('/admin/leave');
    };

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">Dashboard</Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/leaves" className="text-primary">Leaves</Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">Edit Leave</Link>
                </li>
            </ol>

            <Formik
                initialValues={{
                    leaveType: leaveData[0].leaveType,
                    startDate: leaveData[0].startDate,
                    endDate: leaveData[0].endDate,
                    reason: leaveData[0].reason,
                    status: leaveData[0].status,
                }}
                validationSchema={LeaveSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, submitCount }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Leave Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount ? (errors.leaveType ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="leaveType">Leave Type</label>
                                    <Field as="select" name="leaveType" className="form-select">
                                        <option value="" disabled>Select leave type</option>
                                        <option value="Sick Leave">Sick Leave</option>
                                        <option value="Casual Leave">Vacation</option>
                                        <option value="Earned Leave">Personal Leave</option>
                                        <option value="Earned Leave">Maternity/Paternity</option>
                                        <option value="Earned Leave">Bereavement Leave</option>
                                    </Field>
                                    {errors.leaveType && <div className="text-danger mt-1">{errors.leaveType}</div>}
                                </div>

                                <div className={submitCount ? (errors.startDate ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="startDate">Start Date</label>
                                    <Field type="date" name="startDate" className="form-input" />
                                    {errors.startDate && <div className="text-danger mt-1">{errors.startDate}</div>}
                                </div>

                                <div className={submitCount ? (errors.endDate ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="endDate">End Date</label>
                                    <Field type="date" name="endDate" className="form-input" />
                                    {errors.endDate && <div className="text-danger mt-1">{errors.endDate}</div>}
                                </div>

                                <div className={submitCount ? (errors.reason ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="reason">Reason</label>
                                    <Field as="textarea" name="reason" className="form-input" placeholder="Enter reason for leave" />
                                    {errors.reason && <div className="text-danger mt-1">{errors.reason}</div>}
                                </div>

                                <div className={submitCount ? (errors.status ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="status">Status</label>
                                    <Field as="select" name="status" className="form-select">
                                        <option value="" disabled>Select status</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                    </Field>
                                    {errors.status && <div className="text-danger mt-1">{errors.status}</div>}
                                </div>
                            </div>
                        </div>

                        <div className="w-full mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success !mt-6">Submit Form</button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default EditLeave;
