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
import { getAllEmployees } from '../../../api';

const SalaryManagement = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Salary Management'));
    }, []);

    const [items, setItems] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [filteredRecords, setFilteredRecords] = useState<any[]>([]); // Changed from initialRecords
    const [records, setRecords] = useState<any[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'clientId', // Changed to clientId for better default sorting
        direction: 'asc',
    });

    // ✅ Fetch Employees from API
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await getAllEmployees();
                // map with clientId like before
                const formatted = data.data.map((item: any, index: number) => ({
                    ...item,
                    clientId: `EMP${String(index + 1).padStart(3, '0')}`,
                }));
                setItems(formatted);
            } catch (error) {
                console.error("Error fetching employees:", error);
            }
        };
        fetchEmployees();
    }, []);

    // Apply search and sorting to get filtered records
    useEffect(() => {
        if (!items.length) return;
        
        // First filter based on search
        let filtered = items.filter((item) =>
            [
                item.clientId,
                item.name,
                item.email,
                item.address,
                item.phone,
                item.business,
                item.gstNo,
                item.designation,
                item.title,
                item.amount?.toString(),
                item.month,
                item.total?.toString(),
            ]
                .join(' ')
                .toLowerCase()
                .includes(search.toLowerCase())
        );
        
        // Then apply sorting
        const sorted = sortBy(filtered, sortStatus.columnAccessor);
        const finalData = sortStatus.direction === 'desc' ? sorted.reverse() : sorted;
        
        setFilteredRecords(finalData);
        setPage(1); // Reset to first page when search or sort changes
    }, [items, search, sortStatus]);

    // Update paginated records when filtered records, page, or pageSize changes
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(filteredRecords.slice(from, to));
    }, [filteredRecords, page, pageSize]);

    // Reset to page 1 when page size changes
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    const deleteRow = (id: any = null) => {
        if (window.confirm('Are you sure you want to delete selected row(s)?')) {
            const result = items.filter((user) => user.id !== id);
            setItems(result);
            setSelectedRecords([]);
            setSearch('');
            setPage(1);
        }
    };

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Salary Management', icon: <IconBox /> },
    ];

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
                                { accessor: 'name', title: 'Name', sortable: true },
                                { accessor: 'email', title: 'Email', sortable: true },
                                { accessor: 'designation', title: 'Designation', sortable: true },
                                { accessor: 'department', title: 'Department', sortable: true },
                                { accessor: 'phone', title: 'Phone', sortable: true },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: (row) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink 
                                                to={`/admin/hrms/salary-management-view/${row._id}`} 
                                                className="flex hover:text-primary"
                                            >
                                                <IconEye />
                                            </NavLink>
                                        </div>
                                    ),
                                },
                            ]}
                            highlightOnHover
                            totalRecords={filteredRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            selectedRecords={selectedRecords}
                            onSelectedRecordsChange={setSelectedRecords}
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

export default SalaryManagement;