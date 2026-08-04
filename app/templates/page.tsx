import { redirect } from 'next/navigation';

/**
 * /templates → /resources
 *
 * Three routes browsed the same starter kits: this one rendered TemplatesView,
 * /gallery rendered the TemplateGallery inside it, and /resources rendered a
 * richer gallery of the same catalog with games merged in. One thing, three
 * doors, each drifting from the others. /resources is the one that survives.
 *
 * Only the INDEX moves. The eleven detail pages under /templates/<slug> are real
 * content with their own URLs and stay exactly where they are.
 */
export default function TemplatesIndex() {
  redirect('/resources');
}
