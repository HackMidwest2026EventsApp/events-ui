/** The API base URL, the session token, and one fetch wrapper over both.
 *
 * Auth is a bearer header rather than a cookie (the API sets
 * `allow_credentials=False`), so the token lives in localStorage and every
 * authenticated call has to pass it explicitly.
 */

/** Trailing slash stripped so paths can be written with a leading one. */
export const API = import.meta.env.VITE_API.replace(/\/+$/, "");

const TOKEN_KEY = "events-ui.token";

/** localStorage throws in private windows; a lost token only costs a re-login. */
export const readToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const writeToken = (token: string | null) => {
  try {
    if (token === null) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/** FastAPI puts the message in `detail`, as a string or as a list of
 *  validation errors. Either way the user wants one sentence. */
const messageOf = (status: number, text: string): string => {
  try {
    const { detail } = JSON.parse(text) as { detail?: unknown };
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const first = detail[0] as { msg?: string } | undefined;
      if (first?.msg) return first.msg;
    }
  } catch {
    /* not JSON -- fall through to the status line */
  }
  return text.trim() || `Request failed (${status})`;
};

interface Options {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Sent as JSON. */
  body?: unknown;
  /** Sent form-encoded instead -- /auth/login takes an OAuth2 password form. */
  form?: Record<string, string>;
  token?: string | null;
}

export const api = async <T>(path: string, options: Options = {}): Promise<T> => {
  const { method, body, form, token } = options;

  const res = await fetch(`${API}${path}`, {
    method: method ?? (body || form ? "POST" : "GET"),
    headers: {
      ...(form
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : body
          ? { "Content-Type": "application/json" }
          : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form
      ? new URLSearchParams(form).toString()
      : body
        ? JSON.stringify(body)
        : undefined,
  });

  if (!res.ok) {
    throw new ApiError(res.status, messageOf(res.status, await res.text().catch(() => "")));
  }
  return res.json() as Promise<T>;
};
