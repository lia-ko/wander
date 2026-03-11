"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import MapPins from "./MapPins";
import RouteLines from "./RouteLines";
import WalkingRadius from "./WalkingRadius";
import MapSync from "./MapSync";
import ZoomControls from "./ZoomControls";
import "leaflet/dist/leaflet.css";

export default function MapView() {
  const dark = useTripStore((s) => s.darkMode);
  const trip = useTripStore(selectActiveTrip);
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
      <RouteLines />
      <WalkingRadius />
      <MapSync />
      <ZoomControls />
    </MapContainer>
  );
}
