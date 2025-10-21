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
        qaTests: [],
    });

    const [editableQaTests, setEditableQaTests] = useState<
        { testName: string; price: number; system?: boolean }[]
    >([]);
    const [newQaTestName, setNewQaTestName] = useState('');
    const [newQaTestPrice, setNewQaTestPrice] = useState('');

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
                    qaTests: dealer.qaTests || [],
                });

                // ✅ set QA test editable state
                setEditableQaTests(
                    dealer.qaTests?.map((test: any) => ({
                        testName: test.testName,
                        price: test.price,
                        system: false,
                    })) || []
                );
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
            const payload = {
                ...values,
                qaTests: editableQaTests.map((t) => ({
                    testName: t.testName,
                    price: t.price,
                })),
            };

            await editDealerById(id, payload);
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

                        {/* QA Test Section */}
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">QA Tests</h5>

                            <div className="space-y-3 max-w-[40rem]">
                                {/* Table Header */}
                                <div className="flex items-center font-medium text-sm text-gray-600">
                                    <div className="w-1/2">QA Test</div>
                                    <div className="w-24 text-center">Price ₹</div>
                                    <div className="w-20 text-right">Action</div>
                                </div>

                                {/* QA Test Rows */}
                                {editableQaTests.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={option.testName}
                                            onChange={(e) => {
                                                const updated = [...editableQaTests];
                                                updated[index].testName = e.target.value;
                                                setEditableQaTests(updated);
                                            }}
                                            className="form-input w-1/2"
                                        />

                                        <input
                                            type="number"
                                            value={option.price}
                                            onChange={(e) => {
                                                const updated = [...editableQaTests];
                                                updated[index].price = parseFloat(e.target.value) || 0;
                                                setEditableQaTests(updated);
                                            }}
                                            className="form-input w-24 text-sm"
                                            placeholder="₹"
                                        />

                                        <div className="w-20 text-right">
                                            <button
                                                type="button"
                                                // className="text-red-600 text-xs"
                                                className="btn btn-danger"

                                                onClick={() => {
                                                    setEditableQaTests(editableQaTests.filter((_, i) => i !== index));
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add New QA Test */}
                                <div className="flex items-center gap-3 pt-4">
                                    <input
                                        type="text"
                                        placeholder="New QA Test Name"
                                        value={newQaTestName}
                                        onChange={(e) => setNewQaTestName(e.target.value)}
                                        className="form-input w-1/2"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price ₹"
                                        value={newQaTestPrice}
                                        onChange={(e) => setNewQaTestPrice(e.target.value)}
                                        className="form-input w-24"
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => {
                                            if (!newQaTestName.trim()) {
                                                return showMessage('Please enter QA test name.', 'error');
                                            }

                                            const newTest = {
                                                testName: newQaTestName.trim(),
                                                price: parseFloat(newQaTestPrice) || 0,
                                            };

                                            setEditableQaTests([...editableQaTests, newTest]);
                                            setNewQaTestName('');
                                            setNewQaTestPrice('');
                                            showMessage('QA test added.', 'success');
                                        }}
                                    >
                                        + Add
                                    </button>
                                </div>
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

// ✅ fixed FormField component (no "0" appears now)
const FormField = ({ name, label, type = 'text', errors, submitCount }: any) => (
    <div className={submitCount ? (errors[name] ? 'has-error' : 'has-success') : ''}>
        <label htmlFor={name}>{label}</label>
        <Field
            name={name}
            type={type}
            id={name}
            placeholder={`Enter ${label}`}
            className="form-input"
        />
        {submitCount > 0 && errors[name] && (
            <div className="text-danger mt-1">{errors[name]}</div>
        )}
    </div>
);

export default EditDealer;
