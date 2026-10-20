import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ImportedInvoice, ImportedInventoryItem, ImportedCustomer } from '@/lib/dataImporter';

export async function POST(request: Request) {
  try {
    const authUser = await getSessionUser(request);
    const body = await request.json();
    const userId = authUser?.userId || body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please login to import data.' }, { status: 401 });
    }

    const {
      invoices,
      inventoryItems,
      customers,
    }: {
      invoices?: ImportedInvoice[];
      inventoryItems?: ImportedInventoryItem[];
      customers?: ImportedCustomer[];
    } = body;

    let createdInvoicesCount = 0;
    let createdInventoryCount = 0;
    let createdCustomersCount = 0;
    const createdInvoiceIds: string[] = [];

    // 1. Commit Invoices
    if (Array.isArray(invoices) && invoices.length > 0) {
      for (const inv of invoices) {
        // A. Resolve or create customer
        const custName = inv.customer?.name || 'Walk-in Customer';
        const custPhone = inv.customer?.phone || '';

        let customer = await prisma.customer.findFirst({
          where: {
            userId,
            OR: [
              ...(custPhone ? [{ phone: custPhone }] : []),
              { name: { equals: custName } },
            ],
          },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              userId,
              name: custName,
              phone: custPhone || '',
              email: inv.customer?.email,
              address: inv.customer?.address,
              gstNumber: inv.customer?.gstNumber,
            },
          });
          createdCustomersCount++;
        }

        // B. Resolve or create vehicle if present
        const vehModel = inv.vehicle?.makeModel || inv.customer?.vehicleModel;
        const vehReg = inv.vehicle?.registrationNo || inv.customer?.vehicleReg || 'As Per Estimate';

        if (vehModel || vehReg) {
          const existingVehicle = await prisma.vehicle.findFirst({
            where: {
              customerId: customer.id,
              OR: [
                { registrationNo: vehReg },
                { model: vehModel },
              ],
            },
          });

          if (!existingVehicle) {
            await prisma.vehicle.create({
              data: {
                customerId: customer.id,
                registrationNo: vehReg,
                make: vehModel?.split(' ')[0] || 'Hero',
                model: vehModel || 'Motorcycle',
                year: 2020,
              },
            });
          }
        }

        // C. Check unique invoice number
        let invoiceNumber = inv.invoiceNumber || `IMP-${Date.now().toString().slice(-6)}`;
        const existingInv = await prisma.invoice.findFirst({
          where: { invoiceNumber },
        });
        if (existingInv) {
          invoiceNumber = `${invoiceNumber}-${Math.floor(100 + Math.random() * 900)}`;
        }

        // D. Create Invoice in Turso DB
        const createdInvoice = await prisma.invoice.create({
          data: {
            userId,
            customerId: customer.id,
            invoiceNumber,
            subtotal: inv.subtotal || inv.total,
            discount: inv.discount || 0,
            tax: inv.tax || 0,
            total: inv.total,
            paid: inv.paid !== undefined ? inv.paid : inv.total,
            balance: inv.balance !== undefined ? inv.balance : 0,
            status: (inv.balance || 0) <= 0 ? 'paid' : (inv.paid || 0) > 0 ? 'partial' : 'unpaid',
            paymentMode: inv.paymentMode || 'upi',
            notes: inv.notes || (inv.serviceType ? `Service Type: ${inv.serviceType}` : 'Imported Invoice'),
            items: {
              create: inv.items.map((it) => ({
                description: it.description,
                details: it.details || null,
                quantity: it.quantity || 1,
                unitPrice: it.unitPrice || 0,
                tax: 0,
                total: it.total || (it.quantity || 1) * (it.unitPrice || 0),
              })),
            },
          },
        });

        createdInvoicesCount++;
        createdInvoiceIds.push(createdInvoice.invoiceNumber);
      }
    }

    // 2. Commit Inventory Items
    if (Array.isArray(inventoryItems) && inventoryItems.length > 0) {
      for (const item of inventoryItems) {
        if (!item.name) continue;

        // Check if code or name exists
        const existingItem = await prisma.inventoryItem.findFirst({
          where: {
            userId,
            OR: [
              ...(item.code ? [{ code: item.code }] : []),
              { name: item.name },
            ],
          },
        });

        if (existingItem) {
          await prisma.inventoryItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + (item.quantity || 0),
              sellingPrice: item.sellingPrice || existingItem.sellingPrice,
              costPrice: item.costPrice || existingItem.costPrice,
            },
          });
        } else {
          await prisma.inventoryItem.create({
            data: {
              userId,
              name: item.name,
              code: item.code || `SP-${Date.now().toString().slice(-5)}`,
              category: item.category || 'Automotive Spares',
              quantity: item.quantity || 0,
              unit: item.unit || 'pcs',
              costPrice: item.costPrice || 0,
              sellingPrice: item.sellingPrice || 0,
              gstRate: item.gstRate || 18,
            },
          });
        }
        createdInventoryCount++;
      }
    }

    // 3. Commit Customers
    if (Array.isArray(customers) && customers.length > 0) {
      for (const cust of customers) {
        if (!cust.name) continue;

        const existing = await prisma.customer.findFirst({
          where: {
            userId,
            OR: [
              ...(cust.phone ? [{ phone: cust.phone }] : []),
              { name: cust.name },
            ],
          },
        });

        if (!existing) {
          await prisma.customer.create({
            data: {
              userId,
              name: cust.name,
              phone: cust.phone || '',
              email: cust.email,
              address: cust.address,
              gstNumber: cust.gstNumber,
            },
          });
          createdCustomersCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data committed successfully into MotoBan Cloud Database!',
      importedInvoicesCount: createdInvoicesCount,
      importedInventoryCount: createdInventoryCount,
      importedCustomersCount: createdCustomersCount,
      createdInvoiceIds,
    });
  } catch (err: any) {
    console.error('Error in /api/import/commit:', err);
    return NextResponse.json({ error: err.message || 'Failed to commit imported data' }, { status: 500 });
  }
}
