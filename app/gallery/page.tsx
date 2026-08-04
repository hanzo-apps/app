import { redirect } from 'next/navigation';

/** /gallery → /resources — it rendered `TemplateGallery`, which /resources
 *  renders too, from the same catalog. A synonym is not a surface. */
export default function GalleryIndex() {
  redirect('/resources');
}
