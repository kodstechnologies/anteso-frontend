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
  leaveDeduction?: number
  totalSalary: number
  status: "Pending" | "Processed" | "Paid"
  createdAt?: string
  updatedAt?: string
}

type NewSalaryForm = {
  date: Date
  basicSalary: number | null
  incentive: number | null
  leaveDeduction: number | null
  totalSalary: number
}

export default function SalaryManagement() {
  const { id } = useParams<{ id: string }>()
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(false)
  const [addingMonth, setAddingMonth] = useState<number | null>(null)
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pageStates, setPageStates] = useState<Record<number, number>>({})

  const initialNewSalary: NewSalaryForm = {
    date: new Date(),
    basicSalary: 25000,
    incentive: 0,
    leaveDeduction: 0,
    totalSalary: 25000,
  }

  const [newSalary, setNewSalary] = useState<NewSalaryForm>(initialNewSalary)

  const recordsPerPage = 5

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
    } finally {
      setLoading(false)
    }
  }

  // Auto calculate total salary whenever fields change
  useEffect(() => {
    const bs = newSalary.basicSalary ?? 0
    const inc = newSalary.incentive ?? 0
    const ded = newSalary.leaveDeduction ?? 0
    const total = bs + inc - ded
    setNewSalary(prev => ({ ...prev, totalSalary: total > 0 ? total : 0 }))
  }, [newSalary.basicSalary, newSalary.incentive, newSalary.leaveDeduction])

  // Get month range for validation and input restrictions
  const getMonthRange = (monthIndex: number) => {
    const year = new Date().getFullYear()
    const startDate = new Date(year, monthIndex, 1)
    startDate.setHours(0, 0, 0, 0) // Normalize to midnight local time
    const endDate = new Date(year, monthIndex + 1, 0)
    endDate.setHours(23, 59, 59, 999) // Set to end of the last day
    return { startDate, endDate }
  }

  // Format date for input (YYYY-MM-DD) in local timezone
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Validation
  const validateSalary = (monthIndex: number) => {
    const newErrors: Record<string, string> = {}
    const { startDate, endDate } = getMonthRange(monthIndex)

    if (!newSalary.date || isNaN(newSalary.date.getTime())) {
      newErrors.date = "Required"
    } else if (
      newSalary.date.getFullYear() !== startDate.getFullYear() ||
      newSalary.date.getMonth() !== monthIndex
    ) {
      newErrors.date = `Date must be in ${months[monthIndex]} ${startDate.getFullYear()}`
    }
    if (newSalary.basicSalary === null || newSalary.basicSalary <= 0) {
      newErrors.basicSalary = "Required"
    }
    if (newSalary.incentive === null) {
      newErrors.incentive = "Required"
    } else if (newSalary.incentive < 0) {
      newErrors.incentive = "Cannot be negative"
    }
    if (newSalary.leaveDeduction === null) {
      newErrors.leaveDeduction = "Required"
    } else if (newSalary.leaveDeduction < 0) {
      newErrors.leaveDeduction = "Cannot be negative"
    }
    if (newSalary.totalSalary <= 0) {
      newErrors.totalSalary = "Must be positive"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddOrEditSalary = async (monthIndex: number) => {
    if (!validateSalary(monthIndex)) return

    try {
      setLoading(true)
      const saveData = {
        date: newSalary.date.toISOString(), // Send ISO string to backend
        basicSalary: newSalary.basicSalary!,
        incentive: newSalary.incentive ?? 0,
        leaveDeduction: newSalary.leaveDeduction ?? 0,
        totalSalary: newSalary.totalSalary,
      }
      if (editingSalaryId) {
        await updateSalary(editingSalaryId, saveData)
      } else {
        await addSalary(id, saveData)
      }

      setNewSalary(initialNewSalary)
      setAddingMonth(null)
      setEditingSalaryId(null)
      setErrors({})
      fetchSalaries()
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditSalary = (salary: Salary, monthIndex: number) => {
    const salaryDate = new Date(salary.date)
    salaryDate.setHours(0, 0, 0, 0) // Normalize to midnight local time
    setAddingMonth(monthIndex)
    setEditingSalaryId(salary._id)
    setNewSalary({
      date: salaryDate,
      basicSalary: salary.basicSalary,
      incentive: salary.incentive,
      leaveDeduction: salary.leaveDeduction || 0,
      totalSalary: salary.totalSalary,
    })
    setErrors({})
  }

  const handleDeleteSalary = async (salaryId: string) => {
    if (!confirm("Are you sure you want to delete this salary?")) return

    try {
      setLoading(true)
      await deleteSalary(salaryId)
      fetchSalaries()
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (monthIndex: number, newPage: number) => {
    setPageStates(prev => ({ ...prev, [monthIndex]: newPage }))
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const salariesByMonth = months.map((_, index) =>
    salaries
      .filter(s => new Date(s.date).getMonth() === index)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  )

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">💼 Salary Management</h2>

      {months.map((month, index) => {
        const currentPage = pageStates[index] || 0
        const monthSalaries = salariesByMonth[index]
        const totalPages = Math.ceil(monthSalaries.length / recordsPerPage)
        const startIdx = currentPage * recordsPerPage
        const paginatedSalaries = monthSalaries.slice(startIdx, startIdx + recordsPerPage)
        const { startDate, endDate } = getMonthRange(index)

        return (
          <div key={month} className="mb-8 p-6 border border-gray-200 rounded-2xl bg-gray-50 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-700">{month}</h3>
              <button
                onClick={() => {
                  if (addingMonth === index) {
                    setAddingMonth(null)
                    setNewSalary(initialNewSalary)
                    setEditingSalaryId(null)
                    setErrors({})
                  } else {
                    const date = new Date(new Date().getFullYear(), index, 1)
                    date.setHours(0, 0, 0, 0) // Normalize to midnight local time
                    console.log("Setting date for", month, formatDateForInput(date)) // Debug log
                    setAddingMonth(index)
                    setNewSalary({
                      date,
                      basicSalary: null,
                      incentive: null,
                      leaveDeduction: null,
                      totalSalary: 0,
                    })
                    setEditingSalaryId(null)
                    setErrors({})
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1 rounded-full shadow-md hover:scale-105 transform transition"
              >
                {addingMonth === index ? "Cancel" : "+ Add Salary"}
              </button>
            </div>

            {addingMonth === index && (
              <div className="mb-4 p-4 border border-gray-300 rounded-xl bg-white">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { label: `Salary Date (${month}) *`, field: "date", type: "date" },
                    { label: "Basic Salary (₹) *", field: "basicSalary", type: "number" },
                    { label: "Incentive (₹) *", field: "incentive", type: "number" },
                    { label: "Leave Deduction (₹) *", field: "leaveDeduction", type: "number" },
                    { label: "Total Salary (₹)", field: "totalSalary", type: "number" },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label className="block text-gray-700 mb-1 font-medium">{label}</label>
                      <input
                        type={type}
                        readOnly={field === "totalSalary"}
                        value={
                          field === "date"
                            ? formatDateForInput(newSalary.date)
                            : field === "totalSalary"
                              ? newSalary.totalSalary
                              : (newSalary as any)[field] ?? ""
                        }
                        onChange={e => {
                          if (field === "date") {
                            const newDate = new Date(e.target.value)
                            newDate.setHours(0, 0, 0, 0) // Normalize to midnight local time
                            console.log("Date changed to:", formatDateForInput(newDate)) // Debug log
                            setNewSalary({ ...newSalary, date: newDate })
                          } else if (field !== "totalSalary") {
                            const val = e.target.value === "" ? null : Number(e.target.value)
                            setNewSalary({ ...newSalary, [field]: val })
                          }
                        }}
                        min={field === "date" ? formatDateForInput(startDate) : undefined}
                        max={field === "date" ? formatDateForInput(endDate) : undefined}
                        className={`w-full p-2 border ${errors[field] ? "border-red-400" : "border-gray-300"
                          } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300`}
                      />
                      {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
                    </div>
                  ))}

                  <div className="flex space-x-2 md:col-span-5 mt-3">
                    <button
                      onClick={() => {
                        setAddingMonth(null)
                        setNewSalary(initialNewSalary)
                        setEditingSalaryId(null)
                        setErrors({})
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddOrEditSalary(index)}
                      disabled={loading}
                      className="bg-green-500 text-white px-4 py-2 rounded-full shadow-md hover:scale-105 transform transition disabled:opacity-50"
                    >
                      {editingSalaryId ? "Update Salary" : "Save Salary"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {monthSalaries.length > 0 ? (
              <div>
                <div className="overflow-x-auto rounded-xl shadow-md">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        {["Date", "Basic Salary", "Incentive", "Leave Deduction", "Total", "PaySlip", "Actions"].map(head => (
                          <th key={head} className="px-4 py-2 border-b text-left text-gray-700 font-semibold uppercase text-sm">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paginatedSalaries.map(salary => (
                        <tr key={salary._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-2 border-b">{new Date(salary.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2 border-b">₹{salary.basicSalary.toLocaleString()}</td>
                          <td className="px-4 py-2 border-b">₹{salary.incentive.toLocaleString()}</td>
                          <td className="px-4 py-2 border-b">₹{(salary.leaveDeduction || 0).toLocaleString()}</td>
                          <td className="px-4 py-2 border-b font-semibold text-green-600">₹{salary.totalSalary.toLocaleString()}</td>
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
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 px-4 py-2 bg-gray-100 rounded-b-xl">
                    <div className="text-sm text-gray-600">
                      Showing {startIdx + 1} to {Math.min(startIdx + recordsPerPage, monthSalaries.length)} of {monthSalaries.length} entries
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(index, currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-gray-700">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(index, currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No salary recorded yet</p>
            )}
          </div>
        )
      })}
    </div>
  )
}