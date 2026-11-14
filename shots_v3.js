// FLOAT HOUR (v3): shot list. Same format as shots.js (see README). Sets: 'square', 'gears', 'bedroom'.
// SQUARE coords: plaza 46x46 at origin; clock tower at (0,0,-14) (face centre (0,19.5,-10.08), key at (6.85,19.5,-14),
// winding ledge top y=17.4 at x 3.9..6.5, clock-door balcony at (-4.6,16.1,-14)); digital board (0,6,-10.44);
// fountain (0,0.12,7); siren (14,0,-6); south rail z=22 (x ±5..21); side rails x=±22; road south x -4.5..4.5 from z=23;
// cars at x ±2.2, z 38..75; bus (2.2,0,92); shops at x ±29; hotel billboard (24,~14,6).
export const v3 = true;
const PI = Math.PI;
const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const out3 = u => 1 - Math.pow(1 - clamp01(u), 3);
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const RAIL_Y = 1.17;

// ---------- helpers ----------
const crowdSpots = () => { const s = []; for (const side of [-1, 1]) for (let i = 0; i < 10; i++) s.push([side * (6.2 + i * 1.45), 0.12, 21.25]); return s; };
function crowd(W, t, { lift = 0, hold = 1, faces = 'smile', count = 20, liftScale = 1 } = {}) {
  const spots = crowdSpots();
  W.crowd.forEach((c, i) => {
    if (i >= count) return;
    const [x, y, z] = spots[i];
    const L = lift * (0.35 + hash(i) * 0.9) * liftScale;
    W.put(c, [x + Math.sin(t * 0.7 + i) * 0.1 * lift, y + L + (lift ? 0.08 * Math.sin(t * 2 + i) : 0), z - (hold ? 0 : 0)], 0);
    c.setFace(faces === 'mix' ? (i % 3 === 0 ? 'scared' : i % 3 === 1 ? 'worried' : 'shout') : faces);
    if (hold > 0 && L < 0.6) {
      c.setPose({ waist: [0.05, 0, 0], hipL: [-0.2 * lift, 0, 0], hipR: [0.2 * lift, 0, 0] });
      W.reach(c, 'L', [x + 0.25, RAIL_Y, 22]); W.reach(c, 'R', [x - 0.25, RAIL_Y, 22]);
    } else c.setPose(flail(t, i));
  });
}
const flail = (t, s = 0) => ({ shoulderL: [0, 0, 2.3 + 0.35 * Math.sin(t * 6 + s)], shoulderR: [0, 0, -2.3 - 0.35 * Math.sin(t * 6 + s + 1)], elbowL: [-0.3, 0, 0], elbowR: [-0.3, 0, 0],
  hipL: [-0.35 * Math.sin(t * 5 + s), 0, 0.1], hipR: [0.35 * Math.sin(t * 5 + s), 0, -0.1], kneeL: [0.4, 0, 0], kneeR: [0.4, 0, 0] });
const happyFloat = (t, s = 0) => ({ shoulderL: [0, 0, 1.4 + 0.2 * Math.sin(t * 3 + s)], shoulderR: [0, 0, -1.4 - 0.2 * Math.sin(t * 3 + s)], hipL: [-0.3, 0, 0.15], hipR: [0.1, 0, -0.15], kneeL: [0.6, 0, 0], kneeR: [0.2, 0, 0] });
function floatThings(W, t, lift, { cars = true, bus = true, boxes = true, houses = 0 } = {}) {
  if (cars) W.cars.forEach((c, i) => { const L = lift * (0.6 + hash(i + 7) * 0.8); c.obj.position.set(c.base[0], c.base[1] + L, c.base[2]); c.obj.rotation.set(L * 0.05 * Math.sin(i + t * 0.5), c.rot + L * 0.03, L * 0.04 * Math.cos(i)); });
  if (bus) { const L = lift * 0.8; W.bus.obj.position.set(W.bus.base[0], W.bus.base[1] + L, W.bus.base[2]); W.bus.obj.rotation.set(0.02 * L, W.bus.rot, 0.03 * L * Math.sin(t)); }
  if (boxes) W.mailboxes3.forEach((m, i) => { const L = lift * (0.8 + hash(i) * 0.6); m.obj.position.set(m.base[0], m.base[1] + L, m.base[2]); m.obj.rotation.set(L * 0.2, L * 0.3 * i, 0); });
  if (houses) W.houses3.forEach((h, i) => { const L = houses * (0.3 + hash(i + 3) * 0.7); h.group.position.y = L; h.group.rotation.z = L * 0.01 * Math.sin(i); });
}
const tower = (W, h, m, digital, col) => { W.tower.setTime(h, m); if (digital) W.tower.setDigital(digital, col); };
const GRAV = (v, col = '#ff4d5e', extra = {}) => ({ type: 'counter', label: 'GRAVITY', value: v, color: col, border: col === '#38e07b' ? '#38e07b' : '#ff3b4e', ...extra });
const holdKey = (W, who, side = 'R') => { const k = W.props.keyProp.group || W.props.keyProp; W.hold(who, k, 'wrist' + side, [0, -0.2, 0.05], [0, PI / 2, PI / 2]); };
const tag = (text, char, color = '#ffd23a', from = 0.12) => ({ type: 'tag', text, char, color, from });

const blobs = (W, t, u) => {
  if (!W.__blobs) { W.__blobs = []; const T = W.THREE; for (let i = 0; i < 9; i++) { const m = new T.Mesh(new T.SphereGeometry(0.5 + (i % 3) * 0.25, 20, 14), new T.MeshStandardMaterial({ color: '#7fd3ff', transparent: true, opacity: 0.75, roughness: 0.05, metalness: 0.1, emissive: '#2a8fd8', emissiveIntensity: 0.3 })); W.__blobs.push(m); } }
  W.__blobs.forEach((m, i) => { W.activeSet.add(m); m.visible = true; const a = i * 2.4; m.position.set(Math.cos(a) * (1 + i * 0.25), 1.2 + (u * 6 + i * 0.7) + 0.2 * Math.sin(t * 2 + i), 7 + Math.sin(a) * (1 + i * 0.25)); m.scale.set(1 + 0.1 * Math.sin(t * 5 + i), 1 - 0.1 * Math.sin(t * 5 + i), 1); });
};

export const shots = [
  // ================= ACT 1: THE RULE =================
  // 1
  { vo: 'This town loses gravity for one minute every day.', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'whoosh', at: 0 }],
    update(W, t) { crowd(W, t, { lift: 5, hold: 0, faces: 'laugh' }); floatThings(W, t, 4); W.put(W.chars.dog, [-4, 3.5 + 0.3 * Math.sin(t * 2), 12], 0.4); W.chars.dog.setPose({ t, walk: 1, wag: 1 }); tower(W, 12, 0, '12:00:20'); },
    cam: { from: { pos: [44, 34, 70], look: [0, 6, 6], fov: 42 }, to: { pos: [34, 26, 55], look: [0, 6, 6], fov: 42 }, sway: 0.25 } },
  // 2
  { vo: 'At exactly twelve o\'clock.', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'tick', at: 'u0.5' }],
    update(W, t, u) { tower(W, 11, u < 0.5 ? 59 : 60, u < 0.5 ? '11:59:59' : '12:00:00'); },
    cam: { from: { pos: [0, 15.5, 6], look: [0, 19.5, -10], fov: 40 }, to: { pos: [0, 16.2, 3.5], look: [0, 19.5, -10], fov: 40 }, sway: 0.3 } },
  // 3
  { vo: 'A siren goes off,', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'siren', at: 0, dur: 1.6 }],
    update(W, t) { W.siren.light.visible = Math.sin(t * 20) > 0; tower(W, 12, 0, '12:00:00'); },
    cam: { from: { pos: [10.5, 1.0, -1.5], look: [14, 8.4, -6], fov: 44 }, to: { pos: [11, 1.1, -2.2], look: [14, 8.5, -6], fov: 42 }, sway: 0.8 } },
  // 4
  { vo: 'and everyone grabs the nearest railing.', set: 'square', light: 'bright', music: 'day',
    update(W, t, u) { crowd(W, t, { hold: 1, faces: 'worried' }); },
    cam: { from: { pos: [-6.5, 1.8, 27.2], look: [-11, 1.3, 19], fov: 50 }, to: { pos: [-7.0, 1.75, 26.5], look: [-11, 1.3, 19], fov: 48 }, sway: 0.6 } },
  // 5
  { vo: "Because if you don't... you float.", set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'pop', at: 'u0.5' }],
    setup(W) { W.put(W.chars.mayor, [-100, 0, 0]); W.chars.mayor.group.visible = false; },
    update(W, t, u) {
      const c = W.crowd[0]; const L = 2.8 * out3((u - 0.35) / 0.65); W.put(c, [3, 0.12 + L, 14], PI * 0.9); c.setFace(u > 0.4 ? 'scared' : 'smile'); c.setPose(u > 0.4 ? flail(t) : W.Poses.idle(t)); c.group.rotation.z = L * 0.15;
    },
    cam: { from: { pos: [1.2, 0.7, 18.5], look: [3, 2.2, 14], fov: 46 }, to: { pos: [1.3, 0.75, 18.2], look: [3, 3.4, 14], fov: 48 }, sway: 0.5 } },
  // 6
  { vo: 'Cars float.', set: 'square', light: 'bright', music: 'day',
    update(W, t, u) { floatThings(W, t, 2.4 * out3(u * 1.4), { bus: false, boxes: false }); },
    cam: { from: { pos: [-7.5, 1.0, 51], look: [-2.2, 1.8, 46], fov: 46 }, to: { pos: [-7.3, 1.0, 50.5], look: [-2.2, 2.6, 46], fov: 46 }, sway: 0.5 } },
  // 7
  { vo: 'Dogs float.', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'pop', at: 0.1 }],
    update(W, t, u) { const d = W.chars.dog; W.put(d, [-4, 0.12 + 1.6 * out3(u * 1.3) + 0.1 * Math.sin(t * 3), 10], 0.5 + 0.3 * t); d.setPose({ t, walk: 1, wag: 1, headTilt: 0.3 }); d.group.rotation.z = 0.25 * Math.sin(t * 2); },
    hud: [tag('Biscuit', 'dog', '#ff9b4a')],
    cam: { from: { pos: [-2.0, 1.4, 13.5], look: [-4, 1.4, 10], fov: 44 }, to: { pos: [-2.2, 1.6, 13.2], look: [-4, 1.9, 10], fov: 44 }, sway: 0.5 } },
  // 8
  { vo: "Even the mayor's toupee floats.", set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'pop', at: 'u0.45' }],
    setup(W) { W.put(W.chars.mayor, [-21.1, 0.12, 2], -PI / 2); W.chars.mayor.setFace('worried'); },
    hud: [tag('Mayor Grimsby', 'mayor', '#c9a0ff', 0.05)],
    update(W, t, u) {
      const m = W.chars.mayor; m.setPose({}); W.reach(m, 'L', [-22, RAIL_Y, 1.6]); W.reach(m, 'R', [-22, RAIL_Y, 2.4]);
      const tp = m.parts.toupee; const k = out3((u - 0.4) / 0.6); tp.position.y = W.props.toupeeHome.pos.y + 0.9 * k; tp.rotation.set(0.4 * k, t * 1.5 * k, 0.3 * k);
      if (u > 0.5) m.setFace('scared');
    },
    cam: { from: { pos: [-24.4, 2.0, 2.3], look: [-21.1, 2.25, 2], fov: 40 }, to: { pos: [-24.0, 2.05, 2.25], look: [-21.1, 2.45, 2], fov: 40 }, sway: 0.4 } },
  // 9
  { vo: 'Sixty seconds later, everything drops.', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'boom', at: 'u0.45' }, { type: 'thuds', at: 'u0.5' }],
    update(W, t, u) {
      const drop = u < 0.42 ? 1 : Math.max(0, 1 - out3((u - 0.42) / 0.14)) + (u > 0.56 ? 0.15 * Math.abs(Math.sin((u - 0.56) * 20)) * Math.max(0, 1 - (u - 0.56) * 4) : 0);
      crowd(W, t, { lift: 4 * drop, hold: drop < 0.2 ? 1 : 0, faces: drop > 0.2 ? 'laugh' : 'smile' }); floatThings(W, t, 3 * drop); tower(W, 12, u < 0.42 ? 0 : 1, u < 0.42 ? '12:00:59' : '12:01:00');
    },
    cam: { from: { pos: [-2, 9, 40], look: [-11, 3, 20], fov: 46 }, to: { pos: [-2.5, 8.5, 38.5], look: [-11, 2.5, 20], fov: 46 }, sway: 0.5 } },
  // 10
  { vo: "We call it Float Hour. Even though it's a minute.", set: 'square', light: 'bright', music: 'day',
    update(W, t) { crowd(W, t, { hold: 0, faces: 'smile', count: 8 }); },
    cam: { from: { pos: [0, 4.2, -6], look: [0, 7.6, 21], fov: 44 }, to: { pos: [0, 4.4, -4.5], look: [0, 7.7, 21], fov: 43 }, sway: 0.4 } },

  // ================= ACT 2: THE FAMILY =================
  // 11
  { vo: "I'm Leo.", set: 'square', light: 'bright', music: 'day',
    setup(W) { W.put(W.chars.ivy, [-3, 0.12, 14], 0.15); W.chars.ivy.setFace('smile'); },
    hud: [tag('Leo, 12', 'ivy', '#c9a0ff', 0.05)],
    update(W, t) { W.chars.ivy.setPose({ ...W.Poses.idle(t), shoulderR: [0, 0, -2.6 - 0.3 * Math.sin(t * 10)], elbowR: [0, 0, -0.3 * Math.sin(t * 10 + 1)] }); },
    cam: { from: { pos: [-2.6, 1.6, 16.8], look: [-3, 1.5, 14], fov: 42 }, to: { pos: [-2.7, 1.6, 16.5], look: [-3, 1.52, 14], fov: 41 }, sway: 0.6 } },
  // 12
  { vo: 'This is my little brother, Bo.', set: 'square', light: 'bright', music: 'day',
    setup(W) { const b = W.chars.bo; W.put(b, [-1.6, 0.12, 14.4], -0.2); b.setFace('laugh'); W.hold(b, W.props.balloon, 'wristR', [0, -0.12, 0]); },
    hud: [tag('Bo, 6', 'bo', '#ffd23a', 0.05)],
    update(W, t) { const b = W.chars.bo; b.setPose({ ...W.Poses.idle(t), shoulderR: [-0.4, 0, -0.5], hipsY: Math.abs(Math.sin(t * 7)) * 0.05 }); W.keepUpright(W.props.balloon); },
    cam: { from: { pos: [-1.5, 1.25, 16.6], look: [-1.6, 1.15, 14.4], fov: 44 }, to: { pos: [-1.5, 1.25, 16.3], look: [-1.6, 1.2, 14.4], fov: 43 }, sway: 0.6 } },
  // 13
  { vo: 'Bo has never held a railing in his life.', set: 'square', light: 'bright', music: 'day',
    setup(W) { const b = W.chars.bo; b.setFace('smirk'); W.hold(b, W.props.balloon, 'wristR', [0, -0.12, 0]); },
    update(W, t) {
      crowd(W, t, { hold: 1, lift: 0.3, faces: 'worried' });
      const b = W.chars.bo; W.put(b, [0.5, 0.12 + 1.8 + 0.15 * Math.sin(t * 2), 17.5], PI - 0.3); b.setPose(happyFloat(t)); b.group.rotation.z = 0.15 * Math.sin(t * 1.5); W.keepUpright(W.props.balloon);
    },
    cam: { from: { pos: [1.5, 1.2, 12.5], look: [0.5, 2.6, 18], fov: 48 }, to: { pos: [1.4, 1.2, 13.0], look: [0.5, 2.7, 18], fov: 47 }, sway: 0.6 } },
  // 14
  { vo: 'He says floating is the best part of the day.', set: 'square', light: 'bright', music: 'day',
    setup(W) { const b = W.chars.bo; b.setFace('laugh'); W.hold(b, W.props.balloon, 'wristR', [0, -0.12, 0]); },
    update(W, t, u) { const b = W.chars.bo; W.put(b, [0.5, 0.12 + 2.2 + 0.2 * Math.sin(t * 2), 15], 0); b.group.rotation.x = -u * PI * 2; b.setPose(happyFloat(t, 1)); W.keepUpright(W.props.balloon); },
    cam: { from: { pos: [0.3, 2.5, 19.6], look: [0.5, 2.6, 15], fov: 46 }, to: { pos: [0.3, 2.6, 19.2], look: [0.5, 2.7, 15], fov: 45 }, sway: 0.6 } },
  // 15
  { vo: 'Our grandpa Gus winds the giant town clock every morning.', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'ratchet', at: 0.2, n: 4, every: 0.6 }],
    setup(W) { const g = W.chars.gus; W.put(g, [4.95, 17.4, -14], PI / 2); g.setFace('smile'); },
    hud: [tag('Grandpa Gus', 'gus', '#7fe0b0', 0.1)],
    update(W, t) { const g = W.chars.gus; g.setPose({ waist: [0.1, 0, 0] }); const a = t * 2.4; W.tower.key.rotation.x = a; const p = [6.85, 19.5 + Math.cos(a) * 0.5 * 1.5 * 0.5, -14 + Math.sin(a) * 0.4]; W.reach(g, 'L', p); W.reach(g, 'R', [p[0], p[1] - 0.1, p[2] + 0.15]); },
    cam: { from: { pos: [14, 17.0, -2.5], look: [5.4, 18.5, -14], fov: 44 }, to: { pos: [13.4, 17.2, -3.2], look: [5.4, 18.6, -14], fov: 43 }, sway: 0.5 } },
  // 16
  { vo: 'He told us one rule.', set: 'square', light: 'bright', music: 'tense',
    setup(W) { const g = W.chars.gus; W.put(g, [2, 0.12, -6], 0); g.setFace('serious'); },
    update(W, t) { W.chars.gus.setPose({ ...W.Poses.idle(t), shoulderR: [-2.6, 0, 0.1], elbowR: [-0.3, 0, 0] }); },
    cam: { from: { pos: [2.1, 1.6, -3.0], look: [2, 2.0, -6], fov: 42 }, to: { pos: [2.1, 1.65, -3.3], look: [2, 2.05, -6], fov: 41 }, sway: 0.4 } },
  // 17
  { vo: '"If the clock ever stops...', tts: 'If the clock ever stops...', set: 'gears', light: 'gearroom', music: 'tense', sfx: [{ type: 'ticktock', at: 0 }],
    update(W, t) { W.gears.forEach(g => (g.obj.rotation.z = t * g.speed)); },
    cam: { from: { pos: [0.5, 5.0, 3.5], look: [-3.0, 5.6, -4.6], fov: 50 }, to: { pos: [0.2, 5.2, 2.8], look: [-3.0, 5.7, -4.6], fov: 48 }, sway: 0.4 } },
  // 18
  { vo: 'hold on, and don\'t let go."', tts: "hold on, and don't let go.", whisper: true, set: 'square', light: 'bright', music: 'tense',
    setup(W) { const g = W.chars.gus; W.put(g, [2, 0.12, -6], 0); g.setFace('serious'); W.grade.uniforms.strength.value = 0.85; },
    update(W, t) { W.chars.gus.setPose({ ...W.Poses.idle(t), neck: [0.12, 0, 0], waist: [0.1, 0, 0] }); },
    cam: { from: { pos: [2.0, 2.0, -3.6], look: [2, 2.0, -6], fov: 40 }, to: { pos: [2.0, 2.0, -3.9], look: [2, 2.02, -6], fov: 40 }, sway: 0.2 } },
  // 19
  { vo: 'Bo laughed.', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'pop', at: 0.1 }],
    setup(W) { const b = W.chars.bo; W.put(b, [-1.6, 0.12, 14.4], -0.2); b.setFace('laugh'); W.hold(b, W.props.balloon, 'wristR', [0, -0.12, 0]); },
    update(W, t) { const b = W.chars.bo; b.setPose({ ...W.Poses.idle(t), hipsY: Math.abs(Math.sin(t * 10)) * 0.06, waist: [0.2 + 0.1 * Math.sin(t * 10), 0, 0], shoulderL: [0, 0, 0.5] }); W.keepUpright(W.props.balloon); },
    cam: { from: { pos: [-1.55, 1.2, 16.6], look: [-1.6, 1.05, 14.4], fov: 42 }, to: { pos: [-1.55, 1.2, 16.3], look: [-1.6, 1.05, 14.4], fov: 41 }, sway: 0.5 } },

  // ================= ACT 3: THE DAY IT BROKE =================
  // 20
  { vo: 'Then came Tuesday.', set: 'square', light: 'storm', music: 'tense', sfx: [{ type: 'boom', at: 0.2 }],
    hud: [{ type: 'text', text: 'TUESDAY', y: 360, size: 120, color: '#ffe14a', from: 0.15 }],
    update(W, t) { crowd(W, t, { hold: 0, faces: 'smile', count: 12 }); tower(W, 11, 58, '11:58:40'); },
    cam: { from: { pos: [-18, 9, 34], look: [0, 8, -4], fov: 46 }, to: { pos: [-16, 8, 31], look: [0, 8, -4], fov: 46 }, sway: 0.3 } },
  // 21
  { vo: '11:59. The siren.', tts: 'Eleven fifty-nine. The siren.', set: 'square', light: 'storm', music: 'tense', sfx: [{ type: 'siren', at: 'u0.45', dur: 1.2 }],
    update(W, t, u) { tower(W, 11, 59, u < 0.45 ? '11:59:57' : '11:59:59', '#ff3b3b'); },
    cam: { from: { pos: [0, 5.2, 6], look: [0, 6, -10.44], fov: 36 }, to: { pos: [0, 5.6, 2.5], look: [0, 6, -10.44], fov: 36 }, ease: 'snap', sway: 0.3 } },
  // 22
  { vo: 'Everyone grabbed a railing.', set: 'square', light: 'storm', music: 'tense',
    update(W, t) { crowd(W, t, { hold: 1, faces: 'worried' }); },
    cam: { from: { pos: [-23, 1.4, 25], look: [-12, 1.2, 21], fov: 46 }, to: { pos: [-22, 1.45, 24.6], look: [-12, 1.2, 21], fov: 45 }, sway: 0.6 } },
  // 23
  { vo: 'Bo grabbed his balloon.', set: 'square', light: 'storm', music: 'tense', sfx: [{ type: 'pop', at: 'u0.6' }],
    setup(W) { const b = W.chars.bo; W.put(b, [1.2, 0.12, 21.2], 0); b.setFace('smirk'); W.hold(b, W.props.balloon, 'wristR', [0, -0.12, 0]); const i = W.chars.ivy; W.put(i, [-0.2, 0.12, 21.25], 0); i.setFace('worried'); },
    update(W, t) {
      const b = W.chars.bo; b.setPose({ ...W.Poses.idle(t), shoulderR: [-2.4, 0, 0.2], shoulderL: [-2.4, 0, -0.2], elbowL: [-0.2, 0, 0] }); W.keepUpright(W.props.balloon);
      const i = W.chars.ivy; i.setPose({}); W.reach(i, 'L', [0.05, RAIL_Y, 22]); W.reach(i, 'R', [0.8, 1.0, 21.4]);
    },
    cam: { from: { pos: [0.5, 1.4, 25.6], look: [0.5, 1.3, 21], fov: 44 }, to: { pos: [0.5, 1.4, 25.2], look: [0.5, 1.35, 21], fov: 43 }, sway: 0.5 } },
  // 24
  { vo: 'Twelve o\'clock. We floated.', set: 'square', light: 'storm', music: 'tense', sfx: [{ type: 'tick', at: 0.1 }, { type: 'whoosh', at: 0.5, low: true }],
    setup(W) { W.hold(W.chars.bo, W.props.balloon, 'wristR', [0, -0.12, 0]); },
    update(W, t, u) {
      const L = 0.8 * out3((u - 0.3) / 0.7); crowd(W, t, { hold: 1, lift: L, faces: 'worried' }); tower(W, 12, 0, '12:00:00');
      const b = W.chars.bo; W.put(b, [1.2, 0.12 + L * 2, 21.2], 0); b.setFace('laugh'); b.setPose(happyFloat(t)); W.keepUpright(W.props.balloon);
      const i = W.chars.ivy; W.put(i, [-0.2, 0.12 + L * 0.4, 21.25], 0); i.setPose({ hipL: [-0.3 * L, 0, 0] }); W.reach(i, 'L', [0.05, RAIL_Y, 22]); W.reach(i, 'R', [-0.45, RAIL_Y, 22]);
    },
    cam: { from: { pos: [8, 2.5, 30], look: [0, 1.8, 20], fov: 48 }, to: { pos: [7.4, 2.8, 29], look: [0, 2.2, 20], fov: 48 }, sway: 0.5 } },
  // 25
  { vo: 'Ten seconds. Thirty. Sixty.', set: 'square', light: 'storm', music: 'tense', sfx: [{ type: 'tick', at: 0.05 }, { type: 'tick', at: 'u0.4' }, { type: 'tick', at: 'u0.75' }],
    update(W, t, u) { tower(W, 12, u < 0.75 ? 0 : 1, u < 0.4 ? '12:00:10' : u < 0.75 ? '12:00:30' : '12:01:00', '#ff3b3b'); },
    cam: { from: { pos: [0, 5.6, 3], look: [0, 6, -10.44], fov: 36 }, to: { pos: [0, 5.7, 2.2], look: [0, 6, -10.44], fov: 36 }, sway: 0.3 } },
  // 26
  { vo: 'Nothing came down.', set: 'square', light: 'storm', music: 'none', sfx: [{ type: 'boom', at: 0.1 }],
    update(W, t) { crowd(W, t, { hold: 1, lift: 1.0, faces: 'mix' }); floatThings(W, t, 1.2, { cars: false, bus: false }); },
    cam: { from: { pos: [12, 1.0, 27], look: [8, 2.4, 21], fov: 46 }, to: { pos: [11.6, 1.0, 26.5], look: [8, 2.6, 21], fov: 46 }, sway: 0.5 } },
  // 27
  { vo: 'The clock had stopped.', whisper: true, set: 'square', light: 'storm', music: 'none', sfx: [{ type: 'clunk', at: 0.15 }],
    update(W, t) { W.tower.setTime(12, 1 + 0.05 * Math.sin(t * 40) * (t < 0.6 ? 1 : 0)); },
    cam: { from: { pos: [0, 18.2, 2.0], look: [0, 19.5, -10], fov: 40 }, to: { pos: [0, 18.6, 0.5], look: [0, 19.5, -10], fov: 38 }, sway: 0.2 } },
  // 28
  { vo: 'And everything kept going up.', set: 'square', light: 'storm', music: 'chase', sfx: [{ type: 'whoosh', at: 0.1, low: true }],
    update(W, t, u) { const L = 3 + 7 * ease(u); crowd(W, t, { hold: 0, lift: L, faces: 'mix' }); floatThings(W, t, L); W.put(W.chars.dog, [-4, 2 + L * 0.8, 10], t); W.chars.dog.setPose({ t, walk: 1, wag: 0, earsBack: 1 }); },
    cam: { from: { pos: [36, 14, 52], look: [0, 8, 12], fov: 46 }, to: { pos: [33, 12, 48], look: [0, 10, 12], fov: 46 }, sway: 0.5 } },
  // 29
  { vo: 'Cars. Mailboxes. The school bus.', set: 'square', light: 'storm', music: 'chase',
    update(W, t, u) { floatThings(W, t, 2 + 6 * ease(u)); },
    cam: { from: { pos: [-6, 0.6, 102], look: [0, 5, 70], fov: 50 }, to: { pos: [-5.8, 0.7, 100], look: [0, 7, 70], fov: 50 }, sway: 0.6 } },
  // 29b
  { vo: 'The fountain water floated up in giant bubbles.', set: 'square', light: 'storm', music: 'chase', sfx: [{ type: 'pop', at: 0.2 }, { type: 'pop', at: 0.7 }],
    update(W, t, u) { blobs(W, t, u); W.fountain.water.visible = u < 0.2; },
    cam: { from: { pos: [5, 1.5, 15], look: [0, 3.5, 7], fov: 48 }, to: { pos: [4.6, 1.8, 14.2], look: [0, 5.5, 7], fov: 48 }, sway: 0.5 } },
  // 30
  { vo: 'Bo waved at me... and kept rising.', set: 'square', light: 'storm', music: 'chase',
    setup(W) { const b = W.chars.bo; b.setFace('laugh'); W.hold(b, W.props.balloon, 'wristL', [0, -0.12, 0]); },
    update(W, t, u) { const b = W.chars.bo; W.put(b, [0.6, 3 + 9 * ease(u), 19], PI); b.setPose({ ...happyFloat(t), shoulderR: [0, 0, -2.6 - 0.3 * Math.sin(t * 10)] }); W.keepUpright(W.props.balloon); if (u > 0.6) b.setFace('worried'); },
    cam: { from: { pos: [0.2, 1.2, 15.5], look: [0.6, 4.5, 19], fov: 52 }, to: { pos: [0.2, 1.2, 15.5], look: [0.6, 9.5, 19], fov: 52 }, sway: 0.6 } },
  // 31
  { vo: 'I screamed his name.', set: 'square', light: 'storm', music: 'chase', sfx: [{ type: 'boom', at: 0.05 }],
    setup(W) { W.put(W.chars.ivy, [-0.2, 0.6, 21.25], PI); W.chars.ivy.setFace('scared'); },
    update(W, t) { const i = W.chars.ivy; i.setPose({ hipL: [-0.6, 0, 0], hipR: [-0.3, 0, 0], neck: [-0.35, 0, 0] }); W.reach(i, 'L', [-0.6, RAIL_Y, 22]); W.reach(i, 'R', [0.1, 3, 18]); },
    cam: { from: { pos: [-0.25, 2.2, 19.4], look: [-0.2, 2.2, 21.25], fov: 44 }, to: { pos: [-0.25, 2.3, 19.7], look: [-0.2, 2.25, 21.25], fov: 42 }, sway: 1.0 } },
  // 32
  { vo: 'Grandpa yelled, "The key! Someone stole the key!"', tts: 'Grandpa yelled, the key! Someone stole the key!', set: 'square', light: 'storm', music: 'chase',
    setup(W) { W.tower.key.visible = false; const g = W.chars.gus; W.put(g, [4.95, 17.4, -14.6], PI / 2 + 0.6); g.setFace('shout'); },
    update(W, t) { const g = W.chars.gus; g.setPose({ ...W.Poses.idle(t) }); W.reach(g, 'R', [7.5, 19.5, -14.2]); W.reach(g, 'L', [4.6, 19.8 + 0.2 * Math.sin(t * 12), -13.5]); },
    cam: { from: { pos: [11, 18.5, -6], look: [5.4, 18.7, -14], fov: 44 }, to: { pos: [10.4, 18.6, -6.8], look: [5.4, 18.8, -14], fov: 42 }, sway: 0.8 } },
  // 33
  { vo: "Without the key, the clock can't be wound.", set: 'square', light: 'storm', music: 'tense',
    setup(W) { W.tower.key.visible = false; },
    cam: { from: { pos: [10.5, 19.0, -13.0], look: [3.92, 19.5, -14], fov: 36 }, to: { pos: [8.5, 19.3, -13.6], look: [3.92, 19.5, -14], fov: 34 }, sway: 0.3 } },
  // 34
  { vo: "And without the clock, there's no gravity at all.", set: 'square', light: 'storm', music: 'chase', sfx: [{ type: 'rumble', at: 0, dur: 2.5 }],
    setup(W) { W.tower.key.visible = false; },
    hud: [GRAV('12%', '#ff4d5e', { pulse: true, from: 0.25 })],
    update(W, t, u) { floatThings(W, t, 3 + 3 * u, { houses: 1.5 * ease(u) + 0.3 * Math.sin(t * 6) * 0.05 }); },
    cam: { from: { pos: [0, 2.2, 165], look: [0, 4, 80], fov: 46 }, to: { pos: [0, 2.6, 155], look: [0, 6, 80], fov: 46 }, sway: 0.6 } },

  // 34b
  { vo: 'The whole town was drifting into the clouds.', set: 'square', light: 'storm', music: 'chase', sfx: [{ type: 'whoosh', at: 0.1, low: true }],
    setup(W) { W.tower.key.visible = false; },
    update(W, t, u) { crowd(W, t, { hold: 0, lift: 9 + 3 * u, faces: 'mix' }); floatThings(W, t, 9 + 3 * u, { houses: 3 + 2 * u }); },
    cam: { from: { pos: [-40, 48, 70], look: [0, 10, 20], fov: 48 }, to: { pos: [-36, 52, 64], look: [0, 12, 20], fov: 48 }, sway: 0.3 } },
  // ================= ACT 4: THE MAYOR =================
  // 35
  { vo: "That's when I saw him.", set: 'square', light: 'storm', music: 'tense',
    setup(W) { W.put(W.chars.ivy, [-0.2, 0.6, 21.25], PI + 0.6); W.chars.ivy.setFace('worried'); },
    update(W, t, u) { const i = W.chars.ivy; i.setPose({ hipL: [-0.4, 0, 0], neck: [-0.15, 0.5 * ease(u), 0] }); W.reach(i, 'L', [-0.6, RAIL_Y, 22]); W.reach(i, 'R', [0.2, RAIL_Y, 22]); },
    cam: { from: { pos: [-1.6, 2.0, 19.6], look: [-0.2, 2.15, 21.25], fov: 42 }, to: { pos: [-1.5, 2.05, 19.8], look: [-0.2, 2.2, 21.25], fov: 41 }, sway: 0.5 } },
  // 36
  { vo: 'Mayor Grimsby. Holding the key.', set: 'square', light: 'storm', music: 'tense', sfx: [{ type: 'boom', at: 'u0.5' }],
    setup(W) { W.tower.key.visible = false; const m = W.chars.mayor; W.put(m, [18, 9, 6], -PI / 2 + 0.3); m.setFace('smirk'); holdKey(W, m, 'R'); },
    hud: [tag('Mayor Grimsby', 'mayor', '#c9a0ff', 0.05)],
    update(W, t) { const m = W.chars.mayor; m.group.position.y = 9 + 0.2 * Math.sin(t * 2); m.setPose({ shoulderR: [-1.4, 0, 0.2], elbowR: [-0.6, 0, 0], hipL: [-0.2, 0, 0], kneeL: [0.4, 0, 0] }); },
    cam: { from: { pos: [12.5, 7.0, 7.5], look: [18, 10.5, 6], fov: 44 }, to: { pos: [13, 7.2, 7.4], look: [18, 10.6, 6], fov: 42 }, sway: 0.5 } },
  // 37
  { vo: '"No more Float Hour," he said.', tts: 'No more Float Hour, he said.', set: 'square', light: 'storm', music: 'tense',
    setup(W) { W.tower.key.visible = false; const m = W.chars.mayor; W.put(m, [18, 9, 6], -PI / 2 + 0.3); m.setFace('smirk'); holdKey(W, m, 'R'); },
    update(W, t) { const m = W.chars.mayor; m.group.position.y = 9 + 0.2 * Math.sin(t * 2); m.setPose({ shoulderR: [-1.4, 0, 0.2], elbowR: [-0.6, 0, 0] }); },
    cam: { from: { pos: [15.7, 11.0, 6.9], look: [18, 11.1, 6], fov: 40 }, to: { pos: [15.9, 11.05, 6.8], look: [18, 11.12, 6], fov: 40 }, sway: 0.3 } },
  // 38
  { vo: '"From now on... it\'s Float Forever!"', tts: "From now on... it's Float Forever!", set: 'square', light: 'storm', music: 'chase', sfx: [{ type: 'boom', at: 'u0.4' }],
    setup(W) { W.tower.key.visible = false; const m = W.chars.mayor; W.put(m, [18, 9, 6], -PI / 2 + 0.3); m.setFace('laugh'); holdKey(W, m, 'R'); },
    update(W, t) { const m = W.chars.mayor; m.group.position.y = 9 + 0.2 * Math.sin(t * 2); m.setPose({ shoulderR: [0, 0, -2.4], shoulderL: [0, 0, 2.4], waist: [-0.15, 0, 0] }); },
    cam: { from: { pos: [11, 5.5, 9], look: [19, 12, 6], fov: 50 }, to: { pos: [11.4, 5.7, 8.8], look: [19, 12.2, 6], fov: 50 }, sway: 0.6 } },
  // 39
  { vo: 'His new sky hotel opens tomorrow.', set: 'square', light: 'storm', music: 'tense',
    cam: { from: { pos: [9, 14.5, 9], look: [24, 16, 6], fov: 40 }, to: { pos: [10.5, 14.7, 8.6], look: [24, 16, 6], fov: 38 }, sway: 0.3 } },

  // ================= ACT 5: THE RESCUE =================
  // 40
  { vo: 'So I let go.', set: 'square', light: 'storm', music: 'none', sfx: [{ type: 'whoosh', at: 'u0.5' }],
    setup(W) { W.put(W.chars.ivy, [-0.2, 0.2, 21.25], PI); W.chars.ivy.setFace('serious'); },
    update(W, t, u) { const i = W.chars.ivy; i.setPose({ hipL: [-0.4, 0, 0] }); const off = u > 0.45 ? 0.3 * out3((u - 0.45) / 0.3) : 0; W.reach(i, 'L', [-0.55, RAIL_Y + off, 22 - off]); W.reach(i, 'R', [0.15, RAIL_Y + off, 22 - off]); },
    cam: { from: { pos: [0.3, 1.75, 23.5], look: [-0.2, 1.2, 21.9], fov: 42 }, to: { pos: [0.3, 1.8, 23.7], look: [-0.2, 1.25, 21.9], fov: 42 }, sway: 0.4 } },
  // 41
  { vo: 'I pushed off a lamppost and flew straight at him.', set: 'square', light: 'storm', music: 'heroic', sfx: [{ type: 'whoosh', at: 0.2 }],
    setup(W) { W.chars.ivy.setFace('serious'); },
    update(W, t, u) { const i = W.chars.ivy; const x = 10 + 6 * u, y = 5.2 + 3.5 * u; W.put(i, [x, y, 18 - 10 * u], 0); i.group.rotation.set(-1.2, 2.0, 0); i.setPose({ shoulderL: [-2.9, 0, 0], shoulderR: [-2.9, 0, 0], hipL: [0.1, 0, 0], hipR: [0.25, 0, 0] }); },
    cam(t, u) { const x = 10 + 6 * u, y = 5.2 + 3.5 * u, z = 18 - 10 * u; return { pos: [x - 2.5, y + 0.6, z + 3.5], look: [x + 2, y + 0.3, z - 3], fov: 52, sway: 0.8 }; } },
  // 42
  { vo: 'Biscuit flew with me.', set: 'square', light: 'storm', music: 'heroic', sfx: [{ type: 'bark', at: 0.3 }],
    update(W, t, u) { const d = W.chars.dog; const x = 13 + 3 * u, y = 7 + 1.5 * u, z = 13 - 5 * u; W.put(d, [x, y, z], 2.1); d.setPose({ t, walk: 1, wag: 1, earsBack: 1, tongueOut: true }); d.group.rotation.x = -0.3; },
    hud: [tag('Biscuit', 'dog', '#ff9b4a', 0.05)],
    cam(t, u) { const x = 13 + 3 * u, y = 7 + 1.5 * u, z = 13 - 5 * u; return { pos: [x - 1.3, y + 0.5, z + 1.6], look: [x, y + 0.4, z], fov: 46, sway: 0.8 }; } },
  // 43
  { vo: 'Biscuit bit the toupee.', set: 'square', light: 'storm', music: 'heroic', sfx: [{ type: 'pop', at: 'u0.5' }],
    setup(W) { W.tower.key.visible = false; const m = W.chars.mayor; W.put(m, [18, 9, 6], -PI / 2 + 0.3); m.setFace('scared'); holdKey(W, m, 'R'); },
    update(W, t, u) {
      const m = W.chars.mayor; m.setPose({ shoulderR: [-1.4, 0, 0.2], elbowR: [-0.6, 0, 0], shoulderL: [0, 0, 1.0] });
      const d = W.chars.dog; const k = out3(u / 0.5); W.put(d, [16.0 + 1.4 * k, 11.6 - 0.6 * k + (u > 0.5 ? 0.5 * (u - 0.5) : 0), 6.7 - 0.3 * k], 2.4); d.setPose({ t, walk: 1, wag: 1, tongueOut: false });
      const tp = m.parts.toupee; if (u > 0.5) { tp.position.set(0, W.props.toupeeHome.pos.y + 0.6 + (u - 0.5) * 2, 0.4); tp.rotation.set(0.6, 0, 0.4); }
    },
    cam: { from: { pos: [13.8, 10.6, 9.5], look: [17.6, 11.2, 6], fov: 44 }, to: { pos: [14.1, 10.7, 9.3], look: [17.6, 11.3, 6], fov: 43 }, sway: 0.7 } },
  // 44
  { vo: 'The mayor dropped the key.', set: 'square', light: 'storm', music: 'heroic',
    setup(W) { const m = W.chars.mayor; W.put(m, [18, 9, 6], -PI / 2 + 0.3); m.setFace('shout'); m.parts.toupee.visible = false; const k = W.props.keyProp; W.put(k, [17.4, 10.6, 6.3]); },
    update(W, t, u) { const m = W.chars.mayor; m.setPose(flail(t)); const k = W.props.keyProp; k.position.set(17.4 - 2.5 * u, 10.6 - 2.2 * u, 6.3 + 0.5 * u); k.rotation.set(t * 4, t * 3, t * 2); },
    cam: { from: { pos: [12, 8, 11], look: [16.5, 9.8, 6.4], fov: 46 }, to: { pos: [12.2, 7.9, 10.8], look: [15.5, 9.1, 6.5], fov: 46 }, sway: 0.6 } },
  // 45
  { vo: 'I caught it.', set: 'square', light: 'storm', music: 'heroic', sfx: [{ type: 'clunk', at: 'u0.4' }],
    setup(W) { const i = W.chars.ivy; W.put(i, [14.5, 6.9, 7], PI / 2 + 0.5); i.setFace('smirk'); holdKey(W, i, 'R'); },
    update(W, t) { const i = W.chars.ivy; i.setPose({ shoulderR: [-2.2, 0, 0.3], elbowR: [-0.4, 0, 0], hipL: [-0.4, 0, 0], kneeL: [0.6, 0, 0] }); i.group.position.y = 6.9 + 0.1 * Math.sin(t * 3); },
    cam: { from: { pos: [17.6, 8.0, 9.4], look: [14.6, 8.2, 6.9], fov: 44 }, to: { pos: [17.4, 8.05, 9.2], look: [14.6, 8.25, 6.9], fov: 43 }, sway: 0.5 } },
  // 46
  { vo: 'Gravity: three percent.', set: 'square', light: 'storm', music: 'chase', sfx: [{ type: 'alarm', at: 0.1, dur: 1.4 }],
    setup(W) { W.tower.key.visible = false; },
    hud: [GRAV('3%', '#ff4d5e', { pulse: true }), { type: 'badge', text: 'GRAVITY CRITICAL', from: 0.2 }],
    update(W, t, u) { crowd(W, t, { hold: 0, lift: 12 + 4 * u, faces: 'mix' }); floatThings(W, t, 12 + 4 * u, { houses: 4 + 2 * u }); },
    cam: { from: { pos: [55, 30, 80], look: [0, 10, 20], fov: 48 }, to: { pos: [50, 28, 74], look: [0, 12, 20], fov: 48 }, sway: 0.4 } },
  // 47
  { vo: "I grabbed Bo's shoelace on the way up.", tts: "I grabbed Bo's shoe lace on the way up.", set: 'square', light: 'storm', music: 'heroic',
    setup(W) { const b = W.chars.bo; b.setFace('scared'); W.hold(b, W.props.balloon, 'wristL', [0, -0.12, 0]); W.chars.ivy.setFace('serious'); },
    update(W, t, u) {
      const y = 13 + 2 * u; const b = W.chars.bo; W.put(b, [2, y + 0.9, 4], 0.3); b.setPose(flail(t)); W.keepUpright(W.props.balloon);
      const i = W.chars.ivy; W.put(i, [2.1, y - 1.25, 4.2], 0.2); i.setPose({ hipL: [-0.3, 0, 0], kneeL: [0.5, 0, 0] }); W.reach(i, 'R', W.localPos(b.joints.ankleR, [0, -0.1, 0.1])); W.reach(i, 'L', [2.8, y - 0.2, 4.6]);
    },
    cam(t, u) { const y = 13 + 2 * u; return { pos: [3.2, y - 0.9, 7.4], look: [2.05, y + 0.3, 4.1], fov: 46, sway: 0.7 }; } },
  // 48
  { vo: 'Grandpa held the clock door open.', set: 'square', light: 'storm', music: 'heroic',
    setup(W) { const g = W.chars.gus; W.put(g, [-4.75, 16.25, -13.4], -PI / 2); g.setFace('shout'); },
    hud: [tag('Grandpa Gus', 'gus', '#7fe0b0', 0.05)],
    update(W, t, u) { const g = W.chars.gus; g.setPose({ shoulderL: [0, 0, 2.4 + 0.3 * Math.sin(t * 9)], elbowL: [0, 0, 0.5 * Math.sin(t * 9)] }); W.reach(g, 'R', [-4.05, 17.5, -14.6]);
      const i = W.chars.ivy; W.put(i, [-10 + 4 * u, 17.5 + 0.3 * Math.sin(t), -12 + u], PI / 2); i.setPose(flail(t)); },
    cam: { from: { pos: [-12, 15.5, -6], look: [-5, 17.2, -13.8], fov: 46 }, to: { pos: [-11.5, 15.7, -6.6], look: [-5, 17.3, -13.8], fov: 45 }, sway: 0.6 } },
  // 49
  { vo: 'The keyhole was taller than me.', set: 'gears', light: 'gearroom', music: 'tense', sfx: [{ type: 'ticktock', at: 0 }],
    setup(W) { W.bigKey.visible = false; const i = W.chars.ivy; W.put(i, [0.3, 0, -1.3], PI); holdKey(W, i, 'R'); },
    update(W, t) { W.chars.ivy.setPose({ ...W.Poses.idle(t), shoulderR: [-0.6, 0, 0], neck: [-0.35, 0, 0] }); },
    cam: { from: { pos: [1.8, 0.6, 2.4], look: [0.1, 2.8, -3], fov: 52 }, to: { pos: [1.6, 0.65, 2.0], look: [0.1, 3.0, -3], fov: 52 }, sway: 0.4 } },
  // 50
  { vo: 'We all pushed. Once. Twice. Three times.', set: 'gears', light: 'gearroom', music: 'heroic', sfx: [{ type: 'ratchet', at: 'u0.3', n: 1 }, { type: 'ratchet', at: 'u0.55', n: 1 }, { type: 'ratchet', at: 'u0.8', n: 1 }],
    setup(W) { W.put(W.chars.ivy, [-0.9, 0, 0.9], PI + 0.3); W.put(W.chars.bo, [0.2, 0, 1.3], PI); W.put(W.chars.gus, [1.2, 0, 0.9], PI - 0.3); W.chars.ivy.setFace('serious'); W.chars.bo.setFace('serious'); W.chars.gus.setFace('serious'); },
    hud: [(t, u) => GRAV(u < 0.3 ? '3%' : u < 0.55 ? '34%' : u < 0.8 ? '67%' : '100%', u < 0.8 ? '#ff4d5e' : '#38e07b')],
    update(W, t, u) {
      const step = u < 0.3 ? 0 : u < 0.55 ? 1 : u < 0.8 ? 2 : 3; const a = (step + clamp01(((u - [0, 0.3, 0.55, 0.8][step]) / 0.08))) * PI / 2 * (step < 3 ? 1 : 1);
      W.bigKey.rotation.z = Math.min(a, 3 * PI / 2 * 1.0 + 0.0);
      W.gears.forEach(g => (g.obj.rotation.z = a * g.speed * 2));
      const ring = W.localPos(W.bigKey, [0, 0.55 * 1.6 * Math.cos(0), 0]);
      for (const [c, dx] of [[W.chars.ivy, -0.4], [W.chars.bo, 0], [W.chars.gus, 0.4]]) { c.setPose({ waist: [0.25, 0, 0], hipL: [-0.4, 0, 0], kneeL: [0.4, 0, 0] }); W.reach(c, 'L', [ring[0] + dx + 0.15, ring[1] - 0.6, ring[2] + 0.05]); W.reach(c, 'R', [ring[0] + dx - 0.15, ring[1] - 0.6, ring[2] + 0.05]); }
    },
    cam: { from: { pos: [2.6, 2.6, 4.8], look: [0, 2.2, 0], fov: 50 }, to: { pos: [2.2, 2.5, 4.3], look: [0, 2.3, 0], fov: 50 }, sway: 0.6 } },
  // 50b
  { vo: 'The gears roared back to life.', set: 'gears', light: 'gearroom', music: 'heroic', sfx: [{ type: 'rumble', at: 0, dur: 1.8 }, { type: 'ratchet', at: 0.1, n: 3, every: 0.35 }],
    update(W, t) { W.gears.forEach(g => (g.obj.rotation.z = t * g.speed * 6)); W.bigKey.rotation.z = 3 * Math.PI / 2; },
    cam: { from: { pos: [3.5, 4.5, 1.5], look: [4.3, 6.0, -4.4], fov: 46 }, to: { pos: [3.0, 4.8, 0.8], look: [4.3, 6.0, -4.4], fov: 44 }, sway: 1.0 } },
  // 51
  { vo: 'Tick.', set: 'square', light: 'bright', music: 'none', dur: 1.3, sfx: [{ type: 'tick', at: 0.25 }, { type: 'boom', at: 0.3 }],
    update(W, t) { W.tower.setTime(12, t < 0.25 ? 1 : 2); },
    cam: { from: { pos: [0, 18.4, 1.0], look: [0, 19.5, -10], fov: 38 }, to: { pos: [0, 18.4, 0.6], look: [0, 19.5, -10], fov: 38 }, sway: 0.1 } },
  // 52
  { vo: 'Everything came down. Really fast.', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'boom', at: 'u0.4' }, { type: 'thuds', at: 'u0.42' }],
    update(W, t, u) {
      const drop = u < 0.38 ? 1 : Math.max(0, 1 - out3((u - 0.38) / 0.1)) + (u > 0.48 ? 0.2 * Math.abs(Math.sin((u - 0.48) * 24)) * Math.max(0, 1 - (u - 0.48) * 3) : 0);
      crowd(W, t, { hold: 0, lift: 10 * drop, faces: drop > 0.05 ? 'scared' : 'laugh' }); floatThings(W, t, 10 * drop, { houses: 3 * drop });
    },
    cam: { from: { pos: [28, 9, 46], look: [0, 4, 12], fov: 48 }, to: { pos: [27, 8.5, 45], look: [0, 3, 12], fov: 48 }, sway: 0.8 } },
  // 53
  { vo: 'The mayor landed in the fountain.', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'splash', at: 'u0.35' }],
    setup(W) { const m = W.chars.mayor; m.setFace('scared'); m.parts.toupee.visible = false; },
    update(W, t, u) { const m = W.chars.mayor; const k = out3(u / 0.35); W.put(m, [0.6, 6 - 5.5 * k, 8.4], PI); m.setPose(u < 0.35 ? flail(t) : { ...W.Poses.sit(), shoulderL: [0, 0, 1.2], shoulderR: [0, 0, -1.2] }); if (u > 0.35) m.setFace('worried');
      W.fountain.jet.scale.set(1, u > 0.35 && u < 0.75 ? 3 : 1, 1); },
    cam: { from: { pos: [0.4, 2.2, 14.5], look: [0.4, 1.6, 8], fov: 44 }, to: { pos: [0.4, 2.1, 14.0], look: [0.4, 1.4, 8], fov: 43 }, sway: 0.6 } },
  // 54
  { vo: 'His toupee landed on Biscuit.', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'pop', at: 'u0.3' }, { type: 'bark', at: 'u0.55' }],
    setup(W) { const d = W.chars.dog; W.put(d, [2.5, 0.12, 11.5], -0.4); },
    update(W, t, u) { const d = W.chars.dog; d.setPose({ t, wag: 1, sit: 1, headTilt: 0.25 * Math.sin(t * 3) });
      const tp = W.chars.mayor.parts.toupee; W.activeSet.add(tp); tp.visible = true; const k = out3(u / 0.3); tp.position.set(2.5 - 0.0, 0.12 + 0.95 + 1.5 * (1 - k), 11.5 + 0.38); tp.rotation.set(0, -0.4, 0); tp.scale.setScalar(0.95); },
    cam: { from: { pos: [1.8, 0.95, 13.4], look: [2.45, 0.85, 11.6], fov: 42 }, to: { pos: [1.85, 0.95, 13.2], look: [2.45, 0.88, 11.6], fov: 41 }, sway: 0.5 } },

  // 54b
  { vo: 'Biscuit refuses to give it back.', set: 'square', light: 'bright', music: 'day', sfx: [{ type: 'bark', at: 0.3 }],
    update(W, t, u) { const d = W.chars.dog; W.put(d, [-6 + 9 * u, 0.12 + Math.abs(Math.sin(t * 9)) * 0.15, 12], Math.PI / 2); d.setPose({ t, walk: 1, wag: 1 });
      const tp = W.chars.mayor.parts.toupee; d.head.add(tp); tp.visible = true; tp.position.set(0, 0.28, 0); tp.rotation.set(0, 0, 0.2 * Math.sin(t * 9)); tp.scale.setScalar(0.95); },
    cam(t, u) { const x = -6 + 9 * u; return { pos: [x + 1.2, 0.9, 15.2], look: [x, 0.7, 12], fov: 44, sway: 0.6 }; } },
  // ================= ACT 6: THE TWIST =================
  // 55
  { vo: "Now the key hangs around Grandpa's neck.", set: 'square', light: 'bright', music: 'day',
    setup(W) { const g = W.chars.gus; W.put(g, [2, 0.12, -6], 0); g.setFace('smile'); W.hold(g, W.props.neckKey, 'waist', [0, 0.3, 0.24], [0, PI / 2, PI / 2]); },
    update(W, t) { W.chars.gus.setPose({ ...W.Poses.idle(t), shoulderR: [-0.9, 0, 0.3], elbowR: [-1.6, 0, 0] }); },
    cam: { from: { pos: [2.1, 1.75, -3.4], look: [2, 1.75, -6], fov: 42 }, to: { pos: [2.1, 1.7, -3.7], look: [2, 1.7, -6], fov: 41 }, sway: 0.4 } },
  // 55b
  { vo: 'The mayor? He polishes railings now.', set: 'square', light: 'bright', music: 'day',
    setup(W) { const m = W.chars.mayor; W.put(m, [-8, 0.12, 21.3], 0); m.setFace('unimpressed'); m.parts.toupee.visible = false; },
    hud: [tag('Mayor (former)', 'mayor', '#c9a0ff', 0.1)],
    update(W, t) { const m = W.chars.mayor; m.setPose({ waist: [0.3, 0, 0] }); W.reach(m, 'R', [-8 + 0.4 * Math.sin(t * 8), RAIL_Y + 0.05, 22]); W.reach(m, 'L', [-8.6, RAIL_Y, 22]); },
    cam: { from: { pos: [-7.2, 1.7, 25.2], look: [-8, 1.5, 21.3], fov: 42 }, to: { pos: [-7.3, 1.7, 24.8], look: [-8, 1.5, 21.3], fov: 41 }, sway: 0.4 } },
  // 56
  { vo: 'And Bo holds a railing. Mostly.', set: 'square', light: 'bright', music: 'day',
    setup(W) { const b = W.chars.bo; b.setFace('smirk'); W.hold(b, W.props.balloon, 'wristR', [0, -0.12, 0]); },
    update(W, t, u) { const b = W.chars.bo; const L = u > 0.55 ? 0.6 * out3((u - 0.55) / 0.3) : 0; W.put(b, [1.2, 0.12 + L, 21.25], 0); b.setPose({ hipL: [-L, 0, 0] }); W.reach(b, 'L', [1.4, RAIL_Y, 22]); if (u < 0.55) W.reach(b, 'R', [1.0, RAIL_Y, 22]); else { b.setFace('laugh'); } W.keepUpright(W.props.balloon); },
    cam: { from: { pos: [1.2, 1.3, 25.2], look: [1.2, 1.2, 21.3], fov: 40 }, to: { pos: [1.2, 1.3, 24.8], look: [1.2, 1.3, 21.3], fov: 40 }, sway: 0.4 } },
  // 56b
  { vo: 'Everything was normal again.', set: 'square', light: 'bright', music: 'day',
    update(W, t) { crowd(W, t, { hold: 0, faces: 'smile', count: 14 }); W.tower.setTime(10, 15); W.tower.setDigital('10:15:00', '#ffb020'); },
    cam: { from: { pos: [-14, 6, 34], look: [0, 6, 0], fov: 46 }, to: { pos: [-12, 5.5, 31], look: [0, 6, 0], fov: 46 }, sway: 0.3 } },
  // 57
  { vo: 'But last night, I woke up at 3 a.m.', tts: 'But last night, I woke up at three A.M.', set: 'bedroom', light: 'interiorNight', music: 'dread', sfx: [{ type: 'tick', at: 0.2, n: 3, every: 0.6, soft: true }],
    setup(W) { W.props.lamp.setOn(0); W.props.clock.setTime('3:00', 'AM'); W.bedWall.color.set('#d7a6ff'); },
    cam: { from: { pos: [-0.3, 0.45, 0.6], look: [1.02, 0.73, -2.5], fov: 42 }, to: { pos: [0.58, 0.71, -1.25], look: [1.02, 0.735, -2.5], fov: 37 }, ease: 'snap', sway: 0.3 } },
  // 58
  { vo: 'My bed was touching the ceiling.', set: 'bedroom', light: 'interiorNight', music: 'dread', sfx: [{ type: 'boom', at: 'u0.3' }],
    setup(W) {
      W.props.lamp.setOn(0); W.bedWall.color.set('#d7a6ff'); W.props.bed.position.y = 1.45; W.coolAt([1.0, 1.4, 0.2], 3.0);
      const i = W.chars.ivy; W.put(i, [2.45, 1.2, -2.0], 0); i.setFace('scared');
      W.props.blanket.position.set(0, 0.88, 0.38); W.props.blanket.scale.set(1, 1, 0.85);
    },
    update(W, t) { W.chars.ivy.setPose({ hipL: [-1.55, 0, 0], hipR: [-1.55, 0, 0], waist: [0.15, 0, 0], neck: [0.35, 0, 0], shoulderL: [0, 0, 2.6], shoulderR: [0, 0, -2.6], elbowL: [0, 0, 0.6], elbowR: [0, 0, -0.6] }); },
    cam: { from: { pos: [0.3, 2.75, 1.2], look: [2.45, 2.2, -1.8], fov: 50 }, to: { pos: [0.5, 2.75, 0.8], look: [2.45, 2.25, -1.8], fov: 48 }, sway: 0.5 } },
  // 59
  { vo: 'And the clock tower said twelve o\'clock.', set: 'square', light: 'nightTown', music: 'dread', moonDir: [-0.5, 0.45, -1],
    update(W, t) { W.tower.setTime(12, 0); W.tower.setDigital('12:00:00', '#ff3b3b'); crowd(W, t, { hold: 0, lift: 0, count: 0 }); floatThings(W, t, 1.5 + 0.2 * Math.sin(t)); },
    cam: { from: { pos: [0, 2, 26], look: [0, 16, -12], fov: 46 }, to: { pos: [0, 2.2, 23], look: [0, 17, -12], fov: 46 }, sway: 0.3 } },
  // 60
  { vo: 'Someone else has a key.', whisper: true, set: 'square', light: 'nightTown', music: 'dread', moonDir: [-0.9, 0.35, -0.3], sfx: [{ type: 'boom', at: 'u0.4' }],
    setup(W) { const m = W.chars.mailman; W.put(m, [-29, 8.15, -12], PI / 2); const k = W.props.keyProp; W.hold(m, k, 'wristR', [0, -0.25, 0.1], [0, PI / 2, PI / 2]); },
    update(W, t) { W.chars.mailman.setPose({ shoulderR: [-1.3, 0, 0], elbowR: [-0.5, 0, 0] }); },
    cam: { from: { pos: [-13, 10.5, -7.5], look: [-29, 11.6, -12], fov: 34 }, to: { pos: [-14, 10.6, -7.8], look: [-29, 11.7, -12], fov: 32 }, sway: 0.3 } },
  // 61
  { vo: 'Hold on.', whisper: true, set: 'square', light: 'nightTown', music: 'outro', dur: 3.2, moonDir: [-0.5, 0.45, -1],
    hud: [GRAV('0%', '#ff4d5e', { from: 0.4, pulse: true })],
    update(W, t, u) { W.tower.setTime(12, 0); floatThings(W, t, 2 + 6 * u, { houses: 1 + 3 * u }); W.grade.uniforms.dark.value = Math.max(0, (u - 0.88) / 0.12); },
    cam: { from: { pos: [0, 8, 40], look: [0, 10, 0], fov: 46 }, to: { pos: [40, 60, 120], look: [0, 6, 20], fov: 46 }, ease: 'in', sway: 0.25 } },
];
