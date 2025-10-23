// Hrms.tsx
import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconEdit from '../../components/Icon/IconEdit';
import IconEye from '../../components/Icon/IconEye';
import Breadcrumb, { BreadcrumbItem } from '../../components/common/Breadcrumb';
import IconHome from '../../components/Icon/IconHome';
import IconBox from '../../components/Icon/IconBox';
import { getAllEmployees } from '.././../api/index'; 

const Hrms = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Employee Management'));
    }, []);

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                    setInitialRecords(sortBy(res.data, 'name'));
                    setRecords(sortBy(res.data, 'name').slice(0, pageSize));
                }
            } catch (error) {
                console.error("Error fetching employees:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    // Pagination logic
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    // Search logic
    useEffect(() => {
        setInitialRecords(() =>
            items.filter((item) => {
                return (
                    item.empId?.toLowerCase().includes(search.toLowerCase()) ||
                    item.name?.toLowerCase().includes(search.toLowerCase()) ||
                    item.email?.toLowerCase().includes(search.toLowerCase()) ||
                    item.phone?.toString().includes(search.toLowerCase()) ||
                    item.designation?.toLowerCase().includes(search.toLowerCase()) ||
                    item.department?.toLowerCase().includes(search.toLowerCase())
                );
            })
        );
    }, [search, items]);

    // Sorting
    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus, initialRecords]);

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
        </>
    );
};

export default Hrms;
