// src/components/Standards.tsx
import React from "react";

export interface Standard {
  slNumber: string;
  nomenclature: string;
  make: string;
  model: string;
  SrNo: string;
  range: string;
  certificate: string | null;
  calibrationCertificateNo: string;
  calibrationValidTill: string;
  uncertainity: string; // <-- user-editable
}

interface StandardsProps {
  standards: Standard[];
}

/**
 * Renders the "Standards / Tools Used" table.
 * The **Uncertainty** column contains an <input> so the engineer can fill it.
 */
const Standards: React.FC<StandardsProps> = ({ standards }) => {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-blue-700 mb-3">
        Standards / Tools Used
      </h2>

      {standards.length === 0 ? (
        <p className="text-sm text-gray-600">No tools assigned for this service.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-300">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Sl. No.
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Nomenclature
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Make
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Sr. No.
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Range
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Cal. Cert. No.
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Valid Till
                </th>
                {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Uncertainty
                </th> */}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {standards.map((tool, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {tool.slNumber}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {tool.nomenclature}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {tool.make}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {tool.model}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {tool.SrNo}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">{tool.range}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {tool.certificate || "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {tool.calibrationCertificateNo}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {tool.calibrationValidTill}
                  </td>

                  {/* ---------- UNCERTAINTY INPUT ---------- */}
                  {/* <td className="px-3 py-2">
                    <input
                      type="text"
                      defaultValue={tool.uncertainity}
                      placeholder="± …"
                      className="w-full min-w-[80px] border-b border-gray-400 focus:border-blue-600 outline-none text-sm"
                    />
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default Standards;