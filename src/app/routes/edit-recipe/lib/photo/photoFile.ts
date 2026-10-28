import { fitWithin } from './resizeImage';

const maxSide = 1600;
const quality = 0.85;

const encode = (canvas: HTMLCanvasElement, type: string) => new Promise<Blob | null>((done) => canvas.toBlob(done, type, quality));

/** Shrinks a chosen photo for upload: orientation applied, longest side at most 1600 px, never enlarged, WebP (JPEG where the browser can't make WebP). Rejects when the file can't be read as an image. */
export async function resizePhoto(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No canvas');
    context.drawImage(bitmap, 0, 0, width, height);
    const webp = await encode(canvas, 'image/webp');
    // Older Safari silently returns PNG when asked for WebP.
    if (webp?.type === 'image/webp') return webp;
    // JPEG has no transparency: paint white behind the photo.
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    const jpeg = await encode(canvas, 'image/jpeg');
    if (!jpeg) throw new Error('Could not encode');
    return jpeg;
  } finally {
    bitmap.close();
  }
}

/** Uploads a resized photo and returns the path it can be fetched at. Rejects when the upload fails. */
export async function uploadPhoto(photo: Blob, signal: AbortSignal): Promise<string> {
  const response = await fetch('/foto', { method: 'POST', body: photo, signal });
  if (!response.ok) throw new Error(`Upload refused (${response.status})`);
  return ((await response.json()) as { path: string }).path;
}
