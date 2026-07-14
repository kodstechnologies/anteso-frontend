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
import IconUser from '../../../components/Icon/IconUser';
import { getAllAuthorizedSignatories, deleteAuthorizedSignatory } from '../../../api/index';
import { Modal, Button } from '@mantine/core';
import toast from 'react-hot-toast';

const AuthorizedSignatory = () => {
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
        columnAccessor: 'name',
        direction: 'asc',
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<any>(null);

    useEffect(() => {
        dispatch(setPageTitle('Authorized Signatory'));
    }, [dispatch]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getAllAuthorizedSignatories();
                const data = response?.data || [];
                setItems(data);
                setInitialRecords(sortBy(data, 'name'));
            } catch (err: any) {
                console.error('Failed to fetch authorized signatories:', err);
                toast.error(err?.message || 'Failed to load authorized signatories');
            }
        };
        fetchData();
    }, []);

    const deleteRow = (id: any = null) => {
        if (id) {
            setRecordToDelete(id);
            setIsDeleteModalOpen(true);
        } else if (selectedRecords.length > 0) {
            setRecordToDelete(null);
            setIsDeleteModalOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            if (recordToDelete) {
                await deleteAuthorizedSignatory(recordToDelete);
                const filtered = items.filter((item) => item._id !== recordToDelete);
                setItems(filtered);
                setInitialRecords(filtered);
                toast.success('Deleted successfully');
            } else {
                const selectedIds = selectedRecords.map((r) => r._id);
                for (const id of selectedIds) {
                    await deleteAuthorizedSignatory(id);
                }
                const filtered = items.filter((item) => !selectedIds.includes(item._id));
                setItems(filtered);
                setInitialRecords(filtered);
                setSelectedRecords([]);
                toast.success('Deleted successfully');
            }
            setSearch('');
            setPage(1);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete');
        } finally {
            setIsDeleteModalOpen(false);
            setRecordToDelete(null);
        }
    };

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const filtered = items.filter((item) =>
            String(item.name || '').toLowerCase().includes(search.toLowerCase())
        );
        setInitialRecords(filtered);
    }, [search, items]);

    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? [...sorted].reverse() : [...sorted]);
        setPage(1);
    }, [sortStatus]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Authorized Signatory', icon: <IconUser /> },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/authorized-signatory/add" className="btn btn-primary gap-2">
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
                                    accessor: 'name',
                                    title: 'Name',
                                    sortable: true,
                                    render: (record) => record.name || '—',
                                },
                                {
                                    accessor: 'signature',
                                    title: 'Signature',
                                    sortable: false,
                                    render: (record) =>
                                        record.signature ? (
                                            <img
                                                src={record.signature}
                                                alt={record.name || 'Signature'}
                                                className="h-12 max-w-[160px] object-contain rounded border border-gray-200 bg-white"
                                            />
                                        ) : (
                                            '—'
                                        ),
                                },
                                {
                                    accessor: 'createdAt',
                                    title: 'Created At',
                                    sortable: true,
                                    render: (record) =>
                                        record.createdAt
                                            ? new Date(record.createdAt).toLocaleDateString()
                                            : '—',
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: ({ _id }) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink to={`/admin/authorized-signatory/view/${_id}`} className="flex hover:text-primary">
                                                <IconEye />
                                            </NavLink>
                                            <NavLink to={`/admin/authorized-signatory/edit/${_id}`} className="flex hover:text-info">
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

            <Modal opened={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion" centered>
                <div>
                    <p>
                        Are you sure you want to delete{' '}
                        {recordToDelete ? 'this authorized signatory' : `${selectedRecords.length} selected record(s)`}?
                    </p>
                    <div className="flex justify-end gap-4 mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
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

export default AuthorizedSignatory;
