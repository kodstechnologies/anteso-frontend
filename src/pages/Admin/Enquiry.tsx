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
import { enquiriesData } from '../../data';
import IconFile from '../../components/Icon/IconFile';
import Breadcrumb, { BreadcrumbItem } from '../../components/common/Breadcrumb';
import IconHome from '../../components/Icon/IconHome';
import IconBox from '../../components/Icon/IconBox';
import { deleteEnquiryById, getAllEnquiry } from '../../api';
import ConfirmModal from '../../components/common/ConfirmModal';

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
    const [initialRecords, setInitialRecords] = useState(sortBy(items, 'Hospitalname'));
    const [records, setRecords] = useState(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState<any>([]);
    const [search, setSearch] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [rowToDelete, setRowToDelete] = useState<number | null>(null);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'Hospitalname',
        direction: 'asc',
    });
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getAllEnquiry();
                console.log("🚀 ~ fetchData ~ response:", response.data)

                // You may need to map/enrich data depending on your backend format
                const enriched = response.data.map((item: any, index: number) => ({
                    ...item,
                    enquiryID: item.enquiryId,
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
                    quotation: item.quotationStatus?.toLowerCase(), // fallback
                    id: item._id,
                }));
                console.log("🚀 ~ fetchData ~ enriched:", enriched)
                console.log("🚀 ~ fetchData ~ enriched.quotation:", enriched.data)

                setItems(enriched);
                setInitialRecords(sortBy(enriched, 'hName'));
                setRecords(sortBy(enriched, 'hName').slice(0, pageSize));
                setLoading(false);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    // useEffect

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
    const deleteRow = (id: number | null = null) => {
        setRowToDelete(id); // Store row or null (for bulk)
        setShowConfirmModal(true); // Open confirm modal
    };

    const handleConfirmDelete = async () => {
        try {
            if (rowToDelete !== null) {
                await deleteEnquiryById(rowToDelete);
                const filtered = items.filter((item) => item.id !== rowToDelete);
                setItems(filtered);
                setInitialRecords(filtered);
                setRecords(filtered.slice(0, pageSize));
            } else {
                const ids = selectedRecords.map((d: any) => d.id);
                await Promise.all(ids.map((id: number) => deleteEnquiryById(id)));
                const filtered = items.filter((d) => !ids.includes(d.id));
                setItems(filtered);
                setInitialRecords(filtered);
                setRecords(filtered.slice(0, pageSize));
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



    // Function to update status
    const updateQuotation = (id: number, newStatus: 'create' | 'created' | 'approved' | 'rejected') => {
        const updatedItems = items.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
        setItems(updatedItems);
        setInitialRecords(sortBy(updatedItems, sortStatus.columnAccessor));
        navigate(`/admin/quotation/add/${id}`)
    };

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(() => {
            return items.filter((item) => {
                return (
                    item.enquiryID.toLowerCase().includes(search.toLowerCase()) ||
                    item.hName.toLowerCase().includes(search.toLowerCase()) ||
                    item.fullAddress.toLowerCase().includes(search.toLowerCase()) ||
                    item.city.toLowerCase().includes(search.toLowerCase()) ||
                    item.state.toLowerCase().includes(search.toLowerCase()) ||
                    item.pincode.toLowerCase().includes(search.toLowerCase()) ||
                    item.contactperson.toLowerCase().includes(search.toLowerCase()) ||
                    item.email.toLowerCase().includes(search.toLowerCase()) ||
                    item.phone.toLowerCase().includes(search.toLowerCase()) ||
                    item.designation.toLowerCase().includes(search.toLowerCase()) ||
                    item.quotation.toLowerCase().includes(search.toLowerCase())
                );
            });
        });
    }, [search]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
    }, [sortStatus, initialRecords]);

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
                        <div className="ltr:ml-auto rtl:mr-auto">
                            <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                                    sortable: true,
                                },
                                { accessor: 'district', title: 'District', sortable: true },

                                {
                                    accessor: 'state',
                                    sortable: true,
                                },
                                {
                                    accessor: 'pincode',
                                    sortable: true,
                                },
                                { accessor: 'branch', title: 'Branch Name', sortable: true },

                                {
                                    accessor: 'contactperson',
                                    title: 'Contact Person',
                                    sortable: true,
                                },
                                {
                                    accessor: 'email',
                                    sortable: true,
                                },
                                {
                                    accessor: 'phone',
                                    sortable: true,
                                },
                                {
                                    accessor: 'designation',
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
                                        return <span className="text-gray-500 italic">N/A</span>; // default case
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
                                                <NavLink to="/admin/enquiry/edit" className="flex hover:text-info">
                                                    <IconEdit className="w-4.5 h-4.5" />
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
                            totalRecords={initialRecords.length}
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
