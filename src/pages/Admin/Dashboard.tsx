// Dashboard.tsx
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip as PieTooltip,
    Legend as PieLegend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as BarTooltip,
    LineChart,
    Line,
    CartesianGrid,
} from 'recharts';

interface PieStats { name: string; value: number; }
interface BarStats { category: string; count: number; }
interface LineStats { month: string; trips: number; orders: number; }
interface EmployeeTrip { employee: string; tripName: string; startDate: string; endDate: string; }

// Summary Cards Data
const cardData = [
    { label: 'Employees', value: 50, color: 'blue' },
    { label: 'Tools Available', value: 30, color: 'green' },
    { label: 'Enquiries Created', value: 20, color: 'yellow' },
    { label: 'Orders Generated', value: 40, color: 'orange' },
];
interface PieStats {
    name: string;
    value: number;
    [key: string]: any; // ← This allows extra string keys, satisfies ChartDataInput
}

// Pie Chart Data
const pieData: PieStats[] = [
    { name: 'Employees', value: 50 },
    { name: 'Tools Available', value: 30 },
    { name: 'Enquiries Created', value: 20 },
    { name: 'Orders Generated', value: 40 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Bar Chart Data
const barData: BarStats[] = [
    { category: 'Employees', count: 50 },
    { category: 'Completed Trips', count: 30 },
    { category: 'Ongoing Trips', count: 15 },
];

// Line Chart Data
const lineData: LineStats[] = [
    { month: 'Jan', trips: 10, orders: 15 },
    { month: 'Feb', trips: 20, orders: 25 },
    { month: 'Mar', trips: 30, orders: 35 },
    { month: 'Apr', trips: 25, orders: 30 },
];

// Employee Trip Data
const employeeTrips: EmployeeTrip[] = [
    { employee: 'Alice', tripName: 'Trip A', startDate: '2025-10-01', endDate: '2025-10-05' },
    { employee: 'Bob', tripName: 'Trip B', startDate: '2025-10-03', endDate: '2025-10-08' },
    { employee: 'Charlie', tripName: 'Trip C', startDate: '2025-10-04', endDate: '2025-10-06' },
    { employee: 'David', tripName: 'Trip D', startDate: '2025-10-07', endDate: '2025-10-10' },
];

const Dashboard: React.FC = () => {
    const dispatch = useDispatch();
    useEffect(() => { dispatch(setPageTitle('Dashboard')); }, [dispatch]);

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                {cardData.map((card) => (
                    <div key={card.label} className={`bg-white shadow-md rounded-lg p-4 text-center text-${card.color}-600`}>
                        <h3 className="text-lg font-semibold">{card.label}</h3>
                        <p className="text-2xl font-bold">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Pie Chart */}
                <div className="bg-white shadow-md rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">Overall Stats (Pie Chart)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <PieTooltip />
                            <PieLegend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="bg-white shadow-md rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">Trips Overview (Bar Chart)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData}>
                            <XAxis dataKey="category" />
                            <YAxis />
                            <BarTooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Line Chart */}
            <div className="bg-white shadow-md rounded-lg p-4 mb-6">
                <h2 className="text-xl font-semibold mb-4">Monthly Trips & Orders (Line Chart)</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <BarTooltip />
                        <Line type="monotone" dataKey="trips" stroke="#8884d8" />
                        <Line type="monotone" dataKey="orders" stroke="#82ca9d" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Employee Trip Table */}
            <div className="bg-white shadow-md rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Employee Trips</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employeeTrips.map((trip, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap">{trip.employee}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{trip.tripName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{trip.startDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{trip.endDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
