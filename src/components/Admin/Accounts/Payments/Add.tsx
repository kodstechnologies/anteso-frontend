import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { useState, useEffect } from 'react';
import { allOrdersWithClient, getTotalAmount, createPayment, getPaymentsBySrf } from '../../../../api';

const paymentTypes = ['advance', 'balance', 'complete'];

const Add = () => {
  const navigate = useNavigate();
  const [srfClientOptions, setSrfClientOptions] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await allOrdersWithClient();
        const options = res.data.orders.map((order: any) => ({
          value: order.srfNumber,
          label: order.srfNumberWithHospital,
          _id: order._id,
          isPrivilegedOrder: order.isPrivilegedOrder || false,
          pricingType: order.pricingType || null,
          customPricing: order.customPricing || { qaTests: [], services: [] },
        }));
        setSrfClientOptions(options);
      } catch (error) {
        console.error("Failed to fetch orders", error);
        showMessage("Failed to load orders", "error");
      }
    };
    fetchOrders();
  }, []);

  const PaymentSchema = Yup.object().shape({
    srfClient: Yup.string().required('Please select SRF and Client'),
    totalAmount: Yup.number()
      .required('Total amount is required')
      .positive('Must be positive')
      .min(1, 'Total amount must be at least 1'),
    paymentAmount: Yup.number()
      .required('Payment amount is required')
      .positive('Must be positive')
      .max(Yup.ref('totalAmount'), 'Payment cannot exceed total amount'),
    paymentType: Yup.string().required('Please select payment type'),
    screenshot: Yup.mixed().required('Please attach a screenshot'),
    utrNumber: Yup.string().nullable(),
  });

  const calculateTotalFromCustomPricing = (customPricing: any) => {
    if (!customPricing) return 0;
    let total = 0;
    if (Array.isArray(customPricing.qaTests)) {
      customPricing.qaTests.forEach((test: any) => {
        if (test.price && typeof test.price === 'number') total += test.price;
      });
    }
    if (Array.isArray(customPricing.services)) {
      customPricing.services.forEach((service: any) => {
        if (service.amount && typeof service.amount === 'number') total += service.amount;
      });
    }
    return parseFloat(total.toFixed(2));
  };

  return (
    <>
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
        <li><Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">Dashboard</Link></li>
        <li className="before:w-1 before:h-1 before:bg-primary before:rounded-full before:mx-4">
          <Link to="/admin/payments" className="text-primary">Payments</Link>
        </li>
        <li className="before:w-1 before:h-1 before:bg-primary before:rounded-full before:mx-4">
          Add Payment
        </li>
      </ol>

      <Formik
        initialValues={{
          srfClient: '',
          totalAmount: 0,
          paymentAmount: '',
          paymentType: '',
          screenshot: null,
          utrNumber: '',
          orderId: '',
        }}
        validationSchema={PaymentSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const formData = new FormData();
            formData.append("orderId", values.orderId);
            formData.append("srfNumber", values.srfClient);
            formData.append("totalAmount", values.totalAmount.toString());
            formData.append("paymentAmount", values.paymentAmount.toString());
            formData.append("paymentType", values.paymentType);
            formData.append("utrNumber", values.utrNumber || "");

            if (values.screenshot) formData.append("screenshot", values.screenshot);

            await createPayment(formData);
            showMessage(`Payment recorded successfully as ${values.paymentType}`, "success");
            navigate('/admin/payments');
          } catch (error: any) {
            showMessage(error.message || "Failed to create payment", "error");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ setFieldValue, values, errors, submitCount, touched }) => {

          // Auto-suggest payment type (but user can still override)
          useEffect(() => {
            if (!values.srfClient || !values.paymentAmount || !values.totalAmount) return;

            let suggestedType = "advance";
            if (Number(values.paymentAmount) === Number(values.totalAmount)) {
              suggestedType = "complete";
            } else if (Number(values.paymentAmount) > 0) {
              getPaymentsBySrf(values.srfClient)
                .then(res => {
                  if (res.data && res.data.length > 0) {
                    suggestedType = "balance";
                  }
                  setFieldValue("paymentType", suggestedType);
                })
                .catch(() => {
                  setFieldValue("paymentType", suggestedType);
                });
            } else {
              setFieldValue("paymentType", suggestedType);
            }
          }, [values.paymentAmount, values.srfClient, values.totalAmount]);

          return (
            <Form className="space-y-5">
              <div className="panel">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Payment Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                  {/* SRF Dropdown */}
                  <div className={submitCount ? (errors.srfClient ? 'has-error' : 'has-success') : ''}>
                    <label className="text-sm font-semibold text-gray-700">SRF No.</label>
                    <Field
                      as="select"
                      name="srfClient"
                      className="form-select w-full"
                      onChange={async (e: any) => {
                        const selectedSrf = e.target.value;
                        const selectedOption = srfClientOptions.find(o => o.value === selectedSrf);
                        if (!selectedOption) return;

                        setFieldValue("srfClient", selectedOption.value);
                        setFieldValue("orderId", selectedOption._id);

                        let suggestedTotal = 0;

                        if (selectedOption.isPrivilegedOrder && selectedOption.customPricing) {
                          suggestedTotal = calculateTotalFromCustomPricing(selectedOption.customPricing);
                          showMessage(`${selectedOption.pricingType} Pricing Applied: ₹${suggestedTotal}`, "info");
                        } else {
                          try {
                            const res = await getTotalAmount(selectedSrf);
                            suggestedTotal = parseFloat(Number(res.data.totalAmount || 0).toFixed(2));
                          } catch (err) {
                            showMessage("Could not fetch total amount", "error");
                          }
                        }

                        setFieldValue("totalAmount", suggestedTotal || 0);
                        setFieldValue("paymentAmount", "");
                        setFieldValue("paymentType", ""); // Reset payment type
                      }}
                    >
                      <option value="" disabled>Select SRF No.</option>
                      {srfClientOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                          {option.isPrivilegedOrder ? ` (${option.pricingType} Pricing)` : ""}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="srfClient" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Total Amount - Editable */}
                  <div className={touched.totalAmount && errors.totalAmount ? 'has-error' : ''}>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Total Amount
                      <span className="text-xs text-gray-500 font-normal">(editable)</span>
                    </label>
                    <Field
                      type="number"
                      name="totalAmount"
                      placeholder="Enter total amount"
                      className="form-input w-full font-bold text-lg text-blue-700"
                      step="0.01"
                    />
                    <ErrorMessage name="totalAmount" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Payment Amount */}
                  <div className={submitCount ? (errors.paymentAmount ? 'has-error' : 'has-success') : ''}>
                    <label className="text-sm font-semibold text-gray-700">Payment Amount</label>
                    <Field
                      type="number"
                      name="paymentAmount"
                      placeholder="Enter payment amount"
                      className="form-input w-full"
                      onChange={(e: any) => {
                        const value = Number(e.target.value);
                        if (value > values.totalAmount) {
                          setFieldValue("paymentAmount", values.totalAmount);
                          showMessage("Payment cannot exceed total amount", "warning");
                        } else {
                          setFieldValue("paymentAmount", value);
                        }
                      }}
                    />
                    <ErrorMessage name="paymentAmount" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Payment Type - Exactly Like Your Original */}
                  <div className={submitCount ? (errors.paymentType ? 'has-error' : 'has-success') : ''}>
                    <label className="text-sm font-semibold text-gray-700">Payment Type</label>
                    <Field as="select" name="paymentType" className="form-select w-full">
                      <option value="" disabled>Select type</option>
                      {paymentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="paymentType" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* UTR */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700">UTR Number (Optional)</label>
                    <Field
                      type="text"
                      name="utrNumber"
                      placeholder="Enter UTR"
                      className="form-input w-full"
                      onInput={(e: any) => e.target.value = e.target.value.toUpperCase()}
                    />
                  </div>

                  {/* Screenshot */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <div className={submitCount ? (errors.screenshot ? 'has-error' : 'has-success') : ''}>
                      <label className="text-sm font-semibold text-gray-700">Attach Screenshot</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          setFieldValue("screenshot", file);
                          if (file) setImagePreview(URL.createObjectURL(file));
                          else setImagePreview(null);
                        }}
                        className="form-input w-full"
                      />
                      <ErrorMessage name="screenshot" component="div" className="text-red-500 text-sm mt-1" />
                      {imagePreview && (
                        <div className="mt-4">
                          <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover border rounded shadow" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                {values.srfClient && srfClientOptions.find(o => o.value === values.srfClient)?.isPrivilegedOrder && (
                  <div className="mt-8 p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">
                      {srfClientOptions.find(o => o.value === values.srfClient)?.pricingType} Pricing Applied
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      {srfClientOptions.find(o => o.value === values.srfClient)?.customPricing.qaTests?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3">QA Tests</h4>
                          {srfClientOptions.find(o => o.value === values.srfClient).customPricing.qaTests.map((test: any, i: number) => (
                            <div key={i} className="flex justify-between bg-white p-3 rounded-lg shadow mb-2">
                              <span>{test.testName}</span>
                              <span className="font-bold text-green-600">₹{test.price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {srfClientOptions.find(o => o.value === values.srfClient)?.customPricing.services?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3">Services</h4>
                          {srfClientOptions.find(o => o.value === values.srfClient).customPricing.services.map((service: any, i: number) => (
                            <div key={i} className="flex justify-between bg-white p-3 rounded-lg shadow mb-2">
                              <span>{service.serviceName}</span>
                              <span className="font-bold text-green-600">₹{service.amount}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-6 text-right border-t-2 border-blue-300 pt-4">
                      <p className="text-2xl font-bold text-blue-900">
                        Final Total: ₹{values.totalAmount}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-8">
                  <button type="submit" className="btn btn-primary text-lg px-8 py-3">
                    Submit Payment
                  </button>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>
    </>
  );
};

export default Add; 