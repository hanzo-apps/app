import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { session } from '@/lib/iam';
import { listProjects } from '@/lib/db/projects';
import { buildUsage } from '@/lib/usage';
import UsageView from './view';

// Resolves the caller's verified IAM session — must render per-request.
export const dynamic = 'force-dynamic';

export default async function UsagePage() {
  const user = await session({ headers: await headers() });
  if (!user) redirect('/login');

  let projectCount = 0;
  try {
    projectCount = (await listProjects(user.token, user.sub)).length;
  } catch {
    projectCount = 0;
  }

  return <UsageView email={user.email} account={buildUsage(projectCount)} />;
}
