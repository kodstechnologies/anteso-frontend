import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';

// Dummy data
const srfClientOptions = [
  { value: 'ABSRF/2025/05/001', label: 'ABSRF/2025/05/001 - Apollo Hospital' },
  { value: 'ABSRF/2025/08/002', label: 'ABSRF/2025/05/002 - MedTech Supplies' },
  { value: 'ABSRF/2025/02/003', label: 'ABSRF/2025/05/003 - BioGenix Pvt Ltd' },
];

const paymentTypes = ['Advanced', 'Balance', 'Complete'];

// Initial values (simulate fetched record)
const defaultPayment = {
  srfClient: 'ABSRF/2025/05/001',
  totalAmount: 12000,
  paymentAmount: 6000,
  paymentType: 'Advanced',
  utrNumber: 'UTR20250625ABC',
  screenshot: null, // new file only, not showing old file path
};

const validationSchema = Yup.object().shape({
  srfClient: Yup.string().required('Please select SRF and Client'),
  totalAmount: Yup.number().required('Total amount is required').positive('Must be positive'),
  paymentAmount: Yup.number().required('Payment amount is required').positive('Must be positive'),
  paymentType: Yup.string().required('Please select payment type'),
  screenshot: Yup.mixed().required('Please attach a screenshot'),
  utrNumber: Yup.string(),
});

const Edit = () => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = (values: typeof defaultPayment) => {
    console.log('Updated Payment:', values);
    showMessage('Payment updated successfully!', 'success');
    navigate('/admin/payments');
  };

  return (
    <>
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
        <li>
          <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">Dashboard</Link>
        </li>
        <li className="before:w-1 before:h-1 before:bg-primary before:rounded-full before:mx-4">
          <Link to="/admin/payments" className="text-primary">Payments</Link>
        </li>
        <li className="before:w-1 before:h-1 before:bg-primary before:rounded-full before:mx-4">
          <span className="text-gray-500">Edit Payment</span>
        </li>
      </ol>

      <h5 className="font-semibold text-lg mb-4">Edit Payment</h5>

      <Formik
        initialValues={defaultPayment}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, errors, submitCount }) => (
          <Form className="space-y-5">
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Payment Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">

                {/* SRF No. */}
                <div className={submitCount && errors.srfClient ? 'has-error' : submitCount ? 'has-success' : ''}>
                  <label htmlFor="srfClient">SRF No.</label>
                  <Field as="select" name="srfClient" className="form-select w-full">
                    <option value="" disabled>Select SRF No.</option>
                    {srfClientOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="srfClient" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Total Amount */}
                <div className={submitCount && errors.totalAmount ? 'has-error' : submitCount ? 'has-success' : ''}>
                  <label htmlFor="totalAmount">Total Amount</label>
                  <Field type="number" name="totalAmount" className="form-input w-full" placeholder="Total Amount" />
                  <ErrorMessage name="totalAmount" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Payment Amount */}
                <div className={submitCount && errors.paymentAmount ? 'has-error' : submitCount ? 'has-success' : ''}>
                  <label htmlFor="paymentAmount">Payment Amount</label>
                  <Field type="number" name="paymentAmount" className="form-input w-full" placeholder="Payment Amount" />
                  <ErrorMessage name="paymentAmount" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Payment Type */}
                <div className={submitCount && errors.paymentType ? 'has-error' : submitCount ? 'has-success' : ''}>
                  <label htmlFor="paymentType">Payment Type</label>
                  <Field as="select" name="paymentType" className="form-select w-full">
                    <option value="">Select type</option>
                    {paymentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="paymentType" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* UTR Number (Optional) */}
                <div>
                  <label htmlFor="utrNumber">UTR Number (Optional)</label>
                  <Field type="text" name="utrNumber" className="form-input w-full" placeholder="UTR Number" />
                  <ErrorMessage name="utrNumber" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Screenshot */}
                <div className="md:col-span-2">
                  <label htmlFor="screenshot">Attach Screenshot</label>
                  <input
                    type="file"
                    name="screenshot"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      setFieldValue("screenshot", file);
                      if (file) {
                        setImagePreview(URL.createObjectURL(file));
                      } else {
                        setImagePreview(null);
                      }
                    }}
                    className="form-input w-full"
                  />
                  <ErrorMessage name="screenshot" component="div" className="text-red-500 text-sm mt-1" />
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-1">Preview:</p>
                      <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover border rounded shadow" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn btn-success mt-4">Update Payment</button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default Edit;
