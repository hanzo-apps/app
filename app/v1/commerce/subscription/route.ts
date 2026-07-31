import { NextResponse, type NextRequest } from 'next/server';
import { getOrCreateCustomer, isCommerceConfigured, getSubscriptionStatus } from '@/lib/commerce';
import { session } from '@/lib/iam';

export async function GET(req: NextRequest) {
  try {
    const user = await session(req);

    if (!user) {
      return NextResponse.json({ subscription: null });
    }

    if (!isCommerceConfigured()) {
      return NextResponse.json({ subscription: null });
    }

    const customer = await getOrCreateCustomer({
      token: user.token,
      userId: user.sub,
      email: user.email,
      name: user.name,
    });

    const subscription = await getSubscriptionStatus(user.token, customer.id);

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
