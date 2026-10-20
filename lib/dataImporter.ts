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
    const matches = raw.match(/\(([^()]{2,})\)\s*(?:Tj|TJ|')/g) || [];
    text = matches
      .map((m) => m.replace(/^[(\s]+|[)\s]+(?:Tj|TJ|')?$/g, ''))
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
function parseJsonBlockInvoices(text: string): ImportedInvoice[] {
  const jsonInvoiceMap = new Map<string, ImportedInvoice>();
  const jsonBlockRegex = /\{\s*"id":\s*"(MF2-[^"]+)"[\s\S]*?"items":\s*\[[\s\S]*?\][\s\S]*?\}/g;
  let jsonMatch: RegExpExecArray | null;

  while ((jsonMatch = jsonBlockRegex.exec(text)) !== null) {
    try {
      const obj = JSON.parse(jsonMatch[0]);
      if (obj.id && Array.isArray(obj.items) && obj.items.length > 0) {
        const invItems: ImportedLineItem[] = obj.items.map((it: any) => {
          let unitPrice = 0;
          if (typeof it.rate === 'number') {
            unitPrice = it.rate;
          } else if (typeof it.amount === 'number') {
            unitPrice = it.amount;
          }

          return {
            description: (it.item || it.description || 'Automotive Part / Service').trim().toUpperCase(),
            details: it.description || it.item || undefined,
            quantity: typeof it.quantity === 'number' ? it.quantity : 1,
            unitPrice,
            total: typeof it.amount === 'number' ? it.amount : (it.quantity || 1) * (it.rate || 0),
          };
        });
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
          garageName: obj.garage_name || 'Workshop',
        });
      }
    } catch {
      // Continue searching
    }
  }

  return Array.from(jsonInvoiceMap.values());
}

function parseGeminiSowPdf(text: string): ImportParseResult | null {
  const isGeminiSow =
    text.includes('SCOPE OF WORK') ||
    text.includes('SOW BILL') ||
    text.includes('MOTOFIT') ||
    text.includes('Top End Core:') ||
    text.includes('VEHICLE MAKE & MODEL');

  if (!isGeminiSow) return null;

  const invMatch = /INVOICE ID \/ DATE\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)/i.exec(text);
  const vehMatch = /VEHICLE MAKE & MODEL\s*\n\s*([^\n]+)/i.exec(text) ||
                   /(?:Vehicle|Model|Bike|Car)[:\s]+([^\n,]+)/i.exec(text);
  const estMatch = /Ref Estimate:\s*([^\n]+)/i.exec(text);
  const srvMatch = /JOB CARD \/ SERVICE TYPE\s*\n\s*([^\n]+)/i.exec(text) ||
                   /(?:Service Type|Service|Job Type)[:\s]+([^\n,]+)/i.exec(text);
  const regMatch = /Reg:\s*([^\n]+)/i.exec(text);

  const subMatch = /(?:Gross\s+)?Subtotal(?:\s*\(Gross\))?:\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)/i.exec(text);
  const discMatch = /Discount(?:\s*\([^)]*\))?:\s*-?\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)/i.exec(text);
  const totMatch =
    /(?:Total\s*Payable\s*Amount|Grand\s*Total|Net\s*Amount|Final\s*Total)\s*:\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)/i.exec(text) ||
    /\bTotal\s*:\s*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)/i.exec(text);

  // Extract items: S.NO. DESCRIPTION \n DETAILS QTY RATE AMOUNT
  const itemRegex = /^(\d+)\s+([^\n]+)\n([^\n]+?)\s+(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)$/gm;
  let match: RegExpExecArray | null;
  const items: ImportedLineItem[] = [];
  while ((match = itemRegex.exec(text)) !== null) {
    items.push({
      description: match[2].trim().toUpperCase(),
      details: match[3].trim(),
      quantity: Number.parseFloat(match[4]),
      unitPrice: Number.parseFloat(match[5].replace(/,/g, '')),
      total: Number.parseFloat(match[6].replace(/,/g, '')),
    });
  }

  if (items.length === 0) {
    const singleLineRegex = /^(\d+)\s+([^\n]+?)\s+(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)$/gm;
    while ((match = singleLineRegex.exec(text)) !== null) {
      items.push({
        description: match[2].trim().toUpperCase(),
        details: getAutomotiveTechnicalExplanation(match[2].trim()),
        quantity: Number.parseFloat(match[3]),
        unitPrice: Number.parseFloat(match[4].replace(/,/g, '')),
        total: Number.parseFloat(match[5].replace(/,/g, '')),
      });
    }
  }

  // Extract customer / signatory
  const signatoryMatch = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*\nAuthorized Signatory/m.exec(text) ||
                         /(?:Customer|Client|Party Name|Billed To)[:\s]+([^\n]+)/i.exec(text);
  const customerName = signatoryMatch ? signatoryMatch[1].trim() : 'Valued Customer';

  // Extract customer phone
  const phoneMatch = /(?:Phone|Mobile|Contact|Tel)[:\s]*([+0-9\s-]{10,15})/i.exec(text) ||
                     /(?:\+91[\s-]?)?[6-9]\d{9}/.exec(text);
  const customerPhone = phoneMatch ? phoneMatch[0].replace(/[^0-9+]/g, '') : '';

  // Extract garage name
  const garageMatch = /(MOTOFIT\s*\d*|MOTOBAN|GARAGE[^\n]*)/i.exec(text);
  const garageName = garageMatch ? garageMatch[1].trim() : 'Workshop';

  const subtotal = subMatch ? Number.parseFloat(subMatch[1].replace(/,/g, '')) : items.reduce((s, it) => s + it.total, 0);
  const discount = discMatch ? Number.parseFloat(discMatch[1].replace(/,/g, '')) : 0;
  let total = 0;
  if (totMatch) {
    total = Number.parseFloat(totMatch[1].replace(/,/g, ''));
  } else if (subtotal > 0) {
    total = subtotal - discount;
  }

  const invoice: ImportedInvoice = {
    invoiceNumber: invMatch ? invMatch[1].trim() : `IMP-${Date.now().toString().slice(-6)}`,
    date: invMatch ? invMatch[2].trim() : new Date().toLocaleDateString('en-GB'),
    serviceType: srvMatch ? srvMatch[1].trim() : 'Vehicle Maintenance & Service',
    customer: {
      name: customerName,
      phone: customerPhone,
      vehicleModel: vehMatch ? vehMatch[1].trim() : 'Vehicle',
      vehicleReg: regMatch ? regMatch[1].trim() : 'As Per Estimate',
    },
    vehicle: {
      makeModel: vehMatch ? vehMatch[1].trim() : 'Vehicle',
      registrationNo: regMatch ? regMatch[1].trim() : undefined,
      refEstimate: estMatch ? estMatch[1].trim() : undefined,
    },
    items: items.length > 0 ? items : [
      {
        description: srvMatch ? srvMatch[1].trim().toUpperCase() : 'VEHICLE MAINTENANCE & SERVICE',
        details: 'Certified mechanical inspection and servicing',
        quantity: 1,
        unitPrice: total,
        total,
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
    summary: `Parsed invoice #${invoice.invoiceNumber} (${invoice.vehicle?.makeModel || 'Vehicle'}) with ${invoice.items.length} line items`,
    invoices: [invoice],
    rawTextPreview: text.slice(0, 800),
  };
}

function parseGenericInvoicePdf(text: string): ImportParseResult {
  const invNum = /(?:Invoice|Bill|Inv|Receipt)\s*(?:No|Number|#)?[:\s]+([A-Z0-9\-_]+)/i.exec(text);
  const dateMatch = /(?:Date|Dated)[:\s]+(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i.exec(text);
  const totalMatch = /(?:Total|Grand Total|Net Amount|Total Amount)[:\s]*(?:₹|Rs\.?)?\s*([\d,]+(?:\.\d+)?)/i.exec(text);
  const custMatch = /(?:Customer|Billed To|Client|Party Name)[:\s]+([^\n]+)/i.exec(text);
  const phoneMatch = /(?:Phone|Mobile|Contact|Tel)[:\s]*([+0-9\s-]{10,15})/i.exec(text) ||
                     /(?:\+91[\s-]?)?[6-9]\d{9}/.exec(text);

  const genericItems: ImportedLineItem[] = [];
  const lines = text.split('\n');
  const rowRegex = /^([a-zA-Z\s&/()-]+?)\s+(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)$/;

  for (const line of lines) {
    const rowMatch = rowRegex.exec(line);
    if (rowMatch && !rowMatch[1].toLowerCase().includes('total') && !rowMatch[1].toLowerCase().includes('description')) {
      const desc = rowMatch[1].trim().toUpperCase();
      genericItems.push({
        description: desc,
        details: getAutomotiveTechnicalExplanation(desc),
        quantity: Number.parseFloat(rowMatch[2]),
        unitPrice: Number.parseFloat(rowMatch[3].replace(/,/g, '')),
        total: Number.parseFloat(rowMatch[4].replace(/,/g, '')),
      });
    }
  }

  const itemsSubtotal = genericItems.reduce((acc, i) => acc + i.total, 0);
  const grandTotal = totalMatch ? Number.parseFloat(totalMatch[1].replace(/,/g, '')) : Math.max(0, itemsSubtotal);
  const invoice: ImportedInvoice = {
    invoiceNumber: invNum ? invNum[1].trim() : `INV-${Date.now().toString().slice(-6)}`,
    date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString('en-GB'),
    customer: {
      name: custMatch ? custMatch[1].trim() : 'Imported Customer',
      phone: phoneMatch ? phoneMatch[0].replace(/[^0-9+]/g, '') : '',
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
  const multiInvoices = parseJsonBlockInvoices(text);
  if (multiInvoices.length > 0) {
    const totalRev = multiInvoices.reduce((s, i) => s + i.total, 0);
    return {
      success: true,
      sourceType: 'GEMINI_SOW_PDF',
      summary: `Successfully parsed ${multiInvoices.length} invoices and estimates (Total Value: ₹${totalRev.toLocaleString('en-IN')})!`,
      invoices: multiInvoices,
      rawTextPreview: text.slice(0, 1000),
    };
  }

  // 2. Check for single Gemini / MotoFit SOW Bill format
  const geminiResult = parseGeminiSowPdf(text);
  if (geminiResult) {
    return geminiResult;
  }

  // 3. Generic Invoice PDF Extractor
  return parseGenericInvoicePdf(text);
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
        const qty = Number.parseFloat(row['Current Stock'] || row['Stock'] || row['Quantity'] || row['Qty'] || 0) || 0;
        const unit = String(row['Unit'] || row['Base Unit'] || 'pcs').toLowerCase();
        const salePrice = Number.parseFloat(row['Sale Price'] || row['Selling Price'] || row['Rate'] || row['MRP'] || 0) || 0;
        const costPrice = Number.parseFloat(row['Purchase Price'] || row['Cost Price'] || row['Buying Price'] || salePrice * 0.8) || 0;
        const gstRate = Number.parseFloat(row['Tax Rate'] || row['GST'] || row['Tax'] || 18) || 18;

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
      const qty = Number.parseFloat(row['Quantity'] || row['Qty'] || 1) || 1;
      const rate = Number.parseFloat(row['Price/Unit'] || row['Rate'] || row['Unit Price'] || row['Amount'] || 0) || 0;
      const totalAmount = Number.parseFloat(row['Total'] || row['Total Amount'] || row['Amount'] || qty * rate) || qty * rate;
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
