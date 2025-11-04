import React, { useEffect, useState } from 'react';
import { Field, Form, Formik, ErrorMessage, FieldArray, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { getAllSrfNumber, getAllDetails, createInvoice, getDealerOrders } from '../../../../api';
import { showMessage } from '../../../../components/common/ShowMessage';

// Define interfaces for type safety
interface OptionType {
  value: string;
  label: string;
}

interface ServiceItem {
  machineType?: string;
  description?: string;
  quantity?: number;
  rate?: number;
  hsnno?: string;
}

interface AdditionalService {
  name?: string;
  description?: string;
  totalAmount?: number;
}

interface DealerHospital {
  partyCode?: string;
  hospitalName?: string;
  city?: string;
  dealerState?: string;
  modelNo?: string;
  amount?: number;
  services?: ServiceItem[];
  additionalServices?: AdditionalService[];
}

interface FormValues {
  type: string;
  srfNumber: string;
  buyerName: string;
  address: string;
  state: string;
  amount: number;
  remarks: string;
  subtotal: number;
  grandTotal: number;
  taxes: {
    cgst: { checked: boolean; amount: number };
    sgst: { checked: boolean; amount: number };
    igst: { checked: boolean; amount: number };
  };
  discountPercent: number;
  services: ServiceItem[];
  additionalServices: AdditionalService[];
  dealerHospitals: DealerHospital[];
}

// Define tax keys as a union type
type TaxType = 'cgst' | 'sgst' | 'igst';

// SRF Machine options
const machineOptions: OptionType[] = [
  'Fixed X-Ray', 'Mobile X-Ray', 'C-Arm', 'Cath Lab/Interventional Radiology',
  'Mammography', 'CT Scan', 'PET CT', 'CT Simulator', 'OPG', 'CBCT',
  'BMD/DEXA', 'Dental IOPA', 'Dental Hand Held', 'O Arm', 'KV Imaging (OBI)',
  'Lead Apron Test', 'Thyroid Shield Test', 'Gonad Shield Test',
  'Radiation Survey of Radiation Facility', 'Others',
].map(label => ({ label, value: label }));

// Validation Schema
const InvoiceSchema = Yup.object().shape({
  type: Yup.string().required('Invoice Type is required'),
  srfNumber: Yup.string().required('SRF Number is required'),
  buyerName: Yup.string().required('Buyer Name is required'),
  address: Yup.string().required('Address is required'),
  state: Yup.string().required('State is required'),
  services: Yup.array().of(
    Yup.object().shape({
      machineType: Yup.string(),
      description: Yup.string(),
      quantity: Yup.number().integer('Must be an integer').min(1, 'Quantity must be at least 1'),
      rate: Yup.number().min(0, 'Rate cannot be negative'),
      hsnno: Yup.string(),
    })
  ),
  additionalServices: Yup.array().of(
    Yup.object().shape({
      name: Yup.string(),
      description: Yup.string(),
      totalAmount: Yup.number().min(0, 'Amount cannot be negative'),
    })
  ),
  dealerHospitals: Yup.array().of(
    Yup.object().shape({
      partyCode: Yup.string(),
      hospitalName: Yup.string(),
      city: Yup.string(),
      dealerState: Yup.string(),
      modelNo: Yup.string(),
      amount: Yup.number().min(0, 'Amount cannot be negative'),
      services: Yup.array().of(
        Yup.object().shape({
          machineType: Yup.string(),
          description: Yup.string(),
          quantity: Yup.number().integer('Must be an integer').min(1, 'Quantity must be at least 1'),
          rate: Yup.number().min(0, 'Rate cannot be negative'),
          hsnno: Yup.string(),
        })
      ),
      additionalServices: Yup.array().of(
        Yup.object().shape({
          name: Yup.string(),
          description: Yup.string(),
          totalAmount: Yup.number().min(0, 'Amount cannot be negative'),
        })
      ),
    })
  ).when('type', {
    is: 'Dealer/Manufacturer',
    then: (schema) =>
      schema
        .test(
          'dealerHospitals',
          'At least one dealer hospital entry is required',
          (value: DealerHospital[] | undefined) => {
            return !!value && value.length > 0;
          }
        )
        .test(
          'services-or-additionalServices',
          'At least one service or additional service is required for each dealer hospital',
          (value: DealerHospital[] | undefined) => {
            if (!value) return false;
            return value.every(
              (dh) =>
                (dh.services && dh.services.length > 0) ||
                (dh.additionalServices && dh.additionalServices.length > 0)
            );
          }
        ),
    otherwise: (schema) => schema.notRequired(),
  }),
});

// GrandTotalDisplay Component
const GrandTotalDisplay: React.FC = () => {
  const { values } = useFormikContext<FormValues>();

  let servicesSubtotal = 0;
  let additionalSubtotal = 0;
  let dealerSubtotal = 0;
  let subtotal = 0;

  if (values.type === 'Customer') {
    servicesSubtotal = values.services.reduce(
      (sum: number, s: ServiceItem) => sum + (s.quantity || 0) * (s.rate || 0),
      0
    );
    additionalSubtotal = values.additionalServices.reduce(
      (sum: number, as: AdditionalService) => sum + (as.totalAmount || 0),
      0
    );
    subtotal = servicesSubtotal + additionalSubtotal;
  } else if (values.type === 'Dealer/Manufacturer') {
    dealerSubtotal = values.dealerHospitals.reduce((sum: number, d: DealerHospital) => {
      const dhServicesSubtotal = (d.services || []).reduce(
        (s: number, service: ServiceItem) => s + (service.quantity || 0) * (service.rate || 0),
        0
      );
      const dhAdditionalSubtotal = (d.additionalServices || []).reduce(
        (s: number, as: AdditionalService) => s + (as.totalAmount || 0),
        0
      );
      return sum + dhServicesSubtotal + dhAdditionalSubtotal;
    }, 0);
    subtotal = dealerSubtotal;
  }

  const discountPercent = values.discountPercent || 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const discountedSubtotal = subtotal - discountAmount;

  const gstDetails = (['cgst', 'sgst', 'igst'] as TaxType[]).map((tax) => {
    const percent = values.taxes[tax].amount || 0;
    const amount = values.taxes[tax].checked ? (discountedSubtotal * percent) / 100 : 0;
    return { tax, percent, amount };
  });

  const gstAmount = gstDetails.reduce((total, t) => total + t.amount, 0);
  const grandTotal = discountedSubtotal + gstAmount;

  return (
    <div className="text-right font-bold text-lg mt-4">
      {values.type === 'Customer' || values.type === 'Dealer/Manufacturer' ? (
        <>
          {servicesSubtotal > 0 && <div>Services Subtotal: ₹{servicesSubtotal.toFixed(2)}</div>}
          {additionalSubtotal > 0 && <div>Additional Subtotal: ₹{additionalSubtotal.toFixed(2)}</div>}
          {dealerSubtotal > 0 && <div>Dealer Hospitals Subtotal: ₹{dealerSubtotal.toFixed(2)}</div>}
          <div>Subtotal: ₹{subtotal.toFixed(2)}</div>
          <div>Discount ({discountPercent}%): -₹{discountAmount.toFixed(2)}</div>
          <div>Discounted Subtotal: ₹{discountedSubtotal.toFixed(2)}</div>
          {gstDetails.map(
            ({ tax, percent, amount }) =>
              values.taxes[tax].checked && (
                <div key={tax}>
                  {tax.toUpperCase()} ({percent}%): ₹{amount.toFixed(2)}
                </div>
              )
          )}
          <div className="mt-2">Grand Total: ₹{grandTotal.toFixed(2)}</div>
        </>
      ) : (
        <div>Please select an invoice type to view totals.</div>
      )}
    </div>
  );
};

// AutoCalculateTotals Component
const AutoCalculateTotals: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  useEffect(() => {
    let subtotal = 0;
    if (values.type === 'Customer') {
      const servicesSubtotal = values.services.reduce(
        (sum: number, s: ServiceItem) => sum + (s.quantity || 0) * (s.rate || 0),
        0
      );
      const additionalSubtotal = values.additionalServices.reduce(
        (sum: number, as: AdditionalService) => sum + (as.totalAmount || 0),
        0
      );
      subtotal = servicesSubtotal + additionalSubtotal;
    } else if (values.type === 'Dealer/Manufacturer') {
      const dealerSubtotal = values.dealerHospitals.reduce((sum: number, d: DealerHospital) => {
        const dhServicesSubtotal = (d.services || []).reduce(
          (s: number, service: ServiceItem) => s + (service.quantity || 0) * (service.rate || 0),
          0
        );
        const dhAdditionalSubtotal = (d.additionalServices || []).reduce(
          (s: number, as: AdditionalService) => s + (as.totalAmount || 0),
          0
        );
        return sum + dhServicesSubtotal + dhAdditionalSubtotal;
      }, 0);
      subtotal = dealerSubtotal;
    }

    const discountPercent = values.discountPercent || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const discountedSubtotal = subtotal - discountAmount;

    const gstAmount = (['cgst', 'sgst', 'igst'] as TaxType[]).reduce((total, tax) => {
      const percent = values.taxes[tax].amount || 0;
      return total + (values.taxes[tax].checked ? (discountedSubtotal * percent) / 100 : 0);
    }, 0);

    const grandTotal = discountedSubtotal + gstAmount;

    setFieldValue('subtotal', subtotal);
    setFieldValue('grandTotal', grandTotal);
    setFieldValue('amount', grandTotal);

    // Update dealerHospitals amount for each entry
    if (values.type === 'Dealer/Manufacturer') {
      values.dealerHospitals.forEach((dh: DealerHospital, index: number) => {
        const dhServicesSubtotal = (dh.services || []).reduce(
          (s: number, service: ServiceItem) => s + (service.quantity || 0) * (service.rate || 0),
          0
        );
        const dhAdditionalSubtotal = (dh.additionalServices || []).reduce(
          (s: number, as: AdditionalService) => s + (as.totalAmount || 0),
          0
        );
        setFieldValue(`dealerHospitals[${index}].amount`, dhServicesSubtotal + dhAdditionalSubtotal);
      });
    }
  }, [values, setFieldValue]);

  return null;
};

const Add = () => {
  const [srfOptions, setSrfOptions] = useState<OptionType[]>([]);
  const [orderMap, setOrderMap] = useState<Record<string, string>>({});
  const [orderId, setOrderId] = useState<string>('');
  const navigate = useNavigate();
  const sellerState = 'Maharashtra';

  // Fetch SRF numbers
  useEffect(() => {
    const fetchSrfNumbers = async () => {
      try {
        let options: OptionType[] = [];
        let map: Record<string, string> = {};

        // Fetch customer orders
        const customerRes = await getAllSrfNumber();
        console.log("🚀 ~ fetchSrfNumbers ~ customerRes:", customerRes);
        if (customerRes?.data?.success) {
          const customerOptions = customerRes.data.data.map((item: any) => ({
            label: `${item.srfNumber} - ${item.name} (Customer)`,
            value: item.srfNumber,
          }));
          options = [...options, ...customerOptions];
          customerRes.data.data.forEach((item: any) => {
            map[item.srfNumber] = item.orderId;
          });
        }

        // Fetch dealer orders
        const dealerRes = await getDealerOrders();
        console.log("🚀 ~ fetchSrfNumbers ~ dealerRes:", dealerRes);
        if (dealerRes?.success) {
          const dealerOptions = dealerRes.data.map((item: any) => ({
            label: `${item.srfNumber} (Dealer)`,
            value: item.srfNumber,
          }));
          options = [...options, ...dealerOptions];
          dealerRes.data.forEach((item: any) => {
            map[item.srfNumber] = item._id;
          });
        }

        setSrfOptions(options);
        setOrderMap(map);
      } catch (error) {
        console.error('Error fetching SRF numbers:', error);
      }
    };

    fetchSrfNumbers();
  }, []);

  return (
    <div>
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
        <li><Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">Dashboard</Link></li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="/admin/clients" className="text-primary">Invoice</Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <span>Add Invoice</span>
        </li>
      </ol>

      <h5 className="font-semibold text-lg mb-4">Add Invoice</h5>

      <Formik<FormValues>
        initialValues={{
          type: '',
          srfNumber: '',
          buyerName: '',
          address: '',
          state: '',
          amount: 0,
          remarks: '',
          subtotal: 0,
          grandTotal: 0,
          taxes: { cgst: { checked: false, amount: 0 }, sgst: { checked: false, amount: 0 }, igst: { checked: false, amount: 0 } },
          discountPercent: 0,
          services: [{ machineType: '', description: '', quantity: 1, rate: 0, hsnno: '' }],
          additionalServices: [],
          dealerHospitals: [{ partyCode: '', hospitalName: '', city: '', dealerState: '', modelNo: '', amount: 0, services: [], additionalServices: [] }],
        }}
        validationSchema={InvoiceSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            console.log('Submitting form with values:', JSON.stringify(values, null, 2));
            let subtotal = 0;
            if (values.type === 'Customer') {
              const servicesSubtotal = values.services.reduce((sum, s) => sum + (s.quantity || 0) * (s.rate || 0), 0);
              const additionalSubtotal = values.additionalServices.reduce((sum, as) => sum + (as.totalAmount || 0), 0);
              subtotal = servicesSubtotal + additionalSubtotal;
            } else if (values.type === 'Dealer/Manufacturer') {
              const dealerSubtotal = values.dealerHospitals.reduce((sum, d) => {
                const dhServicesSubtotal = (d.services || []).reduce(
                  (s, service) => s + (service.quantity || 0) * (service.rate || 0),
                  0
                );
                const dhAdditionalSubtotal = (d.additionalServices || []).reduce(
                  (s, as) => s + (as.totalAmount || 0),
                  0
                );
                return sum + dhServicesSubtotal + dhAdditionalSubtotal;
              }, 0);
              subtotal = dealerSubtotal;
            }

            const discountPercent = values.discountPercent || 0;
            const discountAmount = (subtotal * discountPercent) / 100;
            const discountedSubtotal = subtotal - discountAmount;

            const gstAmount = (['cgst', 'sgst', 'igst'] as TaxType[]).reduce((total, tax) => {
              const percent = values.taxes[tax].amount || 0;
              return total + (values.taxes[tax].checked ? (discountedSubtotal * percent) / 100 : 0);
            }, 0);

            const grandTotal = discountedSubtotal + gstAmount;

            const payload = {
              ...values,
              amount: grandTotal,
              grandTotal,
              orderId,
              subtotal,
            };
            console.log('Payload to API:', JSON.stringify(payload, null, 2));
            console.log('additionalServices in payload:', payload.additionalServices);
            console.log('dealerHospitals in payload:', payload.dealerHospitals);

            const res = await createInvoice(payload);
            console.log('Invoice created:', res);
            showMessage('Invoice created successfully!');
            resetForm();
            navigate('/admin/invoice');
          } catch (error: any) {
            console.error('Failed to create invoice:', error);
            showMessage(error.message || 'Failed to create invoice', 'error');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, setFieldValue }) => (
          <Form className="space-y-5">
            <AutoCalculateTotals />

            {/* Invoice Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 panel">
              <div>
                <label htmlFor="type" className="block mb-1 font-medium">Type</label>
                <Field
                  as="select"
                  name="type"
                  className="form-select"
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setFieldValue('type', e.target.value);
                    setFieldValue('srfNumber', '');
                    setOrderId('');
                    setFieldValue('buyerName', '');
                    setFieldValue('address', '');
                    setFieldValue('state', '');
                    setFieldValue('services', [{ machineType: '', description: '', quantity: 1, rate: 0, hsnno: '' }]);
                    setFieldValue('additionalServices', []);
                    setFieldValue('dealerHospitals', [{ partyCode: '', hospitalName: '', city: '', dealerState: '', modelNo: '', amount: 0, services: [], additionalServices: [] }]);
                    setFieldValue('taxes', { cgst: { checked: false, amount: 0 }, sgst: { checked: false, amount: 0 }, igst: { checked: false, amount: 0 } });
                    setFieldValue('discountPercent', 0);
                  }}
                >
                  <option value="">Select Type</option>
                  <option value="Customer">Customer</option>
                  <option value="Dealer/Manufacturer">Dealer/Manufacturer</option>
                </Field>
                <ErrorMessage name="type" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <label htmlFor="srfNumber" className="block mb-1 font-medium">SRF Number</label>
                <Field
                  as="select"
                  name="srfNumber"
                  className="form-select"
                  onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const selectedValue = e.target.value;
                    setFieldValue('srfNumber', selectedValue);
                    const selectedOrderId = orderMap[selectedValue];
                    setOrderId(selectedOrderId || '');

                    if (selectedOrderId) {
                      try {
                        const res = await getAllDetails(selectedOrderId);
                        console.log("🚀 ~ SRF Number onChange ~ res:", res);
                        if (res?.success && res.data) {
                          const details = res.data;
                          setFieldValue('buyerName', details.hospitalName || details.dealerName || '');
                          setFieldValue('address', details.fullAddress || details.address || '');
                          setFieldValue('state', details.state || '');
                          setFieldValue('discountPercent', details.quotation?.discount || 0);

                          const gstRate = details.quotation?.gstRate || 0;
                          const isIntraState = details.state === sellerState;
                          if (isIntraState) {
                            setFieldValue('taxes.cgst.checked', true);
                            setFieldValue('taxes.cgst.amount', gstRate / 2);
                            setFieldValue('taxes.sgst.checked', true);
                            setFieldValue('taxes.sgst.amount', gstRate / 2);
                            setFieldValue('taxes.igst.checked', false);
                            setFieldValue('taxes.igst.amount', 0);
                          } else {
                            setFieldValue('taxes.igst.checked', true);
                            setFieldValue('taxes.igst.amount', gstRate);
                            setFieldValue('taxes.cgst.checked', false);
                            setFieldValue('taxes.cgst.amount', 0);
                            setFieldValue('taxes.sgst.checked', false);
                            setFieldValue('taxes.sgst.amount', 0);
                          }

                          if (values.type === 'Customer') {
                            if (details.services?.length) {
                              const mappedServices: ServiceItem[] = details.services.map((s: any) => ({
                                machineType: s.machineType || '',
                                description: (s.workTypeDetails || []).map((w: any) => w.workType).join(', ') || '',
                                quantity: 1,
                                rate: s.totalAmount || 0,  // Use totalAmount directly
                                hsnno: s.machineModel || '',
                              }));
                              setFieldValue('services', mappedServices);
                            } else {
                              setFieldValue('services', [{ machineType: '', description: '', quantity: 1, rate: 0, hsnno: '' }]);
                            }

                            if (details.additionalServices?.length) {
                              const mappedAdditional: AdditionalService[] = details.additionalServices.map((as: any) => ({
                                name: as.name || '',
                                description: as.description || '',
                                totalAmount: as.totalAmount || 0,
                              }));
                              setFieldValue('additionalServices', mappedAdditional);
                            } else {
                              setFieldValue('additionalServices', []);
                            }
                            setFieldValue('dealerHospitals', [{ partyCode: '', hospitalName: '', city: '', dealerState: '', modelNo: '', amount: 0, services: [], additionalServices: [] }]);
                          } else if (values.type === 'Dealer/Manufacturer') {
                            let mainSubtotal = (details.quotation?.subtotal || 0) - (details.advanceAmount || 0);
                            const mappedServices: ServiceItem[] = details.services?.length
                              ? details.services.map((s: any) => ({
                                machineType: s.machineType || '',
                                description: (s.workTypeDetails || []).map((w: any) => w.workType).join(', ') || '',
                                quantity: 1,
                                rate: s.totalAmount || 0,  // Use totalAmount directly
                                hsnno: s.machineModel || '',
                              }))
                              : [];
                            const mappedAdditional: AdditionalService[] = details.additionalServices?.length
                              ? details.additionalServices.map((as: any) => ({
                                name: as.name || '',
                                description: as.description || '',
                                totalAmount: as.totalAmount || 0,
                              }))
                              : [];
                            const dealerHospital: DealerHospital = {
                              partyCode: details.partyCodeOrSysId || '',
                              hospitalName: details.hospitalName || '',
                              city: details.city || '',
                              dealerState: details.state || '',
                              modelNo: '',
                              amount: mainSubtotal,
                              services: mappedServices,
                              additionalServices: mappedAdditional,
                            };
                            setFieldValue('dealerHospitals', [dealerHospital]);
                            setFieldValue('services', []);
                            setFieldValue('additionalServices', []);
                          } else {
                            setFieldValue('dealerHospitals', [{ partyCode: '', hospitalName: '', city: '', dealerState: '', modelNo: '', amount: 0, services: [], additionalServices: [] }]);
                            setFieldValue('services', [{ machineType: '', description: '', quantity: 1, rate: 0, hsnno: '' }]);
                            setFieldValue('additionalServices', []);
                          }
                        }
                      } catch (error) {
                        console.error('Error fetching details:', error);
                      }
                    }
                  }}
                >
                  <option value="">Select SRF Number</option>
                  {srfOptions
                    .filter((opt) => values.type === '' || opt.label.includes(values.type === 'Customer' ? '(Customer)' : '(Dealer)'))
                    .map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                </Field>
                <ErrorMessage name="srfNumber" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {['buyerName', 'address', 'state'].map((name) => (
                <div key={name}>
                  <label htmlFor={name} className="block mb-1 font-medium">{name === 'buyerName' ? 'Buyer Name' : name.charAt(0).toUpperCase() + name.slice(1)}</label>
                  <Field name={name} className="form-input" placeholder={`Enter ${name}`} />
                  <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1" />
                </div>
              ))}
            </div>

            {/* Services Section (for Customer invoices only) */}
            {values.type === 'Customer' && (
              <div className="panel">
                <h5 className="font-semibold text-lg mb-4">Service Details</h5>
                <FieldArray name="services">
                  {({ push, remove }) => (
                    <>
                      {values.services.map((_, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-4">
                          <div>
                            <label className="block mb-1 font-medium">Machine Type</label>
                            <Field as="select" name={`services[${index}].machineType`} className="form-select">
                              <option value="">Select Machine</option>
                              {machineOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Field>
                            <ErrorMessage
                              name={`services[${index}].machineType`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-medium">Description</label>
                            <Field
                              name={`services[${index}].description`}
                              className="form-input"
                              placeholder="Enter description"
                            />
                            <ErrorMessage
                              name={`services[${index}].description`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-medium">Quantity</label>
                            <Field
                              name={`services[${index}].quantity`}
                              type="number"
                              className="form-input"
                              placeholder="1"
                            />
                            <ErrorMessage
                              name={`services[${index}].quantity`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-medium">Rate</label>
                            <Field
                              name={`services[${index}].rate`}
                              type="number"
                              className="form-input"
                              placeholder="0"
                            />
                            <ErrorMessage
                              name={`services[${index}].rate`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-medium">HSN/SAC No</label>
                            <Field
                              name={`services[${index}].hsnno`}
                              type="text"
                              className="form-input"
                              placeholder="Enter HSN/SAC No"
                            />
                            <ErrorMessage
                              name={`services[${index}].hsnno`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div className="flex items-center pt-6">
                            {values.services.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-red-500 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            push({
                              machineType: '',
                              description: '',
                              quantity: 1,
                              rate: 0,
                              hsnno: '',
                            })
                          }
                          className="btn btn-primary mt-3"
                        >
                          + Add Another Service
                        </button>
                      </div>
                    </>
                  )}
                </FieldArray>
              </div>
            )}

            {/* Additional Services Section (for Customer invoices only) */}
            {values.type === 'Customer' && (
              <div className="panel">
                <h5 className="font-semibold text-lg mb-4">Additional Services</h5>
                <FieldArray name="additionalServices">
                  {({ push, remove }) => (
                    <>
                      {values.additionalServices.map((_, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                          <div>
                            <label className="block mb-1 font-medium">Name</label>
                            <Field
                              name={`additionalServices[${index}].name`}
                              className="form-input"
                              placeholder="Enter name"
                            />
                            <ErrorMessage
                              name={`additionalServices[${index}].name`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-medium">Description</label>
                            <Field
                              name={`additionalServices[${index}].description`}
                              className="form-input"
                              placeholder="Enter description"
                            />
                            <ErrorMessage
                              name={`additionalServices[${index}].description`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-medium">Amount</label>
                            <Field
                              name={`additionalServices[${index}].totalAmount`}
                              type="number"
                              className="form-input"
                              placeholder="0"
                            />
                            <ErrorMessage
                              name={`additionalServices[${index}].totalAmount`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div className="flex items-center pt-6">
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-500 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            push({
                              name: '',
                              description: '',
                              totalAmount: 0,
                            })
                          }
                          className="btn btn-primary mt-3"
                        >
                          + Add Additional Service
                        </button>
                      </div>
                    </>
                  )}
                </FieldArray>
              </div>
            )}

            {/* Dealer/Manufacturer Section */}
            {values.type === 'Dealer/Manufacturer' && (
              <div className="panel">
                <h5 className="font-semibold text-lg mb-4">Dealer / Manufacturer Details</h5>
                <FieldArray name="dealerHospitals">
                  {({ push, remove }) => (
                    <>
                      {values.dealerHospitals.map((_, index) => (
                        <div key={index} className="border rounded p-4 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
                            <div>
                              <label className="block mb-1 font-medium">Party Code</label>
                              <Field
                                name={`dealerHospitals[${index}].partyCode`}
                                type="text"
                                className="form-input"
                              />
                              <ErrorMessage
                                name={`dealerHospitals[${index}].partyCode`}
                                component="div"
                                className="text-red-500 text-sm mt-1"
                              />
                            </div>

                            <div>
                              <label className="block mb-1 font-medium">Hospital Name</label>
                              <Field
                                name={`dealerHospitals[${index}].hospitalName`}
                                type="text"
                                className="form-input"
                              />
                              <ErrorMessage
                                name={`dealerHospitals[${index}].hospitalName`}
                                component="div"
                                className="text-red-500 text-sm mt-1"
                              />
                            </div>

                            <div>
                              <label className="block mb-1 font-medium">City</label>
                              <Field
                                name={`dealerHospitals[${index}].city`}
                                type="text"
                                className="form-input"
                              />
                              <ErrorMessage
                                name={`dealerHospitals[${index}].city`}
                                component="div"
                                className="text-red-500 text-sm mt-1"
                              />
                            </div>
                          </div>

                          {/* Nested Service Details */}
                          <div className="ml-4 mt-4">
                            <h6 className="font-semibold text-md mb-2">Service Details</h6>
                            <FieldArray name={`dealerHospitals[${index}].services`}>
                              {({ push: pushService, remove: removeService }) => (
                                <>
                                  {values.dealerHospitals[index].services?.map((_, serviceIndex) => (
                                    <div key={serviceIndex} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-4">
                                      <div>
                                        <label className="block mb-1 font-medium">Machine Type</label>
                                        <Field
                                          as="select"
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].machineType`}
                                          className="form-select"
                                        >
                                          <option value="">Select Machine</option>
                                          {machineOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                              {option.label}
                                            </option>
                                          ))}
                                        </Field>
                                        <ErrorMessage
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].machineType`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>

                                      <div>
                                        <label className="block mb-1 font-medium">Description</label>
                                        <Field
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].description`}
                                          className="form-input"
                                          placeholder="Enter description"
                                        />
                                        <ErrorMessage
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].description`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>

                                      <div>
                                        <label className="block mb-1 font-medium">Quantity</label>
                                        <Field
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].quantity`}
                                          type="number"
                                          className="form-input"
                                          placeholder="1"
                                        />
                                        <ErrorMessage
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].quantity`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>

                                      <div>
                                        <label className="block mb-1 font-medium">Rate</label>
                                        <Field
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].rate`}
                                          type="number"
                                          className="form-input"
                                          placeholder="0"
                                        />
                                        {/* <ErrorMessage
                                          name=`dealerHospitals[${index}].services[${serviceIndex}].rate`
                                        component="div"
                                        className="text-red-500 text-sm mt-1"
                                        /> */}
                                      </div>

                                      <div>
                                        <label className="block mb-1 font-medium">HSN/SAC No</label>
                                        <Field
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].hsnno`}
                                          type="text"
                                          className="form-input"
                                          placeholder="Enter HSN/SAC No"
                                        />
                                        <ErrorMessage
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].hsnno`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>

                                      <div className="flex items-center pt-6">
                                        {values.dealerHospitals[index].services &&
                                          values.dealerHospitals[index].services!.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => removeService(serviceIndex)}
                                              className="text-red-500 text-xs"
                                            >
                                              Remove
                                            </button>
                                          )}
                                      </div>
                                    </div>
                                  ))}

                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        pushService({
                                          machineType: '',
                                          description: '',
                                          quantity: 1,
                                          rate: 0,
                                          hsnno: '',
                                        })
                                      }
                                      className="btn btn-primary mt-3"
                                    >
                                      + Add Service
                                    </button>
                                  </div>
                                </>
                              )}
                            </FieldArray>
                          </div>

                          {/* Nested Additional Services */}
                          <div className="ml-4 mt-4">
                            <h6 className="font-semibold text-md mb-2">Additional Services</h6>
                            <FieldArray name={`dealerHospitals[${index}].additionalServices`}>
                              {({ push: pushAdditional, remove: removeAdditional }) => (
                                <>
                                  {values.dealerHospitals[index].additionalServices?.map((_, additionalIndex) => (
                                    <div key={additionalIndex} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                                      <div>
                                        <label className="block mb-1 font-medium">Name</label>
                                        <Field
                                          name={`dealerHospitals[${index}].additionalServices[${additionalIndex}].name`}
                                          className="form-input"
                                          placeholder="Enter name"
                                        />
                                        <ErrorMessage
                                          name={`dealerHospitals[${index}].additionalServices[${additionalIndex}].name`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>

                                      <div>
                                        <label className="block mb-1 font-medium">Description</label>
                                        <Field
                                          name={`dealerHospitals[${index}].additionalServices[${additionalIndex}].description`}
                                          className="form-input"
                                          placeholder="Enter description"
                                        />
                                        <ErrorMessage
                                          name={`dealerHospitals[${index}].additionalServices[${additionalIndex}].description`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>

                                      <div>
                                        <label className="block mb-1 font-medium">Amount</label>
                                        <Field
                                          name={`dealerHospitals[${index}].additionalServices[${additionalIndex}].totalAmount`}
                                          type="number"
                                          className="form-input"
                                          placeholder="0"
                                        />
                                        <ErrorMessage
                                          name={`dealerHospitals[${index}].additionalServices[${additionalIndex}].totalAmount`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
                                      </div>

                                      <div className="flex items-center pt-6">
                                        <button
                                          type="button"
                                          onClick={() => removeAdditional(additionalIndex)}
                                          className="text-red-500 text-xs"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        pushAdditional({
                                          name: '',
                                          description: '',
                                          totalAmount: 0,
                                        })
                                      }
                                      className="btn btn-primary mt-3"
                                    >
                                      + Add Additional Service
                                    </button>
                                  </div>
                                </>
                              )}
                            </FieldArray>
                          </div>

                          <div className="flex justify-end mt-4">
                            {values.dealerHospitals.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-red-500 text-xs"
                              >
                                Remove Dealer Hospital
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            push({
                              partyCode: '',
                              hospitalName: '',
                              city: '',
                              dealerState: '',
                              modelNo: '',
                              amount: 0,
                              services: [],
                              additionalServices: [],
                            })
                          }
                          className="btn btn-primary mt-3"
                        >
                          + Add Another Dealer Hospital
                        </button>
                      </div>
                    </>
                  )}
                </FieldArray>
              </div>
            )}

            {/* Total Amount and Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 panel mt-2">
              <div>
                <label htmlFor="discountPercent" className="block mb-1 font-medium">Discount %</label>
                <Field name="discountPercent" type="number" className="form-input" placeholder="0" />
                <ErrorMessage name="discountPercent" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="amount" className="block mb-1 font-medium">Total Amount</label>
                <Field name="amount" type="number" className="form-input" readOnly />
                <ErrorMessage name="amount" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="remarks" className="block mb-1 font-medium">Remarks</label>
                <Field name="remarks" as="textarea" rows={1} className="form-input" />
                <ErrorMessage name="remarks" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(['cgst', 'sgst', 'igst'] as TaxType[]).map((taxType) => (
                  <div key={taxType}>
                    <label className="flex items-center gap-2 font-medium">
                      <Field type="checkbox" name={`taxes.${taxType}.checked`} />
                      {taxType.toUpperCase()} %
                    </label>
                    <Field name={`taxes.${taxType}.amount`}>
                      {({ field, form }: any) =>
                        form.values.taxes[taxType].checked && (
                          <input {...field} type="number" placeholder={`Enter ${taxType.toUpperCase()} %`} className="form-input mt-1" />
                        )
                      }
                    </Field>
                    <ErrorMessage name={`taxes.${taxType}.amount`} component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium">Subtotal</label>
                <Field
                  name="subtotal"
                  type="number"
                  readOnly
                  className="w-full px-3 py-2 border rounded bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Grand Total</label>
                <Field
                  name="grandTotal"
                  type="number"
                  readOnly
                  className="w-full px-3 py-2 border rounded bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
            <GrandTotalDisplay />

            <div className="flex justify-end gap-4">
              <button type="submit" className="btn btn-success">Submit Invoice</button>
              <Link to="/admin/invoice" className="btn btn-secondary">Cancel</Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Add;