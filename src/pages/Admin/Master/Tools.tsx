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
import { AllTools, deleteToolById, getEngineerByToolId } from '../../../api';
import dayjs from 'dayjs';
import ConfirmModal from '../../../components/common/ConfirmModal';

const Tools = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Tools'));
    }, []);

    const [items, setItems] = useState<any[]>([]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'firstName', direction: 'asc' });
    const [loading, setLoading] = useState(true);

    // Confirm Modal state
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [toolToDelete, setToolToDelete] = useState<string | null>(null);

    // Open confirm modal
    const handleOpenConfirmModal = (id: string) => {
        setToolToDelete(id);
        setConfirmModalOpen(true);
    };

    // Confirm deletion
    const handleConfirmDelete = async () => {
        if (!toolToDelete) return;
        try {
            await deleteToolById(toolToDelete);
            const updatedItems = items.filter((item) => item._id !== toolToDelete);
            setItems(updatedItems);
            setInitialRecords(updatedItems);
            setRecords(updatedItems.slice(0, pageSize));
        } catch (error) {
            console.error('Failed to delete tool:', error);
        } finally {
            setToolToDelete(null);
            setConfirmModalOpen(false);
        }
    };

    // useEffect(() => {
    //     const fetchTools = async () => {
    //         setLoading(true);
    //         try {
    //             const response = await AllTools();
    //             const tools = response.data?.tools || [];
    //             setItems(tools);
    //             setInitialRecords(tools);
    //             setRecords(tools.slice(0, pageSize));
    //         } catch (error) {
    //             console.error('Failed to fetch tools:', error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     fetchTools();
    // }, []);




    useEffect(() => {
        const fetchTools = async () => {
            setLoading(true);
            try {
                const response = await AllTools();
                const tools = response.data?.tools || [];

                const toolsWithEngineers = await Promise.all(
                    tools.map(async (tool: any) => {
                        try {
                            const engineerData = await getEngineerByToolId(tool._id);

                            return { ...tool, engineerName: engineerData.engineer.name || '—' };
                        } catch (err) {
                            console.error('Failed to fetch engineer for tool:', tool._id, err);
                            return { ...tool, engineerName: '—' };
                        }
                    })
                );

                setItems(toolsWithEngineers);
                setInitialRecords(toolsWithEngineers);
                setRecords(toolsWithEngineers.slice(0, pageSize));
            } catch (error) {
                console.error('Failed to fetch tools:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTools();
    }, []);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const filtered = items.filter((item) => {
            const query = search.toLowerCase();
            return (
                item.nomenclature?.toLowerCase().includes(query) ||
                item.manufacturer?.toLowerCase().includes(query) ||
                item.model?.toLowerCase().includes(query) ||
                item.srNo?.toLowerCase().includes(query) ||
                item.calibrationCertificateNo?.toLowerCase().includes(query) ||
                item.calibrationDate?.toLowerCase().includes(query) ||
                item.range?.toLowerCase().includes(query) ||
                item.toolID?.toLowerCase().includes(query)
            );
        });
        setInitialRecords(filtered);
        setPage(1);
    }, [search, items]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Tools', icon: <IconBox /> },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/tools/add" className="btn btn-primary gap-2">
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
                                { accessor: 'toolId', sortable: true },
                                { accessor: 'SrNo', sortable: true },
                                { accessor: 'nomenclature', sortable: true },
                                { accessor: 'engineerName', sortable: true },
                                // {
                                //     accessor: 'issueDate',
                                //     sortable: true,
                                //     render: ({ issueDate }) => dayjs(issueDate).format('DD-MM-YYYY'),
                                // },
                                // {
                                //     accessor: 'submitDate',
                                //     sortable: true,
                                //     render: ({ submitDate }) => dayjs(submitDate).format('DD-MM-YYYY'),
                                // },
                                { accessor: 'manufacturer', sortable: true },
                                { accessor: 'model', sortable: true },
                                { accessor: 'calibrationCertificateNo', sortable: true },
                                {
                                    accessor: 'calibrationValidTill',
                                    sortable: true,
                                    render: ({ calibrationValidTill }) => dayjs(calibrationValidTill).format('DD-MM-YYYY'),
                                },
                                { accessor: 'range', sortable: true },


                                // ✅ New Created By column
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
                                    render: (row) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink to={`/admin/tools/view/${row._id}`} className="flex hover:text-primary">
                                                <IconEye />
                                            </NavLink>
                                            <NavLink to={`/admin/tools/edit/${row._id}`} className="flex hover:text-info">
                                                <IconEdit className="w-4.5 h-4.5" />
                                            </NavLink>
                                            <button
                                                type="button"
                                                className="flex hover:text-danger"
                                                onClick={() => handleOpenConfirmModal(row._id)}
                                            >
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

            {/* Confirm Modal */}
            <ConfirmModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Tool"
                message="Are you sure you want to delete this tool?"
            />
        </>
    );
};

export default Tools;
