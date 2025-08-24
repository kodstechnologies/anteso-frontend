"use client"
import { useState, useEffect } from "react"
import { MdDelete, MdVisibility } from "react-icons/md"
import { useParams } from "react-router-dom"
import { addAdvance, getAlltripsByTechnicianId } from "../../../api"
import WarningAlert from "./WarningAlert"

interface ExpenseRow {
  id: string
  tripname: string
  tripStartDate: string
  tripEndDate: string
  totalExpense: number
  tripstatus: string
}

export default function AdvanceManagement() {
  const [addAmountValue, setAddAmountValue] = useState<number | "">("")
  const { id } = useParams<{ id: string }>()
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertType, setAlertType] = useState<"success" | "warning" | null>(null)
  const [advances, setAdvances] = useState<number[]>([])
  const [balance, setBalance] = useState<number>(0)

  // Fetch trips + advanceAccount
  useEffect(() => {
    if (!id) return
    const fetchTrips = async () => {
      try {
        const res = await getAlltripsByTechnicianId(id)

        const tripsData = res.data?.data?.trips || []
        console.log("🚀 ~ fetchTrips ~ tripsData:", tripsData)
        const advanceAcc = res.data?.data?.advanceAccount || {}

        // ✅ store global balance
        setBalance(advanceAcc.balance || 0)
        // ✅ store advance logs in state
        setAdvances(advanceAcc.logs?.map((log: any) => log.amount) || [])
        // Flatten trips
        const mapped: ExpenseRow[] = tripsData.map((trip: any) => ({
          id: trip._id,
          tripname: trip.tripName,
          tripStartDate: new Date(trip.startDate).toLocaleDateString(),
          tripEndDate: new Date(trip.endDate).toLocaleDateString(),
          totalExpense: trip.tripTotalExpense || 0,
          tripstatus: trip.tripstatus
        }))
        console.log("🚀 ~ fetchTrips ~ mapped:", mapped)
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
      const res = await addAdvance(id!, payload)
      console.log("Advance added:", res.data)

      // ✅ push into advances log (frontend state)
      setAdvances((prev) => [...prev, addAmountValue])

      // ✅ update balance
      setBalance((prev) => prev + addAmountValue)

      setAddAmountValue("")
      setAlertMessage(null)
    } catch (error) {
      console.error("Error adding advance:", error)
      setAlertMessage("Failed to add advance amount")
      setAlertType("warning")
    }
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Add Amount Section */}
      <div className="bg-white shadow-md p-5 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Add Advanced Amount</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            value={addAmountValue}
            onChange={(e) =>
              setAddAmountValue(e.target.value ? Number(e.target.value) : "")
            }
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e") {
                e.preventDefault()
              }
            }}
            placeholder="Enter amount"
            className="border rounded-lg px-4 py-2 w-1/3 focus:outline-none focus:ring focus:ring-blue-300"
          />

          <button
            onClick={handleAddAmount}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg"
          >
            Add
          </button>
        </div>
        {alertType === "warning" && alertMessage && (
          <WarningAlert message={alertMessage} />
        )}
      </div>

      {/* Trip Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-3 border">Trip Name</th>
              <th className="p-3 border">Start Date</th>
              <th className="p-3 border">End Date</th>
              <th className="p-3 border">Total Expense</th>
              <th className="p-3 border">Balance</th>
              <th className="p-3 border">Trip status</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50">
                <td className="p-3 border">{exp.tripname}</td>
                <td className="p-3 border">
                  {exp.tripStartDate ? new Date(exp.tripStartDate).toLocaleDateString("en-GB") : "-"}
                </td>
                <td className="p-3 border">
                  {exp.tripEndDate ? new Date(exp.tripEndDate).toLocaleDateString("en-GB") : "-"}
                </td>

                <td className="p-3 border text-black font-medium">
                  ₹{exp.totalExpense}
                </td>
                <td className="p-3 border">
                  <p className="text-black font-medium">₹{balance}</p>
                  {advances.length > 0 && (
                    <p className="text-green-600 text-sm">
                      {advances.join(" + ")}
                    </p>
                  )}
                </td>
                <td
                  className={`p-3 border font-medium ${exp.tripstatus === "ongoing" ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {exp.tripstatus}
                </td>

              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-500">
                  No trips found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
