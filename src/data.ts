import Employee from "./pages/Admin/Master/Employee";
import Payment from '/assets/images/payment.png'

export const citiesData = [
    {
        id: 1,
        cityName: 'Bangalore',
        stateName: 'Karnataka',
        status: { tooltip: 'Active', color: 'success' },
    },
    {
        id: 2,
        cityName: 'Mysure',
        stateName: 'Karnataka',
        status: { tooltip: 'Deactive', color: 'danger' },
    },
];
export const statesData = [
    {
        id: 1,
        stateName: 'Karnataka',
        status: { tooltip: 'Active', color: 'success' },
    },
    {
        id: 2,
        stateName: 'Odisha',
        status: { tooltip: 'Deactive', color: 'danger' },
    },
];
export const itemsData = [
    {
        id: 1,
        name: 'MRI',
        hsnCode: 'HA123',
        price: '10000',
        status: { tooltip: 'Active', color: 'success' },
    },
    {
        id: 2,
        name: 'XYZ',
        hsnCode: 'HAL123',
        price: '15000',
        status: { tooltip: 'Deactive', color: 'danger' },
    },
];
export const clientsData = [
    {
        id: 1,
        // cID:'c001',
        name: 'Client 1',
        email: 'client1@gmail.com',
        address: 'Hsr layout, Bangalore, Karnataka',
        phone: '9876576876',
        business: 'Business Name',
        gstNo: 'AX123',
        rsoId: 'RSO001',
        password: 'rso@1234',
        rsoemail: 'rso.northzone@example.com',
        rsophone: '998895690',
        rpId: 'RP1001',
        tldBadge: ' TLD-NZ-001',
        validity: '2025-12-31',
        fileUpload: ''
    },
    {
        id: 2,
        name: 'Client 2',
        email: 'client2@gmail.com',
        address: 'Majestic, Bangalore, Karnataka',
        phone: '9877876876',
        business: 'Business Name',
        gstNo: 'AX223',
        rsoId: 'RSO001',
        password: 'rso@1234',
        rsoemail: 'rso.northzone@example.com',
        rsophone: '998895690',
        rpId: 'RP1001',
        tldBadge: ' TLD-NZ-001',
        validity: '2025-12-31'
    },
];
export const expenseData = [
    {
        id: 1,
        title: "Team Lunch",
        category: "Operations",
        amount: 1400,
    },
    {
        id: 2,
        title: "Team Building",
        category: "Operations",
        amount: 2300,
    }

]
export const hrms = [
    {
        id: 1,
        name: 'Rabi Prasad',
        email: 'client1@gmail.com',
        address: 'HSR Layout, Bangalore, Karnataka',
        phone: '9876576876',
        business: 'Tech Solutions Pvt. Ltd.',
        tripname: 'Delhi Installation',
        tripStartDate: '10/10/2024',
        tripEndDate: '20/10/2024',
        gstNo: 'AX123',
        designation: 'Manager',
        title: 'Office Supplies',
        amount: 45000,
    },
    {
        id: 2,
        name: 'Sita Rani',
        email: 'client2@example.com',
        address: 'Andheri West, Mumbai, Maharashtra',
        phone: '9865432109',
        business: 'Creative Minds Co.',
        tripname: 'Delhi Installation',
        tripStartDate: '10/10/2024',
        tripEndDate: '20/10/2024',
        gstNo: 'BY456',
        designation: 'Creative Director',
        title: 'Office Supplies',
        amount: 82000,
    },
    {
        id: 3,
        name: 'John Dsouza',
        email: 'client3@example.com',
        address: 'Banjara Hills, Hyderabad, Telangana',
        phone: '9123456780',
        business: 'Dsouza Enterprises',
        tripname: 'Delhi Installation',
        tripStartDate: '10/10/2024',
        tripEndDate: '20/10/2024',
        gstNo: 'CZ789',
        designation: 'CEO',
        title: 'Team Lunch',
        amount: 120000,
    }
];
export const salaryManagement = [
    {
        id: 1,
        name: 'Rabi Prasad',
        email: 'client1@gmail.com',
        address: 'HSR Layout, Bangalore, Karnataka',
        phone: '9876576876',
        business: 'Tech Solutions Pvt. Ltd.',
        gstNo: 'AX123',
        designation: 'Manager',
        title: 'Monthly Salary',
        amount: 45000,
        month: 'July',
        total: 52000,
    },
    {
        id: 2,
        name: 'Sita Rani',
        email: 'client2@example.com',
        address: 'Andheri West, Mumbai, Maharashtra',
        phone: '9865432109',
        business: 'Creative Minds Co.',
        gstNo: 'BY456',
        designation: 'Creative Director',
        title: 'Monthly Salary',
        amount: 82000,
        month: 'July',
        total: 89000,
    },
    {
        id: 3,
        name: 'John Dsouza',
        email: 'client3@example.com',
        address: 'Banjara Hills, Hyderabad, Telangana',
        phone: '9123456780',
        business: 'Dsouza Enterprises',
        gstNo: 'CZ789',
        designation: 'CEO',
        title: 'Monthly Salary',
        amount: 120000,
        month: 'July',
        total: 135000,
    }
];


export const hospitaldata = [
    {
        id: 1,
        hname: "Appolo Hospital"
    },
    {
        id: 2,
        hname: "Max health Hospital"
    }
]
export const serviceOptions = [
    'INSTITUTE REGISTRATION',
    'RSO REGISTRATION, NOMINATION & APPROVAL',
    'DECOMMISSIONING, PRE OWNED PROCUREMENT, QA & LICENSE',
    'PROCUREMENT',
    'TLD BADGE',
    'LEAD SHEET',
    'LEAD GLASS',
    'LEAD APRON',
    'THYROID SHIELD',
    'GONAD SHIELD',
    'OTHERS',
]
export const additionalServices=[
    
]

export const institutedata = [
    {
        id: 1,
        eloraID: 'ELR001',
        instPassword: 'Pass@123',
        instEmail: 'info@greenfield.edu',
        instPhone: '+91-9876543210',
    },
]

export const rsodetails = [
    {
        rsoID: 'RSO001',
        rsoPassword: 'Rso@1234',
        rsoEmail: 'rso.northzone@example.com',
        rsoPhone: '+91-9876543210',
        rpID: 'RP1001',
        tldBadge: 'TLD-NZ-001',
        rsoValidity: '2025-12-31'
    },
]

export const equipmentDetails = [
    {
        machineType: 'CT SCAN',
        model: 'HISPEED LXI',
        make: 'GE',
        serialNo: 'YM0625',
        equipID: 'G-XR-213426',
        qaValidity: '21-04-2027',
        licenseValidity: '25-04-2030',
        status: 'working',
        // rawaDataAttachment: 'ATTACHED',
        qaReportAttachment: 'ATTACHED',
        licenceAttachment: 'ATTACHED'
    },
    {
        machineType: 'MRI',
        model: 'Signa Explorer 1.5T',
        make: 'GE',
        serialNo: 'MR8934',
        equipID: 'G-MR-654321',
        qaValidity: '10-11-2026',
        licenseValidity: '15-12-2029',
        status: 'working',
        // rawaDataAttachment: 'ATTACHED',
        qaReportAttachment: 'ATTACHED',
        licenceAttachment: 'ATTACHED'
    },
    {
        machineType: 'X-RAY',
        model: 'DRX-Revolution',
        make: 'Carestream',
        serialNo: 'XR4421',
        equipID: 'C-XR-889977',
        qaValidity: '05-08-2025',
        licenseValidity: '12-09-2028',
        status: 'under maintenance',
        // rawaDataAttachment: 'ATTACHED',
        qaReportAttachment: 'PENDING',
        licenceAttachment: 'ATTACHED'
    }
];


export const engineersData = [
    {
        id: 1,
        name: 'Engineer 1',
        email: 'engineer1@gmail.com',
        phone: '6785436787',
        empId: 'ENG0001',
        role: 'TECHNICIAN',
        tools: ['tool1', 'tool2'],
        status: { tooltip: 'Active', color: 'success' },
    },
    {
        id: 2,
        name: 'Engineer 2',
        email: 'engineer2@gmail.com',
        phone: '7785436787',
        empId: 'ENG0002',
        role: 'TECHNICIAN',
        tools: ['tool10', 'tool2'],
        status: { tooltip: 'Inactive', color: 'danger' },
    },
];

export const leaveData = [
    {
        id: 1,
        startDate: "30/05/2025",
        endDate: "06/06/2025",
        leaveType: "Sick leave",
        reason: "fever and cold",
        status: { tooltip: "approved", color: "success" }

    },
    {
        id: 2,
        startDate: "30/05/2025",
        endDate: "06/06/2025",
        leaveType: "Sick leave",
        reason: "fever and cold",
        status: { tooltip: "pending", color: "danger" }
    }
]
export const toolsData = [
    {
        id: 1,
        nomenclature: 'Digital Multimeter',
        manufacturer: 'Fluke',
        model: '87V',
        srNo: 'FLK87V-001',
        calibrationCertificateNo: 'CAL2023-001',
        calibrationDate: '01-05-2023',
        calibrationValidTill: '01-04-2025',
        range: '0-1000V',
        engineerName: 'Ravi Kashyap',
        issueDate: '26/02/2024',
        submitDate: '26/03/2024',
        toolID: 'T001',
    },
    {
        id: 2,
        nomenclature: 'Oscilloscope',
        manufacturer: 'Keysight',
        model: 'DSOX1204A',
        srNo: 'KEY1204-002',
        calibrationCertificateNo: 'CAL2023-002',
        calibrationDate: '07-05-2023',
        calibrationValidTill: '09-06-2024',
        range: '0-200MHz',
        engineerName: 'Ashish',
        issueDate: '26/02/2024',
        submitDate: '26/03/2024',
        toolID: 'T002',
    },
];
export const dealersAndManufacturers = [
    // {
    //     id: 1,
    //     customerName: 'Customer 1',
    //     city: 'Bangalore',
    //     type: 'Dealer',
    //     machineAndPrice: ['Xerox-8000', 'scanning-5500'],
    // },
    // {
    //     id: 2,
    //     customerName: 'Customer 2',
    //     city: 'Bangalore',
    //     type: 'Dealer',
    //     machineAndPrice: ['MRI-8000'],
    // },
    {
        id: 1,
        hospitalName: 'Apollo Hospitals',
        address: '123 Medical Street, Bangalore',
        contactPersonName: 'Dr. Ramesh Kumar',
        phone: '9876543210',
        email: 'ramesh.kumar@apollo.com',
        procurementNumber: 'PROC-2023-001',
        procurementExpiryDate: '12-09-2024',
        partyCode: 'APL-001',
        branch: 'Bangalore Central',
    },
    {
        id: 2,
        hospitalName: 'Fortis Healthcare',
        address: '456 Health Avenue, Mumbai',
        contactPersonName: 'Dr. Priya Sharma',
        phone: '8765432109',
        email: 'priya.sharma@fortis.com',
        procurementNumber: 'PROC-2023-002',
        procurementExpiryDate: '09-08-2025',
        partyCode: 'FTS-002',
        branch: 'Mumbai West',
    },
];
export const dealers = [
    // {
    //     id: 1,
    //     customerName: 'Customer 1',
    //     city: 'Bangalore',
    //     type: 'Dealer',
    //     machineAndPrice: ['Xerox-8000', 'scanning-5500'],
    // },
    // {
    //     id: 2,
    //     customerName: 'Customer 2',
    //     city: 'Bangalore',
    //     type: 'Dealer',
    //     machineAndPrice: ['MRI-8000'],
    // },
    {
        id: 1,
        dealersName: 'Apollo Hospitals',
        address: '123 Medical Street, Bangalore',
        contactPersonName: 'Dr. Ramesh Kumar',
        // phone: '9876543210',
        // email: 'ramesh.kumar@apollo.com',
        // procurementNumber: 'PROC-2023-001',
        // procurementExpiryDate: '2024-12-31',
        pinCode: 'APL-001',
        region: 'Bangalore Central',
    },
    {
        id: 2,
        dealersName: 'Fortis Healthcare',
        address: '456 Health Avenue, Mumbai',
        contactPersonName: 'Dr. Priya Sharma',
        // phone: '8765432109',
        // email: 'priya.sharma@fortis.com',
        // procurementNumber: 'PROC-2023-002',
        // procurementExpiryDate: '2025-06-30',
        pinCode: 'FTS-002',
        region: 'Mumbai West',
    },
];
export const manufacturers = [
    // {
    //     id: 1,
    //     customerName: 'Customer 1',
    //     city: 'Bangalore',
    //     type: 'Dealer',
    //     machineAndPrice: ['Xerox-8000', 'scanning-5500'],
    // },
    // {
    //     id: 2,
    //     customerName: 'Customer 2',
    //     city: 'Bangalore',
    //     type: 'Dealer',
    //     machineAndPrice: ['MRI-8000'],
    // },
    {
        id: 1,
        manufactureName: 'Apollo Hospitals',
        address: '123 Medical Street, Bangalore',
        contactPersonName: 'Dr. Ramesh Kumar',
        // phone: '9876543210',
        // email: 'ramesh.kumar@apollo.com',
        // procurementNumber: 'PROC-2023-001',
        // procurementExpiryDate: '2024-12-31',
        pinCode: '607-001',
        branch: 'Bangalore Central',
        mouValidity: 'xyz1'
    },
    {
        id: 2,
        manufactureName: 'Fortis Healthcare',
        address: '456 Health Avenue, Mumbai',
        contactPersonName: 'Dr. Priya Sharma',
        // phone: '8765432109',
        // email: 'priya.sharma@fortis.com',
        // procurementNumber: 'PROC-2023-002',
        // procurementExpiryDate: '2025-06-30',
        pinCode: '343-002',
        branch: 'Mumbai West',
        mouValidity: 'xyz2'
    },
];
export const servicesData = [
    {
        id: 1,
        serviceType: 'Type 1',
        serviceName: 'Service Name',
        status: { tooltip: 'Active', color: 'success' },
    },
    {
        id: 2,
        serviceType: 'Type 2',
        serviceName: 'Service Name',
        status: { tooltip: 'Deactive', color: 'danger' },
    },
];
export const courierCompanies = [
    {
        id: 1,
        companyName: 'XYZ',
        status: { tooltip: 'Inactive', color: 'danger' },
    },
    {
        id: 2,
        companyName: 'ABC',
        status: { tooltip: 'Actlive', color: 'success' },
    },
];
// export const enquiriesData = [
//     {
//         id: 1,
//         Hospitalname:"Apollo Hospital",
//         Fulladdress:'123 Medical Street, Health Lane',
//         City:"Bangalore",
//         State:"Karnataka",
//         Pincode:"560001",
//         Contactperson:"Dr. Ramesh Kumar",
//         Email:"ramesh.kumar@apollo.com",
//         Phone:"9876543210",
//         Designation:"Chief Medical Officer",
//         status: 'Accept' ,
//         // urgency: '',
//     },
//     {
//         id: 2,
//         Hospitalname: "Fortis Healthcare",
//         Fulladdress: "456 Wellness Road, Green Park",
//         City: "Delhi",
//         State: "Delhi",
//         Pincode: "110016",
//         Contactperson: "Dr. Anita Sharma",
//         Email: "anita.sharma@fortis.com",
//         Phone: "9123456780",
//         Designation: "Senior Surgeon",
//         status:  "Pending" ,
//     },
//     {
//         id: 3,
//         Hospitalname: "Manipal Hospital",
//         Fulladdress: "789 Recovery Ave, Whitefield",
//         City: "Bangalore",
//         State: "Karnataka",
//         Pincode: "560066",
//         Contactperson: "Dr. Praveen Rao",
//         Email: "praveen.rao@manipal.com",
//         Phone: "9012345678",
//         Designation: "Medical Director",
//         status:  "Rejected",
//     },
//     {
//         id: 4,
//         Hospitalname: "Max Super Specialty",
//         Fulladdress: "101 Health Blvd, Sector 19",
//         City: "Chandigarh",
//         State: "Punjab",
//         Pincode: "160019",
//         Contactperson: "Dr. Neha Verma",
//         Email: "neha.verma@maxhealth.com",
//         Phone: "9988776655",
//         Designation: "Radiologist",
//         status:  "Created",
//     },
// ];


export const enquiriesData = [
    {
        id: 1,
        hName: 'Apollo Hospital',
        fullAddress: '123 Medical Street, Health Lane',
        city: 'Bangalore',
        district: "Bangalore Urban",
        state: 'Karnataka',
        pincode: '560001',
        branch: "HSR Layout Branch",
        contactperson: 'Dr. Ramesh Kumar',
        email: 'ramesh.kumar@apollo.com',
        phone: '9876543210',
        designation: 'Chief Medical Officer',
        quotation: 'approved',
        machineType: 'A-arm',
        quantity: '2',
        work: ['Service', 'Decommissioning'],
        aditionalServices: [{ 'INSTITURE REGISTRATION': 'service 1a' }, { 'LEAD SHEET': 'service 1b' }],
        expires: '30 days from above date'
    },
    {
        id: 2,
        hName: 'Fortis Healthcare',
        fullAddress: '456 Wellness Road, Green Park',
        city: 'Delhi',
        district: "Shahdara",
        state: 'Delhi',
        pincode: '110016',
        branch: "Lajpat Nagar",
        contactperson: 'Dr. Anita Sharma',
        email: 'anita.sharma@fortis.com',
        phone: '9123456780',
        designation: 'Senior Surgeon',
        quotation: 'create'
    },
    {
        id: 3,
        hName: 'Manipal Hospital',
        fullAddress: '789 Recovery Ave, Whitefield',
        city: 'Bangalore',
        district: "Bangalore Urban",
        state: 'Karnataka',
        branch: "HSR Layout Branch",
        pincode: '560066',
        contactperson: 'Dr. Praveen Rao',
        email: 'praveen.rao@manipal.com',
        phone: '9012345678',
        designation: 'Medical Director',
        quotation: 'created'
    },
    {
        id: 4,
        hName: 'Max Super Specialty',
        fullAddress: '101 Health Blvd, Sector 19',
        city: 'Chandigarh',
        district: "Chandigarh",
        state: 'Punjab',
        pincode: '160019',
        branch: "Industrial Area",
        contactperson: 'Dr. Neha Verma',
        email: 'neha.verma@maxhealth.com',
        phone: '9988776655',
        designation: 'Radiologist',
        quotation: 'create'
    },
];

export const quotationData = [
    {
        id: 1,
        hName: 'Max Super Specialty',
        phone: '9988776655',
        eName: 'Anjana Thakur',
        expires: '30 days from above date',
        totalAmount: '10000',
    },
    {
        id: 2,
        hName: 'Apollo Hospital',
        phone: '9876543210',
        eName: 'Khalid Khan',
        expires: '30 days from above date',
        totalAmount: '25000',
    },
];

export const orderData = [
    {
        id: 1,
        orderId: "ABSRF/2025/05/001",
        procNo: "PROC/2025/05/001",
        type: 'Manufacturer',
        leadOwner: "Ramesh Mehta",
        partyCode: "SY-1234",
        city: "Bengaluru",
        district: "Bangalore Urban",
        state: "Karnataka",
        pin: "560767",
        branch: "HSR Layout Branch",
        email: "apollo@gmail.com",
        address: "Akshya Nagar 1st Block 1st Cross.",
        customerType: "Hospital",
        customerName: "Apollo Hospital",
        contactNumber: "9876543210",
        employeeName: "Khalid Khan",
        createdOn: "2025-05-01",
        expiresOn: "2025-05-31",
        totalCost: 25000,
        advancedAmount: 10000,
        assignedStaff: ["Technician A", "Assistant B"],
        status: "Assigned",
        remarks: "Urgent installation required"
    },
    {
        id: 2,
        orderId: "ABSRF/2025/05/002",
        procNo: "PROC/2025/05/002",
        type: 'Dealer',
        leadOwner: "Shalini Shah",

        partyCode: "SY-12355",
        city: "Hyderabad",
        district: "Medchal–Malkajgiri ",
        state: "Telengana",
        pin: "523463",
        branch: "Miyapur",
        email: "medTech@gmail.com",
        address: "Akshya Nagar 1st Block 1st Cross.",
        customerType: "Dealer",
        customerName: "MedTech Supplies",
        contactNumber: "9876501234",
        employeeName: "Anjana Thakur",
        createdOn: "2025-05-05",
        expiresOn: null,
        totalCost: 40000,
        advancedAmount: 10000,
        assignedStaff: ["Technician B", "Support Staff C"],
        status: "In Progress",
        remarks: "Waiting for dispatch confirmation"
    },
    {
        id: 3,
        orderId: "ABSRF/2025/05/003",
        procNo: "PROC/2025/05/003",
        type: 'Customer',
        leadOwner: "Rohit Verma",

        partyCode: "SY-1238",
        city: "Bengaluru",
        district: "Bangalore Urban",
        state: "Karnataka",
        branch: "HSR Layout Branch",
        pin: "560767",
        email: "bioGenix@gmail.com",
        address: "Akshya Nagar 1st Block 1st Cross.",
        customerType: "Manufacturer",
        customerName: "BioGenix Pvt Ltd",
        contactNumber: "9988776655",
        employeeName: "Rahul Mehta",
        createdOn: "2025-05-10",
        expiresOn: null,
        totalCost: 85000,
        advancedAmount: 10000,
        assignedStaff: ["Technician C"],
        status: "Generated",
        remarks: ""
    },
    {
        id: 4,
        orderId: "ABSRF/2025/05/004",
        procNo: "PROC/2025/05/001",
        type: 'Customer',
        leadOwner: "Suresh Mehta",

        partyCode: "SY-1236",
        city: "Hyderabad",
        district: "Medchal–Malkajgiri ",
        state: "Telengana",
        pin: "523463",
        branch: "Miyapur",
        email: "max@gmail.com",
        address: "Akshya Nagar 1st Block 1st Cross.",
        customerType: "Hospital",
        customerName: "Max Super Specialty",
        contactNumber: "9123456789",
        employeeName: "Priya Sharma",
        createdOn: "2025-05-15",
        expiresOn: "2025-06-14",
        totalCost: 12000,
        advancedAmount: 10000,
        assignedStaff: ["Technician A", "Supervisor D"],
        status: "Completed",
        remarks: "Installation successful"
    }
];
export const paymentdata = [
    {
        id: 1,
        paymentId: '001',
        srfClient: 'ABSRF/2025/05/001 - Apollo Hospital',
        totalAmount: 50000,
        paymentAmount: 20000,
        paymentType: 'Advanced',
        screenshotUrl: Payment,
        utrNumber: 'UTR1234567890',
    },
    {
        id: 2,
        paymentId: '002',
        srfClient: 'ABSRF/2025/08/002 - MedTech Supplies',
        totalAmount: 75000,
        paymentAmount: 75000,
        screenshotUrl: Payment,

        paymentType: 'Complete',
        utrNumber: '',
    }
]
export const invoicedata = [
    {
        id: 1,
        invoiceId: 'INV001',
        srfno: "ABSRF/2025/05/001",
        buyerName: 'Apollo Hospital',
        address: '123 Health St, Chennai',
        state: 'Tamil Nadu',
        gstin: '33AAAAA0000A1Z5',
        machineType: 'CT Scan',
        quantity: 2,
        rate: 150000,
        totalAmount: 300000,
        status: "Paid"
    },
    {
        id: 2,
        invoiceId: 'INV002',
        srfno: "ABSRF/2025/05/001",
        buyerName: 'Fortis Healthcare',
        address: '456 Care Rd, Mumbai',
        state: 'Maharashtra',
        gstin: '27BBBBB1111B2Z6',
        machineType: 'MRI',
        quantity: 1,
        rate: 250000,
        totalAmount: 250000,
        status: "Paid"

    },
    {
        id: 3,
        invoiceId: 'INV003',
        srfno: "ABSRF/2025/05/002",
        buyerName: 'Manipal Hospitals',
        address: '789 Wellbeing Ave, Bangalore',
        state: 'Karnataka',
        gstin: '29CCCCC2222C3Z7',
        machineType: 'X-Ray',
        quantity: 3,
        rate: 50000,
        totalAmount: 150000,
        status: "Pending"

    },
    {
        id: 4,
        invoiceId: 'INV004',
        srfno: "ABSRF/2025/05/003",

        buyerName: 'Max Healthcare',
        address: '101 Medi Lane, Delhi',
        state: 'Delhi',
        gstin: '07DDDDD3333D4Z8',
        machineType: 'Ultrasound',
        quantity: 2,
        rate: 80000,
        totalAmount: 160000,
        status: "Pending"

    },
];