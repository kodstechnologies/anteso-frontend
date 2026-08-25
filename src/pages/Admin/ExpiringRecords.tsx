import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import IconHome from '../../components/Icon/IconHome';
import IconClock from '../../components/Icon/IconClock';
import IconRefresh from '../../components/Icon/IconRefresh';
import IconArrowBackward from '../../components/Icon/IconArrowBackward';
import IconEye from '../../components/Icon/IconEye';
import Breadcrumb, { BreadcrumbItem } from '../../components/common/Breadcrumb';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { showMessage } from '../../components/common/ShowMessage';
import { getExpiryReminders } from '../../api';

// Types
type QAReportReminder = {
    _id: string;
    srfNumber?: string;
    hospitalName?: string;
    contactNumber?: string;
    machineType?: string;
    workType?: string;
    expiryDate?: string;
    daysRemaining?: number;
    status?: string;
    reportPdf?: string;
};

type LicenseReminder = {
    _id: string;
    srfNumber?: string;
    hospitalName?: string;
    contactNumber?: string;
    machineType?: string;
    workType?: string;
    expiryDate?: string;
    daysRemaining?: number;
    status?: string;
    report?: string;
};

const ExpiringRecords = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // QA Reports State
    const [qaReports, setQaReports] = useState<QAReportReminder[]>([]);
    const [qaLoading, setQaLoading] = useState(false);
    const [qaPage, setQaPage] = useState(1);
    const [qaPageSize, setQaPageSize] = useState(10);
    const [qaTotalRecords, setQaTotalRecords] = useState(0);
    const [qaNotificationCount, setQaNotificationCount] = useState(0);
    const [qaDateFrom, setQaDateFrom] = useState('');
    const [qaDateTo, setQaDateTo] = useState('');
    const [qaSortStatus, setQaSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'expiryDate',
        direction: 'asc',
    });

    // License Reminders State
    const [licenses, setLicenses] = useState<LicenseReminder[]>([]);
    const [licenseLoading, setLicenseLoading] = useState(false);
    const [licensePage, setLicensePage] = useState(1);
    const [licensePageSize, setLicensePageSize] = useState(10);
    const [licenseTotalRecords, setLicenseTotalRecords] = useState(0);
    const [licenseNotificationCount, setLicenseNotificationCount] = useState(0);
    const [licenseDateFrom, setLicenseDateFrom] = useState('');
    const [licenseDateTo, setLicenseDateTo] = useState('');
    const [licenseSortStatus, setLicenseSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'expiryDate',
        direction: 'asc',
    });

    useEffect(() => {
        dispatch(setPageTitle('Expiring Records'));
    }, [dispatch]);

    const startOfToday = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const isNotExpired = (expiryDate?: string) => {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        return expiry.getTime() >= startOfToday().getTime();
    };

    // Fetch QA Reports
    const fetchQAReports = async () => {
        try {
            setQaLoading(true);
            const response = await getExpiryReminders('qa');
            
            if (response.success && response.data?.qa) {
                // Auto-hide anything past expiry (even if API/cache returns it)
                let filteredData = response.data.qa.filter((item: QAReportReminder) =>
                    isNotExpired(item.expiryDate)
                );
                setQaNotificationCount(filteredData.length);
                
                // Apply date filters
                if (qaDateFrom || qaDateTo) {
                    filteredData = filteredData.filter((item: QAReportReminder) => {
                        if (!item.expiryDate) return false;
                        const expiryDate = new Date(item.expiryDate);
                        const from = qaDateFrom ? new Date(qaDateFrom) : null;
                        const to = qaDateTo ? new Date(qaDateTo) : null;
                        
                        if (from && expiryDate < from) return false;
                        if (to && expiryDate > to) return false;
                        return true;
                    });
                }
                
                // Apply sorting
                filteredData.sort((a: QAReportReminder, b: QAReportReminder) => {
                    const aValue = a[qaSortStatus.columnAccessor as keyof QAReportReminder];
                    const bValue = b[qaSortStatus.columnAccessor as keyof QAReportReminder];
                    
                    if (aValue === undefined || bValue === undefined) return 0;
                    
                    let comparison = 0;
                    if (aValue < bValue) comparison = -1;
                    if (aValue > bValue) comparison = 1;
                    
                    return qaSortStatus.direction === 'asc' ? comparison : -comparison;
                });
                
                // Apply pagination
                const startIndex = (qaPage - 1) * qaPageSize;
                const paginatedData = filteredData.slice(startIndex, startIndex + qaPageSize);
                
                setQaReports(paginatedData);
                setQaTotalRecords(filteredData.length);
            } else {
                setQaReports([]);
                setQaTotalRecords(0);
                setQaNotificationCount(0);
            }
        } catch (error) {
            console.error('Failed to fetch QA reports:', error);
            showMessage('Failed to fetch QA reports', 'error');
            setQaNotificationCount(0);
        } finally {
            setQaLoading(false);
        }
    };

    // Fetch License Reminders
    const fetchLicenses = async () => {
        try {
            setLicenseLoading(true);
            const response = await getExpiryReminders('license');
            
            if (response.success && response.data?.license) {
                // Auto-hide anything past expiry (even if API/cache returns it)
                let filteredData = response.data.license.filter((item: LicenseReminder) =>
                    isNotExpired(item.expiryDate)
                );
                setLicenseNotificationCount(filteredData.length);
                
                // Apply date filters
                if (licenseDateFrom || licenseDateTo) {
                    filteredData = filteredData.filter((item: LicenseReminder) => {
                        if (!item.expiryDate) return false;
                        const expiryDate = new Date(item.expiryDate);
                        const from = licenseDateFrom ? new Date(licenseDateFrom) : null;
                        const to = licenseDateTo ? new Date(licenseDateTo) : null;
                        
                        if (from && expiryDate < from) return false;
                        if (to && expiryDate > to) return false;
                        return true;
                    });
                }
                
                // Apply sorting
                filteredData.sort((a: LicenseReminder, b: LicenseReminder) => {
                    const aValue = a[licenseSortStatus.columnAccessor as keyof LicenseReminder];
                    const bValue = b[licenseSortStatus.columnAccessor as keyof LicenseReminder];
                    
                    if (aValue === undefined || bValue === undefined) return 0;
                    
                    let comparison = 0;
                    if (aValue < bValue) comparison = -1;
                    if (aValue > bValue) comparison = 1;
                    
                    return licenseSortStatus.direction === 'asc' ? comparison : -comparison;
                });
                
                // Apply pagination
                const startIndex = (licensePage - 1) * licensePageSize;
                const paginatedData = filteredData.slice(startIndex, startIndex + licensePageSize);
                
                setLicenses(paginatedData);
                setLicenseTotalRecords(filteredData.length);
            } else {
                setLicenses([]);
                setLicenseTotalRecords(0);
                setLicenseNotificationCount(0);
            }
        } catch (error) {
            console.error('Failed to fetch licenses:', error);
            showMessage('Failed to fetch licenses', 'error');
            setLicenseNotificationCount(0);
        } finally {
            setLicenseLoading(false);
        }
    };

    useEffect(() => {
        fetchQAReports();
    }, [qaPage, qaPageSize, qaDateFrom, qaDateTo, qaSortStatus]);

    useEffect(() => {
        fetchLicenses();
    }, [licensePage, licensePageSize, licenseDateFrom, licenseDateTo, licenseSortStatus]);

    const clearQAFilters = () => {
        setQaDateFrom('');
        setQaDateTo('');
        setQaPage(1);
    };

    const clearLicenseFilters = () => {
        setLicenseDateFrom('');
        setLicenseDateTo('');
        setLicensePage(1);
    };

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Orders', to: '/admin/orders', icon: <IconClock /> },
        { label: 'Expiring Records', icon: <IconClock /> },
    ];

    const getDaysColor = (days: number | undefined) => {
        if (days === undefined || days === null) return 'text-gray-600';
        if (days <= 30) return 'text-red-600 font-semibold';
        if (days <= 60) return 'text-orange-600 font-semibold';
        return 'text-yellow-600';
    };

    const handleViewReport = (reportUrl: string | undefined) => {
        if (!reportUrl) {
            showMessage('Report not available', 'error');
            return;
        }
        // Open report in new tab
        window.open(reportUrl, '_blank');
    };

    return (
        <div>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel">
                <div className="mb-5 flex items-center justify-between">
                    <h5 className="text-lg font-semibold dark:text-white-light">Expiring Records</h5>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/orders')}
                        className="btn btn-outline-primary gap-2"
                    >
                        <IconArrowBackward />
                        Back to Orders
                    </button>
                </div>

                <Tab.Group>
                    <Tab.List className="mt-3 flex flex-wrap border-b border-white-light dark:border-[#191e3a]">
                        <Tab as={React.Fragment}>
                            {({ selected }) => (
                                <button
                                    className={`${
                                        selected ? 'text-primary !outline-none before:!w-full' : ''
                                    } relative -mb-[1px] flex items-center p-5 py-3 before:absolute before:bottom-0 before:left-0 before:right-0 before:m-auto before:inline-block before:h-[1px] before:w-0 before:bg-primary before:transition-all before:duration-700 hover:text-primary hover:before:w-full`}
                                >
                                    <IconClock className="ltr:mr-2 rtl:ml-2" />
                                    <span className="text-md font-bold">QA Test Reports Reminders</span>
                                    {qaNotificationCount > 0 && (
                                        <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold text-white">
                                            {qaNotificationCount > 99 ? '99+' : qaNotificationCount}
                                        </span>
                                    )}
                                </button>
                            )}
                        </Tab>
                        <Tab as={React.Fragment}>
                            {({ selected }) => (
                                <button
                                    className={`${
                                        selected ? 'text-primary !outline-none before:!w-full' : ''
                                    } relative -mb-[1px] flex items-center p-5 py-3 before:absolute before:bottom-0 before:left-0 before:right-0 before:m-auto before:inline-block before:h-[1px] before:w-0 before:bg-primary before:transition-all before:duration-700 hover:text-primary hover:before:w-full`}
                                >
                                    <IconClock className="ltr:mr-2 rtl:ml-2" />
                                    <span className="text-md font-bold">License Reminders</span>
                                    {licenseNotificationCount > 0 && (
                                        <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold text-white">
                                            {licenseNotificationCount > 99 ? '99+' : licenseNotificationCount}
                                        </span>
                                    )}
                                </button>
                            )}
                        </Tab>
                    </Tab.List>
                    <Tab.Panels>
                        {/* QA Reports Tab */}
                        <Tab.Panel>
                            <div className="pt-5">
                                {/* Filters */}
                                <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Filter QA Reports
                                        </h3>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {qaTotalRecords} record(s) match the current filters
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-end gap-3">
                                        <div className="flex min-w-[150px] flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                From Due Date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-input w-full"
                                                value={qaDateFrom}
                                                onChange={(e) => setQaDateFrom(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex min-w-[150px] flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                To Due Date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-input w-full"
                                                value={qaDateTo}
                                                onChange={(e) => setQaDateTo(e.target.value)}
                                            />
                                        </div>
                                        {(qaDateFrom || qaDateTo) && (
                                            <button
                                                type="button"
                                                onClick={clearQAFilters}
                                                className="btn btn-outline-danger h-[38px] gap-2"
                                                title="Clear filters"
                                            >
                                                <IconRefresh />
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="datatables">
                                    <DataTable
                                        className="whitespace-nowrap table-hover"
                                        records={qaReports}
                                        fetching={qaLoading}
                                        columns={[
                                            {
                                                accessor: 'srfNumber',
                                                title: 'SRF Number',
                                                sortable: true,
                                                render: (record) => (
                                                    <span className="font-semibold">{record.srfNumber || '-'}</span>
                                                ),
                                            },
                                            {
                                                accessor: 'hospitalName',
                                                title: 'Hospital Name',
                                                sortable: true,
                                                render: (record) => record.hospitalName || '-',
                                            },
                                            {
                                                accessor: 'contactNumber',
                                                title: 'Contact Number',
                                                sortable: true,
                                                render: (record) => record.contactNumber || '-',
                                            },
                                            {
                                                accessor: 'machineType',
                                                title: 'Machine Type',
                                                sortable: true,
                                                render: (record) => record.machineType || '-',
                                            },
                                            {
                                                accessor: 'workType',
                                                title: 'Work Type',
                                                sortable: true,
                                                render: (record) => record.workType || '-',
                                            },
                                            {
                                                accessor: 'expiryDate',
                                                title: 'Test Due Date',
                                                sortable: true,
                                                render: (record) =>
                                                    record.expiryDate
                                                        ? new Date(record.expiryDate).toLocaleDateString('en-GB')
                                                        : '-',
                                            },
                                            {
                                                accessor: 'daysRemaining',
                                                title: 'Days Until Expiry',
                                                sortable: true,
                                                render: (record) => (
                                                    <span className={getDaysColor(record.daysRemaining)}>
                                                        {record.daysRemaining !== undefined
                                                            ? `${record.daysRemaining} days`
                                                            : '-'}
                                                    </span>
                                                ),
                                            },
                                            {
                                                accessor: 'status',
                                                title: 'Status',
                                                sortable: true,
                                                render: (record) => (
                                                    <span
                                                        className={`badge ${
                                                            record.status === 'pending'
                                                                ? 'badge-outline-warning'
                                                                : 'badge-outline-success'
                                                        }`}
                                                    >
                                                        {record.status || '-'}
                                                    </span>
                                                ),
                                            },
                                            {
                                                accessor: 'action',
                                                title: 'Report',
                                                sortable: false,
                                                textAlignment: 'center',
                                                render: (record) => (
                                                    <button
                                                        type="button"
                                                        className="flex hover:text-info mx-auto"
                                                        onClick={() => handleViewReport(record.reportPdf)}
                                                        disabled={!record.reportPdf}
                                                    >
                                                        <IconEye className="w-4.5 h-4.5" />
                                                    </button>
                                                ),
                                            },
                                        ]}
                                        highlightOnHover
                                        totalRecords={qaTotalRecords}
                                        recordsPerPage={qaPageSize}
                                        page={qaPage}
                                        onPageChange={setQaPage}
                                        recordsPerPageOptions={[10, 20, 30, 40]}
                                        onRecordsPerPageChange={(size) => {
                                            setQaPageSize(size);
                                            setQaPage(1);
                                        }}
                                        sortStatus={qaSortStatus}
                                        onSortStatusChange={setQaSortStatus}
                                        paginationText={({ from, to, totalRecords }) =>
                                            `Showing ${from} to ${to} of ${totalRecords} entries`
                                        }
                                    />
                                </div>
                            </div>
                        </Tab.Panel>

                        {/* License Reminders Tab */}
                        <Tab.Panel>
                            <div className="pt-5">
                                {/* Filters */}
                                <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Filter Licenses
                                        </h3>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {licenseTotalRecords} record(s) match the current filters
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-end gap-3">
                                        <div className="flex min-w-[150px] flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                From Expiry Date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-input w-full"
                                                value={licenseDateFrom}
                                                onChange={(e) => setLicenseDateFrom(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex min-w-[150px] flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                To Expiry Date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-input w-full"
                                                value={licenseDateTo}
                                                onChange={(e) => setLicenseDateTo(e.target.value)}
                                            />
                                        </div>
                                        {(licenseDateFrom || licenseDateTo) && (
                                            <button
                                                type="button"
                                                onClick={clearLicenseFilters}
                                                className="btn btn-outline-danger h-[38px] gap-2"
                                                title="Clear filters"
                                            >
                                                <IconRefresh />
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="datatables">
                                    <DataTable
                                        className="whitespace-nowrap table-hover"
                                        records={licenses}
                                        fetching={licenseLoading}
                                        columns={[
                                            {
                                                accessor: 'srfNumber',
                                                title: 'SRF Number',
                                                sortable: true,
                                                render: (record) => (
                                                    <span className="font-semibold">{record.srfNumber || '-'}</span>
                                                ),
                                            },
                                            {
                                                accessor: 'hospitalName',
                                                title: 'Hospital Name',
                                                sortable: true,
                                                render: (record) => record.hospitalName || '-',
                                            },
                                            {
                                                accessor: 'contactNumber',
                                                title: 'Contact Number',
                                                sortable: true,
                                                render: (record) => record.contactNumber || '-',
                                            },
                                            {
                                                accessor: 'machineType',
                                                title: 'Machine Type',
                                                sortable: true,
                                                render: (record) => record.machineType || '-',
                                            },
                                            {
                                                accessor: 'workType',
                                                title: 'License Type',
                                                sortable: true,
                                                render: (record) => record.workType || '-',
                                            },
                                            {
                                                accessor: 'expiryDate',
                                                title: 'Expiry Date',
                                                sortable: true,
                                                render: (record) =>
                                                    record.expiryDate
                                                        ? new Date(record.expiryDate).toLocaleDateString('en-GB')
                                                        : '-',
                                            },
                                            {
                                                accessor: 'daysRemaining',
                                                title: 'Days Until Expiry',
                                                sortable: true,
                                                render: (record) => (
                                                    <span className={getDaysColor(record.daysRemaining)}>
                                                        {record.daysRemaining !== undefined
                                                            ? `${record.daysRemaining} days`
                                                            : '-'}
                                                    </span>
                                                ),
                                            },
                                            {
                                                accessor: 'status',
                                                title: 'Status',
                                                sortable: true,
                                                render: (record) => (
                                                    <span
                                                        className={`badge ${
                                                            record.status === 'pending'
                                                                ? 'badge-outline-warning'
                                                                : 'badge-outline-success'
                                                        }`}
                                                    >
                                                        {record.status || '-'}
                                                    </span>
                                                ),
                                            },
                                            {
                                                accessor: 'action',
                                                title: 'Report',
                                                sortable: false,
                                                textAlignment: 'center',
                                                render: (record) => (
                                                    <button
                                                        type="button"
                                                        className="flex hover:text-info mx-auto"
                                                        onClick={() => handleViewReport(record.report)}
                                                        disabled={!record.report}
                                                    >
                                                        <IconEye className="w-4.5 h-4.5" />
                                                    </button>
                                                ),
                                            },
                                        ]}
                                        highlightOnHover
                                        totalRecords={licenseTotalRecords}
                                        recordsPerPage={licensePageSize}
                                        page={licensePage}
                                        onPageChange={setLicensePage}
                                        recordsPerPageOptions={[10, 20, 30, 40]}
                                        onRecordsPerPageChange={(size) => {
                                            setLicensePageSize(size);
                                            setLicensePage(1);
                                        }}
                                        sortStatus={licenseSortStatus}
                                        onSortStatusChange={setLicenseSortStatus}
                                        paginationText={({ from, to, totalRecords }) =>
                                            `Showing ${from} to ${to} of ${totalRecords} entries`
                                        }
                                    />
                                </div>
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </div>
    );
};

export default ExpiringRecords;
