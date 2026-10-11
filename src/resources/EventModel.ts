export interface EventModel {
  id: string;
  address: string | null;
  distance_mi: number;
  end_time: string; // ISO 8601 format (e.g., "2026-10-13T15:00:00Z")
  image_url: string;
  is_free: boolean;
  is_online: boolean;
  latitude: number;
  longitude: number;
  price_display: string;
  provider: string;
  provider_event_id: string;
  start_time: string; // ISO 8601 format (e.g., "2026-10-13T13:15:00Z")
  summary: string;
  timezone: string;
  title: string;
  url: string;
  venue_name: string | null;
  weather: {
    time: string;
    summary: string | null;
    temperature: number | null;
    apparentTemperature: number | null;
    precipProbability: number | null;
    precipIntensity: number | null;
    precipType: string | null;
    windSpeed: number | null;
    humidity: number | null;
  } | null;
  nearby_restaurants: {
    name: string;
    cuisine: string;
    website_url: string | null;
    osm_url: string | null;
  }[] | null;
  nearby_restaurants_radius_meters: number | null;
}
