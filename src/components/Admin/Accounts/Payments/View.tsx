import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import IconHome from "../../../../components/Icon/IconHome";
import IconCreditCard from "../../../../components/Icon/IconCreditCard";
import IconX from "../../../../components/Icon/IconX";
import Breadcrumb, {
  BreadcrumbItem,
} from "../../../../components/common/Breadcrumb";
import { getPaymentById } from "../../../../api";

const View = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ Modal state

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        const res = await getPaymentById(id);
        setPayment(res.data.data);
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

  // Helper function to format payment mode display
  const formatPaymentMode = (mode: string) => {
    if (!mode) return "N/A";
    return mode;
  };

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
          <Detail label="Payment Mode" value={formatPaymentMode(payment.paymentMode)} />
          <Detail label="UTR Number" value={payment.utrNumber || "N/A"} />
        </div>

        {/* ✅ Clickable Screenshot Section */}
        {payment.screenshot && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Payment Screenshot
            </h3>
            <div
              className="cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsModalOpen(true)}
            >
              <img
                src={payment.screenshot}
                alt="Payment Screenshot"
                className="w-full max-w-md rounded-lg border shadow-md object-contain hover:shadow-lg transition-shadow"
              />
              <p className="text-sm text-blue-600 mt-2 hover:underline">
                Click to view full size
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Full Screen Modal for Screenshot */}
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
                src={payment.screenshot}
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