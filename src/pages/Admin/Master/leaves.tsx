import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { sortBy } from 'lodash';
import dayjs from 'dayjs';

import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb';
import IconHome from '../../../components/Icon/IconHome';
import IconBox from '../../../components/Icon/IconBox';
import IconEye from '../../../components/Icon/IconEye';
import IconEdit from '../../../components/Icon/IconEdit';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconPlus from '../../../components/Icon/IconPlus';

import { getAllLeave, deleteLeaveById } from '../../../api/index';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { showMessage } from '../../../components/common/ShowMessage';

interface LeaveItem {
    _id: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    status: any;
    rejectionReason:any
}

const Leaves: React.FC = () => {
    const dispatch = useDispatch();

    const [items, setItems] = useState<LeaveItem[]>([]);
    const [initialRecords, setInitialRecords] = useState<LeaveItem[]>([]);
    const [records, setRecords] = useState<LeaveItem[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<LeaveItem[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'startDate',
        direction: 'asc',
    });

    // Modal States
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const PAGE_SIZES = [10, 20, 30, 50, 100];

    useEffect(() => {
        dispatch(setPageTitle('Leave'));
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const data = await getAllLeave();
            const formatted = data.map((item: LeaveItem) => ({
                ...item,
            }));
            setItems(formatted);
            setInitialRecords(sortBy(formatted, 'startDate'));
            setRecords(sortBy(formatted, 'startDate'));
        } catch (err) {
            console.error('Failed to fetch leaves', err);
        }
    };

    const handleDeleteClick = (id: string) => {
        setSelectedId(id);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedId(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedId) return;
        setIsDeleting(true);
        try {
            await deleteLeaveById(selectedId);
            showMessage('Leave deleted successfully', 'success');

            const updated = items.filter((item) => item._id !== selectedId);
            setItems(updated);
            setInitialRecords(updated);
            setRecords(updated);
        } catch (error) {
            console.error('Delete failed:', error);
            showMessage('Failed to delete leave', 'error');
        } finally {
            setIsDeleting(false);
            handleModalClose();
        }
    };

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Leave', icon: <IconBox /> },
    ];

    return (
        <div>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/leave/add" className="btn btn-primary gap-2">
                                <IconPlus />
                                Add New
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="datatables pagination-padding">
                <DataTable
                    className="whitespace-nowrap table-hover invoice-table"
                    records={records}
                    columns={[
                        {
                            accessor: 'startDate',
                            title: 'Start Date',
                            sortable: true,
                            render: ({ startDate }) => dayjs(startDate).format('DD-MM-YYYY'),
                        },
                        {
                            accessor: 'endDate',
                            title: 'End Date',
                            sortable: true,
                            render: ({ endDate }) => dayjs(endDate).format('DD-MM-YYYY'),
                        },
                        {
                            accessor: 'leaveType',
                            title: 'Type',
                            sortable: true,
                        },
                        {
                            accessor: "reason",
                            title: "Reason",
                            sortable: true,
                            render: ({ reason }) => (
                                <div className="whitespace-normal break-words max-w-[250px]">
                                    {reason}
                                </div>
                            ),
                        },

                        {
                            accessor: 'status',
                            title: 'Status',
                            sortable: true,
                            render: ({ status }) => {
                                if (typeof status === 'object' && status !== null) {
                                    return <span className={`text-${status.color}`}>{status.tooltip}</span>;
                                }
                                const statusColor =
                                    status === 'Approved' ? 'success' :
                                        status === 'Rejected' ? 'danger' :
                                            status === 'Pending' ? 'warning' :
                                                'secondary';
                                return <span className={`text-${statusColor}`}>{status}</span>;
                            },
                        },
                        {
                            accessor: "rejectionReason",
                            title: "Reason for Leave Rejection",
                            sortable: true,
                            render: ({ status, rejectionReason }) => (
                                <div className="whitespace-normal break-words max-w-[250px]">
                                    {status === "Rejected" && rejectionReason ? (
                                        <span className="text-md text-red-600 font-semibold">
                                            {rejectionReason}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            accessor: 'actions',
                            title: 'Actions',
                            textAlignment: 'center',
                            render: ({ _id }) => (
                                <div className="flex gap-4 justify-center">
                                    <NavLink to={`/admin/leave/view/${_id}`} className="hover:text-primary">
                                        <IconEye />
                                    </NavLink>
                                    <NavLink to={`/admin/leave/edit/${_id}`} className="hover:text-info">
                                        <IconEdit />
                                    </NavLink>
                                    <button
                                        type="button"
                                        className="hover:text-danger"
                                        onClick={() => handleDeleteClick(_id)}
                                    >
                                        <IconTrashLines />
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    totalRecords={initialRecords.length}
                    recordsPerPage={pageSize}
                    page={page}
                    onPageChange={setPage}
                    recordsPerPageOptions={[10, 20, 30, 50, 100]}
                    onRecordsPerPageChange={setPageSize}
                    sortStatus={sortStatus}
                    onSortStatusChange={setSortStatus}
                    highlightOnHover
                    selectedRecords={selectedRecords}
                    onSelectedRecordsChange={setSelectedRecords}
                    paginationText={({ from, to, totalRecords }) =>
                        `Showing ${from} to ${to} of ${totalRecords} entries`
                    }
                />
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                open={modalOpen}
                onClose={handleModalClose}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={
                    isDeleting
                        ? 'Deleting leave, please wait...'
                        : 'Are you sure you want to delete this leave?'
                }
            />
        </div>
    );
};

export default Leaves;
