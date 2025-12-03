import React from 'react';

interface TestResult {
    srNo: string;
    parameterTested: string;
    specifiedValue: string;
    measuredValue: string;
    tolerance: string;
    remark: string;
}

interface DentalConeBeamCTResultTableProps {
    testResults: TestResult[];
    onUpdate?: (index: number, field: keyof TestResult, value: string) => void;
}

const DentalConeBeamCTResultTable: React.FC<DentalConeBeamCTResultTableProps> = ({
    testResults,
    onUpdate,
}) => {
    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <h3 className="px-6 py-3 text-lg font-semibold bg-purple-50 border-b">
                CT Scan Test Result Summary
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                Sr No
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                Parameters Tested
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                Specified Value
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                Measured Value
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                                Tolerance
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Remark
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {testResults.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-r text-center font-medium">
                                    {row.srNo}
                                </td>
                                <td className="px-4 py-2 border-r font-medium">
                                    {row.parameterTested}
                                </td>
                                <td className="px-4 py-2 border-r">
                                    <input
                                        type="text"
                                        value={row.specifiedValue}
                                        onChange={(e) =>
                                            onUpdate?.(index, 'specifiedValue', e.target.value)
                                        }
                                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g. 16.00"
                                    />
                                </td>
                                <td className="px-4 py-2 border-r text-center font-medium bg-gray-100">
                                    {row.measuredValue || '—'}
                                </td>
                                <td className="px-4 py-2 border-r text-center text-sm">
                                    {row.tolerance}
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={row.remark}
                                        onChange={(e) => onUpdate?.(index, 'remark', e.target.value)}
                                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g. Pass"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DentalConeBeamCTResultTable;