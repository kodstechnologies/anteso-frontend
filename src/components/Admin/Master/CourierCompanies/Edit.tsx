import React, { useEffect, useState } from 'react';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { getCourierById, editCourier } from '../../../../api/index';

const EditCourierCompany = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [initialValues, setInitialValues] = useState({
        courierCompanyName: '',
        trackingId: '',
        trackingUrl: '',
        status: 'active',
    });
    const [loading, setLoading] = useState(true);

    const validationSchema = Yup.object().shape({
        courierCompanyName: Yup.string().required('Please enter company name'),
        trackingId: Yup.string(),
        trackingUrl: Yup.string().url('Please enter a valid URL'),
        status: Yup.string().required('Please select a status'),
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (id) {
                    const res = await getCourierById(id);
                    const company = res?.data;
                    setInitialValues({
                        courierCompanyName: company.courierCompanyName || '',
                        trackingId: company.trackingId || '',
                        trackingUrl: company.trackingUrl || '',
                        status: company.status || 'active',
                    });
                }
            } catch (error) {
                showMessage('Failed to fetch courier company data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const submitForm = async (values: any) => {
        try {
            if (id) {
                await editCourier(id, values);
                showMessage('Courier company updated successfully', 'success');
                navigate('/admin/courier-companies');
            }
        } catch (error: any) {
            showMessage(error.message || 'Update failed', 'error');
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/courier-companies" className="text-primary">
                        Courier Companies
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <span>Edit Courier Company</span>
                </li>
            </ol>

            <div className="panel">
                <h2 className="text-xl font-semibold mb-4">Edit Courier Company</h2>

                <Formik
                    enableReinitialize
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={submitForm}
                >
                    {({ errors, touched }) => (
                        <Form className="space-y-4">
                            {/* Company Name */}
                            <div className={touched.courierCompanyName && errors.courierCompanyName ? 'has-error' : ''}>
                                <label htmlFor="courierCompanyName" className="block mb-1 font-medium">
                                    Company Name
                                </label>
                                <Field
                                    type="text"
                                    name="courierCompanyName"
                                    id="courierCompanyName"
                                    placeholder="Enter Company Name"
                                    className="form-input w-full"
                                />
                                {touched.courierCompanyName && errors.courierCompanyName && (
                                    <div className="text-danger mt-1">{errors.courierCompanyName}</div>
                                )}
                            </div>

                            {/* Tracking ID */}
                            <div className={touched.trackingId && errors.trackingId ? 'has-error' : ''}>
                                <label htmlFor="trackingId" className="block mb-1 font-medium">
                                    Tracking ID (optional)
                                </label>
                                <Field
                                    type="text"
                                    name="trackingId"
                                    id="trackingId"
                                    placeholder="Enter Tracking ID"
                                    className="form-input w-full"
                                />
                            </div>

                            {/* Tracking URL */}
                            <div className={touched.trackingUrl && errors.trackingUrl ? 'has-error' : ''}>
                                <label htmlFor="trackingUrl" className="block mb-1 font-medium">
                                    Tracking URL (optional)
                                </label>
                                <Field
                                    type="text"
                                    name="trackingUrl"
                                    id="trackingUrl"
                                    placeholder="Enter Tracking URL"
                                    className="form-input w-full"
                                />
                                {touched.trackingUrl && errors.trackingUrl && (
                                    <div className="text-danger mt-1">{errors.trackingUrl}</div>
                                )}
                            </div>

                            {/* Status */}
                            <div className={touched.status && errors.status ? 'has-error' : ''}>
                                <label htmlFor="status" className="block mb-1 font-medium">
                                    Status
                                </label>
                                <Field as="select" name="status" id="status" className="form-select w-full">
                                    <option value="">Select Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </Field>
                                {touched.status && errors.status && <div className="text-danger mt-1">{errors.status}</div>}
                            </div>

                            <div className="w-full mb-6 flex justify-end">
                                <button type="submit" className="btn btn-primary mt-4">
                                    Update
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </>
    );
};

export default EditCourierCompany;
