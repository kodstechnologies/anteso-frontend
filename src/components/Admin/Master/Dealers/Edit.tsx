import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { dealers } from '../../../../data';

const EditDealer = () => {
    const SubmittedForm = Yup.object().shape({
        dealersName: Yup.string().required('Please fill the Field'),
        address: Yup.string().required('Please fill the Field'),
        contactPersonName: Yup.string().required('Please fill the Field'),
        pinCode: Yup.string().required('Please fill the Field'),
        region: Yup.string().required('Please fill the Field'),
    });
    const submitForm = () => {
        showMessage('Form submitted successfully', 'success');
    };
    return (
        <>
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
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Dealer
                    </Link>
                </li>
            </ol>
            <Formik
                initialValues={{
                    dealersName: dealers[0].dealersName,
                    address: dealers[0].address,
                    contactPersonName: dealers[0].contactPersonName,
                    pinCode: dealers[0].pinCode,
                    region: dealers[0].region,
                }}
                validationSchema={SubmittedForm}
                onSubmit={() => {}}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Manufacturer Leads</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount ? (errors.dealersName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="dealersName">Dealer Name </label>
                                    <Field name="dealersName" type="text" id="dealersName" placeholder="Enter Dealer Name" className="form-input" />
                                    {submitCount && errors.dealersName ? <div className="text-danger mt-1">{errors.dealersName}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.address ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="address"> Address </label>
                                    <Field name="address" type="text" id="date" placeholder="Enter Address" className="form-input" />
                                    {submitCount && errors.address ? <div className="text-danger mt-1">{errors.address}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.contactPersonName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="contactPersonName">Contact Person Name </label>
                                    <Field name="contactPersonName" type="text" id="contactPersonName" placeholder="Enter Contact Person Name" className="form-input" />
                                    {submitCount && errors.contactPersonName ? <div className="text-danger mt-1">{errors.contactPersonName}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.pinCode ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="pinCode"> Pin Code </label>
                                    <Field name="pinCode" type="text" id="pinCode" placeholder="Enter pinCode" className="form-input" />
                                    {submitCount && errors.pinCode ? <div className="text-danger mt-1">{errors.pinCode}</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.region ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="region"> Region </label>
                                    <Field name="region" type="text" id="region" placeholder="Enter region" className="form-input" />
                                    {submitCount && errors.region ? <div className="text-danger mt-1">{errors.region}</div> : ''}
                                </div>
                            </div>
                        </div>
                        <div className="w-[98%] mb-6 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-success mt-4"
                                onClick={() => {
                                    if (touched.dealersName && !errors.dealersName) {
                                        submitForm();
                                    }
                                }}
                            >
                                Submit Form
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default EditDealer;
