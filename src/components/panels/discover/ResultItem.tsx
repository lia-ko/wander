import { useTripStore } from "@/store/tripStore";
import { getHoursForDate } from "@/lib/hours";
import type { OverpassResult } from "@/lib/overpass";
import type { DiscoverTab } from "@/types";
import { getTagPills, formatDist } from "./helpers";

function TagPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {label}
    </span>
  );
}

export default function ResultItem({ result, tab, added, wishlisted, onAdd, onWishlist, dayDate }: {
  result: OverpassResult;
  tab: DiscoverTab;
  added: boolean;
  wishlisted: boolean;
  onAdd: () => void;
  onWishlist: () => void;
  dayDate: Date | null;
}) {
  const dark = useTripStore((s) => s.darkMode);

  const pills = getTagPills(result, tab);
  const address = result.address || "";
  const dist = result.dist ?? 0;

  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${dark ? "hover:bg-[#F5E8D8]/6" : "hover:bg-[#F0D5A8]/25"}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{result.name}</div>
        {address && (
          <div className={`text-xs truncate mt-0.5 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{address}</div>
        )}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {pills.map((pill, i) => (
            <TagPill key={i} label={pill.label} color={pill.color} />
          ))}
          <span className={`text-[10px] ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
            {formatDist(dist)}
          </span>
        </div>
        {result.tags.opening_hours && (() => {
          const parsed = dayDate ? getHoursForDate(result.tags.opening_hours, dayDate) : result.tags.opening_hours;
          const isClosed = parsed?.toLowerCase().includes("closed");
          return (
            <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isClosed ? "text-red-400" : dark ? "text-zinc-500" : "text-zinc-400"}`}>
              <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">{parsed}</span>
            </div>
          );
        })()}
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0 mt-1">
        <button
          onClick={onAdd}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
            added
              ? "bg-[#90CCB8]/25 text-[#4E8098]"
              : dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] hover:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 text-zinc-700 hover:bg-[#4E8098]/12"
          }`}
          title="Add to day"
        >
          {added ? "\u2713" : "+"}
        </button>
        <button
          onClick={onWishlist}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            wishlisted
              ? dark ? "bg-[#DAA520]/20 text-[#DAA520]" : "bg-[#4E8098]/15 text-[#4E8098]"
              : dark ? "bg-[#F5E8D8]/10 text-zinc-500 hover:text-[#DAA520] hover:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 text-zinc-400 hover:text-[#4E8098] hover:bg-[#4E8098]/12"
          }`}
          title="Save to wishlist"
        >
          <svg className="w-3.5 h-3.5" fill={wishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
