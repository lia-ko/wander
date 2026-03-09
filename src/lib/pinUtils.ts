import { FOOD_TYPE_META, ATTR_TYPE_META } from "@/store/constants";
import type { Pin } from "@/types";

/** Get the emoji badge for a pin based on its food/attraction type, or null. */
export function getPinBadge(pin: Pin): string | null {
  if (pin.foodType && FOOD_TYPE_META[pin.foodType]) return FOOD_TYPE_META[pin.foodType].emoji;
  if (pin.attrType && ATTR_TYPE_META[pin.attrType]) return ATTR_TYPE_META[pin.attrType].emoji;
  return null;
}
