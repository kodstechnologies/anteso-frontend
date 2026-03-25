import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import IconPlus from '../../components/Icon/IconPlus';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconEye from '../../components/Icon/IconEye';
import IconHome from '../../components/Icon/IconHome';
import IconBox from '../../components/Icon/IconBox';
import IconRefresh from '../../components/Icon/IconRefresh';
import Breadcrumb, { BreadcrumbItem } from '../../components/common/Breadcrumb';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { getAllOrders, deleteOrder } from '../../api';
import { showMessage } from '../../components/common/ShowMessage';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatCreatedAtDisplay, isInDateRange } from '../../utils/tableDateFilter';

type Order = {
    _id: string;
    orderId?: string;
    srfNumber?: string;
    procNoOrPoNo?: string;
    type?: string;
    leadOwner?: string;
    createdOn?: string;
    partyCode?: string;
    hospitalName?: string;
    fullAddress?: string;
    city?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    branchName?: string;
    emailAddress?: string;
    contactNumber?: string;
    status?: string;
    [key: string]: any;
};

const Orders = () => {
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [records, setRecords] = useState<Order[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'createdAt',
        direction: 'desc',
    });

    const [selectedRecords, setSelectedRecords] = useState<Order[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    const dispatch = useDispatch();

    // ✅ Fetch Orders on Mount
    useEffect(() => {
        dispatch(setPageTitle('Orders'));
        const fetchOrders = async () => {
            try {
                const data = await getAllOrders();
                console.log("🚀 ~ fetchOrders ~ data:", data);
                setRecords(data.orders || []);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
                showMessage('Failed to fetch orders', 'error');
            }
        };
        fetchOrders();
    }, [dispatch]);

    // ✅ Clear all filters
    const clearFilters = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
    };

    // ✅ Open Confirm Modal
    const handleDeleteClick = (id: string) => {
        setOrderToDelete(id);
        setIsModalOpen(true);
    };

    // ✅ Confirm Delete
    const handleConfirmDelete = async () => {
        if (!orderToDelete) return;

        try {
            const res = await deleteOrder(orderToDelete);
            if (res.success) {
                setRecords((prev) => prev.filter((item) => item._id !== orderToDelete));
                showMessage('Order and related reports deleted successfully', 'success');
            } else {
                showMessage(res.message || 'Failed to delete order', 'error');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            showMessage('Something went wrong while deleting the order', 'error');
        } finally {
            setIsModalOpen(false);
            setOrderToDelete(null);
        }
    };

    // ✅ Cancel Modal
    const handleCancelDelete = () => {
        setIsModalOpen(false);
        setOrderToDelete(null);
    };

    // ✅ Filter records based on search
    const filteredRecords = useMemo(() => {
        const q = search.toLowerCase().trim();
        return records.filter((item) => {
            const matchesSearch =
                !q ||
                Object.values(item).some((val) => {
                    if (val === null || val === undefined) return false;
                    return String(val).toLowerCase().includes(q);
                });
            const matchesDate = isInDateRange(item.createdAt, dateFrom, dateTo);
            return matchesSearch && matchesDate;
        });
    }, [records, search, dateFrom, dateTo]);

    // ✅ Sort filtered records
    const sortedRecords = useMemo(() => {
        const data = [...filteredRecords];

        if (sortStatus.columnAccessor) {
            data.sort((a, b) => {
                const aValue = a[sortStatus.columnAccessor];
                const bValue = b[sortStatus.columnAccessor];

                // 🔥 Special handling for dates
                if (sortStatus.columnAccessor === 'createdAt') {
                    const aDate = aValue ? new Date(aValue).getTime() : 0;
                    const bDate = bValue ? new Date(bValue).getTime() : 0;

                    return sortStatus.direction === 'asc'
                        ? aDate - bDate
                        : bDate - aDate;
                }

                // 🔹 Default string sorting
                const aString = String(aValue ?? '').toLowerCase();
                const bString = String(bValue ?? '').toLowerCase();

                return sortStatus.direction === 'asc'
                    ? aString.localeCompare(bString)
                    : bString.localeCompare(aString);
            });
        }

        return data;
    }, [filteredRecords, sortStatus]);


    // ✅ Get paginated records
    const paginatedRecords = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return sortedRecords.slice(start, end);
    }, [sortedRecords, page, pageSize]);

    // ✅ Reset to first page when search changes or pageSize changes
    useEffect(() => {
        setPage(1);
    }, [search, pageSize, dateFrom, dateTo]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Orders', icon: <IconBox /> },
    ];

    return (
        <div>
            {/* Breadcrumb */}
            <Breadcrumb items={breadcrumbItems} />

            {/* Table Panel */}
            <div className="panel px-0 pb-0">
                <div className="invoice-table">
                    {/* Search + Create */}
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to={'create'} className="btn btn-primary gap-2">
                                <IconPlus /> Create Order
                            </Link>
                        </div>
                        <div className="ltr:ml-auto rtl:mr-auto flex flex-wrap items-center gap-3 justify-end">
                            <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                <span className="text-gray-600 dark:text-gray-400">From</span>
                                <input
                                    type="date"
                                    className="form-input w-auto"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </label>
                            <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                <span className="text-gray-600 dark:text-gray-400">To</span>
                                <input
                                    type="date"
                                    className="form-input w-auto"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </label>
                            <input
                                type="text"
                                className="form-input w-auto min-w-[200px]"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {(search || dateFrom || dateTo) && (
                                <button
                                    onClick={clearFilters}
                                    className="btn btn-outline-danger gap-2"
                                    title="Clear all filters"
                                >
                                    <IconRefresh />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl shadow-md overflow-auto">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={paginatedRecords}
                            columns={[
                                {
                                    accessor: 'srfNumber',
                                    title: 'SRF NO',
                                    sortable: true,
                                    render: (record) => <h4 className="font-semibold">{record.srfNumber || '-'}</h4>,
                                },
                                { accessor: 'procNoOrPoNo', title: 'PROC NO/PO NO', sortable: true, render: (r) => r.procNoOrPoNo || '-' },
                                { accessor: 'leadOwner', title: 'Lead Owner', sortable: true, render: (r) => r.leadOwner || '-' },
                                { accessor: 'leadOwnerType', title: 'Type', sortable: true, render: (r) => r.leadOwnerType || '-' },
                                {
                                    accessor: 'procExpiryDate',
                                    title: 'PROC Expiry Date',
                                    sortable: true,
                                    render: (r) =>
                                        r.procExpiryDate
                                            ? new Date(r.procExpiryDate).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })
                                            : '-',
                                },
                                { accessor: 'partyCodeOrSysId', title: 'Party Code/ Sys ID', sortable: true, render: (r) => r.partyCodeOrSysId || '-' },
                                { accessor: 'hospitalName', title: 'Institute Name', sortable: true, render: (r) => r.hospitalName || '-' },
                                { accessor: 'fullAddress', title: 'Address', sortable: true, render: (r) => r.fullAddress || '-' },
                                { accessor: 'city', title: 'City', sortable: true, render: (r) => r.city || '-' },
                                { accessor: 'district', title: 'District', sortable: true, render: (r) => r.district || '-' },
                                { accessor: 'state', title: 'State', sortable: true, render: (r) => r.state || '-' },
                                { accessor: 'pinCode', title: 'Pin', sortable: true, render: (r) => r.pinCode || '-' },
                                { accessor: 'branchName', title: 'Branch Name', sortable: true, render: (r) => r.branchName || '-' },
                                { accessor: 'emailAddress', title: 'Customer Email', sortable: true, render: (r) => r.emailAddress || '-' },
                                { accessor: 'contactNumber', title: 'Customer Mobile', sortable: true, render: (r) => r.contactNumber || '-' },
                                { accessor: 'status', title: 'Status', sortable: true, render: (r) => r.status || '-' },
                                {
                                    accessor: 'createdAt',
                                    title: 'Created At',
                                    sortable: true,
                                    render: (r) => formatCreatedAtDisplay(r.createdAt),
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: (record: Order) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <Link
                                                to={`/admin/orders/view/${record._id}`}
                                                className="flex hover:text-info"
                                            >
                                                <IconEye className="w-4.5 h-4.5" />
                                            </Link>
                                            <button
                                                type="button"
                                                className="flex hover:text-danger"
                                                onClick={() => handleDeleteClick(record._id)}
                                            >
                                                <IconTrashLines />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            highlightOnHover
                            totalRecords={filteredRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={[10, 20, 30, 40]}
                            onRecordsPerPageChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                            }}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            paginationText={({ from, to, totalRecords }) =>
                                `Showing ${from} to ${to} of ${totalRecords} entries`
                            }
                        />
                    </div>
                </div>
            </div>

            {/* ✅ Confirm Delete Modal */}
            <ConfirmModal
                open={isModalOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Delete Confirmation"
                message="Are you sure you want to delete this order and all related reports? This action cannot be undone."
            />
        </div>
    );
};

export default Orders;