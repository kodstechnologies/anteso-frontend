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
import { clientsData } from '../../../data';
import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb';
import IconHome from '../../../components/Icon/IconHome';
import IconBox from '../../../components/Icon/IconBox';
import { deleteClientById, getAllClients } from '../../../api';
import { showMessage } from '../../../components/common/ShowMessage';
import ConfirmModal from '../../../components/common/ConfirmModal';

const Clients = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Clients'));
    }, []);

    // Initialize items with clientId if not already present
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true); // Optional loading state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await getAllClients();
                console.log("🚀 ~ fetchClients ~ response:", response);

                const clientsFromBackend = response.data.clients.map((item: any) => ({
                    ...item,
                    id: item._id, // Required by the DataTable
                }));

                setItems(clientsFromBackend);
                setInitialRecords(sortBy(clientsFromBackend, 'name'));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching clients:', error);
                setLoading(false);
            }
        };

        fetchClients();
    }, []);


    const openDeleteModal = (id: string | null = null) => {
        setDeleteId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setConfirmOpen(false);
        try {
            if (deleteId) {
                await deleteClientById(deleteId);
                const updated = items.filter((user) => user.id !== deleteId);
                setItems(updated);
                setInitialRecords(updated);
                setRecords(updated);
                setSearch('');
                setSelectedRecords([]);
                showMessage('Client deleted successfully', 'success');
            } else {
                const ids = selectedRecords.map((d: any) => d.id);
                for (let id of ids) {
                    await deleteClientById(id);
                }
                const updated = items.filter((d) => !ids.includes(d.id));
                setItems(updated);
                setInitialRecords(updated);
                setRecords(updated);
                setSearch('');
                setSelectedRecords([]);
                setPage(1);
                showMessage('Selected clients deleted successfully', 'success');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showMessage('Failed to delete client(s)', 'error');
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
                    item.clientId.toLowerCase().includes(search.toLowerCase()) || // Add clientId to search
                    item.name.toLowerCase().includes(search.toLowerCase()) ||
                    item.email.toLowerCase().includes(search.toLowerCase()) ||
                    item.address.toLowerCase().includes(search.toLowerCase()) ||
                    item.phone.toLowerCase().includes(search.toLowerCase()) ||
                    item.business.toLowerCase().includes(search.toLowerCase()) ||
                    item.gstNo.toLowerCase().includes(search.toLowerCase())
                );
            });
        });
    }, [search, items]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Clients', icon: <IconBox /> },
    ];
    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/clients/add" className="btn btn-primary gap-2">
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
                                    accessor: 'clientId', // New Client ID column
                                    title: 'CL ID',
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
                                    accessor: 'address',
                                    sortable: true,
                                },
                                {
                                    accessor: 'phone',
                                    sortable: true,
                                },

                                {
                                    accessor: 'gstNo',
                                    sortable: true,
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: ({ _id }) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink to={`/admin/clients/preview/${_id}`} className="flex hover:text-primary">
                                                <IconEye />
                                            </NavLink>
                                            <NavLink to={`/admin/clients/edit/${_id}`} className="flex hover:text-info">
                                                <IconEdit className="w-4.5 h-4.5" />
                                            </NavLink>
                                            {/* <button type="button" className="flex hover:text-danger" onClick={() => deleteRow(_id)}>
                                                <IconTrashLines />
                                            </button> */}
                                            <button
                                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                                onClick={() => openDeleteModal(_id)}
                                            // for bulk delete
                                            >
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
                <ConfirmModal
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Confirm Deletion"
                    message="Are you sure you want to delete the selected client(s)?"
                />
            </div>
        </>
    );
};

export default Clients;
