import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconPlus from '../../../components/Icon/IconPlus';
import IconEdit from '../../../components/Icon/IconEdit';
import IconEye from '../../../components/Icon/IconEye';
import IconRefresh from '../../../components/Icon/IconRefresh';
import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb';
import IconHome from '../../../components/Icon/IconHome';
import IconBox from '../../../components/Icon/IconBox';
import {
    getAllDealers,
    deleteDealer,
    type DealerListFilters,
    type DealerFilterOptions,
} from '../../../api';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { showMessage } from '../../../components/common/ShowMessage';
import {
    exportDealersToExcel,
    exportDealersToPdf,
    exportDealersToWord,
    type DealerExportFilters,
} from '../../../utils/exportDealers';

const emptyFilterOptions: DealerFilterOptions = {
    dealerIds: [],
    names: [],
    pincodes: [],
    branches: [],
};

const FilterSelect = ({
    title,
    label,
    value,
    options,
    onChange,
}: {
    title: string;
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) => (
    <div className="flex min-w-0 flex-col gap-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</label>
        <select className="form-select w-full" value={value} onChange={(e) => onChange(e.target.value)} aria-label={title}>
            <option value="">{label}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    </div>
);

const getCreatorLabel = (record: any) => {
    const creator = record.createdBy;
    if (!creator) return '—';
    if (record.createdByModel === 'Admin' || creator.role === 'admin') {
        return `Admin (${creator.email})`;
    }
    if (creator.role === 'Employee') {
        const techType = creator.technicianType ? creator.technicianType.replace('-', ' ') : '';
        return `${techType ? `${techType} - ` : ''}(${creator.email})`;
    }
    return creator.name || creator.email || 'Unknown';
};

const Dealers = () => {
    const dispatch = useDispatch();

    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<'pdf' | 'excel' | 'word' | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [dealerId, setDealerId] = useState('');
    const [name, setName] = useState('');
    const [pincode, setPincode] = useState('');
    const [branch, setBranch] = useState('');
    const [filterOptions, setFilterOptions] = useState<DealerFilterOptions>(emptyFilterOptions);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'name',
        direction: 'asc',
    });

    const fetchDealers = async (filters: DealerListFilters = {}) => {
        try {
            setLoading(true);
            const res = await getAllDealers(filters);
            setRecords(res?.data?.dealers || []);
            setFilterOptions(res?.data?.filters || emptyFilterOptions);
        } catch (error) {
            console.error('Failed to fetch dealers:', error);
            showMessage('Failed to fetch dealers', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Dealers'));
    }, [dispatch]);

    useEffect(() => {
        const filters: DealerListFilters = { dealerId, name, pincode, branch };
        fetchDealers(filters);
    }, [dealerId, name, pincode, branch]);

    const clearFilters = () => {
        setSearch('');
        setDealerId('');
        setName('');
        setPincode('');
        setBranch('');
        setPage(1);
    };

    const hasActiveFilters = search || dealerId || name || pincode || branch;

    const handleDeleteConfirm = async () => {
        if (!selectedId) return;
        try {
            await deleteDealer(selectedId);
            setRecords((prev) => prev.filter((d) => d._id !== selectedId));
            showMessage('Dealer deleted successfully', 'success');
        } catch (error: any) {
            console.error('Failed to delete dealer:', error);
            showMessage(error?.message || 'Failed to delete dealer', 'error');
        } finally {
            setModalOpen(false);
            setSelectedId(null);
        }
    };

    const confirmDelete = (id: string) => {
        setSelectedId(id);
        setModalOpen(true);
    };

    const filteredRecords = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return records;
        return records.filter((item) =>
            Object.values(item).some((val) => {
                if (val === null || val === undefined) return false;
                return String(val).toLowerCase().includes(q);
            }) || getCreatorLabel(item).toLowerCase().includes(q),
        );
    }, [records, search]);

    const sortedRecords = useMemo(() => {
        const data = [...filteredRecords];
        if (!sortStatus.columnAccessor) return data;

        data.sort((a, b) => {
            if (sortStatus.columnAccessor === 'createdBy') {
                const aLabel = getCreatorLabel(a).toLowerCase();
                const bLabel = getCreatorLabel(b).toLowerCase();
                return sortStatus.direction === 'asc'
                    ? aLabel.localeCompare(bLabel)
                    : bLabel.localeCompare(aLabel);
            }

            const aValue = a[sortStatus.columnAccessor];
            const bValue = b[sortStatus.columnAccessor];
            const aString = String(aValue ?? '').toLowerCase();
            const bString = String(bValue ?? '').toLowerCase();
            return sortStatus.direction === 'asc'
                ? aString.localeCompare(bString)
                : bString.localeCompare(aString);
        });

        return data;
    }, [filteredRecords, sortStatus]);

    const paginatedRecords = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedRecords.slice(start, start + pageSize);
    }, [sortedRecords, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [search, pageSize]);

    const exportFilters: DealerExportFilters = {
        dealerId,
        name,
        pincode,
        branch,
        search,
    };

    const handleExport = async (type: 'pdf' | 'excel' | 'word') => {
        if (!sortedRecords.length) {
            showMessage('No dealers available to export for the applied filters', 'error');
            return;
        }

        try {
            setExporting(type);
            if (type === 'pdf') {
                exportDealersToPdf(sortedRecords, exportFilters);
            } else if (type === 'excel') {
                exportDealersToExcel(sortedRecords, exportFilters);
            } else {
                await exportDealersToWord(sortedRecords, exportFilters);
            }
            showMessage(`Dealers exported as ${type.toUpperCase()} successfully`, 'success');
        } catch (error) {
            console.error(`Failed to export dealers as ${type}:`, error);
            showMessage(`Failed to export dealers as ${type.toUpperCase()}`, 'error');
        } finally {
            setExporting(null);
        }
    };

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Dealers', icon: <IconBox /> },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 flex flex-col gap-4 px-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <Link to="/admin/dealer/add" className="btn btn-primary w-fit gap-2">
                                <IconPlus />
                                Add New
                            </Link>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleExport('pdf')}
                                    className="btn btn-outline-primary h-[38px]"
                                    disabled={loading || exporting !== null || sortedRecords.length === 0}
                                >
                                    {exporting === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleExport('excel')}
                                    className="btn btn-outline-success h-[38px]"
                                    disabled={loading || exporting !== null || sortedRecords.length === 0}
                                >
                                    {exporting === 'excel' ? 'Exporting Excel...' : 'Export Excel'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleExport('word')}
                                    className="btn btn-outline-info h-[38px]"
                                    disabled={loading || exporting !== null || sortedRecords.length === 0}
                                >
                                    {exporting === 'word' ? 'Exporting Word...' : 'Export Word'}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filter Dealers</h3>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {sortedRecords.length} record(s) match the current filters
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <FilterSelect
                                    title="DEL ID"
                                    label="All DEL IDs"
                                    value={dealerId}
                                    options={filterOptions.dealerIds}
                                    onChange={setDealerId}
                                />
                                <FilterSelect
                                    title="Name"
                                    label="All Names"
                                    value={name}
                                    options={filterOptions.names}
                                    onChange={setName}
                                />
                                <FilterSelect
                                    title="Pincode"
                                    label="All Pincodes"
                                    value={pincode}
                                    options={filterOptions.pincodes}
                                    onChange={setPincode}
                                />
                                <FilterSelect
                                    title="Branch"
                                    label="All Branches"
                                    value={branch}
                                    options={filterOptions.branches}
                                    onChange={setBranch}
                                />
                            </div>

                            <div className="mt-4 flex flex-wrap items-end justify-start gap-3 border-t border-gray-200 pt-4 dark:border-white/10">
                                <div className="flex min-w-[220px] flex-1 flex-col gap-1 sm:max-w-xs">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Search</label>
                                    <input
                                        type="text"
                                        className="form-input w-full"
                                        placeholder="Search in all fields..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="btn btn-outline-danger h-[38px] gap-2"
                                        title="Clear all filters"
                                    >
                                        <IconRefresh />
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="datatables pagination-padding px-5 pb-5">
                        <DataTable
                            className="whitespace-nowrap table-hover invoice-table"
                            records={paginatedRecords}
                            fetching={loading}
                            columns={[
                                { accessor: 'dealerId', title: 'DEL ID', sortable: true },
                                { accessor: 'name', title: 'Dealer Name', sortable: true },
                                { accessor: 'address', sortable: true },
                                { accessor: 'pincode', sortable: true },
                                { accessor: 'branch', sortable: true },
                                {
                                    accessor: 'createdBy',
                                    title: 'Created By',
                                    sortable: true,
                                    render: (record) => (
                                        <span className="text-green-600 font-medium">{getCreatorLabel(record)}</span>
                                    ),
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: ({ _id }) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink to={`/admin/dealer/view/${_id}`} className="flex hover:text-primary">
                                                <IconEye />
                                            </NavLink>
                                            <NavLink to={`/admin/dealer/edit/${_id}`} className="flex hover:text-info">
                                                <IconEdit className="w-4.5 h-4.5" />
                                            </NavLink>
                                            <button
                                                type="button"
                                                className="flex hover:text-danger"
                                                onClick={() => confirmDelete(_id)}
                                            >
                                                <IconTrashLines />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            highlightOnHover
                            totalRecords={sortedRecords.length}
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

            <ConfirmModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Dealer"
                message="Are you sure you want to delete this dealer? This action cannot be undone."
            />
        </>
    );
};

export default Dealers;
