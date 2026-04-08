import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { addTools, getCustomMachines } from '../../../../api/index'; // adjust this path based on your project structure
import CreatableSelect from 'react-select/creatable';


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
    applicableMachines: string[];
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

const toolOptions = [
    { value: 'Multimeter', label: 'Multimeter' },
    { value: 'Survey meter', label: 'Survey meter' },
    { value: 'Hygrometer', label: 'Hygrometer' },
    { value: 'CT Imaging Phantom', label: 'CT Imaging Phantom' },
    { value: 'Mammo Imaging Phantom', label: 'Mammo Imaging Phantom' },
    { value: 'X-Ray Imaging phantom', label: 'X-Ray Imaging phantom' },
    { value: 'pencil ION chamber', label: 'pencil ION chamber' },
    { value: 'Head and Body phantom', label: 'Head and Body phantom' },
];

const machineOptions = [
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
];

const getApplicableMachines = (toolName: string) => {
    const normalizedToolName = toolName.toLowerCase();

    if (normalizedToolName.includes('multimeter') ||
        normalizedToolName.includes('survey meter') ||
        normalizedToolName.includes('surveymeter') ||
        normalizedToolName.includes('hygrometer')) {
        return [...machineOptions];
    }

    switch (toolName) {
        case 'CT Imaging Phantom':
            return ["Computed Tomography"];
        case 'Mammo Imaging Phantom':
            return ["Mammography"];
        case 'X-Ray Imaging phantom':
            return [
                "Interventional Radiology",
                "C-Arm",
                "KV Imaging (OBI)",
                "Radiography (Fixed)",
                "Radiography (Portable)",
                "Radiography and Fluoroscopy",
                "O-Arm",
                "Radiography (Mobile) with HT",
                "Dental Cone Beam CT",
            ];
        case 'pencil ION chamber':
            return ["Dental Cone Beam CT"];
        case 'Head and Body phantom':
            return ["Computed Tomography", "Dental Cone Beam CT"];
        default:
            return [];
    }
};

const quickSelectOptions = [
    { id: 'multimeterGroup', label: 'Multimeter, Survey Meter, Hygrometer', machines: machineOptions },
    { id: 'ctPhantom', label: 'CT Imaging Phantom', machines: ["Computed Tomography"] },
    { id: 'mammoPhantom', label: 'Mammo Imaging Phantom', machines: ["Mammography"] },
    {
        id: 'xrayPhantom',
        label: 'X-Ray Imaging phantom',
        machines: [
            "Interventional Radiology", "C-Arm", "KV Imaging (OBI)", "Radiography (Fixed)",
            "Radiography (Portable)", "Radiography and Fluoroscopy", "O-Arm",
            "Radiography (Mobile) with HT", "Dental Cone Beam CT"
        ]
    },
    { id: 'pencilIon', label: 'pencil ION chamber', machines: ["Dental Cone Beam CT"] },
    { id: 'headBodyPhantom', label: 'Head and Body phantom', machines: ["Computed Tomography", "Dental Cone Beam CT"] },
];

const AddTool = () => {

    const navigate = useNavigate();
    const [customMachines, setCustomMachines] = useState<string[]>([]);

    useEffect(() => {
        const fetchCustomMachines = async () => {
            try {
                const res = await getCustomMachines();
                if (res?.data) {
                    const names = res.data.map((m: any) => m.name);
                    setCustomMachines(names);
                }
            } catch (error) {
                console.error("❌ Error fetching custom machines:", error);
            }
        };
        fetchCustomMachines();
    }, []);

    const allMachineOptions = [...machineOptions, ...customMachines];
    const uniqueMachineOptions = Array.from(new Set(allMachineOptions));


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
        applicableMachines: [],
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
                } else if (key === "applicableMachines" && Array.isArray(value)) {
                    // Correctly handle the array of machines
                    value.forEach(machine => formData.append("applicableMachines", machine));
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
                {({ errors, touched, setFieldValue, isSubmitting, values }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Tool Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Text Fields */}
                                {/* Tool Name (Creatable Select) */}
                                <div className={`${touched.nomenclature && errors.nomenclature ? 'has-error' : ''} relative z-[200]`}>
                                    <label htmlFor="nomenclature">Name</label>
                                    <CreatableSelect
                                        id="nomenclature"
                                        placeholder="Select or type tool name"
                                        options={toolOptions}
                                        value={toolOptions.find((option) => option.value === values.nomenclature) || (values.nomenclature ? { value: values.nomenclature, label: values.nomenclature } : null)}

                                        onChange={(option) => {
                                            const toolName = option ? option.value : '';
                                            setFieldValue('nomenclature', toolName);
                                            const defaultMachines = getApplicableMachines(toolName);
                                            if (defaultMachines.length > 0) {
                                                setFieldValue('applicableMachines', defaultMachines);
                                            }
                                        }}
                                        onBlur={() => { }}
                                        classNamePrefix="react-select"
                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                        menuPosition="fixed"
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            menu: (base) => ({ ...base, zIndex: 9999 }),
                                        }}
                                    />
                                    {touched.nomenclature && errors.nomenclature && (
                                        <div className="text-danger mt-1">{errors.nomenclature}</div>
                                    )}
                                </div>

                                {/* Text Fields */}
                                {[
                                    { name: 'manufacturer', label: 'Manufacture Name' },
                                    { name: 'model', label: 'Model' },
                                    { name: 'SrNo', label: 'Sr No' },
                                    { name: 'calibrationCertificateNo', label: 'Calibration Certificate Number' },
                                    { name: 'range', label: 'Range' },
                                ].map(({ name, label }) => (
                                    <div key={name} className={touched[name as keyof ToolFormValues] && errors[name as keyof ToolFormValues] ? 'has-error' : ''}>
                                        <label htmlFor={name}>{label}</label>
                                        <Field
                                            name={name}
                                            type="text"
                                            id={name}
                                            placeholder={`Enter ${label}`}
                                            className="form-input"
                                        />
                                        {touched[name as keyof ToolFormValues] && errors[name as keyof ToolFormValues] && (
                                            <div className="text-danger mt-1">{errors[name as keyof ToolFormValues]}</div>
                                        )}
                                    </div>
                                ))}


                                {/* Date Fields with min/max */}
                                {[
                                    { name: 'manufacture_date', label: 'Manufacture Date', type: 'date', maxDate: new Date() },
                                    { name: 'calibrationValidTill', label: 'Calibration Valid Till', type: 'date', minDate: new Date() },
                                ].map(({ name, label, type, minDate, maxDate }) => (
                                    <div key={name} className={touched[name as keyof ToolFormValues] && errors[name as keyof ToolFormValues] ? 'has-error' : ''}>
                                        <label htmlFor={name}>{label}</label>
                                        <Field
                                            name={name}
                                            type={type}
                                            id={name}
                                            placeholder={`Enter ${label}`}
                                            className="form-input"
                                            {...(maxDate ? { max: maxDate.toISOString().split('T')[0] } : {})}
                                            {...(minDate ? { min: minDate.toISOString().split('T')[0] } : {})}
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

                        {/* Applicable Machines */}
                        <div className="panel">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="font-semibold text-lg">Applicable machines</h5>
                            </div>

                            {/* Quick Selection Groups */}
                            {/* <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h6 className="font-bold text-sm mb-3 text-secondary uppercase tracking-wider">Quick Selection Groups</h6>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {quickSelectOptions.map((group) => {
                                        const areAllSelected = group.machines.every(m => values.applicableMachines.includes(m));
                                        return (
                                            <label key={group.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={areAllSelected}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        let newSelection = [...values.applicableMachines];
                                                        if (checked) {
                                                            // Add all machines in this group that aren't already selected
                                                            group.machines.forEach(m => {
                                                                if (!newSelection.includes(m)) newSelection.push(m);
                                                            });
                                                        } else {
                                                            // Remove all machines in this group
                                                            newSelection = newSelection.filter(m => !group.machines.includes(m));
                                                        }
                                                        setFieldValue('applicableMachines', newSelection);
                                                    }}
                                                    className="form-checkbox text-primary h-5 w-5"
                                                />
                                                <span className="text-sm font-medium group-hover:text-primary transition-colors">{group.label}</span>
                                            </label>
                                        );
                                    })}
                                    
                                    <button 
                                        type="button" 
                                        className="text-primary text-xs font-bold hover:underline mt-2 flex items-center"
                                        onClick={() => {
                                            if (values.applicableMachines.length === machineOptions.length) {
                                                setFieldValue('applicableMachines', []);
                                            } else {
                                                setFieldValue('applicableMachines', [...machineOptions]);
                                            }
                                        }}
                                    >
                                        {values.applicableMachines.length === machineOptions.length ? 'DESELECT ALL' : 'SELECT ALL MACHINES'}
                                    </button>
                                </div>
                            </div> */}

                            {/* Full Machine List */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                                {uniqueMachineOptions.map((machine) => (
                                    <label key={machine} className="flex items-center space-x-3 cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors group">
                                        <input
                                            type="checkbox"
                                            name="applicableMachines"
                                            value={machine}
                                            checked={values.applicableMachines.includes(machine)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const currentMachines = values.applicableMachines;
                                                if (checked) {
                                                    setFieldValue('applicableMachines', [...currentMachines, machine]);
                                                } else {
                                                    setFieldValue('applicableMachines', currentMachines.filter((m) => m !== machine));
                                                }
                                            }}
                                            className="form-checkbox text-primary h-4.5 w-4.5"
                                        />
                                        <span className="text-sm group-hover:text-primary transition-colors">{machine}</span>
                                    </label>
                                ))}
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
