import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { Link, useNavigate, useParams } from "react-router-dom";
import { showMessage } from "../../../common/ShowMessage";
import { getPaymentById, editPayment } from "../../../../api"; // ✅ your API functions

// 🧩 Interfaces
interface PaymentData {
  srfNumber: string;
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

interface ApiResponse {
  data: {
    data: PaymentData;
    message: string;
    statusCode: number;
  };
}

// 🧩 Options
const srfClientOptions = [
  { value: "ABSRF/2025/05/001", label: "ABSRF/2025/05/001 - Apollo Hospital" },
  { value: "ABSRF/2025/08/002", label: "ABSRF/2025/05/002 - MedTech Supplies" },
  { value: "ABSRF/2025/02/003", label: "ABSRF/2025/05/003 - BioGenix Pvt Ltd" },
];

const paymentTypes = ["advanced", "balance", "complete"];

// 🧩 Validation Schema
const validationSchema = Yup.object().shape({
  srfClient: Yup.string().required("Please select SRF and Client"),
  totalAmount: Yup.number()
    .required("Total amount is required")
    .positive("Must be positive"),
  paymentAmount: Yup.number()
    .required("Payment amount is required")
    .positive("Must be positive"),
  paymentType: Yup.string().required("Please select payment type"),
  utrNumber: Yup.string(),
  screenshot: Yup.mixed().nullable(),
});

const Edit: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // ✅ get payment ID from URL
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<EditPaymentValues | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 🔹 Fetch payment data by ID
  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res: ApiResponse = await getPaymentById(id!);
        console.log("🚀 ~ fetchPayment ~ res:", res);

        const payment = res?.data?.data;

        setInitialValues({
          srfClient: payment.srfNumber || "",
          totalAmount: payment.totalAmount || "",
          paymentAmount: payment.paymentAmount || "",
          paymentType: payment.paymentType || "",
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


  // 🔹 Handle form submission
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
      console.log("🚀 ~ handleSubmit ~ formData:", formData)
      showMessage("Payment updated successfully!", "success");
      navigate("/admin/payments");
    } catch (error: any) {
      console.error("Update payment error:", error);
      showMessage(error.message || "Failed to update payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialValues) {
    return <p>Loading payment details...</p>;
  }

  return (
    <>
      {/* Breadcrumbs */}
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
        <li>
          <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Dashboard
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:bg-primary before:rounded-full before:mx-4">
          <Link to="/admin/payments" className="text-primary">
            Payments
          </Link>
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
        {({ setFieldValue, errors, submitCount, isSubmitting }) => (
          <Form className="space-y-5">
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Payment Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                {/* SRF No */}
                <div className={submitCount && errors.srfClient ? "has-error" : submitCount ? "has-success" : ""}>
                  <label htmlFor="srfClient">SRF No.</label>
                  <Field as="select" name="srfClient" className="form-select w-full">
                    <option value="" disabled>
                      Select SRF No.
                    </option>
                    {srfClientOptions.map((option) => (
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
                  <Field
                    type="number"
                    name="totalAmount"
                    className="form-input w-full"
                    placeholder="Total Amount"
                  />
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
                        {type}
                      </option>
                    ))}
                  </Field>

                  <ErrorMessage name="paymentType" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* UTR Number */}
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
                      }
                    }}
                    className="form-input w-full"
                  />
                  <ErrorMessage name="screenshot" component="div" className="text-red-500 text-sm mt-1" />
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-1">Preview:</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover border rounded shadow"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-success mt-4 disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update Payment"}
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default Edit;
