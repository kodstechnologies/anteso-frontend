import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { getDealerById, editDealerById } from '../../../../api';

const EditDealer = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [initialValues, setInitialValues] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        branch: '',
        mouValidity: '',
    });

    // ✅ validation schema
    const SubmittedForm = Yup.object().shape({
        name: Yup.string().required('Please fill the Field'),
        phone: Yup.string().required('Please fill the Field'),
        email: Yup.string().email('Invalid email').required('Please fill the Field'),
        address: Yup.string().required('Please fill the Field'),
        city: Yup.string().required('Please fill the Field'),
        state: Yup.string().required('Please fill the Field'),
        pincode: Yup.string().required('Please fill the Field'),
        branch: Yup.string().required('Please fill the Field'),
        mouValidity: Yup.date().required('Please fill the Field'),
    });

    // ✅ fetch dealer details on mount
    useEffect(() => {
        const fetchDealer = async () => {
            try {
                const res = await getDealerById(id);
                const dealer = res.data.data;
                setInitialValues({
                    name: dealer.name || '',
                    phone: dealer.phone?.toString() || '',
                    email: dealer.email || '',
                    address: dealer.address || '',
                    city: dealer.city || '',
                    state: dealer.state || '',
                    pincode: dealer.pincode || '',
                    branch: dealer.branch || '',
                    mouValidity: dealer.mouValidity ? dealer.mouValidity.split('T')[0] : '',
                });
            } catch (error) {
                console.error("🚀 ~ fetchDealer error:", error);
                showMessage('Failed to fetch dealer details', 'error');
            }
        };
        if (id) fetchDealer();
    }, [id]);

    // ✅ handle form submit
    const handleSubmit = async (values: any) => {
        try {
            await editDealerById(id, values);
            showMessage('Dealer updated successfully', 'success');
            navigate('/admin/dealer');
        } catch (error) {
            console.error("🚀 ~ updateDealer error:", error);
            showMessage('Failed to update dealer', 'error');
        }
    };

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
                    <Link to="/admin/dealer" className="text-primary">
                        Dealer
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#">Edit Dealer</Link>
                </li>
            </ol>

            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={SubmittedForm}
                onSubmit={handleSubmit}
            >
                {({ errors, submitCount }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Edit Dealer</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <FormField name="name" label="Dealer Name" errors={errors} submitCount={submitCount} />
                                <FormField name="phone" label="Phone" errors={errors} submitCount={submitCount} />
                                <FormField name="email" label="Email" errors={errors} submitCount={submitCount} />
                                <FormField name="address" label="Address" errors={errors} submitCount={submitCount} />
                                <FormField name="city" label="City" errors={errors} submitCount={submitCount} />
                                <FormField name="state" label="State" errors={errors} submitCount={submitCount} />
                                <FormField name="pincode" label="Pincode" errors={errors} submitCount={submitCount} />
                                <FormField name="branch" label="Branch" errors={errors} submitCount={submitCount} />
                                <FormField name="mouValidity" type="date" label="MOU Validity" errors={errors} submitCount={submitCount} />
                            </div>
                        </div>

                        <div className="w-[98%] mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success mt-4">
                                Submit Form
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

// ✅ small reusable component for fields
const FormField = ({ name, label, type = 'text', errors, submitCount }: any) => (
    <div className={submitCount ? (errors[name] ? 'has-error' : 'has-success') : ''}>
        <label htmlFor={name}>{label}</label>
        <Field name={name} type={type} id={name} placeholder={`Enter ${label}`} className="form-input" />
        {submitCount && errors[name] && <div className="text-danger mt-1">{errors[name]}</div>}
    </div>
);

export default EditDealer;