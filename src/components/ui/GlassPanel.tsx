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
    ? "bg-zinc-900/70 border-white/10 text-white"
    : "bg-white/70 border-black/5 text-zinc-900";
  return (
    <div className={`rounded-2xl border backdrop-blur-xl shadow-lg ${base} ${className}`} style={style}>
      {children}
    </div>
  );
}
