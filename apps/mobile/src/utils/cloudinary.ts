import type { AvatarSignaturePayload } from '../services/authApi';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

interface UploadAvatarArgs {
  uri: string;
  mimeType?: string;
  signature: AvatarSignaturePayload;
}

/**
 * POST a local file (`uri`) directly to Cloudinary using a server-issued signature.
 * Returns the secure HTTPS URL that should then be saved on the user via PATCH /auth/me.
 */
export async function uploadAvatarToCloudinary({
  uri,
  mimeType,
  signature,
}: UploadAvatarArgs): Promise<string> {
  const form = new FormData();
  // RN/Expo accepts this object shape for file uploads.
  form.append('file', {
    uri,
    name: 'avatar.jpg',
    type: mimeType ?? 'image/jpeg',
  } as unknown as Blob);
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
