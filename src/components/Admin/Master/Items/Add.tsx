import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';

const AddItem = () => {
    const SubmittedForm = Yup.object().shape({
        stateName: Yup.string().required('Please fill the Field'),
        hsnCode: Yup.string().required('Please fill the Field'),
        price: Yup.string().required('Please fill the Field'),
    });
    const submitForm = () => {
        showMessage('Form submitted successfully', 'success');
    };
    return (
        <>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link to="/admin/items" className="text-primary hover:underline">
                        <span>Items</span>
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Add</span>
                </li>
            </ul>
            <Formik
                initialValues={{
                    name: '',
                    hsnCode: '',
                    price: '',
                }}
                validationSchema={SubmittedForm}
                onSubmit={() => {}}
            >
                {({ errors, submitCount, touched }) => (
                    <Form className="space-y-5">
                        <div className={submitCount ? (errors.name ? 'has-error' : 'has-success') : ''}>
                            <label htmlFor="name">Name </label>
                            <Field name="name" type="text" id="name" placeholder="Enter State Name" className="form-input" />
                            {submitCount ? errors.name ? <div className="text-danger mt-1">{errors.name}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                        </div>
                        <div className={submitCount ? (errors.hsnCode ? 'has-error' : 'has-success') : ''}>
                            <label htmlFor="hsnCode">HSN Code </label>
                            <Field name="hsnCode" type="text" id="hsnCode" placeholder="Enter State Name" className="form-input" />
                            {submitCount ? errors.name ? <div className="text-danger mt-1">{errors.name}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                        </div>
                        <div className={submitCount ? (errors.price ? 'has-error' : 'has-success') : ''}>
                            <label htmlFor="price">Price </label>
                            <Field name="price" type="text" id="price" placeholder="Enter State Name" className="form-input" />
                            {submitCount ? errors.name ? <div className="text-danger mt-1">{errors.name}</div> : <div className="text-success mt-1">Looks Good!</div> : ''}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary !mt-6"
                            onClick={() => {
                                if (touched.name && !errors.name) {
                                    submitForm();
                                }
                            }}
                        >
                            Submit Form
                        </button>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default AddItem;
