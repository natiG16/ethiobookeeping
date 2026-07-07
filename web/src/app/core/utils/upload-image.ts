/** Must match backend `app.upload.max-size-bytes` (2 MB). */
export const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function validateImageFile(file: File): string | null {
  if (!file.size) {
    return 'Please choose an image file.';
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return 'Image must be 2 MB or smaller.';
  }
  if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
    return 'Only JPEG, PNG, WebP, or GIF images are allowed.';
  }
  return null;
}
