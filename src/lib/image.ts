/*
  Turning a photo you pick into a banner. The prototype keeps everything on this device, so the photo is
  scaled down to a banner's size and saved as a compact JPEG: large enough to stay sharp across a wide
  card, small enough to live in local storage beside everything else.
*/

const MAX_W = 1800;
const MAX_H = 900;
/** Past this, local storage gets tight, so the photo is saved at a lower quality. */
const BUDGET = 900_000;

export interface PreparedPhoto {
  src: string;
  w: number;
  h: number;
  /** Narrower than a banner shows sharply. */
  small: boolean;
}

export class PhotoError extends Error {}

function decode(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new PhotoError('That file couldn’t be opened as a photo. Try a JPG or PNG.'));
    };
    img.src = url;
  });
}

export async function prepareBannerPhoto(file: File): Promise<PreparedPhoto> {
  if (!file.type.startsWith('image/')) throw new PhotoError('Choose a photo: a JPG, PNG or WebP.');
  if (file.size > 25 * 1024 * 1024) throw new PhotoError('That photo is over 25 MB. Choose a smaller one.');
  const img = await decode(file);
  const scale = Math.min(1, MAX_W / img.naturalWidth, MAX_H / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PhotoError('This browser couldn’t prepare the photo.');
  ctx.drawImage(img, 0, 0, w, h);
  let src = canvas.toDataURL('image/jpeg', 0.86);
  if (src.length > BUDGET) src = canvas.toDataURL('image/jpeg', 0.72);
  return { src, w, h, small: img.naturalWidth < 1000 };
}
