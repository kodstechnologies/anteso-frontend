import React, { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { getLeaveById, getAllEmployees, editLeaveById } from '../../../../api/index';

interface Employee {
    _id: string;
    name: string;
    technicianType: string;
}

interface LeaveData {
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    status: string;
    employee: string;
}

const EditLeave = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [initialValues, setInitialValues] = useState<LeaveData>({
        startDate: '',
        endDate: '',
        leaveType: '',
        reason: '',
        status: '',
        employee: '',
    });
    const [loading, setLoading] = useState(true);

    const LeaveSchema = Yup.object().shape({
        employee: Yup.string().required('Employee is required'),
        startDate: Yup.date().required('Start date is required'),
        endDate: Yup.date()
            .min(Yup.ref('startDate'), 'End date can’t be before start date')
            .required('End date is required'),
        leaveType: Yup.string().required('Leave type is required'),
        reason: Yup.string().required('Reason is required'),
        status: Yup.string().required('Status is required'),
    });

    // 🔹 Fetch employees & leave data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empRes, leaveRes] = await Promise.all([
                    getAllEmployees(),
                    getLeaveById(id!),
                ]);
                setEmployees(empRes?.data || empRes || []);
                const leave = leaveRes?.data || leaveRes;
                setInitialValues({
                    employee: leave.employee?._id || '',
                    startDate: leave.startDate ? leave.startDate.slice(0, 10) : '',
                    endDate: leave.endDate ? leave.endDate.slice(0, 10) : '',
                    leaveType: leave.leaveType || '',
                    reason: leave.reason || '',
                    status: leave.status || '',
                });
            } catch (err: any) {
                showMessage(err.message || 'Failed to fetch data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (values: LeaveData) => {
        try {
            await editLeaveById(id!, values);
            showMessage('Leave updated successfully', 'success');
            navigate('/admin/leave');
        } catch (error: any) {
            showMessage(error.message || 'Failed to update leave', 'error');
        }
    };

    if (loading) return <div className="text-gray-600 p-6">Loading...</div>;

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
                    <Link to="/admin/leave" className="text-primary">
                        Leave
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Leave
                    </Link>
                </li>
            </ol>

            {/* Form */}
            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={LeaveSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, submitCount, values }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Edit Leave Details</h5>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Employee */}
                                <div className={submitCount && errors.employee ? 'has-error' : ''}>
                                    <label htmlFor="employee">Employee</label>
                                    <Field as="select" name="employee" className="form-select">
                                        <option value="">Select Employee</option>
                                        {employees.map((emp) => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} ({emp.technicianType})
                                            </option>
                                        ))}
                                    </Field>
                                    {errors.employee && (
                                        <div className="text-danger mt-1">{errors.employee}</div>
                                    )}
                                </div>

                                {/* Leave Type */}
                                <div className={submitCount && errors.leaveType ? 'has-error' : ''}>
                                    <label htmlFor="leaveType">Leave Type</label>
                                    <Field as="select" name="leaveType" className="form-select">
                                        <option value="">Select leave type</option>
                                        <option value="Sick Leave">Sick Leave</option>
                                        <option value="Casual Leave">Casual Leave</option>
                                        <option value="Maternity/Paternity">Maternity/Paternity</option>
                                        <option value="Leave without pay">Leave without pay</option>
                                        <option value="Leave with pay">Leave with pay</option>
                                    </Field>
                                    {errors.leaveType && (
                                        <div className="text-danger mt-1">{errors.leaveType}</div>
                                    )}
                                </div>

                                {/* Start Date */}
                                {/* <div className={submitCount && errors.startDate ? 'has-error' : ''}>
                                    <label htmlFor="startDate">Start Date</label>
                                    <Field type="date" name="startDate" className="form-input" />
                                    {errors.startDate && (
                                        <div className="text-danger mt-1">{errors.startDate}</div>
                                    )}
                                </div> */}

                                {/* End Date */}
                                {/* <div className={submitCount && errors.endDate ? 'has-error' : ''}>
                                    <label htmlFor="endDate">End Date</label>
                                    <Field type="date" name="endDate" className="form-input" />
                                    {errors.endDate && (
                                        <div className="text-danger mt-1">{errors.endDate}</div>
                                    )}
                                </div> */}
                                {/* Start Date */}
                                <div className={submitCount && errors.startDate ? 'has-error' : ''}>
                                    <label htmlFor="startDate">Start Date</label>
                                    <Field
                                        type="date"
                                        name="startDate"
                                        className="form-input"
                                        min={new Date().toISOString().split('T')[0]} // ⛔ Disable past dates
                                    />
                                    {errors.startDate && (
                                        <div className="text-danger mt-1">{errors.startDate}</div>
                                    )}
                                </div>

                                {/* End Date */}
                                <div className={submitCount && errors.endDate ? 'has-error' : ''}>
                                    <label htmlFor="endDate">End Date</label>
                                    <Field
                                        type="date"
                                        name="endDate"
                                        className="form-input"
                                        min={
                                            values.startDate
                                                ? values.startDate // ⛔ cannot be before start date
                                                : new Date().toISOString().split('T')[0] // ⛔ cannot be past date
                                        }
                                    />
                                    {errors.endDate && (
                                        <div className="text-danger mt-1">{errors.endDate}</div>
                                    )}
                                </div>


                                {/* Reason */}
                                <div className={submitCount && errors.reason ? 'has-error' : ''}>
                                    <label htmlFor="reason">Reason</label>
                                    <Field
                                        as="textarea"
                                        name="reason"
                                        className="form-input"
                                        rows={3}
                                        placeholder="Enter reason for leave"
                                    />
                                    {errors.reason && (
                                        <div className="text-danger mt-1">{errors.reason}</div>
                                    )}
                                </div>

                                {/* Status */}
                                <div className={submitCount && errors.status ? 'has-error' : ''}>
                                    <label htmlFor="status">Status</label>
                                    <Field as="select" name="status" className="form-select">
                                        <option value="">Select status</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                    </Field>
                                    {errors.status && (
                                        <div className="text-danger mt-1">{errors.status}</div>
                                    )}
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
        </>
    );
};

export default EditLeave;
