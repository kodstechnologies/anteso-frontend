import React from 'react'
import { Link } from 'react-router-dom'
import IconFile from '../../../Icon/IconFile'

const View = () => {
  return (
    <div>
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark pb-4">
        <li>
          <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Dashboard
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="/admin/expenses" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Expenses
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            View
          </Link>
        </li>
      </ol>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Expenses Details</h1>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold text-gray-700">Title</span>
              <p className="text-gray-600 mt-1">	Team Lunch</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Category</span>
              <p className="text-gray-600 mt-1">Operations</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Amount</span>
              <p className="text-gray-600 mt-1">1400</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Receipt</span>
              <p className="text-gray-600 mt-1"><IconFile/></p>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}

export default View
