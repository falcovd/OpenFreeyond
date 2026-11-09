import { describe, it, expect } from 'vitest';
import {
  DOOR_SWING_SECONDS,
  CLICK_RANGE,
  createDoor,
  isAtRest,
  isFullyOpen,
  openness,
  doorAngle,
  stepDoor,
  clickDoor,
  inDoorway,
  distanceToDoor,
  hintVisible,
  stepAsideVisible,
} from '../src/logic/door.js';
import { OPENING, SWING_SPACE, HINGE, DOOR } from '../src/world/layout.js';

const run = (door, seconds, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) door = stepDoor(door, dt);
  return door;
};
const swing = (door) => clickDoor(door, { inDoorway: false }).door;

describe('the swing (FR-3, FR-4, FR-9, AC-1.1, AC-1.2, AC-1.6)', () => {
  it('starts closed on every visit and is not stored (FR-6, AC-1.9)', () => {
    expect(createDoor()).toEqual({ phase: 'closed', t: 0 });
  });
  it('lasts between 0.5 and 2 seconds', () => {
    expect(DOOR_SWING_SECONDS).toBeGreaterThanOrEqual(0.5);
    expect(DOOR_SWING_SECONDS).toBeLessThanOrEqual(2);
  });
  it('a click on a closed door swings it, and it ends fully open (AC-1.1)', () => {
    let d = swing(createDoor());
    expect(d.phase).toBe('opening');
    expect(isAtRest(d)).toBe(false);
    d = run(d, DOOR_SWING_SECONDS + 0.1);
    expect(isFullyOpen(d)).toBe(true);
  });
  it('a click on an open door swings it, and it ends fully closed (AC-1.2)', () => {
    const open = run(swing(createDoor()), 2);
    const d = run(swing(open), 2);
    expect(d.phase).toBe('closed');
  });
  it('counts as open only when fully open, so a swinging door blocks (FR-4)', () => {
    const d = swing(createDoor());
    expect(isFullyOpen(run(d, DOOR_SWING_SECONDS * 0.5))).toBe(false);
    const closing = swing(run(d, 2));
    expect(isFullyOpen(closing)).toBe(false);
  });
  it('moves at once: the first step already turns it (NFR-4)', () => {
    const d = stepDoor(swing(createDoor()), 1 / 60);
    expect(openness(d)).toBeGreaterThan(0);
  });
  it('swings outward into the garden (AC-1.10)', () => {
    const angle = doorAngle({ phase: 'open', t: 0 });
    // the door leaf runs from the hinge along local +x; turned by the angle it must point to +z
    const wx = 1.2 * Math.cos(angle);
    const wz = -1.2 * Math.sin(angle);
    expect(wx).toBeCloseTo(0);
    expect(wz).toBeCloseTo(1.2);
    expect(doorAngle(createDoor())).toBeCloseTo(0);
  });
});

describe('clicks (FR-7, FR-9, AC-3.3, AC-3.4, AC-3.6, AC-3.7)', () => {
  it('ignores a click on a door in the doorway, and says step aside (AC-3.3, AC-3.4)', () => {
    const open = run(swing(createDoor()), 2);
    const r = clickDoor(open, { inDoorway: true });
    expect(r.outcome).toBe('step-aside');
    expect(r.door).toBe(open);
    const closed = createDoor();
    expect(clickDoor(closed, { inDoorway: true }).door).toBe(closed);
  });
  it('closes the door on the next click after the person stepped out (AC-3.5)', () => {
    const open = run(swing(createDoor()), 2);
    expect(clickDoor(open, { inDoorway: false }).door.phase).toBe('closing');
  });
  it('ignores any click while it swings, even a double click, and finishes in its direction (AC-3.6, AC-3.7)', () => {
    let d = swing(createDoor());
    for (let i = 0; i < 3; i++) {
      const r = clickDoor(d, { inDoorway: false });
      expect(r.outcome).toBe('ignored');
      d = r.door;
    }
    expect(run(d, 2).phase).toBe('open');
    let c = swing(run(swing(createDoor()), 2));
    c = clickDoor(c, { inDoorway: false }).door;
    expect(run(c, 2).phase).toBe('closed');
  });
});

describe('the doorway (FR-7)', () => {
  const rects = [OPENING, SWING_SPACE];
  it('is hit by a footprint that overlaps the opening or the swing space', () => {
    expect(inDoorway({ x: DOOR.x, z: DOOR.z + 0.5 }, rects)).toBe(true);
    expect(inDoorway({ x: DOOR.x, z: DOOR.z - 0.1 }, rects)).toBe(true);
    expect(inDoorway({ x: DOOR.x, z: SWING_SPACE.maxZ + 0.2 }, rects)).toBe(
      true,
    ); // footprint radius 0.3
  });
  it('is not hit when the person stands clear of both', () => {
    expect(inDoorway({ x: DOOR.x, z: SWING_SPACE.maxZ + 0.5 }, rects)).toBe(
      false,
    );
    expect(inDoorway({ x: DOOR.x, z: OPENING.minZ - 0.5 }, rects)).toBe(false);
    expect(
      inDoorway({ x: SWING_SPACE.maxX + 0.5, z: DOOR.z + 0.5 }, rects),
    ).toBe(false);
  });
});

describe('the distance to the nearest point of the door (FR-1, FR-2, AC-1.3)', () => {
  const door = { hinge: HINGE, w: DOOR.w, h: DOOR.h, t: 0.05 };
  it('measures to the door leaf, not to its hinge', () => {
    const p = { x: HINGE.x + 0.6, y: 1.6, z: HINGE.z + 2 };
    expect(distanceToDoor(p, door, 0)).toBeCloseTo(2 - 0.025, 2);
  });
  it('follows the leaf as it swings open', () => {
    const p = { x: HINGE.x + 0.6, y: 1.6, z: HINGE.z + 2 };
    expect(distanceToDoor(p, door, -Math.PI / 2)).toBeLessThan(
      distanceToDoor(p, door, 0),
    );
  });
  it('is more than the click range from a person 4 m away', () => {
    expect(
      distanceToDoor({ x: HINGE.x + 0.6, y: 1.6, z: HINGE.z + 4 }, door, 0),
    ).toBeGreaterThan(CLICK_RANGE);
  });
  it('works from inside the house (FR-5, AC-1.5)', () => {
    expect(
      distanceToDoor({ x: HINGE.x + 0.6, y: 1.6, z: HINGE.z - 2 }, door, 0),
    ).toBeLessThanOrEqual(CLICK_RANGE);
  });
});

describe('the hint and the step-aside message (FR-8, AC-3.1, AC-3.2)', () => {
  const ok = {
    door: createDoor(),
    distance: 2,
    inView: true,
    inDoorway: false,
  };
  it('shows the hint when the door is at rest, near, in view and nobody is in the doorway', () => {
    expect(hintVisible(ok)).toBe(true);
    expect(hintVisible({ ...ok, door: run(swing(createDoor()), 2) })).toBe(
      true,
    );
  });
  it('hides it as soon as one of those stops being true', () => {
    expect(hintVisible({ ...ok, distance: CLICK_RANGE + 0.01 })).toBe(false);
    expect(hintVisible({ ...ok, inView: false })).toBe(false);
    expect(hintVisible({ ...ok, inDoorway: true })).toBe(false);
    expect(hintVisible({ ...ok, door: swing(createDoor()) })).toBe(false);
  });
  it('shows the step-aside message while it was asked for and the person is still in the way (AC-3.5)', () => {
    expect(stepAsideVisible({ requested: true, inDoorway: true })).toBe(true);
    expect(stepAsideVisible({ requested: true, inDoorway: false })).toBe(false);
    expect(stepAsideVisible({ requested: false, inDoorway: true })).toBe(false);
  });
});
