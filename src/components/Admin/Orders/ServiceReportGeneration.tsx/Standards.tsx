import React from "react";
import { Standard } from "./GenerateReport";

interface StandardsProps {
  standards: Standard[];
}

const Standards: React.FC<StandardsProps> = ({ standards }) => {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-blue-700 mb-3">
        4. Standards Used for Testing
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border px-3 py-2">Sl No</th>
              <th className="border px-3 py-2">Nomenclature</th>
              <th className="border px-3 py-2">Make</th>
              <th className="border px-3 py-2">Model</th>
              <th className="border px-3 py-2">Range</th>
              <th className="border px-3 py-2">Certificate</th>
              <th className="border px-3 py-2">Calibration Cert No</th>
              <th className="border px-3 py-2">Calibration Valid Till</th>
            </tr>
          </thead>
          <tbody>
            {standards.map((item, index) => (
              <tr key={index} className="text-center">
                <td className="border px-3 py-2">{item.slNumber}</td>
                <td className="border px-3 py-2">{item.nomenclature}</td>
                <td className="border px-3 py-2">{item.make}</td>
                <td className="border px-3 py-2">{item.model}</td>
                <td className="border px-3 py-2">{item.range}</td>
                <td className="border px-3 py-2">{item.certificate}</td>
                <td className="border px-3 py-2">
                  {item.calibrationCertificateNo}
                </td>
                <td className="border px-3 py-2">{item.calibrationValidTill}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Standards;
