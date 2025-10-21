import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from 'mantine-datatable';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';

import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb';
import IconPlus from '../../../components/Icon/IconPlus';
import IconEdit from '../../../components/Icon/IconEdit';
import IconTrashLines from '../../../components/Icon/IconTrashLines';
import IconEye from '../../../components/Icon/IconEye';
import IconHome from '../../../components/Icon/IconHome';
import IconBox from '../../../components/Icon/IconBox';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { getAllStaffOrders } from '../../../api'; // <-- import your API function

type Order = {
    _id: string;
    srfNumber?: string;
    procNoOrPoNo?: string;
    leadOwner?: string;
    createdOn?: string;
    partyCode?: string;
    hospitalName?: string;
    fullAddress?: string;
    city?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    branchName?: string;
    emailAddress?: string;
    contactNumber?: string;
    status?: string;
    [key: string]: any;
};

const StaffOrders = () => {
    const [search, setSearch] = useState('');
    const [records, setRecords] = useState<Order[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortStatus, setSortStatus] = useState({ columnAccessor: 'srfNumber', direction: 'asc' as 'asc' });
    const [selectedRecords, setSelectedRecords] = useState([]);

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Orders'));

        const fetchOrders = async () => {
            try {
                const res = await getAllStaffOrders(); // <-- use your API function
                setRecords(res.data.orders || []); // the API returns { success: true, orders: [...] }
            } catch (error) {
                console.error('Failed to fetch staff orders:', error);
            }
        };

        fetchOrders();
    }, [dispatch]);

    const deleteRow = (id: string) => {
        const updated = records.filter((item) => item._id !== id);
        setRecords(updated);
    };

    const filteredRecords = records.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(search.toLowerCase()))
    );

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Orders', icon: <IconBox /> },
    ];

    return (
        <div>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 pb-0">
                <div className="invoice-table">
                    {/* Search and Create Button */}
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to={'create'} className="btn btn-primary gap-2">
                                <IconPlus /> Create Order
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

                    {/* Data Table */}
                    <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl shadow-md overflow-auto">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={filteredRecords}
                            columns={[
                                { accessor: 'srfNumber', title: 'SRF NO', sortable: true },
                                { accessor: 'procNoOrPoNo', title: 'PROC NO/PO NO', sortable: true },
                                { accessor: 'leadOwner', title: 'Lead Owner', sortable: true },
                                { accessor: 'createdOn', title: 'PROC Expiry Date', sortable: true },
                                { accessor: 'partyCode', title: 'Party Code/ Sys ID', sortable: true },
                                { accessor: 'hospitalName', title: 'Institute Name', sortable: true },
                                { accessor: 'fullAddress', title: 'Address', sortable: true },
                                { accessor: 'city', title: 'City', sortable: true },
                                { accessor: 'district', title: 'District', sortable: true },
                                { accessor: 'state', title: 'State', sortable: true },
                                { accessor: 'pinCode', title: 'Pin', sortable: true },
                                { accessor: 'branchName', title: 'Branch Name', sortable: true },
                                { accessor: 'emailAddress', title: 'Customer Email', sortable: true },
                                { accessor: 'contactNumber', title: 'Customer Mobile', sortable: true },
                                { accessor: 'status', title: 'Status', sortable: true },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    textAlignment: 'center',
                                    render: (record: Order) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <Link to={`/admin/orders/view/${record._id}`} className="flex hover:text-info">
                                                <IconEye className="w-4.5 h-4.5" />
                                            </Link>
                                            <Link to={`/admin/clients/preview/${record._id}`} className="flex hover:text-info">
                                                <IconEdit className="w-4.5 h-4.5" />
                                            </Link>
                                            <button
                                                type="button"
                                                className="flex hover:text-danger"
                                                onClick={() => deleteRow(record._id)}
                                            >
                                                <IconTrashLines />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            highlightOnHover
                            totalRecords={filteredRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={[5, 10, 25]}
                            onRecordsPerPageChange={setPageSize}
                            sortStatus={sortStatus}
                            selectedRecords={selectedRecords}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffOrders;
