import L from "leaflet";

const pinIconCache = new Map<string, L.DivIcon>();

export const getPinIcon = (color: string, variant: "default" | "hotel" | "wishlist" = "default"): L.DivIcon => {
  const key = `${color}-${variant}`;
  const cached = pinIconCache.get(key);
  if (cached) return cached;

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

  const icon = L.divIcon({
    html: svg,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
    className: "custom-pin",
  });
  pinIconCache.set(key, icon);
  return icon;
};

export const createClusterIcon = (color: string, opacity: number) => (cluster: { getChildCount(): number }) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div style="
      background: ${color};
      opacity: ${opacity};
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      border: 2.5px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ">${count}</div>`,
    className: "custom-cluster",
    iconSize: L.point(34, 34),
  });
};
