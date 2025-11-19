import React, { useEffect, useState } from "react";
import { DataTable, DataTableSortStatus } from "mantine-datatable";
import { sortBy } from "lodash";
import dayjs from "dayjs";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../../../store/themeConfigSlice";
import Breadcrumb, { BreadcrumbItem } from "../../../../components/common/Breadcrumb";
import IconHome from "../../../../components/Icon/IconHome";
import IconBox from "../../../../components/Icon/IconBox";
import IconEye from "../../../../components/Icon/IconEye";
import IconEdit from "../../../../components/Icon/IconEdit";
import IconPlus from "../../../../components/Icon/IconPlus";
import { NavLink } from "react-router-dom";
import { getAllLeavesByStaff } from "../../../../api/index";

interface LeaveItem {
    _id: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    status: string;
    rejectionReason?: string;
}

interface DecodedToken {
    id: string;
    userType?: string;
    exp?: number;
    iat?: number;
}

const AllLeavesForStaff: React.FC = () => {
    const dispatch = useDispatch();
    const [leaves, setLeaves] = useState<LeaveItem[]>([]);
    const [records, setRecords] = useState<LeaveItem[]>([]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: "startDate",
        direction: "asc",
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const PAGE_SIZES = [10, 20, 30, 50, 100];

    useEffect(() => {
        dispatch(setPageTitle("My Leaves"));
        fetchLeavesForStaff();
    }, []);

    const fetchLeavesForStaff = async () => {
        try {
            const token = Cookies.get("accessToken");
            if (!token) return;

            const decoded: DecodedToken = jwtDecode(token);
            const staffId = decoded.id;
            if (!staffId) return;

            const response = await getAllLeavesByStaff(staffId);
            const data = response.data?.data || [];
            console.log("🚀 ~ fetchLeavesForStaff ~ data:", data)
            setLeaves(data);
            setRecords(sortBy(data, "startDate"));
        } catch (error) {
            console.error("Error fetching staff leaves:", error);
        }
    };

    // Sorting
    useEffect(() => {
        const sorted = sortBy(leaves, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === "desc" ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus]);

    // Pagination
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(leaves.slice(from, to));
    }, [page, pageSize, leaves]);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Dashboard", to: "/", icon: <IconHome /> },
        { label: "My Leaves", icon: <IconBox /> },
    ];

    return (
        <div>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <NavLink
                            to="/admin/staff-leave/add"
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <IconPlus />
                            Apply Leave
                        </NavLink>
                    </div>
                </div>
            </div>

            <div className="datatables pagination-padding">
                <DataTable
                    className="whitespace-nowrap table-hover"
                    records={records}
                    columns={[
                        {
                            accessor: "startDate",
                            title: "Start Date",
                            sortable: true,
                            render: ({ startDate }) => dayjs(startDate).format("DD-MM-YYYY"),
                        },
                        {
                            accessor: "endDate",
                            title: "End Date",
                            sortable: true,
                            render: ({ endDate }) => dayjs(endDate).format("DD-MM-YYYY"),
                        },
                        {
                            accessor: "leaveType",
                            title: "Leave Type",
                            sortable: true,
                        },
                        {
                            accessor: "reason",
                            title: "Reason",
                            sortable: true,
                        },
                        {
                            accessor: "status",
                            title: "Status",
                            sortable: true,
                            render: ({ status }) => {
                                const color =
                                    status === "Approved"
                                        ? "success"
                                        : status === "Rejected"
                                            ? "danger"
                                            : status === "Pending"
                                                ? "warning"
                                                : "secondary";
                                return <span className="text-md text-red-600 font-semibold">{status}</span>;
                            },
                        },
                        {
                            accessor: "reason",
                            title: "Reason for leave rejection",
                            sortable: true,
                            render: ({ reason, status, rejectionReason }) => (
                                <div className="space-y-1">
                                   

                                    {status === "Rejected" && rejectionReason && (
                                        <span className="text-md text-red-600 font-semibold">
                                             {rejectionReason}
                                        </span>
                                    )}
                                </div>
                            ),
                        },

                        {
                            accessor: "actions",
                            title: "Actions",
                            textAlignment: "center",
                            render: ({ _id, status }) => (
                                <div className="flex gap-4 justify-center">
                                    {status !== "Approved" && (
                                        <NavLink
                                            to={`/admin/staff-leave/edit/${_id}`} // Pass leaveId in params
                                            className="hover:text-info"
                                        >
                                            <IconEdit />
                                        </NavLink>
                                    )}
                                </div>
                            ),
                        }


                    ]}
                    totalRecords={leaves.length}
                    recordsPerPage={pageSize}
                    page={page}
                    onPageChange={setPage}
                    recordsPerPageOptions={PAGE_SIZES}
                    onRecordsPerPageChange={setPageSize}
                    sortStatus={sortStatus}
                    onSortStatusChange={setSortStatus}
                    highlightOnHover
                    paginationText={({ from, to, totalRecords }) =>
                        `Showing ${from} to ${to} of ${totalRecords} entries`
                    }
                />
            </div>
        </div>
    );
};

export default AllLeavesForStaff;
