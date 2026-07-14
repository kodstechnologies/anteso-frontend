export const ReportPdfPageDeclaration: React.FC<{
    todayDate: string;
    customerCity: string;
    qrCode?: string;
    engineerName?: string;
    authorizedSignatoryName?: string;
    authorizedSignatorySignature?: string;
}> = ({
    todayDate,
    customerCity,
    qrCode,
    engineerName,
    authorizedSignatoryName,
    authorizedSignatorySignature,
}) => (
    <div className="report-pdf-declaration-block" style={{ position: "relative", minHeight: "100%", height: "100%", paddingTop: "8mm", display: "flex", flexDirection: "column" }}>
        <p style={{ fontSize: "11px", lineHeight: "1.4", marginBottom: "26mm" }}>
            I hereby undertake that all the information provided above is correct and in accordance with the detailed Quality Assurance Report enclosed herewith.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "22mm" }}>
            <div style={{ fontSize: "11px", lineHeight: "1.5" }}>
                <p><strong>Date:</strong> {todayDate}</p>
                <p><strong>Place:</strong> {customerCity}</p>
            </div>
            <div style={{ width: "42%", textAlign: "left", fontSize: "11px", lineHeight: "1.35" }}>
                <p>Signature of the Testing Engineer:</p>
                <p>Name of the Testing Engineer:{engineerName ? ` ${engineerName}` : ""}</p>
            </div>
        </div>

        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "22mm",
                marginTop: "16mm",
                fontSize: "11px",
                lineHeight: "1.35",
            }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <p>Signature of Institution's Representative:</p>
                <p>Name of the Institution:</p>
                <p>Seal of the Institution:</p>
            </div>
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "8px",
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p>Authorised Signatory:</p>
                    <p>Name of Service Agency:</p>
                    <p>Seal of Service Agency:</p>
                </div>
                {authorizedSignatorySignature ? (
                    <img
                        src={authorizedSignatorySignature}
                        alt={authorizedSignatoryName || "Authorised Signatory"}
                        style={{
                            maxHeight: "22mm",
                            maxWidth: "40mm",
                            objectFit: "contain",
                            display: "block",
                            flexShrink: 0,
                        }}
                    />
                ) : null}
            </div>
        </div>

        {qrCode?.trim() ? (
            <div
                style={{
                    marginTop: "auto",
                    paddingTop: "16mm",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "22mm",
                }}
            >
                <div />
                <div style={{ fontSize: "11px", lineHeight: "1.35" }}>
                    <p style={{ margin: 0 }}><strong>Engineer Verification QR Code:</strong></p>
                    <img
                        src={qrCode}
                        alt="Engineer Verification QR Code"
                        style={{ width: "24mm", height: "24mm", objectFit: "contain", marginTop: "4mm", display: "block" }}
                    />
                </div>
            </div>
        ) : null}
    </div>
);
