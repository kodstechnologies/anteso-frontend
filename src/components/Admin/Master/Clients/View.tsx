import { Link, NavLink } from 'react-router-dom';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../../store/themeConfigSlice';
import IconTrashLines from '../../../../components/Icon/IconTrashLines';
import IconPlus from '../../../../components/Icon/IconPlus';
import IconEdit from '../../../../components/Icon/IconEdit';
import IconEye from '../../../../components/Icon/IconEye';
import IconCopy from '../../../../components/Icon/IconCopy';
import { clientsData, institutedata, rsodetails, equipmentDetails } from '../../../../data';
// import { IconShield ,IconUser ,  } from '@tabler/icons-react';
// import { Shield } from 'lucide-react';

// Define interfaces for data structures
interface Client {
    id: number;
    name: string;
    email: string;
    address: string;
    phone: string;
    business: string;
    gstNo: string;
}

interface Institute {
    id: number;
    eloraID: string;
    instPassword: string;
    instEmail: string;
    instPhone: string;
}

interface RSO {
    rsoID: string;
    rsoPassword: string;
    rsoEmail: string;
    rsoPhone: string;
    rpID: string;
    tldBadge: string;
    rsoValidity: string;
}

interface Equipment {
    id: number;
    machineType: string;
    model: string;
    make: string;
    serialNo: string;
    equipID: string;
    qaValidity: string;
    licenseValidity: string;
    status: string;
    rawaDataAttachment: string;
    qaReportAttachment: string;
    licenceAttachment: string;
}

// Updated equipmentDetails with unique IDs
const updatedEquipmentDetails: Equipment[] = equipmentDetails.map((item, index) => ({
    ...item,
    id: index + 1,
}));

const ViewClients = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('View Clients'));
    }, [dispatch]);

    // State for all datasets
    const [clients, setClients] = useState<Client[]>(clientsData);
    const [institutes, setInstitutes] = useState<Institute[]>(institutedata);
    const [rsos, setRsos] = useState<RSO[]>(rsodetails);
    const [equipment, setEquipment] = useState<Equipment[]>(updatedEquipmentDetails);

    // State for Equipment Details table
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState(sortBy(equipment, 'machineType'));
    const [records, setRecords] = useState(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState<Equipment[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'machineType',
        direction: 'asc',
    });
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            const link = `${window.location.origin}/admin/equipment/add`;
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
                const filteredItems = equipment.filter((item) => item.id !== id);
                setEquipment(filteredItems);
                setInitialRecords(filteredItems);
                setRecords(filteredItems.slice(0, pageSize));
                setSearch('');
                setSelectedRecords([]);
            } else {
                const ids = selectedRecords.map((d) => d.id);
                const filteredItems = equipment.filter((d) => !ids.includes(d.id));
                setEquipment(filteredItems);
                setInitialRecords(filteredItems);
                setRecords(filteredItems.slice(0, pageSize));
                setSearch('');
                setSelectedRecords([]);
                setPage(1);
            }
        }
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
        setInitialRecords(equipment.filter((item) => item.machineType.toLowerCase().includes(search.toLowerCase())));
    }, [search, equipment]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
    }, [sortStatus, initialRecords]);

    // Mask password for display
    const maskPassword = (password: string) => '•'.repeat(8);

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/clients" className="text-primary">
                        Clients
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        View Clients
                    </Link>
                </li>
            </ol>

            <div className="max-w-7xl mx-auto ">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6  my-4 ">
                    {/* Client Details */}
                    <div className="panel p-0 border-white-light dark:border-[#1b2e4b] bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg ">
                        <div className="invoice-table">
                            <h5 className="font-semibold text-lg m-2 text-primary flex items-center gap-2">
                                {/* <IconUser className="w-5 h-5" />  */}
                                Client Details
                            </h5>
                            {clients[0] ? (
                                <div className="p-2 text-[.8rem]">
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{clients[0].name}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{clients[0].email}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Address:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{clients[0].address}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{clients[0].phone}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Business:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{clients[0].business}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">GST No:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{clients[0].gstNo}</span>
                                    </p>
                                </div>
                            ) : (
                                <p className="p-4 text-gray-600 dark:text-gray-400">No client data available.</p>
                            )}
                        </div>
                    </div>

                    {/* Institute Details */}
                    <div className="panel p-0 border-white-light dark:border-[#1b2e4b] bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
                        <div className="invoice-table">
                            <h5 className="font-semibold text-lg m-2 text-primary flex items-center gap-2">
                                {/* <IconBuilding className="w-5 h-5" /> */}
                                Institute Details
                            </h5>
                            {institutes[0] ? (
                                <div className="p-2 text-[.8rem]">
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">ELORA ID:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{institutes[0].eloraID}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Password:</span>
                                        <span className="text-gray-600 dark:text-gray-400 italic">{institutes[0].instPassword}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Registered Email:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{institutes[0].instEmail}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Registered Mobile No:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{institutes[0].instPhone}</span>
                                    </p>
                                </div>
                            ) : (
                                <p className="p-4 text-gray-600 dark:text-gray-400">No institute data available.</p>
                            )}
                        </div>
                    </div>

                    {/* RSO Details */}
                    <div className="panel p-0 border-white-light dark:border-[#1b2e4b]  dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
                        <div className="invoice-table ">
                            <h5 className="font-semibold text-lg m-2 text-primary flex items-center gap-2">
                                {/* <IconShield className="w-5 h-5" />  */}
                                RSO Details
                            </h5>
                            {rsos[0] ? (
                                <div className="p-2 text-[.8rem]">
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">RSO ELORA ID:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{rsos[0].rsoID}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Password:</span>
                                        <span className="text-gray-600 dark:text-gray-400 italic">{rsos[0].rsoPassword}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Registered Email:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{rsos[0].rsoEmail}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Registered Mobile No:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{rsos[0].rsoPhone}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">RP ID:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{rsos[0].rpID}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">TLD Badge:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{rsos[0].tldBadge}</span>
                                    </p>
                                    <p className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">RSO Validity:</span>
                                        <span className="text-gray-600 dark:text-gray-400">{rsos[0].rsoValidity}</span>
                                    </p>
                                </div>
                            ) : (
                                <p className="p-4 text-gray-600 dark:text-gray-400">No RSO data available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipment Details Table */}
            <div className="panel px-0 border-white-light dark:border-[#1b2e4b] mb-4">
                <div className="invoice-table">
                    {/* <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="flex items-center gap-2">
                            <Link to="/admin/equipment/add" className="btn btn-primary gap-2">
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
                    </div> */}
                    <h5 className="font-semibold text-lg m-4">Equipment Details</h5>
                    <div className="datatables pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records}
                            columns={[
                                {
                                    accessor: 'machineType',
                                    title: 'Machine Type',
                                    sortable: true,
                                },
                                {
                                    accessor: 'model',
                                    title: 'Model',
                                    sortable: true,
                                },
                                {
                                    accessor: 'make',
                                    title: 'Make',
                                    sortable: true,
                                },
                                {
                                    accessor: 'serialNo',
                                    title: 'Serial No',
                                    sortable: true,
                                },
                                {
                                    accessor: 'equipID',
                                    title: 'Equipment ID',
                                    sortable: true,
                                },
                                {
                                    accessor: 'qaValidity',
                                    title: 'QA Validity',
                                    sortable: true,
                                },
                                {
                                    accessor: 'licenseValidity',
                                    title: 'License Validity',
                                    sortable: true,
                                },
                                {
                                    accessor: 'status',
                                    title: 'Status',
                                    sortable: true,
                                },
                                {
                                    accessor: 'rawaDataAttachment',
                                    title: 'Raw Data Attachment',
                                    sortable: true,
                                    textAlignment: 'center',
                                },
                                {
                                    accessor: 'qaReportAttachment',
                                    title: 'QA Report Attachment',
                                    sortable: true,
                                    textAlignment: 'center',
                                },
                                {
                                    accessor: 'licenceAttachment',
                                    title: 'License Attachment',
                                    sortable: true,
                                    textAlignment: 'right',
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

export default ViewClients;
