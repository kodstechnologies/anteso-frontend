// Dashboard.tsx
import React, { useEffect, useState } from 'react';
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
    ReferenceLine,
} from 'recharts';
import { monthlyStats, employeeTrips as fetchEmployeeTrips, getSummary } from '../../api'; // your API calls
import {
    Users,
    Wrench,  // Changed from Toolbox (reliable tool icon)
    FileText,
    ShoppingBag,
    TrendingUp,
    BarChart3,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard as DashboardIcon
} from 'lucide-react';
interface PieStats { name: string; value: number; }
interface BarStats { category: string; count: number; }
interface LineStats { month: string; trips: number; orders: number; }
interface EmployeeTrip { employee: string; tripName: string; startDate: string; endDate: string; tripStatus?: string; }
// In the interfaces section, update PieStats to:
interface PieStats extends Record<string, any> {
    name: string;
    value: number;
}
const COLORS = ['#A5B4FC', '#A7F3D0', '#FDE68A', '#FECACA']; // Subtle, softer colors for donut

const Dashboard: React.FC = () => {
    const dispatch = useDispatch();

    const [pieData, setPieData] = useState<PieStats[]>([]);
    const [barData, setBarData] = useState<BarStats[]>([]);
    const [lineData, setLineData] = useState<LineStats[]>([]);
    const [employeeTrips, setEmployeeTrips] = useState<EmployeeTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        dispatch(setPageTitle('Dashboard'));
        fetchDashboardData();
    }, [dispatch]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [summaryRes, monthlyRes, tripsRes] = await Promise.all([
                getSummary(),
                monthlyStats(),
                fetchEmployeeTrips(),
            ]);

            // Summary Cards & Pie Data
            const summaryPieData: PieStats[] = [
                { name: 'Employees', value: summaryRes.data.employees.total },
                { name: 'Tools', value: summaryRes.data.tools.total },
                { name: 'Enquiries', value: summaryRes.data.enquiries.total },
                { name: 'Orders', value: summaryRes.data.orders.total },
            ];
            setPieData(summaryPieData);

            // Bar Chart (example using trips)
            const summaryBarData: BarStats[] = [
                { category: 'Completed Trips', count: summaryRes.data.trips.completed },
                { category: 'Ongoing Trips', count: summaryRes.data.trips.ongoing },
            ];
            setBarData(summaryBarData);

            // Line Chart (monthly trips & orders)
            setLineData(monthlyRes.data); // assumes API returns [{month,trips,orders},...]

            // Employee Trip Table
            setEmployeeTrips(tripsRes.data); // assumes API returns [{employee, tripName, startDate, endDate, tripStatus},...]

        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            setError(error.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const itemsPerPage = 5;
    const totalPages = Math.ceil(employeeTrips.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTrips = employeeTrips.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-green-600 bg-green-50 border border-green-200';
            case 'ongoing': return 'text-blue-600 bg-blue-50 border border-blue-200';
            case 'pending': return 'text-yellow-600 bg-yellow-50 border border-yellow-200';
            default: return 'text-gray-600 bg-gray-50 border border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-gray-700">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Dashboard</h3>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Summary Cards
    const cardData = [
        { label: 'Employees', value: pieData.find(d => d.name === 'Employees')?.value || 0, color: 'blue', icon: Users },
        { label: 'Tools', value: pieData.find(d => d.name === 'Tools')?.value || 0, color: 'green', icon: Wrench },  // Changed to Wrench
        { label: 'Enquiries', value: pieData.find(d => d.name === 'Enquiries')?.value || 0, color: 'yellow', icon: FileText },
        { label: 'Orders', value: pieData.find(d => d.name === 'Orders')?.value || 0, color: 'orange', icon: ShoppingBag },
    ];
    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <div className="w-full">
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                <DashboardIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-blue-900 bg-clip-text text-transparent leading-tight">
                                    Dashboard
                                </h1>
                                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2 animate-pulse"></div>
                            </div>
                        </div>
                        {/* <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back! Here's what's happening with your operations today.</p> */}
                    </div>
                    {/* <button
                        onClick={fetchDashboardData}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base shadow-md hover:shadow-lg"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Refresh
                    </button> */}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {cardData.map((card, index) => {
                        const IconComponent = card.icon;
                        return (
                            <div
                                key={card.label}
                                className="bg-white shadow-md rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className={`p-3 rounded-xl bg-${card.color}-50 group-hover:bg-${card.color}-100 transition-colors duration-300`}>
                                        <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 text-${card.color}-600 group-hover:scale-110 transition-transform duration-300`} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm sm:text-base font-medium text-gray-600 uppercase tracking-wide">{card.label}</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 animate-pulse" style={{ animationDuration: '2s' }}>{card.value}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Charts Container */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Donut Chart */}
                    <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                                Overall Stats
                            </h2>
                        </div>
                        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    className="sm:outerRadius-[110px]"
                                    label={({ name, percent, x, y }) => (
                                        <text
                                            x={x}
                                            y={y}
                                            fill="#374151"
                                            fontSize="12"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            {`${name} ${((percent as number) * 100).toFixed(0)}%`}
                                        </text>
                                    )}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} stroke="#ffffff" />
                                    ))}
                                </Pie>
                                <PieTooltip formatter={(value) => [`${value}`, 'Count']} contentStyle={{ backgroundColor: '#f9fafb', border: 'none', borderRadius: '8px' }} />
                                <PieLegend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '12px', color: '#6B7280' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                                Trips Overview
                            </h2>
                        </div>
                        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <XAxis dataKey="category" fontSize={11} tick={{ fill: '#6B7280' }} />
                                <YAxis fontSize={11} tick={{ fill: '#6B7280' }} />
                                <BarTooltip contentStyle={{ backgroundColor: '#f9fafb', border: 'none', borderRadius: '8px' }} />
                                <Bar
                                    dataKey="count"
                                    fill="url(#gradientBar)"
                                    radius={[6, 6, 0, 0]}
                                />
                                <defs>
                                    <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Line Chart */}
                <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                            Monthly Trips & Orders
                        </h2>
                    </div>
                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                        <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="month" fontSize={11} tick={{ fill: '#6B7280' }} />
                            <YAxis fontSize={11} tick={{ fill: '#6B7280' }} />
                            <BarTooltip
                                contentStyle={{ backgroundColor: '#f9fafb', border: 'none', borderRadius: '8px' }}
                                labelStyle={{ fontWeight: 'bold' }}
                            />
                            <ReferenceLine y={0} stroke="#e5e7eb" />
                            <Line type="monotone" dataKey="trips" stroke="url(#gradientTrips)" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="orders" stroke="url(#gradientOrders)" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            <defs>
                                <linearGradient id="gradientTrips" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={1} />
                                </linearGradient>
                                <linearGradient id="gradientOrders" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Employee Trip Table */}
                <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                            Employee Trips
                            <span className="ml-auto text-xs sm:text-sm text-gray-500">({employeeTrips.length} trips)</span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Name</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentTrips.length > 0 ? (
                                    currentTrips.map((trip, index) => (
                                        <tr key={`${trip.employee}-${index}`} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-200">
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trip.employee}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.tripName}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trip.startDate}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trip.endDate}</td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(trip.tripStatus)}`}>
                                                    {trip.tripStatus || 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-gray-500">
                                            No trips available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(endIndex, employeeTrips.length)}</span> of{' '}
                                <span className="font-medium">{employeeTrips.length}</span> results
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </button>
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === page
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;