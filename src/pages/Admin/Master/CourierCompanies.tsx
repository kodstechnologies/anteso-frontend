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
import { getAllCourier, deleteCourier } from '../../../api/index'; // ✅ Import deleteCourier
import { Modal, Button } from '@mantine/core'; // ✅ Import Mantine Modal and Button

const CourierCompanies = () => {
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
        columnAccessor: 'courierCompanyName',
        direction: 'asc',
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // ✅ State for modal
    const [recordToDelete, setRecordToDelete] = useState<any>(null); // ✅ State for record to delete

    useEffect(() => {
        dispatch(setPageTitle('Courier Companies'));
    }, []);

    // Fetch data from API on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getAllCourier();
                const courierData = response?.data || [];
                setItems(courierData);
                setInitialRecords(sortBy(courierData, 'courierCompanyName'));
            } catch (err) {
                console.error("Failed to fetch couriers:", err);
            }
        };
        fetchData();
    }, []);

    const deleteRow = async (id: any = null) => {
        if (id) {
            // Single record deletion
            setRecordToDelete(id);
            setIsDeleteModalOpen(true); // Open confirmation modal
        } else {
            // Multiple record deletion
            if (selectedRecords.length > 0) {
                setRecordToDelete(null); // No single ID for multiple deletions
                setIsDeleteModalOpen(true); // Open confirmation modal
            }
        }
    };

    const handleConfirmDelete = async () => {
        try {
            if (recordToDelete) {
                // Delete single record via API
                await deleteCourier(recordToDelete);
                const filtered = items.filter((item) => item._id !== recordToDelete);
                setItems(filtered);
                setInitialRecords(filtered);
            } else {
                // Delete multiple selected records
                const selectedIds = selectedRecords.map((r) => r._id);
                for (const id of selectedIds) {
                    await deleteCourier(id); // Call API for each selected record
                }
                const filtered = items.filter((item) => !selectedIds.includes(item._id));
                setItems(filtered);
                setInitialRecords(filtered);
                setSelectedRecords([]);
            }
            setSearch('');
            setPage(1);
        } catch (err) {
            console.error("Failed to delete courier(s):", err);
        } finally {
            setIsDeleteModalOpen(false); // Close modal
            setRecordToDelete(null); // Reset record to delete
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false); // Close modal
        setRecordToDelete(null); // Reset record to delete
    };

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const filtered = items.filter((item) =>
            item.courierCompanyName.toLowerCase().includes(search.toLowerCase()) ||
            item.status.toLowerCase().includes(search.toLowerCase())
        );
        setInitialRecords(filtered);
    }, [search, items]);

    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Courier Companies', icon: <IconBox /> },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/courier-companies/add" className="btn btn-primary gap-2">
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
                                {
                                    accessor: 'courierCompanyName',
                                    title: 'Company Name',
                                    sortable: true,
                                    render: (record) => record.courierCompanyName || '—',
                                },
                                {
                                    accessor: 'trackingId',
                                    title: 'Tracking ID',
                                    sortable: true,
                                    render: (record) => record.trackingId || '—',
                                },
                                {
                                    accessor: 'trackingUrl',
                                    title: 'Tracking URL',
                                    sortable: true,
                                    render: (record) => record.trackingUrl || '—',
                                },
                                {
                                    accessor: 'status',
                                    title: 'Status',
                                    sortable: true,
                                    render: (record) => (
                                        <span className={`text-${record.status?.toLowerCase() === 'active' ? 'success' : 'danger'}`}>
                                            {record.status || '—'}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'createdBy',
                                    title: 'Created By',
                                    render: (record) => {
                                        const creator = record.createdBy;
                                        if (!creator) return '—';

                                        let label = '';
                                        if (record.createdByModel === 'Admin' || creator.role === 'admin') {
                                            label = `Admin (${creator.email || '—'})`;
                                        } else if (creator.role === 'Employee') {
                                            const techType = creator.technicianType ? creator.technicianType.replace('-', ' ') : '';
                                            label = `${techType ? `${techType} - ` : ''}(${creator.email || '—'})`;
                                        } else {
                                            label = creator.name || creator.email || '—';
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
                                            <NavLink to={`/admin/courier-companies/view/${_id}`} className="flex hover:text-primary">
                                                <IconEye />
                                            </NavLink>
                                            <NavLink to={`/admin/courier-companies/edit/${_id}`} className="flex hover:text-info">
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
                            onPageChange={(p) => setPage(p)}
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

            {/* Confirmation Modal */}
            <Modal
                opened={isDeleteModalOpen}
                onClose={handleCancelDelete}
                title="Confirm Deletion"
                centered
            >
                <div>
                    <p>
                        Are you sure you want to delete {recordToDelete ? 'this courier' : `${selectedRecords.length} selected courier(s)`}?
                    </p>
                    <div className="flex justify-end gap-4 mt-4">
                        <Button variant="outline" onClick={handleCancelDelete}>
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleConfirmDelete}>
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default CourierCompanies;