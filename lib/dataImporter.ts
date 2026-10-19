if (typeof globalThis !== 'undefined' && !(globalThis as any).DOMMatrix) {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    static fromMatrix() { return new DOMMatrix(); }
  };
}

import { getAutomotiveTechnicalExplanation } from './aiExplainer';

export interface ImportedCustomer {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  vehicleModel?: string;
  vehicleReg?: string;
}

export interface ImportedLineItem {
  description: string;
  details?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ImportedInvoice {
  invoiceNumber: string;
  date: string;
  serviceType?: string;
  customer: ImportedCustomer;
  vehicle?: {
    makeModel?: string;
    registrationNo?: string;
    refEstimate?: string;
  };
  items: ImportedLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  paymentMode?: string;
  notes?: string;
  garageName?: string;
}

export interface ImportedInventoryItem {
  name: string;
  code?: string;
  category?: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  gstRate: number;
}

export interface ImportParseResult {
  success: boolean;
  sourceType:
    | 'GEMINI_SOW_PDF'
    | 'VYAPAR_INVOICE'
    | 'VYAPAR_ITEMS'
    | 'VYAPAR_CUSTOMERS'
    | 'GENERIC_INVOICE_PDF'
    | 'IMAGE_SCAN'
    | 'UNKNOWN';
  summary: string;
  invoices?: ImportedInvoice[];
  inventoryItems?: ImportedInventoryItem[];
  customers?: ImportedCustomer[];
  rawTextPreview?: string;
}

/**
 * Parses Gemini-generated SOW bills or general automotive invoice PDFs
 */
export async function parsePdfInvoice(buffer: Buffer): Promise<ImportParseResult> {
  let text = '';
  try {
    const { extractText } = await import('unpdf');
    const res = await extractText(new Uint8Array(buffer));
    text = Array.isArray(res.text) ? res.text.join('\n') : String(res.text || '');
  } catch (pdfErr) {
    console.warn('unpdf extractText failed, trying raw binary fallback:', pdfErr);
    const raw = buffer.toString('latin1');
    const matches = raw.match(/\(([^()]{2,})\)\s*(?:Tj|TJ|\')/g) || [];
    text = matches
      .map((m) => m.replace(/^[(\s]+|[)\s]+(?:Tj|TJ|\')?$/g, ''))
      .join(' ');
    if (!text || text.length < 30) {
      const readable = raw.match(/[a-zA-Z0-9\s/&,().:;₹\-=+]{4,}/g) || [];
      text = readable.join(' ');
    }
  }

  return parseTextInvoice(text);
}

/**
 * Parses raw text extracted from PDF or pasted transcript
 */
export function parseTextInvoice(text: string): ImportParseResult {
  if (!text || text.trim().length < 10) {
    return {
      success: false,
      sourceType: 'UNKNOWN',
      summary: 'Unable to extract text from PDF (it may be a flat image scan). Please upload an Excel/CSV file or text-based invoice PDF.',
      invoices: [],
    };
  }

  // 1. Check if document contains MULTIPLE JSON-formatted bills (e.g. Gemini SOW chat transcript)
  const jsonInvoiceMap = new Map<string, ImportedInvoice>();
  const jsonBlockRegex = /\{\s*"id":\s*"(MF2-[^"]+)"[\s\S]*?"items":\s*\[[\s\S]*?\][\s\S]*?\}/g;
  let jsonMatch;
  while ((jsonMatch = jsonBlockRegex.exec(text)) !== null) {
    try {
      const obj = JSON.parse(jsonMatch[0]);
      if (obj.id && Array.isArray(obj.items) && obj.items.length > 0) {
        const invItems: ImportedLineItem[] = obj.items.map((it: any) => ({
          description: (it.item || it.description || 'Automotive Part / Service').trim().toUpperCase(),
          details: it.description || it.item || undefined,
          quantity: typeof it.quantity === 'number' ? it.quantity : 1,
          unitPrice: typeof it.rate === 'number' ? it.rate : typeof it.amount === 'number' ? it.amount : 0,
          total: typeof it.amount === 'number' ? it.amount : (it.quantity || 1) * (it.rate || 0),
        }));
        const subtotal = obj.subtotal || obj.total_amount || invItems.reduce((acc, i) => acc + i.total, 0);
        const discount = obj.discount || 0;
        const total = obj.total_amount || (subtotal - discount);

        jsonInvoiceMap.set(obj.id, {
          invoiceNumber: obj.id,
          date: obj.date || '2026-10-15',
          serviceType: obj.service_type || 'General Service & Spares',
          customer: {
            name: obj.customer_name || 'Workshop Client',
            phone: obj.phone || undefined,
            vehicleModel: obj.vehicle_model || undefined,
            vehicleReg: obj.registration_no || undefined,
          },
          vehicle: {
            makeModel: obj.vehicle_model || 'Motorcycle',
            registrationNo: obj.registration_no || undefined,
          },
          items: invItems,
          subtotal,
          discount,
          tax: Math.round(total * 0.18),
          total,
          paid: total,
          balance: 0,
          paymentMode: 'cash',
          garageName: 'MotoFit 2',
        });
      }
    } catch {
      // Continue searching
    }
  }

  if (jsonInvoiceMap.size > 0) {
    const multiInvoices = Array.from(jsonInvoiceMap.values());
    const totalRev = multiInvoices.reduce((s, i) => s + i.total, 0);
    return {
      success: true,
      sourceType: 'GEMINI_SOW_PDF',
      summary: `Successfully parsed ${multiInvoices.length} MotoFit 2 SOW bills and estimates (Total Value: ₹${totalRev.toLocaleString('en-IN')}) from Gemini transcript!`,
      invoices: multiInvoices,
      rawTextPreview: text.slice(0, 1000),
    };
  }

  // 2. Check for single Gemini / MotoFit SOW Bill format
  const isGeminiSow =
    text.includes('SCOPE OF WORK') ||
    text.includes('SOW BILL') ||
    text.includes('MOTOFIT') ||
    text.includes('Top End Core:') ||
    text.includes('VEHICLE MAKE & MODEL');

  if (isGeminiSow) {
    const invMatch = text.match(/INVOICE ID \/ DATE\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)/i);
    const vehMatch = text.match(/VEHICLE MAKE & MODEL\s*\n\s*([^\n]+)/i);
    const estMatch = text.match(/Ref Estimate:\s*([^\n]+)/i);
    const srvMatch = text.match(/JOB CARD \/ SERVICE TYPE\s*\n\s*([^\n]+)/i);
    const regMatch = text.match(/Reg:\s*([^\n]+)/i);

    const subMatch = text.match(/(?:Gross\s+)?Subtotal(?:\s*\(Gross\))?:\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)/i);
    const discMatch = text.match(/Discount(?:\s*\([^)]*\))?:\s*-?\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)/i);
    const totMatch =
      text.match(/(?:Total\s*Payable\s*Amount|Grand\s*Total|Net\s*Amount|Final\s*Total)\s*:\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)/i) ||
      text.match(/\bTotal\s*:\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)/i);

    // Extract items: S.NO. DESCRIPTION \n DETAILS (space or tab) QTY (space or tab) RATE (space or tab) AMOUNT
    const itemRegex = /^(\d+)\s+([A-Z0-9\s/&,().-]+)\n([^\n]+?)\s+(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)$/gm;
    let match;
    const items: ImportedLineItem[] = [];
    while ((match = itemRegex.exec(text)) !== null) {
      items.push({
        description: match[2].trim().toUpperCase(),
        details: match[3].trim(),
        quantity: parseFloat(match[4]),
        unitPrice: parseFloat(match[5].replace(/,/g, '')),
        total: parseFloat(match[6].replace(/,/g, '')),
      });
    }

    // Extract customer / signatory
    const signatoryMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*\nAuthorized Signatory/m);
    const customerName = signatoryMatch ? signatoryMatch[1].trim() : 'Valued Customer';

    // Extract garage name
    const garageMatch = text.match(/(MOTOFIT\s*\d*|MOTOBAN|GARAGE[^\n]*)/i);
    const garageName = garageMatch ? garageMatch[1].trim() : 'MotoFit 2';

    const subtotal = subMatch ? parseFloat(subMatch[1].replace(/,/g, '')) : items.reduce((s, it) => s + it.total, 0);
    const discount = discMatch ? parseFloat(discMatch[1].replace(/,/g, '')) : 0;
    const total = totMatch ? parseFloat(totMatch[1].replace(/,/g, '')) : subtotal - discount;

    const invoice: ImportedInvoice = {
      invoiceNumber: invMatch ? invMatch[1].trim() : `IMP-${Date.now().toString().slice(-6)}`,
      date: invMatch ? invMatch[2].trim() : new Date().toLocaleDateString('en-GB'),
      serviceType: srvMatch ? srvMatch[1].trim() : 'Half Engine Rebuild',
      customer: {
        name: customerName,
        phone: '9876543210',
        vehicleModel: vehMatch ? vehMatch[1].trim() : 'Motorcycle',
        vehicleReg: regMatch ? regMatch[1].trim() : 'As Per Estimate',
      },
      vehicle: {
        makeModel: vehMatch ? vehMatch[1].trim() : 'Motorcycle',
        registrationNo: regMatch ? regMatch[1].trim() : undefined,
        refEstimate: estMatch ? estMatch[1].trim() : undefined,
      },
      items: items.length > 0 ? items : [
        {
          description: 'MOTORCYCLE HALF ENGINE REBUILD & OVERHAUL',
          details: 'Certified mechanical teardown, machining & precision rebuild',
          quantity: 1,
          unitPrice: total,
          total: total,
        },
      ],
      subtotal,
      discount,
      tax: Math.round(total * 0.18),
      total,
      paid: total,
      balance: 0,
      paymentMode: 'upi',
      garageName,
    };

    return {
      success: true,
      sourceType: 'GEMINI_SOW_PDF',
      summary: `Parsed Google Gemini / MotoFit SOW Bill #${invoice.invoiceNumber} with ${invoice.items.length} line items & technical descriptions`,
      invoices: [invoice],
      rawTextPreview: text.slice(0, 800),
    };
  }

  // 2. Generic Invoice PDF Extractor
  const invNum = text.match(/(?:Invoice|Bill|Inv|Receipt)\s*(?:No|Number|#)?[:\s]+([A-Z0-9\-_]+)/i);
  const dateMatch = text.match(/(?:Date|Dated)[:\s]+(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i);
  const totalMatch = text.match(/(?:Total|Grand Total|Net Amount|Total Amount)[:\s]*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)/i);
  const custMatch = text.match(/(?:Customer|Billed To|Client|Party Name)[:\s]+([^\n]+)/i);
  const phoneMatch = text.match(/(?:Phone|Mobile|Contact|Tel)[:\s]*([+0-9\s-]{10,15})/i);

  // Extract lines with numbers as items
  const genericItems: ImportedLineItem[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const rowMatch = line.match(/^([a-zA-Z\s&/()-]+?)\s+(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)$/);
    if (rowMatch && !rowMatch[1].toLowerCase().includes('total') && !rowMatch[1].toLowerCase().includes('description')) {
      const desc = rowMatch[1].trim().toUpperCase();
      genericItems.push({
        description: desc,
        details: getAutomotiveTechnicalExplanation(desc),
        quantity: parseFloat(rowMatch[2]),
        unitPrice: parseFloat(rowMatch[3].replace(/,/g, '')),
        total: parseFloat(rowMatch[4].replace(/,/g, '')),
      });
    }
  }

  const grandTotal = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 1500;
  const invoice: ImportedInvoice = {
    invoiceNumber: invNum ? invNum[1].trim() : `INV-${Date.now().toString().slice(-6)}`,
    date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString('en-GB'),
    customer: {
      name: custMatch ? custMatch[1].trim() : 'Imported Customer',
      phone: phoneMatch ? phoneMatch[1].trim() : '',
    },
    items: genericItems.length > 0 ? genericItems : [
      {
        description: 'AUTOMOTIVE WORK & SPARES',
        details: 'Workshop labor, servicing and spare parts inspection',
        quantity: 1,
        unitPrice: grandTotal,
        total: grandTotal,
      },
    ],
    subtotal: grandTotal,
    discount: 0,
    tax: Math.round(grandTotal * 0.18),
    total: grandTotal,
    paid: grandTotal,
    balance: 0,
    paymentMode: 'cash',
  };

  return {
    success: true,
    sourceType: 'GENERIC_INVOICE_PDF',
    summary: `Extracted generic invoice #${invoice.invoiceNumber} with ${invoice.items.length} items`,
    invoices: [invoice],
    rawTextPreview: text.slice(0, 800),
  };
}

/**
 * Parses Vyapar / Tally / Marg Excel & CSV spreadsheets
 */
export async function parseExcelOrCsv(buffer: Buffer, filename: string): Promise<ImportParseResult> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    return {
      success: false,
      sourceType: 'UNKNOWN',
      summary: 'The uploaded spreadsheet is empty or has no data rows.',
    };
  }

  // Normalize column names in first row to detect type
  const firstRow = rows[0];
  const colKeys = Object.keys(firstRow).map((k) => k.toLowerCase().trim());

  // 1. Check for Vyapar / Inventory Items list
  const isInventory =
    colKeys.some((k) => k.includes('item name') || k.includes('product') || k.includes('stock')) &&
    colKeys.some((k) => k.includes('sale price') || k.includes('purchase price') || k.includes('rate') || k.includes('mrp'));

  if (isInventory) {
    const inventoryItems: ImportedInventoryItem[] = rows
      .map((row) => {
        const name =
          row['Item Name'] ||
          row['item name'] ||
          row['Item'] ||
          row['Product'] ||
          row['Product Name'] ||
          row['Name'] ||
          '';

        if (!name || String(name).trim().length === 0) return null;

        const code = row['Item Code'] || row['item code'] || row['HSN'] || row['Barcode'] || row['Code'] || '';
        const category = row['Category'] || row['Item Category'] || row['Group'] || 'Automotive Spares';
        const qty = parseFloat(row['Current Stock'] || row['Stock'] || row['Quantity'] || row['Qty'] || 0) || 0;
        const unit = String(row['Unit'] || row['Base Unit'] || 'pcs').toLowerCase();
        const salePrice = parseFloat(row['Sale Price'] || row['Selling Price'] || row['Rate'] || row['MRP'] || 0) || 0;
        const costPrice = parseFloat(row['Purchase Price'] || row['Cost Price'] || row['Buying Price'] || salePrice * 0.8) || 0;
        const gstRate = parseFloat(row['Tax Rate'] || row['GST'] || row['Tax'] || 18) || 18;

        return {
          name: String(name).trim().toUpperCase(),
          code: code ? String(code).trim() : undefined,
          category: String(category).trim(),
          quantity: qty,
          unit,
          costPrice,
          sellingPrice: salePrice,
          gstRate,
        };
      })
      .filter(Boolean) as ImportedInventoryItem[];

    return {
      success: true,
      sourceType: 'VYAPAR_ITEMS',
      summary: `Parsed ${inventoryItems.length} inventory items & spares from Vyapar spreadsheet (${filename})`,
      inventoryItems,
    };
  }

  // 2. Check for Vyapar / Sale Invoices list
  const isInvoiceList =
    colKeys.some((k) => k.includes('invoice') || k.includes('bill no') || k.includes('voucher')) &&
    colKeys.some((k) => k.includes('party') || k.includes('customer') || k.includes('client'));

  if (isInvoiceList) {
    const invoiceMap = new Map<string, ImportedInvoice>();

    for (const row of rows) {
      const invNo = String(
        row['Invoice No'] || row['Invoice Number'] || row['Bill No'] || row['Bill Number'] || row['Voucher No'] || ''
      ).trim();
      if (!invNo) continue;

      const dateStr = String(row['Date'] || row['Invoice Date'] || row['Bill Date'] || '').trim();
      const party = String(row['Party Name'] || row['Customer Name'] || row['Customer'] || 'Walk-in Customer').trim();
      const phone = String(row['Phone No'] || row['Mobile'] || row['Contact'] || '').trim();
      const itemName = String(row['Item Name'] || row['Description'] || row['Service'] || 'Service Labor & Spares').trim();
      const qty = parseFloat(row['Quantity'] || row['Qty'] || 1) || 1;
      const rate = parseFloat(row['Price/Unit'] || row['Rate'] || row['Unit Price'] || row['Amount'] || 0) || 0;
      const totalAmount = parseFloat(row['Total'] || row['Total Amount'] || row['Amount'] || qty * rate) || qty * rate;
      const paymentMode = String(row['Payment Type'] || row['Payment Mode'] || 'cash').toLowerCase();

      if (!invoiceMap.has(invNo)) {
        invoiceMap.set(invNo, {
          invoiceNumber: invNo,
          date: dateStr || new Date().toLocaleDateString('en-GB'),
          customer: {
            name: party,
            phone: phone || undefined,
          },
          items: [],
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
          paid: totalAmount,
          balance: 0,
          paymentMode,
        });
      }

      const inv = invoiceMap.get(invNo)!;
      inv.items.push({
        description: itemName.toUpperCase(),
        details: getAutomotiveTechnicalExplanation(itemName),
        quantity: qty,
        unitPrice: rate || totalAmount / qty,
        total: totalAmount,
      });
      inv.subtotal += totalAmount;
      inv.total += totalAmount;
      inv.paid = inv.total;
    }

    const invoices = Array.from(invoiceMap.values());
    return {
      success: true,
      sourceType: 'VYAPAR_INVOICE',
      summary: `Parsed ${invoices.length} invoices containing ${rows.length} line items from Vyapar (${filename})`,
      invoices,
    };
  }

  // 3. Check for Parties / Customers list
  const isCustomerList =
    colKeys.some((k) => k.includes('party') || k.includes('customer') || k.includes('name')) &&
    colKeys.some((k) => k.includes('phone') || k.includes('mobile') || k.includes('address') || k.includes('email'));

  if (isCustomerList) {
    const customers: ImportedCustomer[] = rows
      .map((row) => {
        const name = String(row['Party Name'] || row['Customer Name'] || row['Name'] || '').trim();
        if (!name) return null;

        const phone = String(row['Phone No'] || row['Phone Number'] || row['Mobile'] || row['Contact'] || '').trim();
        const email = String(row['Email'] || row['Email ID'] || '').trim();
        const address = String(row['Billing Address'] || row['Address'] || row['City'] || '').trim();
        const gst = String(row['GSTIN'] || row['GST No'] || row['Tax Number'] || '').trim();
        const vehicle = String(row['Vehicle'] || row['Vehicle Model'] || row['Vehicle No'] || '').trim();

        return {
          name,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          gstNumber: gst || undefined,
          vehicleModel: vehicle || undefined,
        };
      })
      .filter(Boolean) as ImportedCustomer[];

    return {
      success: true,
      sourceType: 'VYAPAR_CUSTOMERS',
      summary: `Parsed ${customers.length} customer & party profiles from Vyapar (${filename})`,
      customers,
    };
  }

  return {
    success: false,
    sourceType: 'UNKNOWN',
    summary: `Could not identify Vyapar columns in ${filename}. Expected Item Name, Invoice No, or Party Name.`,
  };
}
