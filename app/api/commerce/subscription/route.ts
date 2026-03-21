import { NextResponse } from 'next/server';
import { getOrCreateCustomer, isCommerceConfigured, getSubscriptionStatus } from '@/lib/commerce';
import { getUserSession } from '@/lib/session';

export async function GET() {
  try {
    const user = await getUserSession();

    if (!user) {
      return NextResponse.json({ subscription: null });
    }

    if (!isCommerceConfigured()) {
      return NextResponse.json({ subscription: null });
    }

    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const subscription = await getSubscriptionStatus(customer.id);

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
