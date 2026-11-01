// Pure hash helper. Works in both Node (preview) and Cloudflare Workers (production).
// Uses Web Crypto SubtleCrypto for portability.

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Simple session token — base64 of JSON payload. For production you'd want JWT
// or a HMAC-signed token, but this is enough for the preview to persist
// the logged-in identity in localStorage across reloads.
export function encodeSession(payload: object): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function decodeSession<T = unknown>(token: string): T | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(token)))) as T;
  } catch {
    return null;
  }
}

export const SESSION_KEY = "vega_session";
