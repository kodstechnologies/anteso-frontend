import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { paymentdata } from '../../../../data'; // or fetch via API
import IconHome from '../../../../components/Icon/IconHome';
import IconCreditCard from '../../../../components/Icon/IconCreditCard';
import Breadcrumb, { BreadcrumbItem } from '../../../../components/common/Breadcrumb';

const View = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    // In real case, fetch by ID from API. For now, filter from paymentdata
    const paymentData = paymentdata.find((p) => p.id === parseInt(id || '0'));
    setPayment(paymentData);
  }, [id]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', to: '/', icon: <IconHome /> },
    { label: 'Payments', to: '/admin/payments', icon: <IconCreditCard /> },
    { label: 'View Payment', icon: <IconCreditCard /> },
  ];

  if (!payment) {
    return <div className="p-6 text-center text-gray-500">Payment not found</div>;
  }

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />

      <div className="panel p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">View Payment Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Detail label="Payment ID" value={payment.paymentId} />
          <Detail label="SRF" value={payment.srfClient} />
          <Detail label="Total Amount" value={`₹ ${payment.totalAmount}`} />
          <Detail label="Payment Amount" value={`₹ ${payment.paymentAmount}`} />
          <Detail label="Payment Type" value={payment.paymentType} />
          <Detail label="UTR Number" value={payment.utrNumber || 'N/A'} />
          <Detail label="Invoice Generated" value={payment.paymentType === 'Complete' ? 'Yes' : 'No'} />

          {/* Screenshot preview */}
          {/* <div>
            <span className="block text-sm font-semibold text-gray-700 mb-1">Screenshot</span>
            {payment.screenshot ? (
              <img
                src={payment.screenshot} // Use URL or base64
                alt="Screenshot"
                className="w-40 h-40 object-contain border rounded"
              />
            ) : (
              <span className="text-gray-500 text-sm">No screenshot available</span>
            )}
          </div> */}
        </div>

        {/* <div className="mt-6">
          <Link
            to="/admin/payments"
            className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Back to Payments
          </Link>
        </div> */}
      </div>
    </>
  );
};

const Detail = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <span className="block text-sm font-semibold text-gray-700 mb-1">{label}</span>
    <div className="text-gray-800">{value}</div>
  </div>
);

export default View;
