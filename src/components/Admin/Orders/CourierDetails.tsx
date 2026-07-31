import React, { useState, useEffect } from "react";
import { addCourierByOrderId, getAllCourierDetails, getAllCourier } from "../../../api";

interface Courier {
  _id?: string;
  courierCompanyName: string;
  trackingId: string;
  trackingUrl: string;
  orderId?: string;
  status?: string;
}

const CourierDetails = ({ orderId }: { orderId: string }) => {
  const [isAddingCourier, setIsAddingCourier] = useState(false);
  const [courierForm, setCourierForm] = useState<Courier>({
    courierCompanyName: "",
    trackingId: "",
    trackingUrl: "",
  });
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [companyOptions, setCompanyOptions] = useState<Courier[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      const res = await getAllCourierDetails(orderId);
      setCouriers(res.data.couriers || []);
    } catch (err) {
      console.error("Failed to fetch couriers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyOptions = async () => {
    try {
      setLoadingCompanies(true);
      const response = await getAllCourier();
      const all = response?.data || [];
      // Master companies are entries without an orderId
      const masters = all.filter(
        (c: Courier) => !c.orderId && (c.status || "active").toLowerCase() === "active"
      );
      setCompanyOptions(masters);
    } catch (err) {
      console.error("Failed to fetch courier companies:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchCouriers();
  }, [orderId]);

  const handleAddClick = () => {
    setIsAddingCourier(true);
    setSelectedCompanyId("");
    setCourierForm({ courierCompanyName: "", trackingId: "", trackingUrl: "" });
    fetchCompanyOptions();
  };

  const handleCompanySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCompanyId(id);

    if (!id) {
      setCourierForm({ courierCompanyName: "", trackingId: "", trackingUrl: "" });
      return;
    }

    const company = companyOptions.find((c) => c._id === id);
    if (company) {
      setCourierForm({
        courierCompanyName: company.courierCompanyName || "",
        trackingId: company.trackingId || "",
        trackingUrl: company.trackingUrl || "",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCourierForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!courierForm.courierCompanyName) {
        return;
      }
      const data = await addCourierByOrderId(orderId, courierForm);
      setCouriers((prev) => [...prev, data.data]);
      setIsAddingCourier(false);
      setSelectedCompanyId("");
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
          onClick={handleAddClick}
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
              <select
                value={selectedCompanyId}
                onChange={handleCompanySelect}
                disabled={loadingCompanies}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">
                  {loadingCompanies ? "Loading companies..." : "Select courier company"}
                </option>
                {companyOptions.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.courierCompanyName}
                  </option>
                ))}
              </select>
              {!loadingCompanies && companyOptions.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  No courier companies found. Add them under Master → Courier Companies.
                </p>
              )}
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
              onClick={() => {
                setIsAddingCourier(false);
                setSelectedCompanyId("");
                setCourierForm({ courierCompanyName: "", trackingId: "", trackingUrl: "" });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!courierForm.courierCompanyName}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        </div>
      )}

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
