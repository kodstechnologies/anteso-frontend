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
import IconCreditCard from '../../../components/Icon/IconCreditCard';
import { invoicedata } from '../../../data';
import IconFile from '../../../components/Icon/IconFile';

const Invoices = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle('Invoices'));
  }, []);

  const [items, setItems] = useState(invoicedata);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState(sortBy(items, 'invoiceId'));
  const [records, setRecords] = useState(initialRecords);
  const [selectedRecords, setSelectedRecords] = useState<any>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'invoiceId',
    direction: 'asc',
  });

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecords([...initialRecords.slice(from, to)]);
  }, [page, pageSize, initialRecords]);

  useEffect(() => {
    setInitialRecords(() =>
      items.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(search.toLowerCase())
        )
      )
    );
  }, [search, items]);

  useEffect(() => {
    const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
    setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
    setPage(1);
  }, [sortStatus]);

  const deleteRow = (id: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const updated = items.filter((p: any) => p.id !== id);
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
                {
                  accessor: 'invoiceId',
                  title: 'Invoice ID',
                  sortable: true,
                },
                {
                  accessor: 'srfno',
                  title: 'SRF No',
                  sortable: true,
                },
                {
                  accessor: 'buyerName',
                  title: 'Customer Name',
                  sortable: true,
                },
                {
                  accessor: 'address',
                  title: 'Address',
                  sortable: true,
                },
                {
                  accessor: 'state',
                  title: 'State',
                  sortable: true,
                },
                {
                  accessor: 'gstin',
                  title: 'GSTIN',
                  sortable: true,
                },
                // {
                //   accessor: 'machineType',
                //   title: 'Machine Type',
                //   sortable: true,
                // },
                // {
                //   accessor: 'quantity',
                //   title: 'Quantity',
                //   sortable: true,
                // },
                // {
                //   accessor: 'rate',
                //   title: 'Rate',
                //   sortable: true,
                // },
                {
                  accessor: 'totalAmount',
                  title: 'Total Amount',
                  sortable: true,
                },
                {
                  accessor: 'status',
                  title: 'Status',
                  sortable: true,
                  render: (row: any) => (
                    <span
                      className={`w-24 inline-block text-center px-3 py-1 rounded-full text-xs font-semibold
      ${row.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {row.status}
                    </span>
                  )

                },
                {
                  accessor: 'action',
                  title: 'Actions',
                  render: ({ id }) => (
                    <div className="flex gap-4 items-center w-max mx-auto">
                      <NavLink to="/admin/invoice/viewInvoice" className="flex hover:text-primary">
                        <IconFile />
                      </NavLink>
                      {/* <NavLink to={`/admin/invoice/view/${id}`} className="flex hover:text-primary">
                        <IconEye />
                      </NavLink> */}
                      {/* <NavLink to={`/admin/invoice/edit/${id}`} className="flex hover:text-info">
                        <IconEdit />
                      </NavLink> */}
                      <button type="button" className="flex hover:text-danger" onClick={() => deleteRow(id)}>
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
              paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Invoices;
