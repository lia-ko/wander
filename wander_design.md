# Wander (trip planner) — Design Document

> Last updated: March 2026  
> Status: Design / Pre-build

---

## 1. UI Layout & Panels

### Overall Structure

The app uses a **map-first, floating glass panel** layout. The map fills 100% of the viewport at all times — no hard chrome edges. All UI lives in frosted-glass panels that float over the map.

```
┌────────────────────────────────────────────────────────┐
│  [Main Panel]   [Discover Panel]        [Search Bar]   │
│  floating left  slides in beside        top-right      │
│                                                        │
│                   M A P                                │
│                                                        │
│                                      [Map Controls]    │
│                              [Scale Bar]               │
└────────────────────────────────────────────────────────┘
```

### Main Panel (left, 310px wide)

The primary navigation and itinerary panel. Collapses to a 52px icon strip.

| Section | Contents |
|---|---|
| **Header** | Trip selector dropdown, collapse toggle |
| **Hotel strip** | Accommodation card with amber accent |
| **Day chips** | Horizontal scroll, colour-coded per day |
| **Day title bar** | Active day label, neighbourhood, stop count |
| **Stop list** | Scrollable list of pins with transport segments between each |
| **Bottom action bar** | Discover buttons (Eat Out / Grocers / Attractions) + Drop Pin + Route |

### Discover Panel (slides in at left + 336px)

Opens alongside the main panel when a Discover button is tapped. Three tabs:

- **🍽️ Eat Out** — restaurants, ramen, sushi, cafés, izakayas, street food
- **🛒 Grocers** — supermarkets, markets, konbini, bakeries
- **🗺️ Attractions** — parks, museums, temples, galleries, viewpoints, historic sites, hidden gems, nightlife

Each panel includes: tab switcher, search input, category filter chips, "adding to Day X" context indicator, and a scrollable results list.

The Attractions tab includes a **smart suggestions section** at the top, derived from the existing itinerary (see §3).

### Map Layer

- Full-bleed, always visible underneath all panels
- Topo-style SVG grid + road paths rendered in SVG
- **Light / dark mode** toggle (top-right)
- Pin types:

| Pin Shape | Colour | Represents |
|---|---|---|
| Teardrop (rotated square, rounded) | Day colour | Attraction / itinerary stop |
| Rotated diamond, circle glow | Amber `#C9A227` | Hotel / accommodation |
| Rotated square | Category colour | Food spot added via Discover |
| Circle | Category colour | Attraction added via Discover |

- Inactive day pins dim to 15% opacity
- Hover shows tooltip with place name

### Collapsed State

When the main panel collapses:
- Shows trip emoji, day colour dots, and small icon buttons for each Discover tab
- Clicking any item expands the panel back to full width

---

## 2. Feature List & Interactions

### Trip Management
- Multiple trips stored, switchable via dropdown
- Each trip has: name, emoji, date range
- "New trip" option at the bottom of the dropdown

### Day Planning
- Days are colour-coded (Day 1 → `#E8845A`, Day 2 → `#5A8FE8`, Day 3 → `#5ABD8C`, Day 4 → `#B87FE8`)
- Add/remove days
- Each day has a label and neighbourhood sublabel
- Active day highlighted; other day pins dimmed on map

### Stop List
- Stops are displayed in order with an index badge
- Food and attraction stops added via Discover show a category icon badge instead of a number
- Tapping a stop expands inline actions: **Edit**, **Move**, **Remove**
- "Add a stop" row at the bottom

### Transport Segments
- Between every pair of consecutive stops, a dashed connector line is shown
- Clicking the connector opens a **Transport Picker** popover (8 modes):
  - Walk 🚶, Train 🚄, Subway 🚇, Bus 🚌, Taxi 🚕, Ferry ⛴️, Bike 🚲, Car 🚗
- Each mode has a distinct colour and estimated travel time field
- "Remove" clears the segment back to unset state
- Future: Mapbox Directions API auto-populates travel times

### Discover — Food
- **Eat Out tab**: restaurants, cafés, ramen, sushi, izakayas, street food
- **Grocers tab**: supermarkets, markets, konbini, bakeries
- Results show: name, star rating, price tier (`$` → `$$$$`), category badge, note
- Tapping **＋** adds the item to the active day's stop list and drops a pin on the map
- Button turns to ✓ once added

### Discover — Attractions
- 11 category types with icons and colours
- Results show: name, star rating, **cost scale** (1–5 filled dots or **Free** badge), duration estimate, category badge, note
- **Smart suggestions** section: ranks attractions based on what categories already exist in the itinerary
  - Has culture stops → surfaces museums, temples, historic sites
  - Has nature stops → surfaces parks
  - Has art stops → surfaces galleries, entertainment
  - Falls back to editorially-marked `suggested: true` items

### Cost Scale (Attractions)
- `null` → green **Free** pill badge
- `1–5` → 5 dots, filled in amber up to the cost level
- Hover shows `Cost: X / 5` tooltip

### PDF Export
- Triggered from the bottom action bar
- Generates a multi-section PDF:
  1. Cover — trip name, dates, hotel
  2. Day-by-day itinerary with stop names, categories, notes
  3. Transport segments between stops
  4. Food & attraction pins added via Discover
  5. Map screenshot (canvas snapshot)
- See §3 for the data shape used to generate the export

### Light / Dark Mode
- Toggle in top-right corner (☀️ / 🌙)
- Full theme token system — all colours derived from `dark` boolean
- Glass panels adjust background, border, and text opacity

---

## 3. Data Model & Types

### Trip
```ts
type Trip = {
  id: number;
  name: string;       // "Tokyo Spring"
  emoji: string;      // "🌸"
  dates: string;      // "Apr 3–9"
};
```

### Day
```ts
type Day = {
  id: number;
  label: string;      // "Day 1"
  sublabel: string;   // "Asakusa"
  color: string;      // "#E8845A"
  pins: Pin[];
};
```

### Pin
```ts
type Pin = {
  id: number;
  name: string;
  category: string;         // "Culture" | "Food" | "Attraction" | ...
  note: string | null;
  transport: TransportKey | null;   // how to GET HERE from previous stop
  travelTime: string | null;        // "12 min"

  // Food-specific (optional)
  foodType?: FoodTypeKey;
  rating?: number;
  price?: string;           // "$" | "$$" | "$$$" | "$$$$"

  // Attraction-specific (optional)
  attrType?: AttrTypeKey;
  duration?: string;        // "2h" | "1.5h" | "eve"
  cost?: number | null;     // 1–5 or null (free)
};
```

### Transport Key
```ts
type TransportKey = "walk" | "train" | "subway" | "bus" | "taxi" | "ferry" | "bike" | "car";
```

### Food Type Key
```ts
type FoodTypeKey = "restaurant" | "cafe" | "ramen" | "sushi" | "izakaya"
                 | "grocer" | "konbini" | "market" | "bakery" | "street";
```

### Attraction Type Key
```ts
type AttrTypeKey = "park" | "museum" | "temple" | "gallery" | "viewpoint"
                 | "historic" | "shopping" | "nature" | "entertain" | "nightlife" | "hidden";
```

### Hotel
```ts
type Hotel = {
  id: string;
  name: string;
  address: string;
  x: number;    // map % position
  y: number;
};
```

### Discover Result (Food)
```ts
type FoodResult = {
  id: string;
  name: string;
  type: FoodTypeKey;
  rating: number;
  price: string;
  note: string;
  x: number;
  y: number;
};
```

### Discover Result (Attraction)
```ts
type AttractionResult = {
  id: string;
  name: string;
  type: AttrTypeKey;
  rating: number;
  duration: string;
  cost: number | null;    // null = free, 1–5 = paid scale
  note: string;
  suggested: boolean;
  x: number;
  y: number;
};
```

---

## 4. Tech Stack & Build Plan

### Frontend Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR, file-based routing, good Vercel deploy story |
| UI | **React** + **Tailwind CSS** | Utility-first, no component library lock-in |
| State | **Zustand** | Lightweight, no boilerplate, easy slice pattern |
| Map (POC) | **Leaflet + OpenStreetMap** | Free, no API key, fast to prototype |
| Map (prod) | **Mapbox GL JS** | Vector tiles, Directions API, custom styles |
| Persistence (v1) | **localStorage** | Zero backend, instant POC |
| Backend (v2) | **Supabase** | Postgres + PostGIS + Auth + realtime |
| PDF export | **jsPDF** + **html2canvas** | Client-side, no server needed |

### Map Migration Strategy

All map interactions are wrapped in a single `useMap.ts` hook. Swapping Leaflet → Mapbox GL JS is a single-file change — no component rewrites needed.

### Build Stages

#### Stage 1 — Core Map + Pin Dropping
- Next.js project scaffold
- Leaflet map with OpenStreetMap tiles
- Click to drop a pin, name it, assign to a day
- Zustand store: `trips`, `days`, `pins`
- localStorage persistence

#### Stage 2 — Day Groups + Sidebar
- Colour-coded pins per day
- Floating glass sidebar (Layout C)
- Day chips, stop list, collapse/expand
- Hotel pin

#### Stage 3 — Transport + Routing
- Transport segment UI between stops
- Mapbox migration (swap `useMap.ts`)
- Mapbox Directions API for auto travel times

#### Stage 4 — Discover (Food + Attractions)
- Integrate Google Places API or Mapbox Search
- Replace mock data with live results
- Smart suggestion engine (server-side scoring)

#### Stage 5 — Trip Management + Auth
- Supabase auth (magic link / Google OAuth)
- Trip CRUD persisted to Postgres
- Share trips via URL

#### Stage 6 — Export
- PDF export via jsPDF + html2canvas
- Map screenshot capture
- Day-by-day printable itinerary

### Mapbox Free Tier

- ~200k map tile requests/month on free plan
- Personal use stays well within limits
- Requires account + credit card (no charge until limit exceeded)

### Environment Variables Needed
```
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

*Design document is a living document — update as features are confirmed or revised.*
