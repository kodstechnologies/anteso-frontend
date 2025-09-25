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

import { getAllDealers } from '../../../api'; // ✅ your api function

const Dealers = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Dealers'));
    }, []);

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ✅ Fetch dealers from API
    useEffect(() => {
        const fetchDealers = async () => {
            try {
                const res = await getAllDealers();
                // assuming your API response is { data: [...] }
                const dealersData = res?.data?.dealers || [];

                // Generate dealersID like DEL001, DEL002, ...
                const mappedDealers = dealersData.map((item: any, index: number) => ({
                    ...item,
                    dealersID: `DEL${String(index + 1).padStart(3, '0')}`,
                }));

                setItems(mappedDealers);
                setInitialRecords(sortBy(mappedDealers, 'dealersName'));
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch dealers:", error);
                setLoading(false);
            }
        };

        fetchDealers();
    }, []);

    const deleteRow = (id: any = null) => {
        if (window.confirm('Are you sure want to delete selected row ?')) {
            if (id) {
                setRecords(items.filter((user) => user._id !== id));
                setInitialRecords(items.filter((user) => user._id !== id));
                setItems(items.filter((user) => user._id !== id));
                setSearch('');
                setSelectedRecords([]);
            } else {
                let selectedRows = selectedRecords || [];
                const ids = selectedRows.map((d: any) => d._id);
                const result = items.filter((d) => !ids.includes(d._id));
                setRecords(result);
                setInitialRecords(result);
                setItems(result);
                setSearch('');
                setSelectedRecords([]);
                setPage(1);
            }
        }
    };

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<any>([]);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'dealersName',
        direction: 'asc',
    });

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
                    item.dealersID.toLowerCase().includes(search.toLowerCase()) ||
                    item.dealersName.toLowerCase().includes(search.toLowerCase()) ||
                    item.address.toLowerCase().includes(search.toLowerCase()) ||
                    item.contactPersonName.toLowerCase().includes(search.toLowerCase()) ||
                    item.pinCode.toLowerCase().includes(search.toLowerCase()) ||
                    item.region.toLowerCase().includes(search.toLowerCase())
                );
            });
        });
    }, [search, items]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Dealers', icon: <IconBox /> },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/dealer/add" className="btn btn-primary gap-2">
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
                        {loading ? (
                            <p className="text-center p-4">Loading dealers...</p>
                        ) : (
                            <DataTable
                                className="whitespace-nowrap table-hover invoice-table"
                                records={records}
                                columns={[
                                    { accessor: 'dealersID', title: 'DEL ID', sortable: true },
                                    { accessor: 'name', title: 'Dealer Name', sortable: true },
                                    { accessor: 'address', sortable: true },
                                    // { accessor: 'contactPersonName', title: 'Contact Person', sortable: true },
                                    { accessor: 'pincode', sortable: true },
                                    { accessor: 'branch', sortable: true },
                                    {
                                        accessor: 'action',
                                        title: 'Actions',
                                        sortable: false,
                                        textAlignment: 'center',
                                        render: ({ _id }) => (
                                            <div className="flex gap-4 items-center w-max mx-auto">
                                                <NavLink to={`/admin/dealer/view/${_id}`} className="flex hover:text-primary">
                                                    <IconEye />
                                                </NavLink>
                                                <NavLink to={`/admin/dealer/edit/${_id}`} className="flex hover:text-info">
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
                                onPageChange={setPage}
                                recordsPerPageOptions={PAGE_SIZES}
                                onRecordsPerPageChange={setPageSize}
                                sortStatus={sortStatus}
                                onSortStatusChange={setSortStatus}
                                selectedRecords={selectedRecords}
                                onSelectedRecordsChange={setSelectedRecords}
                                paginationText={({ from, to, totalRecords }) =>
                                    `Showing  ${from} to ${to} of ${totalRecords} entries`
                                }
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dealers;
