import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../common/ShowMessage';
import { orderData } from '../../../data';

const Edit = () => {
    const SubmittedForm = Yup.object().shape({
        orderId: Yup.string().required('Please fill the field'),
        procNo: Yup.string().required('Please fill the field'),
        type: Yup.string().required('Please fill the field'),
        createdOn: Yup.string().required('Please fill the field'),
        partyCode: Yup.string().required('Please fill the field'),
        customerName: Yup.string().required('Please fill the field'),
        address: Yup.string().required('Please fill the field'),
        city: Yup.string().required('Please fill the field'),
        state: Yup.string().required('Please fill the field'),
        pin: Yup.string().required('Please fill the field'),
        email: Yup.string().email('Invalid email').required('Please fill the field'),
        contactNumber: Yup.string().required('Please fill the field'),
        status: Yup.string().required('Please fill the field'),
    });

    const submitForm = () => {
        showMessage('Order updated successfully', 'success');
    };

    const initialOrder = orderData[0]; // Replace with dynamic data 

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/orders" className="text-primary">
                        Orders
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Order
                    </Link>
                </li>
            </ol>

            <Formik
                initialValues={{
                    orderId: initialOrder.orderId,
                    procNo: initialOrder.procNo,
                    type: initialOrder.type,
                    createdOn: initialOrder.createdOn,
                    partyCode: initialOrder.partyCode,
                    customerName: initialOrder.customerName,
                    address: initialOrder.address,
                    city: initialOrder.city,
                    state: initialOrder.state,
                    pin: initialOrder.pin,
                    email: initialOrder.email,
                    contactNumber: initialOrder.contactNumber,
                    status: initialOrder.status,
                }}
                validationSchema={SubmittedForm}
                onSubmit={() => {}}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Edit Order</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {[
                                    { name: 'orderId', label: 'SRF No' },
                                    { name: 'procNo', label: 'PROC No / PO No' },
                                    { name: 'type', label: 'Type' },
                                    { name: 'createdOn', label: 'PROC Expiry Date' },
                                    { name: 'partyCode', label: 'Party Code / Sys ID' },
                                    { name: 'customerName', label: 'Institute Name' },
                                    { name: 'address', label: 'Address' },
                                    { name: 'city', label: 'City / District' },
                                    { name: 'state', label: 'State' },
                                    { name: 'pin', label: 'Pin Code' },
                                    { name: 'email', label: 'Customer Email' },
                                    { name: 'contactNumber', label: 'Customer Mobile' },
                                    { name: 'status', label: 'Status' },
                                ].map(({ name, label }) => (
                                    <div
                                        key={name}
                                        className={
                                            submitCount
                                                ? errors[name as keyof typeof errors]
                                                    ? 'has-error'
                                                    : 'has-success'
                                                : ''
                                        }
                                    >
                                        <label htmlFor={name}>{label}</label>
                                        <Field name={name} type="text" id={name} placeholder={`Enter ${label}`} className="form-input" />
                                        {submitCount && errors[name as keyof typeof errors] ? (
                                            <div className="text-danger mt-1">{errors[name as keyof typeof errors]}</div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-[98%] mb-6 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-success mt-4"
                                onClick={() => {
                                    if (touched.orderId && !errors.orderId) {
                                        submitForm();
                                    }
                                }}
                            >
                                Update Order
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default Edit;
