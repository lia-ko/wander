"use client";

import { Circle, Tooltip } from "react-leaflet";
import { useTripStore } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";

// Average walking speed ~5km/h -> ~833m per 10 min
const WALK_RINGS = [
  { minutes: 30, radius: 2500, opacity: 0.05 },
  { minutes: 20, radius: 1667, opacity: 0.08 },
  { minutes: 10, radius: 833, opacity: 0.12 },
];

export default function WalkingRadius() {
  const radiusCenter = useUIStore((s) => s.radiusCenter);
  const dark = useTripStore((s) => s.darkMode);

  if (!radiusCenter) return null;

  const ringColor = dark ? "#60A5FA" : "#3B82F6";

  // Key prefix forces re-mount when center changes, ensuring Leaflet layers
  // and permanent tooltips re-render correctly
  const keyPrefix = `${radiusCenter.lat},${radiusCenter.lng}`;

  return (
    <>
      {WALK_RINGS.map((ring) => (
        <Circle
          key={`${keyPrefix}-${ring.minutes}`}
          center={[radiusCenter.lat, radiusCenter.lng]}
          radius={ring.radius}
          pathOptions={{
            color: ringColor,
            weight: 1.5,
            fillColor: ringColor,
            fillOpacity: ring.opacity,
            dashArray: ring.minutes > 10 ? "6 4" : undefined,
          }}
        >
          <Tooltip
            permanent
            direction="top"
            className="radius-label"
          >
            {ring.minutes} min
          </Tooltip>
        </Circle>
      ))}
      <Circle
        key={`${keyPrefix}-center`}
        center={[radiusCenter.lat, radiusCenter.lng]}
        radius={30}
        pathOptions={{
          color: ringColor,
          weight: 2,
          fillColor: ringColor,
          fillOpacity: 0.6,
        }}
      />
    </>
  );
}
