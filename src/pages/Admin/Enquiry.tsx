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

const Enquiry = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Enquiry'));
    }, [dispatch]);

    const [items, setItems] = useState(
        enquiriesData.map((item, index) => ({
            ...item,
            enquiryID: `ENQ${String(index + 1).padStart(3, '0')}`, // Generates C001, C002, etc.
        }))
    );
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState(sortBy(items, 'Hospitalname'));
    const [records, setRecords] = useState(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState<any>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'Hospitalname',
        direction: 'asc',
    });
    const [copied, setCopied] = useState(false);

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
        if (window.confirm('Are you sure want to delete selected row?')) {
            if (id) {
                const filteredItems = items.filter((item) => item.id !== id);
                setItems(filteredItems);
                setInitialRecords(filteredItems);
                setRecords(filteredItems.slice(0, pageSize));
                setSearch('');
                setSelectedRecords([]);
            } else {
                const ids = selectedRecords.map((d: any) => d.id);
                const filteredItems = items.filter((d) => !ids.includes(d.id));
                setItems(filteredItems);
                setInitialRecords(filteredItems);
                setRecords(filteredItems.slice(0, pageSize));
                setSearch('');
                setSelectedRecords([]);
                setPage(1);
            }
        }
    };

    // Function to update status
    const updateQuotation = (id: number, newStatus: 'create' | 'created' | 'approved') => {
        const updatedItems = items.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
        setItems(updatedItems);
        setInitialRecords(sortBy(updatedItems, sortStatus.columnAccessor));
        navigate('/admin/quotation/add');
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
                                {
                                    accessor: 'state',
                                    sortable: true,
                                },
                                {
                                    accessor: 'pincode',
                                    sortable: true,
                                },
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
                                        if (quotation === 'approved') {
                                            return <span className="text-success font-semibold">Approved</span>;
                                        }
                                        if (quotation === 'created') {
                                            return (
                                                <button className="btn btn-primary btn-sm opacity-50 cursor-not-allowed" disabled>
                                                    Created
                                                </button>
                                            );
                                        }
                                        return (
                                            <button className="btn btn-primary btn-sm" onClick={() => updateQuotation(id, 'created')}>
                                                Create
                                            </button>
                                        );
                                    },
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: ({ id }) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink to="/admin/quotation/view" className="flex hover:text-primary">
                                                <IconFile/>
                                            </NavLink>
                                            <NavLink to="/admin/enquiry/view" className="flex hover:text-primary">
                                                <IconEye />
                                            </NavLink>
                                            <NavLink to="/admin/enquiry/edit" className="flex hover:text-info">
                                                <IconEdit className="w-4.5 h-4.5" />
                                            </NavLink>
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
            </div>
        </>
    );
};

export default Enquiry;
