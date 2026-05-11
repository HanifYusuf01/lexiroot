import type { AvatarSignaturePayload } from '../services/authApi';
import type { MediaSignaturePayload } from '../services/uploadsApi';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

/**
 * POST a `File` (from <input type="file">) directly to Cloudinary using a server-issued signature.
 * Returns the secure HTTPS URL that should then be saved on the user via PATCH /auth/me.
 */
export async function uploadAvatarToCloudinary(
  file: File,
  signature: AvatarSignaturePayload,
): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);

  const res = await fetch(signature.uploadUrl, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as CloudinaryUploadResponse;
  return data.secure_url;
}

/**
 * Same pattern as the avatar upload, but uses a lesson-scoped media signature
 * (audio → /video/upload, image → /image/upload).
 */
export async function uploadLessonMediaToCloudinary(
  file: File,
  signature: MediaSignaturePayload,
): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);

  const res = await fetch(signature.uploadUrl, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as CloudinaryUploadResponse;
  return data.secure_url;
}
