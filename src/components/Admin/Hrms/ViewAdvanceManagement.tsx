"use client"
import { CheckCircleIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { MdDelete, MdVisibility } from "react-icons/md"
import { useParams } from "react-router-dom"
import { addAdvance, getAlltripsByTechnicianId } from "../../../api" // adjust path
import { log } from "console"

interface ExpenseRow {
  id: string
  name?: string // optional, since your API doesn't return it
  tripname: string
  tripStartDate: string
  tripEndDate: string
  expense: number
  balance: number
}

export default function AdvanceManagement() {
  const [lastAddedAmount, setLastAddedAmount] = useState<number | null>(null)
  const [addAmountValue, setAddAmountValue] = useState<number | "">("")
  const [isEditable, setIsEditable] = useState(true)
  const { id } = useParams<{ id: string }>()
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])

  // Fetch trips with expenses from backend
  useEffect(() => {
    if (!id) return
    const fetchTrips = async () => {
      try {
        const res = await getAlltripsByTechnicianId(id)
        const tripsData = res.data?.data || []
        // Flatten into table rows
        const mapped: ExpenseRow[] = tripsData.map((trip: any) => {
          const firstExpense = trip.expenses?.[0] || { totalExpense: 0, balance: 0 }
          return {
            id: trip._id,
            tripname: trip.tripName,
            tripStartDate: new Date(trip.startDate).toLocaleDateString(),
            tripEndDate: new Date(trip.endDate).toLocaleDateString(),
            expense: firstExpense.totalExpense || 0,
            balance: firstExpense.balance || 0
          }
        })
        setExpenses(mapped)
      } catch (err) {
        console.error("Error fetching trips:", err)
      }
    }
    fetchTrips()
  }, [id])

  const handleAddAmount = async () => {
    if (typeof addAmountValue !== "number" || addAmountValue <= 0) {
      alert("Please enter a valid amount.")
      return
    }
    try {
      const payload = { advancedAmount: addAmountValue } // must match backend field exactly
      const res = await addAdvance(id!, payload)
      console.log("Advance added:", res.data)
      setLastAddedAmount(addAmountValue)
      setIsEditable(false)

      // Refetch trips to update UI
      if (id) {
        const refresh = await getAlltripsByTechnicianId(id)
        // ... map and set expenses
      }
    } catch (error) {
      console.error("Error adding advance:", error)
      alert("Failed to add advance amount")
    }
  }

  const handleEditAmount = () => setIsEditable(true)

  const handleUpdateAmount = () => {
    if (typeof addAmountValue === "number" && addAmountValue > 0) {
      setLastAddedAmount(addAmountValue)
      setIsEditable(false)
    } else {
      alert("Please enter a valid amount.")
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      setExpenses(expenses.filter(exp => exp.id !== id))
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
            value={addAmountValue}
            onChange={(e) => setAddAmountValue(e.target.value ? Number(e.target.value) : "")}
            placeholder="Enter amount"
            className="border rounded-lg px-4 py-2 w-1/3 focus:outline-none focus:ring focus:ring-blue-300"
            readOnly={!isEditable}
          />
          {isEditable ? (
            lastAddedAmount === null ? (
              <button
                onClick={handleAddAmount}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg"
              >
                Add
              </button>
            ) : (
              <button
                onClick={handleUpdateAmount}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg"
              >
                Update Amount
              </button>
            )
          ) : (
            <button
              onClick={handleEditAmount}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg"
            >
              Edit Amount
            </button>
          )}
        </div>
        {lastAddedAmount !== null && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 shadow-md flex items-center gap-3 border border-green-200">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-green-800 font-semibold text-lg">
                ₹{lastAddedAmount}
              </p>
              <p className="text-green-600 text-sm">Last Added Amount</p>
            </div>
          </div>
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
              <th className="p-3 border">Expense</th>
              <th className="p-3 border">Balance</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50">
                <td className="p-3 border">{exp.tripname}</td>
                <td className="p-3 border">{exp.tripStartDate}</td>
                <td className="p-3 border">{exp.tripEndDate}</td>
                <td className="p-3 border">₹{exp.expense}</td>
                <td className="p-3 border">₹{exp.balance}</td>
                <td className="p-3 border flex gap-3">
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg"
                  >
                    <MdVisibility size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                  >
                    <MdDelete size={18} />
                  </button>
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
