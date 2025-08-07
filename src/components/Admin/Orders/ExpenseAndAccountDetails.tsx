import React, { useState } from 'react'
import IconEye from '../../Icon/IconEye'
import FadeInModal from '../../common/FadeInModal'
import PyamentPNG from '../../../../public/assets/images/payment.png'


const ExpenseAndAccountDetails = () => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <div>
      <h5 className="text-lg font-bold text-gray-800 mb-6">Expense and Accounts Details</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Single Payment Card - Repeat this block for dynamic data */}

        <div className="bg-white rounded-lg shadow-md p-4 space-y-4 border">
          <div>
            <span className="font-semibold text-gray-700">SRF No.:</span>
            <p className="text-gray-600 mt-1">ABSRF/2025/05/001 - Apollo Hospital</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Total Amount:</span>
            <p className="text-gray-600 mt-1">₹50,000</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Payment Amount:</span>
            <p className="text-gray-600 mt-1">₹20,000</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Payment Type:</span>
            <p className="text-gray-600 mt-1">Advanced</p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Payment Screenshot:</span>
              <button onClick={() => setOpenModal(true)} className="hover:text-primary">
                <IconEye className="w-4.5 h-4.5" />
              </button>
            </div>
            <p className="text-gray-600 mt-1 mb-2">Attached</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 space-y-4 border">
          <div>
            <span className="font-semibold text-gray-700">SRF No.:</span>
            <p className="text-gray-600 mt-1">ABSRF/2025/04/001 - Fortis Healthcare</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Total Amount:</span>
            <p className="text-gray-600 mt-1">₹50,000</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Payment Amount:</span>
            <p className="text-gray-600 mt-1">₹20,000</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Payment Type:</span>
            <p className="text-gray-600 mt-1">Advanced</p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Payment Screenshot:</span>
              <button onClick={() => setOpenModal(true)} className="hover:text-primary">
                <IconEye className="w-4.5 h-4.5" />
              </button>
            </div>
            <p className="text-gray-600 mt-1 mb-2">Attached</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 space-y-4 border">
          <div>
            <span className="font-semibold text-gray-700">SRF No.:</span>
            <p className="text-gray-600 mt-1">ABSRF/2025/03/002 - MaxHealth Hospital</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Total Amount:</span>
            <p className="text-gray-600 mt-1">₹50,000</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Payment Amount:</span>
            <p className="text-gray-600 mt-1">₹20,000</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Payment Type:</span>
            <p className="text-gray-600 mt-1">Advanced</p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Payment Screenshot:</span>
              <button onClick={() => setOpenModal(true)} className="hover:text-primary">
                <IconEye className="w-4.5 h-4.5" />
              </button>
            </div>
            <p className="text-gray-600 mt-1 mb-2">Attached</p>
          </div>
        </div>

      </div>
      <FadeInModal open={openModal} onClose={() => setOpenModal(false)} title="Payment Screenshot">
        <img
          src={PyamentPNG}
          alt="Payment Screenshot"
          className="w-full rounded-lg shadow-md object-contain h-80"
        />
      </FadeInModal>
    </div>
  )
}

export default ExpenseAndAccountDetails