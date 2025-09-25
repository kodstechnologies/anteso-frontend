import React from 'react';
import Logo from '../../assets/logo/logo-sm.png';

const PayslipPrint = () => {
    const employee = {
        name: 'Guru Kumar',
        id: 'emp012',
        designation: 'Technician',
        doj: '21-09-2014',
        payPeriod: 'June-2025',
        payDate: '30/06/2020',
        pfNumber: 'AA/AAA/0000000/0000000',
        uan: '101010101010',
        netPay: 127720,
        paidDays: 28,
        lopDays: 3,
        incentive: 15000, 

    };

    const earnings = [
        ['Basic', 60000, 60000],
        ['House Rent Allowance', 60000, 60000],
        ['Leave Encashment', 0, 0],
        ['Variable Pay', 0, 0],
    ];

    const deductions = [
        ['Income Tax', 22130, 265554],
    ];

    const claims = [
        ['Medical Claim', 1250, 1250],
        ['Fuel Claim', 4000, 40000],
     
    ];

    const format = (num: number) =>
        `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const sum = (arr: any[]) => arr.reduce((acc, [, val]) => acc + val, 0);

    return (
        <div className="w-full min-h-screen bg-gray-50 px-8 absolute top-0 left-0 z-50 lg:px-[15%]">

            <div className="w-full bg-white px-4 sm:px-6 md:px-8 py-4 text-[11px] sm:text-xs">
                <div className="max-w-[794px] mx-auto border border-black p-4">

                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                        <img src={Logo} alt="Logo" className="h-10 w-auto" />
                        <div className="text-right font-semibold">
                            Payslip for the Month of {employee.payPeriod}
                        </div>
                    </div>

                    {/* Employee Info */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <p><strong>Name:</strong> {employee.name}</p>
                        <p><strong>Net Pay:</strong> {format(employee.netPay)}</p>
                        <p><strong>Designation:</strong> {employee.designation}</p>
                        <p><strong>Paid Days:</strong> {employee.paidDays} | <strong>LOP:</strong> {employee.lopDays}</p>
                        <p><strong>Joining Date:</strong> {employee.doj}</p>
                        <p><strong>Pay Period:</strong> {employee.payPeriod}</p>
                        <p><strong>Pay Date:</strong> {employee.payDate}</p>
                        <p><strong>PF Number:</strong> {employee.pfNumber}</p>
                        <p><strong>UAN:</strong> {employee.uan}</p>
                        <p><strong>Incentive:</strong> {format(employee.incentive)}</p>
                    </div>


                    {/* Earnings Table */}
                    <div className="mt-4">
                        <h3 className="font-bold text-blue-600 mb-1">EARNINGS</h3>
                        <table className="w-full border border-collapse">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border px-1 py-1 text-left">Component</th>
                                    <th className="border px-1 py-1 text-right">Amount</th>
                                    <th className="border px-1 py-1 text-right">YTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map(([label, amount, ytd], idx) => (
                                    <tr key={idx}>
                                        <td className="border px-1 py-1">{label}</td>
                                        <td className="border px-1 py-1 text-right">{amount}</td>
                                        <td className="border px-1 py-1 text-right">{ytd}</td>
                                    </tr>
                                ))}
                                <tr className="font-semibold bg-gray-50">
                                    <td className="border px-1 py-1">Gross Earnings</td>
                                    <td className="border px-1 py-1 text-right" colSpan={2}>{format(sum(earnings))}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Deductions Table */}
                    <div className="mt-4">
                        <h3 className="font-bold text-blue-600 mb-1">DEDUCTIONS</h3>
                        <table className="w-full border border-collapse">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border px-1 py-1 text-left">Deduction</th>
                                    <th className="border px-1 py-1 text-right">Amount</th>
                                    <th className="border px-1 py-1 text-right">YTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deductions.map(([label, amount, ytd], idx) => (
                                    <tr key={idx}>
                                        <td className="border px-1 py-1">{label}</td>
                                        <td className="border px-1 py-1 text-right">{amount}</td>
                                        <td className="border px-1 py-1 text-right">{ytd}</td>
                                    </tr>
                                ))}
                                <tr className="font-semibold bg-gray-50">
                                    <td className="border px-1 py-1">Total Deductions</td>
                                    <td className="border px-1 py-1 text-right" colSpan={2}>{format(sum(deductions))}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Expense Claims Table */}
                    {/* <div className="mt-4">
                        <h3 className="font-bold text-blue-600 mb-1">EXPENSE CLAIMS</h3>
                        <table className="w-full border border-collapse">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border px-1 py-1 text-left">Claim</th>
                                    <th className="border px-1 py-1 text-right">Amount</th>
                                    <th className="border px-1 py-1 text-right">YTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {claims.map(([label, amount, ytd], idx) => (
                                    <tr key={idx}>
                                        <td className="border px-1 py-1">{label}</td>
                                        <td className="border px-1 py-1 text-right">{amount}</td>
                                        <td className="border px-1 py-1 text-right">{ytd}</td>
                                    </tr>
                                ))}
                                <tr className="font-semibold bg-gray-50">
                                    <td className="border px-1 py-1">Total Claims</td>
                                    <td className="border px-1 py-1 text-right" colSpan={2}>{format(sum(claims))}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div> */}

                    {/* Footer */}
                    <div className="mt-4 text-right text-sm font-bold">
                        Net Pay: {format(employee.netPay)}
                    </div>
                    <p className="text-center mt-2 italic">Total Net Payable {format(employee.netPay)} (Rupees one lakh seventeen thousand seven hundred twenty only)</p>

                    <div className="text-center text-[10px] text-gray-500 mt-4 border-t pt-2">
                        This is a system generated payslip and does not require a signature.
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

    );
};

export default PayslipPrint;
