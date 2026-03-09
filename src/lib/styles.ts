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

// Borders
export const dashedBorder = (dark: boolean) => dark ? "border-[#F5E8D8]/20" : "border-[#4E8098]/15";
export const dragOverBg = (dark: boolean) => dark ? "bg-[#F5E8D8]/15 border border-dashed border-[#F5E8D8]/30" : "bg-[#4E8098]/10 border border-dashed border-[#4E8098]/30";
