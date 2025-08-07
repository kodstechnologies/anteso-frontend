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
import IconBox from '../../../components/Icon/IconBox';
import { getAllCourier } from '../../../api/index'; // ✅ import your API function

const CourierCompanies = () => {
    const dispatch = useDispatch();

    const [items, setItems] = useState<any[]>([]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'courierCompanyName',
        direction: 'asc',
    });

    useEffect(() => {
        dispatch(setPageTitle('Courier Companies'));
    }, []);

    //  Fetch data from API on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getAllCourier();
                const courierData = response?.data || [];
                setItems(courierData);
                setInitialRecords(sortBy(courierData, 'courierCompanyName'));
            } catch (err) {
                console.error(" Failed to fetch couriers:", err);
            }
        };
        fetchData();
    }, []);

    const deleteRow = (id: any = null) => {
        if (window.confirm('Are you sure want to delete selected row?')) {
            const filtered = id
                ? items.filter((item) => item._id !== id)
                : items.filter((item) => !selectedRecords.map((r) => r._id).includes(item._id));

            setItems(filtered);
            setInitialRecords(filtered);
            setSearch('');
            setSelectedRecords([]);
            setPage(1);
        }
    };

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const filtered = items.filter((item) =>
            item.courierCompanyName.toLowerCase().includes(search.toLowerCase()) ||
            item.status.toLowerCase().includes(search.toLowerCase())
        );
        setInitialRecords(filtered);
    }, [search, items]);

    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Courier Companies', icon: <IconBox /> },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/courier-companies/add" className="btn btn-primary gap-2">
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
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records}
                            columns={[
                                {
                                    accessor: 'courierCompanyName',
                                    title: 'Company Name',
                                    sortable: true,
                                },
                                {
                                    accessor: 'status',
                                    sortable: true,
                                    render: ({ status }) => (
                                        <span className={`text-${status === 'Active' ? 'success' : 'danger'}`}>
                                            {status}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: ({ _id }) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink to={`/admin/courier-companies/view/${_id}`} className="flex hover:text-primary">
                                                <IconEye />
                                            </NavLink>
                                            <NavLink to={`/admin/courier-companies/edit/${_id}`} className="flex hover:text-info">
                                                <IconEdit className="w-4.5 h-4.5" />
                                            </NavLink>
                                            <button type="button" className="flex hover:text-danger" onClick={() => deleteRow(_id)}>
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

export default CourierCompanies;
