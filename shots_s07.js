// STORY 07 — SHADOW SHIFT (clip pack, stories/07_shadow_shift.txt)
export const kit = ['cast4', 'mirror', 'shadow'];
const PI = Math.PI;
const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const front = (p, rot, eyeY, d0, d1, fov = 40, side = 0, sway = 0.4) => {
  const dx = Math.sin(rot), dz = Math.cos(rot), sx = Math.cos(rot), sz = -Math.sin(rot);
  const at = d => [p[0] + dx * d + sx * side, eyeY, p[2] + dz * d + sz * side];
  return { from: { pos: at(d0), look: [p[0], eyeY - 0.05, p[2]], fov }, to: { pos: at(d1), look: [p[0], eyeY - 0.03, p[2]], fov }, sway };
};
const RY = W => W.chars.ivy, LEO = W => W.chars.bo, TCH = W => W.chars.teacher, MOM = W => W.chars.mom, TWIN = W => W.chars.ryan2, SH = W => W.chars.shadowRyan;
const TXT = (text, color = '#ffffff', y = 330, size = 96) => ({ type: 'text', text, y, size, color });
const NIGHT = { set: 'street', light: 'night' };
const R0 = 0.06; // road surface
// Ryan in bed (lying on his back, head on the pillow)
const inBed = (W, face = 'sleep') => { W.props.lamp.setOn(0); const r = RY(W); W.put(r, [2.45, 0.8, -0.8], 0); r.group.rotation.set(-PI / 2, 0, 0); r.setFace(face); W.props.blanket.position.set(0, 0.92, 0.45); W.props.blanket.scale.set(1, 1, 0.8); W.coolAt([1.6, 2.3, 0.2], 1.4); };
const bedCam = { from: { pos: [1.3, 2.7, 0.6], look: [2.45, 0.9, -2.0], fov: 42 }, to: { pos: [1.5, 2.55, 0.1], look: [2.45, 0.9, -2.1], fov: 40 }, sway: 0.3 };
// the night crew: jobs 'sweep' | 'hammer' | 'paint' | 'walk'
const crew = (W, t, n = 14, job = 'mix', z0 = -10, spread = 1) => W.shadows.slice(0, n).forEach((c, i) => {
  const j = job === 'mix' ? ['sweep', 'hammer', 'paint', 'walk'][i % 4] : job;
  const x = ((i * 2.9) % 9 - 4.5) * spread, z = z0 - Math.floor(i / 3) * 3.2 * spread;
  if (j === 'sweep') { W.put(c, [x, R0, z], PI / 2 + i); c.setPose({ waist: [0.35, 0, 0], shoulderR: [-0.9, 0, 0.3 * Math.sin(t * 6 + i)], shoulderL: [-0.9, 0, 0], elbowR: [-0.5, 0, 0], elbowL: [-0.5, 0, 0] }); W.hold(c, W.props.brooms[i % 5], 'wristR', [0, -0.05, 0.05], [0.8, 0, 0]); }
  else if (j === 'hammer') { W.put(c, [x, R0, z], i); c.setPose({ hipsY: -0.5, waist: [0.6, 0, 0], hipL: [-1.6, 0, 0], kneeL: [2.2, 0, 0], hipR: [-0.6, 0, 0], kneeR: [2.2, 0, 0], shoulderR: [-1.6 - 0.8 * Math.max(0, Math.sin(t * 9 + i)), 0, 0] }); W.hold(c, W.props.hammers[i % 4], 'wristR', [0, -0.05, 0.05], [PI, 0, 0]); }
  else if (j === 'paint') { const fx = x < 0 ? -5.35 : 5.35; W.put(c, [fx, R0, z], x < 0 ? -PI / 2 : PI / 2); c.setPose({ shoulderR: [-1.3 - 0.5 * Math.sin(t * 5 + i), 0, 0], elbowR: [-0.3, 0, 0] }); W.hold(c, W.props.rollers[i % 4], 'wristR', [0, -0.05, 0.05], [PI, 0, 0]); }
  else { W.put(c, [x, R0, z - ((t * 1.4) % 6)], PI); c.setPose(W.Poses.walk(t * 6 + i, 0.5)); }
});
const shadowRyanLadder = (W, t, pos, rot, walking = true) => { const s = SH(W); W.put(s, pos, rot); W.hold(s, W.props.ladder, 'shoulderR', [0.1, 0.1, -0.2], [0, 0, PI / 2 - 0.25]); s.setPose({ ...(walking ? W.Poses.walk(t * 6, 0.5) : W.Poses.idle(t)), shoulderR: [-0.3, 0, 0.2], elbowR: [-1.6, 0, 0] }); };
// flat shadow lying on the floor from a character's feet (pointing away along -z by default)
const flat = (W, pos, dirY = 0) => { const f = W.chars.flatShadow; W.put(f, [pos[0], pos[1] + 0.012, pos[2]], dirY); f.group.rotation.x = -PI / 2; f.group.scale.set(1, 1, 0.02); f.setPose({}); return f; };

export const shots = [
  // 1
  { ...NIGHT, vo: 'In this town, shadows work the night shift.', update(W, t) { crew(W, t, 16, 'mix', -6); }, hud: [TXT('NIGHT SHIFT', '#9fb8ff', 330, 96)],
    cam: { from: { pos: [6, 6, 10], look: [0, 0.8, -12], fov: 50 }, to: { pos: [5, 5.4, 7], look: [0, 0.8, -12], fov: 50 }, sway: 0.3 } },
  // 2
  { vo: 'When we go to sleep, our shadows get up.', set: 'bedroom', light: 'interiorNight', setup(W) { inBed(W); },
    update(W, t, u) { const s = SH(W); W.put(s, [1.1, 0, -1.2 + 0], PI / 2); const k = ease(clamp01(u * 1.4)); s.group.rotation.z = (1 - k) * PI / 2; s.group.position.y = 0.0; s.setPose({ ...W.Poses.idle(t) }); },
    cam: { from: { pos: [-1.6, 2.3, 2.6], look: [1.8, 1.0, -1.4], fov: 48 }, to: { pos: [-1.4, 2.2, 2.2], look: [1.7, 1.1, -1.4], fov: 48 }, sway: 0.3 } },
  // 3
  { ...NIGHT, vo: 'They fix the roads.', sfx: [{ type: 'knock', at: 0.2 }, { type: 'knock', at: 0.7 }, { type: 'knock', at: 1.2 }], setup(W) { W.put(W.props.patches, [0, 0, 0], 0); }, update(W, t) { crew(W, t, 6, 'hammer', -8); },
    cam: { from: { pos: [1.5, 1.4, -3], look: [0, 0.4, -10], fov: 44 }, to: { pos: [1.2, 1.3, -4], look: [0, 0.4, -10], fov: 44 }, sway: 0.4 } },
  // 4
  { ...NIGHT, vo: 'Clean the streets.', sfx: [{ type: 'slide', at: 0.2 }], update(W, t) { crew(W, t, 6, 'sweep', -8); }, cam: { from: { pos: [-2, 1.2, -2], look: [0, 0.7, -12], fov: 44 }, to: { pos: [-1.6, 1.2, -3], look: [0, 0.7, -12], fov: 44 }, sway: 0.4 } },
  // 5
  { ...NIGHT, vo: 'Paint the fences.', update(W, t) { crew(W, t, 6, 'paint', -6); }, cam: { from: { pos: [2.5, 1.4, -1.5], look: [5.5, 0.8, -9], fov: 44 }, to: { pos: [2.6, 1.4, -2.5], look: [5.5, 0.8, -10], fov: 44 }, sway: 0.4 } },
  // 6
  { set: 'street', light: 'morning', vo: "That's why our town is always perfect in the morning.", sfx: [{ type: 'chime', at: 0.2 }], setup(W) { W.put(RY(W), [0, R0, -2], 0); RY(W).setFace('smile'); },
    update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderL: [0, 0, 1.2], shoulderR: [0, 0, -1.2] }); }, hud: [TXT('✨ PERFECT ✨', '#ffd23a', 330, 90)],
    cam: { from: { pos: [0, 2.4, 6], look: [0, 1.6, -6], fov: 50 }, to: { pos: [0, 2.2, 4.5], look: [0, 1.6, -6], fov: 50 }, sway: 0.3 } },
  // 7
  { ...NIGHT, vo: 'Nobody has ever seen them work.', setup(W) { for (const h of W.houses) h.windows.forEach(w => w.setLit(false)); }, update(W, t) { crew(W, t, 10, 'mix', -14); },
    cam: { from: { pos: [-3.5, 5, 2], look: [0, 1, -16], fov: 46 }, to: { pos: [-3.5, 5, 0], look: [0, 1, -16], fov: 46 }, sway: 0.3 } },
  // 8
  { vo: "You're not allowed to look.", set: 'bedroom', light: 'interiorNight', setup(W) { inBed(W, 'worried'); W.put(MOM(W), [1.2, 0, -0.9], PI / 2); MOM(W).setFace('serious'); },
    update(W, t) { MOM(W).setPose({ shoulderR: [-0.5, 0, -0.6], elbowR: [-1.8, 0, 0], wristR: [0, 0, 0.4 * Math.sin(t * 10)] }); }, hud: [{ type: 'badge', text: "DON'T LOOK", y: 300 }],
    cam: { from: { pos: [3.3, 2.4, 2.1], look: [1.4, 1.6, -0.9], fov: 56 }, to: { pos: [3.2, 2.35, 1.9], look: [1.4, 1.6, -0.9], fov: 56 }, sway: 0.3 } },
  // 9
  { vo: 'Not even once.', set: 'bedroom', light: 'interiorNight', setup(W) { inBed(W, 'worried'); }, update(W, t) { RY(W).setPose({ neck: [0, 0, 0.15 * Math.sin(t * 8)] }); }, hud: [TXT('NOT EVEN ONCE', '#ff4d5e', 330, 84)],
    cam: { from: { pos: [2.45, 2.3, 0.3], look: [2.45, 0.9, -2.2], fov: 38 }, to: { pos: [2.45, 2.2, 0.0], look: [2.45, 0.9, -2.2], fov: 36 }, sway: 0.2 } },
  // 10
  { vo: "But I couldn't sleep.", set: 'bedroom', light: 'interiorNight', sfx: [{ type: 'ticktock', at: 0 }], setup(W) { inBed(W, 'bored'); W.props.clock.setTime('2:47', 'AM'); }, cam: bedCam },
  // 11
  { vo: 'So I looked out my window.', set: 'bedroom', light: 'interiorNight', setup(W) { W.props.lamp.setOn(0); W.put(RY(W), [2.45, 0.62, -2.1], PI); RY(W).setFace('worried'); W.coolAt([2.45, 2.2, -3.6], 1.6); },
    update(W, t) { RY(W).setPose({ hipL: [-1.4, 0, 0], kneeL: [1.4, 0, 0], hipR: [-1.4, 0, 0], kneeR: [1.4, 0, 0], hipsY: -0.35, shoulderL: [-1.4, 0, -0.2], elbowL: [-1.2, 0, 0] }); },
    cam: { from: { pos: [0.6, 2.3, 1.6], look: [2.45, 1.7, -3.1], fov: 48 }, to: { pos: [0.8, 2.25, 1.2], look: [2.45, 1.7, -3.1], fov: 46 }, sway: 0.3 } },
  // 12
  { ...NIGHT, vo: 'Hundreds of shadows were working on Main Street.', update(W, t) { crew(W, t, 22, 'mix', 2, 1.6); }, hud: [TXT('MAIN STREET', '#9fb8ff', 330, 80)],
    cam: { from: { pos: [-2.5, 9, 10], look: [0, 0, -12], fov: 50 }, to: { pos: [-2.5, 8.6, 8], look: [0, 0, -13], fov: 50 }, sway: 0.2 } },
  // 13
  { ...NIGHT, vo: 'Tall ones. Small ones.', setup(W) { const a = W.shadows[3], b = W.shadows[4]; W.put(a, [-0.9, R0, -4], 0.2); W.put(b, [0.9, R0, -4], -0.2); a.group.scale.setScalar(1.25); b.group.scale.setScalar(0.85); },
    update(W, t, u) { W.shadows[3].setPose(W.Poses.idle(t)); W.shadows[4].setPose(W.Poses.idle(t + 1)); }, hud: [(t, u) => [{ type: 'text', text: 'TALL', x: 330, y: 330, size: 80, color: '#9fb8ff' }, ...(u > 0.45 ? [{ type: 'text', text: 'SMALL', x: 700, y: 330, size: 80, color: '#ffd23a' }] : [])]],
    cam: { from: { pos: [0, 1.6, 2.2], look: [0, 1.6, -4], fov: 48 }, to: { pos: [0, 1.5, 1.6], look: [0, 1.5, -4], fov: 48 }, sway: 0.3 } },
  // 14
  { ...NIGHT, vo: 'Mine was there too.', update(W, t) { crew(W, t, 10, 'mix', -10); shadowRyanLadder(W, t, [0.6, R0, -4], 0, false); }, hud: [{ type: 'tag', text: 'MY SHADOW', char: 'shadowRyan', color: '#9fb8ff' }],
    cam: { from: { pos: [1.5, 3.2, 3.6], look: [0.6, 1.4, -4], fov: 46 }, to: { pos: [1.4, 3.0, 2.6], look: [0.6, 1.4, -4], fov: 46 }, sway: 0.3 } },
  // 15
  { ...NIGHT, vo: 'I recognized its messy hair.', update(W, t) { shadowRyanLadder(W, t, [0, R0, -4], 0, false); }, cam: front([0, 0, -4], 0, 2.05, 1.9, 1.6, 40) },
  // 16
  { ...NIGHT, vo: 'It was carrying a ladder.', update(W, t) { shadowRyanLadder(W, t, [-2 + t * 1.3, R0, -4], PI / 2); },
    cam: (t) => ({ from: { pos: [-2 + t * 1.3, 1.6, 0.5], look: [-2 + t * 1.3, 1.4, -4], fov: 46 }, sway: 0.4 }) },
  // 17
  { ...NIGHT, vo: 'Then it stopped.', sfx: [{ type: 'silence', at: 0 }], update(W, t) { shadowRyanLadder(W, t, [0, R0, -4], PI / 2, false); }, cam: { from: { pos: [0, 1.6, 0.6], look: [0, 1.4, -4], fov: 44 }, to: { pos: [0, 1.6, 0.2], look: [0, 1.4, -4], fov: 44 }, sway: 0.2 } },
  // 18
  { ...NIGHT, vo: 'And turned around.', update(W, t, u) { shadowRyanLadder(W, t, [0, R0, -4], PI / 2 - PI / 2 * ease(clamp01(u * 1.3)) - PI, false); }, cam: { from: { pos: [0, 1.6, 0.2], look: [0, 1.5, -4], fov: 42 }, to: { pos: [0, 1.6, 0.0], look: [0, 1.5, -4], fov: 42 }, sway: 0.2 } },
  // 19
  { ...NIGHT, vo: 'And looked straight at my window.', sfx: [{ type: 'buzz', at: 0.1 }], update(W, t) { shadowRyanLadder(W, t, [0, R0, -4], 0, false); SH(W).setPose({ neck: [-0.35, 0, 0], shoulderR: [-0.3, 0, 0.2], elbowR: [-1.6, 0, 0] }); },
    cam: { from: { pos: [0, 2.6, -2.2], look: [0, 2.0, -4], fov: 40 }, to: { pos: [0, 2.6, -2.5], look: [0, 2.05, -4], fov: 38 }, sway: 0.2, noDof: true } },
  // 20
  { vo: 'I hid under my blanket.', set: 'bedroom', light: 'interiorDark', sfx: [{ type: 'slide', at: 0.1 }], setup(W) { inBed(W, 'scared'); RY(W).group.position.y = 0.55; RY(W).group.position.z = -0.4; W.props.blanket.position.set(0, 1.0, 0.15); W.props.blanket.scale.set(1, 3.5, 1.5); },
    update(W, t) { W.props.blanket.position.x = 0.02 * Math.sin(t * 40); }, cam: { from: { pos: [1.0, 2.1, 0.9], look: [2.45, 0.9, -1.75], fov: 46 }, to: { pos: [1.1, 2.0, 0.6], look: [2.45, 0.9, -1.75], fov: 44 }, sway: 0.4 } },
  // 21
  { set: 'street', light: 'morning', vo: 'In the morning, everything was normal.', sfx: [{ type: 'chime', at: 0.1 }], cam: { from: { pos: [-3, 2.0, 12], look: [0, 2.5, -20], fov: 50 }, to: { pos: [-3, 2.0, 10], look: [0, 2.5, -20], fov: 50 }, sway: 0.3 } },
  // 22
  { set: 'street', light: 'morning', vo: 'Except my shadow was gone.', setup(W) { W.setCastShadow(RY(W), false); W.put(RY(W), [-0.8, R0, -2], 0); RY(W).setFace('surprised'); W.put(LEO(W), [1.2, R0, -2], 0); LEO(W).setFace('smile'); },
    update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), neck: [0.5, 0, 0] }); LEO(W).setPose(W.Poses.idle(t + 1)); }, hud: [{ type: 'counter', label: 'SHADOW', value: '0', color: '#ff4d5e' }],
    cam: { from: { pos: [0.2, 3.0, 4.2], look: [0.2, 0.6, -1.2], fov: 48 }, to: { pos: [0.2, 2.9, 3.8], look: [0.2, 0.6, -1.2], fov: 48 }, sway: 0.3 } },
  // 23
  { set: 'street', light: 'morning', vo: 'I stood in the sun.', setup(W) { W.setCastShadow(RY(W), false); W.put(RY(W), [0, R0, -2], 0); RY(W).setFace('worried'); }, update(W, t) { RY(W).setPose({ shoulderL: [0, 0, 1.4], shoulderR: [0, 0, -1.4] }); },
    cam: { from: { pos: [3.5, 3.5, 3.5], look: [0, 0.9, -2], fov: 46 }, to: { pos: [3.2, 3.3, 3.0], look: [0, 0.9, -2], fov: 46 }, sway: 0.3 } },
  // 24
  { set: 'street', light: 'morning', vo: 'Nothing on the ground.', setup(W) { W.setCastShadow(RY(W), false); W.put(RY(W), [0, R0, -2], 0); }, update(W, t) { RY(W).setPose({ shoulderL: [0, 0, 1.4], shoulderR: [0, 0, -1.4] }); },
    hud: [TXT('???', '#ffd23a', 330, 110)], cam: { from: { pos: [2.4, 1.6, -0.4], look: [0, 0.1, -2.2], fov: 48 }, to: { pos: [2.2, 1.5, -0.6], look: [0, 0.1, -2.2], fov: 48 }, sway: 0.3, noDof: true } },
  // 25
  { set: 'street', light: 'morning', vo: 'I asked my friend Leo.', setup(W) { W.setCastShadow(RY(W), false); W.put(RY(W), [-0.7, R0, -2], 0.5); RY(W).setFace('worried'); W.put(LEO(W), [0.8, R0, -2], -0.5); LEO(W).setFace('smile'); },
    update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderR: [-0.8, 0, 0.3], elbowR: [-1.2, 0, 0] }); LEO(W).setPose(W.Poses.idle(t)); }, hud: [{ type: 'tag', text: 'Leo', char: 'bo', color: '#ffb05a' }],
    cam: front([0, 0, -2], 0, 1.4, 3.4, 3.0, 42) },
  // 26
  { set: 'street', light: 'morning', vo: 'His shadow was fine.', setup(W) { W.put(LEO(W), [0, R0, -2], 0); LEO(W).setFace('laugh'); }, update(W, t) { LEO(W).setPose({ shoulderL: [0, 0, 2.6 + 0.3 * Math.sin(t * 8)], shoulderR: [0, 0, -1.2] }); },
    hud: [{ type: 'badge', text: 'SHADOW: OK', kind: 'ok', y: 300 }], cam: { from: { pos: [0.4, 3.6, 3.4], look: [0, 0.2, -0.6], fov: 46 }, to: { pos: [0.4, 3.4, 3.0], look: [0, 0.2, -0.6], fov: 46 }, sway: 0.3 } },
  // 27
  { vo: 'At school, my teacher pointed at the floor where my shadow should be.', set: 'classroom', light: 'bright', setup(W) { W.setCastShadow(RY(W), false); W.put(RY(W), [1.2, 0, -4.2], -0.3); RY(W).setFace('worried'); W.put(TCH(W), [-0.6, 0, -4.4], PI / 2 - 0.3); TCH(W).setFace('surprised'); },
    update(W, t) { RY(W).setPose(W.Poses.idle(t)); TCH(W).setPose({ shoulderR: [-0.7, 0, 0.1], elbowR: [-0.2, 0, 0], waist: [0.2, 0, 0], neck: [0.4, 0, 0] }); },
    cam: { from: { pos: [0.3, 2.6, 0.0], look: [0.3, 0.8, -4.4], fov: 58 }, to: { pos: [0.3, 2.5, -0.4], look: [0.3, 0.8, -4.4], fov: 58 }, sway: 0.3 } },
  // 28
  { vo: 'And went very pale.', set: 'classroom', light: 'bright', setup(W) { W.put(TCH(W), [0, 0, 3.0], 0); TCH(W).setFace('scared'); }, update(W, t, u) { TCH(W).setPose(W.Poses.idle(t)); W.grade.uniforms.sat.value = 1.12 - 0.7 * u; },
    cam: front([0, 0, 3.0], 0, 2.1, 3.4, 3.0, 40) },
  // 29
  { vo: '"It quit," she whispered.', tts: 'It quit, she whispered.', set: 'classroom', light: 'bright', setup(W) { W.put(TCH(W), [0, 0, 3.0], 0); TCH(W).setFace('worried'); W.grade.uniforms.sat.value = 0.6; },
    update(W, t) { TCH(W).setPose({ ...W.Poses.idle(t), shoulderL: [-1.6, 0, -0.3], elbowL: [-1.8, 0, 0], waist: [0.15, 0, 0] }); }, hud: [{ type: 'text', text: 'it quit.', y: 330, size: 80, color: '#cfd6e6' }], cam: front([0, 0, 3.0], 0, 2.15, 2.6, 2.3, 40) },
  // 30
  { vo: '"Shadows only quit when they find a better person."', tts: 'Shadows only quit when they find a better person.', set: 'classroom', light: 'bright', setup(W) { W.put(TCH(W), [0, 0, 3.0], 0); TCH(W).setFace('serious'); W.grade.uniforms.sat.value = 0.6; },
    update(W, t) { TCH(W).setPose(W.Poses.idle(t)); }, hud: [{ type: 'badge', text: 'BETTER PERSON', y: 300 }], cam: front([0, 0, 3.0], 0, 2.1, 3.2, 2.7, 40) },
  // 31
  { ...NIGHT, vo: 'That night, I followed the shadows.', sfx: [{ type: 'steps', at: 0.1, n: 5, every: 0.4 }], setup(W) { RY(W).setFace('worried'); },
    update(W, t) { W.shadows.slice(0, 6).forEach((c, i) => { W.put(c, [-0.8 + (i % 2) * 1.6, R0, -6 - i * 1.6 - t * 1.4], PI); c.setPose(W.Poses.walk(t * 6 + i, 0.5)); }); W.put(RY(W), [0.3, R0, -1 - t * 1.4], PI); RY(W).setPose({ ...W.Poses.walk(t * 6, 0.3), waist: [0.35, 0, 0], hipsY: -0.15 }); },
    cam: (t) => ({ from: { pos: [1.4, 1.8, 3 - t * 1.4], look: [0, 1.2, -8 - t * 1.4], fov: 48 }, sway: 0.5 }) },
  // 32
  { set: 'factory', light: 'night', moonDir: [0.3, 0.8, 1], vo: 'To the old factory.', setup(W) { W.coolAt([60, 12, 30], 1.5); }, sfx: [{ type: 'wind', at: 0 }], update(W, t) { W.put(RY(W), [60, 0, 30], PI); RY(W).setPose(W.Poses.idle(t)); },
    cam: { from: { pos: [66, 3, 54], look: [60, 9, 0], fov: 50 }, to: { pos: [65, 2.8, 50], look: [60, 10, 0], fov: 50 }, sway: 0.3 } },
  // 33
  { set: 'factory', light: 'interiorDark', vo: 'Where they sleep during the day.', setup(W) { W.factoryLight.intensity = 30; W.coolAt([0, 5, 4], 1.5); },
    update(W, t) { W.shadows.slice(0, 18).forEach((c, i) => { W.put(c, [-7.5 + (i % 6) * 3, 0.32, -8 + Math.floor(i / 6) * 4.5], 0); c.group.rotation.x = -PI / 2; c.setPose({ neck: [0.05 * Math.sin(t * 2 + i), 0, 0] }); }); }, sfx: [{ type: 'silence', at: 0 }],
    cam: { from: { pos: [0, 6, 12], look: [0, 0, -3], fov: 50 }, to: { pos: [0, 5.6, 10], look: [0, 0, -3], fov: 50 }, sway: 0.2 } },
  // 34
  { set: 'factory', light: 'interiorDark', vo: 'And there it was. My shadow.', setup(W) { W.factoryLight.intensity = 30; W.coolAt([0, 5, 4], 1.5); W.put(SH(W), [0, 0.1, -10], 0); W.put(RY(W), [-1.6, 0.1, 6], PI); RY(W).setFace('surprised'); },
    update(W, t) { SH(W).setPose(W.Poses.idle(t)); RY(W).setPose(W.Poses.idle(t)); }, hud: [{ type: 'tag', text: 'MY SHADOW', char: 'shadowRyan', color: '#9fb8ff' }],
    cam: { from: { pos: [1.6, 2.0, 9], look: [0, 1.4, -10], fov: 44 }, to: { pos: [1.4, 1.9, 7.8], look: [0, 1.4, -10], fov: 40 }, sway: 0.3 } },
  // 35
  { set: 'factory', light: 'interiorDark', vo: 'Attached to someone else.', sfx: [{ type: 'boom', at: 0.2 }], setup(W) { W.factoryLight.intensity = 30; W.coolAt([0, 5, -4], 2.2); W.put(TWIN(W), [0, 0.1, -10], PI); TWIN(W).setFace('neutral'); flat(W, [0, 0.1, -10], PI); },
    update(W, t) { TWIN(W).setPose(W.Poses.idle(t)); }, cam: { from: { pos: [3.8, 3.0, -9.2], look: [0, 0.5, -11.2], fov: 48 }, to: { pos: [3.6, 2.8, -9.6], look: [0, 0.5, -11.2], fov: 48 }, sway: 0.3 } },
  // 36
  { set: 'factory', light: 'interiorDark', vo: 'A boy who looked just like me.', setup(W) { W.factoryLight.intensity = 30; W.coolAt([0, 4, -6], 2.2); W.put(TWIN(W), [0, 0.1, -10], 0); TWIN(W).setFace('blankSmile'); flat(W, [0, 0.1, -10], PI); },
    update(W, t, u) { TWIN(W).group.rotation.y = PI * (1 - ease(clamp01(u * 1.5))); TWIN(W).setPose(W.Poses.idle(t)); }, cam: front([0, 0, -10], 0, 2.0, 3.2, 2.8, 40) },
  // 37
  { set: 'factory', light: 'interiorDark', vo: 'Same hoodie. Same messy hair.', setup(W) { W.factoryLight.intensity = 30; W.coolAt([0, 4, -6], 2.2); W.put(TWIN(W), [0.75, 0.1, -9], -PI / 2 + 0.3); TWIN(W).setFace('blankSmile'); W.put(RY(W), [-0.75, 0.1, -9], PI / 2 - 0.3); RY(W).setFace('scared'); },
    update(W, t) { TWIN(W).setPose(W.Poses.idle(t)); RY(W).setPose(W.Poses.idle(t + 1)); }, hud: [(t, u) => [{ type: 'text', text: 'SAME HOODIE', y: 300, size: 70, color: '#c9a0ff' }, ...(u > 0.45 ? [{ type: 'text', text: 'SAME HAIR', y: 390, size: 70, color: '#ffd23a' }] : [])]],
    cam: front([0, 0, -9], 0, 1.95, 3.6, 3.2, 42) },
  // 38
  { set: 'factory', light: 'interiorDark', vo: 'He smiled at me.', setup(W) { W.factoryLight.intensity = 30; W.coolAt([0, 4, -6], 2.2); W.put(TWIN(W), [0, 0.1, -10], 0); TWIN(W).setFace('creepy'); flat(W, [0, 0.1, -10], PI); }, update(W, t) { TWIN(W).setPose(W.Poses.idle(t)); },
    cam: front([0, 0, -10], 0, 2.0, 2.0, 1.6, 38) },
  // 39
  { set: 'factory', light: 'interiorDark', vo: '"Thanks for the shadow," he said.', tts: 'Thanks for the shadow, he said.', setup(W) { W.factoryLight.intensity = 30; W.coolAt([0, 4, -6], 2.2); W.put(TWIN(W), [0, 0.1, -10], 0); TWIN(W).setFace('smirk'); flat(W, [0, 0.1, -10], PI); },
    update(W, t) { TWIN(W).setPose({ ...W.Poses.idle(t), shoulderR: [-1.2, 0, 0.3], elbowR: [-0.6, 0, 0] }); }, cam: front([0, 0, -10], 0, 1.8, 3.0, 2.6, 40) },
  // 40
  { set: 'factory', light: 'interiorDark', vo: '"Now I just need the rest of you."', tts: 'Now I just need the rest of you.', sfx: [{ type: 'steps', at: 0.2, n: 4, every: 0.5 }, { type: 'boom', at: 'end-0.6' }], setup(W) { W.factoryLight.intensity = 30; W.coolAt([0, 4, -6], 2.2); TWIN(W).setFace('creepy'); },
    update(W, t, u) { const z = -10 + 3.5 * u; W.put(TWIN(W), [0, 0.1, z], 0); flat(W, [0, 0.1, z], PI); TWIN(W).setPose({ ...W.Poses.walk(t * 4, 0.35), shoulderR: [-1.5, 0, 0], shoulderL: [-1.5, 0, 0] }); W.grade.uniforms.dark.value = u > 0.9 ? (u - 0.9) * 8 : 0; },
    cam: { from: { pos: [0, 1.9, -3.5], look: [0, 1.7, -10], fov: 42 }, to: { pos: [0, 1.85, -3.8], look: [0, 1.8, -8], fov: 40 }, sway: 0.5 } },
];
