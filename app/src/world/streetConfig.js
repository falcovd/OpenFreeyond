// Build-time switches for the frame-rate rule (FR-17). Nothing changes at run time.
// If the 2-minute walk misses 30 fps: lower STREET_CARS and STREET_LAMPS first (never below 1),
// then set STREET_SHADOWS to 'off'. Write the decision in the checklist (AC-6.2).
export const STREET_CARS = 3;
export const STREET_LAMPS = 3;
export const STREET_SHADOWS = 'on';
