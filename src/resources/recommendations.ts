/** Getting an outfit out of the backend's recommendation agent.
 *
 * A search hit is not something the agent can work on: its id is a short-lived
 * handle on a cached search response, while /recommendations/generate wants the
 * integer id of a *saved* event. Turning one into the other takes three calls,
 * so they live here rather than in the page:
 *
 *   1. POST /events/import-link  — the hit's Eventbrite URL -> a full EventDTO
 *   2. POST /events/save         — that DTO -> a saved event with an integer id
 *   3. POST /recommendations/generate — the outfit and transit advice
 *
 * Step 3 runs the LLM and takes ~20s on a cold event; the backend caches it for
 * an hour, so a revisit is immediate.
 */
import type { EventModel } from "./EventModel";
import type { EventRecommendation } from "./RecommendationModel";

/** Trailing slash stripped so paths can be written with a leading one. */
const API = import.meta.env.VITE_API.replace(/\/+$/, "");

const GUEST_TOKEN_KEY = "events-ui.guest-token";

/** Garment photos are served by the API, and the paths it returns are relative. */
export const garmentImageUrl = (path: string) =>
  path.startsWith("http") ? path : `${API}${path}`;

/** localStorage throws in private windows; a lost token only costs a re-register. */
const readToken = (): string | null => {
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
};

const writeToken = (token: string | null) => {
  try {
    if (token === null) localStorage.removeItem(GUEST_TOKEN_KEY);
    else localStorage.setItem(GUEST_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
};

const post = (path: string, body: unknown, token?: string | null) =>
  fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

const failed = async (what: string, res: Response): Promise<never> => {
  const detail = await res.text().catch(() => "");
  throw new Error(`${what} failed (${res.status}) ${detail}`.trim());
};

/** A throwaway account, used only when the API refuses to save a guest event. */
const registerGuest = async (): Promise<string> => {
  const handle = crypto.randomUUID();
  const res = await post("/api/v1/auth/register", {
    // Not .local or .invalid: the API validates the domain and rejects the
    // special-use TLDs outright (422).
    email: `guest-${handle}@example.com`,
    password: handle,
  });
  if (!res.ok) return failed("Guest sign-in", res);
  const { access_token } = (await res.json()) as { access_token: string };
  writeToken(access_token);
  return access_token;
};

/** The saved event's integer id, plus the token it has to be read back with.
 *
 * The signed-out path is the one the backend documents, and it is what runs
 * against a local API. The deployed database predates the nullable owner
 * column, so a guest save 500s there — hence the fallback to an anonymous
 * account. Whichever one saved the event also owns it, so the token travels
 * with the id: /recommendations/generate 404s if they disagree.
 */
const saveEvent = async (
  dto: unknown,
): Promise<{ id: number; token: string | null }> => {
  const stored = readToken();
  if (!stored) {
    // The deployed API 500s here, and its 500s carry no CORS headers, so the
    // browser rejects the fetch instead of handing back the status. Either way
    // the signed-in path below is the fallback.
    try {
      const guest = await post("/api/v1/events/save", dto);
      if (guest.ok) return { id: (await guest.json()).id, token: null };
    } catch {
      /* fall through to the guest account */
    }
  }

  let token = stored ?? (await registerGuest());
  let res = await post("/api/v1/events/save", dto, token);
  if (res.status === 401) {
    // The stored token expired (they last a day). Start a new guest.
    writeToken(null);
    token = await registerGuest();
    res = await post("/api/v1/events/save", dto, token);
  }
  if (!res.ok) return failed("Saving the event", res);
  return { id: (await res.json()).id, token };
};

export const fetchRecommendation = async (
  event: EventModel,
): Promise<EventRecommendation> => {
  const imported = await post("/api/v1/events/import-link", { url: event.url });
  if (!imported.ok) return failed("Importing the event", imported);

  const { id, token } = await saveEvent(await imported.json());

  const generated = await post(
    "/api/v1/recommendations/generate",
    { event_id: id },
    token,
  );
  if (!generated.ok) return failed("Generating the recommendation", generated);
  return generated.json();
};
