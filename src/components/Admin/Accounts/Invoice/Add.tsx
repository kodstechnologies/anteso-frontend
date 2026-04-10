import React, { useEffect, useState } from 'react';
import { Field, Form, Formik, ErrorMessage, FieldArray, useFormikContext, FieldProps } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { getAllSrfNumber, getAllDetails, createInvoice, getDealerOrders, getAllManufacturer } from '../../../../api';
import { showMessage } from '../../../../components/common/ShowMessage';

// Define interfaces for type safety
interface OptionType {
  value: string;
  label: string;
  category?: string;
  leadType?: string;
  orderId?: string;
}

interface ServiceItem {
  machineType?: string;
  description?: string;
  quantity?: number;
  /** Legacy unit rate (Customer); prefer totalAmount for line totals. */
  rate?: number;
  /** Line total for the machine (same meaning as order service totalAmount). */
  totalAmount?: number;
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
  travelCostType?: string;
  travelCostPrice?: number;
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

const workTypeOptions: OptionType[] = [
  { value: 'Quality Assurance Test', label: 'Quality Assurance Test' },
  { value: 'License for Operation', label: 'License for Operation' },
  { value: 'Decommissioning', label: 'Decommissioning' },
  { value: 'Decommissioning and Recommissioning', label: 'Decommissioning and Recommissioning' },
];

const WorkTypeMultiSelectField: React.FC<{ name: string }> = ({ name }) => (
  <Field name={name}>
    {({ field, form }: FieldProps) => {
      const selectedValues = String(field.value || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      return (
        <Select
          isMulti
          options={workTypeOptions}
          className="w-full"
          classNamePrefix="select"
          value={workTypeOptions.filter((option) => selectedValues.includes(option.value))}
          onChange={(selectedOptions) => {
            const values = (selectedOptions || []).map((option) => option.value);
            form.setFieldValue(name, values.join(', '));
          }}
          onBlur={() => form.setFieldTouched(name, true)}
          menuPortalTarget={document.body}
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: '38px',
              fontSize: '0.875rem',
              padding: '0px 4px',
              borderColor: state.isFocused ? '#3b82f6' : base.borderColor,
              boxShadow: state.isFocused ? '0 0 0 0px #3b82f6' : base.boxShadow,
            }),
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          }}
        />
      );
    }}
  </Field>
);

// SRF Machine options
const machineOptions: OptionType[] = [
  "Radiography (Fixed)",
  "Radiography (Mobile)",
  "Radiography (Portable)",
  "Radiography and Fluoroscopy",
  "Interventional Radiology",
  "C-Arm",
  "O-Arm",
  "Computed Tomography",
  "Mammography",
  "Dental Cone Beam CT",
  "Ortho Pantomography (OPG)",
  "Dental (Intra Oral)",
  "Dental (Hand-held)",
  "Bone Densitometer (BMD)",
  "KV Imaging (OBI)",
  "Radiography (Mobile) with HT",
  "Lead Apron/Thyroid Shield/Gonad Shield",
  "Others",
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
      totalAmount: Yup.number().min(0, 'Total amount cannot be negative'),
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
          totalAmount: Yup.number().min(0, 'Total amount cannot be negative'),
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

/** Line total: prefer totalAmount; else quantity × rate (legacy). */
const serviceLineTotal = (s: ServiceItem): number => {
  const ta = Number(s.totalAmount);
  if (!Number.isNaN(ta) && ta > 0) return ta;
  const q = Number(s.quantity) || 0;
  const r = Number(s.rate) || 0;
  return q * r;
};

// GrandTotalDisplay Component
const GrandTotalDisplay: React.FC = () => {
  const { values } = useFormikContext<FormValues>();

  let servicesSubtotal = 0;
  let additionalSubtotal = 0;
  let dealerSubtotal = 0;
  let subtotal = 0;

  if (values.type === 'Customer') {
    servicesSubtotal = values.services.reduce(
      (sum: number, s: ServiceItem) => sum + serviceLineTotal(s),
      0
    );
    additionalSubtotal = values.additionalServices.reduce(
      (sum: number, as: AdditionalService) => sum + (Number(as.totalAmount) || 0),
      0
    );
    subtotal = servicesSubtotal + additionalSubtotal;
  } else if (values.type === 'Dealer/Manufacturer') {
    dealerSubtotal = values.dealerHospitals.reduce((sum: number, d: DealerHospital) => {
      const dhServicesSubtotal = (d.services || []).reduce(
        (s: number, service: ServiceItem) => s + serviceLineTotal(service),
        0
      );
      const dhAdditionalSubtotal = (d.additionalServices || []).reduce(
        (s: number, as: AdditionalService) => s + (Number(as.totalAmount) || 0),
        0
      );
      const dhTravel = Number(d.travelCostPrice) || 0;
      return sum + dhServicesSubtotal + dhAdditionalSubtotal + dhTravel;
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
        (sum: number, s: ServiceItem) => sum + serviceLineTotal(s),
        0
      );
      const additionalSubtotal = values.additionalServices.reduce(
        (sum: number, as: AdditionalService) => sum + (Number(as.totalAmount) || 0),
        0
      );
      subtotal = servicesSubtotal + additionalSubtotal;
    } else if (values.type === 'Dealer/Manufacturer') {
      const dealerSubtotal = values.dealerHospitals.reduce((sum: number, d: DealerHospital) => {
        const dhServicesSubtotal = (d.services || []).reduce(
          (s: number, service: ServiceItem) => s + serviceLineTotal(service),
          0
        );
        const dhAdditionalSubtotal = (d.additionalServices || []).reduce(
          (s: number, as: AdditionalService) => s + (Number(as.totalAmount) || 0),
          0
        );
        const dhTravel = Number(d.travelCostPrice) || 0;
        return sum + dhServicesSubtotal + dhAdditionalSubtotal + dhTravel;
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
          (s: number, service: ServiceItem) => s + serviceLineTotal(service),
          0
        );
        const dhAdditionalSubtotal = (dh.additionalServices || []).reduce(
          (s: number, as: AdditionalService) => s + (Number(as.totalAmount) || 0),
          0
        );
        const dhTravel = Number(dh.travelCostPrice) || 0;
        setFieldValue(`dealerHospitals[${index}].amount`, dhServicesSubtotal + dhAdditionalSubtotal + dhTravel);
      });
    }
  }, [values, setFieldValue]);

  return null;
};

const Add = () => {
  const [srfOptions, setSrfOptions] = useState<OptionType[]>([]);
  const [orderMap, setOrderMap] = useState<Record<string, string>>({});
  const [manufacturers, setManufacturers] = useState<any[]>([]);
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
        // console.log("🚀 ~ fetchSrfNumbers ~ customerRes:", customerRes);
        if (customerRes?.data?.success) {
          const customerData = Array.isArray(customerRes.data.data) ? customerRes.data.data : [];
          const customerOptions = customerData
            .filter((item: any) => {
              const leadType = String(item?.leadType || '').trim().toLowerCase();
              // Keep only customer entries from this API response.
              return !leadType || leadType === 'customer';
            })
            .map((item: any) => ({
              label: `${item.srfNumber} - ${item.name} (Customer)`,
              value: item.srfNumber,
              category: 'Customer',
              orderId: item.orderId,
            }));
          options = [...options, ...customerOptions];
          customerOptions.forEach((item: any) => {
            map[`Customer::${item.value}`] = item.orderId;
          });
        }

        // Dealer + Manufacturer orders (same API; leadType distinguishes)
        const dealerRes = await getDealerOrders();
        if (dealerRes?.success && Array.isArray(dealerRes.data)) {
          const dmOptions = dealerRes.data
            .filter((item: any) => {
              const leadType = String(item?.leadType || '').trim().toLowerCase();
              return leadType === 'dealer' || leadType === 'manufacturer';
            })
            .map((item: any) => {
              const leadType = String(item?.leadType || '').trim().toLowerCase();
              const tag = leadType === 'manufacturer' ? '(Manufacturer)' : '(Dealer)';
              return {
                label: `${item.srfNumber} ${tag}`,
                value: item.srfNumber,
                category: 'Dealer/Manufacturer',
                leadType: leadType === 'manufacturer' ? 'Manufacturer' : 'Dealer',
                orderId: item._id,
              };
            });
          options = [...options, ...dmOptions];
          dmOptions.forEach((item: any) => {
            map[`Dealer/Manufacturer::${item.value}`] = item.orderId;
          });
        }

        // Fetch manufacturers to resolve fixed travel cost for Manufacturer leadOwner
        const manufacturerRes = await getAllManufacturer().catch(() => null);
        const manufacturerList =
          Array.isArray(manufacturerRes?.data?.data)
            ? manufacturerRes.data.data
            : Array.isArray(manufacturerRes?.data)
              ? manufacturerRes.data
              : [];
        setManufacturers(manufacturerList);

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
          services: [{ machineType: '', description: '', quantity: 1, rate: 0, totalAmount: 0, hsnno: '' }],
          additionalServices: [],
          dealerHospitals: [{ partyCode: '', hospitalName: '', city: '', dealerState: '', modelNo: '', amount: 0, travelCostType: '', travelCostPrice: 0, services: [], additionalServices: [] }],
        }}
        validationSchema={InvoiceSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            console.log('Submitting form with values:', JSON.stringify(values, null, 2));
            const isNonEmptyText = (v: any) => String(v ?? '').trim().length > 0;
            const isPositiveNumber = (v: any) => Number(v) > 0;

            const cleanedCustomerServices: ServiceItem[] = (values.services || []).filter((s) => {
              return (
                isNonEmptyText(s.machineType) ||
                isNonEmptyText(s.description) ||
                isNonEmptyText(s.hsnno) ||
                isPositiveNumber(s.quantity) ||
                isPositiveNumber(s.totalAmount) ||
                isPositiveNumber(s.rate)
              );
            });

            const cleanedCustomerAdditional: AdditionalService[] = (values.additionalServices || []).filter((as) => {
              return (
                isNonEmptyText(as.name) ||
                isNonEmptyText(as.description) ||
                isPositiveNumber(as.totalAmount)
              );
            });

            const cleanedDealerHospitals: DealerHospital[] = (values.dealerHospitals || [])
              .map((dh) => ({
                ...dh,
                services: (dh.services || []).filter((s) => {
                  return (
                    isNonEmptyText(s.machineType) ||
                    isNonEmptyText(s.description) ||
                    isNonEmptyText(s.hsnno) ||
                    isPositiveNumber(s.quantity) ||
                    isPositiveNumber(s.totalAmount) ||
                    isPositiveNumber(s.rate)
                  );
                }),
                additionalServices: (dh.additionalServices || []).filter((as) => {
                  return (
                    isNonEmptyText(as.name) ||
                    isNonEmptyText(as.description) ||
                    isPositiveNumber(as.totalAmount)
                  );
                }),
              }))
              .filter((dh) => {
                return (
                  isNonEmptyText(dh.partyCode) ||
                  isNonEmptyText(dh.hospitalName) ||
                  isNonEmptyText(dh.city) ||
                  isNonEmptyText(dh.dealerState) ||
                  isNonEmptyText(dh.modelNo) ||
                  isPositiveNumber(dh.travelCostPrice) ||
                  (dh.services && dh.services.length > 0) ||
                  (dh.additionalServices && dh.additionalServices.length > 0)
                );
              });

            let subtotal = 0;
            if (values.type === 'Customer') {
              const servicesSubtotal = cleanedCustomerServices.reduce((sum, s) => sum + serviceLineTotal(s), 0);
              const additionalSubtotal = cleanedCustomerAdditional.reduce((sum, as) => sum + (Number(as.totalAmount) || 0), 0);
              subtotal = servicesSubtotal + additionalSubtotal;
            } else if (values.type === 'Dealer/Manufacturer') {
              const dealerSubtotal = cleanedDealerHospitals.reduce((sum, d) => {
                const dhServicesSubtotal = (d.services || []).reduce(
                  (s, service) => s + serviceLineTotal(service),
                  0
                );
                const dhAdditionalSubtotal = (d.additionalServices || []).reduce(
                  (s, as) => s + (Number(as.totalAmount) || 0),
                  0
                );
                const dhTravel = Number(d.travelCostPrice) || 0;
                return sum + dhServicesSubtotal + dhAdditionalSubtotal + dhTravel;
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
              services: values.type === 'Customer' ? cleanedCustomerServices : [],
              additionalServices: values.type === 'Customer' ? cleanedCustomerAdditional : [],
              dealerHospitals: values.type === 'Dealer/Manufacturer' ? cleanedDealerHospitals : [],
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
        {({ values, setFieldValue }) => {
          const selectedSRF = srfOptions.find(
            (opt) => opt.value === values.srfNumber && (!values.type || opt.category === values.type)
          );
          const isDealer = selectedSRF?.leadType === 'Dealer';
          const isManufacturer = selectedSRF?.leadType === 'Manufacturer';
          const dmHeading = isDealer ? "Dealer Details" : isManufacturer ? "Manufacturer Details" : "Dealer / Manufacturer Details";

          return (
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
                    setFieldValue('services', [{ machineType: '', description: '', quantity: 1, rate: 0, totalAmount: 0, hsnno: '' }]);
                    setFieldValue('additionalServices', []);
                    setFieldValue('dealerHospitals', [{ partyCode: '', hospitalName: '', city: '', dealerState: '', modelNo: '', amount: 0, travelCostType: '', travelCostPrice: 0, services: [], additionalServices: [] }]);
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
                    const selectedOrderId = orderMap[`${values.type}::${selectedValue}`];
                    const selectedOption = srfOptions.find(
                      (opt) => opt.value === selectedValue && opt.category === values.type
                    );
                    setOrderId(selectedOrderId || '');

                    if (selectedOrderId) {
                      try {
                        const res = await getAllDetails(selectedOrderId);
                        // console.log("🚀 ~ SRF Number onChange ~ res:", res);
                        if (res?.success && res.data) {
                          const details = res.data;
                          const enquiryServices = details?.quotation?.enquiry?.services || [];
                          const norm = (v: any) => String(v || '').trim().toLowerCase();
                          const resolveServiceTotal = (s: any) => {
                            const direct = Number(s?.totalAmount) || 0;
                            if (direct > 0) return direct;

                            const key = norm(s?.machineType);
                            const fromEnquiryExact = enquiryServices.find((es: any) => norm(es?.machineType) === key);
                            const fromEnquiryPartial = !fromEnquiryExact
                              ? enquiryServices.find((es: any) => {
                                const n = norm(es?.machineType);
                                return n && key && (n.includes(key) || key.includes(n));
                              })
                              : null;
                            const enquiryTotal = Number(fromEnquiryExact?.totalAmount || fromEnquiryPartial?.totalAmount) || 0;
                            if (enquiryTotal > 0) return enquiryTotal;

                            const qty = Number(s?.quantity) || 1;
                            const rate = Number(s?.price || s?.rate) || 0;
                            return qty * rate;
                          };
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
                              const mappedServices: ServiceItem[] = details.services.map((s: any) => {
                                const qty = s.quantity || 1;
                                const total = resolveServiceTotal(s);
                                return {
                                  machineType: s.machineType || '',
                                  description: (s.workTypeDetails || []).map((w: any) => w.workType).join(', ') || '',
                                  quantity: qty,
                                  totalAmount: total,
                                  rate: qty > 0 ? total / qty : 0,
                                  hsnno: s.machineModel || '',
                                };
                              });
                              setFieldValue('services', mappedServices);
                            } else {
                              setFieldValue('services', [{ machineType: '', description: '', quantity: 1, rate: 0, totalAmount: 0, hsnno: '' }]);
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
                            setFieldValue('dealerHospitals', [{ partyCode: '', hospitalName: '', city: '', dealerState: '', modelNo: '', amount: 0, travelCostType: '', travelCostPrice: 0, services: [], additionalServices: [] }]);
                          }
                          else if (values.type === 'Dealer/Manufacturer') {
                            let mainSubtotal = (details.quotation?.subtotal || 0) - (details.advanceAmount || 0);
                            const sourceServices: any[] =
                              details.services?.length
                                ? details.services
                                : (details.quotation?.enquiry?.services || []);
                            const mappedServices: ServiceItem[] = sourceServices.length
                              ? sourceServices.map((s: any) => {
                                const qty = s.quantity || 1;
                                const total = resolveServiceTotal(s);
                                return {
                                  machineType: s.machineType || '',
                                  description: (s.workTypeDetails || []).map((w: any) => w.workType).join(', ') || '',
                                  quantity: qty,
                                  totalAmount: total,
                                  rate: qty > 0 ? total / qty : 0,
                                  hsnno: s.machineModel || '',
                                };
                              })
                              : [];
                            const sourceAdditional: any[] =
                              details.additionalServices?.length
                                ? details.additionalServices
                                : (details.quotation?.enquiry?.additionalServices || []);
                            const mappedAdditional: AdditionalService[] = sourceAdditional.length
                              ? sourceAdditional.map((as: any) => ({
                                name: as.name || '',
                                description: as.description || '',
                                totalAmount: as.totalAmount || 0,
                              }))
                              : [];

                            // If lead owner is Manufacturer with fixed travel cost, keep it as separate travel fields.
                            const selectedManufacturer =
                              selectedOption?.leadType === 'Manufacturer'
                                ? manufacturers.find((m: any) => String(m._id) === String(details.leadOwner))
                                : null;
                            const fixedTravelCost =
                              selectedManufacturer?.cost != null &&
                              selectedManufacturer?.cost !== ''
                                ? Number(selectedManufacturer.cost)
                                : 0;
                            const dealerHospital: DealerHospital = {
                              partyCode: details.partyCodeOrSysId || '',
                              hospitalName: details.hospitalName || '',
                              city: details.city || '',
                              dealerState: details.state || '',
                              modelNo: '',
                              amount: mainSubtotal,
                              travelCostType: selectedManufacturer?.travelCost || '',
                              travelCostPrice: fixedTravelCost > 0 ? fixedTravelCost : 0,
                              services: mappedServices,
                              additionalServices: mappedAdditional,
                            };
                            setFieldValue('dealerHospitals', [dealerHospital]);
                            setFieldValue('services', []);
                            setFieldValue('additionalServices', []);
                          } else {
                            setFieldValue('dealerHospitals', [{ partyCode: '', hospitalName: '', city: '', dealerState: '', modelNo: '', amount: 0, travelCostType: '', travelCostPrice: 0, services: [], additionalServices: [] }]);
                            setFieldValue('services', [{ machineType: '', description: '', quantity: 1, rate: 0, totalAmount: 0, hsnno: '' }]);
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
                    .filter((opt) => {
                      if (!values.type) return true;
                      return opt.category === values.type;
                    })
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
                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start mb-4">
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

                          <div className="md:col-span-2">
                            <label className="block mb-1 font-medium">Work Type</label>
                            <WorkTypeMultiSelectField name={`services[${index}].description`} />
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
                            <label className="block mb-1 font-medium">Total amount</label>
                            <Field
                              name={`services[${index}].totalAmount`}
                              type="number"
                              className="form-input"
                              placeholder="0"
                            />
                            <ErrorMessage
                              name={`services[${index}].totalAmount`}
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
                              totalAmount: 0,
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
                        <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4">
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

                          <div className="md:col-span-2">
                            <label className="block mb-1 font-medium">Description</label>
                            <Field
                              as="textarea"
                              rows={3}
                              name={`additionalServices[${index}].description`}
                              className="form-input min-h-[4.5rem] resize-y"
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
                <h5 className="font-semibold text-lg mb-4">{dmHeading}</h5>
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

                            {!isDealer && (
                              <>
                                <div>
                                  <label className="block mb-1 font-medium">Travel Cost Type</label>
                                  <Field
                                    name={`dealerHospitals[${index}].travelCostType`}
                                    type="text"
                                    className="form-input bg-gray-50"
                                    placeholder="-"
                                    readOnly
                                  />
                                </div>

                                <div>
                                  <label className="block mb-1 font-medium">Travel Cost Price</label>
                                  <Field
                                    name={`dealerHospitals[${index}].travelCostPrice`}
                                    type="number"
                                    className="form-input bg-gray-50"
                                    placeholder="0"
                                    readOnly
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {/* Nested Service Details */}
                          <div className="ml-4 mt-4">
                            <h6 className="font-semibold text-md mb-2">Service Details</h6>
                            <FieldArray name={`dealerHospitals[${index}].services`}>
                              {({ push: pushService, remove: removeService }) => (
                                <>
                                  {values.dealerHospitals[index].services?.map((_, serviceIndex) => (
                                    <div key={serviceIndex} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start mb-4">
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

                                      <div className="md:col-span-2">
                                        <label className="block mb-1 font-medium">Work Type</label>
                                        <WorkTypeMultiSelectField
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].description`}
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
                                        <label className="block mb-1 font-medium">Total amount</label>
                                        <Field
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].totalAmount`}
                                          type="number"
                                          className="form-input"
                                          placeholder="0"
                                        />
                                        <ErrorMessage
                                          name={`dealerHospitals[${index}].services[${serviceIndex}].totalAmount`}
                                          component="div"
                                          className="text-red-500 text-sm mt-1"
                                        />
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
                                          totalAmount: 0,
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
                                    <div key={additionalIndex} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4">
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

                                      <div className="md:col-span-2">
                                        <label className="block mb-1 font-medium">Description</label>
                                        <Field
                                          as="textarea"
                                          rows={3}
                                          name={`dealerHospitals[${index}].additionalServices[${additionalIndex}].description`}
                                          className="form-input min-h-[4.5rem] resize-y"
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
                              travelCostType: '',
                              travelCostPrice: 0,
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
          );
        }}
      </Formik>
    </div>
  );
};

export default Add;