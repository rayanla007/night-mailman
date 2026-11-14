// THE NIGHT MAILMAN (v2): shot list. Edit freely, then run ./build.sh
//
// Each shot:
//   vo       caption / voiceover line ('' = no words)      tts: spoken text if different (numbers)
//   whisper  true = whispered line                          dur / extra: fixed length / extra hold (s)
//   music    'day' | 'tense' | 'night' | 'dread' | 'chase' | 'relief' | 'creepy' | 'outro' | 'none'
//   sfx      [{ type, at }]  types: tick click slide steps run chime whoosh wind silence growl creak buzz boom pop
//   hud      game-style overlays: {type:'counter'|'badge'|'tag'|'text', ...}, optional from/to (0..1 of shot)
//   set      'street' | 'bedroom' | 'hallway'      light: day night townFinal dusk interiorNight interiorDark morning
//   cam      { from:{pos,look,fov}, to:{...}, ease, sway }  or  (t, u, W) => spec
//   setup(W) / update(W, t, u)
//
// Coordinates: STREET  road along z at x=0; Mia's house x=-12,z=0 (front x=-8.5, fence x=-5.75 with a gap at z=-0.9..0.9);
//              Pell's house z=10; truck at (-2,0,-6.5); mailbox (-5.2,0,-1.6).
//              BEDROOM back wall z=-3.1, window above bed (x 1.7..3.2, y 1.35..2.75), bed x 1.5..3.4, lamp (0.7,0.62,-2.68),
//                      door in left wall x=-3.6, z=1.5.   HALLWAY x -1.3..1.3, z -8..6, front door z=-8.1.
const PI = Math.PI;
const SWITCH = [0.7, 0.69, -2.53];
const ease = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const clamp01 = x => Math.max(0, Math.min(1, x));

// ---------- reusable setups ----------
const allLit = W => { for (const h of W.houses) h.windows.forEach((w, i) => w.setLit(!(h === W.figureHouse && i === 2))); W.farDarkGlass.material = W.GLASS_LIT; };
const theoAtLamp = (W, x = 0.25, z = -1.95) => { W.put(W.chars.theo, [x, 0, z], PI); };
const holdPaper = (W, who, prop, off = [0, 0.32, 0.64], tilt = -0.3) => W.hold(who, prop, 'waist', off, [tilt, 0, 0]);
const paperHands = (W, who, prop, y = -0.3) => {
  W.reach(who, 'L', W.localPos(prop, [0.2, y - 0.06, -0.08]));
  W.reach(who, 'R', W.localPos(prop, [-0.2, y - 0.06, -0.08]));
};
const paperCam = (y0, y1, d0, d1, x = 0) => (t, u, W) => {
  const P = W.props.__paper;
  return { from: { pos: W.localPos(P, [x, y0 - 0.04, d0]), look: W.localPos(P, [x, y0 - 0.1, 0]), fov: 38 },
           to: { pos: W.localPos(P, [x, y1 - 0.04, d1]), look: W.localPos(P, [x, y1 - 0.1, 0]), fov: 36 }, ease: 'out', sway: 0.3 };
};
const LIGHTS = (value, color = '#ffe14a', extra = {}) => ({ type: 'counter', label: 'LIGHTS ON AT MIDNIGHT', value, color, ...extra });

export const shots = [
  // ================= DAY: the setup =================
  // 1
  { vo: 'My town has 412 houses.', tts: 'My town has four hundred and twelve houses.', set: 'street', light: 'day', music: 'day', sfx: [{ type: 'whoosh', at: 0 }],
    hud: [{ type: 'counter', label: 'HOLLOW CREEK', value: '412 HOUSES', from: 0.35 }],
    cam: { from: { pos: [34, 52, 52], look: [0, 0, -12], fov: 40 }, to: { pos: [26, 40, 38], look: [0, 0, -12], fov: 40 }, sway: 0.2 } },
  // 2
  { vo: 'And at midnight, every single one has a light on.', set: 'street', light: 'townFinal', music: 'day',
    setup(W) { allLit(W); },
    hud: [LIGHTS('412 / 412', '#ffe14a', { from: 0.25 })],
    cam: { from: { pos: [26, 40, 38], look: [0, 0, -12], fov: 40 }, to: { pos: [20, 32, 28], look: [0, 0, -14], fov: 40 }, sway: 0.2 } },
  // 3
  { vo: "Not because we're scared of the dark.", set: 'street', light: 'day', music: 'day',
    setup(W) { W.put(W.chars.mia, [-6.6, 0, 0.0], PI / 2); W.chars.mia.setFace('smirk'); },
    update(W, t) { W.chars.mia.setPose({ ...W.Poses.idle(t), shoulderR: [0, 0, -0.5], elbowR: [-2.0, 0, 0], shoulderL: [0, 0, 0.5], elbowL: [-2.0, 0, 0], neck: [0, -0.15, 0.08] }); },
    cam: { from: { pos: [-4.4, 1.7, 0.55], look: [-6.6, 1.6, 0.0], fov: 38 }, to: { pos: [-4.7, 1.68, 0.45], look: [-6.6, 1.62, 0.0], fov: 37 }, sway: 0.6 } },
  // 4
  { vo: 'Because of what delivers the mail.', whisper: true, set: 'street', light: 'day', music: 'none', sfx: [{ type: 'pop', at: 'u0.45' }, { type: 'boom', at: 'u0.45' }],
    update(W, t, u) { W.props.mailbox.setFlag(1.5 * (1 - clamp01((u - 0.4) / 0.12))); W.grade.uniforms.sat.value = 1.12 - 0.5 * clamp01((u - 0.4) / 0.2); },
    cam: { from: { pos: [-3.3, 0.55, 0.2], look: [-5.3, 1.25, -1.8], fov: 40 }, to: { pos: [-3.6, 0.6, -0.1], look: [-5.3, 1.28, -1.8], fov: 38 }, sway: 0.5 } },
  // 5
  { vo: 'We moved in on a Tuesday.', set: 'street', light: 'day', music: 'day',
    setup(W) {
      const m = W.chars.mia; W.put(m, [-4.55, 0, -5], 0); W.hold(m, W.props.heldBox, 'waist', [0, 0.18, 0.47]); m.setFace('smile');
      W.put(W.chars.dog, [-3.85, 0, -4.4], 0);
    },
    update(W, t, u) {
      const m = W.chars.mia; m.group.position.z = -5 + 2.6 * u;
      m.setPose({ ...W.Poses.walk(t * 7, 0.45), shoulderL: [-1.0, 0, -0.35], shoulderR: [-1.0, 0, 0.35], elbowL: [-0.55, 0, 0], elbowR: [-0.55, 0, 0] });
      const d = W.chars.dog; d.group.position.z = -4.4 + 2.6 * u; d.group.position.y = Math.abs(Math.sin(t * 9)) * 0.12; d.setPose({ t, walk: 1, wag: 1 });
    },
    cam: { from: { pos: [-3.2, 1.55, 2.6], look: [-4.4, 1.0, -4.0], fov: 46 }, to: { pos: [-3.3, 1.5, 2.2], look: [-4.4, 1.0, -2.5], fov: 44 }, sway: 1.2 } },
  // 6
  { vo: 'Me, my little brother Theo...', set: 'street', light: 'day', music: 'day',
    setup(W) { W.put(W.chars.theoDay, [-6.5, 0, -0.3], PI / 2); W.chars.theoDay.setFace('laugh'); },
    hud: [{ type: 'tag', text: 'Theo, 7', char: 'theoDay', color: '#ffd23a', from: 0.15 }],
    update(W, t) { W.chars.theoDay.setPose({ ...W.Poses.idle(t), shoulderR: [0, 0, -2.7 - 0.35 * Math.sin(t * 12)], elbowR: [0, 0, -0.4 * Math.sin(t * 12 + 1)], hipsY: Math.abs(Math.sin(t * 6)) * 0.05 }); },
    cam: { from: { pos: [-4.4, 1.2, 0.5], look: [-6.5, 1.0, -0.3], fov: 40 }, to: { pos: [-4.7, 1.15, 0.35], look: [-6.5, 1.0, -0.3], fov: 39 }, sway: 0.8 } },
  // 7
  { vo: "...and Biscuit, the world's worst guard dog.", set: 'street', light: 'day', music: 'day', sfx: [{ type: 'pop', at: 'u0.6' }],
    setup(W) { W.put(W.chars.dog, [-6.3, 0, 0.3], PI / 2 + 0.3); },
    hud: [{ type: 'tag', text: 'Biscuit', char: 'dog', color: '#ff9b4a', from: 0.1 }],
    update(W, t, u) { const flip = u > 0.6; W.chars.dog.group.rotation.z = flip ? -PI * 0.9 * clamp01((u - 0.6) / 0.12) : 0; W.chars.dog.group.position.y = flip ? 0.42 * clamp01((u - 0.6) / 0.12) : 0; W.chars.dog.setPose({ t, wag: 1, headTilt: 0.3 * Math.sin(t * 4), sit: flip ? 0 : 1 }); },
    cam: { from: { pos: [-4.0, 0.95, 1.5], look: [-6.3, 0.65, 0.3], fov: 42 }, to: { pos: [-4.25, 0.92, 1.35], look: [-6.3, 0.62, 0.3], fov: 42 }, sway: 0.6 } },
  // 8
  { vo: "Our neighbor, Mr. Pell, didn't say hello.", set: 'street', light: 'day', music: 'day',
    setup(W) { W.put(W.chars.pell, [-6.5, 0, 8.2], PI / 2 + 0.3); },
    hud: [{ type: 'tag', text: 'Mr. Pell', char: 'pell', color: '#ff7a7a', from: 0.2 }],
    update(W, t) { W.chars.pell.setPose({ ...W.Poses.idle(t), shoulderL: [0, 0, 0.5], elbowL: [-2.0, 0, 0], shoulderR: [0, 0, -0.5], elbowR: [-2.0, 0, 0] }); },
    cam: { from: { pos: [-3.7, 1.25, 6.9], look: [-6.5, 1.85, 8.2], fov: 38 }, to: { pos: [-3.95, 1.3, 7.0], look: [-6.5, 1.9, 8.2], fov: 36 }, sway: 0.5 } },
  // 9
  { vo: 'He just pointed at our windows...', set: 'street', light: 'day', music: 'tense',
    setup(W) { W.put(W.chars.pell, [-6.5, 0, 8.2], 2.21); },
    update(W, t, u) { const p = W.chars.pell; p.setPose(W.Poses.idle(t)); const k = clamp01(u / 0.3); W.reach(p, 'L', [-6.5 - 2 * k, 1.3 + 3 * k, 8.2 - 6 * k]); },
    cam: { from: { pos: [-4.5, 0.8, 6.7], look: [-6.5, 2.0, 8.2], fov: 46 }, to: { pos: [-4.7, 0.85, 6.85], look: [-6.5, 2.05, 8.2], fov: 44 }, sway: 0.4 } },
  // 10
  { vo: "...and said, 'Keep one on. Always.'", tts: 'and said, keep one on. Always.', whisper: true, set: 'street', light: 'day', music: 'tense',
    setup(W) { W.put(W.chars.pell, [-6.5, 0, 8.2], 2.21); W.grade.uniforms.strength.value = 0.85; },
    update(W, t) { W.chars.pell.setPose({ ...W.Poses.idle(t), neck: [0.12, 0, 0], waist: [0.08, 0, 0] }); },
    cam: { from: { pos: [-4.6, 1.8, 6.75], look: [-6.5, 1.95, 8.2], fov: 40 }, to: { pos: [-4.9, 1.85, 7.0], look: [-6.5, 1.97, 8.2], fov: 39 }, sway: 0.3 } },
  // 11
  { vo: 'Theo laughed. Theo laughs at everything.', set: 'street', light: 'day', music: 'day',
    setup(W) {
      W.put(W.chars.theoDay, [-6.5, 0, -0.4], PI / 2 + 0.2); W.chars.theoDay.setFace('laugh');
      W.put(W.chars.mia, [-6.75, 0, 0.7], PI / 2 - 0.2); W.chars.mia.setFace('unimpressed');
    },
    update(W, t) {
      W.chars.theoDay.setPose({ ...W.Poses.idle(t), hipsY: Math.abs(Math.sin(t * 10)) * 0.06, waist: [0.15 + 0.1 * Math.sin(t * 10), 0, 0], shoulderL: [0, 0, 0.6], shoulderR: [0, 0, -0.6], elbowL: [-1.8, 0, 0], elbowR: [-1.8, 0, 0] });
      W.chars.mia.setPose({ ...W.Poses.idle(t), shoulderR: [0, 0, -0.5], elbowR: [-2.0, 0, 0], shoulderL: [0, 0, 0.5], elbowL: [-2.0, 0, 0] });
    },
    cam: { from: { pos: [-3.5, 1.4, 0.4], look: [-6.6, 1.15, 0.15], fov: 46 }, to: { pos: [-3.75, 1.38, 0.35], look: [-6.6, 1.15, 0.15], fov: 45 }, sway: 0.7 } },

  // ================= NIGHT 1: the rules =================
  // 12
  { vo: 'That night, I found the town rules taped inside our mailbox.', set: 'street', light: 'night', music: 'tense', sfx: [{ type: 'creak', at: 'u0.3', short: true }],
    setup(W) { const m = W.chars.mia; W.put(m, [-4.25, 0, -1.55], -PI / 2); m.setFace('worried'); W.coolAt([-3.6, 2.2, -0.6], 3); },
    update(W, t, u) { const m = W.chars.mia; m.setPose(W.Poses.idle(t)); W.props.mailbox.setDoor(1.3 * clamp01((u - 0.25) / 0.25)); W.reach(m, 'R', [-4.85, 1.2 - 0.15 * clamp01((u - 0.25) / 0.25), -1.7]); },
    cam: { from: { pos: [-5.4, 1.55, 0.6], look: [-4.6, 1.3, -1.5], fov: 44 }, to: { pos: [-5.4, 1.52, 0.3], look: [-4.6, 1.3, -1.5], fov: 42 }, sway: 0.5 } },
  // 13
  { vo: 'Rule one: keep a light on at midnight.', set: 'street', light: 'night', music: 'tense',
    setup(W) { const m = W.chars.mia; W.put(m, [-4.25, 0, -1.55], PI / 2); W.props.__paper = W.props.rules; holdPaper(W, m, W.props.rules); W.coolAt([-2.8, 2.0, -1.3], 3); },
    update(W, t) { const m = W.chars.mia; m.setPose({ ...W.Poses.idle(t), neck: [0.35, 0, 0] }); paperHands(W, m, W.props.rules, -0.3); },
    cam: paperCam(0.16, 0.14, 1.25, 1.1) },
  // 14
  { vo: 'Rule two: never open a letter with no stamp.', set: 'street', light: 'night', music: 'tense',
    setup(W) { const m = W.chars.mia; W.put(m, [-4.25, 0, -1.55], PI / 2); W.props.__paper = W.props.rules; holdPaper(W, m, W.props.rules); W.coolAt([-2.8, 2.0, -1.3], 3); },
    update(W, t) { const m = W.chars.mia; m.setPose({ ...W.Poses.idle(t), neck: [0.35, 0, 0] }); paperHands(W, m, W.props.rules, -0.3); },
    cam: paperCam(0.03, 0.01, 1.2, 1.05) },
  // 15
  { vo: 'Rule three... was torn off.', whisper: true, set: 'street', light: 'night', music: 'none', sfx: [{ type: 'boom', at: 'u0.5' }],
    setup(W) { const m = W.chars.mia; W.put(m, [-4.25, 0, -1.55], PI / 2); W.props.__paper = W.props.rules; holdPaper(W, m, W.props.rules); W.coolAt([-2.8, 2.0, -1.3], 3); },
    update(W, t) { const m = W.chars.mia; m.setPose({ ...W.Poses.idle(t), neck: [0.35, 0, 0] }); paperHands(W, m, W.props.rules, -0.3); },
    cam: paperCam(-0.1, -0.14, 1.1, 0.8) },

  // ================= NIGHT 2: the lamp =================
  // 16
  { vo: '11:58 PM.', tts: 'Eleven fifty-eight P.M.', set: 'bedroom', light: 'interiorNight', music: 'night', sfx: [{ type: 'tick', at: 0.0, n: 3, every: 0.4 }],
    setup(W) { W.props.clock.setTime('11:58'); },
    cam: { from: { pos: [-0.3, 0.45, 0.6], look: [1.02, 0.73, -2.5], fov: 42 }, to: { pos: [0.58, 0.71, -1.25], look: [1.02, 0.735, -2.5], fov: 37 }, ease: 'snap', sway: 0.3 } },
  // 17
  { vo: 'Theo hates sleeping with the light on.', set: 'bedroom', light: 'interiorNight', music: 'night',
    setup(W) { const th = W.chars.theo; W.put(th, [2.45, -0.02, -2.25], 0); th.setFace('unimpressed'); W.props.blanket.position.set(0, 0.74, 0.5); W.coolAt([1.6, 2.2, 0.2], 1.2); },
    update(W, t) { W.chars.theo.setPose({ hipL: [-1.55, 0, 0], hipR: [-1.55, 0, 0], shoulderL: [0, 0, 0.5], shoulderR: [0, 0, -0.5], elbowL: [-2.0, 0, 0], elbowR: [-2.0, 0, 0], neck: [0, 0.3, 0] }); },
    cam: { from: { pos: [1.1, 2.5, 0.4], look: [2.45, 1.0, -2.0], fov: 42 }, to: { pos: [1.3, 2.35, 0.0], look: [2.45, 1.0, -2.0], fov: 40 }, sway: 0.4 } },
  // 18
  { vo: 'So he did the dumbest thing ever.', set: 'bedroom', light: 'interiorNight', music: 'night',
    setup(W) { theoAtLamp(W); W.bloom.strength = 0.45; },
    update(W, t, u) {
      const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), waist: [0.25, 0, 0] });
      W.reach(th, 'R', [SWITCH[0] - 0.06, SWITCH[1] + 0.07 - Math.min(1, u * 1.6) * 0.03, SWITCH[2] + 0.02]);
    },
    cam: { from: { pos: [-0.15, 0.9, -2.2], look: [0.68, 0.7, -2.5], fov: 40 }, to: { pos: [-0.02, 0.86, -2.28], look: [0.68, 0.7, -2.5], fov: 38 }, sway: 0.4 } },
  // 19
  { vo: 'Click.', set: 'bedroom', light: 'interiorNight', music: 'none', dur: 1.6, sfx: [{ type: 'click', at: 0.3 }, { type: 'boom', at: 0.35 }],
    setup(W) { theoAtLamp(W); },
    hud: [LIGHTS('411 / 412', '#ff4d5e', { from: 0.25, border: '#ff3b4e', pulse: true }), { type: 'badge', text: 'HOUSE 7: LIGHT OFF', from: 0.35 }],
    update(W, t) {
      const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), waist: [0.25, 0, 0] });
      W.reach(th, 'R', [SWITCH[0], SWITCH[1] + 0.03, SWITCH[2] + 0.05]);
      const off = t > 0.3; W.props.lamp.setOn(off ? 0 : 1); if (off) { W.hemi.intensity = 0.55; }
    },
    cam: { from: { pos: [-3.2, 3.0, 2.75], look: [0.6, 0.5, -1.9], fov: 46 }, to: { pos: [-3.0, 2.95, 2.5], look: [0.6, 0.5, -1.9], fov: 44 }, sway: 0.25 } },
  // 20
  { vo: 'Biscuit started growling.', set: 'bedroom', light: 'interiorDark', music: 'dread', sfx: [{ type: 'growl', at: 0.05, dur: 1.6 }],
    setup(W) { W.props.lamp.setOn(0); W.put(W.chars.dog, [-1.9, 0, 1.5], -PI / 2); W.chars.dog.setFace('dogAngry'); W.coolAt([-2.6, 1.6, 2.6], 1.5); },
    hud: [{ type: 'badge', text: 'HOUSE 7: LIGHT OFF' }],
    update(W, t) { W.chars.dog.setPose({ t, wag: 0, crouch: 1, earsBack: 1, tongueOut: false, headPitch: 0.1 + 0.03 * Math.sin(t * 30) }); },
    cam: { from: { pos: [-3.4, 0.75, 2.05], look: [-2.2, 0.55, 1.45], fov: 48 }, to: { pos: [-3.38, 0.72, 1.95], look: [-2.2, 0.55, 1.45], fov: 46 }, sway: 0.5 } },
  // 21
  { vo: 'Biscuit never growls.', whisper: true, set: 'bedroom', light: 'interiorDark', music: 'dread', sfx: [{ type: 'growl', at: 0.0, dur: 1.4 }],
    setup(W) { W.props.lamp.setOn(0); W.put(W.chars.dog, [-1.9, 0, 1.5], -PI / 2); W.chars.dog.setFace('dogAngry'); W.coolAt([-2.9, 1.2, 2.0], 1.4); },
    update(W, t) { W.chars.dog.setPose({ t, wag: 0, crouch: 1, earsBack: 1, tongueOut: false, headPitch: 0.1 + 0.03 * Math.sin(t * 30) }); },
    cam: { from: { pos: [-3.45, 0.72, 1.55], look: [-2.35, 0.62, 1.5], fov: 46 }, to: { pos: [-3.42, 0.7, 1.53], look: [-2.35, 0.62, 1.5], fov: 44 }, sway: 0.3 } },
  // 22
  { vo: "Twelve o'clock.", whisper: true, set: 'bedroom', light: 'interiorDark', music: 'none', sfx: [{ type: 'boom', at: 0.15 }, { type: 'tick', at: 0.15, n: 1 }],
    setup(W) { W.props.lamp.setOn(0); },
    update(W, t) { const glitch = t < 0.15 || (t > 0.3 && t < 0.38); W.props.clock.setTime(glitch ? '11:59' : '12:00', glitch ? 'PM' : 'AM'); },
    cam: { from: { pos: [0.55, 0.72, -1.15], look: [1.02, 0.735, -2.5], fov: 38 }, to: { pos: [0.6, 0.72, -1.35], look: [1.02, 0.735, -2.5], fov: 37 }, sway: 0.2 } },
  // 23
  { vo: 'Something slid under the door.', whisper: true, set: 'bedroom', light: 'interiorDark', music: 'dread', sfx: [{ type: 'slide', at: 'u0.3', dur: 0.8 }],
    setup(W) { W.props.lamp.setOn(0); W.put(W.props.envelope, [-4.2, 0.002, 1.5], 0.1); W.coolAt([-1.5, 1.0, 1.4], 1.4); },
    update(W, t, u) { const k = clamp01((u - 0.28) / 0.45); const e = 1 - Math.pow(1 - k, 3); W.props.envelope.group.position.x = -4.2 + 1.2 * e; W.props.envelope.group.rotation.y = 0.1 + 0.25 * e; },
    cam: { from: { pos: [-1.1, 0.32, 1.75], look: [-3.6, 0.1, 1.5], fov: 42 }, to: { pos: [-1.3, 0.3, 1.7], look: [-3.6, 0.08, 1.5], fov: 40 }, sway: 0.3 } },
  // 24
  { vo: 'A letter. No stamp.', set: 'bedroom', light: 'interiorDark', music: 'dread', sfx: [{ type: 'steps', at: 0.05, n: 3, every: 0.36 }, { type: 'silence', at: 'end-0.4', dur: 0.4 }],
    setup(W) { W.props.lamp.setOn(0); W.put(W.props.envelope, [-3.0, 0.002, 1.5], 0.35); W.coolAt([-2.7, 0.9, 2.2], 1.6); },
    cam: { from: { pos: [-2.9, 1.05, 2.25], look: [-3.0, 0.0, 1.5], fov: 36 }, to: { pos: [-2.93, 0.88, 2.1], look: [-3.0, 0.0, 1.5], fov: 34 }, sway: 0.25 } },
  // 25
  { vo: 'Theo opened it anyway.', set: 'bedroom', light: 'interiorDark', music: 'dread',
    setup(W) {
      W.props.lamp.setOn(0); const th = W.chars.theo; W.put(th, [1.2, 0, 0.0], 0); th.setFace('smirk');
      W.hold(th, W.props.envelope, 'waist', [0, 0.18, 0.62], [PI / 2 - 0.3, 0, 0]); W.coolAt([1.0, 1.7, 1.6], 1.6);
    },
    update(W, t, u) {
      const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), neck: [0.3, 0, 0] });
      W.reach(th, 'L', W.localPos(W.props.envelope, [0.2, 0.0, 0.05]));
      W.reach(th, 'R', W.localPos(W.props.envelope, [-0.2, 0.0, 0.05 - 0.04 * Math.sin(u * PI)]));
    },
    cam: { from: { pos: [1.05, 1.55, 2.3], look: [1.25, 1.05, 0.0], fov: 40 }, to: { pos: [1.1, 1.5, 1.95], look: [1.25, 1.08, 0.0], fov: 39 }, sway: 0.4 } },
  // 26
  { vo: 'It said: Your light is off.', whisper: true, set: 'bedroom', light: 'interiorDark', music: 'dread',
    setup(W) { W.props.lamp.setOn(0); const th = W.chars.theo; W.put(th, [1.2, 0, 0.0], 0); W.props.__paper = W.props.letter; holdPaper(W, th, W.props.letter, [0, 0.32, 0.66], -0.35); W.coolAt([1.1, 1.6, 1.2], 1.6); },
    update(W, t) { const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), neck: [0.35, 0, 0] }); paperHands(W, th, W.props.letter, -0.33); },
    cam(t, u, W) {
      const L = W.props.letter, c = W.localPos(L, [0.0, -0.04, 0]);
      return { from: { pos: W.localPos(L, [0, 0, 1.25]), look: c, fov: 38 }, to: { pos: W.localPos(L, [0, -0.01, 1.0]), look: c, fov: 36 }, sway: 0.35 };
    } },
  // 27
  { vo: 'Come out and see ours.', whisper: true, set: 'bedroom', light: 'interiorDark', music: 'dread', sfx: [{ type: 'boom', at: 'u0.7' }],
    setup(W) { W.props.lamp.setOn(0); const th = W.chars.theo; W.put(th, [1.2, 0, 0.0], 0); holdPaper(W, th, W.props.letter, [0, 0.32, 0.66], -0.35); W.coolAt([1.1, 1.6, 1.2], 1.6); },
    update(W, t) { const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), neck: [0.35, 0, 0] }); paperHands(W, th, W.props.letter, -0.33); },
    cam(t, u, W) {
      const L = W.props.letter;
      return { from: { pos: W.localPos(L, [-0.06, -0.08, 1.45]), look: W.localPos(L, [-0.06, -0.12, 0]), fov: 37 }, to: { pos: W.localPos(L, [-0.06, -0.1, 1.2]), look: W.localPos(L, [-0.06, -0.13, 0]), fov: 36 }, ease: 'out', sway: 0.25 };
    } },

  // ================= NIGHT 3: the taking =================
  // 28
  { vo: 'Then I heard the window creak.', set: 'bedroom', light: 'interiorDark', music: 'dread', sfx: [{ type: 'creak', at: 0.1 }, { type: 'wind', at: 0.5, dur: 1.5 }],
    setup(W) { W.props.lamp.setOn(0); },
    update(W, t, u) { const k = ease(clamp01(u / 0.8)); W.props.window.setOpen(1.15 * k); W.props.curtains.animate(t, k); },
    cam: { from: { pos: [2.4, 1.85, 0.3], look: [2.45, 2.0, -5.0], fov: 42 }, to: { pos: [2.42, 1.87, -0.2], look: [2.45, 2.02, -5.0], fov: 40 }, sway: 0.3 } },
  // 29
  { vo: 'I ran to his room.', set: 'hallway', light: 'interiorDark', music: 'chase', moonDir: [-1, 0.55, 0.25], sfx: [{ type: 'run', at: 0.0, n: 6, every: 0.22 }],
    setup(W) { const m = W.chars.mia; W.put(m, [0.1, 0, 2.5], PI); m.setFace('scared'); W.coolAt([0, 2.6, 0], 1.5); },
    update(W, t, u) { const m = W.chars.mia; m.group.position.z = 2.5 - 4.6 * u; m.setPose(W.Poses.run(t * 13)); },
    cam(t, u) { const z = 2.5 - 4.6 * u; return { pos: [-0.3, 1.75, z + 3.0], look: [0.1, 1.05, z - 2.5], fov: 50, roll: 3 * Math.sin(t * 6), sway: 1.4 }; } },
  // 30
  { vo: 'His bed was empty.', set: 'bedroom', light: 'interiorDark', music: 'chase', sfx: [{ type: 'boom', at: 0.05 }, { type: 'wind', at: 0, dur: 1.6 }],
    setup(W) { W.props.lamp.setOn(0); W.props.window.setOpen(1.15); W.props.blanket.position.set(0, 0.62, 0.85); W.props.blanket.scale.set(1, 1.3, 0.42); },
    update(W, t) { W.props.curtains.animate(t, 1.0); },
    cam: { from: { pos: [0.75, 1.6, 2.2], look: [2.45, 1.35, -2.8], fov: 46 }, to: { pos: [0.95, 1.55, 1.6], look: [2.45, 1.4, -2.8], fov: 44 }, sway: 0.8 } },
  // 31
  { vo: 'And outside, a tall man with a mail sack was walking away...', set: 'street', light: 'night', music: 'dread', sfx: [{ type: 'steps', at: 0.2, n: 5, every: 0.55 }],
    setup(W) { W.put(W.chars.mailman, [0.4, 0, -9], PI); W.put(W.chars.theo, [1.35, 0, -9], PI); W.chars.theo.setFace('neutral'); },
    update(W, t, u) {
      const z = -9 - 2.2 * u, mm = W.chars.mailman, th = W.chars.theo;
      mm.group.position.z = z; th.group.position.z = z;
      mm.setPose({ ...W.Poses.walk(t * 3.2, 0.3), shoulderR: [0.05, 0, -0.32], elbowR: [0, 0, 0] });
      th.setPose(W.Poses.walk(t * 3.2 + 1, 0.35)); W.reach(th, 'L', W.localPos(mm.joints.wristR, [0, -0.22, 0]));
    },
    cam: { from: { pos: [-4.4, 1.7, 1.0], look: [0.8, 1.9, -12], fov: 40 }, to: { pos: [-4.2, 1.65, 0.2], look: [0.8, 1.8, -13], fov: 36 }, sway: 0.6 } },
  // 32
  { vo: "...holding Theo's hand.", whisper: true, set: 'street', light: 'night', music: 'dread', sfx: [{ type: 'steps', at: 0.1, n: 3, every: 0.55 }],
    setup(W) { W.put(W.chars.mailman, [0.4, 0, -11.2], PI); W.put(W.chars.theo, [1.35, 0, -11.2], PI); },
    update(W, t, u) {
      const z = -11.2 - 1.0 * u, mm = W.chars.mailman, th = W.chars.theo;
      mm.group.position.z = z; th.group.position.z = z;
      mm.setPose({ ...W.Poses.walk(t * 3.2, 0.3), shoulderR: [0.05, 0, -0.32], elbowR: [0, 0, 0] });
      th.setPose(W.Poses.walk(t * 3.2 + 1, 0.35)); W.reach(th, 'L', W.localPos(mm.joints.wristR, [0, -0.22, 0]));
    },
    cam(t, u) { const z = -11.2 - 1.0 * u; return { pos: [1.15, 0.35, z + 2.6], look: [0.9, 1.5, z - 1.5], fov: 46, sway: 0.5 }; } },
  // 33
  { vo: 'I screamed. Mr. Pell was already at our door.', set: 'hallway', light: 'interiorDark', music: 'chase', moonDir: [-1, 0.55, 0.25],
    setup(W) { W.props.frontDoor.setOpen(-1.55); const p = W.chars.pell; W.put(p, [0.05, 0, -8.9], 0); W.hold(p, W.props.lantern, 'wristR', [0, -0.3, 0]); W.props.lantern.light.intensity = 3; },
    hud: [{ type: 'tag', text: 'Mr. Pell', char: 'pell', color: '#ff7a7a', from: 0.4 }],
    update(W, t) { const p = W.chars.pell; p.setPose({ ...W.Poses.idle(t), shoulderR: [-0.35, 0, -0.1], elbowR: [-0.5, 0, 0] }); W.keepUpright(W.props.lantern); },
    cam: { from: { pos: [0.35, 0.3, -4.6], look: [0.05, 1.85, -8.7], fov: 44 }, to: { pos: [0.3, 0.32, -5.3], look: [0.05, 1.9, -8.7], fov: 42 }, sway: 0.5 } },
  // 34
  { vo: "Don't chase him. Turn your light back on.", whisper: true, set: 'hallway', light: 'interiorDark', music: 'chase', moonDir: [-1, 0.55, 0.25],
    setup(W) { W.props.frontDoor.setOpen(-1.55); const p = W.chars.pell; W.put(p, [0.05, 0, -8.6], 0); p.setFace('shout'); W.hold(p, W.props.lantern, 'wristR', [0, -0.3, 0]); W.props.lantern.light.intensity = 0.7; W.grade.uniforms.strength.value = 0.8; },
    update(W, t) { const p = W.chars.pell; p.setPose({ ...W.Poses.idle(t), neck: [0.15, 0, 0] }); W.reach(p, 'R', [-0.1, 1.35, -8.1]); W.keepUpright(W.props.lantern); },
    cam: { from: { pos: [0.05, 1.6, -6.3], look: [0.05, 1.9, -8.6], fov: 40 }, to: { pos: [0.05, 1.65, -6.65], look: [0.05, 1.93, -8.6], fov: 39 }, sway: 0.4 } },
  // 35
  { vo: 'I slammed the switch.', set: 'bedroom', light: 'interiorDark', music: 'none', sfx: [{ type: 'click', at: 'u0.5' }, { type: 'chime', at: 'u0.5' }],
    setup(W) { W.props.lamp.setOn(0); const m = W.chars.mia; W.put(m, [0.3, 0, -1.9], PI); m.setFace('scared'); },
    hud: [LIGHTS('411 / 412', '#ff4d5e', { to: 0.5, border: '#ff3b4e', pulse: true }), LIGHTS('412 / 412', '#38e07b', { from: 0.5, border: '#38e07b' }), { type: 'badge', text: 'LIGHT RESTORED', kind: 'ok', from: 0.55 }],
    update(W, t, u) {
      const m = W.chars.mia; m.setPose({ ...W.Poses.idle(t), waist: [0.3, 0, 0] });
      const k = Math.min(1, u / 0.5); W.reach(m, 'R', [SWITCH[0], SWITCH[1] + 0.25 * (1 - k) + 0.035, SWITCH[2] + 0.05]);
      const on = u >= 0.5 ? Math.min(1, (u - 0.5) / 0.08) : 0;
      W.props.lamp.setOn(on * (1 + 0.3 * Math.max(0, 1 - (u - 0.5) / 0.3))); W.bloom.strength = 0.45;
      W.grade.uniforms.flash.value = u >= 0.5 ? 0.16 * Math.max(0, 1 - (u - 0.5) / 0.35) : 0;
      if (on > 0) W.hemi.intensity = 0.85 + 0.4 * on;
    },
    cam: { from: { pos: [1.75, 1.0, -1.35], look: [0.62, 0.72, -2.55], fov: 40 }, to: { pos: [1.9, 1.1, -1.2], look: [0.62, 0.74, -2.55], fov: 42 }, sway: 0.8 } },
  // 36
  { vo: 'Every light in Hollow Creek flickered.', set: 'street', light: 'townFinal', music: 'relief', sfx: [{ type: 'buzz', at: 0.0, dur: 1.6 }],
    setup(W) { allLit(W); },
    hud: [(t) => LIGHTS(Math.sin(t * 40) > 0.3 ? '??? / 412' : '412 / 412', '#ffe14a')],
    update(W, t) {
      let k = 0; for (const h of W.houses) h.windows.forEach((w, i) => { k++; if (h === W.figureHouse && i === 2) return; w.setLit(Math.sin(t * 37 + k * 12.9898) * 43758.5 % 1 < (t > 1.2 ? 2 : 0.55)); });
      W.farDarkGlass.material = Math.sin(t * 25) > 0 ? W.GLASS_LIT : W.GLASS_DARKM;
    },
    cam: { from: { pos: [20, 32, 28], look: [0, 0, -14], fov: 40 }, to: { pos: [16, 26, 22], look: [0, 0, -14], fov: 40 }, sway: 0.6 } },
  // 37
  { vo: 'And the footsteps... stopped.', whisper: true, set: 'bedroom', light: 'interiorNight', music: 'dread', fog: ['#3a5cc4', 3, 34], sfx: [{ type: 'steps', at: 0.0, n: 3, every: 0.45, fade: true }],
    setup(W) { W.put(W.chars.mailman, [5.2, -0.3, -4.1], -PI / 2); W.props.lamp.power = 1.6; },
    update(W, t, u) {
      const m = W.chars.mailman, k = clamp01(u / 0.6); m.group.position.x = 5.2 - 3.0 * ease(k);
      m.setPose({ ...(k < 1 ? W.Poses.walk(t * 2.2, 0.25) : {}), neck: [0, -1.2 * clamp01((u - 0.7) / 0.15), 0] });
    },
    cam: { from: { pos: [2.4, 1.85, 0.3], look: [2.45, 2.0, -5.0], fov: 40 }, to: { pos: [2.42, 1.87, -0.2], look: [2.45, 2.02, -5.0], fov: 37 }, sway: 0.3 } },

  // ================= MORNING: wrong =================
  // 38
  { vo: 'In the morning, Theo was back in bed.', set: 'bedroom', light: 'morning', music: 'creepy', moonDir: [0.35, 0.8, -1],
    setup(W) {
      const th = W.chars.theo; W.put(th, [2.45, 0.78, -1.15], 0); th.group.rotation.set(-PI / 2, 0, 0); th.setFace('sleep');
      W.props.blanket.position.set(0, 0.88, 0.38); W.props.blanket.scale.set(1, 1, 0.85); W.props.lamp.power = 0.6; W.props.clock.setTime('7:02', 'AM');
    },
    update(W) { W.chars.theo.setPose({ shoulderL: [0, 0, 0.1], shoulderR: [0, 0, -0.1] }); },
    cam: { from: { pos: [0.7, 2.35, 0.6], look: [2.45, 0.8, -2.0], fov: 40 }, to: { pos: [1.0, 2.15, 0.1], look: [2.45, 0.8, -2.1], fov: 38 }, sway: 0.3 } },
  // 39
  { vo: "He doesn't remember anything.", set: 'bedroom', light: 'morning', music: 'creepy', moonDir: [0.35, 0.8, -1],
    setup(W) { const th = W.chars.theo; W.put(th, [2.45, -0.02, -2.25], 0); th.setFace('smile'); W.props.blanket.position.set(0, 0.74, 0.5); W.props.lamp.power = 0.6; W.props.clock.setTime('7:03', 'AM'); },
    update(W, t) { W.chars.theo.setPose({ hipL: [-1.55, 0, 0], hipR: [-1.55, 0, 0], shoulderL: [-0.3, 0, 0], shoulderR: [-0.3, 0, 0], elbowL: [-0.3, 0, 0], elbowR: [-0.3, 0, 0], neck: [0, 0, 0.18 * Math.sin(t * 2)] }); },
    cam: { from: { pos: [2.45, 1.3, -0.6], look: [2.45, 1.26, -2.25], fov: 36 }, to: { pos: [2.45, 1.3, -0.8], look: [2.45, 1.26, -2.25], fov: 35 }, sway: 0.2 } },
  // 40
  { vo: "But Biscuit won't go near him anymore.", set: 'bedroom', light: 'morning', music: 'creepy', moonDir: [0.35, 0.8, -1], sfx: [{ type: 'growl', at: 0.3, dur: 0.9, soft: true }],
    setup(W) {
      const th = W.chars.theo; W.put(th, [2.45, -0.02, -2.25], -0.5); th.setFace('creepy'); W.props.blanket.position.set(0, 0.74, 0.5); W.props.lamp.power = 0.6;
      W.put(W.chars.dog, [0.9, 0, -0.4], PI / 2 - 0.4); W.chars.dog.setFace('dogScared');
    },
    update(W, t, u) {
      W.chars.theo.setPose({ hipL: [-1.55, 0, 0], hipR: [-1.55, 0, 0], neck: [0, -0.4, 0] });
      const d = W.chars.dog; d.group.position.x = 0.9 - 1.0 * ease(u); d.group.position.z = -0.4 + 0.5 * ease(u); d.setPose({ t, wag: 0, crouch: 0.7, earsBack: 1, tongueOut: false, walk: 1 });
    },
    cam: { from: { pos: [-1.2, 1.25, 1.9], look: [1.2, 0.75, -1.0], fov: 48 }, to: { pos: [-1.05, 1.2, 1.6], look: [1.2, 0.75, -1.0], fov: 46 }, sway: 0.4 } },
  // 41
  { vo: 'And every night, at 11:59...', tts: 'And every night, at eleven fifty-nine...', set: 'bedroom', light: 'interiorNight', music: 'dread', sfx: [{ type: 'tick', at: 0.1, n: 3, every: 0.6, soft: true }],
    setup(W) { const th = W.chars.theo; W.put(th, [-0.05, 0, -2.45], 0.15); th.setFace('creepy'); },
    update(W, t) { const th = W.chars.theo; th.setPose(W.Poses.idle(t)); W.reach(th, 'L', [SWITCH[0] - 0.12, SWITCH[1] + 0.1, SWITCH[2] + 0.12]); },
    cam: { from: { pos: [0.55, 1.2, 0.9], look: [0.3, 0.98, -2.4], fov: 38 }, to: { pos: [0.45, 1.12, -0.2], look: [0.3, 0.98, -2.4], fov: 36 }, ease: 'linear', sway: 0.2 } },
  // 42
  { vo: '...he asks me to turn off the lamp.', whisper: true, set: 'bedroom', light: 'interiorNight', music: 'dread', extra: 0.4,
    setup(W) { const th = W.chars.theo; W.put(th, [-0.05, 0, -2.45], 0.15); th.setFace('creepy'); },
    update(W, t) { const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), neck: [0, 0, 0.25] }); W.reach(th, 'L', [SWITCH[0] - 0.12, SWITCH[1] + 0.1, SWITCH[2] + 0.12]); },
    cam: { from: { pos: [0.1, 1.3, -1.05], look: [-0.05, 1.3, -2.45], fov: 38 }, to: { pos: [0.08, 1.3, -1.3], look: [-0.05, 1.3, -2.45], fov: 37 }, sway: 0.0 } },

  // ================= THE TWIST =================
  // 43
  { vo: 'Last night, I found the rest of rule three.', set: 'street', light: 'night', music: 'tense',
    setup(W) { const m = W.chars.mia; W.put(m, [-4.25, 0, -1.55], PI / 2); m.setFace('worried'); W.hold(m, W.props.scrap, 'waist', [0, 0.35, 0.62], [-0.3, 0, 0]); W.props.mailbox.setDoor(1.3); W.props.mailbox.setFlag(0); W.coolAt([-2.8, 2.0, -1.3], 3); },
    update(W, t) { const m = W.chars.mia; m.setPose({ ...W.Poses.idle(t), neck: [0.25, 0, 0] }); W.reach(m, 'L', W.localPos(W.props.scrap, [0.21, -0.12, -0.08])); W.reach(m, 'R', W.localPos(W.props.scrap, [-0.21, -0.12, -0.08])); },
    cam: { from: { pos: [-2.4, 1.6, -1.3], look: [-4.25, 1.4, -1.55], fov: 40 }, to: { pos: [-2.7, 1.58, -1.4], look: [-4.25, 1.4, -1.55], fov: 39 }, sway: 0.5 } },
  // 44
  { vo: "If they come back... they're not yours.", whisper: true, set: 'street', light: 'night', music: 'none', extra: 0.3, sfx: [{ type: 'boom', at: 'u0.55' }],
    setup(W) {
      const m = W.chars.mia; W.put(m, [-4.25, 0, -1.55], PI / 2); W.props.__paper = W.props.rules;
      holdPaper(W, m, W.props.rules, [0, 0.42, 0.64]); W.hold(m, W.props.scrap, 'waist', [0, 0.163, 0.719], [-0.3, 0, 0]); W.coolAt([-2.8, 2.0, -1.3], 3);
    },
    update(W, t) { const m = W.chars.mia; m.setPose({ ...W.Poses.idle(t), neck: [0.35, 0, 0] }); paperHands(W, m, W.props.scrap, -0.06); },
    cam: paperCam(-0.12, -0.16, 1.2, 1.0) },
  // 45
  { vo: 'Keep your light on.', whisper: true, set: 'street', light: 'townFinal', music: 'outro', dur: 3.6, sfx: [{ type: 'whoosh', at: 0.2, low: true }],
    setup(W) { allLit(W); W.put(W.chars.figure, [8.25, 3.92, -11.89], -PI / 2); },
    hud: [{ type: 'tag', text: 'Theo?', char: 'figure', color: '#ffd23a', from: 0.08, to: 0.45 }, LIGHTS('411 / 412', '#ff4d5e', { from: 0.5, border: '#ff3b4e', pulse: true })],
    update(W, t, u) {
      W.chars.figure.setPose({ shoulderR: [0, 0, -2.6 - 0.35 * Math.sin(t * 7)], elbowR: [0, 0, -0.3 * Math.sin(t * 7 + 1)] });
      W.grade.uniforms.dark.value = Math.max(0, (u - 0.9) / 0.1);
    },
    cam: { from: { pos: [3.7, 4.45, -11.6], look: [8.1, 4.45, -11.89], fov: 34 }, to: { pos: [-24, 52, 40], look: [0, 0, -40], fov: 44 }, ease: 'in', sway: 0.25 } },
];
