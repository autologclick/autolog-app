/**
 * Local file storage — src/lib/storage.ts
 *
 * Drop-in replacement for @vercel/blob's `put()`.
 *
 * AutoLog runs on its own DigitalOcean droplet, not on Vercel, so Vercel Blob
 * was never going to work here: it needs BLOB_READ_WRITE_TOKEN, bills per GB,
 * and puts user files on infrastructure we don't control. Files belong on our
 * own disk under public/, served from autolog.click.
 *
 * Nothing here can escape the public directory: the folder is whitelisted by
 * pattern and the filename is generated, never taken from user input.
 */
import { mkdir, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Standalone builds can run with a different cwd, so allow an override.
 * Default matches how PM2 currently starts the app.
 */
const PUBLIC_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'public');
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://autolog.click').replace(/\/$/, '');

/** Letters, digits, dash, underscore and single slashes. No dots, so no "..". */
const SAFE_FOLDER = /^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/;

const EXTENSION_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  pdf: 'application/pdf',
};

export interface StoredFile {
  /** Absolute URL, safe to hand to Meta or put in an <img src>. */
  url: string;
  /** Path relative to public/, e.g. "social/1785-a1b2c3.png". */
  pathname: string;
  bytes: number;
  contentType: string;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Writes a file under public/<folder>/ and returns its public URL.
 *
 * @param folder    Destination under public/, e.g. "social" or "garages/abc123".
 * @param extension File extension without the dot.
 * @param data      File contents.
 */
export async function storeFile(
  folder: string,
  extension: string,
  data: Buffer,
): Promise<StoredFile> {
  if (!SAFE_FOLDER.test(folder)) {
    throw new StorageError(`Unsafe storage folder: ${folder}`);
  }

  const ext = extension.toLowerCase().replace(/^\./, '');
  const contentType = EXTENSION_TO_MIME[ext];
  if (!contentType) {
    throw new StorageError(`Unsupported file type: ${ext}`);
  }
  if (data.length === 0) {
    throw new StorageError('Refusing to store an empty file');
  }

  const dir = join(PUBLIC_DIR, folder);

  // Belt and braces: even with the pattern check, confirm we stayed inside.
  if (!resolve(dir).startsWith(resolve(PUBLIC_DIR))) {
    throw new StorageError(`Path traversal blocked: ${folder}`);
  }

  await mkdir(dir, { recursive: true, mode: 0o755 });

  const filename = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
  await writeFile(join(dir, filename), data, { mode: 0o644 });

  const pathname = `${folder}/${filename}`;
  return {
    url: `${SITE_URL}/${pathname}`,
    pathname,
    bytes: data.length,
    contentType,
  };
}

/**
 * Compatibility shim matching @vercel/blob's put() signature closely enough
 * for the existing call sites, so swapping it in is a one-line import change.
 *
 *   const blob = await put('social/x.png', buffer, { access: 'public' });
 *   blob.url  ->  https://autolog.click/social/1785-a1b2c3.png
 *
 * The supplied filename is used only for its folder and extension; the actual
 * name is generated to avoid collisions and any user-controlled path.
 */
export async function put(
  pathname: string,
  data: Buffer,
  _options?: { access?: string; contentType?: string },
): Promise<{ url: string; pathname: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const name = segments.pop() ?? 'file.bin';
  const folder = segments.length > 0 ? segments.join('/') : 'uploads';
  const ext = name.includes('.') ? name.split('.').pop()! : 'bin';

  const stored = await storeFile(folder, ext, data);
  return { url: stored.url, pathname: stored.pathname };
}

/** Turns either a full autolog.click URL or a bare pathname into a disk path. */
function toDiskPath(urlOrPathname: string): string {
  const relative = urlOrPathname
    .replace(`${SITE_URL}/`, '')
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/^\/+/, '');

  const full = resolve(join(PUBLIC_DIR, relative));
  if (!full.startsWith(resolve(PUBLIC_DIR))) {
    throw new StorageError(`Path traversal blocked: ${urlOrPathname}`);
  }
  return full;
}

/**
 * Compatibility shim for @vercel/blob's del(). Accepts a URL or pathname,
 * or an array of them. Missing files are ignored — deleting something that
 * is already gone is a success, not an error.
 */
export async function del(urls: string | string[]): Promise<void> {
  const list = Array.isArray(urls) ? urls : [urls];
  await Promise.all(
    list.map(async (u) => {
      try {
        await unlink(toDiskPath(u));
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT') throw error;
      }
    }),
  );
}

export interface ListedFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Compatibility shim for @vercel/blob's list(). Lists one folder, not the
 * whole tree — matching how the existing call sites use prefixes.
 */
export async function list(
  options?: { prefix?: string },
): Promise<{ blobs: ListedFile[] }> {
  const prefix = (options?.prefix ?? '').replace(/^\/+|\/+$/g, '');
  const dir = prefix ? join(PUBLIC_DIR, prefix) : PUBLIC_DIR;

  if (!resolve(dir).startsWith(resolve(PUBLIC_DIR))) {
    throw new StorageError(`Path traversal blocked: ${prefix}`);
  }

  let names: string[];
  try {
    names = await readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { blobs: [] };
    throw error;
  }

  const blobs: ListedFile[] = [];
  for (const name of names) {
    const info = await stat(join(dir, name));
    if (!info.isFile()) continue;
    const pathname = prefix ? `${prefix}/${name}` : name;
    blobs.push({
      url: `${SITE_URL}/${pathname}`,
      pathname,
      size: info.size,
      uploadedAt: info.mtime,
    });
  }
  return { blobs };
}
