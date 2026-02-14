import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCustomer, isStripeConfigured, stripe } from '@/lib/stripe';
import { getUserSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserSession();
    
    if (!user) {
      return NextResponse.json({ invoices: [] });
    }

    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json({ invoices: [] });
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Check if stripe is configured
    if (!stripe) {
      return NextResponse.json({ invoices: [] });
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 10,
    });

    // Format invoices for response
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      amount_paid: invoice.amount_paid / 100, // Convert from cents to dollars
      amount_due: invoice.amount_due / 100,
      currency: invoice.currency,
      status: invoice.status,
      created: invoice.created,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      description: invoice.description,
      number: invoice.number,
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}