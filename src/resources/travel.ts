import { api } from "./api";

export interface UberEstimate {
  source: "uber_api" | "model";
  product: string;
  currency: string;
  fare_low: number;
  fare_high: number;
  fare_display: string;
  pickup_eta_min: number | null;
  trip_min: number;
  surge_multiplier: number | null;
  note: string | null;
}

export type TravelMode =
  | "Walking"
  | "Cycling"
  | "Public Transit"
  | "Rideshare"
  | "Driving";

export interface TravelOption {
  mode: TravelMode;
  score: number;
  viable: boolean;
  eta_min: number;
  cost_display: string;
  why: string[];
}

export interface TravelPlan {
  verdict: string;
  recommended_mode: TravelMode;
  destination_label: string;
  distance_mi: number;
  origin: [number, number];
  destination: [number, number];
  weather_note: string | null;
  precipitation_warning: boolean;
  arrive_by: string | null;
  leave_by: string | null;
  minutes_until_arrival_deadline: number | null;
  options: TravelOption[];
  uber: {
    universal_url: string;
    app_url: string;
    note: string | null;
  };
  uber_estimate: UberEstimate | null;
}

export interface DestinationCoordinates {
  latitude: number;
  longitude: number;
}

/** Compare travel modes for a destination from the search or saved origin. */
export const getTravelPlan = (
  destination: DestinationCoordinates,
  token: string,
  origin?: DestinationCoordinates,
  signal?: AbortSignal,
): Promise<TravelPlan> => {
  const params: Record<string, string> = {
    dest_lat: String(destination.latitude),
    dest_lon: String(destination.longitude),
  };
  if (origin) {
    params.origin_lat = String(origin.latitude);
    params.origin_lon = String(origin.longitude);
  }
  const query = new URLSearchParams(params);
  return api<TravelPlan>(`/api/v1/travel/plan?${query}`, { token, signal });
};

/** Request a fare estimate to a destination from the user's saved location. */
export const getUberEstimate = (
  destination: DestinationCoordinates,
  token: string,
  origin?: DestinationCoordinates,
  signal?: AbortSignal,
): Promise<UberEstimate> => {
  const params: Record<string, string> = {
    dest_lat: String(destination.latitude),
    dest_lon: String(destination.longitude),
  };
  if (origin) {
    params.origin_lat = String(origin.latitude);
    params.origin_lon = String(origin.longitude);
  }
  const query = new URLSearchParams(params);
  return api<UberEstimate>(`/api/v1/travel/uber-estimate?${query}`, {
    token,
    signal,
  });
};
