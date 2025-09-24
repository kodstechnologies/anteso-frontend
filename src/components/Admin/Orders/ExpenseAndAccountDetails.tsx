import React, { useEffect, useState } from "react";
import IconEye from "../../Icon/IconEye";
import FadeInModal from "../../common/FadeInModal";
import { getPaymentDeyailsByOrderId } from "../../../api";

interface Payment {
  _id: string;
  orderId: {
    _id: string;
    hospitalName: string;
    contactPersonName: string;
    srfNumber: string;
  };
  totalAmount: number;
  paymentAmount: number;
  paymentType: string;
  utrNumber: string;
  screenshot: string;
  createdAt: string;
}

const ExpenseAndAccountDetails = ({ orderId }: { orderId: string }) => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await getPaymentDeyailsByOrderId(orderId);
        setPayments(res.payments || []);
      } catch (error) {
        console.error("❌ Error fetching payments:", error);
      }
    };
    if (orderId) fetchPayments();
  }, [orderId]);

  return (
    <div>
      <h5 className="text-lg font-bold text-gray-800 mb-6">
        Expense and Accounts Details
      </h5>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <div
              key={payment._id}
              className="bg-white rounded-lg shadow-md p-4 space-y-4 border"
            >
              <div>
                <span className="font-semibold text-gray-700">SRF No.:</span>
                <p className="text-gray-600 mt-1">
                  {payment.orderId.srfNumber} - {payment.orderId.hospitalName}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Total Amount:</span>
                <p className="text-gray-600 mt-1">₹{payment.totalAmount}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Payment Amount:</span>
                <p className="text-gray-600 mt-1">₹{payment.paymentAmount}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Payment Type:</span>
                <p className="text-gray-600 mt-1 capitalize">
                  {payment.paymentType}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">
                    Payment Screenshot:
                  </span>
                  {payment.screenshot && (
                    <button
                      onClick={() => {
                        setSelectedScreenshot(payment.screenshot);
                        setOpenModal(true);
                      }}
                      className="hover:text-primary"
                    >
                      <IconEye className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
                <p className="text-gray-600 mt-1 mb-2">
                  {payment.screenshot ? "Attached" : "Not Provided"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-3 text-gray-500">No payments found</p>
        )}
      </div>

      <FadeInModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Payment Screenshot"
      >
        {selectedScreenshot ? (
          <img
            src={selectedScreenshot}
            alt="Payment Screenshot"
            className="w-full rounded-lg shadow-md object-contain h-80"
          />
        ) : (
          <p className="text-gray-500">No screenshot available</p>
        )}
      </FadeInModal>
    </div>
  );
};

export default ExpenseAndAccountDetails;
