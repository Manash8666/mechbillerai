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

import { NextResponse } from 'next/server';
import { parsePdfInvoice, parseTextInvoice, parseExcelOrCsv, ImportParseResult } from '@/lib/dataImporter';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // 1. Handle Multipart Form Data (File Upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = file.name || 'uploaded_file';
      const ext = filename.split('.').pop()?.toLowerCase();

      if (ext === 'pdf' || file.type === 'application/pdf') {
        const result = await parsePdfInvoice(buffer);
        if (!result.success) {
          return NextResponse.json({ error: result.summary }, { status: 400 });
        }
        return NextResponse.json(result);
      }

      if (
        ext === 'xlsx' ||
        ext === 'xls' ||
        ext === 'csv' ||
        file.type.includes('spreadsheet') ||
        file.type.includes('excel') ||
        file.type.includes('csv')
      ) {
        const result = await parseExcelOrCsv(buffer, filename);
        return NextResponse.json(result);
      }

      // If an image was uploaded, try AI image scan if key available
      if (file.type.startsWith('image/')) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          try {
            const base64 = buffer.toString('base64');
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          inlineData: {
                            mimeType: file.type,
                            data: base64,
                          },
                        },
                        {
                          text: `You are an expert garage billing data extractor. Extract the bill into this strict JSON format:
{
  "invoiceNumber": "string",
  "date": "DD/MM/YYYY",
  "customer": { "name": "string", "phone": "string", "vehicleModel": "string" },
  "items": [
    { "description": "ITEM NAME", "details": "Category: Technical detail", "quantity": 1, "unitPrice": 100, "total": 100 }
  ],
  "subtotal": 100,
  "discount": 0,
  "tax": 18,
  "total": 118,
  "paid": 118,
  "balance": 0
}`,
                        },
                      ],
                    },
                  ],
                  generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.1,
                  },
                }),
              }
            );

            if (res.ok) {
              const data = await res.json();
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const parsed = JSON.parse(text.replace(/```(?:json)?/gi, '').trim());
                return NextResponse.json({
                  success: true,
                  sourceType: 'IMAGE_SCAN',
                  summary: `Scanned image invoice #${parsed.invoiceNumber || 'NEW'} with ${parsed.items?.length || 0} line items`,
                  invoices: [parsed],
                });
              }
            }
          } catch (aiErr) {
            console.warn('Gemini image parse error:', aiErr);
          }
        }
        return NextResponse.json(
          { error: 'Image OCR requires GEMINI_API_KEY. Please upload a PDF, Excel (.xlsx), or CSV file.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Unsupported file format (.${ext}). Supported formats: .pdf, .xlsx, .xls, .csv, and invoice photos.` },
        { status: 400 }
      );
    }

    // 2. Handle JSON payload (e.g. testing with sample or raw text)
    const body = await request.json();
    const { sampleType, rawText } = body || {};

    if (sampleType === 'MOTOFIT_GEMINI_SAMPLE') {
      // Return predefined verified MotoFit 2 Gemini SOW bill sample
      const sampleResult: ImportParseResult = {
        success: true,
        sourceType: 'GEMINI_SOW_PDF',
        summary: 'Loaded verified MotoFit 2 / Gemini SOW Bill (#MF2-90489) with 9 technical line items',
        invoices: [
          {
            invoiceNumber: 'MF2-90489',
            date: '17/10/2026',
            serviceType: 'Half Engine Rebuild',
            customer: {
              name: 'Samael Morningstar',
              phone: '9876543210',
              vehicleModel: 'Hero Xtreme 200 (2019 ABS Variant)',
              vehicleReg: 'As Per Estimate',
            },
            vehicle: {
              makeModel: 'Hero Xtreme 200 (2019 ABS Variant)',
              registrationNo: 'As Per Estimate',
              refEstimate: 'MF2-EST-90489-V4',
            },
            items: [
              {
                description: 'CYLINDER BLOCK & PISTON KIT (OEM)',
                details: 'Top End Core: OEM cylinder block, piston, rings, pin & circlips assembly',
                quantity: 1,
                unitPrice: 5200,
                total: 5200,
              },
              {
                description: 'CYLINDER HEAD VALVES, SEALS & GUIDES',
                details: 'Top End Core: Intake & exhaust valves, viton stem seals & bronze guide set',
                quantity: 1,
                unitPrice: 1100,
                total: 1100,
              },
              {
                description: 'CAMSHAFT & ROCKER ARMS ASSEMBLY',
                details: 'Top End Core: Performance camshaft & roller rocker arm pair replacement',
                quantity: 1,
                unitPrice: 2100,
                total: 2100,
              },
              {
                description: 'TIMING CHAIN, GUIDES & TENSIONER',
                details: 'Top End Core: Cam timing chain, guide runner, tensioner pad & auto-tensioner',
                quantity: 1,
                unitPrice: 1400,
                total: 1400,
              },
              {
                description: 'TOP END GASKET KIT & SEALANTS',
                details: 'Consumables: Cylinder head, base gasket, O-rings & high-temp engine sealant',
                quantity: 1,
                unitPrice: 700,
                total: 700,
              },
              {
                description: 'PREMIUM ENGINE OIL, FILTER & PLUG',
                details: 'Consumables: Premium 4T motorcycle engine oil, oil filter element & spark plug',
                quantity: 1,
                unitPrice: 1320,
                total: 1320,
              },
              {
                description: 'MISC HARDWARE, SOLVENTS & SEALANTS',
                details: 'Consumables: Ultrasonic cleaning degreasers, threadlocker, copper washers & buffer hardware',
                quantity: 1,
                unitPrice: 480,
                total: 480,
              },
              {
                description: 'LATHE / MACHINING (HEAD WORK)',
                details: 'Machining: Precision cylinder head facing, valve seat angle cutting & guide reaming',
                quantity: 1,
                unitPrice: 1000,
                total: 1000,
              },
              {
                description: 'MECHANIC LABOUR (TOP END REBUILD)',
                details: 'Labour: Engine top end teardown, decarb, precision assembly, valve lash setup & road test',
                quantity: 1,
                unitPrice: 2500,
                total: 2500,
              },
            ],
            subtotal: 15800,
            discount: 1580,
            tax: 2844,
            total: 14220,
            paid: 14220,
            balance: 0,
            paymentMode: 'upi',
            garageName: 'MOTOFIT 2',
          },
        ],
      };
      return NextResponse.json(sampleResult);
    }

    if (rawText && typeof rawText === 'string') {
      if (
        rawText.includes('MF2-') ||
        rawText.includes('SCOPE OF WORK') ||
        rawText.includes('SOW BILL') ||
        rawText.includes('MOTOFIT') ||
        rawText.includes('MotoFit') ||
        rawText.includes('INVOICE ID')
      ) {
        const result = parseTextInvoice(rawText);
        if (!result.success) {
          return NextResponse.json({ error: result.summary }, { status: 400 });
        }
        return NextResponse.json(result);
      }
      const buffer = Buffer.from(rawText, 'utf-8');
      const result = await parseExcelOrCsv(buffer, 'pasted_data.csv');
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Please upload a PDF or Excel/CSV file to parse' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/import/parse:', err);
    return NextResponse.json({ error: err.message || 'Failed to parse file' }, { status: 500 });
  }
}
