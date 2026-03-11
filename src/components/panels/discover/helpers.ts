import { ATTR_TYPE_META } from "@/store/constants";
import type { DiscoverTab, FoodTypeKey, AttrTypeKey } from "@/types";
import type { OverpassResult } from "@/lib/overpass";

export function mapOsmToFoodType(result: OverpassResult): FoodTypeKey {
  const t = result.osmType;
  const n = result.name.toLowerCase();
  const c = (result.cuisine || "").toLowerCase();

  if (t === "cafe" || n.includes("cafe") || n.includes("coffee")) return "cafe";
  if (t === "bakery" || n.includes("bakery") || c.includes("bakery")) return "bakery";
  if (c.includes("ramen") || c.includes("noodle") || n.includes("ramen")) return "ramen";
  if (c.includes("sushi") || n.includes("sushi")) return "sushi";
  if (n.includes("izakaya") || c.includes("izakaya")) return "izakaya";
  if (t === "fast_food") return "street";
  if (t === "supermarket" || t === "convenience" || t === "general") return "grocer";
  if (t === "marketplace") return "market";
  if (t === "greengrocer" || t === "butcher" || t === "deli") return "grocer";
  if (n.includes("konbini") || n.includes("familymart") || n.includes("7-eleven") || n.includes("lawson")) return "konbini";
  return "restaurant";
}

export function mapOsmToAttrType(result: OverpassResult): AttrTypeKey {
  const t = result.osmType;
  const n = result.name.toLowerCase();

  if (t === "park" || t === "garden" || n.includes("park") || n.includes("garden")) return "park";
  if (t === "museum" || n.includes("museum")) return "museum";
  if (n.includes("temple") || n.includes("shrine") || n.includes("church") || n.includes("cathedral")) return "temple";
  if (t === "gallery" || t === "arts_centre" || n.includes("gallery")) return "gallery";
  if (t === "viewpoint" || n.includes("tower") || n.includes("observation")) return "viewpoint";
  if (t === "theatre" || t === "cinema") return "entertain";
  if (n.includes("mall") || n.includes("shopping")) return "shopping";
  if (t === "castle" || t === "monument" || t === "memorial" || t === "ruins") return "historic";
  return "historic";
}

export { fmtDist as formatDist } from "@/lib/formatUtils";

export function formatCuisine(cuisine: string): string {
  return cuisine
    .split(";")[0]
    .split(",")[0]
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatOsmType(osmType: string): string {
  const overrides: Record<string, string> = {
    fast_food: "Fast Food",
    ice_cream: "Ice Cream",
    arts_centre: "Arts Centre",
    theme_park: "Theme Park",
    archaeological_site: "Archaeological Site",
    wayside_shrine: "Shrine",
  };
  if (overrides[osmType]) return overrides[osmType];
  return osmType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getTagPills(result: OverpassResult, tab: DiscoverTab): { label: string; color: string }[] {
  const pills: { label: string; color: string }[] = [];
  const type = formatOsmType(result.osmType);
  const tags = result.tags;

  if (tab === "eat") {
    pills.push({ label: type, color: "#E8745A" });
    if (result.cuisine) {
      pills.push({ label: formatCuisine(result.cuisine), color: "#DAA520" });
    }
    // Diet tags
    if (tags["diet:vegan"] === "yes" || tags["diet:vegan"] === "only") pills.push({ label: "Vegan", color: "#22C55E" });
    else if (tags["diet:vegetarian"] === "yes" || tags["diet:vegetarian"] === "only") pills.push({ label: "Vegetarian", color: "#22C55E" });
    // Takeaway / outdoor
    if (tags.takeaway === "yes" || tags.takeaway === "only") pills.push({ label: "Takeaway", color: "#3B82F6" });
    if (tags.outdoor_seating === "yes") pills.push({ label: "Outdoor", color: "#60A5FA" });
  } else if (tab === "grocers") {
    pills.push({ label: type, color: "#22C55E" });
    const brand = tags["brand:en"] || tags.brand;
    if (brand && brand.toLowerCase() !== result.name.toLowerCase()) {
      pills.push({ label: brand, color: "#3B82F6" });
    }
  } else {
    const at = mapOsmToAttrType(result);
    const meta = ATTR_TYPE_META[at];
    pills.push({ label: type, color: meta?.color || "#8B5CF6" });
    if (tags.fee === "no") {
      pills.push({ label: "Free", color: "#22C55E" });
    } else if (tags.fee === "yes") {
      pills.push({ label: "Paid Entry", color: "#F97316" });
    }
    if (tags.wheelchair === "yes") pills.push({ label: "Accessible", color: "#60A5FA" });
  }

  return pills;
}

