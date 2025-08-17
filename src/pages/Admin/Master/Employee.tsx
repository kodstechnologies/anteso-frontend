import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch, useSelector } from 'react-redux';
// import { IRootState } from '../../../store';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconPlus from '../../../components/Icon/IconPlus';
import IconEdit from '../../../components/Icon/IconEdit';
// import IconEye from '../../../components/Icon/IconEye';
import { engineersData } from '../../../data';
import IconCopy from '../../../components/Icon/IconCopy';
import IconEye from '../../../components/Icon/IconEye';
import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb';
import IconHome from '../../../components/Icon/IconHome';
import IconBox from '../../../components/Icon/IconBox';
import { getAllEmployees } from '../../../api';

const Employee = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Employee'));
    }, []);

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const deleteRow = (id: any = null) => {
        if (window.confirm('Are you sure want to delete selected row ?')) {
            if (id) {
                setRecords(items.filter((user) => user.id !== id));
                setInitialRecords(items.filter((user) => user.id !== id));
                setItems(items.filter((user) => user.id !== id));
                setSearch('');
                setSelectedRecords([]);
            } else {
                let selectedRows = selectedRecords || [];
                const ids = selectedRows.map((d: any) => {
                    return d.id;
                });
                const result = items.filter((d) => !ids.includes(d.id as never));
                setRecords(result);
                setInitialRecords(result);
                setItems(result);
                setSearch('');
                setSelectedRecords([]);
                setPage(1);
            }
        }
    };

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState(sortBy(items, 'name'));
    const [records, setRecords] = useState(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState<any>([]);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'firstName',
        direction: 'asc',
    });

    useEffect(() => {
        setPage(1);
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(() => {
            return items.filter((item) => {
                return (
                    item.employeeId.toLowerCase().includes(search.toLowerCase()) ||
                    item.name.toLowerCase().includes(search.toLowerCase()) ||
                    item.email.toLowerCase().includes(search.toLowerCase()) ||
                    item.phone.toLowerCase().includes(search.toLowerCase()) ||
                    item.empId.toLowerCase().includes(search.toLowerCase()) ||
                    item.role.toLowerCase().includes(search.toLowerCase()) ||
                    // item.tools.map((tool) => tool.toLowerCase()).includes(search.toLowerCase()) ||
                    item.status.tooltip.toLowerCase().includes(search.toLowerCase())
                );
            });
        });
    }, [search]);

    useEffect(() => {
        dispatch(setPageTitle('Employee'));

        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const response = await getAllEmployees();
                console.log("🚀 ~ fetchEmployees ~ response:", response)

                const transformed = response?.data?.map((employee, index) => ({
                    ...employee,
                    id: employee._id, // 👈 keep id for routing
                    employeeId: `EMP${String(index + 1).padStart(3, '0')}`,
                    role: employee.technicianType,
                    tools: (employee.tools || []).map((tool) =>
                        tool.toolId?.nomenclature || 'N/A'
                    ),
                    status: {
                        color: employee.status === 'active' ? 'success' : 'danger',
                        tooltip: employee.status.charAt(0).toUpperCase() + employee.status.slice(1),
                    },
                }));

                setItems(transformed);
                setInitialRecords(transformed);
            } catch (err) {
                console.error("Failed to load employees", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

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
                            {/* <button type="button" className="btn btn-danger gap-2" onClick={() => deleteRow()}>
                                <IconTrashLines />
                                Delete
                            </button> */}
                            <Link to="/admin/employee/add" className="btn btn-primary gap-2">
                                <IconPlus />
                                Add New
                            </Link>
                        </div>
                        <div className="ltr:ml-auto rtl:mr-auto">
                            <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="datatables pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records}
                            columns={[
                                {
                                    accessor: 'empId', // use empId from the API response
                                    title: 'EMP ID',
                                    sortable: true,
                                },
                                {
                                    accessor: 'name',
                                    sortable: true,
                                },
                                {
                                    accessor: 'email',
                                    sortable: true,
                                },
                                {
                                    accessor: 'phone',
                                    sortable: true,
                                },

                                {
                                    accessor: 'role',
                                    sortable: true,
                                },
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
                                    )

                                },
                            ]}
                            highlightOnHover
                            totalRecords={initialRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={(p) => setPage(p)}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            selectedRecords={selectedRecords}
                            onSelectedRecordsChange={setSelectedRecords}
                            paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Employee;
