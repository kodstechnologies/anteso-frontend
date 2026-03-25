import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { Link, useNavigate, useParams } from "react-router-dom";
import { showMessage } from "../../../common/ShowMessage";
import { getPaymentById, editPayment } from "../../../../api";
import IconX from "../../../../components/Icon/IconX";

// Interfaces
interface PaymentData {
  srfNumber: string;
  hospitalName: string;
  totalAmount: number;
  paymentAmount: number;
  paymentType: string;
  paymentMode: string;
  paymentStatus?: string;
  utrNumber?: string;
  screenshot?: string;
}

interface EditPaymentValues {
  srfClient: string;
  totalAmount: number;
  paymentAmount: number | string;
  paymentType: string;
  paymentMode: string;
  utrNumber: string;
  screenshot: File | null;
}

// Payment type options
const paymentTypes = ["advance", "balance", "complete"];
const paymentModes = ["Cash", "Bank transfer", "Cheque", "UPI", "Other"];

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
  paymentMode: Yup.string().required("Please select payment mode"),
  utrNumber: Yup.string(),
  screenshot: Yup.mixed().nullable(),
});

const Edit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<EditPaymentValues | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [srfOptions, setSrfOptions] = useState<{ value: string; label: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch payment data
  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await getPaymentById(id!);
        const payment: PaymentData = res?.data?.data;

        // Set SRF dropdown dynamically from the API response
        setSrfOptions([{ value: payment.srfNumber, label: `${payment.srfNumber} - ${payment.hospitalName}` }]);

        setInitialValues({
          srfClient: payment.srfNumber || "",
          totalAmount: payment.totalAmount || 0,
          paymentAmount: payment.paymentAmount || 0,
          paymentType: payment.paymentType || "",
          paymentMode: payment.paymentMode || "",
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

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

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
      formData.append("paymentMode", values.paymentMode);
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
                      disabled={true}
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
                          setFieldValue("paymentAmount", values.totalAmount);
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

                  {/* Payment Mode */}
                  <div className={submitCount && errors.paymentMode ? "has-error" : submitCount ? "has-success" : ""}>
                    <label htmlFor="paymentMode">Payment Mode</label>
                    <Field as="select" name="paymentMode" className="form-select w-full">
                      <option value="">Select payment mode</option>
                      {paymentModes.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="paymentMode" component="div" className="text-red-500 text-sm mt-1" />
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

                  {/* Screenshot - Updated with clickable preview */}
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
                          const previewUrl = URL.createObjectURL(file);
                          setImagePreview(previewUrl);
                        } else {
                          setImagePreview(null);
                        }
                      }}
                      className="form-input w-full"
                    />
                    <ErrorMessage name="screenshot" component="div" className="text-red-500 text-sm mt-1" />

                    {/* Clickable Preview */}
                    {imagePreview && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-1">Current Screenshot:</p>
                        <div
                          className="cursor-pointer hover:opacity-90 transition-opacity inline-block"
                          onClick={() => setIsModalOpen(true)}
                        >
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover border rounded shadow hover:shadow-lg transition-shadow"
                          />
                          <p className="text-xs text-blue-600 mt-1 hover:underline">
                            Click to view full size
                          </p>
                        </div>
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

      {/* Full Screen Modal for Screenshot */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
              aria-label="Close"
            >
              <IconX className="w-6 h-6" />
            </button>

            {/* Image Container */}
            <div className="flex items-center justify-center min-h-screen">
              <img
                src={imagePreview || undefined} // ✅ Fixed: Convert null to undefined
                alt="Payment Screenshot Full Size"
                className="max-w-full max-h-screen object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Optional: Zoom indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
              Click anywhere to close
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Edit;