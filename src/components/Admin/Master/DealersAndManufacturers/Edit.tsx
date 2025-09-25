import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { dealersAndManufacturers } from '../../../../data';

const EditDealerAndManufacturer = () => {
    const SubmittedForm = Yup.object().shape({
        hospitalName: Yup.string().required('Please fill the Field'),
        address: Yup.string().required('Please fill the Field'),
        contactPersonName: Yup.string().required('Please fill the Field'),
        phone: Yup.string().required('Please fill the Field'),
        email: Yup.string().required('Please fill the Field'),
        procurementNumber: Yup.string().required('Please fill the Field'),
        procurementExpiryDate: Yup.string().required('Please fill the Field'),
        partyCode: Yup.string().required('Please fill the Field'),
        branch: Yup.string().required('Please fill the Field'),
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
                    <Link to="/admin/dealer-and-manufacture" className="text-primary">
                        Dealer And Manufacture
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Dealer And Manufacture
                    </Link>
                </li>
            </ol>
            <Formik
                initialValues={{
                    hospitalName: dealersAndManufacturers[0].hospitalName,
                    address: dealersAndManufacturers[0].address,
                    contactPersonName: dealersAndManufacturers[0].contactPersonName,
                    phone: dealersAndManufacturers[0].phone,
                    email: dealersAndManufacturers[0].email,
                    procurementNumber: dealersAndManufacturers[0].procurementNumber,
                    procurementExpiryDate: dealersAndManufacturers[0].procurementExpiryDate,
                    partyCode: dealersAndManufacturers[0].partyCode,
                    branch: dealersAndManufacturers[0].branch,
                }}
                validationSchema={SubmittedForm}
                onSubmit={() => {}}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Manufacturer Leads</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className={submitCount ? (errors.hospitalName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="hospitalName">Hospital Name </label>
                                    <Field name="hospitalName" type="text" id="hospitalName" placeholder="Enter Hospital Name" className="form-input" />
                                    {submitCount ? errors.hospitalName ? <div className="text-danger mt-1">{errors.hospitalName}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.address ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="address"> Address </label>
                                    <Field name="address" type="date" id="manufactureDate" placeholder="Enter Address" className="form-input" />
                                    {submitCount ? errors.address ? <div className="text-danger mt-1">{errors.address}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.contactPersonName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="contactPersonName">Contact Person Name </label>
                                    <Field name="contactPersonName" type="text" id="contactPersonName" placeholder="Enter Contact Person Name" className="form-input" />
                                    {submitCount ? (
                                        errors.contactPersonName ? (
                                            <div className="text-danger mt-1">{errors.contactPersonName}</div>
                                        ) : (
                                            <div className="text-success mt-1">Looks Good!</div>
                                        )
                                    ) : (
                                        ''
                                    )}
                                </div>
                                <div className={submitCount ? (errors.phone ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="phone"> Mobile Number </label>
                                    <Field name="phone" type="text" id="phone" placeholder="Enter Mobile Number" className="form-input" />
                                    {submitCount ? errors.phone ? <div className="text-danger mt-1">{errors.phone}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.email ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="email">Email ID</label>
                                    <Field name="email" type="text" id="email" placeholder="Enter Email ID" className="form-input" />
                                    {submitCount ? errors.email ? <div className="text-danger mt-1">{errors.email}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.procurementNumber ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="procurementNumber"> Procurement Number </label>
                                    <Field name="procurementNumber" type="date" id="procurementNumber" className="form-input" />
                                    {submitCount ? (
                                        errors.procurementNumber ? (
                                            <div className="text-danger mt-1">{errors.procurementNumber}</div>
                                        ) : (
                                            <div className="text-success mt-1">Looks Good!</div>
                                        )
                                    ) : (
                                        ''
                                    )}
                                </div>
                                <div className={submitCount ? (errors.procurementExpiryDate ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="procurementExpiryDate">Procurement Expiry Date</label>
                                    <Field name="procurementExpiryDate" type="text" id="procurementExpiryDate" placeholder="Enter Procurement Expiry Date" className="form-input" />
                                    {submitCount ? (
                                        errors.procurementExpiryDate ? (
                                            <div className="text-danger mt-1">{errors.procurementExpiryDate}</div>
                                        ) : (
                                            <div className="text-success mt-1">Looks Good!</div>
                                        )
                                    ) : (
                                        ''
                                    )}
                                </div>
                                <div className={submitCount ? (errors.partyCode ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="partyCode" typeof="date">
                                        Party Code
                                    </label>
                                    <Field name="partyCode" type="text" id="partyCode" className="form-input" placeholder="Enter Tool ID" />
                                    {submitCount ? errors.partyCode ? <div className="text-danger mt-1">{errors.partyCode}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                                <div className={submitCount ? (errors.branch ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="branch" typeof="date">
                                        Branch
                                    </label>
                                    <Field name="branch" type="text" id="branch" className="form-input" placeholder="Enter Tool ID" />
                                    {submitCount ? errors.branch ? <div className="text-danger mt-1">{errors.branch}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                                </div>
                            </div>
                        </div>
                        <div className="w-[98%] mb-6 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-success mt-4"
                                onClick={() => {
                                    if (touched.hospitalName && !errors.hospitalName) {
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

export default EditDealerAndManufacturer;
