"use client"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { getDetailsById } from "../../api"
import antesoLogo from "../../assets/logo/logo-sm.png";
import { Printer } from "lucide-react";

type Employee = {
    id: string
    name: string
    email: string
    phone: number
    designation: string
    department: string
}

type Salary = {
    id: string
    date: string
    basicSalary: number
    incentive: number
    leaveWithoutPayDays?: number
    leaveDeduction?: number
    totalSalary: number
    status: "Pending" | "Processed" | "Paid"
    month: number
    year: number
}

const PayslipPrint = () => {
    const { salaryId } = useParams<{ salaryId: string }>()
    const [salary, setSalary] = useState<Salary | null>(null)
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!salaryId) return
        fetchPayslip(salaryId)
    }, [salaryId])

    const fetchPayslip = async (id: string) => {
        try {
            setLoading(true)
            const res: any = await getDetailsById(id)
            if (res?.data?.data) {
                setSalary(res.data.data.salary)
                setEmployee(res.data.data.employee)
            }
        } catch (error: any) {
            console.error(error)
            alert(error.message || "Failed to fetch payslip")
        } finally {
            setLoading(false)
        }
    }

    const format = (num: number) =>
        `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

    if (loading) return <p className="text-center py-8 text-gray-600">Loading payslip...</p>
    if (!salary || !employee) return <p className="text-center py-8 text-red-500">No payslip data available</p>

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[salary.month - 1];

    return (
        <>
            {/* Print-specific styles */}
            {/* Print-specific styles */}
            <style>{`
    @media print {
        @page {
            margin: 0.5cm;
            size: A4;
        }
        body {
            margin: 0;
            padding: 0;
        }
        .print\\:hidden {
            display: none !important;
        }
        .no-print {
            display: none !important;
        }
        .print-container {
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 794px !important;
            box-shadow: none !important;
            border: 2px solid #1f2937 !important;
        }
        .print-container > div {
            page-break-inside: avoid;
        }
    }
`}</style>


            <div className="w-full min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-[15%] py-4">
                <div className="w-full bg-white text-xs sm:text-sm print-container">
                    <div className="max-w-[794px] mx-auto border-2 border-gray-800 p-6 shadow-lg">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-gray-800 pb-4 mb-4">
                            <div className="mb-4 sm:mb-0">
                                <img src={antesoLogo} alt="Anteso Logo" className="h-12 w-auto" />
                            </div>
                            <div className="text-center sm:text-right">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                                    Salary Payslip
                                </h1>
                                <p className="text-gray-600 font-medium">
                                    For the Month of {monthName} {salary.year}
                                </p>
                            </div>
                        </div>

                        {/* Employee Details Table */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                                Employee Information
                            </h3>
                            <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                                <tbody>
                                    <tr className="border-b border-gray-300">
                                        <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">Employee Name:</td>
                                        <td className="border border-gray-300 px-3 py-2">{employee.name}</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">Designation:</td>
                                        <td className="border border-gray-300 px-3 py-2">{employee.designation}</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">Department:</td>
                                        <td className="border border-gray-300 px-3 py-2">{employee.department}</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">Email:</td>
                                        <td className="border border-gray-300 px-3 py-2">{employee.email}</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">Phone:</td>
                                        <td className="border border-gray-300 px-3 py-2">{employee.phone}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Salary Breakdown Table */}
                        {/* Salary Breakdown Table */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                                Salary Breakdown
                            </h3>
                            <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                                            Particulars
                                        </th>
                                        <th className="border border-gray-300 px-3 py-2 text-right font-semibold">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-300">
                                        <td className="border border-gray-300 px-3 py-2">Basic Salary</td>
                                        <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                                            {format(salary.basicSalary)}
                                        </td>
                                    </tr>

                                    {/* ✅ Show Incentive only if it’s greater than 0 */}
                                    {salary.incentive && salary.incentive > 0 ? (
                                        <tr className="border-b border-gray-300">
                                            <td className="border border-gray-300 px-3 py-2">Incentive</td>
                                            <td className="border border-gray-300 px-3 py-2 text-right">
                                                {format(salary.incentive)}
                                            </td>
                                        </tr>
                                    ) : null}

                                    {/* ✅ Show Leave Without Pay Days only if present and > 0 */}
                                    {salary.leaveWithoutPayDays && salary.leaveWithoutPayDays > 0 ? (
                                        <tr className="border-b border-gray-300">
                                            <td className="border border-gray-300 px-3 py-2">Leave Without Pay Days</td>
                                            <td className="border border-gray-300 px-3 py-2 text-right">
                                                ({salary.leaveWithoutPayDays} days)
                                            </td>
                                        </tr>
                                    ) : null}

                                    <tr className="border-b border-gray-300">
                                        <td className="border border-gray-300 px-3 py-2">Leave Deduction</td>
                                        <td className="border border-gray-300 px-3 py-2 text-right text-red-600">
                                            -{format(salary.leaveDeduction || 0)}
                                        </td>
                                    </tr>

                                    <tr className="border-2 border-gray-800 bg-gray-50">
                                        <td className="border border-gray-800 px-3 py-2 font-bold">Net Total Salary</td>
                                        <td className="border border-gray-800 px-3 py-2 text-right font-bold text-lg">
                                            {format(salary.totalSalary)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>


                        {/* Company Details Footer */}
                        <div className="border-t-2 border-gray-800 pt-4 text-center text-xs text-gray-600">
                            <p className="mb-1"><strong>ANTESO Biomedical OPC Pvt. Ltd.</strong></p>
                            <p className="mb-1">Flat No 290, 2nd Floor, Block D, Pocket 7, Sec 6, Rohini, New Delhi-110085</p>
                            <p className="mb-1">Email: accounts@antesobiomedicalopc.com | Mobile: 8470909720, 8274394720</p>
                            <p className="text-xs italic">This is a computer-generated payslip and requires no signature.</p>
                        </div>

                        {/* Print Button - Hidden on Print */}
                        <div className="flex justify-end mt-6 print:hidden no-print">
                            <button
                                onClick={() => window.print()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2"
                            >
                                <Printer className="h-4 w-4" />
                                Print Payslip
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PayslipPrint