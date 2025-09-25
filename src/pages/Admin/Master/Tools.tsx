import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch, useSelector } from 'react-redux';
// import { IRootState } from '../../../store';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconPlus from '../../../components/Icon/IconPlus';
import IconEdit from '../../../components/Icon/IconEdit';
// import IconEye from '../../../components/Icon/IconEye';
import { toolsData } from '../../../data';
import IconEye from '../../../components/Icon/IconEye';
import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb';
import IconHome from '../../../components/Icon/IconHome';
import IconBox from '../../../components/Icon/IconBox';
import { AllTools } from '../../../api';
import { formatDate } from 'date-fns';
import dayjs from 'dayjs';

const Tools = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Tools'));
    }, []);

    const [items, setItems] = useState<any[]>([]);

    const deleteRow = (id: any = null) => {
        if (window.confirm('Are you sure want to delete selected row ?')) {
            if (id) {
                setRecords(items.filter((user) => user.id !== id));
                setInitialRecords(items.filter((user) => user.id !== id));
                setItems(items.filter((user) => user.id !== id));
                setSearch('');
                setSelectedRecords([]);
            } else {
                let selectedRows = selectedRecords || [];
                const ids = selectedRows.map((d: any) => {
                    return d.id;
                });
                const result = items.filter((d) => !ids.includes(d.id as never));
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
    const [initialRecords, setInitialRecords] = useState(sortBy(items, 'cityName'));
    const [records, setRecords] = useState(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState<any>([]);
    const [loading, setLoading] = useState(true);



    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'firstName',
        direction: 'asc',
    });

    useEffect(() => {
        setPage(1);
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [pageSize]);
    useEffect(() => {
        const fetchTools = async () => {
            setLoading(true);
            try {
                const response = await AllTools();
                const tools = response.data?.tools || [];
                console.log("🚀 ~ fetchTools ~ tools:", tools)
                setItems(tools);
                setInitialRecords(tools);
                setRecords(tools.slice(0, pageSize));
            } catch (error) {
                console.error("Failed to fetch tools:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTools();
    }, []);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const filtered = items.filter((item) => {
            const query = search.toLowerCase();
            return (
                item.nomenclature?.toLowerCase().includes(query) ||
                item.manufacturer?.toLowerCase().includes(query) ||
                item.model?.toLowerCase().includes(query) ||
                item.srNo?.toLowerCase().includes(query) ||
                item.calibrationCertificateNo?.toLowerCase().includes(query) ||
                item.calibrationDate?.toLowerCase().includes(query) ||
                item.range?.toLowerCase().includes(query) ||
                item.toolID?.toLowerCase().includes(query)
            );
        });

        setInitialRecords(filtered);
        setPage(1);
    }, [search, items]);


    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Tools', icon: <IconBox /> },
    ];
    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            {/* <button type="button" className="btn btn-danger gap-2" onClick={() => deleteRow()}>
                                <IconTrashLines />
                                Delete
                            </button> */}
                            <Link to="/admin/tools/add" className="btn btn-primary gap-2">
                                <IconPlus />
                                Add New
                            </Link>
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
                                    accessor: 'SrNo',
                                    sortable: true,
                                },
                                {
                                    accessor: 'nomenclature',
                                    sortable: true,
                                },
                                {
                                    accessor: 'engineerName',
                                    sortable: true,
                                },
                                {
                                    accessor: 'issueDate',
                                    sortable: true,
                                    render: ({ issueDate }) => dayjs(issueDate).format(('DD-MM-YYYY')),
                                },
                                {
                                    accessor: 'submitDate',
                                    sortable: true,
                                    render: ({ submitDate }) => dayjs(submitDate).format(('DD-MM-YYYY')),
                                },
                                {
                                    accessor: 'manufacturer',
                                    sortable: true,
                                },
                                {
                                    accessor: 'model',
                                    sortable: true,
                                },
                                {
                                    accessor: 'calibrationCertificateNo',
                                    sortable: true,

                                },
                                {
                                    accessor: 'calibrationValidTill',
                                    sortable: true,
                                    render: ({ calibrationValidTill }) => dayjs(calibrationValidTill).format(('DD-MM-YYYY')),
                                },
                                {
                                    accessor: 'range',
                                    sortable: true,
                                },

                                {
                                    accessor: 'toolId',
                                    sortable: true,
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: (row) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <NavLink to={`/admin/tools/view/${row._id}`} className="flex hover:text-primary">
                                                <IconEye />
                                            </NavLink>
                                            <NavLink to={`/admin/tools/edit/${row._id}`} className="flex hover:text-info">
                                                <IconEdit className="w-4.5 h-4.5" />
                                            </NavLink>
                                            <button
                                                type="button"
                                                className="flex hover:text-danger"
                                                onClick={() => deleteRow(row._id)}
                                            >
                                                <IconTrashLines />
                                            </button>
                                        </div>
                                    )

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
                            paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Tools;
