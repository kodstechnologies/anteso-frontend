"use client"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { getDetailsById } from "../../api"

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
    console.log("🚀 ~ PayslipPrint ~ salaryId:", salaryId)
    const [salary, setSalary] = useState<Salary | null>(null)
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!salaryId) return // Prevent API call if undefined
        fetchPayslip(salaryId)
    }, [salaryId])

    const fetchPayslip = async (id: string) => {
        try {
            setLoading(true)
            const res: any = await getDetailsById(id)
            console.log("🚀 ~ fetchPayslip ~ res:", res)
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

    if (loading) return <p>Loading payslip...</p>
    if (!salary || !employee) return <p>No payslip data available</p>

    return (
        <div className="w-full min-h-screen bg-gray-50 px-8 lg:px-[15%]">
            <div className="w-full bg-white px-4 sm:px-6 md:px-8 py-4 text-[11px] sm:text-xs">
                <div className="max-w-[794px] mx-auto border border-black p-4">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                        <h2 className="font-semibold">
                            Payslip for the Month of {salary.month}-{salary.year}
                        </h2>
                    </div>

                    {/* Employee Info */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <p><strong>Name:</strong> {employee.name}</p>
                        <p><strong>Designation:</strong> {employee.designation}</p>
                        <p><strong>Department:</strong> {employee.department}</p>
                        <p><strong>Basic Salary:</strong> {format(salary.basicSalary)}</p>
                        <p><strong>Incentive:</strong> {format(salary.incentive)}</p>
                        <p><strong>Leave Deduction:</strong> {format(salary.leaveDeduction || 0)}</p>
                        <p><strong>Total Salary:</strong> {format(salary.totalSalary)}</p>
                        <p><strong>Status:</strong> {salary.status}</p>
                    </div>

                    {/* Print Button */}
                    <div className="flex justify-end mt-4 print:hidden">
                        <button
                            onClick={() => window.print()}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1 rounded"
                        >
                            Print Payslip
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PayslipPrint
