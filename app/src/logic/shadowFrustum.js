// The orthographic shadow box of the sun light. The light looks at the origin and the sky group
// turns about the y axis through the origin, so a sphere around the origin that holds the whole
// place holds it for every azimuth and every sun height. No A-Frame, no DOM.
export function shadowFrustum({ bounds, maxHeight, distance }) {
  const radius =
    Math.hypot(
      Math.max(Math.abs(bounds.minX), Math.abs(bounds.maxX)),
      Math.max(Math.abs(bounds.minZ), Math.abs(bounds.maxZ)),
      maxHeight,
    ) * 1.02;
  return {
    left: -radius,
    right: radius,
    top: radius,
    bottom: -radius,
    near: Math.max(1, distance - radius),
    far: distance + radius,
  };
}
