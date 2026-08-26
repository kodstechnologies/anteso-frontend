import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { allOrdersWithClient, getTotalAmount, createPayment, getPaymentsBySrf, getAllManufacturer } from '../../../../api';

const paymentTypes = ['advance', 'balance', 'complete'];
const paymentModes = ['Cash', 'Bank transfer', 'Cheque', 'UPI', 'Other'];

const isCompletePaymentValid = (paymentAmount: number | string, totalAmount: number) => {
  const paid = Number(paymentAmount || 0);
  const total = Number(totalAmount || 0);
  return paid > 0 && total > 0 && paid === total;
};

const completePaymentTypeTest = (value: string | undefined, context: Yup.TestContext) => {
  if (value !== 'complete') return true;
  const { paymentAmount, totalAmount } = context.parent as { paymentAmount?: number | string; totalAmount?: number };
  return isCompletePaymentValid(paymentAmount ?? 0, Number(totalAmount || 0));
};

// Keep schema stable outside the component — recreating it every render makes Formik revalidate and flickers the SRF select.
const PaymentSchema = Yup.object().shape({
  srfClient: Yup.string().required('Please select SRF and Client'),
  totalAmount: Yup.number()
    .required('Total amount is required')
    .positive('Must be positive')
    .min(1, 'Total amount must be at least 1'),
  paymentAmount: Yup.number()
    .required('Payment amount is required')
    .positive('Must be positive')
    .max(Yup.ref('totalAmount'), 'Payment cannot exceed total amount'),
  paymentType: Yup.string()
    .required('Please select payment type')
    .test(
      'complete-requires-full-payment',
      'Complete payment type requires payment amount to equal total amount',
      completePaymentTypeTest
    ),
  paymentMode: Yup.string().required('Please select payment mode'),
  screenshot: Yup.mixed().when('paymentMode', {
    is: 'UPI',
    then: (schema) => schema.required('Please attach a screenshot for UPI payment'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
  utrNumber: Yup.string().nullable(),
});

type SrfOption = {
  value: string;
  label: string;
  _id: string;
  leadOwner?: string | null;
  isPrivilegedOrder?: boolean;
  pricingType?: string | null;
  customPricing?: { qaTests: any[]; services: any[] };
  hasPricingBreakdown?: boolean;
  breakdownSource?: string | null;
  pricingBreakdown?: { services: any[] };
};

type PaymentFormValues = {
  srfClient: string;
  totalAmount: number;
  paymentAmount: number | string;
  paymentType: string;
  paymentMode: string;
  screenshot: File | null;
  utrNumber: string;
  orderId: string;
};

const SrfDropdownField: React.FC<{
  options: SrfOption[];
  dataLoading: boolean;
  onSelect: (selectedSrf: string) => void;
}> = ({ options, dataLoading, onSelect }) => {
  const { values } = useFormikContext<PaymentFormValues>();
  const [open, setOpen] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const selected = useMemo(
    () => options.find((o) => o.value === values.srfClient) || null,
    [options, values.srfClient]
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setMenuReady(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const openMenu = () => {
    if (dataLoading) return;
    setOpen(true);
    setMenuReady(false);
    // Paint loader first, then mount the large list (avoids native-select black screen).
    window.setTimeout(() => setMenuReady(true), 80);
  };

  const closeMenu = () => {
    setOpen(false);
    setMenuReady(false);
  };

  const handlePick = (value: string) => {
    onSelectRef.current(value);
    closeMenu();
  };

  const displayLabel = selected
    ? `${selected.label}${selected.isPrivilegedOrder ? ` (${selected.pricingType} Pricing)` : ''}`
    : 'Select SRF No.';

  if (dataLoading) {
    return (
      <div className="form-select w-full flex items-center gap-2 text-gray-500 pointer-events-none">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading SRF numbers...
      </div>
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="form-select w-full text-left flex items-center justify-between gap-2"
        onClick={() => (open ? closeMenu() : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selected ? 'text-gray-800' : 'text-gray-500'}`}>{displayLabel}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-[#1b2e4b] dark:bg-[#0e1726]">
          {!menuReady ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-600">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading list...
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto overscroll-contain py-1" role="listbox">
              {options.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">No SRF found</li>
              ) : (
                options.map((option) => {
                  const label = `${option.label}${
                    option.isPrivilegedOrder ? ` (${option.pricingType} Pricing)` : ''
                  }`;
                  const isActive = option.value === values.srfClient;
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={`w-full truncate px-3 py-2 text-left text-sm hover:bg-primary/10 ${
                          isActive
                            ? 'bg-primary/15 font-semibold text-primary'
                            : 'text-gray-800 dark:text-white-dark'
                        }`}
                        onClick={() => handlePick(option.value)}
                        title={label}
                      >
                        {label}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

/** Syncs payment type without living inside Formik's render-prop (avoids remount/flicker). */
const PaymentTypeSync: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<PaymentFormValues>();

  useEffect(() => {
    if (!values.srfClient || !values.totalAmount) return;

    const paymentAmountNum = Number(values.paymentAmount || 0);
    const totalAmountNum = Number(values.totalAmount || 0);
    if (Number.isNaN(paymentAmountNum) || Number.isNaN(totalAmountNum)) return;

    if (paymentAmountNum > 0 && paymentAmountNum === totalAmountNum) {
      if (values.paymentType !== 'complete') {
        setFieldValue('paymentType', 'complete', false);
      }
      return;
    }

    let cancelled = false;
    let suggestedType = 'advance';
    if (paymentAmountNum > 0) {
      getPaymentsBySrf(values.srfClient)
        .then((res) => {
          if (cancelled) return;
          if (res.data && res.data.length > 0) {
            suggestedType = 'balance';
          }
          if (values.paymentType !== suggestedType) {
            setFieldValue('paymentType', suggestedType, false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (values.paymentType !== suggestedType) {
            setFieldValue('paymentType', suggestedType, false);
          }
        });
    } else if (values.paymentType !== suggestedType) {
      setFieldValue('paymentType', suggestedType, false);
    }

    return () => {
      cancelled = true;
    };
  }, [values.paymentAmount, values.srfClient, values.totalAmount, setFieldValue]);

  return null;
};

const Add = () => {
  const navigate = useNavigate();
  const [srfClientOptions, setSrfClientOptions] = useState<SrfOption[]>([]);
  const [srfOptionsLoading, setSrfOptionsLoading] = useState(true);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setSrfOptionsLoading(true);
        const res = await allOrdersWithClient();
        const manufacturerRes = await getAllManufacturer().catch(() => null);
        const manufacturerList = Array.isArray(manufacturerRes?.data?.data)
          ? manufacturerRes.data.data
          : Array.isArray(manufacturerRes?.data)
            ? manufacturerRes.data
            : [];
        setManufacturers(manufacturerList);

        const options = (res.data.orders || []).map((order: any) => ({
          value: order.srfNumber,
          label: order.srfNumberWithHospital,
          _id: order._id,
          leadOwner: order.leadOwner || null,
          isPrivilegedOrder: order.isPrivilegedOrder || false,
          pricingType: order.pricingType || null,
          customPricing: order.customPricing || { qaTests: [], services: [] },
          hasPricingBreakdown: order.hasPricingBreakdown || false,
          breakdownSource: order.breakdownSource || null,
          pricingBreakdown: order.pricingBreakdown || { services: [] },
        }));
        setSrfClientOptions(options);
      } catch (error) {
        console.error('Failed to fetch orders', error);
        showMessage('Failed to load orders', 'error');
      } finally {
        setSrfOptionsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const calculateTotalFromCustomPricing = (customPricing: any) => {
    if (!customPricing) return 0;
    let total = 0;
    if (Array.isArray(customPricing.qaTests)) {
      customPricing.qaTests.forEach((test: any) => {
        if (test.price && typeof test.price === 'number') total += test.price;
      });
    }
    if (Array.isArray(customPricing.services)) {
      customPricing.services.forEach((service: any) => {
        if (service.amount && typeof service.amount === 'number') total += service.amount;
      });
    }
    return parseFloat(total.toFixed(2));
  };

  /** Dealer/Manufacturer orders often have empty Service line prices; match machine row to lead qaTests / manufacturer services. */
  const resolveBreakdownLineAmount = (
    row: { serviceName?: string; amount?: number },
    customPricing: { qaTests?: any[]; services?: any[] } | undefined,
    pricingType: string | null
  ) => {
    const n = Number(row.amount);
    if (!Number.isNaN(n) && n > 0) return n;
    const key = (row.serviceName || '').trim().toLowerCase();
    if (!key) return Number.isNaN(n) ? 0 : n;

    const qaTests = customPricing?.qaTests || [];
    const exact = qaTests.find((t: any) => (t.testName || '').trim().toLowerCase() === key);

    if (exact != null && exact.price != null && !Number.isNaN(Number(exact.price))) {
      return Number(exact.price);
    }
    const partial = qaTests.find((t: any) => {
      const tn = (t.testName || '').trim().toLowerCase();
      return tn && (key.includes(tn) || tn.includes(key));
    });
    if (partial != null && partial.price != null && !Number.isNaN(Number(partial.price))) {
      return Number(partial.price);
    }

    if (pricingType === 'Manufacturer' && Array.isArray(customPricing?.services)) {
      const svc = customPricing!.services!.find(
        (s: any) => (s.serviceName || '').trim().toLowerCase() === key
      );
      if (svc != null && svc.amount != null && !Number.isNaN(Number(svc.amount))) {
        return Number(svc.amount);
      }
    }

    return Number.isNaN(n) ? 0 : n;
  };

  const calculateOrderItemsBreakdownTotal = (selectedOption: any, manufacturerList: any[]) => {
    if (!selectedOption?.pricingBreakdown?.services?.length) return 0;

    const itemsTotal = selectedOption.pricingBreakdown.services.reduce((acc: number, service: any) => {
      const lineAmt = selectedOption.isPrivilegedOrder
        ? resolveBreakdownLineAmount(service, selectedOption.customPricing, selectedOption.pricingType)
        : Number(service.amount) || 0;
      return acc + lineAmt;
    }, 0);

    const selectedManufacturer = manufacturerList.find(
      (m) => String(m._id) === String(selectedOption.leadOwner)
    );
    const manufacturerTravelCost =
      selectedOption.pricingType === 'Manufacturer' &&
      selectedManufacturer?.cost != null &&
      selectedManufacturer?.cost !== ''
        ? Number(selectedManufacturer.cost)
        : 0;

    return parseFloat((itemsTotal + manufacturerTravelCost).toFixed(2));
  };

  const handleSrfChange = useCallback(
    async (selectedSrf: string) => {
      const selectedOption = srfClientOptions.find((o) => o.value === selectedSrf);
      if (!selectedOption) return;

      // setFieldValue is read from Formik via a bridge below
      const setFieldValue = srfChangeSetFieldValueRef.current;
      if (!setFieldValue) return;

      setFieldValue('srfClient', selectedOption.value, false);
      setFieldValue('orderId', selectedOption._id, false);

      let suggestedTotal = 0;

      const pricingType = String(selectedOption.pricingType || '').toLowerCase();
      const isDealerOrManufacturer = pricingType === 'dealer' || pricingType === 'manufacturer';

      let fromBreakdown = 0;
      if (
        isDealerOrManufacturer &&
        selectedOption.hasPricingBreakdown &&
        selectedOption.pricingBreakdown?.services?.length
      ) {
        fromBreakdown = calculateOrderItemsBreakdownTotal(selectedOption, manufacturers);
      }

      try {
        const res = await getTotalAmount(selectedSrf);
        const apiTotal = parseFloat(Number(res.data.totalAmount || 0).toFixed(2));
        suggestedTotal = isDealerOrManufacturer ? Math.max(fromBreakdown, apiTotal) : apiTotal;
        if (isDealerOrManufacturer && suggestedTotal > 0) {
          showMessage(`Total amount applied: ₹${suggestedTotal}`, 'info');
        }
      } catch {
        showMessage('Could not fetch total amount', 'error');
        suggestedTotal = isDealerOrManufacturer ? fromBreakdown : 0;
      }

      setFieldValue('totalAmount', suggestedTotal || 0, false);
      setFieldValue('paymentAmount', '', false);
      setFieldValue('paymentType', '', false);
      setFieldValue('paymentMode', '', false);
    },
    [srfClientOptions, manufacturers]
  );

  const srfChangeSetFieldValueRef = useRef<
    ((field: string, value: any, shouldValidate?: boolean) => void) | null
  >(null);

  const initialValues = useMemo<PaymentFormValues>(
    () => ({
      srfClient: '',
      totalAmount: 0,
      paymentAmount: '',
      paymentType: '',
      paymentMode: '',
      screenshot: null,
      utrNumber: '',
      orderId: '',
    }),
    []
  );

  return (
    <>
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
          Add Payment
        </li>
      </ol>

      <Formik
        initialValues={initialValues}
        validationSchema={PaymentSchema}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const formData = new FormData();
            formData.append('orderId', values.orderId);
            formData.append('srfNumber', values.srfClient);
            formData.append('totalAmount', values.totalAmount.toString());
            formData.append('paymentAmount', values.paymentAmount.toString());
            formData.append('paymentType', values.paymentType);
            formData.append('paymentMode', values.paymentMode);
            formData.append('utrNumber', values.utrNumber || '');

            if (values.paymentMode === 'UPI' && values.screenshot) {
              formData.append('screenshot', values.screenshot);
            } else if (values.screenshot) {
              formData.append('screenshot', values.screenshot);
            }

            await createPayment(formData);
            showMessage(`Payment recorded successfully as ${values.paymentType}`, 'success');
            navigate('/admin/payments');
          } catch (error: any) {
            showMessage(error.message || 'Failed to create payment', 'error');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ setFieldValue, setFieldError, values, errors, submitCount, touched }) => {
          const isUpi = values.paymentMode === 'UPI';
          srfChangeSetFieldValueRef.current = setFieldValue;

          return (
            <Form className="space-y-5">
              <PaymentTypeSync />
              <div className="panel">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Payment Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* SRF Dropdown */}
                  <div className={submitCount ? (errors.srfClient ? 'has-error' : 'has-success') : ''}>
                    <label className="text-sm font-semibold text-gray-700">SRF No.</label>
                    <SrfDropdownField
                      options={srfClientOptions}
                      dataLoading={srfOptionsLoading}
                      onSelect={handleSrfChange}
                    />
                    <ErrorMessage name="srfClient" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Total Amount - Editable */}
                  <div className={touched.totalAmount && errors.totalAmount ? 'has-error' : ''}>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Total Amount
                      <span className="text-xs text-gray-500 font-normal">(editable)</span>
                    </label>
                    <Field
                      type="number"
                      name="totalAmount"
                      placeholder="Enter total amount"
                      className="form-input w-full font-bold text-lg text-blue-700"
                      step="0.01"
                    />
                    <ErrorMessage name="totalAmount" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Payment Amount */}
                  <div className={submitCount ? (errors.paymentAmount ? 'has-error' : 'has-success') : ''}>
                    <label className="text-sm font-semibold text-gray-700">Payment Amount</label>
                    <Field
                      type="number"
                      name="paymentAmount"
                      placeholder="Enter payment amount"
                      className="form-input w-full"
                      onChange={(e: any) => {
                        const value = Number(e.target.value);
                        if (value > values.totalAmount) {
                          setFieldValue('paymentAmount', values.totalAmount, false);
                          showMessage('Payment cannot exceed total amount', 'warning');
                          if (Number(values.totalAmount) > 0) {
                            setFieldValue('paymentType', 'complete', false);
                          }
                        } else {
                          setFieldValue('paymentAmount', value, false);
                          if (Number(value) > 0 && Number(value) === Number(values.totalAmount)) {
                            setFieldValue('paymentType', 'complete', false);
                          } else if (values.paymentType === 'complete') {
                            setFieldValue('paymentType', '', false);
                            setFieldError(
                              'paymentType',
                              'Complete payment type requires payment amount to equal total amount'
                            );
                          }
                        }
                      }}
                    />
                    <ErrorMessage name="paymentAmount" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Payment Type */}
                  <div className={submitCount ? (errors.paymentType ? 'has-error' : 'has-success') : ''}>
                    <label className="text-sm font-semibold text-gray-700">Payment Type</label>
                    <Field
                      as="select"
                      name="paymentType"
                      className="form-select w-full"
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const selected = e.target.value;
                        if (
                          selected === 'complete' &&
                          !isCompletePaymentValid(values.paymentAmount, values.totalAmount)
                        ) {
                          showMessage(
                            'Complete payment type requires payment amount to equal total amount',
                            'error'
                          );
                          setFieldError(
                            'paymentType',
                            'Complete payment type requires payment amount to equal total amount'
                          );
                          setFieldValue('paymentType', values.paymentType || '', false);
                          return;
                        }
                        setFieldError('paymentType', undefined);
                        setFieldValue('paymentType', selected, false);
                      }}
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      {paymentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="paymentType" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Payment Mode */}
                  <div className={submitCount ? (errors.paymentMode ? 'has-error' : 'has-success') : ''}>
                    <label className="text-sm font-semibold text-gray-700">Payment Mode</label>
                    <Field
                      as="select"
                      name="paymentMode"
                      className="form-select w-full"
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const mode = e.target.value;
                        setFieldValue('paymentMode', mode, false);
                        if (mode !== 'UPI') {
                          setFieldValue('screenshot', null, false);
                          setImagePreview(null);
                        }
                      }}
                    >
                      <option value="" disabled>
                        Select payment mode
                      </option>
                      {paymentModes.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="paymentMode" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* UTR */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700">UTR Number (Optional)</label>
                    <Field
                      type="text"
                      name="utrNumber"
                      placeholder="Enter UTR"
                      className="form-input w-full"
                      onInput={(e: any) => (e.target.value = e.target.value.toUpperCase())}
                    />
                  </div>

                  {/* Screenshot — mandatory only for UPI */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <div
                      className={
                        submitCount && isUpi ? (errors.screenshot ? 'has-error' : 'has-success') : ''
                      }
                    >
                      <label className="text-sm font-semibold text-gray-700">
                        Attach Screenshot
                        {isUpi ? (
                          <span className="text-red-500 ml-1">*</span>
                        ) : (
                          <span className="text-xs text-gray-500 font-normal ml-1">(required for UPI only)</span>
                        )}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0] || null;
                          setFieldValue('screenshot', file, false);
                          if (file) setImagePreview(URL.createObjectURL(file));
                          else setImagePreview(null);
                        }}
                        className="form-input w-full"
                      />
                      <ErrorMessage name="screenshot" component="div" className="text-red-500 text-sm mt-1" />
                      {imagePreview && (
                        <div className="mt-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover border rounded shadow"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                {values.srfClient &&
                  (() => {
                    const selectedOpt = srfClientOptions.find((o) => o.value === values.srfClient);
                    if (!selectedOpt) return null;

                    if (selectedOpt.hasPricingBreakdown && selectedOpt.pricingBreakdown?.services?.length) {
                      const selectedManufacturer = manufacturers.find(
                        (m) => String(m._id) === String(selectedOpt.leadOwner)
                      );
                      const manufacturerTravelCost =
                        selectedOpt.pricingType === 'Manufacturer' &&
                        selectedManufacturer?.cost != null &&
                        selectedManufacturer?.cost !== ''
                          ? Number(selectedManufacturer.cost)
                          : 0;

                      const breakdownTitle =
                        selectedOpt.breakdownSource === 'Order Items'
                          ? 'Order items breakdown'
                          : `${selectedOpt.breakdownSource} breakdown`;
                      return (
                        <div className="mt-8 p-6 border-2 border-green-200 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
                          <h3 className="text-xl font-bold text-green-900 mb-4">{breakdownTitle}</h3>
                          <div className="grid md:grid-cols-2 gap-8">
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-3">Items</h4>
                              {selectedOpt.pricingBreakdown.services.map((service: any, i: number) => {
                                const lineAmt = selectedOpt.isPrivilegedOrder
                                  ? resolveBreakdownLineAmount(
                                      service,
                                      selectedOpt.customPricing,
                                      selectedOpt.pricingType || null
                                    )
                                  : Number(service.amount) || 0;
                                return (
                                  <div
                                    key={i}
                                    className="flex justify-between bg-white p-3 rounded-lg shadow mb-2"
                                  >
                                    <span>{service.serviceName}</span>
                                    <span className="font-bold text-green-600">₹{lineAmt}</span>
                                  </div>
                                );
                              })}
                              {manufacturerTravelCost > 0 && (
                                <div className="flex justify-between bg-amber-50 p-3 rounded-lg shadow mb-2 border border-amber-200">
                                  <span>Travel Cost</span>
                                  <span className="font-bold text-amber-700">₹{manufacturerTravelCost}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (selectedOpt.isPrivilegedOrder) {
                      return (
                        <div className="mt-8 p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                          <h3 className="text-xl font-bold text-blue-900 mb-4">
                            {selectedOpt.pricingType} Pricing Applied
                          </h3>
                          <div className="grid md:grid-cols-2 gap-8">
                            {selectedOpt.customPricing?.qaTests?.length ? (
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-3">QA Tests</h4>
                                {selectedOpt.customPricing.qaTests.map((test: any, i: number) => (
                                  <div
                                    key={i}
                                    className="flex justify-between bg-white p-3 rounded-lg shadow mb-2"
                                  >
                                    <span>{test.testName}</span>
                                    <span className="font-bold text-green-600">₹{test.price}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {selectedOpt.customPricing?.services?.length ? (
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-3">Services</h4>
                                {selectedOpt.customPricing.services.map((service: any, i: number) => (
                                  <div
                                    key={i}
                                    className="flex justify-between bg-white p-3 rounded-lg shadow mb-2"
                                  >
                                    <span>{service.serviceName}</span>
                                    <span className="font-bold text-green-600">₹{service.amount}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-6 text-right border-t-2 border-blue-300 pt-4">
                            <p className="text-2xl font-bold text-blue-900">
                              Final Total: ₹{values.totalAmount}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}

                <div className="flex justify-end mt-8">
                  <button type="submit" className="btn btn-primary text-lg px-8 py-3">
                    Submit Payment
                  </button>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>
    </>
  );
};

export default Add;
