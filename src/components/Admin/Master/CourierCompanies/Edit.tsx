import React, { useEffect, useState } from 'react';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { getCourierById, editCourier } from '../../../../api/index'; // Adjust the path if needed

const EditCourierCompanie = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [initialValues, setInitialValues] = useState({
        companyName: '',
        status: '',
    });
    const [loading, setLoading] = useState(true);

    const validationSchema = Yup.object().shape({
        status: Yup.string().required('Please select a status'),
        companyName: Yup.string().required('Please enter the company name'),
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (id) {
                    const res = await getCourierById(id);
                    const company = res?.data;
                    setInitialValues({
                        companyName: company.courierCompanyName,
                        status: company.status,
                    });
                }
            } catch (error) {
                showMessage('Failed to fetch company data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const submitForm = async (values: any) => {
        try {
            if (id) {
                await editCourier(id, {
                    courierCompanyName: values.companyName,
                    status: values.status,
                });
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

            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={submitForm}
            >
                {({ errors, touched }) => (
                    <Form className="space-y-5">
                        {/* Status Field */}
                        <div className={touched.status && errors.status ? 'has-error' : ''}>
                            <label htmlFor="status">Status</label>
                            <Field as="select" name="status" className="form-select">
                                <option value="" disabled>
                                    Select Status
                                </option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </Field>
                            {touched.status && errors.status && <div className="text-danger mt-1">{errors.status}</div>}
                        </div>

                        {/* Company Name Field */}
                        <div className={touched.companyName && errors.companyName ? 'has-error' : ''}>
                            <label htmlFor="companyName">Company Name</label>
                            <Field
                                name="companyName"
                                type="text"
                                id="companyName"
                                placeholder="Enter Company Name"
                                className="form-input"
                            />
                            {touched.companyName && errors.companyName && (
                                <div className="text-danger mt-1">{errors.companyName}</div>
                            )}
                        </div>

                        <div className="w-full mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success !mt-6">
                                Submit
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default EditCourierCompanie;
