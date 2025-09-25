import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { addTools } from '../../../../api/index'; // adjust this path based on your project structure

interface ToolFormValues {
    nomenclature: string;
    manufacturer: string;
    manufacture_date: string;
    model: string;
    SrNo: string;
    calibrationCertificateNo: string;
    calibrationValidTill: string;
    range: string;
    certificate: File | null | string;
}

const validationSchema = Yup.object().shape({
    nomenclature: Yup.string().required('Please fill the field'),
    manufacturer: Yup.string().required('Please fill the field'),
    manufacture_date: Yup.string().required('Please fill the field'),
    model: Yup.string().required('Please fill the field'),
    SrNo: Yup.string().required('Please fill the field'),
    calibrationCertificateNo: Yup.string().required('Please fill the field'),
    calibrationValidTill: Yup.string().required('Please fill the field'),
    range: Yup.string().required('Please fill the field'),
});

const AddTool = () => {
    const navigate = useNavigate();

    const initialValues: ToolFormValues = {
        nomenclature: '',
        manufacturer: '',
        manufacture_date: '',
        model: '',
        SrNo: '',
        calibrationCertificateNo: '',
        calibrationValidTill: '',
        range: '',
        certificate: '',
    };

    // const handleSubmit = async (values: ToolFormValues) => {
    //     try {
    //         const formData = new FormData();
    //         // Object.entries(values).forEach(([key, value]) => {

    //         //     if (key === 'certificate' && value instanceof File) {
    //         //         formData.append('certificate', value);
    //         //     } else {
    //         //         formData.append(key, value as string);
    //         //     }
    //         // });
    //         Object.entries(values).forEach(([key, value]) => {
    //             if (value instanceof File) {
    //                 formData.append(key, value);
    //             } else {
    //                 formData.append(key, String(value));
    //             }
    //         });

    //         console.log('certificate', values.certificate, typeof values.certificate);

    //         console.log("🚀 ~ handleSubmit ~ formData:", formData)

    //         await addTools(formData);

    //         showMessage('Tool added successfully!', 'success');
    //         navigate('/admin/tools');
    //     } catch (error: any) {
    //         showMessage(error.message || 'Failed to add tool', 'error');
    //     }
    // };
    const handleSubmit = async (values: ToolFormValues) => {
        try {
            const formData = new FormData();

            // Loop through all values
            Object.entries(values).forEach(([key, value]) => {
                if (key === "certificate" && value instanceof File) {
                    formData.append("certificate", value); // attach file
                } else {
                    formData.append(key, value as string);
                }
            });

            // Debugging: check FormData content
            for (let [key, val] of formData.entries()) {
                console.log(`${key}:`, val);
            }

            await addTools(formData); // <-- must send FormData not JSON

            showMessage("Tool added successfully!", "success");
            navigate("/admin/tools");
        } catch (error: any) {
            showMessage(error.message || "Failed to add tool", "error");
        }
    };


    return (
        <>
            {/* Breadcrumb */}
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">Dashboard</Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/tools" className="text-primary">Tools</Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <span className="hover:text-gray-500/70 dark:hover:text-white-dark/70">Add Tools</span>
                </li>
            </ol>

            {/* Formik Form */}
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, setFieldValue, isSubmitting }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Tool Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Text Fields */}
                                {[
                                    { name: 'nomenclature', label: 'Name' },
                                    { name: 'manufacturer', label: 'Manufacture Name' },
                                    { name: 'manufacture_date', label: 'Manufacture Date', type: 'date' },
                                    { name: 'model', label: 'Model' },
                                    { name: 'SrNo', label: 'Sr No' },
                                    { name: 'calibrationCertificateNo', label: 'Calibration Certificate Number' },
                                    { name: 'calibrationValidTill', label: 'Calibration Valid Till', type: 'date' },
                                    { name: 'range', label: 'Range' },
                                    // { name: 'toolID', label: 'Tool ID' },
                                ].map(({ name, label, type = 'text' }) => (
                                    <div key={name} className={touched[name as keyof ToolFormValues] && errors[name as keyof ToolFormValues] ? 'has-error' : ''}>
                                        <label htmlFor={name}>{label}</label>
                                        <Field
                                            name={name}
                                            type={type}
                                            id={name}
                                            placeholder={`Enter ${label}`}
                                            className="form-input"
                                        />
                                        {touched[name as keyof ToolFormValues] && errors[name as keyof ToolFormValues] && (
                                            <div className="text-danger mt-1">{errors[name as keyof ToolFormValues]}</div>
                                        )}
                                    </div>
                                ))}

                                {/* File Upload */}
                                <div className={touched.certificate && errors.certificate ? 'has-error' : ''}>
                                    <label htmlFor="certificate">Upload Calibration Certificate</label>
                                    <input
                                        name="certificate"
                                        type="file"
                                        id="certificate"
                                        className="form-input"
                                        accept=".pdf,.doc,.jpg,.jpeg,.png"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const file = e.currentTarget.files?.[0];
                                            setFieldValue('certificate', file);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="w-[98%] mb-6 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-success mt-4"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Form'}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default AddTool;
