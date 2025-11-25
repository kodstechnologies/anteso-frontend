import React, { useState, useMemo } from 'react';

const HighContrastResolution: React.FC = () => {
  const [measuredLpPerMm, setMeasuredLpPerMm] = useState<string>('');
  const [recommendedStandard, setRecommendedStandard] = useState<string>('1.50');
  const [tolerance, setTolerance] = useState<string>('');

  // Parse tolerance (supports ±5%, +10%, 5%, etc.)
  const parseTolerance = (tol: string): { value: number; isPlusMinus: boolean } | null => {
    if (!tol.trim()) return null;
    const cleaned = tol.trim().replace('%', '').trim();
    const match = cleaned.match(/^([±+-]?\d*\.?\d+)$/);
    if (!match) return null;
    const num = parseFloat(match[1]);
    if (isNaN(num)) return null;
    const isPlusMinus = cleaned.includes('±');
    return { value: Math.abs(num), isPlusMinus };
  };

  // Hidden PASS/FAIL logic (higher lp/mm = better)
  const remark = useMemo(() => {
    const measuredStr = measuredLpPerMm.trim();
    const standardStr = recommendedStandard.trim();
    const tolInput = tolerance.trim();

    if (!measuredStr || !standardStr) return '';
    if (!tolInput) return 'Tolerance not set';

    const measured = parseFloat(measuredStr);
    const standard = parseFloat(standardStr);

    if (isNaN(measured) || isNaN(standard)) return '';

    const parsedTol = parseTolerance(tolInput);
    if (!parsedTol) return '';

    const { value: tolPercent, isPlusMinus } = parsedTol;
    const toleranceAmount = (standard * tolPercent) / 100;

    // Higher value = better performance
    const lowerLimit = isPlusMinus ? standard - toleranceAmount : standard;
    const upperLimit = standard + toleranceAmount;

    const isPass = measured >= lowerLimit && measured <= upperLimit;

    return isPass ? 'PASS' : 'FAIL';
  }, [measuredLpPerMm, recommendedStandard, tolerance]);

  return (
    <div className="p-6 max-w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6">High Contrast Resolution</h2>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parameter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit / Requirement
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Row 1: Measured Value */}
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">
                Bar strips resolved on the monitor (lp/mm)
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={measuredLpPerMm}
                  onChange={(e) => setMeasuredLpPerMm(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1.60"
                />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                lp/mm pattern must be resolved
              </td>
            </tr>

            {/* Row 2: Recommended Standard */}
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Recommended performance standard
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  value={recommendedStandard}
                  onChange={(e) => setRecommendedStandard(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                />
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                lp/mm pattern must be resolved
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tolerance Input */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Tolerance &lt;</span>
            <input
              type="text"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g. ±10%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighContrastResolution;