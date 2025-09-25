// import { Link, NavLink } from 'react-router-dom';
// import { DataTable, DataTableSortStatus } from 'mantine-datatable';
// import { useState, useEffect } from 'react';
// import sortBy from 'lodash/sortBy';
// import { useDispatch, useSelector } from 'react-redux';
// // import { IRootState } from '../../../store';
// import { setPageTitle } from '../../../store/themeConfigSlice';
// import IconTrashLines from '../../../components/Icon/IconTrashLines';
// import IconPlus from '../../../components/Icon/IconPlus';
// import IconEdit from '../../../components/Icon/IconEdit';
// // import IconEye from '../../../components/Icon/IconEye';
// import { dealersAndManufacturers } from '../../../data';
// import IconEye from '../../../components/Icon/IconEye';

// const DealersAndManufacturers = () => {
//     const dispatch = useDispatch();
//     useEffect(() => {
//         dispatch(setPageTitle('DealersAndManufacturers'));
//     }, []);

//     const [items, setItems] = useState(
//         dealersAndManufacturers.map((item, index) => ({
//             ...item,
//             dealersAndManufacturersID: `EMP${String(index + 1).padStart(3, '0')}`, // Generates C001, C002, etc.
//         }))
//     );

//     const deleteRow = (id: any = null) => {
//         if (window.confirm('Are you sure want to delete selected row ?')) {
//             if (id) {
//                 setRecords(items.filter((user) => user.id !== id));
//                 setInitialRecords(items.filter((user) => user.id !== id));
//                 setItems(items.filter((user) => user.id !== id));
//                 setSearch('');
//                 setSelectedRecords([]);
//             } else {
//                 let selectedRows = selectedRecords || [];
//                 const ids = selectedRows.map((d: any) => {
//                     return d.id;
//                 });
//                 const result = items.filter((d) => !ids.includes(d.id as never));
//                 setRecords(result);
//                 setInitialRecords(result);
//                 setItems(result);
//                 setSearch('');
//                 setSelectedRecords([]);
//                 setPage(1);
//             }
//         }
//     };

//     const [page, setPage] = useState(1);
//     const PAGE_SIZES = [10, 20, 30, 50, 100];
//     const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
//     const [initialRecords, setInitialRecords] = useState(sortBy(items, 'customerName'));
//     const [records, setRecords] = useState(initialRecords);
//     const [selectedRecords, setSelectedRecords] = useState<any>([]);

//     const [search, setSearch] = useState('');
//     const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
//         columnAccessor: 'firstName',
//         direction: 'asc',
//     });

//     useEffect(() => {
//         setPage(1);
//         /* eslint-disable react-hooks/exhaustive-deps */
//     }, [pageSize]);

//     useEffect(() => {
//         const from = (page - 1) * pageSize;
//         const to = from + pageSize;
//         setRecords([...initialRecords.slice(from, to)]);
//     }, [page, pageSize, initialRecords]);

//     useEffect(() => {
//         setInitialRecords(() => {
//             return items.filter((item) => {
//                 return (
//                     item.dealersAndManufacturersID.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
//                     item.hospitalName.toLowerCase().includes(search.toLowerCase()) ||
//                     item.address.toLowerCase().includes(search.toLowerCase()) ||
//                     item.contactPersonName.toLowerCase().includes(search.toLowerCase()) ||
//                     item.phone.toLowerCase().includes(search.toLowerCase()) ||
//                     item.email.toLowerCase().includes(search.toLowerCase()) ||
//                     item.procurementNumber.toLowerCase().includes(search.toLowerCase()) ||
//                     item.partyCode.toLowerCase().includes(search.toLowerCase()) ||
//                     item.branch.toLowerCase().includes(search.toLowerCase())
//                 );
//             });
//         });
//     }, [search]);

//     useEffect(() => {
//         const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
//         setRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
//         setPage(1);
//     }, [sortStatus]);

//     return (
//         <>
//             <ol className="flex text-gray-500 font-semibold dark:text-white-dark pb-4">
//                 <li>
//                     <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
//                         Dashboard
//                     </Link>
//                 </li>
//                 <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
//                     <button className="text-primary">DealersAndManufacturers</button>
//                 </li>
//             </ol>
//             <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
//                 <div className="invoice-table">
//                     <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
//                         <div className="flex items-center gap-2">
//                             {/* <button type="button" className="btn btn-danger gap-2" onClick={() => deleteRow()}>
//                                 <IconTrashLines />
//                                 Delete
//                             </button> */}
//                             <Link to="/admin/dealer-and-manufacture/add" className="btn btn-primary gap-2">
//                                 <IconPlus />
//                                 Add New
//                             </Link>
//                         </div>
//                         <div className="ltr:ml-auto rtl:mr-auto">
//                             <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
//                         </div>
//                     </div>

//                     <div className="datatables pagination-padding">
//                         <DataTable
//                             className="whitespace-nowrap table-hover invoice-table"
//                             records={records}
//                             columns={[
//                                 {
//                                     accessor: 'dealersAndManufacturersID',
//                                     title: 'DAM ID',
//                                     sortable: true,
//                                 },
//                                 {
//                                     accessor: 'hospitalName',
//                                     sortable: true,
//                                 },
//                                 {
//                                     accessor: 'address',
//                                     sortable: true,
//                                 },
//                                 {
//                                     accessor: 'contactPersonName',
//                                     sortable: true,
//                                 },
//                                 {
//                                     accessor: 'phone',
//                                     sortable: true,
//                                 },
//                                 {
//                                     accessor: 'email',
//                                     sortable: true,
//                                 },
//                                 {
//                                     accessor: 'procurementNumber',
//                                     sortable: true,
//                                 },
//                                 {
//                                     accessor: 'procurementExpiryDate',
//                                     sortable: true,
//                                 },
//                                 {
//                                     accessor: 'partyCode',
//                                     sortable: true,
//                                 },
//                                 {
//                                     accessor: 'branch',
//                                     sortable: true,
//                                 },
//                                 {
//                                     accessor: 'action',
//                                     title: 'Actions',
//                                     sortable: false,
//                                     textAlignment: 'center',
//                                     render: ({ id }) => (
//                                         <div className="flex gap-4 items-center w-max mx-auto">
//                                             <NavLink to="/apps/invoice/preview" className="flex hover:text-primary">
//                                                 <IconEye />
//                                             </NavLink>
//                                             <NavLink to="/admin/dealer-and-manufacture/edit" className="flex hover:text-info">
//                                                 <IconEdit className="w-4.5 h-4.5" />
//                                             </NavLink>
//                                             <button type="button" className="flex hover:text-danger" onClick={(e) => deleteRow(id)}>
//                                                 <IconTrashLines />
//                                             </button>
//                                         </div>
//                                     ),
//                                 },
//                             ]}
//                             highlightOnHover
//                             totalRecords={initialRecords.length}
//                             recordsPerPage={pageSize}
//                             page={page}
//                             onPageChange={(p) => setPage(p)}
//                             recordsPerPageOptions={PAGE_SIZES}
//                             onRecordsPerPageChange={setPageSize}
//                             sortStatus={sortStatus}
//                             onSortStatusChange={setSortStatus}
//                             selectedRecords={selectedRecords}
//                             onSelectedRecordsChange={setSelectedRecords}
//                             paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
//                         />
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// };

// export default DealersAndManufacturers;
