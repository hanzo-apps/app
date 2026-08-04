import { redirect } from 'next/navigation';

/** /resources → /templates — the nav says "Templates", so the URL matches the
 *  word on the door. One catalog, one surface; a synonym is not a surface. */
export default function ResourcesIndex() {
  redirect('/templates');
}
