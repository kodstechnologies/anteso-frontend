// Hrms.tsx
import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect, useMemo } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconEdit from '../../components/Icon/IconEdit';
import IconEye from '../../components/Icon/IconEye';
import Breadcrumb, { BreadcrumbItem } from '../../components/common/Breadcrumb';
import IconHome from '../../components/Icon/IconHome';
import IconBox from '../../components/Icon/IconBox';
import { getAllEmployees, getAllAllocatedLeaves, allocateLeavesForAll } from '../../api/index';
import DatePicker from 'react-flatpickr';
import 'react-datepicker/dist/react-datepicker.css';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/material_blue.css'; // Or any flatpickr theme you like
import 'flatpickr/dist/flatpickr.css';

const Hrms = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Employee Management'));
    }, []);

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear );

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [totalLeavesInput, setTotalLeavesInput] = useState('');

    // Pagination & sorting
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<any>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'name',
        direction: 'asc',
    });

    // ✅ Fetch employees from backend
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const res = await getAllEmployees();
                if (res?.data) {
                    setItems(res.data);
                }
            } catch (error) {
                console.error("Error fetching employees:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    // ✅ Fetch allocations for selected year
    const fetchAllocations = async () => {
        try {
            const res = await getAllAllocatedLeaves(selectedYear);
            console.log("🚀 ~ fetchAllocations ~ res:", res);
            setAllocations(Array.isArray(res?.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching allocations:", error);
            setAllocations([]);
        }
    };

    useEffect(() => {
        fetchAllocations();
    }, [selectedYear]);

    const totalAllocated = useMemo(() =>
        allocations.reduce((sum, a) => sum + (a.totalLeaves || 0), 0),
        [allocations]
    );

    // Search & Merge logic
    useEffect(() => {
        const filtered = items.filter((item) => {
            return (
                item.empId?.toLowerCase().includes(search.toLowerCase()) ||
                item.name?.toLowerCase().includes(search.toLowerCase()) ||
                item.email?.toLowerCase().includes(search.toLowerCase()) ||
                item.phone?.toString().includes(search.toLowerCase()) ||
                item.designation?.toLowerCase().includes(search.toLowerCase()) ||
                item.department?.toLowerCase().includes(search.toLowerCase())
            );
        });

        const allocMap = new Map(allocations.map((a: any) => [a.employeeId, a]));
        const merged = filtered.map((emp: any) => ({
            ...emp,
            totalLeaves: allocMap.get(emp._id)?.totalLeaves || 0,
            usedLeaves: allocMap.get(emp._id)?.usedLeaves || 0,
            remainingLeaves: allocMap.get(emp._id)?.remainingLeaves || 0,
        }));

        setInitialRecords(merged);
    }, [search, items, allocations]);

    // Pagination logic
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    // Sorting
    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const handleAllocate = async () => {
        if (!totalLeavesInput) return;
        try {
            await allocateLeavesForAll({ year: selectedYear, totalLeaves: Number(totalLeavesInput) });
            setTotalLeavesInput('');
            setShowAllocateModal(false);
            await fetchAllocations();
        } catch (error) {
            console.error("Error allocating leaves:", error);
        }
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const year = parseInt(e.target.value);
        setSelectedYear(year);
        setPage(1);
    };

    const minYear = currentYear - 2;
    const maxYear = currentYear + 3;

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Employee Management', icon: <IconBox /> },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />
            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Select Year:</label>
                                <Flatpickr
                                    value={new Date(selectedYear, 0, 1)} // First day of the selected year
                                    options={{
                                        dateFormat: 'Y',       // Year only
                                        defaultDate: new Date(selectedYear, 0, 1),
                                        wrap: false,
                                    }}
                                    onChange={([date]: Date[]) => {
                                        if (date) setSelectedYear(date.getFullYear());
                                    }}
                                    className="form-input"
                                />
                            </div>

                            <button
                                onClick={() => setShowAllocateModal(true)}
                                className="btn btn-primary px-4 py-2"
                            >
                                Allocate Leaves
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Total Leaves Allocated: {totalAllocated}
                            </span>
                        </div>
                        <div className="ltr:ml-auto rtl:mr-auto">
                            <input
                                type="text"
                                className="form-input w-auto"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* <div className="px-5 mb-4">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Total Employees: {items.length}</span>
                            <span>Allocated Employees: {allocations.length}</span>
                        </div>
                    </div> */}

                    <div className="datatables pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records}
                            columns={[
                                { accessor: 'empId', title: 'EMP ID', sortable: true },
                                { accessor: 'name', title: 'Name', sortable: true },
                                { accessor: 'email', title: 'Email', sortable: true },
                                { accessor: 'phone', title: 'Phone', sortable: true },
                                { accessor: 'designation', title: 'Designation', sortable: true },
                                { accessor: 'department', title: 'Department', sortable: true },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: ({ _id }) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink
                                                to={`/admin/hrms/leave-management-view/${_id}`}
                                                className="flex hover:text-primary"
                                            >
                                                <IconEye />
                                            </NavLink>
                                            {/* <IconEdit className="w-4.5 h-4.5 cursor-pointer hover:text-info" /> */}
                                            {/* <button
                                                type="button"
                                                className="flex hover:text-danger"
                                                onClick={() => console.log("delete employee", _id)}
                                            >
                                                <IconTrashLines />
                                            </button> */}
                                        </div>
                                    ),
                                },
                            ]}
                            highlightOnHover
                            totalRecords={initialRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            selectedRecords={selectedRecords}
                            onSelectedRecordsChange={setSelectedRecords}
                            fetching={loading}
                            paginationText={({ from, to, totalRecords }) =>
                                `Showing ${from} to ${to} of ${totalRecords} entries`
                            }
                        />
                    </div>
                </div>
            </div>

            {showAllocateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Allocate Leaves for {selectedYear}</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Total Leaves per Employee</label>
                            <input
                                type="number"
                                className="form-input w-full"
                                placeholder="Enter total leaves"
                                value={totalLeavesInput}
                                onChange={(e) => setTotalLeavesInput(e.target.value)}
                                min="0"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowAllocateModal(false)}
                                className="btn btn-secondary px-4 py-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAllocate}
                                className="btn btn-primary px-4 py-2"
                                disabled={!totalLeavesInput}
                            >
                                Allocate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Hrms;