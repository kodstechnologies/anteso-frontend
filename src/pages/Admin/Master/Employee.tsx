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
import { deleteEmployeeById, getAllEmployees } from '../../../api';
import ConfirmModal from '../../../components/common/ConfirmModal';

const Employee = () => {
    const dispatch = useDispatch();

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

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

    // Fetch employees
    useEffect(() => {
        dispatch(setPageTitle('Employee'));

        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const response = await getAllEmployees();

                const transformed = response?.data?.map((employee: any, index: number) => ({
                    ...employee,
                    id: employee._id,
                    employeeId: `EMP${String(index + 1).padStart(3, '0')}`,
                    role: employee.technicianType || '',
                    tools: (employee.tools || []).map((tool: any) => tool.toolId?.nomenclature || 'N/A'),
                    status: {
                        color: employee.status === 'active' ? 'success' : 'danger',
                        tooltip: employee.status ? employee.status.charAt(0).toUpperCase() + employee.status.slice(1) : '',
                    },
                    phone: employee.phone || '',
                    email: employee.email || '',
                    name: employee.name || '',
                }));

                setItems(transformed);
                setInitialRecords(transformed);
                setRecords(transformed.slice(0, pageSize));
            } catch (err) {
                console.error('Failed to load employees', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    // Pagination effect
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    // Search effect
    useEffect(() => {
        const query = search.toLowerCase();
        const filtered = items.filter((item) => {
            return (
                String(item.employeeId).toLowerCase().includes(query) ||
                String(item.name).toLowerCase().includes(query) ||
                String(item.email).toLowerCase().includes(query) ||
                String(item.phone).toLowerCase().includes(query) ||
                String(item.role).toLowerCase().includes(query) ||
                String(item.status?.tooltip).toLowerCase().includes(query) ||
                (item.tools || []).some((tool: string) => String(tool).toLowerCase().includes(query))
            );
        });

        setInitialRecords(filtered);
        setPage(1);
    }, [search, items]);

    // Sorting effect
    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor as string);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const deleteRow = (id: string) => {
        setSelectedEmployeeId(id);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedEmployeeId) return;
        try {
            await deleteEmployeeById(selectedEmployeeId);
            const updated = items.filter((item) => item.id !== selectedEmployeeId);
            setItems(updated);
            setInitialRecords(updated);
            setRecords(updated.slice(0, pageSize));
            setSelectedRecords([]);
            setSearch('');
        } catch (err) {
            console.error('Failed to delete employee', err);
        } finally {
            setDeleteModalOpen(false);
            setSelectedEmployeeId(null);
        }
    };

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Employee', icon: <IconBox /> },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/employee/add" className="btn btn-primary gap-2">
                                <IconPlus />
                                Add New
                            </Link>
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

                    <div className="datatables pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records}
                            columns={[
                                { accessor: 'employeeId', title: 'EMP ID', sortable: true },
                                { accessor: 'name', sortable: true },
                                { accessor: 'email', sortable: true },
                                { accessor: 'phone', sortable: true },
                                { accessor: 'role', sortable: true },
                                {
                                    accessor: 'tools',
                                    sortable: true,
                                    render: ({ tools }) => <span>{tools.join(', ')}</span>,
                                },
                                {
                                    accessor: 'status',
                                    sortable: true,
                                    render: ({ status }) => <span className={`text-${status.color}`}>{status.tooltip}</span>,
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: ({ id }) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink to={`/admin/employee/view/${id}`} className="flex hover:text-primary">
                                                <IconEye />
                                            </NavLink>
                                            <NavLink to={`/admin/employee/edit/${id}`} className="flex hover:text-info">
                                                <IconEdit className="w-4.5 h-4.5" />
                                            </NavLink>
                                            <button type="button" className="flex hover:text-danger" onClick={() => deleteRow(id)}>
                                                <IconTrashLines />
                                            </button>
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
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                        />
                    </div>

                    <ConfirmModal
                        open={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        onConfirm={handleConfirmDelete}
                        title="Confirm Delete"
                        message="Are you sure you want to delete this employee?"
                    />
                </div>
            </div>
        </>
    );
};

export default Employee;