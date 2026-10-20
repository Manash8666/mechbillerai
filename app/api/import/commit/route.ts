import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ImportedInvoice, ImportedInventoryItem, ImportedCustomer } from '@/lib/dataImporter';

const getInvoiceStatus = (balance: number, paid: number): string => {
  if (balance <= 0) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
};

async function commitSingleInvoice(userId: string, inv: ImportedInvoice) {
  const custName = inv.customer?.name || 'Walk-in Customer';
  const custPhone = inv.customer?.phone || '';

  let isNewCustomer = false;
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
    isNewCustomer = true;
  }

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

  let invoiceNumber = inv.invoiceNumber || `IMP-${Date.now().toString().slice(-6)}`;
  const existingInv = await prisma.invoice.findFirst({
    where: { invoiceNumber },
  });
  if (existingInv) {
    const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 4)
      : Date.now().toString(36).slice(-4);
    invoiceNumber = `${invoiceNumber}-${suffix}`;
  }

  const paid = inv.paid ?? inv.total;
  const balance = inv.balance ?? 0;
  const status = getInvoiceStatus(balance, paid);

  const createdInvoice = await prisma.invoice.create({
    data: {
      userId,
      customerId: customer.id,
      invoiceNumber,
      subtotal: inv.subtotal || inv.total,
      discount: inv.discount || 0,
      tax: inv.tax || 0,
      total: inv.total,
      paid,
      balance,
      status,
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

  return { invoiceNumber: createdInvoice.invoiceNumber, isNewCustomer };
}

async function commitInvoices(userId: string, invoices: ImportedInvoice[]) {
  let createdCount = 0;
  let newCustomersCount = 0;
  const createdInvoiceIds: string[] = [];

  const results = await Promise.allSettled(
    invoices.map((inv) => commitSingleInvoice(userId, inv))
  );

  for (const res of results) {
    if (res.status === 'fulfilled' && res.value) {
      createdCount++;
      createdInvoiceIds.push(res.value.invoiceNumber);
      if (res.value.isNewCustomer) {
        newCustomersCount++;
      }
    }
  }

  return { createdCount, newCustomersCount, createdInvoiceIds };
}

async function commitSingleInventoryItem(userId: string, item: ImportedInventoryItem): Promise<boolean> {
  if (!item.name) return false;

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
  return true;
}

async function commitInventory(userId: string, items: ImportedInventoryItem[]): Promise<number> {
  const results = await Promise.allSettled(
    items.map((it) => commitSingleInventoryItem(userId, it))
  );
  return results.filter((r) => r.status === 'fulfilled' && r.value).length;
}

async function commitSingleCustomer(userId: string, cust: ImportedCustomer): Promise<boolean> {
  if (!cust.name) return false;

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
    return true;
  }
  return false;
}

async function commitCustomers(userId: string, customers: ImportedCustomer[]): Promise<number> {
  const results = await Promise.allSettled(
    customers.map((c) => commitSingleCustomer(userId, c))
  );
  return results.filter((r) => r.status === 'fulfilled' && r.value).length;
}

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
    let createdCustomersCount = 0;
    let createdInvoiceIds: string[] = [];

    if (Array.isArray(invoices) && invoices.length > 0) {
      const invResult = await commitInvoices(userId, invoices);
      createdInvoicesCount = invResult.createdCount;
      createdCustomersCount += invResult.newCustomersCount;
      createdInvoiceIds = invResult.createdInvoiceIds;
    }

    let createdInventoryCount = 0;
    if (Array.isArray(inventoryItems) && inventoryItems.length > 0) {
      createdInventoryCount = await commitInventory(userId, inventoryItems);
    }

    if (Array.isArray(customers) && customers.length > 0) {
      const custCount = await commitCustomers(userId, customers);
      createdCustomersCount += custCount;
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
