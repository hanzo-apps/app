import { NextResponse, type NextRequest } from 'next/server';
import { getOrCreateCustomer, isCommerceConfigured, getCustomerInvoices } from '@/lib/commerce';
import { session } from '@/lib/iam';

export async function GET(req: NextRequest) {
  try {
    const user = await session(req);

    if (!user) {
      return NextResponse.json({ invoices: [] });
    }

    if (!isCommerceConfigured()) {
      return NextResponse.json({ invoices: [] });
    }

    const customer = await getOrCreateCustomer({
      token: user.token,
      userId: user.sub,
      email: user.email,
      name: user.name,
    });

    const { invoices } = await getCustomerInvoices({
      token: user.token,
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
