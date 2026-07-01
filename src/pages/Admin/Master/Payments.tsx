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
import IconCreditCard from '../../../components/Icon/IconCreditCard';
import FadeInModal from '../../../components/common/FadeInModal';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { showMessage } from '../../../components/common/ShowMessage'; // optional toast

import { deletePaymentById, getAllPayments } from '../../../api';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { formatCreatedAtDisplay, isInDateRange } from '../../../utils/tableDateFilter';
import {
  exportPaymentsToExcel,
  exportPaymentsToPdf,
  exportPaymentsToWord,
  type PaymentExportFilters,
} from '../../../utils/exportPayments';

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

const Payments = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle('Payments'));
  }, []);

  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const [filterOptions, setFilterOptions] = useState<{
    paymentTypes: string[];
    paymentModes: string[];
    branchNames: string[];
  }>({
    paymentTypes: ['advance', 'balance', 'complete'],
    paymentModes: ['Cash', 'Bank transfer', 'Cheque', 'UPI', 'Other'],
    branchNames: [],
  });

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | 'word' | null>(null);

  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [selectedRecords, setSelectedRecords] = useState<any>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'createdAt',
    direction: 'desc',
  });
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);

  // ✅ Fetch payments from backend with filters
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await getAllPayments({
          paymentType: paymentTypeFilter,
          paymentMode: paymentModeFilter,
          branchName: branchFilter,
        });
        console.log("🚀 ~ res:", res)
        const backendPayments = res.data.payments.map((p: any) => ({
          id: p._id,
          paymentId: p.paymentId || p._id.slice(-6).toUpperCase(),
          srfClient: p.srfNumber || 'N/A',
          createdAt: p.createdAt,
          totalAmount: p.totalAmount || 0,
          paymentAmount: p.paymentAmount || 0,
          paymentType: p.paymentType,
          utrNumber: p.utrNumber || 'N/A',
          screenshotUrl: p.screenshot || null,
          paymentMode: p.paymentMode || 'N/A',
          branchName: p.branchName || 'N/A',
        }));
        setItems(backendPayments);

        // Lock in branch options on initial load when filters are empty
        if (!paymentTypeFilter && !paymentModeFilter && !branchFilter) {
          const branchNames = Array.from(
            new Set(backendPayments.map((p: any) => p.branchName).filter(Boolean))
          ).sort() as string[];

          setFilterOptions(prev => ({
            ...prev,
            branchNames,
          }));
        }
      } catch (err) {
        console.error('❌ Failed to fetch payments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [paymentTypeFilter, paymentModeFilter, branchFilter]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      const srfOk = !q || String(p.srfClient || '').toLowerCase().includes(q);
      return srfOk && isInDateRange(p.createdAt, dateFrom, dateTo);
    });
  }, [items, search, dateFrom, dateTo]);

  const sortedRecords = useMemo(() => {
    const data = [...filteredRecords];
    const accessor = sortStatus.columnAccessor as string;
    if (!accessor) return data;
    data.sort((a, b) => {
      const aVal = a[accessor];
      const bVal = b[accessor];
      if (accessor === 'createdAt') {
        const at = aVal ? new Date(aVal as string).getTime() : 0;
        const bt = bVal ? new Date(bVal as string).getTime() : 0;
        return sortStatus.direction === 'asc' ? at - bt : bt - at;
      }
      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return sortStatus.direction === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [filteredRecords, sortStatus]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, dateFrom, dateTo, paymentTypeFilter, paymentModeFilter, branchFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPaymentTypeFilter('');
    setPaymentModeFilter('');
    setBranchFilter('');
  };

  const handleDeleteClick = (id: string) => {
    setRowToDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;

    try {
      await deletePaymentById(rowToDelete);
      const updated = items.filter((p) => p.id !== rowToDelete);
      setItems(updated);
      setSelectedRecords([]);
      showMessage('Payment deleted successfully', 'success');
    } catch (error: any) {
      console.error('Failed to delete payment:', error);
      showMessage(error.message || 'Failed to delete payment', 'error');
    } finally {
      setConfirmOpen(false);
      setRowToDelete(null);
    }
  };

  const handleExport = async (type: 'pdf' | 'excel' | 'word') => {
    if (!sortedRecords.length) {
      showMessage('No payments available to export for the applied filters', 'error');
      return;
    }

    const exportFilters: PaymentExportFilters = {
      paymentType: paymentTypeFilter,
      paymentMode: paymentModeFilter,
      branchName: branchFilter,
      dateFrom,
      dateTo,
      search,
    };

    try {
      setExporting(type);
      if (type === 'pdf') {
        exportPaymentsToPdf(sortedRecords, exportFilters);
      } else if (type === 'excel') {
        exportPaymentsToExcel(sortedRecords, exportFilters);
      } else {
        await exportPaymentsToWord(sortedRecords, exportFilters);
      }
      showMessage(`Payments exported as ${type.toUpperCase()} successfully`, 'success');
    } catch (error) {
      console.error(`Failed to export payments as ${type}:`, error);
      showMessage(`Failed to export payments as ${type.toUpperCase()}`, 'error');
    } finally {
      setExporting(null);
    }
  };

  const hasActiveFilters = search || dateFrom || dateTo || paymentTypeFilter || paymentModeFilter || branchFilter;

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', to: '/', icon: <IconHome /> },
    { label: 'Payments', icon: <IconCreditCard /> },
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />

      <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
        <div className="invoice-table">
          {/* Action Row: Add New */}
          <div className="mb-4.5 px-5 flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Link to="/admin/payments/add" className="btn btn-primary gap-2 w-fit">
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

            {/* Filters panel matching Orders/Invoice design */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filter Payments</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {sortedRecords.length} record(s) match the current filters
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <FilterSelect
                  title="Payment Type"
                  label="All Types"
                  value={paymentTypeFilter}
                  options={filterOptions.paymentTypes}
                  onChange={setPaymentTypeFilter}
                />
                <FilterSelect
                  title="Payment Mode"
                  label="All Modes"
                  value={paymentModeFilter}
                  options={filterOptions.paymentModes}
                  onChange={setPaymentModeFilter}
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
                    placeholder="Search by SRF..."
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
              className="whitespace-nowrap table-hover"
              records={paginatedRecords}
              columns={[
                { accessor: 'paymentId', title: 'Payment ID', sortable: true },
                { accessor: 'srfClient', title: 'SRF No.', sortable: true },

                { accessor: 'totalAmount', title: 'Total Amount', sortable: true },
                { accessor: 'paymentAmount', title: 'Payment Amount', sortable: true },
                { accessor: 'paymentType', title: 'Payment Type', sortable: true },
                { accessor: 'utrNumber', title: 'UTR Number', sortable: false },
                { accessor: 'paymentMode', title: 'Payment Mode', sortable: true },
                { accessor: 'branchName', title: 'Branch Name', sortable: true },
                {
                  accessor: 'createdAt',
                  title: 'Created At',
                  sortable: true,
                  render: (row: any) => formatCreatedAtDisplay(row.createdAt),
                },
                {
                  accessor: 'Payment Screenshot',
                  title: 'Payment Screenshot',
                  render: (row: any) => (
                    <button
                      onClick={() => {
                        setSelectedRow(row);
                        setOpenModal(true);
                      }}
                      className="flex hover:text-primary"
                    >
                      <InformationCircleIcon className="w-5 h-5 cursor-pointer" />
                    </button>
                  ),
                },
                {
                  accessor: 'action',
                  title: 'Actions',
                  render: ({ id }) => (
                    <div className="flex gap-4 items-center w-max mx-auto">
                      <NavLink to={`/admin/payments/view/${id}`} className="flex hover:text-primary">
                        <IconEye />
                      </NavLink>
                      <NavLink to={`/admin/payments/edit/${id}`} className="flex hover:text-info">
                        <IconEdit />
                      </NavLink>
                      <button
                        type="button"
                        className="flex hover:text-danger"
                        onClick={() => handleDeleteClick(id)}
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
        </div>
      </div>

      <FadeInModal open={openModal} onClose={() => setOpenModal(false)} title="Payment Screenshot">
        <div className="space-y-4">
          {selectedRow?.screenshotUrl ? (
            <div className="flex justify-center">
              <div className="max-h-[400px] max-w-xs overflow-y-auto border rounded">
                <img src={selectedRow.screenshotUrl} alt="Payment Screenshot" className="w-full object-contain" />
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">No screenshot available</p>
          )}
        </div>
      </FadeInModal>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to delete this payment?"
      />
    </>
  );
};

export default Payments;