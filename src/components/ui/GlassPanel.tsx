"use client";

import { ReactNode, CSSProperties } from "react";
import { useTripStore } from "@/store/tripStore";

export default function GlassPanel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const dark = useTripStore((s) => s.darkMode);
  const base = dark
    ? "bg-[#1C1C1C]/85 border-[#F5E8D8]/10 text-[#F5E8D8]"
    : "bg-[#FDFBF7]/80 border-[#4E8098]/10 text-zinc-800";
  return (
    <div className={`rounded-2xl border backdrop-blur-xl shadow-lg ${base} ${className}`} style={style}>
      {children}
    </div>
  );
}
