const fs = require('fs');
const path = 'd:/PRAJWALA/anteso/anteso-frontend/src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables/DentalIntra/GenerateServiceReport.tsx';
let s = fs.readFileSync(path, 'utf8');

const loadStart = s.indexOf('if (res?.exists && res?.data) {');
const loadEnd = s.indexOf('loadReportHeader();');
if (loadStart < 0 || loadEnd < 0) {
  console.error('load block not found', loadStart, loadEnd);
  process.exit(1);
}

const newLoadInner = `if (res?.exists && res?.data) {
                    // Update form data from report header
                    setFormData(prev => ({
                        ...prev,
                        customerName: res.data.customerName || prev.customerName,
                        address: res.data.address || prev.address,
                        srfNumber: res.data.srfNumber || prev.srfNumber,
                        srfDate: res.data.srfDate || prev.srfDate,
                        reportULRNumber: res.data.reportULRNumber || prev.reportULRNumber,
                        testReportNumber: res.data.testReportNumber || prev.testReportNumber,
                        issueDate: res.data.issueDate || prev.issueDate,
                        nomenclature: res.data.nomenclature || prev.nomenclature,
                        make: res.data.make || prev.make,
                        model: res.data.model || prev.model,
                        slNumber: res.data.slNumber || prev.slNumber,
                        condition: res.data.condition || prev.condition,
                        testingProcedureNumber: res.data.testingProcedureNumber || prev.testingProcedureNumber,
                        testDate: res.data.testDate || prev.testDate,
                        testDueDate: res.data.testDueDate || prev.testDueDate,
                        location: res.data.location || prev.location || "At site",
                        temperature: res.data.temperature || prev.temperature,
                        humidity: res.data.humidity || prev.humidity,
                        engineerNameRPId: res.data.engineerNameRPId || prev.engineerNameRPId,
                        rpId: res.data.rpId || prev.rpId,
                        authorizedSignatory: (typeof res.data.authorizedSignatory === "object" ? res.data.authorizedSignatory?._id : res.data.authorizedSignatory) || prev.authorizedSignatory || "",
                    }));

                    const combinedId =
                        res.data.AccuracyOfOperatingPotentialAndTimeDentalIntra?._id ||
                        res.data.AccuracyOfOperatingPotentialAndTimeDentalIntra ||
                        res.data.AccuracyOfOperatingPotentialDentalIntra?._id ||
                        res.data.AccuracyOfOperatingPotentialDentalIntra ||
                        res.data.AccuracyOfIrradiationTimeDentalIntra?._id ||
                        res.data.AccuracyOfIrradiationTimeDentalIntra;
                    setSavedTestIds({
                        AccuracyOfOperatingPotentialAndTimeDentalIntra: combinedId,
                        AccuracyOfOperatingPotentialDentalIntra: combinedId,
                        AccuracyOfIrradiationTimeDentalIntra: combinedId,
                        LinearityOfTimeDentalIntra: res.data.LinearityOfTimeDentalIntra?._id || res.data.LinearityOfTimeDentalIntra,
                        LinearityOfMaLoadingDentalIntra: res.data.LinearityOfMaLoadingDentalIntra?._id || res.data.LinearityOfMaLoadingDentalIntra,
                        LinearityOfmAsLoadingDentalIntra: res.data.LinearityOfmAsLoadingDentalIntra?._id || res.data.LinearityOfmAsLoadingDentalIntra,
                        ConsistencyOfRadiationOutputDentalIntra: res.data.ConsistencyOfRadiationOutputDentalIntra?._id || res.data.ConsistencyOfRadiationOutputDentalIntra,
                        ReproducibilityOfRadiationOutputDentalIntra: res.data.ReproducibilityOfRadiationOutputDentalIntra?._id || res.data.ReproducibilityOfRadiationOutputDentalIntra,
                        RadiationLeakageLevelDentalIntra: res.data.RadiationLeakageLevelDentalIntra?._id || res.data.RadiationLeakageLevelDentalIntra,
                        TubeHousingLeakageDentalIntra: res.data.TubeHousingLeakageDentalIntra?._id || res.data.TubeHousingLeakageDentalIntra,
                        RadiationProtectionSurveyDentalIntra: res.data.RadiationProtectionSurveyDentalIntra?._id || res.data.RadiationProtectionSurveyDentalIntra,
                    });
                }
            } catch (err) {
                console.log("No report header found or failed to load:", err);
            }
        };
        `;

s = s.slice(0, loadStart) + newLoadInner + s.slice(loadEnd);

const unsavedOldStart = s.indexOf('const getUnsavedTestNames = async');
const unsavedOldEnd = s.indexOf('const handleSaveHeader');
if (unsavedOldStart < 0 || unsavedOldEnd < 0) {
  console.error('unsaved not found', unsavedOldStart, unsavedOldEnd);
  process.exit(1);
}

const newUnsaved = `const getUnsavedTestNames = async (): Promise<string[]> => {
        const checks: { name: string; check: () => Promise<boolean> }[] = [
            { name: "Accuracy Of Operating Potential & Time", check: async () => { try { return isSaved(await getAccuracyOfOperatingPotentialAndTimeByServiceIdForDentalIntra(serviceId)); } catch { return false; } } },
            { name: "Linearity Of mAs Loading", check: async () => { try { return isSaved(await getLinearityOfMasLoadingByServiceIdForDentalIntra(serviceId)); } catch { return false; } } },
            { name: "Linearity Of mA Loading", check: async () => { try { return isSaved(await getLinearityOfMaLoadingByServiceIdForDentalIntra(serviceId)); } catch { return false; } } },
            { name: "Consistency Of Radiation Output", check: async () => { try { return isSaved(await getConsistencyOfRadiationOutputByServiceIdForDentalIntra(serviceId)); } catch { return false; } } },
            { name: "Radiation Leakage Level", check: async () => { try { return isSaved(await getRadiationLeakageLevelByServiceIdForDentalIntra(serviceId)); } catch { return false; } } },
            { name: "Details Of Radiation Protection", check: async () => { try { return isSaved(await getRadiationProtectionSurveyByServiceIdForDentalIntra(serviceId)); } catch { return false; } } },
        ];
        const results = await Promise.all(checks.map(async (c) => ({ name: c.name, saved: await c.check() })));
        return results.filter((r) => !r.saved).map((r) => r.name);
    };

    `;
s = s.slice(0, unsavedOldStart) + newUnsaved + s.slice(unsavedOldEnd);

// processCSVData timer inference -> simplify
const csvTimerStart = s.indexOf('if (Object.keys(grouped).length > 0) {');
const csvTimerMarker = s.indexOf('setCsvDataForComponents(grouped);', csvTimerStart);
if (csvTimerStart > 0 && csvTimerMarker > 0) {
  // Find the timer inference block inside and strip setHasTimer/setShowTimerModal/saveTimerPreference
  let block = s.slice(csvTimerStart, csvTimerMarker);
  // Replace the whole timer resolution with just setting csv data readiness
  const simplified = `if (Object.keys(grouped).length > 0) {
            `;
  // Keep from setCsvDataForComponents onward - need to find where timer block ends
  // Actually rewrite from Object.keys to setCsvDataForComponents
  s = s.slice(0, csvTimerStart) + simplified + s.slice(csvTimerMarker);
}

// Remove handleTimerChoice + modal + awaiting excel hasTimer gate
const handleTimer = s.indexOf('// Close modal and set timer choice');
const returnMain = s.indexOf('return (\n        <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-8 mt-6">');
if (handleTimer > 0 && returnMain > 0) {
  // Keep awaitingExcelConfig loading without hasTimer
  const excelWait = `    if (awaitingExcelConfig) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl font-medium text-gray-700">
                    Loading Excel data and configuring report...
                </div>
            </div>
        );
    }

    `;
  s = s.slice(0, handleTimer) + excelWait + s.slice(returnMain);
}

// Replace accordion sections for OP/Time
const accordionStart = s.indexOf('{[\n                    ...(hasTimer === true');
let accordionAlt = s.indexOf('{[\n                    ...(');
if (accordionStart < 0) {
  // try flexible
  const idx = s.indexOf('Accuracy Of Irradiation Time');
  console.log('Looking for accordion near', idx);
}

const qaTestsMarker = s.indexOf('<h2 className="text-2xl font-bold text-gray-800 mb-6">QA Tests</h2>');
const mapStart = s.indexOf('{[', qaTestsMarker);
const mapEnd = s.indexOf('].map((item, idx) => (', mapStart);
if (mapStart < 0 || mapEnd < 0) {
  console.error('accordion array not found', mapStart, mapEnd);
  process.exit(1);
}

const newAccordion = `{[
                    {
                        title: "ACCURACY OF OPERATING POTENTIAL & TIME",
                        component: <AccuracyOfOperatingPotentialAndTime
                            serviceId={serviceId}
                            testId={savedTestIds.AccuracyOfOperatingPotentialAndTimeDentalIntra || savedTestIds.AccuracyOfOperatingPotentialDentalIntra || null}
                            onTestSaved={(id) => setSavedTestIds(prev => ({
                                ...prev,
                                AccuracyOfOperatingPotentialAndTimeDentalIntra: id,
                                AccuracyOfOperatingPotentialDentalIntra: id,
                                AccuracyOfIrradiationTimeDentalIntra: id,
                            }))}
                            csvData={csvDataForComponents['accuracyOfOperatingPotential'] || csvDataForComponents['accuracyOfOperatingPotentialAndTime']}
                        />
                    },
                    {
                        title: "Linearity Of mAs Loading",
                        component: <LinearityOfMasLoading
                            serviceId={serviceId}
                            testId={savedTestIds.LinearityOfmAsLoadingDentalIntra || null}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, LinearityOfmAsLoadingDentalIntra: id }))}
                            csvData={csvDataForComponents['linearityOfMasLoading']}
                        />,
                    },
                    {
                        title: "Linearity Of mA Loading",
                        component: <LinearityOfmALoading
                            serviceId={serviceId}
                            testId={savedTestIds.LinearityOfMaLoadingDentalIntra || undefined}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, LinearityOfMaLoadingDentalIntra: id }))}
                            csvData={csvDataForComponents['linearityOfMaLoading']}
                        />,
                    },
                    {
                        title: "Consistency Of Radiation Output",
                        component: <ConsistencyOfRadiationOutput
                            serviceId={serviceId}
                            testId={savedTestIds.ConsistencyOfRadiationOutputDentalIntra || null}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, ConsistencyOfRadiationOutputDentalIntra: id }))}
                            csvData={csvDataForComponents['consistencyOfRadiationOutput']}
                        />
                    },
                    {
                        title: "Radiation Leakage Level",
                        component: <RadiationLeakageLevel
                            serviceId={serviceId}
                            testId={savedTestIds.RadiationLeakageLevelDentalIntra || undefined}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, RadiationLeakageLevelDentalIntra: id }))}
                            csvData={csvDataForComponents['radiationLeakageLevel']}
                        />
                    },
                    {
                        title: "Details Of Radiation Protection",
                        component: <DetailsOfRadiationProtection
                            serviceId={serviceId}
                            testId={savedTestIds.RadiationProtectionSurveyDentalIntra || null}
                            onTestSaved={(id) => setSavedTestIds(prev => ({ ...prev, RadiationProtectionSurveyDentalIntra: id }))}
                            csvData={csvDataForComponents['radiationProtectionSurvey']}
                            initialSurveyDate={qaTestDate ?? formData.testDate ?? undefined}
                        />
                    },
                `;

s = s.slice(0, mapStart) + newAccordion + s.slice(mapEnd);

// Export: always include both linearities; use combined API for accuracy
s = s.replace(
  /\/\/ 1\. Accuracy of Operating Potential[\s\S]*?\/\/ 3\. Linearity of mA \/ mAs Loading \(Dependent on timer\)[\s\S]*?\/\/ 4\. Consistency of Radiation Output/,
  `// 1. Accuracy of Operating Potential & Time
            if (pageData.accuracyOfOperatingPotentialAndTime != null || pageData.accuracyOfOperatingPotential != null) {
                exportData.accuracyOfOperatingPotential = pageData.accuracyOfOperatingPotentialAndTime || pageData.accuracyOfOperatingPotential;
                exportData.accuracyOfIrradiationTime = pageData.accuracyOfOperatingPotentialAndTime || pageData.accuracyOfIrradiationTime;
            } else {
                try {
                    const res = await getAccuracyOfOperatingPotentialAndTimeByServiceIdForDentalIntra(serviceId);
                    if (res?.data) {
                        exportData.accuracyOfOperatingPotential = res.data;
                        exportData.accuracyOfIrradiationTime = res.data;
                    }
                } catch (err) { console.log("AccuracyOfOperatingPotentialAndTime data not found"); }
            }

            // 2. Linearity of mA / mAs Loading
            if (pageData.linearityOfMaLoading != null) {
                exportData.linearityOfMaLoading = pageData.linearityOfMaLoading;
            } else {
                try {
                    const res = await getLinearityOfMaLoadingByServiceIdForDentalIntra(serviceId);
                    if (res?.data) exportData.linearityOfMaLoading = res.data;
                } catch (err) { console.log("LinearityOfMaLoading data not found"); }
            }
            if (pageData.linearityOfMasLoading != null) {
                exportData.linearityOfMasLoading = pageData.linearityOfMasLoading;
            } else {
                try {
                    const res = await getLinearityOfMasLoadingByServiceIdForDentalIntra(serviceId);
                    if (res?.data) exportData.linearityOfMasLoading = res.data;
                } catch (err) { console.log("LinearityOfMasLoading data not found"); }
            }

            // 3. Consistency of Radiation Output`
);

s = s.replace(
  'const wb = createDentalIntraUploadableExcel(exportData, hasTimer === true);',
  'const wb = createDentalIntraUploadableExcel(exportData, true);'
);

// Remove leftover hasTimer/setHasTimer/setShowTimerModal/saveTimerPreference references that would break compile
if (s.includes('setHasTimer') || s.includes('setShowTimerModal') || s.includes('hasTimer') || s.includes('saveTimerPreference')) {
  console.log('Remaining refs:', {
    setHasTimer: (s.match(/setHasTimer/g) || []).length,
    setShowTimerModal: (s.match(/setShowTimerModal/g) || []).length,
    hasTimer: (s.match(/hasTimer/g) || []).length,
    saveTimerPreference: (s.match(/saveTimerPreference/g) || []).length,
  });
}

fs.writeFileSync(path, s);
console.log('Patch complete, length', s.length);
