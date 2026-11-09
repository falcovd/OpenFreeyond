// A click is a press and a release without dragging (A-1). Dragging turns the view.
export const DRAG_LIMIT_PX = 4;

export function isClick(down, up, limit = DRAG_LIMIT_PX) {
  if (!down || !up) return false;
  return Math.hypot(up.x - down.x, up.y - down.y) <= limit;
}
