"use client"
import { useState } from "react"
import { MdDelete } from "react-icons/md"
import type { Expense } from "../../../types/hrms-types"

export default function AdvanceManagement() {
  const [isAddingExpense, setIsAddingExpense] = useState(false)

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      name: 'Rabi Prasad',
      email: 'client1@gmail.com',
      address: 'HSR Layout, Bangalore, Karnataka',
      phone: '9876576876',
      business: 'Tech Solutions Pvt. Ltd.',
      tripname: 'Delhi Installation',
      tripStartDate: '10/10/2024',
      tripEndDate: '20/10/2024',
      gstNo: 'AX123',
      designation: 'Manager',
      title: 'Office Supplies',
      amount: 45000,
    },
    {
      id: "2",
      name: 'Sita Rani',
      email: 'client2@example.com',
      address: 'Andheri West, Mumbai, Maharashtra',
      phone: '9865432109',
      business: 'Creative Minds Co.',
      tripname: 'Delhi Installation',
      tripStartDate: '10/10/2024',
      tripEndDate: '20/10/2024',
      gstNo: 'BY456',
      designation: 'Creative Director',
      title: 'Office Supplies',
      amount: 82000,
    },
    {
      id: "3",
      name: 'John Dsouza',
      email: 'client3@example.com',
      address: 'Banjara Hills, Hyderabad, Telangana',
      phone: '9123456780',
      business: 'Dsouza Enterprises',
      tripname: 'Delhi Installation',
      tripStartDate: '10/10/2024',
      tripEndDate: '20/10/2024',
      gstNo: 'CZ789',
      designation: 'CEO',
      title: 'Team Lunch',
      amount: 120000,
    }
  ])

  const [newExpense, setNewExpense] = useState<Omit<Expense, "id">>({
    name: "",
    email: "",
    address: "",
    phone: "",
    business: "",
    tripname: "",
    tripStartDate: "",
    tripEndDate: "",
    gstNo: "",
    designation: "",
    title: "",
    amount: 0,
  })

  // Handle adding new expense
  const handleAddExpense = () => {
    if (newExpense.title && newExpense.amount > 0 && newExpense.tripname && newExpense.tripStartDate && newExpense.tripEndDate) {
      const expense: Expense = {
        ...newExpense,
        id: Date.now().toString(),
      }
      setExpenses([...expenses, expense])
      setNewExpense({
        name: "",
        email: "",
        address: "",
        phone: "",
        business: "",
        tripname: "",
        tripStartDate: "",
        tripEndDate: "",
        gstNo: "",
        designation: "",
        title: "",
        amount: 0,
      })
      setIsAddingExpense(false)
    }
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Trip Management</h2>
        <button
          onClick={() => setIsAddingExpense(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add Trip Details
        </button>
      </div>

      {/* Add Expense Form */}
      {isAddingExpense && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Add New Trip</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Trip Name</label>
              <input
                type="text"
                value={newExpense.tripname}
                onChange={(e) => setNewExpense({ ...newExpense, tripname: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g. Delhi Installation"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Trip Start Date</label>
              <input
                type="date"
                value={newExpense.tripStartDate}
                onChange={(e) => setNewExpense({ ...newExpense, tripStartDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Trip End Date</label>
              <input
                type="date"
                value={newExpense.tripEndDate}
                onChange={(e) => setNewExpense({ ...newExpense, tripEndDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            {/* <div>
              <label className="block text-gray-700 mb-1">Advance Title</label>
              <input
                type="text"
                value={newExpense.title}
                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g. Office Supplies"
              />
            </div> */}
            <div>
              <label className="block text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={newExpense.amount || ""}
                onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setIsAddingExpense(false)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddExpense}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save Trip Details
            </button>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Trip Name</th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Start Date</th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">End Date</th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Amount</th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold border border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border border-gray-300 text-gray-700">{expense.tripname}</td>
                  <td className="px-4 py-3 border border-gray-300 text-gray-700">{expense.tripStartDate}</td>
                  <td className="px-4 py-3 border border-gray-300 text-gray-700">{expense.tripEndDate}</td>
                  <td className="px-4 py-3 border border-gray-300 text-gray-700">₹{expense.amount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 border border-gray-300">
                    <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600 hover:text-red-800">
                      <MdDelete className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No expenses recorded yet
                </td>
              </tr>
            )}
          </tbody>
          {expenses.length > 0 && (
            <tfoot>
              <tr className="bg-blue-50 font-bold">
                <td colSpan={3} className="px-4 py-3 border border-gray-300 text-right text-gray-800">
                  Total :
                </td>
                <td className="px-4 py-3 border border-gray-300 text-blue-600">
                  ₹
                  {expenses
                    .reduce((sum, exp) => sum + exp.amount, 0)
                    .toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 border border-gray-300"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
