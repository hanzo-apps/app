/**
 * lib/upload-project-images — the ONE path that persists reference images to a
 * project's storage. Shared by the ask-ai uploader popover and the ask-ai
 * drag / drop / paste handlers so there is a single upload implementation, not a
 * second uploader living next to the first.
 */

// Keep only image files from a file-input, drop, or paste selection. Works for a
// FileList (drop `dataTransfer.files` / paste `clipboardData.files` / `<input>`)
// or a plain File[].
export const imageFilesFrom = (files: FileList | File[] | null): File[] =>
  files ? Array.from(files).filter((f) => f.type.startsWith("image/")) : [];

// POST image File(s) to the project's storage; resolves to the durable URLs the
// builder embeds. Returns [] when there is nothing to upload or the request
// fails — callers own their own "uploading" affordance and error surfacing.
export const uploadProjectImages = async (
  spaceId: string | undefined | null,
  images: File[]
): Promise<string[]> => {
  if (!spaceId || images.length === 0) return [];
  const data = new FormData();
  images.forEach((image) => data.append("images", image));
  const res = await fetch(`/api/me/projects/${spaceId}/images`, {
    method: "POST",
    body: data,
  });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.uploadedFiles) ? json.uploadedFiles : [];
};
