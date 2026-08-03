import React from "react";
import roundStamp from "../../../../../../../assets/logo/roundstamp.jpeg";

export const ReportPdfPageFooterEnd: React.FC<{
  todayDate: string;
  customerCity: string;
}> = ({ todayDate, customerCity }) => (
  <div
    className="report-pdf-footer-block"
    style={{
      width: "100%",
      flexShrink: 0,
      marginTop: "auto",
      paddingTop: "10px",
    }}
  >
    <footer
      style={{
        position: "relative",
        textAlign: "center",
        fontSize: "9px",
        color: "#555",
        marginTop: "6px",
        lineHeight: "1.25",
      }}
    >
      <img
        src={roundStamp}
        alt="ANTESO AERB Stamp"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "72px",
          height: "72px",
          objectFit: "contain",
          opacity: 0.9,
          pointerEvents: "none",
          zIndex: 1,
          mixBlendMode: "multiply",
        }}
      />
      <p>ANTESO Biomedical OPC Pvt. Ltd.</p>
      <p>2nd Floor, D-290, PKT-7, Sector - 6, Rohini, New Delhi - 110085</p>
      <p>Ph.: 011-47069720. Mob. No. 08470809720, 08427349720, 08470809720</p>
      <p>Email: antesobiomedical@gmail.com, info@antesobiomedicalopc.com</p>
    </footer>
  </div>
);
