import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconPlus from '../../../components/Icon/IconPlus';
import IconFile from '../../../components/Icon/IconFile';
import IconRefresh from '../../../components/Icon/IconRefresh';
import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb';
import IconHome from '../../../components/Icon/IconHome';
import IconCreditCard from '../../../components/Icon/IconCreditCard';
import { getAllInvoices, deleteInvoice } from '../../../api';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { showMessage } from '../../../components/common/ShowMessage';
import { formatCreatedAtDisplay, isInDateRange } from '../../../utils/tableDateFilter';
import {
  exportInvoicesToExcel,
  exportInvoicesToPdf,
  exportInvoicesToWord,
  type InvoiceExportFilters,
} from '../../../utils/exportInvoices';

interface Payment {
  paymentType: 'advance' | 'balance' | 'complete';
  paymentAmount: number;
  paymentStatus: 'paid' | 'pending';
  utrNumber: string;
}

interface Invoice {
  _id: string;
  invoiceId: string;
  srfNumber: string;
  buyerName: string;
  address: string;
  state: string;
  gstin?: string;
  grandtotal: number;
  payment?: Payment;
  status?: 'Paid' | 'Pending';
  createdAt?: string;
  branchName?: string;
}

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

const Invoices: React.FC = () => {
  const dispatch = useDispatch();
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [exporting, setExporting] = useState<'pdf' | 'excel' | 'word' | null>(null);

  const [filterOptions, setFilterOptions] = useState<{ states: string[]; branchNames: string[] }>({
    states: [],
    branchNames: [],
  });

  const [page, setPage] = useState<number>(1);
  const PAGE_SIZES = [10, 20, 30, 50];
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [selectedRecords, setSelectedRecords] = useState<Invoice[]>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'createdAt',
    direction: 'desc',
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(setPageTitle('Invoices'));
  }, [dispatch]);

  // Fetch invoices from backend with filters
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await getAllInvoices({
          state: stateFilter,
          branchName: branchFilter,
        });
        console.log("Full API response:", res);

        // Handle different response structures
        let invoicesData = [];
        if (res?.data?.data) {
          invoicesData = res.data.data;
        } else if (res?.data) {
          invoicesData = Array.isArray(res.data) ? res.data : [res.data];
        } else if (Array.isArray(res)) {
          invoicesData = res;
        } else {
          invoicesData = [];
        }

        console.log("Invoices data extracted:", invoicesData);

        const formattedData: Invoice[] = invoicesData.map((item: any) => ({
          ...item,
          status: item.payment?.paymentStatus === 'paid' ? 'Paid' : 'Pending',
        }));

        setItems(formattedData);

        // Lock in filter options on initial load when no filter is applied
        if (!stateFilter && !branchFilter) {
          const states = Array.from(
            new Set(formattedData.map((item) => item.state).filter(Boolean))
          ).sort() as string[];

          const branchNames = Array.from(
            new Set(formattedData.map((item) => item.branchName).filter(Boolean))
          ).sort() as string[];

          setFilterOptions({ states, branchNames });
        }

        console.log(`Loaded ${formattedData.length} invoices`);
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
        showMessage('Failed to fetch invoices', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [stateFilter, branchFilter]);

  // Filter records based on search and date range (state and branchName are filtered on backend)
  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      // Search by SRF number or buyer name or invoice ID
      const matchesSearch = !q ||
        String(item.srfNumber || '').toLowerCase().includes(q) ||
        String(item.buyerName || '').toLowerCase().includes(q) ||
        String(item.invoiceId || '').toLowerCase().includes(q);

      const matchesDate = isInDateRange(item.createdAt, dateFrom, dateTo);

      return matchesSearch && matchesDate;
    });

    console.log(`Filtered to ${filtered.length} invoices`);
    return filtered;
  }, [items, search, dateFrom, dateTo]);

  // Sort records
  const sortedRecords = useMemo(() => {
    const data = [...filteredRecords];
    const accessor = sortStatus.columnAccessor as keyof Invoice | string;
    if (!accessor) return data;

    data.sort((a, b) => {
      const aVal = a[accessor as keyof Invoice];
      const bVal = b[accessor as keyof Invoice];

      if (accessor === 'createdAt') {
        const at = aVal ? new Date(aVal as string).getTime() : 0;
        const bt = bVal ? new Date(bVal as string).getTime() : 0;
        return sortStatus.direction === 'asc' ? at - bt : bt - at;
      }

      if (accessor === 'grandtotal') {
        const an = Number(aVal) || 0;
        const bn = Number(bVal) || 0;
        return sortStatus.direction === 'asc' ? an - bn : bn - an;
      }

      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return sortStatus.direction === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [filteredRecords, sortStatus]);

  // Paginate records
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = sortedRecords.slice(start, end);
    console.log(`Page ${page}: Showing ${paginated.length} of ${sortedRecords.length} records`);
    return paginated;
  }, [sortedRecords, page, pageSize]);

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setPage(1);
  }, [search, pageSize, dateFrom, dateTo, stateFilter, branchFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStateFilter('');
    setBranchFilter('');
    setPage(1);
  };

  // Handle delete
  const handleDeleteClick = (id: string) => {
    setSelectedInvoiceId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedInvoiceId) return;
    try {
      await deleteInvoice(selectedInvoiceId);
      const updated = items.filter((inv) => inv._id !== selectedInvoiceId);
      setItems(updated);
      showMessage('Invoice deleted successfully', 'success');

      // Adjust page if current page becomes empty
      const totalPages = Math.ceil((updated.length) / pageSize);
      if (page > totalPages && totalPages > 0) {
        setPage(totalPages);
      } else if (updated.length === 0) {
        setPage(1);
      }
    } catch (err: any) {
      console.error('Failed to delete invoice:', err);
      showMessage(
        err?.response?.data?.message || 'Failed to delete invoice',
        'error'
      );
    } finally {
      setConfirmOpen(false);
      setSelectedInvoiceId(null);
    }
  };

  const handleExport = async (type: 'pdf' | 'excel' | 'word') => {
    if (!sortedRecords.length) {
      showMessage('No invoices available to export for the applied filters', 'error');
      return;
    }

    const exportFilters: InvoiceExportFilters = {
      state: stateFilter,
      branchName: branchFilter,
      dateFrom,
      dateTo,
      search,
    };

    try {
      setExporting(type);
      if (type === 'pdf') {
        exportInvoicesToPdf(sortedRecords, exportFilters);
      } else if (type === 'excel') {
        exportInvoicesToExcel(sortedRecords, exportFilters);
      } else {
        await exportInvoicesToWord(sortedRecords, exportFilters);
      }
      showMessage(`Invoices exported as ${type.toUpperCase()} successfully`, 'success');
    } catch (error) {
      console.error(`Failed to export invoices as ${type}:`, error);
      showMessage(`Failed to export invoices as ${type.toUpperCase()}`, 'error');
    } finally {
      setExporting(null);
    }
  };

  const hasActiveFilters = search || dateFrom || dateTo || stateFilter || branchFilter;

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', to: '/', icon: <IconHome /> },
    { label: 'Invoices', icon: <IconCreditCard /> },
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />

      <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
        <div className="invoice-table">
          {/* Action Row: Add New + Exports */}
          <div className="mb-4.5 px-5 flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Link to="/admin/invoice/add" className="btn btn-primary gap-2 w-fit">
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

            {/* Filters panel matching Orders.tsx design */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filter Invoices</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {sortedRecords.length} record(s) match the current filters
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FilterSelect
                  title="State"
                  label="All States"
                  value={stateFilter}
                  options={filterOptions.states}
                  onChange={setStateFilter}
                />
                <FilterSelect
                  title="Branch Name"
                  label="All Branches"
                  value={branchFilter}
                  options={filterOptions.branchNames}
                  onChange={setBranchFilter}
                />
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
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-start gap-3 border-t border-gray-200 pt-4 dark:border-white/10">
                <div className="flex min-w-[220px] flex-1 flex-col gap-1 sm:max-w-xs">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Search</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    placeholder="Search by SRF, name, or invoice ID..."
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

          {/* Show loading state */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading invoices...</p>
            </div>
          )}

          {/* Show no data message */}
          {!loading && items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No invoices found.</p>
            </div>
          )}

          {/* Show table only when there are records */}
          {!loading && items.length > 0 && (
            <div className="datatables pagination-padding">
              <DataTable
                className="whitespace-nowrap table-hover"
                records={paginatedRecords}
                columns={[
                  { accessor: 'invoiceId', title: 'Invoice ID', sortable: true },
                  { accessor: 'srfNumber', title: 'SRF No', sortable: true },

                  { accessor: 'buyerName', title: 'Customer Name', sortable: true },
                  { accessor: 'address', title: 'Address', sortable: true },
                  { accessor: 'state', title: 'State', sortable: true },
                  { accessor: 'branchName', title: 'Branch Name', sortable: true },
                  {
                    accessor: 'createdAt',
                    title: 'Created At',
                    sortable: true,
                    render: (row: Invoice) => formatCreatedAtDisplay(row.createdAt),
                  },
                  {
                    accessor: 'grandtotal',
                    title: 'Total Amount',
                    sortable: true,
                    render: (row: Invoice) => `₹${row.grandtotal?.toLocaleString() || 0}`
                  },
                  // {
                  //   accessor: 'status',
                  //   title: 'Status',
                  //   sortable: true,
                  //   render: (row: Invoice) => (
                  //     <span className={`badge ${row.status === 'Paid' ? 'bg-success' : 'bg-warning'} text-white px-2 py-1 rounded`}>
                  //       {row.status || 'Pending'}
                  //     </span>
                  //   ),
                  // },
                  {
                    accessor: 'action',
                    title: 'Actions',
                    render: ({ _id }: Invoice) => (
                      <div className="flex gap-4 items-center w-max mx-auto">
                        <NavLink
                          to={`/admin/invoice/viewInvoice/${_id}`}
                          className="flex hover:text-primary"
                        >
                          <IconFile />
                        </NavLink>
                        <button
                          type="button"
                          className="flex hover:text-danger"
                          onClick={() => handleDeleteClick(_id)}
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
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
      />
    </>
  );
};

export default Invoices;