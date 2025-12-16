import { useEffect, useState } from 'react';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { Link, NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import sortBy from 'lodash/sortBy';
import IconHome from '../../../components/Icon/IconHome';
import IconBox from '../../../components/Icon/IconBox';
import IconEye from '../../../components/Icon/IconEye';
import IconFile from '../../../components/Icon/IconFile';
import IconPlus from '../../../components/Icon/IconPlus';
import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb';
import { getAllStaffEnquiries, deleteEnquiryById } from '../../../api';
import ConfirmModal from '../../../components/common/ConfirmModal';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconCopy from '../../Icon/IconCopy';

const StaffEnquiries = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle('My Enquiries'));
  }, [dispatch]);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [initialRecords, setInitialRecords] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'enquiryId',
    direction: 'asc',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [copied, setCopied] = useState(false);

  // 🧠 Fetch staff enquiries
  useEffect(() => {
    const fetchStaffEnquiries = async () => {
      try {
        setLoading(true);
        const response = await getAllStaffEnquiries();
        const data = response?.data || [];

        const formatted = data.map((item: any) => ({
          id: item._id,
          enquiryID: item.enquiryId,
          hospitalName: item.hospital?.name || 'N/A',
          address: item.hospital?.address || 'N/A',
          branch: item.hospital?.branch || 'N/A',
          contactPerson: item.contactPerson || 'N/A',
          email: item.emailAddress || 'N/A',
          phone: item.contactNumber || 'N/A',
          quotationStatus: item.quotationStatus?.toLowerCase() || 'N/A',
          remark: item.quotation?.[0]?.rejectionRemark || '',
        }));

        setItems(formatted);
        setInitialRecords(formatted);
        setRecords(formatted.slice(0, pageSize));
      } catch (err: any) {
        console.error('❌ Error fetching staff enquiries:', err);
        let message = 'Failed to load enquiries. Please try again later.';

        if (err.response) {
          if (err.response.status === 404) {
            message = ''; // don’t show text, table will show empty
          } else if (err.response.data?.message) {
            message = err.response.data.message;
          }
        } else if (err.message) {
          message = err.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffEnquiries();
  }, []);

  // 🔍 Search
  useEffect(() => {
    const filtered = items.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
    setInitialRecords(filtered);
  }, [search, items]);

  // 📄 Pagination
  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecords(initialRecords.slice(from, to));
  }, [page, pageSize, initialRecords]);

  // 🔄 Sorting
  useEffect(() => {
    const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
    setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
  }, [sortStatus, initialRecords]);

  // 🗑️ Delete logic
  const handleDelete = (id: string) => {
    setRowToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (rowToDelete) {
        await deleteEnquiryById(rowToDelete);
        const updated = items.filter((item) => item.id !== rowToDelete);
        setItems(updated);
        setInitialRecords(updated);
        setRecords(updated.slice(0, pageSize));
      }
    } catch (err) {
      console.error('❌ Failed to delete enquiry:', err);
      alert('Failed to delete enquiry');
    } finally {
      setShowConfirmModal(false);
      setRowToDelete(null);
    }
  };

  // ✳️ Update quotation status
  const updateQuotation = (id: string, newStatus: 'create' | 'created' | 'accepted' | 'rejected') => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, quotationStatus: newStatus } : item
    );
    setItems(updated);
    setInitialRecords(updated);
    setRecords(updated.slice(0, pageSize));

    // Navigate to quotation creation page
    if (newStatus === 'created') {
      window.location.href = `/staff/quotation/add/${id}`;
    }
  };
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
  // 🧭 Breadcrumb
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', to: '/', icon: <IconHome /> },
    { label: 'My Enquiries', icon: <IconBox /> },
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />

      {loading && <p className="text-center my-4">Loading enquiries...</p>}

      {!loading && (
        <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
          <div className="invoice-table">
            <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
              <div className="flex items-center gap-2">
                <Link to="/staff/enquiry/add" className="btn btn-primary gap-2">
                  <IconPlus /> Add New
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="btn btn-primary gap-2">
                  <IconCopy />
                  {copied ? ' Copied! ' : 'Copy Link'}
                </button>
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
                  { accessor: 'enquiryID', title: 'Enquiry ID', sortable: true },
                  { accessor: 'hospitalName', title: 'Hospital Name', sortable: true },
                  { accessor: 'address', title: 'Address', sortable: true },
                  { accessor: 'branch', title: 'Branch', sortable: true },
                  { accessor: 'contactPerson', title: 'Contact Person', sortable: true },
                  { accessor: 'email', title: 'Email', sortable: true },
                  { accessor: 'phone', title: 'Phone', sortable: true },
                  {
                    accessor: 'quotationStatus',
                    title: 'Quotation',
                    sortable: true,
                    render: ({ id, quotationStatus }) => {
                      if (quotationStatus === 'accepted')
                        return <span className="text-success font-semibold">Accepted</span>;
                      if (quotationStatus === 'rejected')
                        return <span className="text-danger font-semibold">Rejected</span>;
                      if (quotationStatus === 'created')
                        return (
                          <button
                            className="btn btn-primary btn-sm opacity-50 cursor-not-allowed"
                            disabled
                          >
                            Created
                          </button>
                        );
                      if (quotationStatus === 'create')
                        return (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => updateQuotation(id, 'created')}
                          >
                            Create
                          </button>
                        );
                      return <span className="text-gray-400 italic">N/A</span>;
                    },
                  },
                  {
                    accessor: 'remark',
                    title: 'Remark',
                    sortable: false,
                    render: ({ remark, quotationStatus }) =>
                      quotationStatus === 'rejected' ? (
                        <span className="text-danger">{remark || 'No remark'}</span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      ),
                  },
                  {
                    accessor: 'action',
                    title: 'Actions',
                    sortable: false,
                    textAlignment: 'center',
                    render: ({ id, quotationStatus }) => {
                      const hideFile =
                        !quotationStatus ||
                        quotationStatus === 'create' ||
                        quotationStatus === 'N/A';

                      return (
                        <div className="flex gap-4 items-center w-max mx-auto">
                          {!hideFile && (
                            <NavLink
                              to={`/admin/quotation/view/${id}`}
                              className="flex hover:text-primary"
                            >
                              <IconFile />
                            </NavLink>
                          )}

                          <NavLink
                            to={`/admin/enquiry/view/${id}`}
                            className="flex hover:text-primary"
                          >
                            <IconEye />
                          </NavLink>

                          <button
                            type="button"
                            className="flex hover:text-danger"
                            onClick={() => handleDelete(id)}
                          >
                            <IconTrashLines />
                          </button>
                        </div>
                      );
                    },
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
                paginationText={({ from, to, totalRecords }) =>
                  `Showing ${from} to ${to} of ${totalRecords} entries`
                }
                noRecordsText="No enquiries available"
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Delete Confirmation"
        message="Are you sure you want to delete this enquiry?"
      />
    </>
  );
};

export default StaffEnquiries;
