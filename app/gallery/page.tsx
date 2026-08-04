import { redirect } from 'next/navigation';

/** /gallery → /templates — same surface, nav-canonical name. */
export default function GalleryIndex() {
  redirect('/templates');
}
