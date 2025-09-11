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
import { getAllInvoices } from '../../../api';
import Cookies from 'js-cookie';

// Define types for invoice and payment
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

  useEffect(() => {
    dispatch(setPageTitle('Invoices'));
  }, [dispatch]);

  // Fetch invoices from API
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

  // Search filter
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

  const deleteRow = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const updated = items.filter((p) => p._id !== id);
      setItems(updated);
      setInitialRecords(updated);
      setRecords(updated);
      setSelectedRecords([]);
      setSearch('');
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
                // { accessor: 'gstin', title: 'GSTIN', sortable: true },
                { accessor: 'grandtotal', title: 'Total Amount', sortable: true },
                // {
                //   accessor: 'status',
                //   title: 'Status',
                //   sortable: true,
                //   render: (row: Invoice) => (
                //     <span
                //       className={`w-24 inline-block text-center px-3 py-1 rounded-full text-xs font-semibold ${
                //         row.status === 'Paid'
                //           ? 'bg-green-100 text-green-700'
                //           : 'bg-red-100 text-red-700'
                //       }`}
                //     >
                //       {row.status}
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
                        onClick={() => deleteRow(_id)}
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
    </>
  );
};

export default Invoices;
