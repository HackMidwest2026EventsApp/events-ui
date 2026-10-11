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
 *
 * Step 2 never saves under the signed-in account. The backend has one table
 * for saved events, so a save there *is* the profile's "going to" list, and
 * generating an outfit is something that happens just by opening an event
 * page: writing it would put every event the user glanced at on their list.
 * Only the explicit "I'm going" button adds to it (see ./savedEvents).
 */
import type { EventModel } from "./EventModel";
import type { EventRecommendation } from "./RecommendationModel";
import {
  API,
  ApiError,
  readToken as readSessionToken,
  writeToken as writeSessionToken,
} from "./api";
import { listSavedEvents } from "./savedEvents";

const GUEST_TOKEN_KEY = "events-ui.guest-token";

/** Garment photos are served by the API, and the paths it returns are relative. */
export const garmentImageUrl = (path: string) =>
  path.startsWith("http") ? path : `${API}${path}`;

/** localStorage throws in private windows; a lost token only costs a re-register. */
const readGuestToken = (): string | null => {
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
};

const writeGuestToken = (token: string | null) => {
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
  writeGuestToken(access_token);
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
  dto: { provider: string; provider_event_id: string },
): Promise<{ id: number; token: string | null }> => {
  // An event already on the signed-in user's list has a row of its own, so
  // reuse it: the outfit is then cached against the event they are actually
  // going to, and counts against their plan rather than the shared guest
  // quota. Reading the list cannot add to it, which is the point.
  const session = readSessionToken();
  if (session) {
    try {
      const mine = await listSavedEvents(session);
      const owned = mine.find(
        (saved) =>
          saved.provider === dto.provider &&
          saved.provider_event_id === dto.provider_event_id,
      );
      if (owned) return { id: owned.id, token: session };
    } catch (error) {
      // A token the API rejects is dead (they last a day); either way, fall
      // back to the guest path rather than failing the outfit.
      if (error instanceof ApiError && error.status === 401) {
        writeSessionToken(null);
      }
    }
  }

  const stored = readGuestToken();
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
    writeGuestToken(null);
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

  const { id, token } = await saveEvent(
    (await imported.json()) as { provider: string; provider_event_id: string },
  );

  const generated = await post(
    "/api/v1/recommendations/generate",
    { event_id: id },
    token,
  );
  if (!generated.ok) return failed("Generating the recommendation", generated);
  return generated.json();
};
