import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import IconHome from "../../../../components/Icon/IconHome";
import IconCreditCard from "../../../../components/Icon/IconCreditCard";
import Breadcrumb, {
  BreadcrumbItem,
} from "../../../../components/common/Breadcrumb";
import { getPaymentById } from "../../../../api"; // ✅ import your API function

const View = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        const res = await getPaymentById(id); // ✅ call backend
        setPayment(res.data.data); // because backend wraps in { statusCode, data, message }
      } catch (err: any) {
        setError(err.message || "Failed to fetch payment");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPayment();
  }, [id]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Dashboard", to: "/", icon: <IconHome /> },
    { label: "Payments", to: "/admin/payments", icon: <IconCreditCard /> },
    { label: "View Payment", icon: <IconCreditCard /> },
  ];

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading payment details…</div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!payment) {
    return (
      <div className="p-6 text-center text-gray-500">Payment not found</div>
    );
  }

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />

      <div className="bg-white rounded-lg shadow-md p-6 mt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
          Payment Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Detail label="Payment ID" value={payment.paymentId} />
          <Detail label="SRF Number" value={payment.srfNumber} />
          <Detail label="Hospital" value={payment.hospitalName} />
          <Detail label="Total Amount" value={`₹ ${payment.totalAmount}`} />
          <Detail label="Payment Amount" value={`₹ ${payment.paymentAmount}`} />
          <Detail label="Payment Type" value={payment.paymentType} />
          <Detail label="UTR Number" value={payment.utrNumber || "N/A"} />
          {/* <Detail
            label="Invoice Generated"
            value={payment.paymentType === "complete" ? "Yes" : "No"}
          /> */}
        </div>

        {/* Screenshot Section */}
        {payment.screenshot && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Payment Screenshot
            </h3>
            <img
              src={payment.screenshot}
              alt="Screenshot"
              className="w-full max-w-md rounded-lg border shadow-md object-contain"
            />
          </div>
        )}
      </div>
    </>
  );
};

const Detail = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="bg-gray-50 rounded-md p-4 shadow-sm border hover:shadow transition-all">
    <span className="block text-sm font-medium text-gray-500 mb-1">
      {label}
    </span>
    <div className="text-base text-gray-800 font-semibold">{value}</div>
  </div>
);

export default View;
