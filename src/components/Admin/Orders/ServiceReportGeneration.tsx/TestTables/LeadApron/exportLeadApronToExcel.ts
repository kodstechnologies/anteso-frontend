// Helper file for Lead Apron Excel export with proper table structures
import * as XLSX from "xlsx";

export interface LeadApronExportData {
    reportDetails?: any;
    operatingParameters?: any;
    doseMeasurements?: any;
    footer?: any;
}

export const createLeadApronUploadableExcel = (data: LeadApronExportData): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();
    const allData: any[][] = [];

    const addSection = (title: string, headers: string[], rows: any[][]) => {
        allData.push(['TEST: ' + title]);
        allData.push(headers);
        rows.forEach(row => allData.push(row));
        allData.push([]); // Empty row after each section
    };

    // 1. REPORT DETAILS
    if (data.reportDetails) {
        const rows = [[
            data.reportDetails.institutionName || '',
            data.reportDetails.institutionCity || '',
            data.reportDetails.equipmentType || 'Lead Apron',
            data.reportDetails.equipmentId || '',
            data.reportDetails.personTesting || '',
            data.reportDetails.serviceAgency || '',
            data.reportDetails.testDate || '',
            data.reportDetails.testDuration || ''
        ]];
        addSection('REPORT DETAILS', [
            'Institution Name', 
            'Institution City', 
            'Equipment Type', 
            'Equipment ID', 
            'Person Testing', 
            'Service Agency', 
            'Test Date', 
            'Test Duration'
        ], rows);
    }

    // 2. OPERATING PARAMETERS
    if (data.operatingParameters) {
        const rows = [[
            data.operatingParameters.ffd || '',
            data.operatingParameters.kv || '',
            data.operatingParameters.mas || ''
        ]];
        addSection('OPERATING PARAMETERS: TESTED ON DIRECT RADIATION', [
            'FFD (cm)', 
            'kV', 
            'mAs'
        ], rows);
    }

    // 3. DOSE MEASUREMENTS
    if (data.doseMeasurements) {
        // Get all positions from the data
        const positions = data.doseMeasurements.positions || [];
        const maxPositions = Math.max(positions.length, 3); // Ensure at least 3 position columns
        
        // Create headers for positions
        const positionHeaders = [];
        for (let i = 1; i <= maxPositions; i++) {
            positionHeaders.push(`Position ${i}`);
        }
        
        // Create measurement rows - only include input values, not calculated ones
        const rows = [];
        
        // Row 1: Neutral value
        const neutralRow = [data.doseMeasurements.neutral || '', '', ''];
        for (let i = 3; i < maxPositions + 3; i++) {
            neutralRow.push('');
        }
        rows.push(neutralRow);
        
        // Row 2: Position values only
        const positionRow = ['Dose Value', '', ''];
        positions.forEach((pos: any) => {
            positionRow.push(pos.value || '');
        });
        // Fill remaining position columns if needed
        for (let i = positions.length; i < maxPositions; i++) {
            positionRow.push('');
        }
        rows.push(positionRow);
        
        addSection('DOSE MEASUREMENTS', [
            'Measurement Type', 
            'Value 1', 
            'Value 2', 
            ...positionHeaders
        ], rows);
    }

    // 4. FOOTER DETAILS
    if (data.footer) {
        const rows = [[
            data.footer.place || '',
            data.footer.date || '',
            data.footer.signature || '',
            data.footer.serviceEngineerName || '',
            data.footer.serviceAgencyName || '',
            data.footer.serviceAgencySeal || ''
        ]];
        addSection('FOOTER DETAILS', [
            'Place', 
            'Date', 
            'Signature', 
            'Service Engineer Name', 
            'Service Agency Name', 
            'Service Agency Seal'
        ], rows);
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Set column widths
    const maxCols = Math.max(...allData.map(row => row.length));
    ws['!cols'] = Array.from({ length: maxCols }, () => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Lead Apron Test Data');

    return wb;
};
