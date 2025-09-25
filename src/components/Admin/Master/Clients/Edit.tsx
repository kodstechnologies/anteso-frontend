import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { useEffect, useState } from 'react';
import { getClientById, updateClientById } from '../../../../api';

const SubmittedForm = Yup.object().shape({
    name: Yup.string().required('Please fill the Field'),
    email: Yup.string().email('Invalid email').required('Please fill the Email'),
    address: Yup.string().required('Please fill the Field'),
    phone: Yup.string()
        .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
        .required('Please fill the Field'),
    gstNo: Yup.string().required('Please fill the Field'),
});

const EditClient = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [initialValues, setInitialValues] = useState({
        name: '',
        email: '',
        address: '',
        phone: '',
        gstNo: '',
    });

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const data = await getClientById(id);
                console.log("🚀 ~ fetchClient ~ data:", data)
                setInitialValues({
                    name: data.data.name || '',
                    email: data.data.email || '',
                    address: data.data.address || '',
                    phone: data.data.phone || '',
                    gstNo: data.data.gstNo || '',
                });
            } catch (error: any) {
                showMessage(error.message, 'error');
            }
        };
        fetchClient();
    }, [id]);


    const submitForm = async (values: any) => {
        try {
            await updateClientById(id, values);
            showMessage('Client updated successfully', 'success');
            navigate('/admin/clients');
        } catch (error: any) {
            showMessage(error.message, 'error');
        }
    };

    if (!initialValues) return <div>Loading...</div>;

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/clients" className="text-primary">
                        Clients
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    Edit Client
                </li>
            </ol>

            <Formik
                initialValues={initialValues}
                validationSchema={SubmittedForm}
                onSubmit={submitForm}
                enableReinitialize
            >
                {({ errors, touched }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Client Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {['name', 'email', 'address', 'phone', 'gstNo'].map((field) => (
                                    <div key={field} className={touched[field] && errors[field] ? 'has-error' : ''}>
                                        <label htmlFor={field} className="capitalize">{field}</label>
                                        <Field name={field}>
                                            {({ field: f }) => (
                                                <input
                                                    {...f}
                                                    id={field}
                                                    placeholder={`Enter ${field}`}
                                                    type="text"
                                                    className="form-input"
                                                    maxLength={field === 'phone' ? 10 : field === 'gstNo' ? 15 : undefined}
                                                    onInput={(e) => {
                                                        if (field === 'phone' || field === 'gstNo') {
                                                            e.target.value = e.target.value.replace(/\D/g, ''); // only digits
                                                        }
                                                    }}
                                                />
                                            )}
                                        </Field>
                                        {touched[field] && errors[field] && (
                                            <div className="text-danger mt-1">{errors[field]}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success !mt-6">
                                Update Client
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default EditClient;
