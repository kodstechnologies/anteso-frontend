import React from "react";

export const ReportPdfPageFooterEnd: React.FC<{
    todayDate: string;
    customerCity: string;
}> = ({ todayDate, customerCity }) => (
    <div
        className="report-pdf-footer-block"
        style={{
            width: '100%',
            flexShrink: 0,
            marginTop: 'auto',
            paddingTop: '10px',
            // borderTop: '1px solid #ccc',
        }}
    >
        <p style={{ fontSize: '10px', lineHeight: '1.2' }}><strong>Date:</strong> {todayDate}</p>
        <p style={{ fontSize: '10px', lineHeight: '1.2' }}><strong>Place:</strong> {customerCity}</p>
        <footer style={{ textAlign: 'center', fontSize: '9px', color: '#555', marginTop: '6px', lineHeight: '1.25' }}>
            <p>ANTESO Biomedical OPC Pvt. Ltd.</p>
            <p>2nd Floor, D-290, PKT-7, Sector - 6, Rohini, New Delhi - 110085</p>
            <p>Ph.: 011-47069720. Mob. No. 08470809720, 08427349720, 08470809720</p>
            <p>Email: antesobiomedical@gmail.com, info@antesobiomedicalopc.com</p>
        </footer>
    </div>
);