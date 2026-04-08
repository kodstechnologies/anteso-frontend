import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';
import { getActiveTechnicians, getByToolId, updateTool, getCustomMachines } from '../../../../api';
import { getEngineerByToolId } from '../../../../api';
import CreatableSelect from 'react-select/creatable';

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
    if (normalizedToolName.includes('multimeter') || normalizedToolName.includes('survey meter') || normalizedToolName.includes('surveymeter') || normalizedToolName.includes('hygrometer')) {
        return [...machineOptions];
    }
    switch (toolName) {
        case 'CT Imaging Phantom': return ["Computed Tomography"];
        case 'Mammo Imaging Phantom': return ["Mammography"];
        case 'X-Ray Imaging phantom': return ["Interventional Radiology", "C-Arm", "KV Imaging (OBI)", "Radiography (Fixed)", "Radiography (Portable)", "Radiography and Fluoroscopy", "O-Arm", "Radiography (Mobile) with HT", "Dental Cone Beam CT"];
        case 'pencil ION chamber': return ["Dental Cone Beam CT"];
        case 'Head and Body phantom': return ["Computed Tomography", "Dental Cone Beam CT"];
        default: return [];
    }
};

const quickSelectOptions = [
    { id: 'multimeterGroup', label: 'Multimeter, Survey Meter, Hygrometer', machines: machineOptions },
    { id: 'ctPhantom', label: 'CT Imaging Phantom', machines: ["Computed Tomography"] },
    { id: 'mammoPhantom', label: 'Mammo Imaging Phantom', machines: ["Mammography"] },
    { id: 'xrayPhantom', label: 'X-Ray Imaging phantom', machines: ["Interventional Radiology", "C-Arm", "KV Imaging (OBI)", "Radiography (Fixed)", "Radiography (Portable)", "Radiography and Fluoroscopy", "O-Arm", "Radiography (Mobile) with HT", "Dental Cone Beam CT"] },
    { id: 'pencilIon', label: 'pencil ION chamber', machines: ["Dental Cone Beam CT"] },
    { id: 'headBodyPhantom', label: 'Head and Body phantom', machines: ["Computed Tomography", "Dental Cone Beam CT"] },
];

const EditTool = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [customMachines, setCustomMachines] = useState<string[]>([]);
    const [initialValues, setInitialValues] = useState<any>(null);

    const SubmittedForm = Yup.object().shape({
        nomenclature: Yup.string().required('Please fill the Field'),
        manufacturer: Yup.string().required('Please fill the Field'),
        model: Yup.string().required('Please fill the Field'),
        srNo: Yup.string().required('Please fill the Field'),
        calibrationCertificateNo: Yup.string().required('Please fill the Field'),
        calibrationValidTill: Yup.string().required('Please fill the Field'),
        range: Yup.string().required('Please fill the Field'),
        toolID: Yup.string().required('Please fill the Field'),
        engineerName: Yup.string().required('Please fill the Field'),
        issueDate: Yup.string().required('Please fill the Field'),
        submitDate: Yup.string(),
    });

    const submitForm = () => {
        showMessage('Form submitted successfully', 'success');
        navigate('/admin/tools');
    };

    // ✅ Fetch tool + engineer
    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             const toolRes = await getByToolId(id!); // backend returns { statusCode, data, ... }
    //             console.log("🚀 ~ fetchData ~ toolRes:", toolRes)
    //             const engineerRes = await getEngineerByToolId(id!); // backend returns { engineer, tool }

    //             const tool = toolRes.data; // ApiResponse wrapper
    //             const engineer = engineerRes.engineer;

    //             setInitialValues({
    //                 nomenclature: tool.nomenclature || '',
    //                 manufacturer: tool.manufacturer || '',
    //                 model: tool.model || '',
    //                 srNo: tool.SrNo || '',
    //                 calibrationCertificateNo: tool.calibrationCertificateNo || '',
    //                 calibrationValidTill: tool.calibrationValidTill?.split('T')[0] || '',
    //                 range: tool.range || '',
    //                 toolID: tool.toolId || '',
    //                 engineerName: engineer?.name || '', // ✅ from engineer API
    //                 issueDate: engineerRes.tool?.issueDate?.split('T')[0] || '',
    //                 submitDate: engineerRes.tool?.submitDate?.split('T')[0] || '',
    //             });
    //         } catch (error) {
    //             console.error("❌ Error fetching tool/engineer:", error);
    //         }
    //     };
    //     fetchData();
    // }, [id]);

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             // ✅ Step 1: Always fetch tool details
    //             const toolRes = await getByToolId(id!);
    //             const tool = toolRes?.data || {};
    //             console.log("✅ Tool data:", tool);

    //             // ✅ Step 2: Try to fetch engineer (may fail)
    //             let engineer = null;
    //             let toolIssueDate = '';
    //             let toolSubmitDate = '';

    //             try {
    //                 const engineerRes = await getEngineerByToolId(id!);
    //                 engineer = engineerRes?.engineer || null;
    //                 toolIssueDate = engineerRes?.tool?.issueDate?.split('T')[0] || '';
    //                 toolSubmitDate = engineerRes?.tool?.submitDate?.split('T')[0] || '';
    //             } catch (err) {
    //                 console.warn("⚠️ No engineer found for this tool:", err);
    //             }

    //             // ✅ Step 3: Set all fields safely
    //             setInitialValues({
    //                 nomenclature: tool.nomenclature || '',
    //                 manufacturer: tool.manufacturer || '',
    //                 model: tool.model || '',
    //                 srNo: tool.SrNo || '',
    //                 calibrationCertificateNo: tool.calibrationCertificateNo || '',
    //                 calibrationValidTill: tool.calibrationValidTill?.split('T')[0] || '',
    //                 range: tool.range || '',
    //                 toolID: tool.toolId || '',
    //                 engineerName: engineer?.name || 'Not Assigned', // fallback label
    //                 issueDate: toolIssueDate,
    //                 submitDate: toolSubmitDate,
    //             });
    //         } catch (error) {
    //             console.error("❌ Error fetching tool details:", error);
    //         }
    //     };

    //     fetchData();
    // }, [id]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                // ✅ Step 1: Fetch all technicians for dropdown
                const allTechRes = await getActiveTechnicians();
                setTechnicians(allTechRes?.technicians || allTechRes?.data || []); // handle both response shapes

                // ✅ Step 2: Always fetch tool details
                const toolRes = await getByToolId(id!);
                const tool = toolRes?.data || {};
                console.log("🚀 ~ fetchData ~ tool:", tool)

                // ✅ Step 3: Try to fetch engineer (may fail)
                let engineer = null;
                let toolIssueDate = '';

                try {
                    const engineerRes = await getEngineerByToolId(id!);
                    engineer = engineerRes?.engineer || null;
                    toolIssueDate = engineerRes?.tool?.issueDate?.split('T')[0] || '';
                } catch (err) {
                    console.warn("⚠️ No engineer found for this tool:", err);
                }

                // ✅ Step 5: Fetch custom machines
                const customRes = await getCustomMachines();
                if (customRes?.data) {
                    const names = customRes.data.map((m: any) => m.name);
                    setCustomMachines(names);
                }

                // ✅ Step 6: Set form initial values
                setInitialValues({
                    nomenclature: tool.nomenclature || '',
                    manufacturer: tool.manufacturer || '',
                    model: tool.model || '',
                    srNo: tool.SrNo || '',
                    calibrationCertificateNo: tool.calibrationCertificateNo || '',
                    calibrationValidTill: tool.calibrationValidTill?.split('T')[0] || '',
                    range: tool.range || '',
                    toolID: tool.toolId || '',
                    engineerName: engineer?._id || '',
                    issueDate: toolIssueDate,
                    submitDate: tool.submitDate ? tool.submitDate.split('T')[0] : '',
                    applicableMachines: tool.applicableMachines || [],
                });
            } catch (error) {
                console.error("❌ Error fetching data:", error);
            }
        };

        fetchData();
    }, [id]);

    const allMachineOptions = [...machineOptions, ...customMachines];


    if (!initialValues) {
        return <p>Loading tool details...</p>;
    }

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/tools" className="text-primary">
                        Tools
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Edit Tools
                    </Link>
                </li>
            </ol>

            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={SubmittedForm}
                onSubmit={async (values, { setSubmitting }) => {
                    try {
                        // ✅ Prepare payload for backend
                        const payload = {
                            SrNo: values.srNo,
                            nomenclature: values.nomenclature,
                            manufacturer: values.manufacturer,
                            model: values.model,
                            calibrationCertificateNo: values.calibrationCertificateNo,
                            calibrationValidTill: values.calibrationValidTill,
                            range: values.range,
                            certificate: values.certificate,
                            toolStatus: values.toolStatus,
                            technician: values.engineerName, // ObjectId from dropdown
                            submitDate: values.submitDate ? new Date(values.submitDate) : null, // ✅ Include submitDate
                            applicableMachines: values.applicableMachines,
                        };

                        console.log("🛠️ Payload for update:", payload);

                        await updateTool(id!, payload);

                        showMessage("Tool updated successfully!", "success");
                        navigate('/admin/tools');
                    } catch (error: any) {
                        showMessage(error.message || "Failed to update tool", "error");
                    } finally {
                        setSubmitting(false);
                    }
                }}

            >
                {({ submitCount, values, setFieldValue }) => (
                    <Form className="space-y-5">
                        <div className="panel">
                            <h5 className="font-semibold text-lg mb-4">Tools Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                {/* Nomenclature */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="nomenclature">Nomenclature </label>
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
                                    />
                                    <ErrorMessage name="nomenclature">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>


                                {/* Manufacturer */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="manufacturer">Manufacturer </label>
                                    <Field name="manufacturer" type="text" className="form-input" />
                                    <ErrorMessage name="manufacturer">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Model */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="model">Model </label>
                                    <Field name="model" type="text" className="form-input" />
                                    <ErrorMessage name="model">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Sr No */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="srNo">Sr No </label>
                                    <Field name="srNo" type="text" className="form-input" />
                                    <ErrorMessage name="srNo">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Calibration Certificate */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="calibrationCertificateNo">Calibration Certificate Number</label>
                                    <Field name="calibrationCertificateNo" type="text" className="form-input" />
                                    <ErrorMessage name="calibrationCertificateNo">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Calibration Valid Till */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="calibrationValidTill">Calibration Valid Till</label>
                                    <Field name="calibrationValidTill" type="date" className="form-input" />
                                    <ErrorMessage name="calibrationValidTill">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Range */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="range">Range</label>
                                    <Field name="range" type="text" className="form-input" />
                                    <ErrorMessage name="range">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Tool ID */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="toolID">Tool ID</label>
                                    <Field name="toolID" type="text" className="form-input" />
                                    <ErrorMessage name="toolID">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Engineer Name */}
                                {/* <Field name="engineerName" type="text" className="form-input" /> */}
                                {/* <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="engineerName">Engineer Assigned</label>
                                    <Field
                                        name="engineerName"
                                        type="text"
                                        disabled={initialValues.engineerName === "Not Assigned"}
                                        className="form-input disabled:bg-gray-100"
                                    />

                                    <ErrorMessage name="engineerName">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div> */}
                                {/* Engineer Name (Dropdown or Assigned Name) */}
                                {/* <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="engineerName">Engineer Assigned</label>

                                    {initialValues.engineerName === "Not Assigned" ? (
                                        <Field as="select" name="engineerName" className="form-select">
                                            <option value="">Select Engineer</option>
                                            {technicians.length > 0 ? (
                                                technicians.map((tech) => (
                                                    <option key={tech._id} value={tech.name}>
                                                        {tech.name}
                                                    </option>
                                                ))
                                            ) : (
                                                <option disabled>Loading engineers...</option>
                                            )}
                                        </Field>
                                    ) : (
                                        <Field
                                            name="engineerName"
                                            type="text"
                                            disabled
                                            className="form-input disabled:bg-gray-100"
                                        />
                                    )}

                                    <ErrorMessage name="engineerName">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div> */}

                                {/* <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="engineerName">Engineer Assigned</label>

                                    {initialValues.engineerName === "Not Assigned" ? (
                                        <Field as="select" name="engineerName" className="form-select">
                                            <option value="">Select Engineer</option>
                                            {technicians.map((tech) => (
                                                // Send tech._id instead of tech.name
                                                <option key={tech._id} value={tech._id}>
                                                    {tech.name}
                                                </option>
                                            ))}
                                        </Field>
                                    ) : (
                                        <Field
                                            name="engineerName"
                                            type="text"
                                            disabled
                                            className="form-input disabled:bg-gray-100"
                                        />
                                    )}

                                    <ErrorMessage name="engineerName">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div> */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="engineerName">Engineer Assigned</label>

                                    <Field as="select" name="engineerName" className="form-select">
                                        <option value="">Select Engineer</option>
                                        {technicians.map((tech) => (
                                            <option key={tech._id} value={tech._id}>
                                                {tech.name}
                                            </option>
                                        ))}
                                    </Field>

                                    <ErrorMessage name="engineerName">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>


                                {/* Issue Date */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="issueDate">Issue Date</label>
                                    <Field name="issueDate" type="date" className="form-input" />
                                    <ErrorMessage name="issueDate">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                                {/* Submit Date */}
                                <div className={submitCount ? 'has-success' : ''}>
                                    <label htmlFor="submitDate">Submit Date</label>
                                    <Field name="submitDate" type="date" className="form-input" />
                                    <ErrorMessage name="submitDate">
                                        {(msg) => <div className="text-danger mt-1">{msg}</div>}
                                    </ErrorMessage>
                                </div>

                            </div>
                        </div>

                        {/* Applicable Machines */}
                        <div className="panel mt-5">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="font-semibold text-lg">Applicable machines</h5>
                            </div>

                            {/* Quick Selection Groups */}
                            {/* <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h6 className="font-bold text-sm mb-3 text-secondary uppercase tracking-wider">Quick Selection Groups</h6>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {quickSelectOptions.map((group) => {
                                        const areAllSelected = group.machines.every(m => values.applicableMachines?.includes(m));
                                        return (
                                            <label key={group.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={areAllSelected}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        let newSelection = [...(values.applicableMachines || [])];
                                                        if (checked) {
                                                            group.machines.forEach(m => {
                                                                if (!newSelection.includes(m)) newSelection.push(m);
                                                            });
                                                        } else {
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
                                            if (values.applicableMachines?.length === machineOptions.length) {
                                                setFieldValue('applicableMachines', []);
                                            } else {
                                                setFieldValue('applicableMachines', [...machineOptions]);
                                            }
                                        }}
                                    >
                                        {(values.applicableMachines?.length === machineOptions.length) ? 'DESELECT ALL' : 'SELECT ALL MACHINES'}
                                    </button>
                                </div>
                            </div> */}

                            {/* Full Machine List */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                                {allMachineOptions.map((machine) => (
                                    <label key={machine} className="flex items-center space-x-3 cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors group">
                                        <input
                                            type="checkbox"
                                            name="applicableMachines"
                                            value={machine}
                                            checked={values.applicableMachines?.includes(machine)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const currentMachines = values.applicableMachines || [];
                                                if (checked) {
                                                    setFieldValue('applicableMachines', [...currentMachines, machine]);
                                                } else {
                                                    setFieldValue('applicableMachines', currentMachines.filter((m: string) => m !== machine));
                                                }
                                            }}
                                            className="form-checkbox text-primary h-4.5 w-4.5"
                                        />
                                        <span className="text-sm group-hover:text-primary transition-colors">{machine}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="w-[98%] mb-6 flex justify-end">
                            <button type="submit" className="btn btn-success mt-4">
                                Submit Form
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>

        </>
    );
};

export default EditTool;
