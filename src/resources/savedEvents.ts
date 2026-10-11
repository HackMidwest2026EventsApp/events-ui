/** The "I'm going" list.
 *
 * A search hit cannot be saved directly: its id is a short-lived handle on a
 * cached search response, and /events/save wants the full EventDTO that
 * /events/import-link produces from the hit's Eventbrite URL. So going to an
 * event is two calls, and both have to carry the account's token or the row
 * lands as a guest event owned by nobody.
 *
 * The save is an upsert on (user, provider, provider_event_id), so pressing
 * the button twice is harmless.
 */
import { api } from "./api";
import type { SavedEvent } from "./AccountModel";
import type { EventModel } from "./EventModel";

export const listSavedEvents = (token: string) =>
  api<SavedEvent[]>("/api/v1/events", { token });

export const goingToEvent = async (
  event: EventModel,
  token: string,
): Promise<SavedEvent> => {
  const dto = await api<unknown>("/api/v1/events/import-link", {
    body: { url: event.url },
    token,
  });
  return api<SavedEvent>("/api/v1/events/save", { body: dto, token });
};

/** Eventbrite's own page. A saved row keeps the provider id but not the URL,
 *  and /e/{id} is a permalink Eventbrite redirects to the full slug. */
export const providerUrl = (event: SavedEvent): string | null =>
  event.provider === "eventbrite"
    ? `https://www.eventbrite.com/e/${event.provider_event_id}`
    : null;
