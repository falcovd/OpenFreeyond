// The orthographic shadow box of the sun light: a sphere of `radius` metres around the light's target,
// seen from `distance` metres away. The box follows the person (shadowFollow.js), and a sphere holds
// its contents for every sun direction. No A-Frame, no DOM.
export function shadowFrustum({ radius, distance }) {
  return {
    left: -radius,
    right: radius,
    top: radius,
    bottom: -radius,
    near: distance - radius,
    far: distance + radius,
  };
}
