// Generate Excel template for Lead Apron
import * as XLSX from "xlsx";
import { createLeadApronUploadableExcel } from "./exportLeadApronToExcel";

export const generateLeadApronTemplate = () => {
    // Create empty template data structure
    const templateData = {
        reportDetails: {
            institutionName: '',
            institutionCity: '',
            equipmentType: 'Lead Apron',
            equipmentId: '',
            personTesting: '',
            serviceAgency: '',
            testDate: '',
            testDuration: ''
        },
        operatingParameters: {
            ffd: '',
            kv: '',
            mas: ''
        },
        doseMeasurements: {
            neutral: '',
            positions: [
                { position: 'Position 1', value: '' },
                { position: 'Position 2', value: '' },
                { position: 'Position 3', value: '' }
            ],
            // Calculated values excluded - will be calculated automatically
        },
        footer: {
            place: '',
            date: '',
            signature: '',
            serviceEngineerName: '',
            serviceAgencyName: '',
            serviceAgencySeal: ''
        }
    };

    // Generate the Excel workbook
    const wb = createLeadApronUploadableExcel(templateData);

    // Save the file
    XLSX.writeFile(wb, 'Lead_Apron_Template.xlsx');
};

// Run this function to generate the template
if (typeof window !== 'undefined') {
    // Browser environment - don't auto-run
} else {
    // Node.js environment - auto-run for file generation
    generateLeadApronTemplate();
}
