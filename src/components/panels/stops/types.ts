export const STOP_DRAG_TYPE = "application/wander-stop";
export const WISHLIST_DRAG_TYPE = "application/wander-wishlist";

export type DragHandlers = {
  onDragStart: (e: React.DragEvent, i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (i: number) => void;
};
