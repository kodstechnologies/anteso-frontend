"use client"
import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md"
import { addAdvance, getAlltripsByTechnicianId } from "../../../api"
import WarningAlert from "./WarningAlert"
import FadeInModal from "../../common/FadeInModal"

interface ExpenseItem {
  _id: string
  typeOfExpense: string
  requiredAmount: number
  date: string
  screenshotUrl: string
}

interface ExpenseRow {
  id: string
  tripname: string
  startDate: string
  endDate: string
  totalExpense: number
  tripstatus: string
  expenses: ExpenseItem[]
}

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)

const statusBadgeClass = (status?: string) => {
  if (status === "ongoing")
    return "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
  if (status === "completed")
    return "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
  if (status === "cancelled")
    return "inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200"
  return "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
}

export default function AdvanceManagement() {
  const [addAmountValue, setAddAmountValue] = useState<number | "">("")
  const { id } = useParams<{ id: string }>()
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertType, setAlertType] = useState<"success" | "warning" | null>(null)
  const [advances, setAdvances] = useState<number[]>([])
  const [balance, setBalance] = useState<number>(0)
  const [openTripIds, setOpenTripIds] = useState<Set<string>>(new Set())

  // Screenshot modal state
  const [openScreenshot, setOpenScreenshot] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    if (!id) return
    const fetchTrips = async () => {
      try {
        const res = await getAlltripsByTechnicianId(id)
        const tripsData = res.data?.data?.trips || []
        const advanceAcc = res.data?.data?.advanceAccount || {}

        setBalance(advanceAcc.balance || 0)
        setAdvances(advanceAcc.logs?.map((log: any) => log.amount) || [])

        const mapped: ExpenseRow[] = tripsData.map((trip: any) => ({
          id: trip._id,
          tripname: trip.tripName,
          startDate: trip.startDate,
          endDate: trip.endDate,
          totalExpense: trip.tripTotalExpense || 0,
          tripstatus: trip.tripstatus,
          expenses: trip.expenses || [],
        }))
        setExpenses(mapped)
      } catch (err) {
        console.error("Error fetching trips:", err)
      }
    }
    fetchTrips()
  }, [id])

  const handleAddAmount = async () => {
    if (typeof addAmountValue !== "number" || addAmountValue <= 0) {
      setAlertMessage("Please enter a valid amount.")
      setAlertType("warning")
      return
    }
    try {
      const payload = { advancedAmount: addAmountValue }
      await addAdvance(id!, payload)

      setAdvances((prev) => [...prev, addAmountValue])
      setBalance((prev) => prev + addAmountValue)
      setAddAmountValue("")
      setAlertMessage(null)
    } catch (error) {
      console.error("Error adding advance:", error)
      setAlertMessage("Failed to add advance amount")
      setAlertType("warning")
    }
  }

  const toggleTripAccordion = (tripId: string) => {
    setOpenTripIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tripId)) newSet.delete(tripId)
      else newSet.add(tripId)
      return newSet
    })
  }

  // Pagination logic
  const totalPages = Math.ceil(expenses.length / itemsPerPage)
  const paginatedExpenses = expenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 p-6">
      {/* Add Amount Section */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-lg font-semibold">Add Advance Amount</h3>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="number"
              min="0"
              value={addAmountValue as number | string}
              onChange={(e) => setAddAmountValue(e.target.value ? Number(e.target.value) : "")}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") e.preventDefault()
              }}
              placeholder="Enter amount"
              className="sm:w-1/3 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={handleAddAmount}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Add
            </button>
          </div>
          {alertType === "warning" && alertMessage && (
            <div className="mt-4">
              <WarningAlert message={alertMessage} />
            </div>
          )}
        </div>
      </div>

      {/* Trip Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100/80 text-left">
              <th className="p-3 border-b border-gray-200">Trip Name</th>
              <th className="p-3 border-b border-gray-200">Start Date</th>
              <th className="p-3 border-b border-gray-200">End Date</th>
              <th className="p-3 border-b border-gray-200">Total Expense</th>
              <th className="p-3 border-b border-gray-200">Balance</th>
              <th className="p-3 border-b border-gray-200">Trip Status</th>
              <th className="p-3 border-b border-gray-200 text-center">Expenses</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExpenses.map((exp) => (
              <React.Fragment key={exp.id}>
                <tr
                  className={`hover:bg-gray-50 transition ${exp.expenses.length > 0 ? "cursor-pointer" : ""}`}
                  onClick={() => exp.expenses.length > 0 && toggleTripAccordion(exp.id)}
                >
                  <td className="p-3 border-b border-gray-200 font-medium">{exp.tripname}</td>
                  <td className="p-3 border-b border-gray-200">
                    {exp.startDate ? new Date(exp.startDate).toLocaleDateString("en-GB") : "-"}
                  </td>
                  <td className="p-3 border-b border-gray-200">
                    {exp.endDate ? new Date(exp.endDate).toLocaleDateString("en-GB") : "-"}
                  </td>
                  <td className="p-3 border-b border-gray-200 font-medium">{formatINR(exp.totalExpense)}</td>
                  <td className="p-3 border-b border-gray-200">
                    <p className="font-medium">{formatINR(balance)}</p>
                    {advances.length > 0 && <p className="text-slate-500 text-sm">{advances.join(" + ")}</p>}
                  </td>
                  <td className="p-3 border-b border-gray-200">
                    {exp.tripstatus ? (
                      <span className={statusBadgeClass(exp.tripstatus)}>{exp.tripstatus}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="p-3 border-b border-gray-200 text-center">
                    {exp.expenses.length > 0 ? (
                      <span className="flex justify-center items-center text-slate-500">
                        {openTripIds.has(exp.id) ? <MdKeyboardArrowUp size={24} /> : <MdKeyboardArrowDown size={24} />}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">NA</span>
                    )}
                  </td>
                </tr>

                {/* Accordion for Expenses */}
                {openTripIds.has(exp.id) && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div className="border-t border-gray-200 bg-gray-50 p-4 rounded-b-lg">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100/80 text-left text-sm font-medium">
                              <th className="p-2 border-b border-gray-200">Expense Type</th>
                              <th className="p-2 border-b border-gray-200">Required Amount</th>
                              <th className="p-2 border-b border-gray-200">Date</th>
                              <th className="p-2 border-b border-gray-200 text-center">Screenshot</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exp.expenses.length > 0 ? (
                              exp.expenses.map((ex) => (
                                <tr key={ex._id} className="hover:bg-gray-50 text-sm transition">
                                  <td className="p-2 border-b border-gray-200">{ex.typeOfExpense}</td>
                                  <td className="p-2 border-b border-gray-200">{formatINR(ex.requiredAmount)}</td>
                                  <td className="p-2 border-b border-gray-200">
                                    {new Date(ex.date).toLocaleDateString("en-GB")}
                                  </td>
                                  <td className="p-2 border-b border-gray-200 text-center">
                                    {ex.screenshotUrl ? (
                                      <>
                                        <button
                                          onClick={() => setOpenScreenshot(ex._id)}
                                          className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-200"
                                        >
                                          View
                                        </button>
                                        <FadeInModal
                                          open={openScreenshot === ex._id}
                                          onClose={() => setOpenScreenshot(null)}
                                          title="Screenshot"
                                        >
                                          <img
                                            src={ex.screenshotUrl || "/placeholder.svg"}
                                            alt="Expense screenshot"
                                            className="w-full max-h-[400px] object-contain rounded-md"
                                          />
                                        </FadeInModal>
                                      </>
                                    ) : (
                                      <span className="text-slate-500 font-medium">NA</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="p-2 text-center text-slate-500 font-medium">
                                  No expenses available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {paginatedExpenses.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-6 text-gray-500">
                  No trips found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-200 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${currentPage === num
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-slate-100 text-slate-800 ring-slate-200 hover:bg-slate-200"
                }`}
            >
              {num}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
