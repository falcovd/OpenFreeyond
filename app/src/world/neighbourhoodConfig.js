// Build-time switches for the frame-rate rule (FR-13). Nothing changes at run time.
// If the 2-minute walk misses 30 fps, take the steps one after the other and measure again after each:
// step 1: NEIGHBOUR_GARDENS and NEIGHBOUR_CARS to 'off'; step 2: NEIGHBOUR_SHADOWS to 'off';
// step 3: FAR_PLOT_COUNT to 3. Write each step in the checklist (AC-6.2).
export const NEIGHBOUR_GARDENS = 'on';
export const NEIGHBOUR_CARS = 'on';
export const NEIGHBOUR_SHADOWS = 'on';
export const FAR_PLOT_COUNT = 5;
