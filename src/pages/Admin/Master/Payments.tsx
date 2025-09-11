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
import FadeInModal from '../../../components/common/FadeInModal';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { showMessage } from '../../../components/common/ShowMessage'; // optional toast

import { deletePaymentById, getAllPayments, searchBySRFNumber } from '../../../api';
import ConfirmModal from '../../../components/common/ConfirmModal';

const Payments = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setPageTitle('Payments'));
  }, []);

  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<any>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'paymentId',
    direction: 'asc',
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
        const backendPayments = res.data.payments.map((p: any) => ({
          id: p._id,
          paymentId: p.paymentId || p._id.slice(-6).toUpperCase(),
          srfClient: p.orderId?.srfNumber || 'N/A',
          totalAmount: p.totalAmount || 0,
          paymentAmount: p.paymentAmount || 0,
          paymentType: p.paymentType,
          utrNumber: p.utrNumber || 'N/A',
          screenshotUrl: p.screenshot || null,
        }));
        setItems(backendPayments);
        setInitialRecords(sortBy(backendPayments, 'paymentId'));
      } catch (err) {
        console.error('❌ Failed to fetch payments:', err);
      }
    };
    fetchPayments();
  }, []);

  // ✅ Update records based on page & pageSize
  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecords([...initialRecords.slice(from, to)]);
  }, [page, pageSize, initialRecords]);

  // ✅ Search by SRF dynamically
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchBySRF = async () => {
        if (!search) {
          setInitialRecords(sortBy(items, 'paymentId'));
          return;
        }

        try {
          const res = await searchBySRFNumber(search.trim());
          const paymentsArray = res?.data?.payments || [];

          const srPayments = paymentsArray.map((p: any) => ({
            id: p.orderId + '-' + p.paymentId,
            paymentId: p.paymentId,
            srfClient: res.data.srfNumber,
            totalAmount: p.totalAmount,
            paymentAmount: p.paymentAmount,
            paymentType: p.paymentType,
            utrNumber: p.utrNumber,
            screenshotUrl: p.screenshot,
          }));

          setInitialRecords(sortBy(srPayments, 'paymentId'));
        } catch (err) {
          console.error('❌ Error searching by SRF:', err);
          setInitialRecords([]);
        }
      };

      fetchBySRF();
    }, 500); // wait 500ms after last keystroke

    return () => clearTimeout(timer);
  }, [search, items]);

  // ✅ Sort records
  useEffect(() => {
    const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
    setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
    setPage(1);
  }, [sortStatus, initialRecords]);



  // const deleteRow = async (id: string) => {
  //   if (window.confirm('Are you sure you want to delete this payment?')) {
  //     try {
  //       await deletePaymentById(id); // ✅ call backend to delete
  //       const updated = items.filter((p) => p.id !== id); // update state
  //       setItems(updated);
  //       setInitialRecords(updated);
  //       setRecords(updated);
  //       setSelectedRecords([]);
  //       setSearch('');
  //       showMessage('Payment deleted successfully', 'success'); // optional
  //     } catch (error: any) {
  //       console.error('Failed to delete payment:', error);
  //       showMessage(error.message || 'Failed to delete payment', 'error');
  //     }
  //   }
  // };

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
      setInitialRecords(updated);
      setRecords(updated);
      setSelectedRecords([]);
      setSearch('');
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
            <div className="ltr:ml-auto rtl:mr-auto">
              <input
                type="text"
                className="form-input w-auto"
                placeholder="Search by SRF..."
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
                { accessor: 'paymentId', title: 'Payment ID', sortable: true },
                { accessor: 'srfClient', title: 'SRF + Client', sortable: true },
                { accessor: 'totalAmount', title: 'Total Amount', sortable: true },
                { accessor: 'paymentAmount', title: 'Payment Amount', sortable: true },
                { accessor: 'paymentType', title: 'Payment Type', sortable: true },
                { accessor: 'utrNumber', title: 'UTR Number', sortable: false },
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
