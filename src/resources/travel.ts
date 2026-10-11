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

export interface DestinationCoordinates {
  latitude: number;
  longitude: number;
}

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
