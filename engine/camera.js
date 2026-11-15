// Camera helper: position, look-at, zoom/fov, roll, moves over time with easing, handheld sway.
import * as THREE from 'three';

export const Ease = {
  linear: u => u,
  in: u => u * u * u,
  out: u => 1 - Math.pow(1 - u, 3),
  inOut: u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  expoOut: u => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  snap: u => 1 - Math.pow(1 - Math.min(1, u * 2.2), 4), // quick zoom
  slow: u => u * 0.85 + 0.15 * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
};

const lerp = (a, b, e) => a + (b - a) * e;
const lerp3 = (a, b, e) => [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)];

/**
 * A camera spec (used in shots.js):
 *  { from: {pos:[x,y,z], look:[x,y,z], fov:40, zoom:1, roll:0}, to: {...}, ease:'inOut', sway:0.5 }
 *  - pos/look are in the shot's set-local coordinates
 *  - fov in degrees (vertical); zoom multiplies (fov / zoom)
 *  - sway: handheld amplitude in degrees (0 = locked off)
 *  A spec may also be a function (t, u, w) => spec, for tracking shots.
 */
export function evalCamera(spec, t, u, w) {
  if (typeof spec === 'function') spec = spec(t, u, w);
  const from = spec.from || spec, to = spec.to || from;
  const e = (Ease[spec.ease || 'inOut'] || Ease.inOut)(Math.min(1, Math.max(0, u)));
  const fovA = (from.fov ?? 40) / (from.zoom ?? 1), fovB = (to.fov ?? from.fov ?? 40) / (to.zoom ?? from.zoom ?? 1);
  return {
    pos: lerp3(from.pos, to.pos, e),
    look: lerp3(from.look, to.look ?? from.look, e),
    fov: lerp(fovA, fovB, e),
    roll: lerp(from.roll || 0, to.roll ?? from.roll ?? 0, e),
    sway: spec.sway ?? 0.5, noDof: !!spec.noDof,
  };
}

const tmp = new THREE.Vector3();
export function applyCamera(camera, c, globalT, setGroup) {
  setGroup.updateMatrixWorld();
  camera.position.copy(setGroup.localToWorld(tmp.set(...c.pos)));
  camera.up.set(0, 1, 0);
  camera.lookAt(setGroup.localToWorld(new THREE.Vector3(...c.look)));
  camera.fov = c.fov; camera.updateProjectionMatrix();
  const d2r = Math.PI / 180, s = c.sway * d2r, T = globalT;
  // layered sines = deterministic handheld wobble
  const yaw = s * (0.6 * Math.sin(T * 1.13) + 0.3 * Math.sin(T * 2.71 + 1.3) + 0.1 * Math.sin(T * 6.1));
  const pitch = s * (0.5 * Math.sin(T * 0.97 + 0.4) + 0.35 * Math.sin(T * 2.33 + 2.1) + 0.15 * Math.sin(T * 5.3));
  const roll = c.roll * d2r + s * 0.4 * Math.sin(T * 0.71 + 0.8);
  camera.rotateY(yaw); camera.rotateX(pitch); camera.rotateZ(roll);
}
