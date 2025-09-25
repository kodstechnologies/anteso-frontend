"use client"
import { useState } from "react"
import { Link } from "react-router-dom"
import IconEye from "../../Icon/IconEye"
import type { Salary } from "../../../types/hrms-types"

export default function SalaryManagement() {
  const [isAddingSalary, setIsAddingSalary] = useState(false)
  const [salaries, setSalaries] = useState<Salary[]>([
    {
      id: "1",
      date: new Date(2025, 4, 1),
      month: "January",
      fixed: 25000,
      incentive: 2000,
    },
    {
      id: "2",
      date: new Date(2025, 4, 1),
      month: "February",
      fixed: 25000,
      incentive: 2000,
    },
  ])
  const [newSalary, setNewSalary] = useState<Omit<Salary, "id">>({
    date: new Date(),
    month: "",
    fixed: 25000,
    incentive: 0,
  })

  // Handle adding new salary
  const handleAddSalary = () => {
    if (newSalary.month && newSalary.fixed > 0) {
      const salary: Salary = {
        ...newSalary,
        id: Date.now().toString(),
      }
      setSalaries([...salaries, salary])
      setNewSalary({
        date: new Date(),
        month: "",
        fixed: 25000,
        incentive: 0,
      })
      setIsAddingSalary(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Salary Management</h2>
        <button
          onClick={() => setIsAddingSalary(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add Salary
        </button>
      </div>
      {/* Add Salary Form */}
      {isAddingSalary && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Add New Salary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Month</label>
              <select
                value={newSalary.month}
                onChange={(e) => setNewSalary({ ...newSalary, month: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="" disabled>Select Month</option>
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ].map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Fixed (₹)</label>
              <input
                type="number"
                value={newSalary.fixed || ""}
                onChange={(e) => setNewSalary({ ...newSalary, fixed: Number.parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Incentive (₹)</label>
              <input
                type="number"
                value={newSalary.incentive || ""}
                onChange={(e) => setNewSalary({ ...newSalary, incentive: Number.parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newSalary.date.toISOString().split("T")[0]}
                onChange={(e) => setNewSalary({ ...newSalary, date: new Date(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setIsAddingSalary(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSalary}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Release Salary
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Salary Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Date</th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Month</th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Fixed</th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Incentive</th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Total</th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">PaySlip</th>
            </tr>
          </thead>
          <tbody>
            {salaries.length > 0 ? (
              salaries.map((salary) => (
                <tr key={salary.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border border-gray-300 text-gray-700">{salary.date.toLocaleDateString()}</td>
                  <td className="px-4 py-3 border border-gray-300 text-gray-700">{salary.month}</td>
                  <td className="px-4 py-3 border border-gray-300 text-gray-700">{salary.fixed}</td>
                  <td className="px-4 py-3 border border-gray-300 text-gray-700">{salary.incentive}</td>
                  <td className="px-4 py-3 border border-gray-300 text-gray-700">{salary.fixed + salary.incentive}</td>
                  <td className="px-4 py-3 border border-gray-300 text-gray-700">
                    <Link to="/admin/hrms/payslip">
                      <IconEye />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No salaries recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
