import { NextResponse } from 'next/server';
import { getOrCreateCustomer, isCommerceConfigured, getCustomerInvoices } from '@/lib/commerce';
import { getUserSession } from '@/lib/session';

export async function GET() {
  try {
    const user = await getUserSession();

    if (!user) {
      return NextResponse.json({ invoices: [] });
    }

    if (!isCommerceConfigured()) {
      return NextResponse.json({ invoices: [] });
    }

    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const { invoices } = await getCustomerInvoices({
      customerId: customer.id,
      limit: 10,
    });

    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      amount_paid: invoice.amount,
      amount_due: invoice.amount,
      currency: 'usd',
      status: invoice.status,
      created: Math.floor(invoice.date.getTime() / 1000),
      hosted_invoice_url: invoice.hostedUrl,
      invoice_pdf: invoice.pdfUrl,
      description: invoice.description,
      number: invoice.number,
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
