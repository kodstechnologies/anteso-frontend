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
}

const Invoices: React.FC = () => {
  const dispatch = useDispatch();
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

  // Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await getAllInvoices();
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
        console.log(`Loaded ${formattedData.length} invoices`);
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
        showMessage('Failed to fetch invoices', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Filter records based on search and date range
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
  }, [search, pageSize, dateFrom, dateTo]);

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
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

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', to: '/', icon: <IconHome /> },
    { label: 'Invoices', icon: <IconCreditCard /> },
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />

      <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
        <div className="invoice-table">
          <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
            <div className="flex items-center gap-2">
              <Link to="/admin/invoice/add" className="btn btn-primary gap-2">
                <IconPlus />
                Add New
              </Link>
            </div>
            <div className="ltr:ml-auto rtl:mr-auto flex flex-wrap items-center gap-3 justify-end">
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="text-gray-600 dark:text-gray-400">From</span>
                <input
                  type="date"
                  className="form-input w-auto"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="text-gray-600 dark:text-gray-400">To</span>
                <input
                  type="date"
                  className="form-input w-auto"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </label>
              <input
                type="text"
                className="form-input w-auto min-w-[200px]"
                placeholder="Search by SRF, name, or invoice ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {(search || dateFrom || dateTo) && (
                <button
                  onClick={clearFilters}
                  className="btn btn-outline-danger gap-2"
                  title="Clear all filters"
                >
                  <IconRefresh />
                  Clear
                </button>
              )}
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