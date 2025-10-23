import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { Link, useNavigate, useParams } from "react-router-dom";
import { showMessage } from "../../../common/ShowMessage";
import { getPaymentById, editPayment } from "../../../../api";

// Interfaces
interface PaymentData {
  srfNumber: string;
  hospitalName: string;
  totalAmount: number;
  paymentAmount: number;
  paymentType: string;
  utrNumber?: string;
  screenshot?: string;
}

interface EditPaymentValues {
  srfClient: string;
  totalAmount: number | string;
  paymentAmount: number | string;
  paymentType: string;
  utrNumber: string;
  screenshot: File | null;
}

// Payment type options
const paymentTypes = ["advance", "balance", "complete"];

// Validation Schema
const validationSchema = Yup.object().shape({
  srfClient: Yup.string().required("Please select SRF and Client"),
  totalAmount: Yup.number()
    .required("Total amount is required")
    .positive("Must be positive"),
  paymentAmount: Yup.number()
    .required("Payment amount is required")
    .positive("Must be positive")
    .max(Yup.ref('totalAmount'), 'Payment cannot exceed total amount'),
  paymentType: Yup.string().required("Please select payment type"),
  utrNumber: Yup.string(),
  screenshot: Yup.mixed().nullable(),
});

const Edit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<EditPaymentValues | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [srfOptions, setSrfOptions] = useState<{ value: string; label: string }[]>([]);

  // Fetch payment data
  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await getPaymentById(id!);
        const payment: PaymentData = res?.data?.data;

        // Set SRF dropdown dynamically from the API response
        setSrfOptions([{ value: payment.srfNumber, label: `${payment.srfNumber} - ${payment.hospitalName}` }]);

        // Map API value "advance" to "advanced" if needed
        const mappedPaymentType = payment.paymentType;

        setInitialValues({
          srfClient: payment.srfNumber || "",
          totalAmount: payment.totalAmount || 0,
          paymentAmount: payment.paymentAmount || 0,
          paymentType: mappedPaymentType || "",
          utrNumber: payment.utrNumber || "",
          screenshot: null,
        });

        if (payment.screenshot) {
          setImagePreview(payment.screenshot);
        }
      } catch (error) {
        console.error("Failed to fetch payment:", error);
        showMessage("Failed to load payment details", "error");
      }
    };
    fetchPayment();
  }, [id]);

  const handleSubmit = async (
    values: EditPaymentValues,
    { setSubmitting }: FormikHelpers<EditPaymentValues>
  ) => {
    try {
      const formData = new FormData();
      formData.append("srfClient", values.srfClient);
      formData.append("totalAmount", values.totalAmount.toString());
      formData.append("paymentAmount", values.paymentAmount.toString());
      formData.append("paymentType", values.paymentType);
      formData.append("utrNumber", values.utrNumber || "");
      if (values.screenshot) {
        formData.append("screenshot", values.screenshot);
      }

      await editPayment(id!, formData);
      showMessage("Payment updated successfully!", "success");
      navigate("/admin/payments");
    } catch (error: any) {
      console.error("Update payment error:", error);
      showMessage(error.message || "Failed to update payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialValues) return <p>Loading payment details...</p>;

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
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, values, errors, submitCount, isSubmitting }) => {
          // Auto-update paymentType if amount equals total
          useEffect(() => {
            if (Number(values.paymentAmount) === Number(values.totalAmount)) {
              setFieldValue("paymentType", "complete");
            }
          }, [values.paymentAmount, values.totalAmount, setFieldValue]);

          return (
            <Form className="space-y-5">
              <div className="panel">
                <h5 className="font-semibold text-lg mb-4">Payment Details</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">

                  {/* SRF No */}
                  <div className={submitCount && errors.srfClient ? "has-error" : submitCount ? "has-success" : ""}>
                    <label htmlFor="srfClient">SRF No.</label>
                    <Field
                      as="select"
                      name="srfClient"
                      className="form-select w-full"
                      disabled={true} // ✅ Disable SRF No field after fetching
                    >
                      <option value="" disabled>Select SRF No.</option>
                      {srfOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="srfClient" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Total Amount */}
                  <div className={submitCount && errors.totalAmount ? "has-error" : submitCount ? "has-success" : ""}>
                    <label htmlFor="totalAmount">Total Amount</label>
                    <Field type="number" name="totalAmount" className="form-input w-full" placeholder="Total Amount" />
                    <ErrorMessage name="totalAmount" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Payment Amount */}
                  <div className={submitCount && errors.paymentAmount ? "has-error" : submitCount ? "has-success" : ""}>
                    <label htmlFor="paymentAmount">Payment Amount</label>
                    <Field
                      type="number"
                      name="paymentAmount"
                      className="form-input w-full"
                      placeholder="Payment Amount"
                      onChange={(e: any) => {
                        const value = Number(e.target.value);
                        if (value > values.totalAmount) {
                          setFieldValue("paymentAmount", values.totalAmount); // prevent typing more
                          showMessage("Payment cannot exceed total amount", "warning");
                        } else {
                          setFieldValue("paymentAmount", value);
                        }
                      }}
                    />
                    <ErrorMessage name="paymentAmount" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Payment Type */}
                  <div className={submitCount && errors.paymentType ? "has-error" : submitCount ? "has-success" : ""}>
                    <label htmlFor="paymentType">Payment Type</label>
                    <Field as="select" name="paymentType" className="form-select w-full">
                      <option value="">Select type</option>
                      {paymentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="paymentType" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* UTR Number */}
                  <div>
                    <label htmlFor="utrNumber">UTR Number (Optional)</label>
                    <Field
                      type="text"
                      name="utrNumber"
                      className="form-input w-full"
                      placeholder="UTR Number"
                      onInput={(e: any) => {
                        e.target.value = e.target.value.toUpperCase();
                      }}
                    />
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
                        if (file) setImagePreview(URL.createObjectURL(file));
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
                  <button type="submit" disabled={isSubmitting} className="btn btn-success mt-4 disabled:opacity-50">
                    {isSubmitting ? "Updating..." : "Update Payment"}
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

export default Edit;