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

const Payments = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle('Payments'));
  }, []);

  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

  // ✅ Fetch all payments initially
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await getAllPayments();
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
        }));
        setItems(backendPayments);
      } catch (err) {
        console.error('❌ Failed to fetch payments:', err);
      }
    };
    fetchPayments();
  }, []);

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
  }, [search, pageSize, dateFrom, dateTo]);

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
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

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', to: '/', icon: <IconHome /> },
    { label: 'Payments', icon: <IconCreditCard /> },
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />

      <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
        <div className="invoice-table">
          <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
            <div className="flex items-center gap-2">
              <Link to="/admin/payments/add" className="btn btn-primary gap-2">
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
                placeholder="Search by SRF..."
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