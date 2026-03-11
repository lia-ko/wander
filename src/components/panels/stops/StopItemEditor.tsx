"use client";

import { useState } from "react";
import { useTripStore } from "@/store/tripStore";
import { sectionBg, formInput, saveBtn, cancelBtn } from "@/lib/styles";

export default function StopItemEditor({ pin, dayId, dark, onClose }: {
  pin: { id: number; name: string; note: string | null };
  dayId: number;
  dark: boolean;
  onClose: () => void;
}) {
  const [editName, setEditName] = useState(pin.name);
  const [editNote, setEditNote] = useState(pin.note || "");
  const updatePin = useTripStore((s) => s.updatePin);

  const handleSave = () => {
    if (editName.trim()) {
      updatePin(dayId, pin.id, { name: editName.trim(), note: editNote.trim() || null });
    }
    onClose();
  };

  return (
    <div className={`px-3 py-2 rounded-xl mx-2 ${sectionBg(dark)}`}>
      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
        autoFocus
        aria-label="Stop name"
        className={`${formInput(dark)} mb-1.5`}
        placeholder="Stop name"
      />
      <input
        type="text"
        value={editNote}
        onChange={(e) => setEditNote(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
        aria-label="Stop note"
        className={`${formInput(dark)} mb-2`}
        placeholder="Note (optional)"
      />
      <div className="flex gap-1.5">
        <button onClick={handleSave} className={saveBtn}>Save</button>
        <button onClick={onClose} className={cancelBtn(dark)}>Cancel</button>
      </div>
    </div>
  );
}
