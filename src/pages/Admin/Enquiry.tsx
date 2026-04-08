import { Link, NavLink, useNavigate } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPlus from '../../components/Icon/IconPlus';
import IconEdit from '../../components/Icon/IconEdit';
import IconEye from '../../components/Icon/IconEye';
import IconCopy from '../../components/Icon/IconCopy';
import IconRefresh from '../../components/Icon/IconRefresh';
import { enquiriesData } from '../../data';
import IconFile from '../../components/Icon/IconFile';
import Breadcrumb, { BreadcrumbItem } from '../../components/common/Breadcrumb';
import IconHome from '../../components/Icon/IconHome';
import IconBox from '../../components/Icon/IconBox';
import { deleteEnquiryById, getAllEnquiry } from '../../api';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatCreatedAtDisplay, isInDateRange } from '../../utils/tableDateFilter';

const Enquiry = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Enquiry'));
    }, [dispatch]);

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [filteredRecords, setFilteredRecords] = useState<any[]>([]); // Renamed from initialRecords
    const [records, setRecords] = useState<any[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<any>([]);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [rowToDelete, setRowToDelete] = useState<number | null>(null);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'enquiryID', // Changed to a more appropriate default
        direction: 'asc',
    });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await getAllEnquiry();
                console.log("🚀 ~ fetchData ~ response:", response)
               
                const enriched = response.data.map((item: any, index: number) => ({
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
                    contactperson: item.contactPerson,
                    email: item.emailAddress,
                    phone: item.contactNumber,
                    designation: item.designation,
                    quotation: item.quotationStatus?.toLowerCase(),
                    remark: item.quotation?.[0]?.rejectionRemark || null,
                }));

                setItems(enriched);
                setLoading(false);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
    
    const clearFilters = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setPage(1); // Reset to first page when clearing filters
    };
    
    const deleteRow = (id: number | null = null) => {
        setRowToDelete(id);
        setShowConfirmModal(true);
    };
    
    const handleConfirmDelete = async () => {
        try {
            if (rowToDelete !== null) {
                await deleteEnquiryById(rowToDelete);
                const filtered = items.filter((item) => item._id !== rowToDelete);
                setItems(filtered);
            } else {
                const ids = selectedRecords.map((d: any) => d._id);
                await Promise.all(ids.map((id: string) => deleteEnquiryById(id)));
                const filtered = items.filter((d) => !ids.includes(d._id));
                setItems(filtered);
                setPage(1);
            }

            setSearch('');
            setSelectedRecords([]);
        } catch (error) {
            console.error('Failed to delete enquiry:', error);
            alert('Failed to delete enquiry. Please try again.');
        } finally {
            setShowConfirmModal(false);
            setRowToDelete(null);
        }
    };

    const updateQuotation = (id: number, newStatus: 'create' | 'created' | 'approved' | 'rejected') => {
        const updatedItems = items.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
        setItems(updatedItems);
        navigate(`/admin/quotation/add/${id}`);
    };

    // Apply filters and sorting to get filtered records
    useEffect(() => {
        let filtered = [...items];
        
        // Apply search filter
        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter((item) => {
                return (
                    (item.enquiryID && String(item.enquiryID).toLowerCase().includes(q)) ||
                    (item.hName && String(item.hName).toLowerCase().includes(q)) ||
                    (item.fullAddress && String(item.fullAddress).toLowerCase().includes(q)) ||
                    (item.city && String(item.city).toLowerCase().includes(q)) ||
                    (item.state && String(item.state).toLowerCase().includes(q)) ||
                    (item.pincode && String(item.pincode).toLowerCase().includes(q)) ||
                    (item.contactperson && String(item.contactperson).toLowerCase().includes(q)) ||
                    (item.email && String(item.email).toLowerCase().includes(q)) ||
                    (item.phone && String(item.phone).toLowerCase().includes(q)) ||
                    (item.designation && String(item.designation).toLowerCase().includes(q)) ||
                    (item.quotation && String(item.quotation).toLowerCase().includes(q))
                );
            });
        }
        
        // Apply date filter
        if (dateFrom || dateTo) {
            filtered = filtered.filter((item) => isInDateRange(item.createdAt, dateFrom, dateTo));
        }
        
        // Apply sorting
        filtered = sortBy(filtered, sortStatus.columnAccessor);
        if (sortStatus.direction === 'desc') {
            filtered = filtered.reverse();
        }
        
        setFilteredRecords(filtered);
        setPage(1); // Reset to first page when filters change
    }, [items, search, dateFrom, dateTo, sortStatus]);

    // Update paginated records when filtered records, page, or pageSize changes
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(filteredRecords.slice(from, to));
    }, [filteredRecords, page, pageSize]);

    // Reset to page 1 when page size changes
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Enquiry', icon: <IconBox /> },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />
            {loading && <p className="text-center my-4">Loading enquiries...</p>}
            {error && <p className="text-center text-red-500 my-4">{error}</p>}

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/enquiry/add" className="btn btn-primary gap-2">
                                <IconPlus />
                                Add New
                            </Link>
                            <button onClick={handleCopy} className="btn btn-primary gap-2">
                                <IconCopy />
                                {copied ? ' Copied! ' : 'Copy Link'}
                            </button>
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
                                placeholder="Search..." 
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
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records}
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
                                    sortable: true 
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
                                    sortable: true 
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
                                        const hideFile = !quotation || quotation === 'create' || quotation === 'N/A';

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
                                    accessor: 'rejectionRemark',
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
                                }
                            ]}
                            highlightOnHover
                            totalRecords={filteredRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={(p) => setPage(p)}
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