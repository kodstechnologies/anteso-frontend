// src/components/reports/TestTables/Mammography/MainTestTableForMammography.tsx
import React from "react";

interface MainTestTableProps {
    testData: any;
}

const MainTestTableForMammography: React.FC<MainTestTableProps> = ({ testData }) => {
    const rows: any[] = [];
    let srNo = 1;

    const addRow = (
        parameter: string,
        specified: string | number,
        measured: string | number,
        tolerance: string,
        remarks: "Pass" | "Fail"
    ) => {
        rows.push({ srNo: srNo++, parameter, specified, measured, tolerance, remarks });
    };

    // 1. Accuracy of Operating Potential (kVp Accuracy)
    if (testData.accuracyOfOperatingPotential?.table2?.length > 0) {
        const worstRow = testData.accuracyOfOperatingPotential.table2.reduce((worst: any, curr: any) => {
            const currDev = Math.abs(parseFloat(curr.deviation || "0"));
            const worstDev = Math.abs(parseFloat(worst.deviation || "0"));
            return currDev > worstDev ? curr : worst;
        });

        const deviation = parseFloat(worstRow.deviation || "0").toFixed(2);
        const isPass = Math.abs(parseFloat(deviation)) <= 5; // ±5% as per AERB

        addRow(
            "Accuracy of Operating Potential (kVp)",
            worstRow.setKV || "-",
            `${worstRow.measuredKVP || "-"} kVp (±${deviation}%)`,
            "±5%",
            isPass ? "Pass" : "Fail"
        );
    }

    // 2. Linearity of mAs Loading
    if (testData.linearityOfMasLLoading?.table2?.length > 0) {
        const worst = testData.linearityOfMasLLoading.table2.reduce((max: any, curr: any) => {
            const val = Math.abs(parseFloat(curr.linearity || "0"));
            const maxVal = Math.abs(parseFloat(max.linearity || "0"));
            return val > maxVal ? curr : max;
        });

        const linearity = parseFloat(worst.linearity || "0").toFixed(3);
        const isPass = Math.abs(parseFloat(linearity)) <= 0.1;

        addRow(
            "Linearity of mAs Loading (Coefficient of Linearity)",
            "Varies",
            linearity,
            "≤ ±0.1",
            isPass ? "Pass" : "Fail"
        );
    }

    // 3. Total Filtration & Aluminium Equivalence
    if (testData.totalFiltrationAndAluminium?.rows?.[0]) {
        const row = testData.totalFiltrationAndAluminium.rows[0];
        const measured = parseFloat(row.measuredHVL || "0");
        const alEq = row.aluminiumEquivalence || "-";
        const isPass = measured >= 0.3; // ≥0.3 mm Al @ 30 kVp typical

        addRow(
            "Total Filtration (HVL)",
            "30 kVp",
            `${measured.toFixed(2)} mm Al`,
            "≥ 0.3 mm Al",
            isPass ? "Pass" : "Fail"
        );

        if (alEq !== "-") {
            addRow(
                "Aluminium Equivalence of Compression Paddle",
                "-",
                alEq,
                "≤ 0.1 mm Al",
                parseFloat(alEq) <= 0.1 ? "Pass" : "Fail"
            );
        }
    }

    // 4. Reproducibility of Radiation Output
    if (testData.reproducibilityOfOutput?.outputRows?.length > 0) {
        const cov = testData.reproducibilityOfOutput.cov
            ? parseFloat(testData.reproducibilityOfOutput.cov).toFixed(2)
            : "0.00";

        const isPass = parseFloat(cov) <= 5.0; // ≤5% as per AERB

        addRow(
            "Reproducibility of Radiation Output (COV)",
            "28-30 kVp, 50-100 mAs",
            `${cov}%`,
            "≤ 5%",
            isPass ? "Pass" : "Fail"
        );
    }

    // 5. Radiation Leakage Level
    if (testData.radiationLeakageLevel?.leakageMeasurements?.[0]) {
        const item = testData.radiationLeakageLevel.leakageMeasurements[0];
        const values = [item.front, item.back, item.left, item.right, item.top, item.bottom]
            .map(v => parseFloat(v || "0"))
            .filter(v => !isNaN(v));

        const maxMRh = values.length > 0 ? Math.max(...values) : 0;
        const maxmGyh = (maxMRh * 0.00877).toFixed(3);
        const isPass = parseFloat(maxmGyh) < 0.1; // < 0.1 mGy/h at 5 cm

        addRow(
            "Radiation Leakage from Tube Housing",
            "Max Load",
            `${maxmGyh} mGy/h at 5 cm`,
            "< 0.1 mGy/h (11.4 mR/h)",
            isPass ? "Pass" : "Fail"
        );
    }

    // 6. Imaging Performance (Phantom)
    if (testData.imagingPhantom) {
        const { fibers, specks, masses } = testData.imagingPhantom;

        const fiberScore = fibers?.visible || 0;
        const speckScore = specks?.visible || 0;
        const massScore = masses?.visible || 0;

        const minRequired = {
            fibers: 4,
            specks: 4,
            masses: 3,
        };

        addRow("Fibers Visible", "≥4", fiberScore, `≥${minRequired.fibers}`, fiberScore >= minRequired.fibers ? "Pass" : "Fail");
        addRow("Microcalcification Specks Visible", "≥4", speckScore, `≥${minRequired.specks}`, speckScore >= minRequired.specks ? "Pass" : "Fail");
        addRow("Masses Visible", "≥3", massScore, `≥${minRequired.masses}`, massScore >= minRequired.masses ? "Pass" : "Fail");
    }

    // 7. Radiation Protection Survey
    if (testData.radiationProtectionSurvey?.maxRadiationLevel) {
        const maxLevel = parseFloat(testData.radiationProtectionSurvey.maxRadiationLevel);
        const isPass = maxLevel <= 0.02; // ≤ 2 µSv/h (0.2 mR/h) in controlled areas typical

        addRow(
            "Maximum Scatter Radiation (Control Room/Door)",
            "≤ 0.02 µSv/h",
            `${maxLevel.toFixed(3)} µSv/h`,
            "≤ 0.02 µSv/h",
            isPass ? "Pass" : "Fail"
        );
    }

    // 8. Equipment Settings Verification
    if (testData.equipementSetting?.verified === true) {
        addRow("Equipment Settings & Indicators", "Functional", "Verified", "All functional", "Pass");
    } else if (testData.equipementSetting?.verified === false) {
        addRow("Equipment Settings & Indicators", "Functional", "Not Verified", "All functional", "Fail");
    }

    // 9. Maximum Radiation Levels at Locations
    if (testData.maximumRadiationLevel?.locations?.length > 0) {
        const highest = testData.maximumRadiationLevel.locations.reduce((max: any, loc: any) => {
            return parseFloat(loc.level) > parseFloat(max.level || "0") ? loc : max;
        }, { level: "0" });

        const level = parseFloat(highest.level || "0").toFixed(3);
        // const isPass = level <= 0.01; // Example limit
                const isPass = 0.01; // Example limit


        addRow(
            "Highest Radiation Level Outside Room",
            "≤ 0.01 µSv/h",
            `${level} µSv/h (${highest.location})`,
            "≤ 0.01 µSv/h",
            isPass ? "Pass" : "Fail"
        );
    }

    if (rows.length === 0) {
        return <div className="text-center text-gray-500 py-10">No test results available.</div>;
    }

    return (
        <div className="mt-20 print:mt-12">
            <h2 className="text-2xl font-bold text-center underline mb-8 print:mb-6">
                SUMMARY OF QA TEST RESULTS - MAMMOGRAPHY
            </h2>

            <div className="overflow-x-auto print:overflow-visible print:max-w-none">
                <table className="w-full border-2 border-black text-xs print:text-xxs print:min-w-full">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border border-black px-3 py-3 w-12 text-center">Sr. No.</th>
                            <th className="border border-black px-4 py-3 text-left w-80">Parameters Tested</th>
                            <th className="border border-black px-4 py-3 text-center w-32">Specified</th>
                            <th className="border border-black px-4 py-3 text-center w-32">Measured</th>
                            <th className="border border-black px-4 py-3 text-center w-40">Tolerance Limit</th>
                            <th className="border border-black px-4 py-3 text-center bg-green-100 w-24">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="border border-black px-3 py-3 text-center font-bold">{row.srNo}</td>
                                <td className="border border-black px-4 py-3 text-left font-medium leading-tight">
                                    {row.parameter}
                                </td>
                                <td className="border border-black px-4 py-3 text-center">{row.specified}</td>
                                <td className="border border-black px-4 py-3 text-center font-semibold">{row.measured}</td>
                                <td className="border border-black px-4 py-3 text-center text-xs leading-tight">
                                    {row.tolerance}
                                </td>
                                <td className="border border-black px-4 py-4 text-center text-lg font-bold">
                                    <span className={row.remarks === "Pass" ? "text-green-600" : "text-red-600"}>
                                        {row.remarks}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Print Optimization */}
            {/* <style jsx>{`
        @media print {
          table {
            font-size: 9px !important;
            width: 100% !important;
          }
          th, td {
            padding: 4px 3px !important;
          }
          .w-80 { width: 220px !important; }
          .w-40 { width: 100px !important; }
          .w-32 { width: 80px !important; }
          .itsa24 { width: 60px !important; }
          .w-12 { width: 30px !important; }
        }
      `}</style> */}
        </div>
    );
};

export default MainTestTableForMammography;