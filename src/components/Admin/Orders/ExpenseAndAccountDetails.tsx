import React, { useEffect, useState } from "react";
import IconEye from "../../Icon/IconEye";
import FadeInModal from "../../common/FadeInModal";
import { getPaymentDeyailsByOrderId, getTrackExpensesByOrderId } from "../../../api";

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

const formatMoney = (value: any) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: any) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ExpenseAndAccountDetails = ({ orderId }: { orderId: string }) => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [trackExpenses, setTrackExpenses] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await getPaymentDeyailsByOrderId(orderId);
        setPayments(res.payments || []);
      } catch (error) {
        console.error("❌ Error fetching payments:", error);
      }
    };

    const fetchTrackExpenses = async () => {
      try {
        setLoadingTracks(true);
        const res = await getTrackExpensesByOrderId(orderId);
        setTrackExpenses(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        console.error("❌ Error fetching tracked expenses:", error);
        setTrackExpenses([]);
      } finally {
        setLoadingTracks(false);
      }
    };

    if (orderId) {
      fetchPayments();
      fetchTrackExpenses();
    }
  }, [orderId]);

  return (
    <div>
      <h5 className="text-lg font-bold text-gray-800 mb-6">
        Expense and Accounts Details
      </h5>

      <div className="mb-8">
        <h6 className="text-base font-semibold text-gray-800 mb-3">QA Expense Tracking</h6>
        {loadingTracks ? (
          <p className="text-gray-500 text-sm">Loading expense tracking...</p>
        ) : trackExpenses.length === 0 ? (
          <p className="text-gray-500 text-sm">No tracked QA expenses found for this order.</p>
        ) : (
          <div className="space-y-4">
            {trackExpenses.map((doc) => (
              <div key={doc._id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase text-gray-500 font-semibold">Date</p>
                    <p className="font-medium text-gray-800">{formatDate(doc.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 font-semibold">Technician</p>
                    <p className="font-medium text-gray-800">{doc.technician?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 font-semibold">Machines</p>
                    <p className="font-medium text-gray-800">{doc.noOfMachines || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 font-semibold">Total Required</p>
                    <p className="font-medium text-gray-800">{formatMoney(doc.totalRequiredAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 font-semibold">Cost / Revenue</p>
                    <p className="font-medium text-gray-800">
                      {formatMoney(doc.cost)} / {formatMoney(doc.revenue)}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white border-t border-b border-gray-200">
                      <tr className="text-left text-xs uppercase text-gray-500">
                        <th className="px-3 py-2">Machine Type</th>
                        <th className="px-3 py-2">Technician</th>
                        <th className="px-3 py-2">QA Test Done At</th>
                        <th className="px-3 py-2">Trip</th>
                        <th className="px-3 py-2">No. of Machines</th>
                        <th className="px-3 py-2">Total Required</th>
                        <th className="px-3 py-2">Cost</th>
                        <th className="px-3 py-2">Revenue</th>
                        <th className="px-3 py-2">Expenses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(doc.items || []).map((item: any, idx: number) => (
                        <tr key={item._id || idx} className="border-b border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-800">{item.machineType || "—"}</td>
                          <td className="px-3 py-2 text-gray-700">
                            {item.technician?.name || doc.technician?.name || "—"}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{formatDate(item.qaTestDoneAt)}</td>
                          <td className="px-3 py-2 text-gray-700">{item.trip?.tripName || "—"}</td>
                          <td className="px-3 py-2 text-gray-700">{item.noOfMachines || 0}</td>
                          <td className="px-3 py-2 text-gray-700">{formatMoney(item.totalRequiredAmount)}</td>
                          <td className="px-3 py-2 text-gray-700">{formatMoney(item.cost)}</td>
                          <td className="px-3 py-2 text-gray-700">{formatMoney(item.revenue)}</td>
                          <td className="px-3 py-2 text-gray-700">
                            {(item.expenses || []).length ? (
                              <div className="space-y-1">
                                {item.expenses.map((exp: any) => (
                                  <p key={exp._id || exp}>
                                    {exp.typeOfExpense || "Expense"}: {formatMoney(exp.requiredAmount)}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <h6 className="text-base font-semibold text-gray-800 mb-3">Payment Details</h6>
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
