import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconPlus from '../../../components/Icon/IconPlus';
import IconFile from '../../../components/Icon/IconFile';
import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb';
import IconHome from '../../../components/Icon/IconHome';
import IconCreditCard from '../../../components/Icon/IconCreditCard';
import { getAllInvoices, deleteInvoice } from '../../../api';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { showMessage } from '../../../components/common/ShowMessage';

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
}

const Invoices: React.FC = () => {
  const dispatch = useDispatch();
  const [items, setItems] = useState<Invoice[]>([]);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZES = [10, 20, 30, 50];
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState<Invoice[]>([]);
  const [records, setRecords] = useState<Invoice[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Invoice[]>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'invoiceId',
    direction: 'asc',
  });

  // 👇 for confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(setPageTitle('Invoices'));
  }, [dispatch]);

  // Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await getAllInvoices();
        const data: Invoice[] = res.data.data.map((item: Invoice) => ({
          ...item,
          status: item.payment?.paymentStatus === 'paid' ? 'Paid' : 'Pending',
        }));
        setItems(data);
        setInitialRecords(sortBy(data, 'invoiceId'));
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
      }
    };
    fetchInvoices();
  }, []);

  // Pagination
  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecords([...initialRecords.slice(from, to)]);
  }, [page, pageSize, initialRecords]);

  // Search
  useEffect(() => {
    setInitialRecords(() =>
      items.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(search.toLowerCase())
        )
      )
    );
  }, [search, items]);

  // Sorting
  useEffect(() => {
    const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
    setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
    setPage(1);
  }, [sortStatus]);

  // 👇 Handle delete
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
      setInitialRecords(updated);
      setRecords(updated);
      showMessage('Invoice deleted successfully', 'success'); // ✅ Success message
    } catch (err: any) {
      console.error('Failed to delete invoice:', err);
      showMessage(
        err?.response?.data?.message || 'Failed to delete invoice',
        'error'
      ); // ❌ Error message
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
              className="whitespace-nowrap table-hover"
              records={records}
              columns={[
                { accessor: 'invoiceId', title: 'Invoice ID', sortable: true },
                { accessor: 'srfNumber', title: 'SRF No', sortable: true },
                { accessor: 'buyerName', title: 'Customer Name', sortable: true },
                { accessor: 'address', title: 'Address', sortable: true },
                { accessor: 'state', title: 'State', sortable: true },
                { accessor: 'grandtotal', title: 'Total Amount', sortable: true },
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
              totalRecords={initialRecords.length}
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

      {/* ✅ Delete Confirmation Modal */}
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
