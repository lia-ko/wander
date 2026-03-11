"use client";

import { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import { HOTEL_COLOR } from "@/store/constants";
import { getDayDate } from "@/lib/hours";
import { getPinIcon, createClusterIcon } from "./pinIcon";
import PinPopup from "./PinPopup";

function DayCluster({ dayId, color, isActive, children }: {
  dayId: number;
  color: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  const iconFn = useMemo(
    () => createClusterIcon(color, isActive ? 1 : 0.15),
    [color, isActive]
  );

  return (
    <MarkerClusterGroup
      key={`cluster-${dayId}-${isActive}`}
      iconCreateFunction={iconFn}
      maxClusterRadius={40}
      spiderfyOnMaxZoom
      showCoverageOnHover={false}
      zoomToBoundsOnClick
      disableClusteringAtZoom={16}
    >
      {children}
    </MarkerClusterGroup>
  );
}

export default function MapPins() {
  const trip = useTripStore(selectActiveTrip);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const selectedPinId = useUIStore((s) => s.selectedPinId);
  const setSelectedPinId = useUIStore((s) => s.setSelectedPinId);

  return (
    <>
      {trip.hotels.map((hotel) => (
        <Marker
          key={hotel.id}
          position={[hotel.y, hotel.x]}
          icon={getPinIcon(HOTEL_COLOR, "hotel")}
        >
          <Popup>
            <div className="text-sm font-semibold">{hotel.name}</div>
            <div className="text-xs text-zinc-500">{hotel.address}</div>
            {hotel.checkIn && (
              <div className="text-[10px] text-zinc-400 mt-1">
                Check-in: {hotel.checkIn}{hotel.checkOut ? ` · Out: ${hotel.checkOut}` : ""}
              </div>
            )}
          </Popup>
        </Marker>
      ))}

      {trip.days.map((day) => {
        const isActive = day.id === activeDayId;
        const validPins = day.pins.filter((pin) => pin.y !== 0 && pin.x !== 0);
        const dayIndex = trip.days.findIndex((d) => d.id === day.id);
        const dayDate = trip.startDate ? getDayDate(trip.startDate, dayIndex) : null;
        return (
          <DayCluster key={day.id} dayId={day.id} color={day.color} isActive={isActive}>
            {validPins.map((pin, i) => (
              <Marker
                key={`${day.id}-${pin.id}`}
                position={[pin.y, pin.x]}
                icon={getPinIcon(day.color, "default", i + 1)}
                opacity={isActive ? 1 : 0.15}
                eventHandlers={{
                  click: () => setSelectedPinId(selectedPinId === pin.id ? null : pin.id),
                }}
              >
                <Popup>
                  <PinPopup pin={pin} dayDate={dayDate} />
                </Popup>
              </Marker>
            ))}
          </DayCluster>
        );
      })}

      {(trip.wishlist ?? [])
        .filter((pin) => pin.y !== 0 && pin.x !== 0)
        .map((pin) => (
          <Marker
            key={`wish-${pin.id}`}
            position={[pin.y, pin.x]}
            icon={getPinIcon("#9CA3AF", "wishlist")}
            opacity={0.6}
          >
            <Popup>
              <PinPopup pin={pin} dayDate={null} label="Wishlist" />
            </Popup>
          </Marker>
        ))}
    </>
  );
}
