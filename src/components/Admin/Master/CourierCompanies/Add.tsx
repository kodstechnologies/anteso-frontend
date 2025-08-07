import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCourier } from '../../../../api/index';
import toast from 'react-hot-toast';

const AddCourierCompany = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        courierCompanyName: '',
        // trackingId: '',
        // trackingUrl: '',
        // status: 'active',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        console.log("🚀 ~ handleChange ~ value:", value)
        console.log("🚀 ~ handleChange ~ name:", name)
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await addCourier(formData);
            console.log("🚀 ~ handleSubmit ~ res:", res)
            toast.success('Courier Company added successfully');
            navigate('/admin/courier-companies');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="panel">
            <h2 className="text-xl font-semibold mb-4">Add Courier Company</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="courierCompanyName" className="block mb-1 font-medium">
                        Company Name
                    </label>
                    <input
                        type="text"
                        id="courierCompanyName"
                        name="courierCompanyName"
                        value={formData.courierCompanyName}
                        onChange={handleChange}
                        className="form-input w-full"
                        required
                    />
                </div>

                {/* <div>
                    <label htmlFor="trackingId" className="block mb-1 font-medium">
                        Tracking ID (optional)
                    </label>
                    <input
                        type="text"
                        id="trackingId"
                        name="trackingId"
                        value={formData.trackingId}
                        onChange={handleChange}
                        className="form-input w-full"
                    />
                </div>

                <div>
                    <label htmlFor="trackingUrl" className="block mb-1 font-medium">
                        Tracking URL (optional)
                    </label>
                    <input
                        type="text"
                        id="trackingUrl"
                        name="trackingUrl"
                        value={formData.trackingUrl}
                        onChange={handleChange}
                        className="form-input w-full"
                    />
                </div>

                <div>
                    <label htmlFor="status" className="block mb-1 font-medium">
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="form-select w-full"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div> */}

                <button type="submit" className="btn btn-primary mt-4">
                    Submit
                </button>
            </form>
        </div>
    );
};

export default AddCourierCompany;
