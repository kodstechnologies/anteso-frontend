"use client"
import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import IconEye from "../../Icon/IconEye"
import { addSalary, getSalaries, updateSalary, deleteSalary } from "../../../api"

type Salary = {
  _id: string
  employee: string
  date: string | Date
  basicSalary: number
  incentive: number
  leaveWithoutPayDays?: number
  leaveDeduction?: number
  totalSalary: number
  status: "Pending" | "Processed" | "Paid"
  createdAt?: string
  updatedAt?: string
}

export default function SalaryManagement() {
  const { id } = useParams<{ id: string }>()
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(false)
  const [addingMonth, setAddingMonth] = useState<number | null>(null)
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null)

  const [newSalary, setNewSalary] = useState<Omit<Salary, "_id" | "employee" | "status" | "createdAt" | "updatedAt" | "leaveDeduction" | "leaveWithoutPayDays" | "totalSalary">>({
    date: new Date(),
    basicSalary: 25000,
    incentive: 0,
  })

  useEffect(() => {
    if (!id) return
    fetchSalaries()
  }, [id])

  const fetchSalaries = async () => {
    try {
      setLoading(true)
      const res: any = await getSalaries(id)
      setSalaries(res.data.data || [])
    } catch (error) {
      console.error(error)
      alert("Failed to fetch salaries")
    } finally {
      setLoading(false)
    }
  }

  const handleAddOrEditSalary = async (monthIndex: number) => {
    if (!newSalary.date || newSalary.basicSalary <= 0) return alert("Please provide valid salary")

    try {
      setLoading(true)
      if (editingSalaryId) {
        await updateSalary(editingSalaryId, {
          date: newSalary.date,
          basicSalary: newSalary.basicSalary,
          incentive: newSalary.incentive || 0,
        })
        alert("Salary updated successfully")
      } else {
        await addSalary(id, {
          date: newSalary.date,
          basicSalary: newSalary.basicSalary,
          incentive: newSalary.incentive || 0,
        })
        alert("Salary added successfully")
      }

      setNewSalary({ date: new Date(), basicSalary: 25000, incentive: 0 })
      setAddingMonth(null)
      setEditingSalaryId(null)
      fetchSalaries()
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Failed to save salary")
    } finally {
      setLoading(false)
    }
  }

  const handleEditSalary = (salary: Salary, monthIndex: number) => {
    setAddingMonth(monthIndex)
    setEditingSalaryId(salary._id)
    setNewSalary({
      date: new Date(salary.date),
      basicSalary: salary.basicSalary,
      incentive: salary.incentive,
    })
  }

  const handleDeleteSalary = async (salaryId: string) => {
    if (!confirm("Are you sure you want to delete this salary?")) return

    try {
      setLoading(true)
      await deleteSalary(salaryId)
      alert("Salary deleted successfully")
      fetchSalaries()
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Failed to delete salary")
    } finally {
      setLoading(false)
    }
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const salariesByMonth = months.map((month, index) =>
    salaries
      .filter(s => new Date(s.date).getMonth() === index)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  )

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Salary Management</h2>

      {months.map((month, index) => (
        <div key={month} className="mb-8 p-6 border border-gray-200 rounded-2xl bg-gray-50 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">{month}</h3>
            <button
              onClick={() => {
                setAddingMonth(addingMonth === index ? null : index)
                const date = new Date()
                date.setMonth(index)
                setNewSalary({ ...newSalary, date })
                setEditingSalaryId(null)
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1 rounded-full shadow-md hover:scale-105 transform transition"
            >
              Add Salary
            </button>
          </div>

          {addingMonth === index && (
            <div className="mb-4 p-4 border border-gray-300 rounded-xl bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Salary Date</label>
                  <input
                    type="date"
                    value={new Date(newSalary.date).toISOString().split("T")[0]}
                    onChange={e => setNewSalary({ ...newSalary, date: new Date(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Fixed (₹)</label>
                  <input
                    type="number"
                    value={newSalary.basicSalary || ""}
                    onChange={e => setNewSalary({ ...newSalary, basicSalary: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Incentive (₹)</label>
                  <input
                    type="number"
                    value={newSalary.incentive || ""}
                    onChange={e => setNewSalary({ ...newSalary, incentive: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="flex space-x-2 md:col-span-3 mt-2">
                  <button
                    onClick={() => { setAddingMonth(null); setEditingSalaryId(null) }}
                    className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddOrEditSalary(index)}
                    className="bg-green-500 text-white px-4 py-2 rounded-full shadow-md hover:scale-105 transform transition"
                  >
                    {editingSalaryId ? "Update Salary" : "Release Salary"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {salariesByMonth[index].length > 0 ? (
            <table className="min-w-full border-collapse rounded-xl overflow-hidden shadow-md">
              <thead className="bg-gray-100">
                <tr>
                  {["Date", "Fixed", "Incentive", "Leave Deduction", "Total", "PaySlip", "Actions"].map(head => (
                    <th key={head} className="px-4 py-2 border-b text-left text-gray-700 font-semibold uppercase text-sm">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salariesByMonth[index].map(salary => (
                  <tr key={salary._id} className="bg-white hover:bg-gray-50 transition">
                    <td className="px-4 py-2 border-b">{new Date(salary.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 border-b">{salary.basicSalary}</td>
                    <td className="px-4 py-2 border-b">{salary.incentive}</td>
                    <td className="px-4 py-2 border-b">{salary.leaveDeduction || 0}</td>
                    <td className="px-4 py-2 border-b">{salary.totalSalary}</td>
                    <td className="px-4 py-2 border-b">
                      <Link to={`/admin/hrms/payslip/${salary._id}`}>
                        <IconEye className="hover:text-blue-500 transition" />
                      </Link>
                    </td>
                    <td className="px-4 py-2 border-b flex gap-2">
                      <button
                        className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition"
                        onClick={() => handleEditSalary(salary, index)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        onClick={() => handleDeleteSalary(salary._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400">No salary recorded yet</p>
          )}
        </div>
      ))}
    </div>
  )
}
