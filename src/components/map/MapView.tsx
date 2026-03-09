"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { useTripStore } from "@/store/tripStore";
import { HOTEL_COLOR } from "@/store/constants";
import "leaflet/dist/leaflet.css";

const createPinIcon = (color: string, variant: "default" | "hotel" | "wishlist" = "default") => {
  let svg: string;
  if (variant === "hotel") {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
        <path d="M9.5 13.5v-1.5h1.5v-1.5h2v1.5h1.5v1.5h-5z M10 10.5h4v1h-4z" fill="${color}"/>
      </svg>`;
  } else if (variant === "wishlist") {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5" opacity="0.7"/>
        <path d="M12 7l1.5 3 3.3.5-2.4 2.3.6 3.2L12 14.2 8.9 16l.6-3.2L7.1 10.5l3.3-.5z" fill="white" opacity="0.9"/>
      </svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.9"/>
      </svg>`;
  }

  return L.divIcon({
    html: svg,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
    className: "custom-pin",
  });
};

function MapPins() {
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const selectedPinId = useTripStore((s) => s.selectedPinId);
  const setSelectedPinId = useTripStore((s) => s.setSelectedPinId);

  return (
    <>
      {trip.hotels.map((hotel) => (
        <Marker
          key={hotel.id}
          position={[hotel.y, hotel.x]}
          icon={createPinIcon(HOTEL_COLOR, "hotel")}
        >
          <Popup>
            <div className="text-sm font-semibold">{hotel.name}</div>
            <div className="text-xs text-zinc-500">{hotel.address}</div>
          </Popup>
        </Marker>
      ))}

      {trip.days.map((day) => {
        const isActive = day.id === activeDayId;
        return day.pins
          .filter((pin) => pin.y !== 0 && pin.x !== 0)
          .map((pin) => (
            <Marker
              key={`${day.id}-${pin.id}`}
              position={[pin.y, pin.x]}
              icon={createPinIcon(day.color)}
              opacity={isActive ? 1 : 0.15}
              eventHandlers={{
                click: () => setSelectedPinId(selectedPinId === pin.id ? null : pin.id),
              }}
            >
              <Popup>
                <div className="text-sm font-semibold">{pin.name}</div>
                {pin.note && <div className="text-xs text-zinc-500">{pin.note}</div>}
              </Popup>
            </Marker>
          ));
      })}

      {/* Wishlist pins — distinct star markers, semi-transparent */}
      {(trip.wishlist ?? [])
        .filter((pin) => pin.y !== 0 && pin.x !== 0)
        .map((pin) => (
          <Marker
            key={`wish-${pin.id}`}
            position={[pin.y, pin.x]}
            icon={createPinIcon("#9CA3AF", "wishlist")}
            opacity={0.6}
          >
            <Popup>
              <div className="text-sm font-semibold">{pin.name}</div>
              {pin.note && <div className="text-xs text-zinc-500">{pin.note}</div>}
              <div className="text-[10px] text-zinc-400 mt-0.5">Wishlist</div>
            </Popup>
          </Marker>
        ))}
    </>
  );
}

// Average walking speed ~5km/h → ~833m per 10 min
const WALK_RINGS = [
  { minutes: 30, radius: 2500, opacity: 0.05 },
  { minutes: 20, radius: 1667, opacity: 0.08 },
  { minutes: 10, radius: 833, opacity: 0.12 },
];

function WalkingRadius() {
  const radiusCenter = useTripStore((s) => s.radiusCenter);
  const dark = useTripStore((s) => s.darkMode);

  if (!radiusCenter) return null;

  const ringColor = dark ? "#60A5FA" : "#3B82F6";

  return (
    <>
      {/* Render largest first so smaller rings are on top and clickable */}
      {WALK_RINGS.map((ring) => (
        <Circle
          key={ring.minutes}
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
      {/* Center dot */}
      <Circle
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

function MapSync() {
  const map = useMap();
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const activeTripId = useTripStore((s) => s.activeTripId);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const prevTripId = useRef(activeTripId);
  const prevDayId = useRef(activeDayId);
  const prevPinCount = useRef(0);

  // Count all pins with valid coords in the active day
  const activeDay = trip.days.find((d) => d.id === activeDayId);
  const validPins = activeDay?.pins.filter((p) => p.y !== 0 && p.x !== 0) ?? [];

  useEffect(() => {
    // Trip changed — fly to trip center
    if (activeTripId !== prevTripId.current) {
      prevTripId.current = activeTripId;
      prevDayId.current = activeDayId;
      prevPinCount.current = validPins.length;
      const c = trip.center ?? { lat: 0, lng: 0 };
      map.flyTo([c.lat, c.lng], 12, { duration: 1 });
      return;
    }

    // Day changed — fit bounds to day pins or fly to trip center
    if (activeDayId !== prevDayId.current) {
      prevDayId.current = activeDayId;
      prevPinCount.current = validPins.length;
      if (validPins.length > 0) {
        const bounds = L.latLngBounds(validPins.map((p) => [p.y, p.x]));
        map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 15, duration: 0.8 });
      }
      return;
    }

    // New pin added — fly to include it
    if (validPins.length > prevPinCount.current && validPins.length > 0) {
      prevPinCount.current = validPins.length;
      if (validPins.length === 1) {
        map.flyTo([validPins[0].y, validPins[0].x], 15, { duration: 0.8 });
      } else {
        const bounds = L.latLngBounds(validPins.map((p) => [p.y, p.x]));
        map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 15, duration: 0.8 });
      }
    }

    prevPinCount.current = validPins.length;
  }, [activeTripId, activeDayId, validPins.length, trip.center, map, validPins]);

  return null;
}

export default function MapView() {
  const dark = useTripStore((s) => s.darkMode);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const center = trip?.center ?? { lat: 0, lng: 0 };

  const lightTiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const darkTiles = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      className="w-full h-full z-0"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url={dark ? darkTiles : lightTiles} />
      <MapPins />
      <WalkingRadius />
      <MapSync />
    </MapContainer>
  );
}
