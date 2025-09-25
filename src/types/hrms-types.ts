export interface AttendanceEntry {
  date: Date
  status: "Present" | "Absent" | "Sick Leave"
}

export interface PaymentData {
  basicPay: number
  travelAllowance: number
  otherAllowances: number
}

export interface Employee {
  empId: string
  name: string
  email: string
  address: string
  phone: string
  business: string
  gstNo: string
  designation: string
  department: string
  joinDate: string
  workingDay: string
}

// export interface Expense {
//   id: string
//   title: string
//   amount: number
//   date: Date
//   category: string
//   type: string
// }
export interface Expense {
  id: string
  name: string
  email:string
  address: string
  phone: string
  business: string
  tripname: string
  tripStartDate: string
  tripEndDate: string
  gstNo: string
  designation: string
  title: string
  amount: number
}

export interface Salary {
  id: string
  date: Date
  month: string
  fixed: number
  incentive: number
}

export interface LeaveRequest {
  id: string
  startDate: Date
  endDate: Date
  leaveType: string
  reason: string
  status: "Pending" | "Approved" | "Rejected"
}
