export const translations = {
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    
    // Dashboard
    dashboard: 'Dashboard',
    customers: 'Customers',
    jobCards: 'Job Cards',
    invoices: 'Invoices',
    inventory: 'Inventory',
    appointments: 'Appointments',
    settings: 'Settings',
    
    // Stats
    totalCustomers: 'Total Customers',
    activeJobs: 'Active Jobs',
    revenueThisMonth: 'Revenue This Month',
    todayAppointments: "Today's Appointments",
    pendingInvoices: 'Pending Invoices',
    lowStockItems: 'Low Stock Items',
    
    // Customer
    customerName: 'Customer Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    gstNumber: 'GST Number',
    
    // Invoice
    invoiceNumber: 'Invoice Number',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    subtotal: 'Subtotal',
    tax: 'Tax',
    discount: 'Discount',
    total: 'Total',
    paid: 'Paid',
    balance: 'Balance',
    
    // Job Card
    jobNumber: 'Job Number',
    status: 'Status',
    priority: 'Priority',
    description: 'Description',
    estimatedCost: 'Estimated Cost',
    actualCost: 'Actual Cost',
  },
  gu: {
    // Common - Gujarati
    save: 'સાચવો',
    cancel: 'રદ કરો',
    delete: 'કાઢી નાખો',
    edit: 'સંપાદિત કરો',
    add: 'ઉમેરો',
    search: 'શોધો',
    loading: 'લોડ થઈ રહ્યું છે...',
    
    // Dashboard
    dashboard: 'ડેશબોર્ડ',
    customers: 'ગ્રાહકો',
    jobCards: 'જોબ કાર્ડ',
    invoices: 'બીલ',
    inventory: 'ઇન્વેન્ટરી',
    appointments: 'એપોઇન્ટમેન્ટ',
    settings: 'સેટિંગ્સ',
    
    // Stats
    totalCustomers: 'કુલ ગ્રાહકો',
    activeJobs: 'સક્રિય જોબ',
    revenueThisMonth: 'આ મહિનાની આવક',
    todayAppointments: 'આજની એપોઇન્ટમેન્ટ',
    pendingInvoices: 'બાકી બીલ',
    lowStockItems: 'ઓછો સ્ટોક',
    
    // Customer
    customerName: 'ગ્રાહકનું નામ',
    phone: 'ફોન',
    email: 'ઈમેલ',
    address: 'સરનામું',
    gstNumber: 'GST નંબર',
    
    // Invoice
    invoiceNumber: 'બીલ નંબર',
    invoiceDate: 'બીલ તારીખ',
    dueDate: 'બાકી તારીખ',
    subtotal: 'સબટોટલ',
    tax: 'ટેક્સ',
    discount: 'ડિસ્કાઉન્ટ',
    total: 'કુલ',
    paid: 'ચૂકવેલ',
    balance: 'બાકી',
    
    // Job Card
    jobNumber: 'જોબ નંબર',
    status: 'સ્થિતિ',
    priority: 'પ્રાથમિકતા',
    description: 'વર્ણન',
    estimatedCost: 'અંદાજિત ખર્ચ',
    actualCost: 'વાસ્તવિક ખર્ચ',
  },
};

export type Language = 'en' | 'gu';

export function getTranslation(lang: Language, key: string): string {
  return translations[lang][key as keyof typeof translations.en] || key;
}
