/** Shapes returned by the backend's /auth routes (app/schemas/auth.py). */

export type ClothingGender = "Menswear" | "Womenswear" | "Unisex";

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Me {
  email: string;
  plan: string;
  daily_llm_limit: number;
  used_today: number;
  remaining: number;
  clothing_genders: ClothingGender[];
}

export interface StylePreferences {
  clothing_genders: ClothingGender[];
  /** Every value the API accepts, so the toggles are not hardcoded here too. */
  available: ClothingGender[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  label: string;
}

/** A row of /api/v1/events: an event this account said it is going to.
 *
 * Narrower than a search hit -- no image, price or Eventbrite URL, because the
 * backend only stores what a recommendation needs (app/models.py SavedEvent).
 */
export interface SavedEvent {
  id: number;
  user_id: number | null;
  provider: string;
  provider_event_id: string;
  title: string;
  venue_name: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  start_time: string;
  end_time: string;
}
