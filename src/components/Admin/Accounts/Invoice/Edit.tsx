import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { invoicedata } from '../../../../data';
import Breadcrumb, { BreadcrumbItem } from '../../../../components/common/Breadcrumb';
import IconHome from '../../../../components/Icon/IconHome';
import IconCreditCard from '../../../../components/Icon/IconCreditCard';
import { showMessage } from '../../../common/ShowMessage';

const validationSchema = Yup.object().shape({
  invoiceId: Yup.string().required('Invoice ID is required'),
  buyerName: Yup.string().required('Buyer name is required'),
  address: Yup.string().required('Address is required'),
  state: Yup.string().required('State is required'),
  gstin: Yup.string().required('GSTIN is required'),
  machineType: Yup.string().required('Machine type is required'),
  quantity: Yup.number().required('Quantity is required').positive().integer(),
  rate: Yup.number().required('Rate is required').positive(),
});

const Edit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const invoice = invoicedata.find((inv: any) => inv.id === Number(id));

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
    { label: `Edit ${invoice.invoiceId}` },
  ];

  return (
    <div className="panel">
      <Breadcrumb items={breadcrumbItems} />
      <h2 className="text-lg font-semibold mb-6">Edit Invoice</h2>

      <Formik
        initialValues={{
          invoiceId: invoice.invoiceId,
          buyerName: invoice.buyerName,
          address: invoice.address,
          state: invoice.state,
          gstin: invoice.gstin,
          machineType: invoice.machineType,
          quantity: invoice.quantity,
          rate: invoice.rate,
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          const totalAmount = values.quantity * values.rate;
          const updatedInvoice = { ...values, id: invoice.id, totalAmount };

          console.log('Updated Invoice:', updatedInvoice);
          showMessage('Invoice updated successfully', 'success');
          navigate('/admin/invoice');
        }}
      >
        {({ values }) => (
          <Form className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label>Invoice ID</label>
                <Field name="invoiceId" className="form-input" />
                <ErrorMessage name="invoiceId" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label>Buyer Name</label>
                <Field name="buyerName" className="form-input" />
                <ErrorMessage name="buyerName" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label>Address</label>
                <Field name="address" className="form-input" />
                <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label>State</label>
                <Field name="state" className="form-input" />
                <ErrorMessage name="state" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label>GSTIN</label>
                <Field name="gstin" className="form-input" />
                <ErrorMessage name="gstin" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label>Machine Type</label>
                <Field name="machineType" className="form-input" />
                <ErrorMessage name="machineType" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label>Quantity</label>
                <Field name="quantity" type="number" className="form-input" />
                <ErrorMessage name="quantity" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label>Rate</label>
                <Field name="rate" type="number" className="form-input" />
                <ErrorMessage name="rate" component="div" className="text-red-500 text-sm" />
              </div>
              <div>
                <label>Total Amount</label>
                <div className="font-medium mt-2">₹{values.quantity * values.rate}</div>
              </div>
            </div>

            <div className="mt-6">
              <button type="submit" className="btn btn-success">Update Invoice</button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Edit;
