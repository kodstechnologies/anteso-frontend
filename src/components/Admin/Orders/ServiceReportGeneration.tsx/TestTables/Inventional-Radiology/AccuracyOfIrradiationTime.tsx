// src/components/TestTables/AccuracyOfIrradiationTime.tsx
import React, { useState, useEffect } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface AccuracyOfIrradiationTimeProps {
  serviceId: string;
}

/* ────────────────────── Row Types ────────────────────── */
interface Table1Row {
  id: string;
  fcd: string;   // FCD (cm)
  kvMa: string;  // kV.mA
}
interface Table2Row {
  id: string;
  setTime: string;      // mSec
  measuredTime: string; // mSec
}

/* ────────────────────── Main Component ────────────────────── */
const AccuracyOfIrradiationTime: React.FC<AccuracyOfIrradiationTimeProps> = ({
  serviceId,
}) => {
  /* ────── Debug / future API ────── */
  useEffect(() => {
    console.log("serviceId →", serviceId);
    // TODO: fetch saved rows for this serviceId
  }, [serviceId]);

  /* ────── Table 1 – Test Conditions ────── */
  const [table1Rows, setTable1Rows] = useState<Table1Row[]>([
    { id: "1", fcd: "", kvMa: "" },
  ]);

  const addTable1Row = () => {
    setTable1Rows((prev) => [
      ...prev,
      { id: Date.now().toString(), fcd: "", kvMa: "" },
    ]);
  };
  const deleteTable1Row = (id: string) => {
    if (table1Rows.length > 1) {
      setTable1Rows((prev) => prev.filter((r) => r.id !== id));
    }
  };
  const updateTable1 = (id: string, field: keyof Table1Row, value: string) => {
    setTable1Rows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  /* ────── Table 2 – Timer Accuracy ────── */
  const [table2Rows, setTable2Rows] = useState<Table2Row[]>([
    { id: "1", setTime: "", measuredTime: "" },
  ]);

  const addTable2Row = () => {
    setTable2Rows((prev) => [
      ...prev,
      { id: Date.now().toString(), setTime: "", measuredTime: "" },
    ]);
  };
  const deleteTable2Row = (id: string) => {
    if (table2Rows.length > 1) {
      setTable2Rows((prev) => prev.filter((r) => r.id !== id));
    }
  };
  const updateTable2 = (id: string, field: keyof Table2Row, value: string) => {
    setTable2Rows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  /* ────── Tolerance ────── */
  const [toleranceOperator, setToleranceOperator] = useState("<=");
  const [toleranceValue, setToleranceValue] = useState("");

  /* ────── Calculations ────── */
  const calcError = (set: string, meas: string): string => {
    const s = parseFloat(set);
    const m = parseFloat(meas);
    if (isNaN(s) || isNaN(m) || s === 0) return "-";
    return Math.abs((m - s) / s * 100).toFixed(2);
  };

  const getRemark = (errorPct: string): "PASS" | "FAIL" | "-" => {
    if (!toleranceValue || errorPct === "-") return "-";
    const err = parseFloat(errorPct);
    const tol = parseFloat(toleranceValue);
    if (isNaN(err) || isNaN(tol)) return "-";

    switch (toleranceOperator) {
      case ">":
        return err > tol ? "FAIL" : "PASS";
      case "<":
        return err < tol ? "PASS" : "FAIL";
      case ">=":
        return err >= tol ? "FAIL" : "PASS";
      case "<=":
        return err <= tol ? "PASS" : "FAIL";
      default:
        return "-";
    }
  };

  /* ────── Render ────── */
  return (
    <div className="w-full space-y-6">

      {/* ────────────────────── Table 1 – Test Conditions ────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
            1. Test Conditions
          </h3>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                FCD (cm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                kV.mA
              </th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table1Rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={row.fcd}
                    onChange={(e) => updateTable1(row.id, "fcd", e.target.value)}
                    className="w-full px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={row.kvMa}
                    onChange={(e) => updateTable1(row.id, "kvMa", e.target.value)}
                    className="w-full px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="80/100"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  {table1Rows.length > 1 && (
                    <button
                      onClick={() => deleteTable1Row(row.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete row"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-300 flex justify-start">
          <button
            onClick={addTable1Row}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            Add Row
          </button>
        </div>
      </div>

      {/* ────────────────────── Table 2 – Accuracy of Irradiation Time ────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
            2. Accuracy of Irradiation Time
          </h3>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Set Time (mSec)
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Measured Time (mSec)
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                % Error
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Remarks
              </th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table2Rows.map((row) => {
              const error = calcError(row.setTime, row.measuredTime);
              const remark = getRemark(error);
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.1"
                      value={row.setTime}
                      onChange={(e) =>
                        updateTable2(row.id, "setTime", e.target.value)
                      }
                      className="w-full px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.1"
                      value={row.measuredTime}
                      onChange={(e) =>
                        updateTable2(row.id, "measuredTime", e.target.value)
                      }
                      className="w-full px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    {error}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${remark === "PASS"
                          ? "bg-green-100 text-green-800"
                          : remark === "FAIL"
                            ? "bg-red-100 text-red-800"
                            : "text-gray-400"
                        }`}
                    >
                      {remark || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {table2Rows.length > 1 && (
                      <button
                        onClick={() => deleteTable2Row(row.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete row"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-300 flex justify-start">
          <button
            onClick={addTable2Row}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            Add Row
          </button>
        </div>
      </div>

      {/* ────────────────────── Tolerance Card ────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
        <h4 className="text-sm font-semibold text-indigo-900 mb-2">
          Tolerance Setting
        </h4>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-indigo-800">Error should be</span>
          <select
            value={toleranceOperator}
            onChange={(e) => setToleranceOperator(e.target.value)}
            className="px-3 py-1 border border-indigo-300 rounded bg-white text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value=">">greater than</option>
            <option value="<">less than</option>
            <option value=">=">greater than or equal to</option>
            <option value="<=">less than or equal to</option>
          </select>

          <input
            type="number"
            step="0.1"
            value={toleranceValue}
            onChange={(e) => setToleranceValue(e.target.value)}
            className="w-20 px-2 py-1 text-center border border-indigo-300 rounded bg-white text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="5.0"
          />
          <span className="font-medium text-indigo-800">%</span>
        </div>
      </div>

      {/* ────────────────────── Info Box ────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <p className="font-medium mb-1">Formula:</p>
        <p className="font-mono text-xs">
          % Error = |(Measured − Set) / Set| × 100
        </p>
        <p className="mt-2">
          <strong>Remark:</strong> Auto‑determined based on tolerance (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            PASS
          </span>{" "}
          /{" "}
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            FAIL
          </span>
          ).
        </p>
      </div>
    </div>
  );
};

export default AccuracyOfIrradiationTime;