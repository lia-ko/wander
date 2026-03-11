export const STOP_DRAG_TYPE = "application/wander-stop";
export const WISHLIST_DRAG_TYPE = "application/wander-wishlist";

export type DragHandlers = {
  onDragStart: (e: React.DragEvent, i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (i: number) => void;
};

// ── Drag data shapes ──

export type StopDragData = {
  pinId: number;
  fromDayId: number;
  fromOrigIdx?: number;
};

export type WishlistDragData = {
  pinId: number;
};

/** Safely parse JSON from dataTransfer for a given drag type. Returns null on invalid data. */
export function parseDragData<T>(e: React.DragEvent, type: string): T | null {
  const raw = e.dataTransfer.getData(type);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Check if a drag event contains the given type. */
export function hasDragType(e: React.DragEvent, ...types: string[]): boolean {
  return types.some((t) => e.dataTransfer.types.includes(t));
}
