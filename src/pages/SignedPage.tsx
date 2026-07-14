import React from "react";
import antesoLogo from "../assets/logo/anteso-logo2.png";

const SignedPage = () => {
  return (
    <div className="signed-page-wrapper">
      <div className="signed-page">
        <header className="signed-page-header">
          <div className="signed-page-header-left">
            <img src={antesoLogo} alt="Anteso Biomedical" className="signed-page-header-logo" />
            <p className="signed-page-tagline">We Care For Your Safety</p>
          </div>
          <div className="signed-page-header-right">
            <p className="signed-page-aerb">AERB Registration No. 14-AFSXE-21486</p>
            <p className="signed-page-solution">One Stop Solution for All Radiation Equipment</p>
          </div>
        </header>

        <div className="signed-page-header-line" />

        <h1 className="signed-page-title">Declaration</h1>

        <p className="signed-page-declaration-text">
          I confirm that this QA report has been verified by me and all readings mentioned are exactly
          as recorded at the site.
        </p>

        <div className="signed-page-engineer">
          <p>Signature of the Testing Engineer:</p>
          <p>Name of the Testing Engineer:</p>
        </div>

        <footer className="signed-page-footer">
          <p>ANTESO Biomedical OPC Pvt. Ltd. D-7/290 II nd Floor, Sector-6 Rohini, New Delhi – 85</p>
          <p>
            Email ID:-{" "}
            <a href="mailto:antesobiomedical@gmail.com" className="signed-page-footer-link">
              antesobiomedical@gmail.com
            </a>{" "}
            Ph 01149069720, 8470909720
          </p>
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
          width: calc(100% + 28mm);
          margin-left: -14mm;
          margin-right: -14mm;
          padding: 0 3mm;
          box-sizing: border-box;
        }
        .signed-page-header-left {
          flex: 0 0 auto;
          align-self: flex-start;
        }
        .signed-page-header-logo {
          height: 18mm;
          width: auto;
          display: block;
          margin: 0;
        }
        .signed-page-tagline {
          margin: 1.5mm 0 0;
          font-size: 8px;
          line-height: 1.2;
        }
        .signed-page-header-right {
          flex: 0 0 auto;
          margin-left: auto;
          text-align: right;
          align-self: flex-start;
        }
        .signed-page-aerb {
          margin: 0;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.3;
        }
        .signed-page-solution {
          margin: 1.5mm 0 0;
          font-size: 10px;
          line-height: 1.3;
        }
        .signed-page-header-line {
          width: calc(100% + 28mm);
          margin-left: -14mm;
          border-top: 2px solid #000;
          margin-top: 4mm;
        }
        .signed-page-title {
          margin: 42mm 0 0;
          text-align: center;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.2;
          text-decoration: underline;
        }
        .signed-page-declaration-text {
          margin: 18mm 0 0;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.35;
        }
        .signed-page-engineer {
          margin-top: 28mm;
          font-size: 12px;
          line-height: 1.35;
        }
        .signed-page-engineer p {
          margin: 0;
        }
        .signed-page-engineer p + p {
          margin-top: 5mm;
        }
        .signed-page-footer {
          margin-top: auto;
          text-align: center;
          font-size: 10px;
          line-height: 1.35;
        }
        .signed-page-footer p {
          margin: 0;
        }
        .signed-page-footer p + p {
          margin-top: 1.5mm;
        }
        .signed-page-footer-link {
          color: #2563eb;
          text-decoration: underline;
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
