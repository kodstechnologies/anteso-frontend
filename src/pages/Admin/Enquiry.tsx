import { Link, NavLink, useNavigate } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPlus from '../../components/Icon/IconPlus';
import IconEye from '../../components/Icon/IconEye';
import IconCopy from '../../components/Icon/IconCopy';
import IconRefresh from '../../components/Icon/IconRefresh';
import IconFile from '../../components/Icon/IconFile';
import Breadcrumb, { BreadcrumbItem } from '../../components/common/Breadcrumb';
import IconHome from '../../components/Icon/IconHome';
import IconBox from '../../components/Icon/IconBox';
import {
    deleteEnquiryById,
    getAllEnquiry,
    type EnquiryFilterOptions,
    type EnquiryListFilters,
} from '../../api';
import ConfirmModal from '../../components/common/ConfirmModal';
import { showMessage } from '../../components/common/ShowMessage';
import { formatCreatedAtDisplay, isInDateRange } from '../../utils/tableDateFilter';
import {
    exportEnquiriesToExcel,
    exportEnquiriesToPdf,
    exportEnquiriesToWord,
    type EnquiryExportFilters,
} from '../../utils/exportEnquiries';

const PAGE_SIZES = [10, 20, 30, 50, 100];

const emptyFilterOptions: EnquiryFilterOptions = {
    cities: [],
    districts: [],
    pinCodes: [],
    branches: [],
    emailAddresses: [],
    contactNumbers: [],
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
        <select
            className="form-select w-full"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={title}
        >
            <option value="">{label}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    </div>
);

const mapEnquiryItem = (item: any) => ({
    ...item,
    id: item._id,
    enquiryID: item.enquiryId,
    createdAt: item.createdAt,
    hName: item.hospitalName,
    fullAddress: item.fullAddress,
    city: item.city,
    district: item.district,
    state: item.state,
    pincode: item.pinCode,
    branch: item.branch,
    contactperson: item.contactPerson,
    email: item.emailAddress,
    phone: item.contactNumber,
    designation: item.designation,
    quotation: item.quotationStatus?.toLowerCase(),
    remark: item.quotation?.rejectionRemark || null,
});

const Enquiry = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<'pdf' | 'excel' | 'word' | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [selectedRecords, setSelectedRecords] = useState<any>([]);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [branch, setBranch] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [filterOptions, setFilterOptions] = useState<EnquiryFilterOptions>(emptyFilterOptions);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [rowToDelete, setRowToDelete] = useState<string | null>(null);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'createdAt',
        direction: 'desc',
    });
    const [copied, setCopied] = useState(false);

    const fetchEnquiries = async (filters: EnquiryListFilters = {}) => {
        try {
            setLoading(true);
            const response = await getAllEnquiry(filters);
            const enriched = (response.data || []).map(mapEnquiryItem);
            setItems(enriched);
            setFilterOptions(response.filters || emptyFilterOptions);
        } catch (err: any) {
            showMessage(err.message || 'Failed to fetch enquiries', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Enquiry'));
        fetchEnquiries();
    }, [dispatch]);
    useEffect(() => {
        const filters: EnquiryListFilters = {
            city,
            district,
            pinCode,
            branch,
            emailAddress,
            contactNumber,
        };
        fetchEnquiries(filters);
        setPage(1);
    }, [city, district, pinCode, branch, emailAddress, contactNumber]);

    const clearFilters = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setCity('');
        setDistrict('');
        setPinCode('');
        setBranch('');
        setEmailAddress('');
        setContactNumber('');
        setPage(1);
    };

    const hasActiveFilters =
        search ||
        dateFrom ||
        dateTo ||
        city ||
        district ||
        pinCode ||
        branch ||
        emailAddress ||
        contactNumber;

    const handleCopy = async () => {
        try {
            const link = `${window.location.origin}/enquiry_form`;
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const deleteRow = (id: string | null = null) => {
        setRowToDelete(id);
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (rowToDelete !== null) {
                await deleteEnquiryById(rowToDelete);
                setItems((prev) => prev.filter((item) => item._id !== rowToDelete));
            } else {
                const ids = selectedRecords.map((d: any) => d._id);
                await Promise.all(ids.map((id: string) => deleteEnquiryById(id)));
                setItems((prev) => prev.filter((d) => !ids.includes(d._id)));
                setPage(1);
            }
            setSelectedRecords([]);
            showMessage('Enquiry deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete enquiry:', error);
            showMessage('Failed to delete enquiry. Please try again.', 'error');
        } finally {
            setShowConfirmModal(false);
            setRowToDelete(null);
        }
    };

    const updateQuotation = (id: string, newStatus: 'create' | 'created' | 'approved' | 'rejected') => {
        const updatedItems = items.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
        setItems(updatedItems);
        navigate(`/admin/quotation/add/${id}`);
    };

    const filteredRecords = useMemo(() => {
        const q = search.toLowerCase().trim();
        return items.filter((item) => {
            const matchesSearch =
                !q ||
                (item.enquiryID && String(item.enquiryID).toLowerCase().includes(q)) ||
                (item.hName && String(item.hName).toLowerCase().includes(q)) ||
                (item.fullAddress && String(item.fullAddress).toLowerCase().includes(q)) ||
                (item.city && String(item.city).toLowerCase().includes(q)) ||
                (item.district && String(item.district).toLowerCase().includes(q)) ||
                (item.state && String(item.state).toLowerCase().includes(q)) ||
                (item.pincode && String(item.pincode).toLowerCase().includes(q)) ||
                (item.branch && String(item.branch).toLowerCase().includes(q)) ||
                (item.contactperson && String(item.contactperson).toLowerCase().includes(q)) ||
                (item.email && String(item.email).toLowerCase().includes(q)) ||
                (item.phone && String(item.phone).toLowerCase().includes(q)) ||
                (item.designation && String(item.designation).toLowerCase().includes(q)) ||
                (item.quotation && String(item.quotation).toLowerCase().includes(q));

            const matchesDate = isInDateRange(item.createdAt, dateFrom, dateTo);
            return matchesSearch && matchesDate;
        });
    }, [items, search, dateFrom, dateTo]);

    const sortedRecords = useMemo(() => {
        const data = [...filteredRecords];

        if (sortStatus.columnAccessor) {
            data.sort((a, b) => {
                const aValue = a[sortStatus.columnAccessor];
                const bValue = b[sortStatus.columnAccessor];

                if (sortStatus.columnAccessor === 'createdAt') {
                    const aDate = aValue ? new Date(aValue).getTime() : 0;
                    const bDate = bValue ? new Date(bValue).getTime() : 0;
                    return sortStatus.direction === 'asc' ? aDate - bDate : bDate - aDate;
                }

                const aString = String(aValue ?? '').toLowerCase();
                const bString = String(bValue ?? '').toLowerCase();
                return sortStatus.direction === 'asc'
                    ? aString.localeCompare(bString)
                    : bString.localeCompare(aString);
            });
        }

        return data;
    }, [filteredRecords, sortStatus]);

    const records = useMemo(() => {
        const from = (page - 1) * pageSize;
        return sortedRecords.slice(from, from + pageSize);
    }, [sortedRecords, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [search, pageSize, dateFrom, dateTo]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Enquiry', icon: <IconBox /> },
    ];

    const exportFilters: EnquiryExportFilters = {
        city,
        district,
        pinCode,
        branch,
        emailAddress,
        contactNumber,
        dateFrom,
        dateTo,
        search,
    };

    const handleExport = async (type: 'pdf' | 'excel' | 'word') => {
        if (!sortedRecords.length) {
            showMessage('No enquiries available to export for the applied filters', 'error');
            return;
        }

        try {
            setExporting(type);
            if (type === 'pdf') {
                exportEnquiriesToPdf(sortedRecords, exportFilters);
            } else if (type === 'excel') {
                exportEnquiriesToExcel(sortedRecords, exportFilters);
            } else {
                await exportEnquiriesToWord(sortedRecords, exportFilters);
            }
            showMessage(`Enquiries exported as ${type.toUpperCase()} successfully`, 'success');
        } catch (error) {
            console.error(`Failed to export enquiries as ${type}:`, error);
            showMessage(`Failed to export enquiries as ${type.toUpperCase()}`, 'error');
        } finally {
            setExporting(null);
        }
    };

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 flex flex-col gap-4 px-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-2">
                                <Link to="/admin/enquiry/add" className="btn btn-primary gap-2">
                                    <IconPlus />
                                    Add New
                                </Link>
                                <button type="button" onClick={handleCopy} className="btn btn-primary gap-2">
                                    <IconCopy />
                                    {copied ? ' Copied! ' : 'Copy Link'}
                                </button>
                            </div>

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
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filter Enquiries</h3>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {sortedRecords.length} record(s) match the current filters
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                <FilterSelect
                                    title="City"
                                    label="All Cities"
                                    value={city}
                                    options={filterOptions.cities}
                                    onChange={setCity}
                                />
                                <FilterSelect
                                    title="District"
                                    label="All Districts"
                                    value={district}
                                    options={filterOptions.districts}
                                    onChange={setDistrict}
                                />
                                <FilterSelect
                                    title="Pincode"
                                    label="All Pincodes"
                                    value={pinCode}
                                    options={filterOptions.pinCodes}
                                    onChange={setPinCode}
                                />
                                <FilterSelect
                                    title="Branch Name"
                                    label="All Branches"
                                    value={branch}
                                    options={filterOptions.branches}
                                    onChange={setBranch}
                                />
                                <FilterSelect
                                    title="Email"
                                    label="All Emails"
                                    value={emailAddress}
                                    options={filterOptions.emailAddresses}
                                    onChange={setEmailAddress}
                                />
                                <FilterSelect
                                    title="Phone"
                                    label="All Phones"
                                    value={contactNumber}
                                    options={filterOptions.contactNumbers}
                                    onChange={setContactNumber}
                                />
                            </div>

                            <div className="mt-4 flex flex-wrap items-end justify-start gap-3 border-t border-gray-200 pt-4 dark:border-white/10">
                                <div className="flex min-w-[150px] flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">From Date</label>
                                    <input
                                        type="date"
                                        className="form-input w-full"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div className="flex min-w-[150px] flex-col gap-1">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">To Date</label>
                                    <input
                                        type="date"
                                        className="form-input w-full"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                                <div className="flex min-w-[220px] flex-1 flex-col gap-1 sm:max-w-xs">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Search</label>
                                    <input
                                        type="text"
                                        className="form-input w-full"
                                        placeholder="Search Enquiry ID..."
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

                    <div className="datatables pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records}
                            fetching={loading}
                            columns={[
                                {
                                    accessor: 'enquiryID',
                                    title: 'ENQ ID',
                                    sortable: true,
                                },
                                {
                                    accessor: 'createdAt',
                                    title: 'Created At',
                                    sortable: true,
                                    render: ({ createdAt }) => formatCreatedAtDisplay(createdAt),
                                },
                                {
                                    accessor: 'hName',
                                    title: 'Hospital Name',
                                    sortable: true,
                                },
                                {
                                    accessor: 'fullAddress',
                                    title: 'Full Address',
                                    sortable: true,
                                },
                                {
                                    accessor: 'city',
                                    title: 'City',
                                    sortable: true,
                                },
                                {
                                    accessor: 'district',
                                    title: 'District',
                                    sortable: true,
                                },
                                {
                                    accessor: 'state',
                                    title: 'State',
                                    sortable: true,
                                },
                                {
                                    accessor: 'pincode',
                                    title: 'Pincode',
                                    sortable: true,
                                },
                                {
                                    accessor: 'branch',
                                    title: 'Branch Name',
                                    sortable: true,
                                },
                                {
                                    accessor: 'contactperson',
                                    title: 'Contact Person',
                                    sortable: true,
                                },
                                {
                                    accessor: 'email',
                                    title: 'Email',
                                    sortable: true,
                                },
                                {
                                    accessor: 'phone',
                                    title: 'Phone',
                                    sortable: true,
                                },
                                {
                                    accessor: 'designation',
                                    title: 'Designation',
                                    sortable: true,
                                },
                                {
                                    accessor: 'quotation',
                                    title: 'Quotation',
                                    sortable: true,
                                    render: ({ id, quotation }) => {
                                        if (quotation === 'accepted') {
                                            return <span className="text-success font-semibold">Accepted</span>;
                                        }
                                        if (quotation === 'created') {
                                            return (
                                                <button className="btn btn-primary btn-sm opacity-50 cursor-not-allowed" disabled>
                                                    Created
                                                </button>
                                            );
                                        }
                                        if (quotation === 'create') {
                                            return (
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => updateQuotation(id, 'created')}
                                                >
                                                    Create
                                                </button>
                                            );
                                        }
                                        if (quotation === 'rejected') {
                                            return (
                                                <button
                                                    type="button"
                                                    className="text-danger font-semibold"
                                                    onClick={() => updateQuotation(id, 'rejected')}
                                                >
                                                    Rejected
                                                </button>
                                            );
                                        }
                                        return <span className="text-gray-500 italic">N/A</span>;
                                    },
                                },
                                {
                                    accessor: 'remark',
                                    title: 'Remark',
                                    sortable: false,
                                    render: ({ quotation, remark }) => {
                                        if (quotation === 'rejected') {
                                            return (
                                                <span className="text-danger font-medium">
                                                    {remark || 'No remark provided'}
                                                </span>
                                            );
                                        }
                                        return <span className="text-gray-400 italic">—</span>;
                                    },
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: ({ id, quotation }) => {
                                        const hideFile = !quotation || quotation === 'create' || quotation === 'N/A';

                                        return (
                                            <div className="flex gap-4 items-center w-max mx-auto">
                                                {!hideFile && (
                                                    <NavLink to={`/admin/quotation/view/${id}`} className="flex hover:text-primary">
                                                        <IconFile />
                                                    </NavLink>
                                                )}

                                                <NavLink to={`/admin/enquiry/view/${id}`} className="flex hover:text-primary">
                                                    <IconEye />
                                                </NavLink>
                                                <button type="button" className="flex hover:text-danger" onClick={() => deleteRow(id)}>
                                                    <IconTrashLines />
                                                </button>
                                            </div>
                                        );
                                    },
                                },
                            ]}
                            highlightOnHover
                            totalRecords={filteredRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={(p) => setPage(p)}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                            }}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            selectedRecords={selectedRecords}
                            onSelectedRecordsChange={setSelectedRecords}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                        />
                    </div>
                </div>
                <ConfirmModal
                    open={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Confirmation"
                    message="Are you sure you want to delete the selected enquiry?"
                />
            </div>
        </>
    );
};

export default Enquiry;
