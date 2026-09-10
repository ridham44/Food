const apiBase = import.meta.env.VITE_API_BASE_URL || '';
const origin = apiBase.replace(/\/api\/v\d+\/?$/, '');

/** Backend file paths (menu images, tenant docs, …) are server-relative — prefix with the API origin. */
export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}
