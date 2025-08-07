import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
// import { IconTrashLines } from "@/components/Icon"; // Update the path if different
import { orderData } from '../../data'; // Update with correct data import
import IconPlus from '../../components/Icon/IconPlus';
import IconEdit from '../../components/Icon/IconEdit';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconEye from '../../components/Icon/IconEye';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconCopy from '../../components/Icon/IconCopy';
import IconHome from '../../components/Icon/IconHome';
import IconBox from '../../components/Icon/IconBox';
import Breadcrumb, { BreadcrumbItem } from '../../components/common/Breadcrumb';
import { getAllOrders } from '../../api';

type Order = {
    _id: string;
    orderId?: string;
    srfNumber?: string;
    procNoOrPoNo?: string;
    type?: string;
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

const Orders = () => {
    const [search, setSearch] = useState('');
    const [records, setRecords] = useState<Order[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortStatus, setSortStatus] = useState({ columnAccessor: 'orderId', direction: 'asc' as 'asc', });
    const [selectedRecords, setSelectedRecords] = useState([]);

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Orders'));

        const fetchOrders = async () => {
            try {
                const data = await getAllOrders();
                setRecords(data.orders || []); // assumes the backend returns { orders: [...] }
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            }
        };

        fetchOrders();
    }, [dispatch]);


    const deleteRow = (id: any) => {
        const updated = records.filter((item) => item.id !== id);
        setRecords(updated);
    };

    const viewEditRow = (record: any) => {
        console.log('View/Edit clicked for:', record);
        // Optionally redirect or open modal here
    };

    const filteredRecords = records.filter((item) => Object.values(item).some((val) => String(val).toLowerCase().includes(search.toLowerCase())));

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            const link = `${window.location.origin}/order_form`;
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };
    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Orders', icon: <IconBox /> },
    ];
    return (
        <div>
            {/* Breadcrumb */}
            <Breadcrumb items={breadcrumbItems} />
            {/* Table Panel */}
            <div className="panel px-0 pb-0">
                <div className="invoice-table">
                    {/* Search */}
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        {/* <div className="flex items-center gap-2">
                            <button onClick={handleCopy} className="btn btn-primary gap-2">
                                <IconCopy />
                                {copied ? ' Copied! ' : 'Copy Link'}
                            </button>
                        </div> */}
                        <div className="flex items-center gap-2">
                            <Link to={'create'} className="btn btn-primary gap-2">
                                <IconPlus /> Create Order
                            </Link>
                        </div>
                        <div className="ltr:ml-auto rtl:mr-auto">
                            <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    {/* Data Table */}
                    {/* <div className="datatables pagination-padding"> */}
                    <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl shadow-md overflow-auto">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={filteredRecords}
                            columns={[
                                {
                                    accessor: 'srfNumber', title: 'SRF NO', sortable: true,
                                    render: (record) => (
                                        <h4 className='font-semibold'>{record.srfNumber}</h4>
                                    )
                                },
                                { accessor: 'procNoOrPoNo', title: 'PROC NO/PO NO', sortable: true },
                                {
                                    accessor: 'type',
                                    title: 'Type',
                                    sortable: true,
                                    // render: (record) => (
                                    //     <div className="flex items-center justify-center w-1/2">
                                    //         <span className={`badge badge-outline-${record.type === 'Customer' ? 'warning' : 'secondary'} rounded-full`}>{record.type}</span>
                                    //     </div>
                                    // ),
                                },
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
                                // { accessor: "createdOn", title: "Created On", sortable: true },
                                // { accessor: "expiresOn", title: "Expires On", sortable: true },
                                // { accessor: "totalCost", title: "Total Cost", sortable: true },
                                // { accessor: "advancedAmount", title: "Advance Amount", sortable: true },

                                // {
                                //   accessor: "assignedStaff",
                                //   title: "Assigned Staff",
                                //   render: (record: { assignedStaff: string[] }) => record.assignedStaff.join(", ")
                                // },
                                { accessor: 'status', title: 'Status', sortable: true },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: (record: Order) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <Link to={`/admin/orders/view/${record._id}`} className="flex hover:text-info">
                                                <IconEye className="w-4.5 h-4.5" />
                                            </Link>
                                            <Link to={`/admin/orders/edit/${record._id}`} className="flex hover:text-info">
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
                                    )

                                },
                            ]}
                            highlightOnHover
                            totalRecords={filteredRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={[5, 10, 25]}
                            onRecordsPerPageChange={setPageSize}
                            // sortStatus={sortStatus}
                            sortStatus={sortStatus} // ✅ Required
                            selectedRecords={selectedRecords}
                            // onSelectedRecordsChange={setSelectedRecords}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Orders;
