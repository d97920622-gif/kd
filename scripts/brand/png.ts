// path: scripts/brand/png.ts
/**
 * Minimal PNG and ICO encoders for the generated brand assets.
 *
 * Why hand written rather than a dependency: the asset set is small, flat and
 * fully described by config/brand.ts (a plate, a monogram and a background),
 * and a rasteriser that draws exactly this geometry is about two hundred lines
 * of arithmetic. A general image library would be a build dependency the
 * project would then have to keep, audit and pin for six small files.
 *
 * The encoders produce the smallest valid form of each format:
 *
 *   - PNG: 8 bit RGBA, one IDAT chunk, filter type 0 on every scanline, CRC32
 *     per chunk, exactly as RFC 2083 requires.
 *   - ICO: the modern container, where each directory entry points at a whole
 *     PNG file. That is what every current browser reads, and it means the
 *   .ico is built from the same pixels as the PNG pack instead of from a
 *     second, older drawing.
 *
 * Everything here is deterministic: the same pixels produce the same bytes, so
 * scripts/checks/brand-assets.mjs can compare a committed file with a fresh
 * render and fail on any difference.
 */
import { deflateSync } from 'node:zlib';

/** An RGBA image buffer, row major, four bytes per pixel. */
export interface RgbaImage {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
}

/** Create a transparent image. */
export function createImage(width: number, height: number): RgbaImage {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

/** Write one pixel, replacing whatever was there. */
export function setPixel(
  image: RgbaImage,
  x: number,
  y: number,
  red: number,
  green: number,
  blue: number,
  alpha: number,
): void {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return;
  }
  const offset = (y * image.width + x) * 4;
  image.data[offset] = red;
  image.data[offset + 1] = green;
  image.data[offset + 2] = blue;
  image.data[offset + 3] = alpha;
}

/** Read one pixel as `[r, g, b, a]`. */
export function getPixel(image: RgbaImage, x: number, y: number): [number, number, number, number] {
  const offset = (y * image.width + x) * 4;
  return [
    image.data[offset] ?? 0,
    image.data[offset + 1] ?? 0,
    image.data[offset + 2] ?? 0,
    image.data[offset + 3] ?? 0,
  ];
}

/**
 * Composite a source pixel over a destination pixel, source over, in straight
 * (non premultiplied) alpha. Coverage is the anti-aliasing weight, 0 to 1.
 */
export function blendPixel(
  image: RgbaImage,
  x: number,
  y: number,
  red: number,
  green: number,
  blue: number,
  coverage: number,
): void {
  if (coverage <= 0 || x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return;
  }
  const [destRed, destGreen, destBlue, destAlpha] = getPixel(image, x, y);
  const sourceAlpha = Math.min(1, coverage);
  const destinationAlpha = destAlpha / 255;
  const outAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
  if (outAlpha <= 0) {
    setPixel(image, x, y, 0, 0, 0, 0);
    return;
  }
  const mix = (source: number, destination: number): number =>
    Math.round(
      (source * sourceAlpha + destination * destinationAlpha * (1 - sourceAlpha)) / outAlpha,
    );
  setPixel(
    image,
    x,
    y,
    mix(red, destRed),
    mix(green, destGreen),
    mix(blue, destBlue),
    Math.round(outAlpha * 255),
  );
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

/** CRC32 of a byte range, the checksum every PNG chunk carries. */
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, payload: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const body = new Uint8Array(typeBytes.length + payload.length);
  body.set(typeBytes, 0);
  body.set(payload, typeBytes.length);
  const out = new Uint8Array(4 + body.length + 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, payload.length);
  out.set(body, 4);
  view.setUint32(4 + body.length, crc32(body));
  return out;
}

/** Encode an image as a PNG file. */
export function encodePng(image: RgbaImage): Uint8Array {
  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, image.width);
  headerView.setUint32(4, image.height);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: truecolour with alpha
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  const stride = image.width * 4;
  const raw = new Uint8Array((stride + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: none
    raw.set(image.data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }

  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const parts = [
    signature,
    chunk('IHDR', header),
    chunk('IDAT', new Uint8Array(deflateSync(raw, { level: 9 }))),
    chunk('IEND', new Uint8Array(0)),
  ];
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const file = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    file.set(part, offset);
    offset += part.length;
  }
  return file;
}

/** Read the dimensions of a PNG file, or null when it is not a valid PNG. */
export function readPngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) {
    return null;
  }
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!signature.every((byte, index) => bytes[index] === byte)) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** One image inside an ICO container. */
export interface IcoEntry {
  readonly size: number;
  readonly png: Uint8Array;
}

/**
 * Encode an ICO container holding PNG images.
 *
 * The directory reserves one byte per dimension, where 256 is written as 0,
 * which is why this caps at 256 pixels per entry.
 */
export function encodeIco(entries: readonly IcoEntry[]): Uint8Array {
  const headerSize = 6 + entries.length * 16;
  const total = entries.reduce((sum, entry) => sum + entry.png.length, headerSize);
  const file = new Uint8Array(total);
  const view = new DataView(file.buffer);
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, entries.length, true);

  let offset = headerSize;
  entries.forEach((entry, index) => {
    const base = 6 + index * 16;
    file[base] = entry.size >= 256 ? 0 : entry.size;
    file[base + 1] = entry.size >= 256 ? 0 : entry.size;
    file[base + 2] = 0; // palette size: none
    file[base + 3] = 0; // reserved
    view.setUint16(base + 4, 1, true); // colour planes
    view.setUint16(base + 6, 32, true); // bits per pixel
    view.setUint32(base + 8, entry.png.length, true);
    view.setUint32(base + 12, offset, true);
    file.set(entry.png, offset);
    offset += entry.png.length;
  });

  return file;
}

/** Read the sizes listed by an ICO container, in directory order. */
export function readIcoSizes(bytes: Uint8Array): number[] | null {
  if (bytes.length < 6) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint16(2, true) !== 1) {
    return null;
  }
  const count = view.getUint16(4, true);
  const sizes: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const base = 6 + index * 16;
    if (base + 16 > bytes.length) {
      return null;
    }
    const declared = bytes[base];
    sizes.push(declared === 0 ? 256 : (declared ?? 0));
  }
  return sizes;
}
