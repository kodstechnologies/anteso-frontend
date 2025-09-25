import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { invoicedata } from '../../../../data';
import Breadcrumb, { BreadcrumbItem } from '../../../../components/common/Breadcrumb';
import IconHome from '../../../../components/Icon/IconHome';
import IconCreditCard from '../../../../components/Icon/IconCreditCard';

const ViewInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const invoice = invoicedata.find((inv) => inv.id === Number(id));

  if (!invoice) {
    return (
      <div className="text-red-600 font-semibold text-center mt-10">
        Invoice not found
        <div>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/admin/invoice')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', to: '/', icon: <IconHome /> },
    { label: 'Invoices', to: '/admin/invoice', icon: <IconCreditCard /> },
    { label: `Invoice ${invoice.invoiceId}` },
  ];

  return (
    <div className="panel">
      <Breadcrumb items={breadcrumbItems} />

      <h2 className="text-lg font-semibold mb-6">Invoice Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="font-semibold text-gray-700">Invoice ID</label>
          <div>{invoice.invoiceId}</div>
        </div>
        <div>
          <label className="font-semibold text-gray-700">Buyer Name</label>
          <div>{invoice.buyerName}</div>
        </div>
        <div>
          <label className="font-semibold text-gray-700">Address</label>
          <div>{invoice.address}</div>
        </div>
        <div>
          <label className="font-semibold text-gray-700">State</label>
          <div>{invoice.state}</div>
        </div>
        <div>
          <label className="font-semibold text-gray-700">GSTIN</label>
          <div>{invoice.gstin}</div>
        </div>
        <div>
          <label className="font-semibold text-gray-700">Machine Type</label>
          <div>{invoice.machineType}</div>
        </div>
        <div>
          <label className="font-semibold text-gray-700">Quantity</label>
          <div>{invoice.quantity}</div>
        </div>
        <div>
          <label className="font-semibold text-gray-700">Rate</label>
          <div>₹{invoice.rate.toLocaleString()}</div>
        </div>
        <div>
          <label className="font-semibold text-gray-700">Total Amount</label>
          <div className="font-bold text-green-600">₹{invoice.totalAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* <div className="mt-6">
        <Link to="/admin/invoice" className="btn btn-primary">
          Back to Invoice List
        </Link>
      </div> */}
    </div>
  );
};

export default ViewInvoice;
