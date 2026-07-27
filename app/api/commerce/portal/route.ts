import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCustomer, isCommerceConfigured, createPortalSession } from '@/lib/commerce';
import { session } from '@/lib/iam';

export async function POST(req: NextRequest) {
  try {
    const user = await session(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isCommerceConfigured()) {
      return NextResponse.json({ error: 'Billing system not configured' }, { status: 503 });
    }

    const customer = await getOrCreateCustomer({
      token: user.token,
      userId: user.sub,
      email: user.email,
      name: user.name,
    });

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const portal = await createPortalSession({
      token: user.token,
      customerId: customer.id,
      returnUrl: `${origin}/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
