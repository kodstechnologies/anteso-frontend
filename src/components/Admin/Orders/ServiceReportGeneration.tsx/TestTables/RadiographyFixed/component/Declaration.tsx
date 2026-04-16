import signature from "../../../../../../../../src/assets/quotationImg/signature.png";
export const ReportPdfPageDeclaration: React.FC<{
    todayDate: string;
    customerCity: string;
}> = ({ todayDate, customerCity }) => (
    <div className="report-pdf-declaration-block" style={{ position: "relative", minHeight: "100%", paddingTop: "8mm" }}>
        <p style={{ fontSize: "11px", lineHeight: "1.4", marginBottom: "26mm" }}>
            I hereby undertake that all the information provided above is correct and in accordance with the detailed Quality Assurance Report enclosed herewith.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "22mm" }}>
            <div style={{ fontSize: "11px", lineHeight: "1.5" }}>
                <p><strong>Date:</strong> {todayDate}</p>
                <p><strong>Place:</strong> {customerCity}</p>
            </div>
            <div style={{ width: "42%", textAlign: "left", fontSize: "11px", lineHeight: "1.35" }}>
                <div style={{ borderTop: "1px solid #000", marginBottom: "6px", height: "18mm" }} />
                {/* <img src={signature} alt="Signature" style={{ width: "40%", height: "40%" }} /> */}
                <p>Signature of the Testing Engineer:</p>
                <p>Name of the Testing Engineer:</p>
            </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22mm", marginTop: "16mm" }}>
            <div style={{ fontSize: "11px", lineHeight: "1.35" }}>
                <div style={{ borderTop: "1px solid #000", marginBottom: "6px", height: "20mm" }} />
                <p>Signature of Institution's Representative:</p>
                <p>Name of the Institution:</p>
                <p>Seal of the Institution:</p>
            </div>
            <div style={{ fontSize: "11px", lineHeight: "1.35" }}>
                <div style={{ borderTop: "1px solid #000", marginBottom: "6px", height: "20mm" }} />
                <p>Authorised Signatory:</p>
                <p>Name of Service Agency:</p>
                <p>Seal of Service Agency:</p>
            </div>
        </div>
    </div>
);