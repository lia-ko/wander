# Wander

A map-first trip planner built with Next.js, React, and Leaflet. Plan multi-day itineraries visually — drag stops, discover places, track your budget, and export everything.

## Features

### Map & Itinerary
- **Interactive map** with day-colored pins, marker clustering, and click-to-select
- **Multi-day planning** — organize stops across days with labeled chips
- **Drag-and-drop reordering** within a day and across days (drag to day chips)
- **Transport segments** between stops — choose walk/transit/car with travel time and Google Maps links
- **Flight support** — add flights with airline, route, and departure/arrival times
- **Walking radius** — visualize 10/20/30 min walking rings from any hotel or stop
- **Opening hours** — auto-fetched from OpenStreetMap, shown per-day with closed warnings

### Hotels
- Search and pin accommodations on the map
- Store check-in/check-out times, booking notes, wifi passwords

### Place Discovery
- **Eat Out** — find restaurants, cafes, ramen shops, izakayas nearby via Overpass API
- **Grocers** — supermarkets, konbini, bakeries, markets
- **Attractions** — parks, museums, temples, galleries, viewpoints, nightlife
- Tag pills showing cuisine, type, and fee information
- Add results directly to a day or save to wishlist

### Wishlist
- Save places for later without committing to a day
- Drag wishlist items onto day chips to schedule them
- Semi-transparent markers on the map

### Budget Tracking
- Set **home currency** and **spending currency** with live exchange rates (ECB via Frankfurter API)
- Auto-convert foreign expenses to home currency in real time
- Track expenses by category: food, transport, accommodation, activities, shopping, flights, other
- Assign expenses to specific days
- Progress bar with total budget tracking

### Export & Persistence
- **JSON export/import** — save trips to file and load them back across sessions
- **PDF export** — generate a formatted trip summary with map screenshot
- Data persists in localStorage between page loads

### UX
- **Dark mode** with warm tones
- **Resizable sidebar** with collapse toggle
- **Undo** for destructive actions (delete stop, clear day, remove trip) with inline undo bar
- **Toast notifications** for errors and confirmations
- **Keyboard shortcut** — Cmd/Ctrl+Z to undo

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| State | Zustand 5 with persist middleware |
| Map | Leaflet + react-leaflet + react-leaflet-cluster |
| APIs | Nominatim (geocoding), Overpass (POIs), Frankfurter (exchange rates) |
| Export | jsPDF, html2canvas |

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start planning.

No API keys required — all external services used are free and open.

## Project Structure

```
src/
├── app/              # Next.js app router (page, layout, globals)
├── components/
│   ├── map/          # MapView, MapControls
│   ├── panels/       # MainPanel, StopList, DayChips, DiscoverPanel,
│   │                 # BudgetPanel, WishlistPanel, HotelStrip, etc.
│   ├── export/       # PDF generation
│   └── ui/           # GlassPanel, ToastContainer, UndoBar
├── lib/              # geocode, overpass, hours utilities
├── store/            # Zustand stores (trip, toast, undo, rates)
└── types/            # TypeScript type definitions
```

## License

MIT
