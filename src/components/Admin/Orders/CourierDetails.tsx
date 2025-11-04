import React, { useState, useEffect } from "react";
import { addCourierByOrderId, getAllCourierDetails } from "../../../api";

interface Courier {
  _id?: string;
  courierCompanyName: string;
  trackingId: string;
  trackingUrl: string;
}

const CourierDetails = ({ orderId }: { orderId: string }) => {
  const [isAddingCourier, setIsAddingCourier] = useState(false);
  const [courierForm, setCourierForm] = useState<Courier>({
    courierCompanyName: "",
    trackingId: "",
    trackingUrl: "",
  });
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch couriers on mount
  const fetchCouriers = async () => {
    try {
      setLoading(true);
      const res = await getAllCourierDetails(orderId);
      // Assuming API returns { success: true, total, couriers }
      setCouriers(res.data.couriers || []);
    } catch (err) {
      console.error("Failed to fetch couriers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchCouriers();
  }, [orderId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCourierForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const data = await addCourierByOrderId(orderId, courierForm);
      // Add the newly created courier to state
      setCouriers((prev) => [...prev, data.data]);
      setIsAddingCourier(false);
      setCourierForm({ courierCompanyName: "", trackingId: "", trackingUrl: "" });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading couriers...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h5 className="text-lg font-bold text-gray-800">Courier Details</h5>
        <button
          onClick={() => setIsAddingCourier(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          + Add Courier
        </button>
      </div>

      {isAddingCourier && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Add New Courier</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                name="courierCompanyName"
                value={courierForm.courierCompanyName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. DTDC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking ID</label>
              <input
                type="text"
                name="trackingId"
                value={courierForm.trackingId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. rr3rd3ed2thyt"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking URL</label>
              <input
                type="text"
                name="trackingUrl"
                value={courierForm.trackingUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. https://courier.com/track"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsAddingCourier(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Display Couriers */}
      {couriers.length === 0 ? (
        <div className="text-gray-500">No couriers added yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm text-gray-700">
          {couriers.map((c) => (
            <div key={c._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Company Name</div>
              <div className="text-gray-800 font-medium">{c.courierCompanyName}</div>

              <div className="text-xs uppercase text-gray-500 font-semibold mt-2 mb-1">Tracking ID</div>
              <div className="text-gray-800 font-medium">{c.trackingId}</div>

              <div className="text-xs uppercase text-gray-500 font-semibold mt-2 mb-1">Tracking URL</div>
              <div className="text-blue-600 font-medium">
                {/* <a href={c.trackingUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  View
                </a> */}
                <div className="text-gray-800 font-medium">{c.trackingUrl}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourierDetails;
