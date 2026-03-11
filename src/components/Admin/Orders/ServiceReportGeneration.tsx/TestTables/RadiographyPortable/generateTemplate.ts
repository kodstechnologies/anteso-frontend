// Generate Excel template for Radiography Portable
import * as XLSX from "xlsx";
import { createRadiographyPortableUploadableExcel } from "./exportRadiographyPortableToExcel";

export const generateRadiographyPortableTemplate = () => {
    // Create empty template data structure
    const templateData = {
        congruenceOfRadiation: {
            settings: { fcd: '', kvp: '', mas: '', fieldSize: '' },
            measurements: [
                { deviationX: '', deviationY: '', totalDeviation: '', remarks: '' }
            ],
            tolerance: { value: '1.0' }
        },
        centralBeamAlignment: {
            settings: { fcd: '', kvp: '', mas: '', fieldSize: '' },
            measurements: [
                { deviationX: '', deviationY: '', totalDeviation: '', remarks: '' }
            ],
            tolerance: { value: '1.0' }
        },
        effectiveFocalSpot: {
            settings: { fcd: '', kvp: '', mas: '' },
            measurements: [
                { direction: 'Longitudinal', measured: '', required: '', remarks: '' },
                { direction: 'Transverse', measured: '', required: '', remarks: '' }
            ]
        },
        accuracyOfIrradiationTime: {
            settings: { kvp: '', mas: '' },
            irradiationTimes: [
                { setTime: '', measuredTime: '', remarks: '' }
            ],
            tolerance: { value: '5' }
        },
        accuracyOfOperatingPotential: {
            settings: { fcd: '', mas: '', time: '' },
            measurements: [
                { setKV: '', measuredKV: '', error: '', remarks: '' }
            ],
            tolerance: { value: '5' }
        },
        linearityOfMasLoadingStations: {
            settings: { fcd: '', kvp: '', time: '' },
            measurements: [
                { mAsRange: '', output: '', linearity: '', remarks: '' }
            ],
            tolerance: { value: '10' }
        },
        consistencyOfRadiationOutput: {
            settings: { fcd: '', kvp: '', mas: '', time: '' },
            measurements: [
                { reading1: '', reading2: '', reading3: '', reading4: '', reading5: '', mean: '', cov: '', remarks: '' }
            ],
            tolerance: { value: '5' }
        },
        radiationLeakageLevel: {
            settings: { kvp: '', mas: '', time: '' },
            measurements: [
                { location: 'Operator Position', front: '', back: '', left: '', right: '', top: '', remarks: '' },
                { location: 'Patient Position', front: '', back: '', left: '', right: '', top: '', remarks: '' }
            ],
            workload: '1 mA',
            tolerance: { value: '1.0' }
        }
    };

    // Generate both timer and non-timer versions
    const wbWithTimer = createRadiographyPortableUploadableExcel(templateData, true);
    const wbWithoutTimer = createRadiographyPortableUploadableExcel(templateData, false);

    // Add both sheets to the workbook
    const wb = XLSX.utils.book_new();
    
    const wsWithTimer = wbWithTimer.Sheets['Radiography Portable Test Data'];
    const wsWithoutTimer = wbWithoutTimer.Sheets['Radiography Portable Test Data'];
    
    XLSX.utils.book_append_sheet(wb, wsWithTimer, 'With Timer');
    XLSX.utils.book_append_sheet(wb, wsWithoutTimer, 'Without Timer');

    // Save the file
    XLSX.writeFile(wb, 'Radiography_Portable_Template.xlsx');
};

// Run this function to generate the template
if (typeof window !== 'undefined') {
    // Browser environment - don't auto-run
} else {
    // Node.js environment - auto-run for file generation
    generateRadiographyPortableTemplate();
}
