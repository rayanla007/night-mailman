// STORY 09 — UPSIDE-DOWN FRIDAY (clip pack, stories/09_upside_down_friday.txt)
export const kit = ['cast4', 'mirror', 'dad', 'flip'];
const PI = Math.PI;
const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const front = (p, rot, eyeY, d0, d1, fov = 40, side = 0, sway = 0.4, roll = 0) => {
  const dx = Math.sin(rot), dz = Math.cos(rot), sx = Math.cos(rot), sz = -Math.sin(rot);
  const at = d => [p[0] + dx * d + sx * side, eyeY, p[2] + dz * d + sz * side];
  return { from: { pos: at(d0), look: [p[0], eyeY - 0.05, p[2]], fov, roll }, to: { pos: at(d1), look: [p[0], eyeY - 0.03, p[2]], fov, roll }, sway };
};
const RY = W => W.chars.ivy, MILO = W => W.chars.theoDay, MOM = W => W.chars.mom;
const TXT = (text, color = '#ffffff', y = 330, size = 96) => ({ type: 'text', text, y, size, color });
const R0 = 0.06, CEIL = 3.3;
// upside-down: feet at height y, body hanging down
const inv = (W, c, pos, rotY = 0) => { W.put(c, pos, rotY); c.group.rotation.z = PI; return c; };
const flipCam = (spec, k) => ({ ...spec, from: { ...spec.from, roll: 180 * k }, to: { ...(spec.to || spec.from), roll: 180 * k } });
const SQ = { set: 'square', noKey: true };
const clock = (W, h, m = 0) => { W.tower.setTime(h % 12 || 12, m); W.tower.setDigital(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`); };
const towerCam = (roll = 0) => ({ from: { pos: [0, 4, 14], look: [0, 18, -14], fov: 48, roll }, to: { pos: [0, 4, 13], look: [0, 19, -14], fov: 48, roll }, sway: 0.3 });
// people stuck to the dining-room ceiling (feet up)
const ceilingFolk = (W, t, who) => who.forEach(([c, x, z, r, face], i) => { inv(W, c, [x, CEIL, z], r); c.setFace(face); c.setPose({ ...W.Poses.idle(t + i), shoulderR: [-2.9, 0, 0], elbowR: [0, 0, 0] }); });
const DIN = { set: 'dining', light: 'interiorNight' };
const inside = (W) => W.coolAt([0, 1.5, -1], 0.9);
// crowd hanging from the ground in the square (gravity up): feet in the air, hands on the ground
const hangCrowd = (W, t, n = 10, face = 'laugh') => W.crowd.slice(0, n).forEach((c, i) => { const a = i * 2.39, r = 3 + (i % 5) * 2.2; inv(W, c, [Math.cos(a) * r, 2.5 + 0.08 * Math.sin(t * 3 + i), 4 + Math.sin(a) * r], a); c.setFace(face); c.setPose({ shoulderL: [-2.9, 0, 0.1], shoulderR: [-2.9, 0, -0.1], hipL: [0.2 * Math.sin(t * 4 + i), 0, 0], hipR: [-0.2 * Math.sin(t * 4 + i), 0, 0] }); });

export const shots = [
  // 1
  { set: 'street', light: 'day', vo: 'In this town, every Friday, the world flips upside down.', sfx: [{ type: 'whoosh', at: 'u0.3' }], hud: [TXT('FLIP FRIDAY', '#ffd23a', 330, 100)],
    cam: (t, u) => ({ from: { pos: [0, 3, 12], look: [0, 3, -20], fov: 50, roll: 180 * ease(clamp01(u * 1.4 - 0.2)) }, sway: 0.3 }) },
  // 2
  { ...SQ, light: 'bright', vo: 'At exactly three o\'clock, gravity goes the other way.', tts: "At exactly three o'clock, gravity goes the other way.", sfx: [{ type: 'chime', at: 'u0.4' }],
    update(W, t, u) { const go = u > 0.4; clock(W, go ? 15 : 14, go ? 0 : 59); W.crowd.slice(0, 10).forEach((c, i) => { const a = i * 2.39, r = 3 + (i % 5) * 2.2, k = go ? ease(clamp01((u - 0.4) * 2.5)) : 0; W.put(c, [Math.cos(a) * r, 0.12 + k * 2.4, 4 + Math.sin(a) * r], a + PI); c.group.rotation.z = PI * k; c.setFace(go ? 'surprised' : 'smile'); c.setPose(go ? { shoulderL: [0, 0, 2.4], shoulderR: [0, 0, -2.4] } : W.Poses.idle(t + i)); }); },
    hud: [(t, u) => TXT(u > 0.4 ? '3:00' : '2:59', '#ffd23a', 330, 110)], cam: { from: { pos: [6, 3, 22], look: [0, 4, 0], fov: 50 }, to: { pos: [5, 2.8, 20], look: [0, 4, 0], fov: 50 }, sway: 0.4 } },
  // 3
  { ...DIN, vo: 'Everyone grabs the handles on the ceiling.', setup(W) { inside(W); }, update(W, t) { ceilingFolk(W, t, [[MOM(W), -1, -4.6, 0, 'laugh'], [RY(W), 1, -4.6, 0, 'smile'], [MILO(W), 3, -1.4, -0.4, 'laugh']]); },
    cam: { from: { pos: [0.5, 1.2, -0.6], look: [0.5, 2.0, -4], fov: 54, roll: 180 }, to: { pos: [0.5, 1.15, -0.9], look: [0.5, 2.0, -4], fov: 54, roll: 180 }, sway: 0.3 } },
  // 4
  { set: 'street', light: 'day', vo: 'Houses have doors on the roof.', setup(W) { W.props.roofDoor.setOpen(0); }, update(W, t, u) { W.props.roofDoor.setOpen(1.2 * ease(clamp01(u * 1.5))); },
    hud: [TXT('DOOR ON THE ROOF', '#ff9bd2', 330, 76)], cam: { from: { pos: [4, 6, -22], look: [11, 8.4, -30], fov: 46 }, to: { pos: [4.5, 6.2, -23], look: [11, 8.4, -30], fov: 46 }, sway: 0.3 } },
  // 5
  { set: 'street', light: 'day', vo: 'Trees grow both ways.', cam: { from: { pos: [-3, 3.5, -16], look: [-9.2, 4.6, -25], fov: 50 }, to: { pos: [-3.5, 3.4, -17], look: [-9.2, 4.6, -25], fov: 50 }, sway: 0.3 } },
  // 6
  { set: 'street', light: 'day', vo: 'Pizza is always eaten upside down.', setup(W) { inv(W, RY(W), [0, 2.6, -2], 0); RY(W).setFace('laugh'); W.hold(RY(W), W.props.pizza, 'wristR', [0, -0.2, 0.1], [PI / 2, 0, 0]); },
    update(W, t) { RY(W).setPose({ shoulderR: [-2.2 + 0.2 * Math.sin(t * 5), 0, 0.2], elbowR: [-1.0, 0, 0], shoulderL: [-2.9, 0, 0] }); }, cam: front([0, 0, -2], 0, 0.8, 3.2, 2.8, 44, 0, 0.4, 180) },
  // 7
  { set: 'street', light: 'day', vo: 'For one hour, the sky is the floor.', update(W, t) { W.crowd.slice(0, 6).forEach((c, i) => { inv(W, c, [-3 + i * 1.3, 7 + (i % 2) * 0.4, -6 - (i % 3)], PI * (i % 2)); c.setFace('laugh'); c.setPose(W.Poses.walk(t * 5 + i, 0.4)); }); },
    hud: [TXT('SKY = FLOOR', '#7fd3ff', 330, 90)], cam: { from: { pos: [0, 2, 6], look: [0, 6, -8], fov: 52, roll: 180 }, to: { pos: [0, 2, 5], look: [0, 6, -8], fov: 52, roll: 180 }, sway: 0.3 } },
  // 8
  { ...SQ, light: 'bright', vo: 'Then at four, everything flips back.', sfx: [{ type: 'whoosh', at: 'u0.4' }], update(W, t, u) { clock(W, u > 0.4 ? 16 : 15, u > 0.4 ? 0 : 59); },
    hud: [(t, u) => TXT(u > 0.4 ? '4:00' : '3:59', '#ffd23a', 330, 110)], cam: (t, u) => ({ ...towerCam(180 * (1 - ease(clamp01((u - 0.35) * 2.5)))), sway: 0.3 }) },
  // 9
  { set: 'street', light: 'day', vo: 'Easy.', setup(W) { W.put(RY(W), [0, R0, -2], 0); RY(W).setFace('smirk'); }, update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderR: [-1.6, 0, 0.3], elbowR: [-1.2, 0, 0] }); }, cam: front([0, 0, -2], 0, 1.95, 2.6, 2.3, 40) },
  // 10
  { set: 'street', light: 'day', vo: 'My little brother Milo loves Flip Friday.', setup(W) { W.put(MILO(W), [0, R0, -2], 0); MILO(W).setFace('laugh'); }, update(W, t) { MILO(W).setPose({ shoulderL: [0, 0, 2.5 + 0.3 * Math.sin(t * 9)], shoulderR: [0, 0, -2.5 - 0.3 * Math.sin(t * 9)], hipsY: 0.1 * Math.abs(Math.sin(t * 9)) }); },
    hud: [{ type: 'tag', text: 'Milo', char: 'theoDay', color: '#ffd23a' }], cam: front([0, 0, -2], 0, 1.2, 2.6, 2.3, 42) },
  // 11
  { vo: 'He keeps his shoes on the ceiling just for fun.', set: 'bedroom', light: 'morning', setup(W) { W.props.shoes.slice(0, 4).forEach((s, i) => { W.put(s, [-1.6 + i * 0.7, 3.2, -0.6 + (i % 2) * 0.5], i * 0.7); s.group.rotation.z = PI; }); W.put(MILO(W), [-0.6, 0, 0.8], PI); MILO(W).setFace('laugh'); },
    update(W, t) { MILO(W).setPose({ shoulderR: [-2.7, 0, 0], elbowR: [0, 0, 0], neck: [-0.5, 0, 0] }); }, cam: { from: { pos: [0.1, 1.9, 1.5], look: [-0.7, 3.1, -0.3], fov: 50 }, to: { pos: [0.0, 1.9, 1.3], look: [-0.7, 3.15, -0.3], fov: 50 }, sway: 0.3 } },
  // 12
  { set: 'street', light: 'day', vo: 'But this Friday, something was wrong.', sfx: [{ type: 'silence', at: 0 }], setup(W) { W.put(RY(W), [0, R0, -2], 0); RY(W).setFace('worried'); }, update(W, t) { RY(W).setPose(W.Poses.idle(t)); }, hud: [{ type: 'badge', text: 'SOMETHING WAS WRONG', y: 300 }], cam: front([0, 0, -2], 0, 1.95, 2.2, 1.9, 40) },
  // 13
  { ...SQ, light: 'bright', vo: 'At three o\'clock, the world flipped.', tts: "At three o'clock, the world flipped.", sfx: [{ type: 'whoosh', at: 'u0.3' }], update(W) { clock(W, 15, 0); }, cam: (t, u) => ({ ...towerCam(180 * ease(clamp01(u * 1.5 - 0.2))) }) },
  // 14
  { ...SQ, light: 'bright', vo: "At four o'clock... it didn't flip back.", setup(W) { inv(W, RY(W), [0, 2.5, 6], PI); RY(W).setFace('worried'); }, update(W, t) { clock(W, 16, 0); RY(W).setPose({ shoulderL: [-2.9, 0, 0], shoulderR: [-2.9, 0, 0], neck: [0, 0.4 * Math.sin(t * 2), 0] }); },
    hud: [TXT('4:00', '#ff4d5e', 330, 110)], cam: { from: { pos: [1.5, 1.2, 10.5], look: [0, 6, -14], fov: 52, roll: 180 }, to: { pos: [1.4, 1.2, 10], look: [0, 6.5, -14], fov: 52, roll: 180 }, sway: 0.3 } },
  // 15
  { ...SQ, light: 'bright', vo: 'Five o\'clock.', tts: "Five o'clock.", update(W) { clock(W, 17, 0); }, hud: [TXT('5:00', '#ff4d5e', 330, 120)], cam: towerCam(180) },
  // 16
  { ...SQ, light: 'dusk', vo: 'Six o\'clock.', tts: "Six o'clock.", update(W) { clock(W, 18, 0); }, hud: [TXT('6:00', '#ff4d5e', 330, 120)], cam: towerCam(180) },
  // 17
  { ...SQ, light: 'nightTown', vo: 'Midnight.', sfx: [{ type: 'chime', at: 0.1 }], update(W) { clock(W, 0, 0); }, hud: [TXT('12:00 AM', '#ff4d5e', 330, 110)], cam: towerCam(180) },
  // 18
  { ...DIN, vo: 'People started living on the ceiling.', setup(W) { inside(W); W.ceilHandlesVis(false); }, update(W, t) { ceilingFolk(W, t, [[MOM(W), -1.2, -4.2, 0.3, 'smile'], [W.chars.dad || W.chars.teacher, 1.4, -4.6, -0.3, 'smile']]); [MOM(W), W.chars.dad || W.chars.teacher].forEach(c => c.setPose(W.Poses.idle(t))); },
    cam: { from: { pos: [0, 1.5, -0.3], look: [0, 1.6, -4.5], fov: 62, roll: 180 }, to: { pos: [0, 1.5, -0.6], look: [0, 1.6, -4.5], fov: 62, roll: 180 }, sway: 0.3 } },
  // 19
  { vo: 'Sleeping on the ceiling.', set: 'bedroom', light: 'interiorNight', setup(W) { W.props.lamp.setOn(0); const b = W.props.bed; b.position.y = 3.3; b.rotation.z = PI; const r = RY(W); W.put(r, [2.45, 2.5, -0.8], 0); r.group.rotation.set(PI / 2, 0, 0); r.setFace('sleep'); W.props.blanket.position.set(0, 0.92, 0.45); W.props.blanket.scale.set(1, 1, 0.8); W.coolAt([1.6, 1.0, 0.2], 1.4); },
    update(W) { RY(W).setPose({}); }, cam: { from: { pos: [1.3, 0.6, 1.0], look: [2.45, 2.4, -1.8], fov: 50, roll: 180 }, to: { pos: [1.4, 0.65, 0.7], look: [2.45, 2.4, -1.8], fov: 50, roll: 180 }, sway: 0.2 } },
  // 20
  { ...DIN, vo: 'Cooking on the ceiling.', setup(W) { inside(W); W.ceilHandlesVis(false); W.hold(MOM(W), W.props.pan, 'wristR', [0, -0.2, 0.25], [0, 0, 0]); }, update(W, t) { inv(W, MOM(W), [-2.5, CEIL, -4.5], 0); MOM(W).setFace('smile'); MOM(W).setPose({ shoulderR: [-1.3, 0, 0], elbowR: [-0.4 + 0.2 * Math.sin(t * 6), 0, 0] }); },
    cam: front([-2.5, 0, -4.5], 0, 1.3, 3.0, 2.7, 46, 0, 0.3, 180) },
  // 21
  { ...DIN, vo: 'Milo was thrilled.', setup(W) { inside(W); }, update(W, t) { inv(W, MILO(W), [-2.5, CEIL, -4.5], 0); MILO(W).setFace('laugh'); MILO(W).setPose({ shoulderL: [0, 0, 2.4 + 0.3 * Math.sin(t * 9)], shoulderR: [0, 0, -2.4 - 0.3 * Math.sin(t * 9)] }); }, cam: front([-2.5, 0, -4.5], 0, 2.3, 2.6, 2.3, 44, 0, 0.3, 180) },
  // 22
  { ...DIN, vo: 'I was not.', setup(W) { inside(W); }, update(W, t) { inv(W, RY(W), [-2.5, CEIL, -4.5], 0); RY(W).setFace('unimpressed'); RY(W).setPose(W.Poses.idle(t)); }, cam: front([-2.5, 0, -4.5], 0, 1.4, 2.6, 2.3, 42, 0, 0.3, 180) },
  // 23
  { set: 'street', light: 'dusk', vo: 'Because I noticed something.', setup(W) { inv(W, RY(W), [0, 2.4, -2], 0); RY(W).setFace('worried'); }, update(W, t) { RY(W).setPose({ shoulderL: [-2.9, 0, 0], shoulderR: [-2.9, 0, 0], neck: [0.5, 0, 0] }); }, cam: front([0, 0, -2], 0, 1.1, 2.4, 2.1, 42, 0, 0.3, 180) },
  // 24
  { set: 'street', light: 'dusk', vo: 'Every hour, the sky below us got a little closer.', update(W, t, u) { W.clouds.position.y = -30 - 10 * u; }, hud: [{ type: 'badge', text: 'SKY: GETTING CLOSER', y: 300 }],
    cam: { from: { pos: [0, 1.5, 10], look: [0, 20, -40], fov: 56, roll: 180 }, to: { pos: [0, 1.5, 9], look: [0, 20, -40], fov: 56, roll: 180 }, sway: 0.3 } },
  // 25
  { set: 'street', light: 'dusk', vo: 'The clouds were reaching up.', sfx: [{ type: 'rumble', at: 0, dur: 2 }], setup(W) { W.clouds.position.y = -40; }, update(W, t, u) { W.cloudArms.forEach((a, i) => { a.group.visible = true; a.group.position.set(-14 + i * 14, 50 - 22 * ease(u), -30 - i * 6); a.group.rotation.set(PI, 0, 0.2 * (i - 1)); a.setGrip(0); }); },
    cam: { from: { pos: [0, 1.5, 12], look: [0, 20, -30], fov: 56, roll: 180 }, to: { pos: [0, 1.5, 11], look: [0, 18, -30], fov: 56, roll: 180 }, sway: 0.4 } },
  // 26
  { set: 'street', light: 'dusk', vo: 'Grabbing.', sfx: [{ type: 'clunk', at: 'u0.5' }], setup(W) { W.clouds.position.y = -40; }, update(W, t, u) { const a = W.cloudArms[1]; a.group.visible = true; a.group.position.set(-2, 6 + 17.5, -6.5); a.group.rotation.set(PI, 0, 0); a.setGrip(ease(clamp01(u * 1.6))); },
    cam: { from: { pos: [3, 1.2, 4], look: [-2, 5, -6.5], fov: 54, roll: 180 }, to: { pos: [2.8, 1.2, 3.5], look: [-2, 5, -6.5], fov: 54, roll: 180 }, sway: 0.5 } },
  // 27
  { set: 'street', light: 'dusk', vo: 'Pulling.', sfx: [{ type: 'ratchet', at: 0.1 }], setup(W) { W.clouds.position.y = -40; }, update(W, t, u) { const a = W.cloudArms[1], y = 4 * ease(u); a.group.visible = true; a.group.position.set(-2, 6 + 17.5 + y, -6.5); a.group.rotation.set(PI, 0, 0); a.setGrip(1); W.props.truck.position.y = y; },
    cam: { from: { pos: [3, 1.2, 4], look: [-2, 4, -6.5], fov: 54, roll: 180 }, to: { pos: [2.8, 1.2, 3.5], look: [-2, 5, -6.5], fov: 54, roll: 180 }, sway: 0.6 } },
  // 28
  { set: 'street', light: 'dusk', vo: 'The town was falling.', sfx: [{ type: 'rumble', at: 0, dur: 2 }], setup(W) { W.clouds.position.y = -40; }, update(W, t, u) { W.houses.forEach((h, i) => { if (Math.abs(h.z + 20) < 25) { h.group.position.y = ease(clamp01(u * 1.4 - (i % 4) * 0.1)) * (3 + (i % 3) * 2); h.group.rotation.x = 0.1 * Math.sin(i) * u; } }); },
    cam: { from: { pos: [0, 2, 8], look: [0, 6, -20], fov: 56, roll: 180 }, to: { pos: [0, 2, 7], look: [0, 8, -20], fov: 56, roll: 180 }, sway: 0.7 } },
  // 29
  { set: 'street', light: 'dusk', vo: 'Into the sky.', setup(W) { W.clouds.position.y = -40; }, update(W, t, u) { W.houses.forEach((h, i) => { if (Math.abs(h.z + 20) < 40) { h.group.position.y = 4 + ((i * 7) % 5) + 10 * u; h.group.rotation.x = 0.15 * Math.sin(i) * (1 + u); } }); W.cloudArms.forEach((a, i) => { a.group.visible = true; a.group.position.set(-14 + i * 14, 34, -30 - i * 6); a.group.rotation.set(PI, 0, 0.2 * (i - 1)); a.setGrip(0.5); }); },
    cam: { from: { pos: [20, 4, 25], look: [0, 12, -20], fov: 56, roll: 180 }, to: { pos: [18, 4, 22], look: [0, 14, -20], fov: 56, roll: 180 }, sway: 0.4 } },
  // 30
  { set: 'windmill', light: 'dusk', vo: 'I found the flip switch inside the old windmill.', setup(W) { RY(W).setFace('serious'); }, update(W, t) { W.millBlades.rotation.z = t * 0.6; W.put(RY(W), [0.6, 0.06, 8 - t * 1.6], PI); RY(W).setPose(W.Poses.run(t * 9)); },
    cam: { from: { pos: [3, 1.6, 14], look: [0, 6, -6], fov: 52 }, to: { pos: [3, 1.6, 13], look: [0, 6, -6], fov: 52 }, sway: 0.5 } },
  // 31
  { set: 'windmill', light: 'interiorNight', vo: 'It was stuck.', sfx: [{ type: 'clunk', at: 0.3 }, { type: 'clunk', at: 0.9 }], setup(W) { W.put(RY(W), [40.3, 0, -2.6], PI); RY(W).setFace('shout'); W.coolAt([40, 3, 0], 0.8); },
    update(W, t) { W.flipLever.rotation.x = 0.05 * Math.sin(t * 20); RY(W).setPose({ waist: [0.2, 0, 0], hipL: [-0.4, 0, 0], kneeL: [0.6, 0, 0] }); W.reach(RY(W), 'R', W.localPos(W.flipLever, [0, 0.92, 0])); W.reach(RY(W), 'L', W.localPos(W.flipLever, [0, 0.8, 0])); },
    cam: { from: { pos: [41.8, 2.2, -0.9], look: [40, 1.9, -3.6], fov: 48 }, to: { pos: [41.7, 2.15, -1.2], look: [40, 1.9, -3.6], fov: 48 }, sway: 0.5 } },
  // 32
  { set: 'windmill', light: 'interiorNight', vo: 'Someone had jammed it with a shoe.', setup(W) { W.coolAt([40, 3, 0], 0.8); W.put(W.props.miloShoe, W.localPos(W.flipPanel, [0, 1.1, 0.22]), PI / 2); W.props.miloShoe.group.rotation.z = PI / 2; },
    cam: { from: { pos: [40.4, 1.4, -2.3], look: [40, 1.3, -3.6], fov: 44 }, to: { pos: [40.35, 1.4, -2.5], look: [40, 1.3, -3.6], fov: 44 }, sway: 0.3, noDof: true } },
  // 33
  { set: 'windmill', light: 'interiorNight', vo: 'A tiny shoe.', setup(W) { W.coolAt([40, 3, 0], 0.8); W.put(W.props.miloShoe, W.localPos(W.flipPanel, [0, 1.1, 0.22]), PI / 2); W.props.miloShoe.group.rotation.z = PI / 2; }, hud: [TXT('TINY', '#ffd23a', 330, 100)],
    cam: { from: { pos: [40.1, 1.25, -3.0], look: [40, 1.15, -3.6], fov: 40 }, to: { pos: [40.1, 1.25, -3.1], look: [40, 1.15, -3.6], fov: 40 }, sway: 0.3, noDof: true } },
  // 34
  { set: 'windmill', light: 'interiorNight', vo: "Milo's shoe.", sfx: [{ type: 'boom', at: 0.1 }], setup(W) { W.coolAt([40, 3, 0], 0.8); W.put(MILO(W), [41.2, 0, 1.2], PI + 0.4); MILO(W).setFace('worried'); }, update(W, t) { MILO(W).setPose({ ...W.Poses.idle(t), neck: [0.3, 0, 0] }); },
    hud: [{ type: 'tag', text: 'Milo', char: 'theoDay', color: '#ffd23a' }], cam: { from: { pos: [40.2, 1.6, -1.6], look: [41.2, 1.0, 1.2], fov: 46 }, to: { pos: [40.25, 1.55, -1.4], look: [41.2, 1.0, 1.2], fov: 46 }, sway: 0.3 } },
  // 35
  { set: 'windmill', light: 'interiorNight', vo: '"I just wanted it to last longer," he said.', tts: 'I just wanted it to last longer, he said.', setup(W) { W.coolAt([40, 3, 0], 0.8); W.put(MILO(W), [40, 0, 0], 0); MILO(W).setFace('crying'); }, update(W, t) { MILO(W).setPose({ ...W.Poses.idle(t), neck: [0.25, 0, 0] }); },
    cam: front([40, 0, 0], 0, 1.4, 1.9, 1.7, 40) },
  // 36
  { set: 'windmill', light: 'interiorNight', vo: 'I pulled the shoe out.', sfx: [{ type: 'pop', at: 'u0.5' }], setup(W) { W.coolAt([40, 3, 0], 0.8); W.put(RY(W), [40.3, 0, -2.6], PI); RY(W).setFace('shout'); },
    update(W, t, u) { const out = u > 0.5; const sp = W.localPos(W.flipPanel, [0, 1.1, 0.22]); RY(W).setPose({ waist: [0.15, 0, 0] }); if (!out) { W.put(W.props.miloShoe, sp, PI / 2); W.props.miloShoe.group.rotation.z = PI / 2; W.reach(RY(W), 'R', sp); } else { RY(W).setFace('laugh'); W.hold(RY(W), W.props.miloShoe, 'wristR', [0, -0.2, 0], [0, 0, 0]); RY(W).setPose({ shoulderR: [-2.8, 0, 0.2] }); } },
    cam: { from: { pos: [41.8, 2.0, -0.9], look: [40, 1.6, -3.6], fov: 48 }, to: { pos: [41.7, 1.95, -1.2], look: [40, 1.6, -3.6], fov: 48 }, sway: 0.5 } },
  // 37
  { ...SQ, light: 'nightTown', vo: 'The world flipped back.', sfx: [{ type: 'whoosh', at: 0.1 }, { type: 'boom', at: 'u0.6' }], update(W, t, u) { W.grade.uniforms.flash.value = u > 0.55 && u < 0.65 ? 0.5 : 0; }, cam: (t, u) => ({ ...towerCam(180 * (1 - ease(clamp01(u * 1.4)))) }) },
  // 38
  { ...SQ, light: 'bright', vo: 'Everyone hit the ground.', sfx: [{ type: 'thuds', at: 'u0.35' }], update(W, t, u) { W.crowd.slice(0, 12).forEach((c, i) => { const a = i * 2.39, r = 3 + (i % 5) * 2.2, k = clamp01(u * 2.5); W.put(c, [Math.cos(a) * r, 0.12 + 3 * (1 - k) * (1 - k) + 0.25, 4 + Math.sin(a) * r], a); c.group.rotation.x = -PI / 2 * k; c.setFace(k >= 1 ? 'crying' : 'scared'); c.setPose({ shoulderL: [0, 0, 2.4], shoulderR: [0, 0, -2.4] }); }); },
    cam: { from: { pos: [7, 4, 20], look: [0, 0.8, 4], fov: 48 }, to: { pos: [6.5, 3.8, 19], look: [0, 0.8, 4], fov: 48 }, sway: 0.6 } },
  // 39
  { set: 'street', light: 'day', vo: 'Every Friday since, Milo keeps both shoes on.', setup(W) { W.put(MILO(W), [0, R0, -2], 0); MILO(W).setFace('smile'); }, update(W, t) { MILO(W).setPose({ ...W.Poses.idle(t), hipL: [-0.4 * Math.max(0, Math.sin(t * 4)), 0, 0], kneeL: [0.4 * Math.max(0, Math.sin(t * 4)), 0, 0] }); },
    hud: [{ type: 'badge', text: 'BOTH SHOES ON', kind: 'ok', y: 300 }], cam: { from: { pos: [0.6, 0.6, 0.6], look: [0, 0.35, -2], fov: 46 }, to: { pos: [0.6, 0.8, 0.4], look: [0, 0.7, -2], fov: 46 }, sway: 0.3 } },
  // 40
  { set: 'street', light: 'dusk', vo: "And the sky still looks at us... like it's hungry.", sfx: [{ type: 'rumble', at: 0.3, dur: 2 }], setup(W) { W.put(W.props.hungryCloud, [0, 48, -90], 0); },
    update(W, t, u) { W.props.hungryCloud.group.scale.setScalar(1 + 0.08 * u); }, cam: { from: { pos: [0, 2, 10], look: [0, 6, -40], fov: 50 }, to: { pos: [0, 2, 10], look: [0, 36, -90], fov: 46 }, sway: 0.3 } },
];
