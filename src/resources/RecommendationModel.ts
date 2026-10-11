/** Shapes returned by the backend's recommendation agent.
 *
 * Mirrors app/schemas/llm.py: the LLM answers with the outfit advice, and the
 * backend attaches `image` afterwards by looking each garment up in the
 * DeepFashion catalog. `image` is null whenever that lookup found nothing.
 */

export type GarmentSource =
  | "deepfashion"
  | "deepfashion2"
  | "deepfashion_inshop";

export interface GarmentImage {
  garment_id: string;
  /** Server-relative, e.g. "/api/v1/garments/image/dfi:Tee/...jpg". */
  image_url: string;
  source: GarmentSource;
  dataset_label: string;
  match_score: number;
  match_reasons: string[];
  attribution: string;
}

export interface OutfitItem {
  category: "Outerwear" | "Top" | "Bottom";
  item_description: string;
  reasoning: string;
  garment_type: string;
  attribute_hints: string[];
  color: string;
  image: GarmentImage | null;
}

export interface OutfitRecommendation {
  formality_level: "Casual" | "Smart Casual" | "Business Casual" | "Formal";
  layers_required: boolean;
  summary: string;
  items: OutfitItem[];
}

export interface TransitRecommendation {
  primary_mode:
    | "Walking"
    | "Cycling"
    | "Public Transit"
    | "Rideshare"
    | "Driving";
  estimated_impact_weather: string;
  precipitation_warning: boolean;
  travel_tips: string[];
}

export interface EventRecommendation {
  id: number;
  saved_event_id: number;
  outfit_json: OutfitRecommendation;
  transit_json: TransitRecommendation;
  generated_at: string;
}
