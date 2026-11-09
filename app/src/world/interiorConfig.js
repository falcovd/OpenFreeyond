// FR-22: the builder decides this before the interior goes online, from the frame-rate measurement.
// 'clip' plays the TV clip. 'still' shows one still picture and does not load the clip.
// Nothing switches at run time. Change it only after a measurement (see the checklist).
export const TV_MODE = 'clip';

// How bright the surfaces inside the house are, against the colours they were made with. The place
// has one global ambient light that suits the garden; inside, the same light made every surface
// blow out. Dimming the interior colours (not the light) keeps the garden as it is, and leaves the
// warm lights in the rooms to make the glow. Nothing changes at run time.
export const INTERIOR_DIM = 0.5;

// The ceiling is white and should read as white, so it is dimmed much less than the walls.
export const CEILING_DIM = 0.65;
