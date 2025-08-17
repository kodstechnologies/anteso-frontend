import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconPlus from '../../../components/Icon/IconPlus';
import IconEdit from '../../../components/Icon/IconEdit';
import IconEye from '../../../components/Icon/IconEye';
import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb';
import IconHome from '../../../components/Icon/IconHome';
import IconBox from '../../../components/Icon/IconBox';
import { getAllTechnicians } from '../../../api/index'; // ✅ import API call

const AdvancedManagement = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Advanced Management'));
    }, []);

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'name',
        direction: 'asc',
    });

    // ✅ Fetch employee data on mount
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getAllTechnicians();
                console.log("🚀 ~ fetchEmployees ~ data:", data)

                // Assuming API returns an array of employees
                const formatted = data.data?.map((item: any, index: number) => ({
                    ...item,
                    clientId: `EMP${String(index + 1).padStart(3, '0')}`, // unique ID for display
                }));
                setItems(formatted);
                setInitialRecords(sortBy(formatted, 'name'));
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Failed to load employees');
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(() => {
            return items.filter((item: any) => {
                return (
                    item.clientId?.toLowerCase().includes(search.toLowerCase()) ||
                    item.name?.toLowerCase().includes(search.toLowerCase()) ||
                    item.email?.toLowerCase().includes(search.toLowerCase()) ||
                    item.amount?.toString().includes(search)
                );
            });
        });
    }, [search, items]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const deleteRow = (id: any = null) => {
        if (window.confirm('Are you sure you want to delete selected row(s)?')) {
            const filterFn = (user: any) => ![id].flat().includes(user.id);
            const result = items.filter(filterFn);
            setItems(result);
            setInitialRecords(result);
            setRecords(result);
            setSelectedRecords([]);
            setSearch('');
            setPage(1);
        }
    };

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Trip Management', icon: <IconBox /> },
    ];

    if (loading) return <div>Loading employees...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />
            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2"></div>
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
                    <div className="datatables pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records}
                            columns={[
                                { accessor: 'clientId', title: 'EMP ID', sortable: true },
                                { accessor: 'name', sortable: true },
                                { accessor: 'email', sortable: true },
                                // { accessor: 'amount', title: 'Amount', sortable: true },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: (record) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink
                                                to={`/admin/hrms/trip-management-view/${record._id}`} // ✅ use actual ID
                                                className="flex hover:text-primary"
                                            >
                                                <IconEye />
                                            </NavLink>
                                            <IconEdit className="w-4.5 h-4.5 hover:text-info" />
                                            <button
                                                type="button"
                                                className="flex hover:text-danger"
                                                onClick={() => deleteRow(record._id)}
                                            >
                                                <IconTrashLines />
                                            </button>
                                        </div>
                                    ),
                                }

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
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdvancedManagement;
