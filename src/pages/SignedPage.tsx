import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import antesoLogo from "../assets/logo/anteso-logo2.png";
import { getPublicEngineerSignature } from "../api";

type EngineerSignature = {
  _id?: string;
  name?: string;
  empId?: string;
  doc1?: string;
  designation?: string;
};

const SignedPage = () => {
  const [searchParams] = useSearchParams();
  const engineerId = searchParams.get("engineerId") || "";
  const rpIdFromQuery = searchParams.get("rpId") || "";
  const [loading, setLoading] = useState(Boolean(engineerId));
  const [error, setError] = useState("");
  const [engineer, setEngineer] = useState<EngineerSignature | null>(null);

  useEffect(() => {
    if (!engineerId) {
      setLoading(false);
      setError("Missing engineer id");
      return;
    }

    const fetchSignature = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getPublicEngineerSignature(engineerId);
        const payload = res?.data || null;
        if (!payload) {
          setError("Engineer signature not found");
          setEngineer(null);
          return;
        }
        setEngineer(payload);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load engineer signature");
        setEngineer(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSignature();
  }, [engineerId]);

  const doc1 = engineer?.doc1?.trim() || "";
  const isPdf = useMemo(() => /\.pdf($|\?)/i.test(doc1), [doc1]);
  const isImage = useMemo(
    () => /\.(png|jpe?g|gif|webp|bmp|svg)($|\?)/i.test(doc1) || (!!doc1 && !isPdf),
    [doc1, isPdf]
  );

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
          {loading ? (
            <p>Loading signature...</p>
          ) : error ? (
            <p className="signed-page-error">{error}</p>
          ) : (
            <>
              <div className="signed-page-signature-block">
                {doc1 ? (
                  isPdf ? (
                    <iframe
                      title="Engineer Document 1"
                      src={doc1}
                      className="signed-page-doc-frame"
                    />
                  ) : isImage ? (
                    <img src={doc1} alt="Engineer Document 1" className="signed-page-doc-image" />
                  ) : (
                    <a href={doc1} target="_blank" rel="noopener noreferrer" className="signed-page-doc-link">
                      View Document 1
                    </a>
                  )
                ) : (
                  <p className="signed-page-missing">Document 1 not uploaded for this engineer.</p>
                )}
              </div>
              <p>
                Name of the Testing Engineer:
                {engineer?.name ? ` ${engineer.name}` : ""}
                {rpIdFromQuery ? ` (${rpIdFromQuery})` : ""}
              </p>
            </>
          )}
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
          margin-top: 20mm;
          font-size: 12px;
          line-height: 1.35;
        }
        .signed-page-engineer p {
          margin: 0;
        }
        .signed-page-signature-block {
          margin-bottom: 8mm;
          min-height: 40mm;
        }
        .signed-page-doc-image {
          max-height: 55mm;
          max-width: 90mm;
          object-fit: contain;
          display: block;
        }
        .signed-page-doc-frame {
          width: 100%;
          max-width: 160mm;
          height: 70mm;
          border: 1px solid #d1d5db;
          display: block;
        }
        .signed-page-doc-link {
          color: #2563eb;
          text-decoration: underline;
        }
        .signed-page-missing,
        .signed-page-error {
          color: #b91c1c;
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
