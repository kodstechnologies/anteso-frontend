import React, { useEffect, useState } from 'react';
import { Field, Form, Formik, ErrorMessage, FieldArray, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import { getAllSrfNumber, getAllDetails, createInvoice } from '../../../../api'; 

interface OptionType {
  value: string;
  label: string;
}

interface ServiceItem {
  machineType: string;
  description: string;
  quantity: number;
  rate: number;
  hsnno: string;
}

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
  srfNumber: Yup.string().required('SRF Number is required'),
  buyerName: Yup.string().required('Buyer Name is required'),
  address: Yup.string().required('Address is required'),
  state: Yup.string().required('State is required'),
  gstPercent: Yup.number().required('GST % is required').min(0).max(100),
  // discountPercent: Yup.number().required('Discount % is required').min(0).max(100),
  services: Yup.array().of(
    Yup.object().shape({
      machineType: Yup.string(),
      description: Yup.string(),
      quantity: Yup.number().integer('Must be an integer'),
      // .positive('Must be positive')
      rate: Yup.number(),
      hsnno: Yup.string(),
    })
  ).min(1, 'At least one service is required'),
});

// API call to fetch details by orderId
// export const getAllDetails = async (orderId: string) => {
//   try {
//     const token = Cookies.get('accessToken');
//     const res = await api.get(`/invoice/all-details-by-orderId/${orderId}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return res.data;
//   } catch (error: any) {
//     console.error('🚀 ~ getAllDetails ~ error:', error);
//     throw new Error(error?.response?.data?.message || 'Failed to getAllDetails');
//   }
// };

// Grand total display component
const GrandTotalDisplay: React.FC = () => {
  const { values } = useFormikContext<{
    services: ServiceItem[];
    taxes: { [key: string]: { checked: boolean; amount: any } };
    discountPercent: number; // 👈 flat discount amount (already applied in backend)
    amount: number; // 👈 backend grand total
  }>();

  // Subtotal from services
  const subtotal = values.services.reduce(
    (sum, s) => sum + s.quantity * s.rate,
    0
  );

  // ✅ GST based on percentage
  const gstDetails = ['cgst', 'sgst', 'igst'].map((tax) => {
    const percent = parseFloat(values.taxes[tax].amount) || 0;
    const amount = values.taxes[tax].checked ? (subtotal * percent) / 100 : 0;
    return { tax, percent, amount };
  });

  const gstAmount = gstDetails.reduce((total, t) => total + t.amount, 0);

  // ✅ Discount (just display — not applied again)
  const discountAmount = parseFloat(String(values.discountPercent)) || 0;

  // ✅ Use backend grand total (already discounted)
  const grandTotal = values.amount || subtotal + gstAmount;
  return (
    <div className="text-right font-bold text-lg mt-4">
      <div>Subtotal: ₹{subtotal.toFixed(2)}</div>

      {gstDetails.map(
        ({ tax, percent, amount }) =>
          values.taxes[tax].checked && (
            <div key={tax}>
              {tax.toUpperCase()} ({percent}%): ₹{amount.toFixed(2)}
            </div>
          )
      )}

      <div>Discount: -₹{discountAmount.toFixed(2)}</div>

      <div className="mt-2">Grand Total: ₹{grandTotal.toFixed(2)}</div>
    </div>
  );
};

const Add = () => {
  const [srfOptions, setSrfOptions] = useState<OptionType[]>([]);
  const [orderMap, setOrderMap] = useState<Record<string, string>>({}); // map srfNumber -> orderId
  const [orderId, setOrderId] = useState<string>('');

  // Fetch SRF numbers
  useEffect(() => {
    const fetchSrfNumbers = async () => {
      try {
        const res = await getAllSrfNumber();
        console.log("🚀 ~ fetchSrfNumbers ~ res:", res)
        if (res?.data?.success) {
          const options = res.data.data.map((item: any) => ({
            label: item.srfNumber + ' - ' + item.name,
            value: item.srfNumber,
          }));
          const map: Record<string, string> = {};
          res.data.data.forEach((item: any) => {
            map[item.srfNumber] = item.orderId; // map srfNumber to orderId
          });
          setSrfOptions(options);
          setOrderMap(map);
        }
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

      <Formik
        initialValues={{
          type: '',
          srfNumber: '',
          buyerName: '',
          address: '',
          state: '',
          amount: 0,
          remarks: '',
          subtotal: 0,
          discountedAmount: 0,
          grandTotal: 0,
          taxes: { cgst: { checked: false, amount: 0 }, sgst: { checked: false, amount: 0 }, igst: { checked: false, amount: 0 } },
          discountPercent: 0,
          gstPercent: 0, // ✅ Add this
          services: [{ machineType: '', description: '', quantity: 1, rate: 0, hsnno: '' }],
          dealerHospitals: [{ partyCode: '', hospitalName: '', location: '', dealerState: '', modelNo: '', amount: '' }],
        }}

        validationSchema={InvoiceSchema}
        // onSubmit={async (values, { setSubmitting, resetForm }) => {
        //   try {
        //     console.log("Formik submit triggered", values); // ✅ debug

        //     const subtotal = values.services.reduce((sum, s) => sum + s.quantity * s.rate, 0);
        //     const gstAmount = ['cgst', 'sgst', 'igst'].reduce((total, tax) => {
        //       const percent = parseFloat(values.taxes[tax].amount) || 0;
        //       return total + (values.taxes[tax].checked ? (subtotal * percent) / 100 : 0);
        //     }, 0);
        //     const discountAmount = parseFloat(String(values.discountPercent)) || 0;
        //     const grandTotal = subtotal + gstAmount - discountAmount;

        //     const payload = { ...values, amount: grandTotal, grandTotal };

        //     const res = await createInvoice(payload);
        //     console.log("Invoice created:", res);
        //     alert("Invoice created successfully!");
        //     resetForm();
        //   } catch (error: any) {
        //     console.error("Failed to create invoice:", error);
        //     alert(error.message || "Failed to create invoice");
        //   } finally {
        //     setSubmitting(false);
        //   }
        // }}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            console.log("Formik submit triggered", values);

            let subtotal = 0;
            if (values.type === 'Customer') {
              subtotal = values.services.reduce((sum, s) => sum + s.quantity * s.rate, 0);
            } else if (values.type === 'Dealer/Manufacturer') {
              subtotal = values.dealerHospitals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
            }

            type TaxType = 'cgst' | 'sgst' | 'igst';

            const gstAmount = (['cgst', 'sgst', 'igst'] as TaxType[]).reduce((total, tax) => {
              const percent = parseFloat(String(values.taxes[tax].amount)) || 0;
              return total + (values.taxes[tax].checked ? (subtotal * percent) / 100 : 0);
            }, 0);


            const discountAmount = parseFloat(String(values.discountPercent)) || 0;
            const grandTotal = subtotal + gstAmount - discountAmount;

            // const payload = { ...values, amount: grandTotal, grandTotal };
            const payload = { ...values, amount: grandTotal, grandTotal, orderId };

            const res = await createInvoice(payload);
            console.log("Invoice created:", res);
            alert("Invoice created successfully!");
            resetForm();
          } catch (error: any) {
            console.error("Failed to create invoice:", error);
            alert(error.message || "Failed to create invoice");
          } finally {
            setSubmitting(false);
          }
        }}


      >

        {({ values, setFieldValue }) => (
          <Form className="space-y-5">

            {/* Invoice Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 panel">

              {/* Type */}
              <div>
                <label htmlFor="type" className="block mb-1 font-medium">Type</label>
                <Field as="select" name="type" className="form-select">
                  <option value="">Select Type</option>
                  <option value="Customer">Customer</option>
                  <option value="Dealer/Manufacturer">Dealer/Manufacturer</option>
                </Field>
                <ErrorMessage name="type" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* SRF Number */}
              <div>
                <label htmlFor="srfNumber" className="block mb-1 font-medium">SRF Number</label>
                {values.type === 'Customer' ? (
                  // <Field
                  //   as="select"
                  //   name="srfNumber"
                  //   className="form-select"
                  //   onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
                  //     // ✅ find orderId from selected option
                  //     const selectedValue = e.target.value;
                  //     setFieldValue('srfNumber', selectedValue);

                  //     // ✅ get orderId from orderMap
                  //     const orderId = orderMap[selectedValue];

                  //     if (orderId) {
                  //       try {
                  //         const res = await getAllDetails(orderId); // 👈 correct call
                  //         if (res?.success && res.data) {
                  //           const details = res.data;
                  //           console.log("🚀 ~ details:", details);

                  //           // ✅ set top-level fields
                  //           setFieldValue('buyerName', details.hospitalName || '');
                  //           setFieldValue('address', details.fullAddress || '');
                  //           setFieldValue('state', details.state || '');

                  //           // ✅ amounts
                  //           setFieldValue('amount', details.grandTotal || details.quotation?.total || 0);
                  //           setFieldValue('discountPercent', details.quotation?.discount || 0);
                  //           // setFieldValue('grandTotal', details.grandTotal || 0);

                  //           // ✅ services mapping
                  //           if (details.services?.length) {
                  //             const mappedServices = details.services.map((s: any) => ({
                  //               machineType: s.machineType || '',
                  //               description: (s.workTypeDetails || []).map((w: any) => w.workType).join(', '),
                  //               quantity: 1,
                  //               rate: details.grandTotal || details.quotation?.total || 0,
                  //               hsnno: s.machineModel || '',
                  //             }));
                  //             setFieldValue('services', mappedServices);
                  //           }
                  //         }
                  //       } catch (error) {
                  //         console.error('Error fetching details:', error);
                  //       }
                  //     }
                  //   }}

                  // >
                  //   <option value="">Select SRF Number</option>
                  //   {srfOptions.map((opt) => (
                  //     <option key={opt.value} value={opt.value}>
                  //       {opt.label}
                  //     </option>
                  //   ))}
                  // </Field>
                  <Field
                    as="select"
                    name="srfNumber"
                    className="form-select"
                    onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
                      const selectedValue = e.target.value;
                      setFieldValue('srfNumber', selectedValue);

                      // Get orderId from orderMap
                      const selectedOrderId = orderMap[selectedValue];
                      setOrderId(selectedOrderId || ''); // ✅ store orderId in local state

                      if (selectedOrderId) {
                        try {
                          const res = await getAllDetails(selectedOrderId);
                          if (res?.success && res.data) {
                            const details = res.data;
                            setFieldValue('buyerName', details.hospitalName || '');
                            setFieldValue('address', details.fullAddress || '');
                            setFieldValue('state', details.state || '');
                            setFieldValue('amount', details.grandTotal || details.quotation?.total || 0);
                            setFieldValue('discountPercent', details.quotation?.discount || 0);

                            if (details.services?.length) {
                              const mappedServices = details.services.map((s: any) => ({
                                machineType: s.machineType || '',
                                description: (s.workTypeDetails || []).map((w: any) => w.workType).join(', '),
                                quantity: 1,
                                rate: details.grandTotal || details.quotation?.total || 0,
                                hsnno: s.machineModel || '',
                              }));
                              setFieldValue('services', mappedServices);
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching details:', error);
                        }
                      }
                    }}
                  >
                    <option value="">Select SRF Number</option>
                    {srfOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Field>

                ) : (
                  <Field
                    name="srfNumber"
                    type="text"
                    className="form-input"
                    placeholder="Enter SRF Number"
                  />
                )}
                <ErrorMessage name="srfNumber" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Buyer Name, Address, State */}
              {['buyerName', 'address', 'state'].map((name) => (
                <div key={name}>
                  <label htmlFor={name} className="block mb-1 font-medium">{name === 'buyerName' ? 'Buyer Name' : name.charAt(0).toUpperCase() + name.slice(1)}</label>
                  <Field name={name} className="form-input" placeholder={`Enter ${name}`} />
                  <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1" />
                </div>
              ))}
            </div>

            {/* Services Section */}
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
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </Field>
                            <ErrorMessage name={`services[${index}].machineType`} component="div" className="text-red-500 text-sm mt-1" />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Description</label>
                            <Field name={`services[${index}].description`} className="form-input" />
                            <ErrorMessage name={`services[${index}].description`} component="div" className="text-red-500 text-sm mt-1" />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Quantity</label>
                            <Field name={`services[${index}].quantity`} type="number" className="form-input" />
                            <ErrorMessage name={`services[${index}].quantity`} component="div" className="text-red-500 text-sm mt-1" />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">Rate</label>
                            <Field name={`services[${index}].rate`} type="number" className="form-input" />
                            <ErrorMessage name={`services[${index}].rate`} component="div" className="text-red-500 text-sm mt-1" />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium">HSN/SAC No</label>
                            <Field name={`services[${index}].hsnno`} type="text" className="form-input" />
                            <ErrorMessage name={`services[${index}].hsnno`} component="div" className="text-red-500 text-sm mt-1" />
                          </div>
                          <div className="flex items-center pt-6">
                            {values.services.length > 1 && <button type="button" onClick={() => remove(index)} className="text-red-500 text-xs">Remove</button>}
                          </div>
                        </div>
                      ))}
                      {/* <button type="button" onClick={() => push({ machineType: '', description: '', quantity: 1, rate: 0, hsnno: '' })} className="btn btn-primary mt-3">
                        + Add Another Service
                      </button> */}
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
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-4"
                        >
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
                            <label className="block mb-1 font-medium">Location</label>
                            <Field
                              name={`dealerHospitals[${index}].location`}
                              type="text"
                              className="form-input"
                            />
                            <ErrorMessage
                              name={`dealerHospitals[${index}].location`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-medium">Dealer State</label>
                            <Field
                              name={`dealerHospitals[${index}].dealerState`}
                              type="text"
                              className="form-input"
                            />
                            <ErrorMessage
                              name={`dealerHospitals[${index}].dealerState`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-medium">Model No</label>
                            <Field
                              name={`dealerHospitals[${index}].modelNo`}
                              type="text"
                              className="form-input"
                            />
                            <ErrorMessage
                              name={`dealerHospitals[${index}].modelNo`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div>
                            <label className="block mb-1 font-medium">Amount</label>
                            <Field
                              name={`dealerHospitals[${index}].amount`}
                              type="number"
                              className="form-input"
                            />
                            <ErrorMessage
                              name={`dealerHospitals[${index}].amount`}
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          <div className="flex items-center pt-6">
                            {values.dealerHospitals.length > 1 && (
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
                      <button
                        type="button"
                        onClick={() =>
                          push({
                            partyCode: "",
                            hospitalName: "",
                            location: "",
                            dealerState: "",
                            modelNo: "",
                            amount: "",
                          })
                        }
                        className="btn btn-primary mt-3"
                      >
                        + Add Another Dealer Hospital
                      </button>
                    </>
                  )}
                </FieldArray>
              </div>
            )}


            {/* Total Amount and Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 panel mt-2">
              <div>
                <label htmlFor="discountPercent" className="block mb-1 font-medium">Discount </label>
                <Field name="discountPercent" type="number" className="form-input" />
                <ErrorMessage name="discountPercent" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="amount" className="block mb-1 font-medium">Total Amount</label>
                <Field name="amount" type="number" className="form-input" />
                <ErrorMessage name="amount" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label htmlFor="remarks" className="block mb-1 font-medium">Remarks</label>
                <Field name="remarks" as="textarea" rows={1} className="form-input" />
                <ErrorMessage name="remarks" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 panel mt-2">
                {['cgst', 'sgst', 'igst'].map((taxType) => (
                  <div key={taxType}>
                    <label className="flex items-center gap-2 font-medium">
                      <Field type="checkbox" name={`taxes.${taxType}.checked`} />
                      {taxType.toUpperCase()}
                    </label>
                    <Field name={`taxes.${taxType}.amount`}>
                      {({ field, form }: any) =>
                        form.values.taxes[taxType].checked && (
                          <input {...field} type="number" placeholder={`Enter ${taxType.toUpperCase()} amount`} className="form-input mt-1" />
                        )
                      }
                    </Field>
                  </div>
                ))}
              </div>
            </div>

            {/* Taxes and Discount */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-5 panel mt-2">
            </div> */}
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


            <div className="flex justify-end">
              <button type="submit" className="btn btn-success">Submit Invoice</button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Add;
