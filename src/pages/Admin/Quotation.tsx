'use client';

import type React from 'react';

import { Link } from 'react-router-dom';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect, useCallback } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconDownload from '../../components/Icon/IconDownload';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoA from '../../assets/quotationImg/NABLlogo.png';
import logoB from '../../assets/quotationImg/images.jpg';
import signature from '../../assets/quotationImg/signature.png';
import qrcode from '../../assets/quotationImg/qrcode.png';
import { quotationData } from '../../data';
import Breadcrumb, { BreadcrumbItem } from '../../components/common/Breadcrumb';
import IconHome from '../../components/Icon/IconHome';
import IconBox from '../../components/Icon/IconBox';

// Define interfaces for type safety
interface QuotationItem {
    id: number;
    hName: string;
    phone: string;
    eName: string;
    expires: string;
    totalAmount: string;
    quotationId: string;
}

interface ServiceItem {
    type: string;
    id: number;
    title: string;
    description: string;
    quantity: string;
    price: string;
    amount: string;
}

const Quotation: React.FC = () => {
    const dispatch = useDispatch();

    // Set page title on mount
    useEffect(() => {
        dispatch(setPageTitle('Clients'));
    }, [dispatch]);

    // Initialize items with quotationId
    const [items, setItems] = useState<QuotationItem[]>(
        quotationData.map((item, index) => ({
            ...item,
            quotationId: `QUO${String(index + 1).padStart(3, '0')}`,
        }))
    );

    // Table state
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<QuotationItem[]>(sortBy(items, 'hName'));
    const [records, setRecords] = useState<QuotationItem[]>(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState<QuotationItem[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'hName',
        direction: 'asc',
    });

    // Handle pagination
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    // Handle search
    useEffect(() => {
        const filteredItems = items.filter((item) =>
            ['quotationId', 'hName', 'phone', 'eName', 'expires', 'totalAmount'].some((key) => {
                const value = item[key as keyof QuotationItem];
                return String(value).toLowerCase().includes(search.toLowerCase());
            })
        );
        setInitialRecords(filteredItems);
    }, [search, items]);

    // Handle sorting
    useEffect(() => {
        const sortedData = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData);
        setPage(1);
    }, [sortStatus, initialRecords]);

    // Delete row handler
    const deleteRow = useCallback(
        (id?: number) => {
            if (!window.confirm('Are you sure you want to delete the selected row(s)?')) return;

            const idsToDelete = id ? [id] : selectedRecords.map((record) => record.id);
            const updatedItems = items.filter((item) => !idsToDelete.includes(item.id));

            setItems(updatedItems);
            setInitialRecords(updatedItems);
            setRecords(updatedItems.slice(0, pageSize));
            setSearch('');
            setSelectedRecords([]);
            setPage(1);
        },
        [items, selectedRecords, pageSize]
    );

    // PDF generation
    const downloadPDF = useCallback((quotation: QuotationItem) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 5;
        let yOffset = 15;

        const addImage = (imgSrc: string, x: number, y: number, width: number, height: number) => {
            try {
                doc.addImage(imgSrc, 'PNG', x, y, width, height);
            } catch (error) {
                console.warn(`Failed to add image: ${error}`);
            }
        };

        // Header
        addImage(logoB, margin, yOffset, 30, 15);
        doc.setFontSize(20)
            .setFont('helvetica', 'bold')
            .text('QUOTATION', pageWidth / 2, yOffset + 10, { align: 'center' });
        addImage(logoA, pageWidth - margin - 30, yOffset, 30, 15);
        doc.setFontSize(8).text('AERB Registration No. 14-AFSXE-2148', margin + 5, yOffset + 20);
        doc.text('NABL Accreditation No TC-9843', pageWidth - margin - 50, yOffset + 20);
        yOffset += 30;

        // Quotation details
        doc.setFontSize(8);
        doc.text('Date: 22-Nov-2024', margin, yOffset);
        doc.text('To:', margin, yOffset + 5);
        doc.setFont('helvetica', 'bold').text('CIVIL HOSPITAL KOTLI', margin + 10, yOffset + 5);
        doc.setFont('helvetica', 'normal').text('KOTLI, MANDI, HIMACHAL PRADESH-175003', margin + 10, yOffset + 10);
        doc.text('Email: khalid020288@gmail.com', margin, yOffset + 15);
        doc.text('Contact: 80917 50188', margin, yOffset + 20);
        doc.text('From: Anjana Thakur', margin, yOffset + 25);
        doc.text('Phone: 9317509720', margin + 50, yOffset + 25);
        doc.text(`Quotation: ${quotation.quotationId}`, margin, yOffset + 30);
        doc.text('Expires: 30 days from above date', margin, yOffset + 35);

        doc.setFont('helvetica', 'bold').text('ANTESO Biomedical (OPC) Pvt. Ltd.', pageWidth - margin - 50, yOffset);
        doc.setFont('helvetica', 'normal');
        doc.text('Flat No. 290, 2nd Floor, Block D,', pageWidth - margin - 50, yOffset + 5);
        doc.text('Pocket 7, Sector 6, Rohini,', pageWidth - margin - 50, yOffset + 10);
        doc.text('New Delhi – 110 085, INDIA', pageWidth - margin - 50, yOffset + 15);
        doc.text('Mobile: +91 8470909720 / 8951818690', pageWidth - margin - 50, yOffset + 20);
        doc.text('Email: info@antesobiomedicalopc.com', pageWidth - margin - 50, yOffset + 25);
        yOffset += 45;

        // Service tables
        const aItems: ServiceItem[] = [
            {
                type: '',
                id: 1,
                title: 'CT SCAN',
                description: 'QA + LICENSE + DECOMMISSIONING',
                quantity: '2',
                price: '100000',
                amount: '200000',
            },
        ];

        const bItems: ServiceItem[] = [
            {
                type: '',
                id: 1,
                title: 'INSTITUTE REGISTRATION',
                description: "SIZE 7' X 4' FROM REMARKS",
                quantity: '1',
                price: '2000',
                amount: '2000',
            },
            {
                type: '',
                id: 2,
                title: 'LEAD SHEET',
                description: "SIZE 7' X 4' FROM REMARKS 20 SQ FEET",
                quantity: '1',
                price: '2000',
                amount: '2000',
            },
        ];

        autoTable(doc, {
            startY: yOffset,
            head: [['A', 'S.NO', 'TYPE OF MACHINE', 'DESCRIPTION OF SERVICES', 'QTY', 'RATE', 'TOTAL']],
            body: aItems.map((item) => [item.type, item.id, item.title, item.description, item.quantity, ` ${item.price}`, ` ${item.amount}`]),
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
            columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
        });
        yOffset = (doc as any).lastAutoTable.finalY + 5;

        autoTable(doc, {
            startY: yOffset,
            head: [['B', 'S.NO', 'ADDITIONAL SERVICES', 'SERVICES', 'QTY', 'RATE', 'TOTAL']],
            body: bItems.map((item) => [item.type, item.id, item.title, item.description, item.quantity, ` ${item.price}`, ` ${item.amount}`]),
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
            columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
        });
        yOffset = (doc as any).lastAutoTable.finalY + 10;

        // Totals
        const discount = 10;
        const travelCost = 0;
        const aItemsTotal = aItems.reduce((sum, item) => sum + Number.parseFloat(item.amount), 0);
        const bItemsTotal = bItems.reduce((sum, item) => sum + Number.parseFloat(item.amount), 0);
        const subtotal = aItemsTotal + bItemsTotal;
        const discountAmount = (subtotal * discount) / 100;
        const totalAmount = subtotal - discountAmount + travelCost;

        doc.setFontSize(10).setFont('helvetica', 'bold');
        doc.text(`DISCOUNT: ${discount}%`, pageWidth - margin - 40, yOffset);
        doc.text(`TOTAL: ${totalAmount.toLocaleString('en-IN')}`, pageWidth - margin - 40, yOffset + 5);
        yOffset += 15;

        // Terms & Conditions
        doc.setFontSize(12).text('Terms & Conditions:', margin, yOffset);
        yOffset += 5;
        const terms = [
            'In case of License renewal, eLora ID and Password need to be provided by you.',
            'The quotation applies only to the equipment mentioned above. Charges for any additional parameters will be extra.',
            'Repeated Q/A for failed equipment and repeated visits for the same machine will be charged extra.',
            'QA reports will be submitted only after bank realization of 100% payment. In urgent cases, a minimum of 24 hours is required to share the QA report.',
            'QA reports are valid for 2 years for X-Ray Machines and 5 years for Dental X-Rays.',
            'Prices are valid only for the duration of this quotation and are subject to change thereafter.',
            'Services will commence within a week of receiving a formal Purchase Order.',
            'All payments must be made by DD, e-Transfer, or Cheque payable to “ANTESO Biomedical (OPC) Pvt. Ltd.”',
            'Terms of payment: 100% advance payment.',
            'Cheques must be couriered by the customer to our registered address.',
            'QA tests will follow AERB guidelines. We are not responsible for any machine breakdowns during testing.',
            'For institute or RSO registration, OTPs will be sent for verification. Please share them promptly.',
            'Please ensure the accuracy of email IDs before sharing, as they will be used as-is and cannot be recovered later.',
            'Share your GST number with the work order if applicable; otherwise, the order will be considered unregistered and no future claims will be entertained.',
        ];
        doc.setFontSize(8);
        terms.forEach((term, index) => {
            doc.text(`• ${term}`, margin + 5, yOffset + index * 5);
        });
        yOffset += terms.length * 5 + 10;

        // Footer
        addImage(signature, margin, yOffset, 50, 30);
        doc.text('A/C No.: 50200007211263', margin, yOffset + 35);
        doc.text('IFSC: HDFC0000711', margin, yOffset + 40);
        doc.text('HDFC BANK PUSHPANJALI ENCLAVE PITAMPURA', margin, yOffset + 45);
        yOffset += 55;

        doc.setFont('helvetica', 'bold').text('OUR ACCOUNT DETAILS', pageWidth / 2, yOffset, { align: 'center' });
        doc.text('GST NO: 07AAMCA8142J1ZE', pageWidth / 2, yOffset + 5, { align: 'center' });
        yOffset += 15;

        addImage(qrcode, pageWidth - margin - 30, yOffset, 30, 30);
        doc.setFont('helvetica', 'normal').text('Merchant Name: ANTESO BIOMEDICAL PRIVATE LIMITED', pageWidth - margin - 50, yOffset + 35);
        doc.text('Mobile Number: 8470909720', pageWidth - margin - 50, yOffset + 40);
        doc.text('Steps to Pay UPI QR Code', pageWidth - margin - 30, yOffset + 45, { align: 'center' });
        doc.text('Open UPI app → Select Type to Pay → Scan QR Code → Enter Amount', pageWidth - margin - 30, yOffset + 50, {
            align: 'center',
        });
        doc.text('A/C No: 344305001088', pageWidth - margin - 50, yOffset + 55);
        doc.text('IFSC Code: ICIC0003443', pageWidth - margin - 50, yOffset + 60);
        doc.text('ICICI BANK ROHINI', pageWidth - margin - 50, yOffset + 65);

        yOffset = pageHeight - 20;
        doc.text('For any enquiry contact us info@antesobiomedicalopc.com or antesobiomedical@gmail.com', pageWidth / 2, yOffset, { align: 'center' });
        doc.text('Feel free to call us & Thank you for your enquiry', pageWidth / 2, yOffset + 5, { align: 'center' });

        doc.save(`quotation_${quotation.quotationId}.pdf`);
    }, []);

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/', icon: <IconHome /> },
        { label: 'Quotation', icon: <IconBox /> },
    ];
    return (
        <div>
            <Breadcrumb items={breadcrumbItems} />

            <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
                <div className="invoice-table">
                    <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                        <div className="ltr:ml-auto rtl:mr-auto">
                            <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="datatables pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover invoice-table"
                            records={records}
                            columns={[
                                { accessor: 'quotationId', title: 'QUO ID', sortable: true },
                                { accessor: 'hName', title: 'Hospital Name', sortable: true },
                                { accessor: 'phone', title: 'Contact Number', sortable: true },
                                { accessor: 'eName', title: 'Employee Name', sortable: true },
                                { accessor: 'expires', title: 'Expires', sortable: true },
                                { accessor: 'totalAmount', title: 'Total Cost', sortable: true },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    sortable: false,
                                    textAlignment: 'center',
                                    render: (record) => (
                                        <div className="flex gap-4 items-center w-max mx-auto">
                                            <button type="button" className="flex hover:text-info" onClick={() => downloadPDF(record)}>
                                                <IconDownload className="w-4.5 h-4.5" />
                                            </button>
                                            <button type="button" className="flex hover:text-danger" onClick={() => deleteRow(record.id)}>
                                                <IconTrashLines />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            highlightOnHover
                            totalRecords={initialRecords.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
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
        </div>
    );
};

export default Quotation;
