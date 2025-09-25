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

import { getAllLeave } from '../../../api/index';

interface LeaveItem {
    _id: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    status: {
        tooltip: string;
        color: string;
    };
}

const Leaves: React.FC = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Leave'));
        fetchLeaves();
    }, []);

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

    const PAGE_SIZES = [10, 20, 30, 50, 100];

    const fetchLeaves = async () => {
        try {
            const data = await getAllLeave();
            const formatted = data.map((item: LeaveItem, index: number) => ({
                ...item,
            }));
            setItems(formatted);
            setInitialRecords(sortBy(formatted, 'startDate'));
            setRecords(sortBy(formatted, 'startDate'));
        } catch (err) {
            console.error('Failed to fetch leaves', err);
        }
    };

    const deleteRow = async (id: string | null = null) => {
        if (window.confirm('Are you sure want to delete selected row(s)?')) {
            let updated;
            if (id) {
                updated = items.filter((item) => item._id !== id);
            } else {
                const ids = selectedRecords.map((d) => d._id);
                updated = items.filter((item) => !ids.includes(item._id));
            }
            setItems(updated);
            setInitialRecords(updated);
            setRecords(updated);
            setSelectedRecords([]);
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
                            accessor: 'reason',
                            title: 'Reason',
                            sortable: true,
                        },
                        {
                            accessor: 'status',
                            title: 'Status',
                            sortable: true,
                            render: ({ status }) => (
                                <span className={`text-${status.color}`}>{status.tooltip}</span>
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
                                        onClick={() => deleteRow(_id)}
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
                    recordsPerPageOptions={PAGE_SIZES}
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
        </div>
    );
};

export default Leaves;
