'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, FileText, Download, IndianRupee, X, Trash2, QrCode, Share2, Printer, Sparkles, FileUp, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

import Loader from '@/components/Loader';
import PearlButton from '@/components/PearlButton';
import { getAutomotiveTechnicalExplanation } from '@/lib/aiExplainer';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  paymentMode: string;
  createdAt: string;
  dueDate?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  jobCard?: {
    jobNumber: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  vehicles?: {
    id: string;
    registrationNo: string;
    make: string;
    model: string;
    year?: number;
  }[];
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // New Invoice Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [serviceScope, setServiceScope] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [invoiceType, setInvoiceType] = useState<'INVOICE' | 'ESTIMATE'>('INVOICE');
  const [lineItems, setLineItems] = useState<
    { description: string; details?: string; quantity: number; unitPrice: number }[]
  >([
    {
      description: 'CYLINDER BLOCK & PISTON KIT (OEM)',
      details: 'Top End Core: OEM cylinder block, piston, rings, pin & circlips assembly',
      quantity: 1,
      unitPrice: 5200,
    },
    {
      description: 'CYLINDER HEAD VALVES, SEALS & GUIDES',
      details: 'Top End Core: Intake & exhaust valves, viton stem seals & bronze guide set',
      quantity: 1,
      unitPrice: 1100,
    },
    {
      description: 'MECHANIC LABOUR (TOP END REBUILD)',
      details: 'Labour: Engine top end teardown, decarb, precision assembly, valve lash setup & road test',
      quantity: 1,
      unitPrice: 2500,
    },
  ]);

  // Counter UPI QR Modal State
  const [selectedUpiInvoice, setSelectedUpiInvoice] = useState<Invoice | null>(null);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [draftingWithAi, setDraftingWithAi] = useState(false);
  const [editingDetailIndex, setEditingDetailIndex] = useState<number | null>(null);

  // Edit Invoice State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editPaymentMode, setEditPaymentMode] = useState('cash');
  const [editStatus, setEditStatus] = useState('paid');
  const [editDiscount, setEditDiscount] = useState('0');
  const [editPaid, setEditPaid] = useState('0');
  const [editNotes, setEditNotes] = useState('');
  const [editVehicleModel, setEditVehicleModel] = useState('');
  const [editVehicleReg, setEditVehicleReg] = useState('');
  const [editServiceScope, setEditServiceScope] = useState('');
  const [editLineItems, setEditLineItems] = useState<
    { description: string; details?: string; quantity: number; unitPrice: number }[]
  >([]);
  const [updatingInvoice, setUpdatingInvoice] = useState(false);

  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete Invoice #${invoiceNumber}? This will permanently remove its records.`)) {
      return;
    }
    const toastId = toast.loading(`Deleting Invoice #${invoiceNumber}...`);
    try {
      const res = await fetch(`/api/invoices/${id}?force=true`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Invoice #${invoiceNumber} deleted successfully`, { id: toastId });
        setInvoices((prev) => prev.filter((i) => i.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to delete invoice', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error deleting invoice', { id: toastId });
    }
  };

  const handleOpenEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditPaymentMode(inv.paymentMode || 'cash');
    setEditStatus(inv.status || 'paid');
    setEditDiscount(String((inv as any).discount || 0));
    setEditPaid(String(inv.paid || 0));

    let vModel = '';
    let vReg = '';
    let vScope = '';
    let rawNotes = (inv as any).notes || '';

    if (rawNotes) {
      try {
        const parsed = JSON.parse(rawNotes);
        if (typeof parsed === 'object' && parsed !== null) {
          vModel = parsed.vehicleModel || parsed.model || '';
          vReg = parsed.vehicleReg || parsed.registrationNo || '';
          vScope = parsed.serviceScope || parsed.serviceType || '';
          rawNotes = parsed.userNotes || '';
        }
      } catch {
        const vehMatch = rawNotes.match(/\[VEHICLE:\s*([^|\]]+)/i);
        const regMatch = rawNotes.match(/REG:\s*([^|\]]+)/i);
        const scopeMatch = rawNotes.match(/SCOPE:\s*([^|\]]+)/i);
        if (vehMatch) vModel = vehMatch[1].trim();
        if (regMatch) vReg = regMatch[1].trim();
        if (scopeMatch) vScope = scopeMatch[1].trim();
      }
    }

    if (!vModel) {
      const v = (inv as any).jobCard?.vehicle || (inv as any).customer?.vehicles?.[0];
      if (v) {
        vModel = `${v.make || ''} ${v.model || ''}`.trim();
        vReg = v.registrationNo || '';
      }
    }

    setEditVehicleModel(vModel);
    setEditVehicleReg(vReg);
    setEditServiceScope(vScope);
    setEditNotes(rawNotes);
    setEditLineItems(
      (inv.items || []).map((it) => ({
        description: it.description,
        details: (it as any).details || '',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
      }))
    );
    setIsEditModalOpen(true);
  };

  const handleUpdateInvoice = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if (editLineItems.length === 0) {
      toast.error('Invoice must have at least one line item');
      return;
    }

    try {
      setUpdatingInvoice(true);
      const subtotal = editLineItems.reduce(
        (acc, item) => acc + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        0
      );
      const discountVal = Number(editDiscount) || 0;
      const taxVal = Math.round((subtotal - discountVal) * 0.18);
      const totalVal = Math.max(0, subtotal - discountVal + taxVal);
      const paidVal = Number(editPaid) || 0;
      const balanceVal = Math.max(0, totalVal - paidVal);

      const finalNotes = JSON.stringify({
        vehicleModel: editVehicleModel.trim() || undefined,
        vehicleReg: editVehicleReg.trim() || undefined,
        serviceScope: editServiceScope.trim() || undefined,
        userNotes: editNotes.trim() || undefined,
      });

      const payload = {
        paymentMode: editPaymentMode,
        status: editStatus,
        notes: finalNotes,
        subtotal,
        discount: discountVal,
        tax: taxVal,
        total: totalVal,
        paid: paidVal,
        balance: balanceVal,
        items: editLineItems.map((item) => ({
          description: item.description || 'Workshop Service',
          details: item.details || undefined,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          tax: Math.round(((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)) * 0.18),
          total: Math.round(((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)) * 1.18),
        })),
      };

      const res = await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to update invoice');
      }

      const updated = await res.json();
      toast.success(`Invoice #${updated.invoiceNumber || editingInvoice.invoiceNumber} updated!`);
      setIsEditModalOpen(false);
      setEditingInvoice(null);
      await fetchInvoices();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error updating invoice');
    } finally {
      setUpdatingInvoice(false);
    }
  };

  useEffect(() => {
    void fetchInvoices();
    void fetchCustomerOptions();
  }, []);

  const fetchCustomerOptions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');
      const res = await fetch(`/api/customers?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setCustomers(list);
        if (list.length > 0) {
          setSelectedCustomerId(list[0].id);
          if (list[0].vehicles && list[0].vehicles.length > 0) {
            const v = list[0].vehicles[0];
            const fullModel = `${v.make || ''} ${v.model || ''}`.trim();
            if (fullModel && !fullModel.toLowerCase().includes('standard')) {
              setVehicleModel(fullModel);
            }
            if (v.registrationNo) {
              setVehicleReg(v.registrationNo);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching customers for invoice modal:', err);
    }
  };

  const handleDownloadBillPdf = async (
    invoice: Invoice,
    docType: 'INVOICE' | 'ESTIMATE' | 'SOW_BILL' | 'SOW_ESTIMATE' = 'INVOICE'
  ) => {
    const fileName = `${docType}_${invoice.invoiceNumber}.pdf`;
    const toastId = toast.loading(`Generating ${fileName}...`);
    const url = `/api/pdf/invoice?id=${invoice.invoiceNumber}&docType=${docType}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        let errMessage = 'Failed to generate PDF';
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {}
        throw new Error(errMessage);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success(`${fileName} downloaded!`, { id: toastId });
    } catch (err: any) {
      console.error('PDF download error:', err);
      toast.error(err.message || 'Error generating PDF', { id: toastId });
      window.open(url, '_blank');
    }
  };

  const handleOpenCounterUpi = async (invoice: Invoice) => {
    setSelectedUpiInvoice(invoice);
    setLoadingQr(true);
    try {
      let customQr = typeof window !== 'undefined' ? localStorage.getItem('paymentQrUrl') : null;
      let savedUpiId = typeof window !== 'undefined' ? localStorage.getItem('upiId') : null;

      if (!customQr || !savedUpiId) {
        try {
          const bRes = await fetch('/api/branding');
          if (bRes.ok) {
            const bData = await bRes.json();
            if (bData.paymentQrUrl) {
              customQr = bData.paymentQrUrl;
              localStorage.setItem('paymentQrUrl', bData.paymentQrUrl);
            }
            if (bData.upiId) {
              savedUpiId = bData.upiId;
              localStorage.setItem('upiId', bData.upiId);
            }
          }
        } catch {
          // Fallback to local or defaults silently
        }
      }

      // If garage uploaded their own custom QR image, display their authentic standee QR
      if (customQr) {
        setUpiQrDataUrl(customQr);
      } else if (savedUpiId) {
        const { generateUpiQrDataUrl } = await import('@/lib/upi');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const amount = invoice.balance > 0 ? invoice.balance : invoice.total;
        const dataUrl = await generateUpiQrDataUrl({
          vpa: savedUpiId,
          payeeName: user.name || 'Workshop',
          amount: amount,
          invoiceNumber: invoice.invoiceNumber,
          notes: `Bill #${invoice.invoiceNumber}`,
        });
        setUpiQrDataUrl(dataUrl);
      } else {
        setUpiQrDataUrl(null);
        toast('No UPI ID or QR image configured in Settings > Branding.', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('Failed to generate UPI QR:', err);
      toast.error('Could not generate UPI QR code');
    } finally {
      setLoadingQr(false);
    }
  };

  const handleShareWhatsApp = (invoice: Invoice) => {
    if (!invoice.customer?.phone) {
      toast.error('Customer phone number not available');
      return;
    }
    const { buildWhatsAppBillUrl } = require('@/lib/whatsapp');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const secureToken = (invoice as any).secureToken ? `&token=${(invoice as any).secureToken}` : '';
    const invoiceUrl = `${origin}/api/pdf/invoice?id=${invoice.invoiceNumber}&docType=INVOICE${secureToken}`;
    
    const url = buildWhatsAppBillUrl({
      phone: invoice.customer.phone,
      customerName: invoice.customer.name || 'Customer',
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.total,
      paidAmount: invoice.paid,
      balanceAmount: invoice.balance,
      garageName: user.name || 'MotoBan Workshop',
      invoiceUrl,
    });
    window.open(url, '_blank');
  };

  const handlePrintThermalSlip = async (invoice: Invoice) => {
    try {
      const { printThermalSlipBrowser } = await import('@/lib/thermalPrinter');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const savedUpiId = typeof window !== 'undefined' ? localStorage.getItem('upiId') : null;
      printThermalSlipBrowser({
        workshopName: user.name || 'Automotive Service Workshop',
        tagline: 'Automotive Precision & Smart Care',
        phone: user.phone || undefined,
        invoiceNumber: invoice.invoiceNumber,
        date: new Date(invoice.createdAt).toLocaleDateString('en-IN'),
        customerName: invoice.customer?.name || 'Walk-in Customer',
        customerPhone: invoice.customer?.phone,
        items: invoice.items?.map((it) => ({
          description: it.description,
          qty: it.quantity,
          rate: it.unitPrice,
          amount: it.total,
        })) || [
          {
            description: 'Automotive Labor & Spares',
            amount: invoice.total,
          },
        ],
        subtotal: invoice.subtotal || invoice.total,
        cgst: invoice.tax ? invoice.tax / 2 : 0,
        sgst: invoice.tax ? invoice.tax / 2 : 0,
        total: invoice.total,
        paid: invoice.paid,
        balance: invoice.balance,
        paymentMode: invoice.paymentMode,
        upiVpa: savedUpiId || undefined,
      }, '58mm');
      toast.success('Thermal receipt sent to printer!');
    } catch (err) {
      console.error('Thermal print error:', err);
      toast.error('Failed to trigger thermal printer');
    }
  };

  const fetchInvoices = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');
      const response = await fetch(`/api/invoices?userId=${userId}`);
      if (response.ok) {
        const result = await response.json();
        setInvoices(Array.isArray(result) ? result : result.data || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setLineItems([...lineItems, { description: '', details: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: 'description' | 'details' | 'quantity' | 'unitPrice',
    val: any
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };

    // Automatically generate technical explanation as the user types the item name!
    if (field === 'description' && val) {
      const autoText = getAutomotiveTechnicalExplanation(val);
      if (autoText) {
        updated[index].details = autoText;
      }
    }

    setLineItems(updated);
  };

  const handleDraftWithAi = async () => {
    if (!aiPromptInput?.trim()) {
      toast.error('Enter a repair job or paste items (e.g. Himalayan 411 engine rebuild)');
      return;
    }

    setDraftingWithAi(true);
    const toastId = toast.loading('Gemini AI drafting full SOW bill & explanations...');
    try {
      const res = await fetch('/api/ai/draft-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPromptInput }),
      });

      if (!res.ok) throw new Error('AI Draft failed');
      const data = await res.json();
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        setLineItems(data.items);
        toast.success(`✨ Gemini AI generated ${data.items.length} SOW line items & technical breakdowns!`, { id: toastId });
        setAiPromptInput('');
      } else {
        throw new Error('No items returned');
      }
    } catch (err) {
      console.error('Draft with AI error:', err);
      toast.error('Could not auto-draft with AI. Try one of the quick templates below.', { id: toastId });
    } finally {
      setDraftingWithAi(false);
    }
  };

  const handleApplyQuickTemplate = (templateType: 'himalayan' | 'classic' | 'service') => {
    if (templateType === 'himalayan') {
      setVehicleModel('Royal Enfield Himalayan 411');
      setServiceScope('Himalayan 411 Rebuild & Service');
      setLineItems([
        {
          description: 'CYLINDER BLOCK & PISTON KIT (OEM)',
          details: 'Top End Core: OEM cylinder block, piston, rings, pin & circlips assembly',
          quantity: 1,
          unitPrice: 5850,
        },
        {
          description: 'LATHE / HEAD FACING / VALVE GUIDE & SEATING',
          details: 'Machining: Precision cylinder head facing, valve seat angle cutting & guide reaming',
          quantity: 1,
          unitPrice: 1450,
        },
        {
          description: 'INTAKE & EXHAUST VALVE SET (OEM)',
          details: 'Top End Core: Intake & exhaust valves, viton stem seals & bronze guide set',
          quantity: 1,
          unitPrice: 950,
        },
        {
          description: 'ENGINE GASKET & SEAL KIT (FULL TOP END)',
          details: 'Consumables: Cylinder head, base gasket, O-rings & high-temp engine sealant',
          quantity: 1,
          unitPrice: 780,
        },
        {
          description: 'MOTUL 3100 15W50 SEMI-SYNTHETIC ENGINE OIL (2L)',
          details: 'Consumables: Premium 4T engine oil, drain plug washer & chemical engine flush',
          quantity: 2,
          unitPrice: 550,
        },
        {
          description: 'ENGINE OIL FILTER ELEMENT',
          details: 'Consumables: High-flow oil filter element, O-ring seal & sump plug cleaning',
          quantity: 1,
          unitPrice: 180,
        },
        {
          description: 'ENGINE TEARDOWN, CLEANING, DECARB & REBUILD LABOUR',
          details: 'Labour: Certified technician bench teardown, precision fitment, valve lash & test run',
          quantity: 1,
          unitPrice: 2800,
        },
        {
          description: 'POST-REBUILD TUNING & ROAD TESTING DINO RUN',
          details: 'Diagnostics: Full OBD-II scan, thermal cycle monitoring & road test validation',
          quantity: 1,
          unitPrice: 450,
        },
      ]);
      toast.success('Loaded Himalayan 411 Rebuild SOW Package with Gemini details!');
    } else if (templateType === 'classic') {
      setVehicleModel('Royal Enfield Classic 350');
      setServiceScope('Classic 350 Overhaul & Service');
      setLineItems([
        {
          description: 'CYLINDER BORE & PISTON OVERSIZE KIT',
          details: 'Machining: Precision cylinder reboring to next oversize with plateau cross-hatch honing',
          quantity: 1,
          unitPrice: 3800,
        },
        {
          description: 'LATHE HEAD FACING & VALVE SEATING',
          details: 'Machining: Precision head facing to restore true flatness and optimal combustion sealing',
          quantity: 1,
          unitPrice: 1200,
        },
        {
          description: 'HEAVY DUTY CLUTCH PLATE & FRICTION SET',
          details: 'Transmission Core: Heavy-duty friction plates, steel drive plates & damper springs kit',
          quantity: 1,
          unitPrice: 1650,
        },
        {
          description: 'PREMIUM ENGINE OIL 15W50 (2.5L)',
          details: 'Consumables: Premium fully synthetic 4T engine oil, drain plug washer & flush',
          quantity: 1,
          unitPrice: 1250,
        },
        {
          description: 'FULL ENGINE OVERHAUL & BLUEPRINTING LABOUR',
          details: 'Labour: Certified technician bench teardown, precision fitment, valve lash & test run',
          quantity: 1,
          unitPrice: 3200,
        },
      ]);
      toast.success('Loaded Classic 350 SOW Package with Gemini details!');
    } else {
      setLineItems([
        {
          description: 'PREMIUM FULLY SYNTHETIC 4T ENGINE OIL',
          details: 'Consumables: Premium fully synthetic 4T engine oil, drain plug washer & flush',
          quantity: 1,
          unitPrice: 850,
        },
        {
          description: 'HIGH-FLOW OIL FILTER ELEMENT',
          details: 'Consumables: High-flow oil filter element, O-ring seal & magnetic sump plug cleaning',
          quantity: 1,
          unitPrice: 160,
        },
        {
          description: 'CERAMIC FRONT & REAR BRAKE PADS OVERHAUL',
          details: 'Braking System: Sintered brake pads, rotor caliper pin greasing & disc skim facing',
          quantity: 1,
          unitPrice: 750,
        },
        {
          description: 'LASER IRIDIUM SPARK PLUG',
          details: 'Ignition: Laser iridium / nickel spark plug with calibrated electrode gap',
          quantity: 1,
          unitPrice: 320,
        },
        {
          description: '32-POINT GENERAL INSPECTION, LUBRICATION & LABOUR',
          details: 'Labour: Complete 32-point inspection, chain slack adjustment, fastener torquing & wash',
          quantity: 1,
          unitPrice: 950,
        },
      ]);
      toast.success('Loaded Periodic Major Service SOW Package with Gemini details!');
    }
  };

  const handleAiAutoExplainAll = async () => {
    const itemsToExplain = lineItems.filter((it) => it.description?.trim());
    if (itemsToExplain.length === 0) {
      toast.error('Add at least one service or spare title first');
      return;
    }

    setAiExplaining(true);
    const toastId = toast.loading('Gemini AI generating technical breakdowns...');
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToExplain.map((it) => it.description),
        }),
      });

      if (!res.ok) throw new Error('AI Explainer response error');
      const data = await res.json();
      const explanations = data.explanations || {};

      setLineItems((prev) =>
        prev.map((it) => ({
          ...it,
          details: explanations[it.description] || it.details || getAutomotiveTechnicalExplanation(it.description),
        }))
      );
      toast.success('Gemini AI auto-filled technical explanations!', { id: toastId });
    } catch (err) {
      console.error('AI Explain error:', err);
      // Fallback to local automotive knowledge engine
      setLineItems((prev) =>
        prev.map((it) => ({
          ...it,
          details: it.details || getAutomotiveTechnicalExplanation(it.description),
        }))
      );
      toast.success('Auto-filled technical explanations!', { id: toastId });
    } finally {
      setAiExplaining(false);
    }
  };

  const calculatedSubtotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const calculatedTax = Math.round(calculatedSubtotal * 0.18);
  const calculatedTotal = calculatedSubtotal + calculatedTax;

  const handleCreateInvoice = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    if (lineItems.length === 0 || calculatedTotal <= 0) {
      toast.error('Please add at least one line item with a price');
      return;
    }

    try {
      setSubmitting(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('userId');
      if (!userId) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const finalNotes = JSON.stringify({
        vehicleModel: vehicleModel.trim() || undefined,
        vehicleReg: vehicleReg.trim() || undefined,
        serviceScope: serviceScope.trim() || undefined,
        userNotes: undefined,
        isEstimate: invoiceType === 'ESTIMATE',
      });

      const payload = {
        userId,
        customerId: selectedCustomerId,
        paymentMode,
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        discount: 0,
        total: calculatedTotal,
        docType: invoiceType,
        isEstimate: invoiceType === 'ESTIMATE',
        notes: finalNotes,
        items: lineItems.map((item) => {
          let det = item.details;
          if (!det?.trim()) {
            det = getAutomotiveTechnicalExplanation(item.description);
          }
          return {
            description: item.description || 'Workshop Service',
            details: det || undefined,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            tax: Math.round(((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)) * 0.18),
            total: Math.round(((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)) * 1.18),
          };
        }),
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || 'Failed to create invoice');
        return;
      }

      const created = await res.json();
      toast.success(`${invoiceType === 'ESTIMATE' ? 'Estimate' : 'Invoice'} ${created.invoiceNumber || 'created'} saved successfully!`);
      setIsModalOpen(false);
      setLineItems([{ description: 'General Service & Inspection', quantity: 1, unitPrice: 1500 }]);
      await fetchInvoices();

      // Trigger automatic PDF download
      void handleDownloadBillPdf(created, invoiceType);
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'unpaid':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'overdue':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
  const totalPending = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader text="Loading Invoices" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage billing, estimates, and payments</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/import"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <FileUp className="w-4 h-4" />
            Import Vyapar / Gemini Bill
          </Link>
          <PearlButton onClick={() => setIsModalOpen(true)} className="text-xs">
            <Plus className="w-4 h-4 mr-1 text-luxury-gold" />
            New Invoice / Estimate
          </PearlButton>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-ink-light/50 dark:text-luxury-ink-dark/50" />
          <input
            type="text"
            placeholder="Search by invoice number, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luxury-surface-light dark:bg-luxury-surface-dark text-luxury-ink-light dark:text-luxury-ink-dark border border-luxury-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxury-gold placeholder:text-luxury-ink-light/50 dark:placeholder:text-luxury-ink-dark/50"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-ink-light/50 dark:text-luxury-ink-dark/50 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luxury-surface-light dark:bg-luxury-surface-dark text-luxury-ink-light dark:text-luxury-ink-dark border border-luxury-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxury-gold appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold text-foreground mt-1">{invoices.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pending</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No invoices found</p>
            <p className="text-sm text-muted-foreground mt-1">Create an invoice or adjust your search filters</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <span className="font-mono font-bold text-lg text-foreground">{invoice.invoiceNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    {invoice.jobCard && (
                      <span className="text-xs text-muted-foreground font-mono">
                        Job: {invoice.jobCard.jobNumber}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="text-sm font-medium text-foreground">{invoice.customer?.name || 'Walk-in'}</p>
                      <p className="text-xs text-muted-foreground">{invoice.customer?.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Invoice Date</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Mode</p>
                      <p className="text-sm font-medium text-foreground uppercase">{invoice.paymentMode}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Subtotal</p>
                      <p className="text-sm font-medium text-foreground">₹{invoice.subtotal.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">GST (18%)</p>
                      <p className="text-sm font-medium text-foreground">₹{invoice.tax.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-sm font-bold text-foreground">₹{invoice.total.toLocaleString('en-IN')}</p>
                    </div>
                    {invoice.balance > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Balance Due</p>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">₹{invoice.balance.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Items ({invoice.items?.length || 0})</p>
                    <p className="text-sm text-foreground">
                      {invoice.items?.slice(0, 2).map((item) => item.description).join(', ')}
                      {(invoice.items?.length || 0) > 2 && ` +${invoice.items.length - 2} more`}
                    </p>
                  </div>
                </div>

                  {/* Right Section - Actions */}
                  <div className="flex lg:flex-col gap-2">
                    <div className="flex gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(invoice)}
                        className="flex-1 px-2.5 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-1 shadow-sm"
                        title="Edit Invoice Details & Line Items"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                        className="px-2.5 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-1 shadow-sm"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenCounterUpi(invoice)}
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-[#C9F31D] text-[#0B0F19] font-bold rounded-lg hover:bg-[#d8ff33] transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      title="Show Dynamic Counter UPI QR Code for quick payment"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Counter UPI QR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(invoice)}
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      title="Send Bill Summary & PDF link via WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      WhatsApp Bill
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintThermalSlip(invoice)}
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-slate-800 text-slate-100 font-semibold rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      title="Print 58mm / 80mm ESC/POS Monospace Thermal Receipt Slip"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#C9F31D]" />
                      Thermal Slip
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadBillPdf(invoice, 'INVOICE')}
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-red-600/90 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      title="Download Tax Invoice / Bill (Red, Black & White format)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Bill PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadBillPdf(invoice, 'ESTIMATE')}
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-luxury-surface-light dark:bg-luxury-surface-dark text-luxury-ink-light dark:text-luxury-ink-dark border border-luxury-gold/40 font-semibold rounded-lg hover:border-luxury-gold transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      title="Download Estimate / Quote (Red, Black & White format)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Estimate PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadBillPdf(invoice, 'SOW_BILL')}
                      className="flex-1 lg:flex-none px-3 py-1.5 bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold rounded-lg hover:opacity-95 transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      title="Download Scope of Work (SOW) Bill with Detailed Parts/Labour Breakdown & Run-In Schedule"
                    >
                      <Download className="w-3.5 h-3.5" />
                      SOW Bill PDF
                    </button>
                  </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Invoice / Estimate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-luxury-gold/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Create New Invoice / Estimate</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter billing items, select customer, and generate PDF
              </p>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {/* Gemini AI Auto-Draft Assistant Box */}
              <div className="p-3.5 bg-gradient-to-r from-purple-900/25 via-indigo-900/20 to-amber-900/15 border border-purple-500/30 rounded-xl space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-foreground">✨ Gemini AI Auto-Draft SOW Bill</span>
                    <span className="text-[9px] bg-purple-500/20 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Zero Typing Needed
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Type prompt or pick template</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 'Royal Enfield Himalayan 411 half engine rebuild' or paste parts list..."
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs focus:ring-2 focus:ring-luxury-gold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleDraftWithAi();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleDraftWithAi}
                    disabled={draftingWithAi}
                    className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shrink-0 shadow active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    {draftingWithAi ? 'AI Generating...' : '✨ Generate with AI'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-muted-foreground mr-1">1-Click SOW Templates:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyQuickTemplate('himalayan')}
                    className="text-[10px] px-2.5 py-1 bg-background hover:bg-muted border border-border rounded-md text-foreground font-medium transition-colors shadow-xs"
                  >
                    🏍️ Himalayan 411 Rebuild
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyQuickTemplate('classic')}
                    className="text-[10px] px-2.5 py-1 bg-background hover:bg-muted border border-border rounded-md text-foreground font-medium transition-colors shadow-xs"
                  >
                    🔧 Classic 350 Overhaul
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyQuickTemplate('service')}
                    className="text-[10px] px-2.5 py-1 bg-background hover:bg-muted border border-border rounded-md text-foreground font-medium transition-colors shadow-xs"
                  >
                    ⚡ Periodic Major Service
                  </button>
                </div>
              </div>

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInvoiceType('INVOICE')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    invoiceType === 'INVOICE'
                      ? 'bg-red-600 text-white shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tax Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceType('ESTIMATE')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    invoiceType === 'ESTIMATE'
                      ? 'bg-luxury-gold text-slate-900 shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Estimate / Quotation
                </button>
              </div>

              {/* Customer Selector */}
              <div>
                <label htmlFor="create-invoice-customer" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Select Customer *
                </label>
                <select
                  id="create-invoice-customer"
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedCustomerId(cId);
                    const cust = customers.find((c) => c.id === cId);
                    if (cust?.vehicles && cust.vehicles.length > 0) {
                      const v = cust.vehicles[0];
                      const fullModel = `${v.make || ''} ${v.model || ''}`.trim();
                      if (fullModel && !fullModel.toLowerCase().includes('standard')) {
                        setVehicleModel(fullModel);
                      }
                      if (v.registrationNo) {
                        setVehicleReg(v.registrationNo);
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle & Service Scope Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                <div>
                  <label htmlFor="create-invoice-vehicle-model" className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Vehicle Make & Model
                  </label>
                  <input
                    id="create-invoice-vehicle-model"
                    type="text"
                    placeholder="e.g. Royal Enfield Classic 350"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div>
                  <label htmlFor="create-invoice-vehicle-reg" className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Registration No.
                  </label>
                  <input
                    id="create-invoice-vehicle-reg"
                    type="text"
                    placeholder="e.g. GJ01PU7510"
                    value={vehicleReg}
                    onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-luxury-gold uppercase"
                  />
                </div>
                <div>
                  <label htmlFor="create-invoice-service-scope" className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Service Scope / Title
                  </label>
                  <input
                    id="create-invoice-service-scope"
                    type="text"
                    placeholder="e.g. Classic 350 Overhaul & Service"
                    value={serviceScope}
                    onChange={(e) => setServiceScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label htmlFor="create-invoice-payment-mode" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Payment Mode
                </label>
                <select
                  id="create-invoice-payment-mode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="card">Card / POS</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Items & Labor Charges *
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAiAutoExplainAll}
                      disabled={aiExplaining}
                      className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:opacity-90 transition-all text-xs flex items-center gap-1.5 shadow-sm"
                      title="Automatically regenerate all technical work/spare explanations via Gemini AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      {aiExplaining ? 'AI Generating...' : '✨ Gemini Re-Explain'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-semibold text-luxury-gold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Line
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={`line-item-${index}`} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Service / Spare Title (e.g. CYLINDER BLOCK & PISTON KIT)"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                          required
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-16 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs text-center focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                          required
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Price (₹)"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                          className="w-24 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs text-right focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                          required
                        />
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Automated Gemini AI Technical Explanation Badge with optional customize */}
                      <div className="flex items-center justify-between bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25 rounded-lg px-2.5 py-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-300 font-medium truncate flex-1 mr-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-bold text-[9px] uppercase tracking-wide bg-purple-500/20 text-purple-950 dark:text-purple-200 px-1 py-0.5 rounded shrink-0">
                            Gemini Auto-Detail
                          </span>
                          <span className="truncate text-foreground/80 italic font-normal">
                            "{item.details || getAutomotiveTechnicalExplanation(item.description)}"
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingDetailIndex(editingDetailIndex === index ? null : index)}
                          className="text-[10px] text-muted-foreground hover:text-foreground font-semibold underline shrink-0"
                          title="Override or edit this technical description if needed"
                        >
                          {editingDetailIndex === index ? 'Done' : 'Customize'}
                        </button>
                      </div>
                      {editingDetailIndex === index && (
                        <input
                          type="text"
                          value={item.details || ''}
                          onChange={(e) => handleItemChange(index, 'details', e.target.value)}
                          placeholder="Customize Gemini technical explanation..."
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-luxury-gold"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-3.5 rounded-lg bg-muted/60 border border-border space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-foreground">₹{calculatedSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (18%):</span>
                  <span className="font-semibold text-foreground">₹{calculatedTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-1">
                  <span>Grand Total:</span>
                  <span className="text-luxury-gold">₹{calculatedTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted text-foreground"
                >
                  Cancel
                </button>
                <PearlButton type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : `Save & Generate ${invoiceType === 'INVOICE' ? 'Invoice' : 'Estimate'} PDF`}
                </PearlButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Counter UPI QR Code Modal */}
      {selectedUpiInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-luxury-surface-light dark:bg-[#151D2F] border border-[#C9F31D]/40 rounded-2xl max-w-sm w-full p-6 text-center relative shadow-2xl">
            <button
              onClick={() => {
                setSelectedUpiInvoice(null);
                setUpiQrDataUrl(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex p-3 rounded-full bg-[#C9F31D]/10 text-[#C9F31D] mb-3">
              <QrCode className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-foreground">
              Counter UPI Payment
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Invoice #{selectedUpiInvoice.invoiceNumber} · {selectedUpiInvoice.customer?.name}
            </p>

            {/* QR Code Container */}
            <div className="my-5 p-4 bg-white rounded-xl inline-block shadow-inner border border-gray-200">
              {loadingQr || !upiQrDataUrl ? (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-500">
                  Generating Counter QR...
                </div>
              ) : (
                <img
                  src={upiQrDataUrl}
                  alt={`UPI QR for ${selectedUpiInvoice.invoiceNumber}`}
                  className="w-48 h-48 mx-auto"
                />
              )}
            </div>

            <div className="bg-black/20 dark:bg-black/40 rounded-xl p-3 border border-border/40 mb-4">
              <p className="text-xs text-muted-foreground">Amount to Pay</p>
              <p className="text-2xl font-black text-[#C9F31D] font-mono mt-0.5">
                ₹{(selectedUpiInvoice.balance > 0 ? selectedUpiInvoice.balance : selectedUpiInvoice.total).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Scan with any UPI App: GPay, PhonePe, Paytm, BHIM
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedUpiInvoice(null);
                  setUpiQrDataUrl(null);
                }}
                className="w-full py-2.5 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted/80 text-sm transition-colors"
              >
                Close Counter Display
              </button>
            </div>

            <div className="mt-3 text-center">
              <Link
                href="/dashboard/settings/branding"
                className="text-[11px] text-luxury-gold hover:underline inline-flex items-center gap-1 font-medium"
              >
                ⚙️ Upload or Change Workshop Standee QR in Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {isEditModalOpen && editingInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-luxury-surface-light dark:bg-[#151D2F] border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 relative shadow-2xl my-8">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingInvoice(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Edit Invoice #{editingInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Customer: {editingInvoice.customer?.name || 'Walk-in'}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-invoice-status" className="text-xs font-semibold text-muted-foreground">Status</label>
                  <select
                    id="edit-invoice-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-invoice-payment-mode" className="text-xs font-semibold text-muted-foreground">Payment Mode</label>
                  <select
                    id="edit-invoice-payment-mode"
                    value={editPaymentMode}
                    onChange={(e) => setEditPaymentMode(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / QR</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Vehicle & Service Scope Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-black/20 dark:bg-black/40 border border-border/60">
                <div>
                  <label htmlFor="edit-invoice-vehicle-model" className="block text-[11px] font-bold text-muted-foreground mb-1">
                    Vehicle Make & Model
                  </label>
                  <input
                    id="edit-invoice-vehicle-model"
                    type="text"
                    placeholder="e.g. Royal Enfield Classic 350"
                    value={editVehicleModel}
                    onChange={(e) => setEditVehicleModel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-invoice-vehicle-reg" className="block text-[11px] font-bold text-muted-foreground mb-1">
                    Registration No.
                  </label>
                  <input
                    id="edit-invoice-vehicle-reg"
                    type="text"
                    placeholder="e.g. GJ01PU7510"
                    value={editVehicleReg}
                    onChange={(e) => setEditVehicleReg(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono font-semibold uppercase focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label htmlFor="edit-invoice-service-scope" className="block text-[11px] font-bold text-muted-foreground mb-1">
                    Service Scope / Title
                  </label>
                  <input
                    id="edit-invoice-service-scope"
                    type="text"
                    placeholder="e.g. Classic 350 Overhaul & Service"
                    value={editServiceScope}
                    onChange={(e) => setEditServiceScope(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-border/60 rounded-xl p-3 bg-black/10 dark:bg-black/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Line Items ({editLineItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditLineItems((prev) => [
                        ...prev,
                        { description: '', quantity: 1, unitPrice: 0 },
                      ])
                    }
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editLineItems.map((item, idx) => (
                    <div key={`edit-item-${idx}`} className="flex gap-2 items-center bg-card/60 p-2 rounded-lg border border-border/40">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Item Description"
                          value={item.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditLineItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, description: val } : it))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-xs text-foreground"
                          required
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 1;
                            setEditLineItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                            );
                          }}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground text-center"
                          required
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="Price"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setEditLineItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, unitPrice: val } : it))
                            );
                          }}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground text-right font-mono"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditLineItems((prev) => prev.filter((_, i) => i !== idx))
                        }
                        disabled={editLineItems.length <= 1}
                        className="p-1.5 text-rose-400 hover:text-rose-300 disabled:opacity-30 rounded"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-invoice-discount" className="text-xs font-semibold text-muted-foreground">Discount (₹)</label>
                  <input
                    id="edit-invoice-discount"
                    type="number"
                    min="0"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="edit-invoice-paid" className="text-xs font-semibold text-muted-foreground">Amount Paid (₹)</label>
                  <input
                    id="edit-invoice-paid"
                    type="number"
                    min="0"
                    value={editPaid}
                    onChange={(e) => setEditPaid(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-invoice-notes" className="text-xs font-semibold text-muted-foreground">Notes / Remarks</label>
                <textarea
                  id="edit-invoice-notes"
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Optional technician or customer note..."
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground"
                />
              </div>

              {/* Summary Calculation */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-xs flex justify-between items-center font-mono">
                <div>
                  <span className="text-muted-foreground">Subtotal: </span>
                  <span className="font-bold text-foreground">
                    ₹{editLineItems.reduce((acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">GST (18%): </span>
                  <span className="font-bold text-foreground">
                    ₹{Math.round(Math.max(0, editLineItems.reduce((acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0) - (Number(editDiscount) || 0)) * 0.18).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-black text-amber-400">
                    ₹{Math.max(0, editLineItems.reduce((acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0) - (Number(editDiscount) || 0) + Math.round(Math.max(0, editLineItems.reduce((acc, it) => acc + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0) - (Number(editDiscount) || 0)) * 0.18)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingInvoice(null);
                  }}
                  className="w-1/2 py-2.5 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted/80 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingInvoice}
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {updatingInvoice ? 'Saving Changes...' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
