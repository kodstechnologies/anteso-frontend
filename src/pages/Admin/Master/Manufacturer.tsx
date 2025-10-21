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
import { getAllManufacturer } from '../../../api';

const Manufacturers = () => {
    const dispatch = useDispatch();

    const [items, setItems] = useState<any[]>([]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'manufactureName',
        direction: 'asc',
    });

    // Set page title
    useEffect(() => {
        dispatch(setPageTitle('Manufacturers'));
    }, [dispatch]);

    // Fetch manufacturers from API
    useEffect(() => {
        const fetchManufacturers = async () => {
            try {
                const res = await getAllManufacturer();
                const data = res.data?.data || [];
                const mappedItems = data.map((item: any, index: number) => ({
                    ...item,
                    manufacturersID: `MANU${String(index + 1).padStart(3, '0')}`,
                }));
                setItems(mappedItems);
                setInitialRecords(sortBy(mappedItems, 'manufactureName'));
            } catch (error) {
                console.error('Error fetching manufacturers:', error);
            }
        };
        fetchManufacturers();
    }, []);

    // Filter search
    useEffect(() => {
        const filtered = items.filter((item) => {
            return (
                item.manufacturersID.toLowerCase().includes(search.toLowerCase()) ||
                item.manufactureName?.toLowerCase().includes(search.toLowerCase()) ||
                item.address?.toLowerCase().includes(search.toLowerCase()) ||
                item.contactPersonName?.toLowerCase().includes(search.toLowerCase()) ||
                item.pinCode?.toLowerCase().includes(search.toLowerCase()) ||
                item.branch?.toLowerCase().includes(search.toLowerCase()) ||
                (item.mouValidity ? new Date(item.mouValidity).toLocaleDateString() : '').includes(search)
            );
        });
        setInitialRecords(filtered);
    }, [search, items]);

    // Pagination
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    // Sorting
    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const deleteRow = (id: any = null) => {
        if (window.confirm('Are you sure want to delete selected row ?')) {
            if (id) {
                const filtered = items.filter((user) => user._id !== id);
                setItems(filtered);
                setInitialRecords(filtered);
                setRecords(filtered);
                setSelectedRecords([]);
                setSearch('');
            } else {
                const ids = selectedRecords.map((d: any) => d._id);
                const filtered = items.filter((d) => !ids.includes(d._id));
                setItems(filtered);
                setInitialRecords(filtered);
                setRecords(filtered);
                setSelectedRecords([]);
                setSearch('');
                setPage(1);
            }
        }
    };

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Manufacturers', icon: <IconBox /> },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/manufacture/add" className="btn btn-primary gap-2">
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
                                { accessor: 'manufacturersID', title: 'MANU ID', sortable: true },
                                { accessor: 'name', sortable: true },
                                // { accessor: 'address', sortable: true },
                                { accessor: 'contactPersonName', sortable: true },
                                { accessor: 'pincode', sortable: true },
                                { accessor: 'branch', sortable: true },
                                { accessor: 'mouValidity', sortable: true, render: ({ mouValidity }) => mouValidity ? new Date(mouValidity).toLocaleDateString() : '' },
                                {
                                    accessor: 'createdBy',
                                    title: 'Created By',
                                    render: (record) => {
                                        const creator = record.createdBy;
                                        if (!creator) return '—';

                                        let label = '';
                                        if (record.createdByModel === 'Admin' || creator.role === 'admin') {
                                            label = `Admin (${creator.email})`;
                                        } else if (creator.role === 'Employee') {
                                            const techType = creator.technicianType ? creator.technicianType.replace('-', ' ') : '';
                                            label = `${techType ? `${techType} - ` : ''}(${creator.email})`;
                                        } else {
                                            label = creator.name || creator.email || 'Unknown';
                                        }

                                        return <span className="text-green-600 font-medium">{label}</span>;
                                    },
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: ({ _id }) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink to={`/admin/manufacture/view/${_id}`} className="flex hover:text-primary">
                                                <IconEye />
                                            </NavLink>
                                            <NavLink to={`/admin/manufacture/edit/${_id}`} className="flex hover:text-info">
                                                <IconEdit className="w-4.5 h-4.5" />
                                            </NavLink>
                                            <button type="button" className="flex hover:text-danger" onClick={() => deleteRow(_id)}>
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
                            paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Manufacturers;