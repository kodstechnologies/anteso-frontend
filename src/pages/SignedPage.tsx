import React from "react";
import antesoLogo from "../assets/logo/anteso-logo2.png";
import nablSeal from "../assets/quotationImg/NABLlogo.png";

const fieldLabel: React.CSSProperties = {
  fontSize: "11px",
  lineHeight: "1.3",
  margin: 0,
};

const SignedPage = () => {
  return (
    <div className="signed-page-wrapper">
      <div className="signed-page">
        <header className="signed-page-header">
          <img src={antesoLogo} alt="Anteso Biomedical" className="signed-page-header-logo" />
          <div className="signed-page-header-seal">
            <img src={nablSeal} alt="NABL Seal" className="signed-page-seal-img" />
            <p className="signed-page-seal-code">TC-9843</p>
          </div>
        </header>

        <p className="signed-page-declaration">
          I hereby undertake that all the information provided above is correct and in accordance
          with the detailed Quality Assurance Report enclosed herewith.
        </p>

        <div className="signed-page-middle">
          <div className="signed-page-columns">
            <div className="signed-page-column">
              <p style={fieldLabel}>
                <strong>Date:</strong>
              </p>
              <p className="signed-page-field-gap" style={fieldLabel}>
                <strong>Place:</strong>
              </p>
            </div>
            <div className="signed-page-column">
              <p style={fieldLabel}>
                <strong>Engineer Verification QR Code:</strong>
              </p>
              <p className="signed-page-field-gap" style={fieldLabel}>
                <strong>Name of the Testing Engineer:</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="signed-page-signatures">
          <div className="signed-page-columns">
            <div className="signed-page-column">
              <p style={fieldLabel}>Signature of Institution&apos;s Representative:</p>
              <p className="signed-page-field-gap" style={fieldLabel}>Name of Institution:</p>
              <p className="signed-page-field-gap" style={fieldLabel}>Seal of the Institution:</p>
            </div>
            <div className="signed-page-column">
              <p style={fieldLabel}>Authorised Signatory:</p>
              <p className="signed-page-field-gap" style={fieldLabel}>Name of Service Agency :</p>
              <p className="signed-page-field-gap" style={fieldLabel}>Seal of Service Agency :</p>
            </div>
          </div>
        </div>

        <footer className="signed-page-footer">
          <p className="signed-page-footer-company">ANTESO Biomedical OPC Pvt. Ltd.</p>
          <p>2nd Floor, D-290, PKT-7, Sector - 6, Rohini, New Delhi - 110085</p>
          <p>Ph.: 011-47069720. Mob. No. 08470809720, 08427349720, 08470809720</p>
          <p>Email: antesobiomedical@gmail.com, info@antesobiomedicalopc.com</p>
        </footer>
      </div>

      <style>{`
        .signed-page-wrapper {
          min-height: 100vh;
          background: #e5e7eb;
          padding: 20px 0;
        }
        .signed-page {
          display: flex;
          flex-direction: column;
          font-family: "Times New Roman", Times, serif;
          color: #000;
          font-size: 11px;
          line-height: 1.3;
          width: 210mm;
          min-height: 297mm;
          height: 297mm;
          margin: 0 auto;
          padding: 10mm 14mm 8mm;
          box-sizing: border-box;
          background: #fff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }
        .signed-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12mm;
        }
        .signed-page-header-logo {
          height: 22mm;
          width: auto;
          display: block;
        }
        .signed-page-header-seal {
          text-align: center;
        }
        .signed-page-seal-img {
          height: 22mm;
          width: auto;
          display: block;
          margin-left: auto;
        }
        .signed-page-seal-code {
          margin: 1.5mm 0 0;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
        }
        .signed-page-declaration {
          font-size: 11px;
          line-height: 1.35;
          margin: 0 0 72mm;
        }
        .signed-page-middle {
          margin-bottom: 41mm;
        }
        .signed-page-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 10mm;
        }
        .signed-page-field-gap {
          margin-top: 5mm;
        }
        .signed-page-signatures {
          margin-bottom: 0;
        }
        .signed-page-footer {
          margin-top: auto;
          border-top: 1px solid #000;
          padding-top: 3mm;
          text-align: center;
          font-size: 9px;
          color: #000;
          line-height: 1.3;
        }
        .signed-page-footer p {
          margin: 0;
        }
        .signed-page-footer-company {
          font-weight: 700;
          margin-bottom: 1mm !important;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 0;
            size: A4;
          }
          .signed-page-wrapper {
            background: #fff;
            padding: 0;
          }
          .signed-page {
            width: 210mm;
            min-height: 297mm;
            height: 297mm;
            margin: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SignedPage;
