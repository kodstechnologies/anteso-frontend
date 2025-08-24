import { lazy } from 'react';
import AdminDashboard from '../pages/Admin/Dashboard';
import AdminProtected from '../components/Protected/AdminProtected';
import Login from '../pages/Login';
import State from '../pages/Admin/Master/State';
import City from '../pages/Admin/Master/City';
import Item from '../pages/Admin/Master/Item';
import Clients from '../pages/Admin/Master/Clients';
import Engineers from '../pages/Admin/Master/Employee';
import Tools from '../pages/Admin/Master/Tools';
// import DealersAndManufacturers from '../pages/Admin/Master/DealersAndManufacturers';
import Services from '../pages/Admin/Master/Services';
import CourierCompanies from '../pages/Admin/Master/CourierCompanies';
import AddState from '../components/Admin/Master/State/Add';
import EditState from '../components/Admin/Master/State/Edit';
import AddCity from '../components/Admin/Master/City/Add';
import EditCity from '../components/Admin/Master/City/Edit';
import AddItem from '../components/Admin/Master/Items/Add';
import EditItem from '../components/Admin/Master/Items/Edit';
import ViewClient from '../components/Admin/Master/Clients/View';
import AddClient from '../components/Admin/Master/Clients/Add';
import EditClient from '../components/Admin/Master/Clients/Edit';
import AddEngineer from '../components/Admin/Master/Employee/Add';
import EditEngineer from '../components/Admin/Master/Employee/Edit';
import AddTool from '../components/Admin/Master/Tools/Add';
import EditTool from '../components/Admin/Master/Tools/Edit';
import ViewTool from '../components/Admin/Master/Tools/View';
import AddDealerAndManufacturer from '../components/Admin/Master/DealersAndManufacturers/Add';
import EditDealerAndManufacturer from '../components/Admin/Master/DealersAndManufacturers/Edit';
import AddServices from '../components/Admin/Master/Services/Add';
import EditServices from '../components/Admin/Master/Services/Edit';
import AddCourierCompanie from '../components/Admin/Master/CourierCompanies/Add';
import EditCourierCompanie from '../components/Admin/Master/CourierCompanies/Edit';
import Enquiry from '../pages/Admin/Enquiry';
import AddEnquiry from '../components/Admin/Enquiry/Add';
import EditEnquiry from '../components/Admin/Enquiry/Edit';
import ViewEnquiry from '../components/Admin/Enquiry/View';
import EnquriryForm from '../pages/form_link/EnquriryForm';
import OrderForm from '../pages/form_link/OrderForm';
// import Quotation from '../pages/quotation/Quotation';
import AddQuotation from '../components/Admin/Quotation/Add';
import ViewQuotation from '../components/Admin/Quotation/View';
import Quotation from '../pages/Admin/Quotation';
import AddDealer from '../components/Admin/Master/Dealers/Add';
import EditDealer from '../components/Admin/Master/Dealers/Edit';
import ViewDealer from '../components/Admin/Master/Dealers/View'
import Dealers from '../pages/Admin/Master/Dealer';
import Manufacturers from '../pages/Admin/Master/Manufacturer';
import AddManufacture from '../components/Admin/Master/Manufactures/Add';
import EditManufacture from '../components/Admin/Master/Manufactures/Edit';
import ViewManufacture from "../components/Admin/Master/Manufactures/View"
import HRMS from '../pages/Admin/HRMS';
import ViewHrms from '../components/Admin/Hrms/View';
import ViewEmployee from '../components/Admin/Master/Employee/View';
import Employee from '../pages/Admin/Master/Employee';
import Leaves from '../pages/Admin/Master/leaves';
import AddLeave from '../components/Admin/Master/Leave/Add';
import EditLeave from '../components/Admin/Master/Leave/Edit'
import AddExpenses from '../components/Admin/Master/Expense/Add'
import EditExpenses from '../components/Admin/Master/Expense/Edit'
import Expenses from '../pages/Admin/Master/expenses'
import ViewLeave from '../components/Admin/Master/Leave/View'
import ViewExpenses from '../components/Admin/Master/Expense/View'

//orders
import Orders from '../pages/Admin/Orders';
import EditOrder from '../components/Admin/Orders/Edit'
import ViewOrder from '../components/Admin/Orders/View'
import CreateOrder from '../components/Admin/Orders/Create'

//payments
import Payments from '../pages/Admin/Master/Payments';
import AddPayment from '../components/Admin/Accounts/Payments/Add'
import EditPayment from '../components/Admin/Accounts/Payments/Edit'
import ViewPayment from '../components/Admin/Accounts/Payments/View'


//Invoice
import Invoice from '../pages/Admin/Master/Invoice';
import AddInvoice from '../components/Admin/Accounts/Invoice/Add'
import EditInvoice from '../components/Admin/Accounts/Invoice/Edit'
import ViewInvoice from '../components/Admin/Accounts/Invoice/View'
import InvoicePage from '../components/Admin/Accounts/Invoice/InvoicePage';

import InvoiceDealer from '../components/Admin/Accounts/Invoice/InvoiceDealer'
import ViewAdvanceManagement from '../components/Admin/Hrms/ViewAdvanceManagement';
import ViewEmployeeDetailsLeaveManagement from '../components/Admin/Hrms/ViewLeaveManagement';
import ViewSalaryManagement from '../components/Admin/Hrms/ViewSalaryManagement';
import AdvanceManagement from '../pages/Admin/Master/AdvancedManagement';
import SalaryManagement from '../pages/Admin/Master/SalaryManagement';


//Staff routes
import StaffProtected from '../components/Protected/StaffProtected';
import StaffDashboard from '../pages/OfficeStaff/Dashboard'

//courier companies
import ViewCourierCompany from '../components/Admin/Master/CourierCompanies/View'

//add hospital rso institute by id
import AddHospital from '../components/Admin/Master/Clients/AddHospital';
import AddRso from '../components/Admin/Master/Clients/AddRso';
import AddInstitute from '../components/Admin/Master/Clients/AddInstitute';


//edit hospital,rso,institute
import EditHospital from '../components/Admin/Master/Clients/EditHospital'
import EditInstitute from '../components/Admin/Master/Clients/EditInstitute'
import EditRso from '../components/Admin/Master/Clients/EditRso';

import Payslip from '../pages/Admin/Payslip';

const ContactUsBoxed = lazy(() => import('../pages/Pages/ContactUsBoxed'));
const ContactUsCover = lazy(() => import('../pages/Pages/ContactUsCover'));
const ComingSoonBoxed = lazy(() => import('../pages/Pages/ComingSoonBoxed'));
const ComingSoonCover = lazy(() => import('../pages/Pages/ComingSoonCover'));
const ERROR404 = lazy(() => import('../pages/Pages/Error404'));
const ERROR500 = lazy(() => import('../pages/Pages/Error500'));
const ERROR503 = lazy(() => import('../pages/Pages/Error503'));
const Maintenence = lazy(() => import('../pages/Pages/Maintenence'));
const About = lazy(() => import('../pages/About'));
const Error = lazy(() => import('../components/Error'));

const routes = [
    { path: '/enquiry_form', element: <EnquriryForm /> },
    { path: '/order_form', element: <OrderForm /> },
    // { path: '/quotation', element: <Quotation /> },
    // dashboard
    {
        path: '/',
        element: (
            <AdminProtected>
                <AdminDashboard />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/state',
        element: (
            <AdminProtected>
                <State />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/state/add',
        element: (
            <AdminProtected>
                <AddState />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/state/edit',
        element: (
            <AdminProtected>
                <EditState />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/city',
        element: (
            <AdminProtected>
                <City />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/city/add',
        element: (
            <AdminProtected>
                <AddCity />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/city/edit',
        element: (
            <AdminProtected>
                <EditCity />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/items',
        element: (
            <AdminProtected>
                <Item />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/items/add',
        element: (
            <AdminProtected>
                <AddItem />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/items/edit',
        element: (
            <AdminProtected>
                <EditItem />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/clients',
        element: (
            // <AdminProtected>
            <Clients />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/clients/preview/:clientId',
        element: (
            // <AdminProtected>
            <ViewClient />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/clients/preview/:clientId/:hospitalId',
        element: (
            // <AdminProtected>
            <AddHospital />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/clients/preview/:clientId/:hospitalId/add-rso',
        element: (
            // <AdminProtected>
            <AddRso />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/clients/preview/:clientId/:hospitalId/add-institute',
        element: (
            // <AdminProtected>
            <AddInstitute />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/clients/preview/:clientId/edit-hospital/:hospitalId',
        element: (
            // <AdminProtected>
            <EditHospital />
            // </AdminProtected>
        ),
    },

    {
        path: '/admin/clients/preview/:clientId/edit-institute/:instituteId',
        element: (
            // <AdminProtected>
            <EditInstitute />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/clients/preview/:clientId/edit-rso/:rsoId',
        element: (
            // <AdminProtected>
            <EditRso />
            // </AdminProtected>
        ),
    },
    //dummy msg
    //dummy msg part 2
    {
        path: '/admin/clients/add',
        element: (
            <AdminProtected>
                <AddClient />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/clients/edit/:id',
        element: (
            <AdminProtected>
                <EditClient />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/employee',
        element: (
            <AdminProtected>
                <Employee />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/employee/add',
        element: (
            <AdminProtected>
                <AddEngineer />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/employee/edit/:id',
        element: (
            <AdminProtected>
                <EditEngineer />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/employee/view/:id',
        element: (
            <AdminProtected>
                <ViewEmployee />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/leave',
        element: (
            // <AdminProtected>
            <Leaves />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/leave/view/:id',
        element: (
            <AdminProtected>
                <ViewLeave />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/leave/add',
        element: (
            <AdminProtected>
                <AddLeave />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/leave/edit/:id',
        element: (
            <AdminProtected>
                <EditLeave />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/expenses',
        element: (
            <AdminProtected>
                <Expenses />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/expenses/add',
        element: (
            <AdminProtected>
                <AddExpenses />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/expenses/view',
        element: (
            <AdminProtected>
                <ViewExpenses />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/expenses/edit',
        element: (
            <AdminProtected>
                <EditExpenses />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/tools',
        element: (
            <AdminProtected>
                <Tools />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/tools/view/:id',
        element: (
            <AdminProtected>
                <ViewTool />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/tools/add',
        element: (
            <AdminProtected>
                <AddTool />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/tools/edit/:id',
        element: (
            <AdminProtected>
                <EditTool />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/dealer',
        element: (
            // <AdminProtected>
            <Dealers />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/dealer/view',
        element: (
            <AdminProtected>
                <ViewDealer />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/dealer/add',
        element: (
            <AdminProtected>
                <AddDealer />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/dealer/edit',
        element: (
            <AdminProtected>
                <EditDealer />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/manufacture',
        element: (
            // <AdminProtected>
            <Manufacturers />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/manufacture/view',
        element: (
            <AdminProtected>
                <ViewManufacture />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/manufacture/add',
        element: (
            <AdminProtected>
                <AddManufacture />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/manufacture/edit',
        element: (
            <AdminProtected>
                <EditManufacture />
            </AdminProtected>
        ),
    },
    // {
    //     path: '/admin/dealer-and-manufacture',
    //     element: (
    //         <AdminProtected>
    //             <DealersAndManufacturers />
    //         </AdminProtected>
    //     ),
    // },
    // {
    //     path: '/admin/dealer-and-manufacture/add',
    //     element: (
    //         <AdminProtected>
    //             <AddDealerAndManufacturer />
    //         </AdminProtected>
    //     ),
    // },
    // {
    //     path: '/admin/dealer-and-manufacture/edit',
    //     element: (
    //         <AdminProtected>
    //             <EditDealerAndManufacturer />
    //         </AdminProtected>
    //     ),
    // },
    {
        path: '/admin/services',
        element: (
            <AdminProtected>
                <Services />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/services/add',
        element: (
            <AdminProtected>
                <AddServices />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/services/edit',
        element: (
            <AdminProtected>
                <EditServices />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/courier-companies',
        element: (
            // <AdminProtected>
            <CourierCompanies />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/courier-companies/view/:id',
        element: (
            <AdminProtected>
                <ViewCourierCompany />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/courier-companies/add',
        element: (
            <AdminProtected>
                <AddCourierCompanie />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/courier-companies/edit/:id',
        element: (
            <AdminProtected>
                <EditCourierCompanie />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/enquiry',
        element: (
            // <AdminProtected>
            <Enquiry />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/enquiry/add',
        element: (
            <AdminProtected>
                <AddEnquiry />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/enquiry/edit',
        element: (
            <AdminProtected>
                <EditEnquiry />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/enquiry/view/:id',
        element: (
            <AdminProtected>
                <ViewEnquiry />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/quotation',
        element: (
            <AdminProtected>
                <Quotation />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/quotation/view/:id',
        element: (
            <AdminProtected>
                <ViewQuotation />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/quotation/add/:id',
        element: (
            <AdminProtected>
                <AddQuotation />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/orders/view/:orderId',
        element: (
            <AdminProtected>
                <ViewOrder />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/orders/edit',
        element: (
            <AdminProtected>
                <EditOrder />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/orders',
        element: (
            // <AdminProtected>
            <Orders />
            // </AdminProtected>
        ),
    },
    {
        path: '/admin/orders/create',
        element: (
            <AdminProtected>
                <CreateOrder />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/payments',
        element: (
            <AdminProtected>
                <Payments />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/payments/add',
        element: (
            <AdminProtected>
                <AddPayment />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/payments/edit/:id',
        element: (
            <AdminProtected>
                <EditPayment />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/payments/view/:id',
        element: (
            <AdminProtected>
                <ViewPayment />
            </AdminProtected>
        ),
    },

    {
        path: '/admin/invoice',
        element: (
            <AdminProtected>
                <Invoice />
            </AdminProtected>
        ),
    },

    {
        path: '/admin/hrms/leave-management',
        element: (
            <AdminProtected>
                <HRMS />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/hrms/leave-management-view',
        element: (
            <AdminProtected>
                <ViewEmployeeDetailsLeaveManagement />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/hrms/trip-management',
        element: (
            <AdminProtected>
                <AdvanceManagement />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/hrms/trip-management-view/:id',
        element: (
            <AdminProtected>
                <ViewAdvanceManagement />
            </AdminProtected>
        ),
    },

    {
        path: '/admin/hrms/salary-management',
        element: (
            <AdminProtected>
                <SalaryManagement />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/hrms/salary-management-view',
        element: (
            <AdminProtected>
                <ViewSalaryManagement />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/hrms/attendance-summary',
        element: (
            <AdminProtected>
                <HRMS />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/hrms/attendance-summary-view',
        element: (
            <AdminProtected>
                <ViewEmployeeDetailsLeaveManagement />
            </AdminProtected>
        ),
    },
    // {
    //     path: '/admin/hrms/trip-management',
    //     element: (
    //         <AdminProtected>
    //             <SalaryManagement />
    //         </AdminProtected>
    //     ),
    // },
    {
        path: '/admin/hrms/trip-management-view',
        element: (
            <AdminProtected>
                <ViewSalaryManagement />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/invoice/viewInvoice',
        element: (
            <AdminProtected>
                <InvoiceDealer />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/invoice/add',
        element: (
            <AdminProtected>
                <AddInvoice />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/invoice/view/:id',
        element: (
            <AdminProtected>
                <ViewInvoice />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/invoice/edit/:id',
        element: (
            <AdminProtected>
                <EditInvoice />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/hrms',
        element: (
            <AdminProtected>
                <HRMS />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/hrms/payslip',
        element: (
            <AdminProtected>
                <Payslip />
            </AdminProtected>
        ),
    },
    {
        path: '/admin/hrms/view',
        element: (
            <AdminProtected>
                <ViewHrms />
            </AdminProtected>
        ),
    },

    {
        path: '/admin/hrms/view',
        element: (
            <AdminProtected>
                <ViewHrms />
            </AdminProtected>
        ),
    },
    {
        path: '/staff/clients',
        element: (
            <StaffProtected>
                <Clients />
            </StaffProtected>
        )
    },
    {
        path: '/staff/add-client',
        element: (
            <StaffProtected>
                <AddClient />
            </StaffProtected>
        )
    },
    {
        path: '/staff/edit-client',
        element: (
            <StaffProtected>
                <EditClient />
            </StaffProtected>
        )
    },
    {
        path: '/staff/view-client',
        element: (
            <StaffProtected>
                <ViewClient />
            </StaffProtected>
        )
    },
    {
        path: '/staff',
        element: (
            // <StaffProtected>
            <StaffDashboard />
            // </StaffProtected>
        )
    },
    {
        path: '/staff/enquiry',
        element: (
            // <StaffProtected>
            <Enquiry />
            // </StaffProtected>
        )
    },

    // pages
    {
        path: '/pages/contact-us-boxed',
        element: <ContactUsBoxed />,
        layout: 'blank',
    },
    {
        path: '/pages/contact-us-cover',
        element: <ContactUsCover />,
        layout: 'blank',
    },
    {
        path: '/pages/coming-soon-boxed',
        element: <ComingSoonBoxed />,
        layout: 'blank',
    },
    {
        path: '/pages/coming-soon-cover',
        element: <ComingSoonCover />,
        layout: 'blank',
    },
    {
        path: '/pages/error404',
        element: <ERROR404 />,
        layout: 'blank',
    },
    {
        path: '/pages/error500',
        element: <ERROR500 />,
        layout: 'blank',
    },
    {
        path: '/pages/error503',
        element: <ERROR503 />,
        layout: 'blank',
    },
    {
        path: '/pages/maintenence',
        element: <Maintenence />,
        layout: 'blank',
    },
    {
        path: '/login',
        element: <Login />,
        layout: 'blank',
    },
    {
        path: '/about',
        element: <About />,
        layout: 'blank',
    },
    {
        path: '*',
        element: <Error />,
        layout: 'blank',
    },
];

export { routes };
