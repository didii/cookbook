export const maxPhotoBytes = 2 * 1024 * 1024;

/** Photo paths as stored in `recipes.image`: `/foto/<uuid>.<ext>`. */
const fileName = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;
const keyOf = (file: string) => `photos/${file}`;

/** Whether the value is the path of an uploaded photo. */
export const isPhotoPath = (path: string) => path.startsWith('/foto/') && fileName.test(path.slice('/foto/'.length));

const startsWith = (bytes: Uint8Array, signature: (number | null)[], at = 0) => signature.every((b, i) => b === null || bytes[at + i] === b);

/** The image type judged by the content only (never the name or declared type), or undefined when it is not a JPEG, PNG or WebP. */
function sniff(bytes: Uint8Array) {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { ext: 'jpg', type: 'image/jpeg' };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return { ext: 'png', type: 'image/png' };
  // "RIFF", four size bytes, "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return { ext: 'webp', type: 'image/webp' };
}

export type StoredPhoto = { path: string } | { status: 413 | 415 };

/** Stores an uploaded photo under a new random name, after checking its size and content. */
export async function storePhoto(bucket: R2Bucket, bytes: ArrayBuffer): Promise<StoredPhoto> {
  if (bytes.byteLength > maxPhotoBytes) return { status: 413 };
  const kind = sniff(new Uint8Array(bytes, 0, Math.min(12, bytes.byteLength)));
  if (!kind) return { status: 415 };
  const file = `${crypto.randomUUID()}.${kind.ext}`;
  await bucket.put(keyOf(file), bytes, { httpMetadata: { contentType: kind.type } });
  return { path: `/foto/${file}` };
}

/** The stored photo of a `<uuid>.<ext>` file name, or null when there is none (or the name is not shaped like one). */
export const getPhoto = (bucket: R2Bucket, file: string) => (fileName.test(file) ? bucket.get(keyOf(file)) : Promise.resolve(null));

/** Removes the photo at a `/foto/...` path; anything else is left alone. */
export async function deletePhoto(bucket: R2Bucket, path: string) {
  if (isPhotoPath(path)) await bucket.delete(keyOf(path.slice('/foto/'.length)));
}
