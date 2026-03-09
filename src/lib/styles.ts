/** Reusable dark/light theme class helpers to avoid duplication across components. */

// Text
export const textMuted = (dark: boolean) => dark ? "text-zinc-400" : "text-zinc-500";
export const textSubtle = (dark: boolean) => dark ? "text-zinc-500" : "text-zinc-400";

// Backgrounds
export const sectionBg = (dark: boolean) => dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8";
export const hoverBg = (dark: boolean) => dark ? "hover:bg-[#F5E8D8]/10" : "hover:bg-[#4E8098]/8";
export const softHoverBg = (dark: boolean) => dark ? "hover:bg-[#F5E8D8]/6" : "hover:bg-[#F0D5A8]/25";

// Buttons
export const ghostBtn = (dark: boolean) => dark ? "text-zinc-400 hover:bg-[#F5E8D8]/10" : "text-zinc-500 hover:bg-[#4E8098]/8";
export const btnHover = (dark: boolean) => dark ? "bg-[#F5E8D8]/10 hover:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 hover:bg-[#4E8098]/12";
export const accentActive = (dark: boolean) => dark ? "bg-[#DAA520]/20 text-[#DAA520]" : "bg-[#4E8098]/15 text-[#4E8098]";
export const deleteBtn = (dark: boolean) => dark ? "text-zinc-500 hover:text-red-400 hover:bg-[#F5E8D8]/10" : "text-zinc-400 hover:text-red-500 hover:bg-[#4E8098]/8";

// Inputs
export const inputBase = (dark: boolean) => dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] placeholder:text-zinc-500" : "bg-white text-zinc-900 placeholder:text-zinc-400";
export const inputFocus = (dark: boolean) => dark ? "bg-[#F5E8D8]/10 placeholder:text-zinc-500 focus:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 placeholder:text-zinc-400 focus:bg-black/[.08]";

export const textStrong = (dark: boolean) => dark ? "text-zinc-200" : "text-zinc-700";
export const ghostBtnSoft = (dark: boolean) => dark ? "text-zinc-400 hover:bg-[#F5E8D8]/6" : "text-zinc-400 hover:bg-[#F0D5A8]/25";
export const inactiveBtn = (dark: boolean) => dark ? "bg-[#F5E8D8]/6 text-zinc-300 hover:bg-[#F5E8D8]/10" : "bg-[#F0D5A8]/20 text-zinc-600 hover:bg-[#F0D5A8]/35";

// Borders
export const dashedBorder = (dark: boolean) => dark ? "border-[#F5E8D8]/20" : "border-[#4E8098]/15";
export const dragOverBg = (dark: boolean) => dark ? "bg-[#F5E8D8]/15 border border-dashed border-[#F5E8D8]/30" : "bg-[#4E8098]/10 border border-dashed border-[#4E8098]/30";

// Form controls (shared across BudgetPanel, StopItem edit, FlightItem edit, HotelItem, etc.)
export const formInput = (dark: boolean) => `w-full px-2 py-1.5 rounded-lg text-xs outline-none ${inputBase(dark)}`;
export const formInputBordered = (dark: boolean) =>
  `w-full px-2.5 py-1.5 rounded-lg text-xs outline-none ${dark ? "bg-white/5 text-zinc-200 border border-white/10 focus:border-[#DAA520]/40" : "bg-white border border-zinc-200 text-zinc-800 focus:border-[#4E8098]/40"}`;
export const formSelect = (dark: boolean) =>
  `text-xs rounded-lg px-2 py-1 outline-none ${dark ? "bg-white/5 text-zinc-300 border border-white/10" : "bg-white border border-zinc-200 text-zinc-700"}`;
export const saveBtn = "flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#4E8098] hover:bg-[#3D6B80] transition-colors";
export const cancelBtn = (dark: boolean) => `flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dark ? "bg-[#F5E8D8]/10 hover:bg-[#F5E8D8]/15" : "bg-zinc-200 hover:bg-zinc-300"}`;
export const wishlistBtn = (dark: boolean) => dark ? "bg-[#DAA520]/10 text-[#DAA520] hover:bg-[#DAA520]/20" : "bg-[#4E8098]/8 text-[#4E8098] hover:bg-[#4E8098]/15";
export const removeBtn = "text-red-500 bg-red-500/10 hover:bg-red-500/20";

// Geo comparison (~11 meters threshold)
export const GEO_EPSILON = 0.0001;
export const isSameLocation = (lat1: number, lng1: number, lat2: number, lng2: number) =>
  Math.abs(lat1 - lat2) < GEO_EPSILON && Math.abs(lng1 - lng2) < GEO_EPSILON;
