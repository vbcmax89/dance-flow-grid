export interface EventMeta {
  description?: string;
  location?: string;
  styles?: string;
  website_url?: string;
  pass_url?: string;
}

export function decodeEventMeta(raw: string | null | undefined): EventMeta {
  if (!raw) return {};
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object" && !Array.isArray(p)) return p as EventMeta;
  } catch {}
  return { description: raw };
}

export function encodeEventMeta(meta: EventMeta): string | null {
  const { description, location, styles, website_url, pass_url } = meta;
  if (!location && !styles && !website_url && !pass_url) return description || null;
  const obj: EventMeta = {};
  if (description) obj.description = description;
  if (location) obj.location = location;
  if (styles) obj.styles = styles;
  if (website_url) obj.website_url = website_url;
  if (pass_url) obj.pass_url = pass_url;
  return JSON.stringify(obj);
}
