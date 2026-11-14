// THE NIGHT MAILMAN — shot list. Edit freely, then run ./build.sh
//
// Each shot:
//   vo       caption / voiceover line ('' = no words)
//   tts      optional spoken text if it differs from the caption (e.g. numbers)
//   whisper  true = whispered line
//   dur      optional fixed length in seconds (otherwise: voice length + padding)
//   sfx      sound effects: [{ type, at (s into shot), ...}]  types: tick, slide, steps, run, chime, silence, whoosh
//   set      'street' | 'bedroom' | 'hallway'
//   light    preset in engine/world.js PRESETS: night, dusk, interiorNight, interiorDark, morning
//   cam      { from:{pos,look,fov}, to:{pos,look,fov}, ease, sway }  (set-local coords; fov in degrees)
//            or a function (t, u, W) => spec   for tracking shots
//   setup(W) place characters / props when the shot starts
//   update(W, t, u)  animate every frame (t = seconds into shot, u = 0..1)
//
// Coordinates: STREET  road along z at x=0; Mia's house x=-12,z=0 (front at x=-8.5); Pell's house z=10.
//              BEDROOM back wall z=-3.1 (window x -2.05..-0.55, y 1..2.4), bed x 1.5..3.4, lamp (0.7,0.62,-2.68),
//                      door in left wall x=-3.6, z=1.5.
//              HALLWAY corridor x -1.3..1.3, z -8..6, front door z=-8.1, Theo's door right wall z=-3.
const PI = Math.PI;
const SWITCH = [0.7, 0.69, -2.53];

export const shots = [
  // 1
  { vo: "In this town, there's one strange rule.", set: 'street', light: 'night', sfx: [{ type: 'whoosh', at: 0 }],
    cam: { from: { pos: [0.6, 3.4, 52], look: [0, 3.6, -40], fov: 42 }, to: { pos: [0.4, 2.8, 36], look: [0, 3.4, -40], fov: 40 }, sway: 0.3 },
  },
  // 2
  { vo: 'Every house keeps one light on at midnight.', set: 'street', light: 'night',
    setup(W) { W.pellHouse.windows[2].setLit(true); },
    cam: { from: { pos: [-5.4, 2.0, 13.3], look: [-8.44, 4.5, 11.89], fov: 40 }, to: { pos: [-5.9, 2.4, 13.0], look: [-8.44, 4.55, 11.89], fov: 37 }, sway: 0.35 },
  },
  // 3
  { vo: 'No exceptions.', set: 'street', light: 'night',
    cam: { from: { pos: [-3.75, 0.45, 30.7], look: [-6.2, 0.6, 24], fov: 42 }, to: { pos: [-3.8, 0.5, 30.5], look: [-6.2, 2.2, 24], fov: 42 }, sway: 0.4 },
  },
  // 4
  { vo: 'My family moved here last week.', set: 'street', light: 'dusk',
    setup(W) { W.put(W.chars.mia, [-4.6, 0, 0.6], -PI / 2); W.hold(W.chars.mia, W.props.heldBox, 'waist', [0, 0.18, 0.47]); W.chars.mia.setFace('smile'); },
    update(W, t, u) {
      const m = W.chars.mia; m.group.position.x = -4.4 - 1.5 * u;
      m.setPose({ ...W.Poses.walk(t * 7, 0.45), shoulderL: [-1.0, 0, -0.35], shoulderR: [-1.0, 0, 0.35], elbowL: [-0.55, 0, 0], elbowR: [-0.55, 0, 0] });
    },
    cam: { from: { pos: [-7.6, 1.5, 4.6], look: [-4.6, 1.15, 0.5], fov: 42 }, to: { pos: [-7.9, 1.5, 4.1], look: [-5.6, 1.2, 0.5], fov: 40 }, sway: 1.3 },
  },
  // 5
  { vo: 'Our neighbor warned us right away.', set: 'street', light: 'dusk',
    setup(W) {
      W.put(W.chars.mia, [-5.85, 0, 3.3], 0.1); W.chars.mia.setPose(W.Poses.idle(0));
      W.put(W.chars.pell, [-6.3, 0, 8.3], PI + 0.12);
    },
    update(W, t, u) {
      W.chars.mia.setPose(W.Poses.idle(t));
      const raise = Math.min(1, t / 0.5);
      W.chars.pell.setPose({ ...W.Poses.idle(t), shoulderR: [-2.3 * raise, 0, 0.15], elbowR: [-0.6 * raise, 0, 0], neck: [0.08, 0, 0] });
    },
    cam: { from: { pos: [-4.93, 1.95, 0.2], look: [-6.3, 1.85, 8.3], fov: 36 }, to: { pos: [-5.0, 1.95, 0.6], look: [-6.3, 1.9, 8.3], fov: 34 }, sway: 0.6 },
  },
  // 6
  { vo: 'If your window goes dark at twelve...', whisper: true, set: 'street', light: 'dusk',
    setup(W) { W.put(W.chars.pell, [-6.3, 0, 8.3], PI); W.grade.uniforms.strength.value = 0.85; },
    update(W, t) { W.chars.pell.setPose({ ...W.Poses.idle(t), neck: [0.12, 0, 0], waist: [0.1, 0, 0] }); },
    cam: { from: { pos: [-6.3, 1.7, 5.7], look: [-6.3, 1.95, 8.3], fov: 40 }, to: { pos: [-6.3, 1.75, 6.25], look: [-6.3, 1.98, 8.3], fov: 39 }, sway: 0.35 },
  },
  // 7
  { vo: '...the Night Mailman visits.', whisper: true, set: 'street', light: 'night', sfx: [{ type: 'whoosh', at: 0, low: true }],
    setup(W) { W.put(W.chars.mailman, [0, 0, -30], 0); },
    update(W, t) { const m = W.chars.mailman; m.group.position.z = -30 + t * 0.9; m.setPose(W.Poses.walk(t * 3.0, 0.35)); },
    cam: { from: { pos: [16, 44, 12], look: [0, 0, -29], fov: 36 }, to: { pos: [14, 41, 8], look: [0, 0, -28.5], fov: 34 }, sway: 0.25 },
  },
  // 8
  { vo: 'I thought it was a joke.', set: 'bedroom', light: 'interiorNight',
    setup(W) { W.put(W.chars.mia, [0.0, 0, -1.0], 0.1); W.chars.mia.setFace('smirk'); W.coolAt([-0.4, 2.0, 0.6], 1.6); },
    update(W, t) { W.chars.mia.setPose({ ...W.Poses.idle(t), neck: [0, 0.12, 0.05] }); },
    cam: { from: { pos: [-0.15, 1.6, 1.75], look: [0.02, 1.55, -1.0], fov: 42 }, to: { pos: [-0.1, 1.6, 1.4], look: [0.02, 1.56, -1.0], fov: 41 }, sway: 0.5 },
  },
  // 9
  { vo: 'My little brother Theo thought so too.', set: 'bedroom', light: 'interiorNight',
    setup(W) {
      W.put(W.chars.theo, [2.05, -0.03, -1.5], -0.45); W.chars.theo.setFace('smirk');
      W.put(W.chars.mia, [0.95, 0, -0.45], 0.3); W.chars.mia.setFace('smile'); W.coolAt([0.8, 2.2, 1.2], 1.4);
    },
    update(W, t) {
      W.chars.theo.setPose({ ...W.Poses.sit(), shoulderL: [-0.2, 0, 0.1], shoulderR: [-0.2, 0, -0.1], neck: [0, 0.2, 0] });
      W.chars.mia.setPose({ ...W.Poses.idle(t), shoulderR: [0, 0, -0.5], elbowR: [-1.9, 0, 0], neck: [0, 0.15, 0] });
    },
    cam: { from: { pos: [1.5, 1.55, 2.8], look: [1.5, 1.0, -1.0], fov: 44 }, to: { pos: [1.5, 1.5, 2.5], look: [1.5, 1.0, -1.0], fov: 43 }, sway: 0.6 },
  },
  // 10
  { vo: 'He hated sleeping with the light on.', set: 'bedroom', light: 'interiorNight',
    setup(W) { W.put(W.chars.theo, [0.25, 0, -1.95], PI); W.bloom.strength = 0.45; },
    update(W, t, u) {
      const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), waist: [0.25, 0, 0] });
      const press = u > 0.55 ? -0.015 : 0;
      W.reach(th, 'R', [SWITCH[0] - 0.06, SWITCH[1] + 0.07 - Math.min(1, u * 1.6) * 0.03 + press, SWITCH[2] + 0.02]);
    },
    cam: { from: { pos: [-0.15, 0.9, -2.2], look: [0.68, 0.7, -2.5], fov: 40 }, to: { pos: [-0.02, 0.86, -2.28], look: [0.68, 0.7, -2.5], fov: 38 }, sway: 0.4 },
  },
  // 11
  { vo: '11:59 PM.', tts: 'Eleven fifty-nine P.M.', set: 'bedroom', light: 'interiorNight', sfx: [{ type: 'tick', at: 0.0, n: 4, every: 0.42 }],
    cam: { from: { pos: [-0.3, 0.45, 0.6], look: [1.02, 0.73, -2.5], fov: 42 }, to: { pos: [0.66, 0.7, -1.45], look: [1.02, 0.735, -2.5], fov: 34 }, ease: 'snap', sway: 0.3 },
  },
  // 12
  { vo: 'He switched it off.', set: 'bedroom', light: 'interiorNight', sfx: [{ type: 'click', at: 0.45 }],
    setup(W) { W.put(W.chars.theo, [0.25, 0, -1.95], PI); },
    update(W, t, u) {
      const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), waist: [0.25, 0, 0] });
      W.reach(th, 'R', [SWITCH[0], SWITCH[1] + 0.03, SWITCH[2] + 0.05]);
      const off = t > 0.45;
      W.props.lamp.setOn(off ? 0 : 1);
      if (off) { W.hemi.intensity = 0.38; W.key.intensity = 2.0; }
    },
    cam: { from: { pos: [-3.2, 3.0, 2.75], look: [0.6, 0.5, -1.9], fov: 46 }, to: { pos: [-3.0, 2.95, 2.5], look: [0.6, 0.5, -1.9], fov: 44 }, sway: 0.25 },
  },
  // 13
  { vo: 'Then... silence.', whisper: true, set: 'hallway', light: 'interiorDark', dur: 2.6, moonDir: [-1, 0.55, 0.25],
    cam: { pos: [0.15, 1.55, 5.5], look: [0, 1.25, -8], fov: 46, sway: 0.08 },
  },
  // 14
  { vo: 'Twelve o\'clock. Something slid under the door.', whisper: true, set: 'bedroom', light: 'interiorDark', sfx: [{ type: 'slide', at: 'u0.35', dur: 0.9 }],
    setup(W) { W.props.lamp.setOn(0); W.put(W.props.envelope, [-4.2, 0.002, 1.5], 0.1); W.coolAt([-1.5, 1.0, 1.4], 1.2); },
    update(W, t, u) {
      const k = Math.min(1, Math.max(0, (u - 0.33) / 0.42)); const e = 1 - Math.pow(1 - k, 3);
      W.props.envelope.group.position.x = -4.2 + 1.2 * e; W.props.envelope.group.rotation.y = 0.1 + 0.25 * e;
    },
    cam: { from: { pos: [-1.1, 0.32, 1.75], look: [-3.6, 0.1, 1.5], fov: 42 }, to: { pos: [-1.3, 0.3, 1.7], look: [-3.6, 0.08, 1.5], fov: 40 }, sway: 0.3 },
  },
  // 15
  { vo: '', set: 'bedroom', light: 'interiorDark', dur: 1.7, sfx: [{ type: 'steps', at: 0.05, n: 3, every: 0.38 }, { type: 'silence', at: 'end-0.5', dur: 0.5 }],
    setup(W) { W.props.lamp.setOn(0); W.put(W.props.envelope, [-3.0, 0.002, 1.5], 0.35); W.coolAt([-2.7, 0.9, 2.2], 1.4); },
    cam: { from: { pos: [-2.9, 1.05, 2.25], look: [-3.0, 0.0, 1.5], fov: 36 }, to: { pos: [-2.93, 0.88, 2.1], look: [-3.0, 0.0, 1.5], fov: 34 }, sway: 0.25 },
  },
  // 16
  { vo: 'Theo opened it.', set: 'bedroom', light: 'interiorDark',
    setup(W) {
      W.props.lamp.setOn(0); const th = W.chars.theo; W.put(th, [1.2, 0, 0.0], 0); th.setFace('neutral');
      W.hold(th, W.props.envelope, 'waist', [0, 0.18, 0.62], [PI / 2 - 0.3, 0, 0]);
      W.coolAt([1.0, 1.7, 1.6], 1.5);
    },
    update(W, t, u) {
      const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), neck: [0.3, 0, 0] });
      W.reach(th, 'L', W.localPos(W.props.envelope, [0.2, 0.0, 0.05]));
      W.reach(th, 'R', W.localPos(W.props.envelope, [-0.2, 0.0, 0.05 - 0.04 * Math.sin(u * PI)]));
    },
    cam: { from: { pos: [1.05, 1.55, 2.3], look: [1.25, 1.05, 0.0], fov: 40 }, to: { pos: [1.1, 1.5, 1.95], look: [1.25, 1.08, 0.0], fov: 39 }, sway: 0.4 },
  },
  // 17
  { vo: 'It said: Your light is off.', whisper: true, set: 'bedroom', light: 'interiorDark',
    setup(W) {
      W.props.lamp.setOn(0); const th = W.chars.theo; W.put(th, [1.2, 0, 0.0], 0);
      W.hold(th, W.props.letter, 'waist', [0, 0.32, 0.66], [-0.35, 0, 0]);
      W.coolAt([1.1, 1.6, 1.2], 1.6);
    },
    update(W, t) {
      const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), neck: [0.35, 0, 0] });
      W.reach(th, 'L', W.localPos(W.props.letter, [0.19, -0.33, -0.04]));
      W.reach(th, 'R', W.localPos(W.props.letter, [-0.19, -0.33, -0.04]));
    },
    cam(t, u, W) {
      const c = W.localPos(W.props.letter, [0.0, -0.04, 0]), p0 = W.localPos(W.props.letter, [0.0, 0.0, 1.25]), p1 = W.localPos(W.props.letter, [0.0, -0.01, 1.0]);
      return { from: { pos: p0, look: c, fov: 38 }, to: { pos: p1, look: c, fov: 36 }, sway: 0.35 };
    },
  },
  // 18
  { vo: 'Come out and see ours.', whisper: true, set: 'bedroom', light: 'interiorDark',
    setup(W) {
      W.props.lamp.setOn(0); const th = W.chars.theo; W.put(th, [1.2, 0, 0.0], 0);
      W.hold(th, W.props.letter, 'waist', [0, 0.32, 0.66], [-0.35, 0, 0]);
      W.coolAt([1.1, 1.6, 1.2], 1.6);
    },
    update(W, t) {
      const th = W.chars.theo; th.setPose({ ...W.Poses.idle(t), neck: [0.35, 0, 0] });
      W.reach(th, 'L', W.localPos(W.props.letter, [0.19, -0.33, -0.04]));
      W.reach(th, 'R', W.localPos(W.props.letter, [-0.19, -0.33, -0.04]));
    },
    cam(t, u, W) {
      const c0 = W.localPos(W.props.letter, [-0.06, -0.12, 0]), c1 = W.localPos(W.props.letter, [-0.06, -0.13, 0]);
      return { from: { pos: W.localPos(W.props.letter, [-0.06, -0.08, 1.45]), look: c0, fov: 37 }, to: { pos: W.localPos(W.props.letter, [-0.06, -0.1, 1.2]), look: c1, fov: 36 }, ease: 'out', sway: 0.25 };
    },
  },
  // 19
  { vo: 'I ran to his room.', set: 'hallway', light: 'interiorDark', moonDir: [-1, 0.55, 0.25], sfx: [{ type: 'run', at: 0.0, n: 7, every: 0.24 }],
    setup(W) { const m = W.chars.mia; W.put(m, [0.1, 0, 2.5], PI); m.setFace('scared'); W.coolAt([0, 2.6, 0], 1.2); },
    update(W, t, u) { const m = W.chars.mia; m.group.position.z = 2.5 - 4.6 * u; m.setPose(W.Poses.run(t * 13)); },
    cam(t, u, W) {
      const z = 2.5 - 4.6 * u;
      return { pos: [-0.3, 1.75, z + 3.0], look: [0.1, 1.05, z - 2.5], fov: 50, roll: 3 * Math.sin(t * 6), sway: 1.4 };
    },
  },
  // 20
  { vo: 'The window was open.', set: 'bedroom', light: 'interiorDark', sfx: [{ type: 'wind', at: 0, dur: 2.2 }],
    setup(W) { W.props.lamp.setOn(0); W.props.window.setOpen(1.15); W.props.blanket.position.set(0, 0.62, 0.85); W.props.blanket.scale.set(1, 1.3, 0.42); },
    update(W, t) { W.props.curtains.animate(t, 1.0); },
    cam: { from: { pos: [0.75, 1.6, 2.2], look: [2.45, 1.35, -2.8], fov: 46 }, to: { pos: [0.95, 1.55, 1.6], look: [2.45, 1.4, -2.8], fov: 44 }, sway: 0.6 },
  },
  // 21
  { vo: 'I screamed. Mr. Pell was already at our door.', set: 'hallway', light: 'interiorDark', moonDir: [-1, 0.55, 0.25],
    setup(W) {
      W.props.frontDoor.setOpen(-1.55);
      const p = W.chars.pell; W.put(p, [0.05, 0, -8.9], 0);
      W.hold(p, W.props.lantern, 'wristR', [0, -0.3, 0]); W.props.lantern.light.intensity = 3;
    },
    update(W, t) {
      const p = W.chars.pell; p.setPose({ ...W.Poses.idle(t), shoulderR: [-0.35, 0, -0.1], elbowR: [-0.5, 0, 0] });
      W.keepUpright(W.props.lantern);
    },
    cam: { from: { pos: [0.35, 0.3, -4.6], look: [0.05, 1.85, -8.7], fov: 44 }, to: { pos: [0.3, 0.32, -5.3], look: [0.05, 1.9, -8.7], fov: 42 }, sway: 0.5 },
  },
  // 22
  { vo: "Don't go out there.", whisper: true, set: 'hallway', light: 'interiorDark', moonDir: [-1, 0.55, 0.25],
    setup(W) {
      W.props.frontDoor.setOpen(-1.55);
      const p = W.chars.pell; W.put(p, [0.05, 0, -8.6], 0); p.setFace('serious');
      W.hold(p, W.props.lantern, 'wristR', [0, -0.3, 0]); W.props.lantern.light.intensity = 0.7;
      W.grade.uniforms.strength.value = 0.8;
    },
    update(W, t) {
      const p = W.chars.pell; p.setPose({ ...W.Poses.idle(t), neck: [0.15, 0, 0] });
      W.reach(p, 'R', [-0.1, 1.35, -8.1]);
      W.keepUpright(W.props.lantern);
    },
    cam: { from: { pos: [0.05, 1.6, -6.3], look: [0.05, 1.9, -8.6], fov: 40 }, to: { pos: [0.05, 1.65, -6.65], look: [0.05, 1.93, -8.6], fov: 39 }, sway: 0.4 },
  },
  // 23
  { vo: 'Light the lamp. Hurry.', set: 'bedroom', light: 'interiorDark', sfx: [{ type: 'click', at: 'u0.5' }, { type: 'chime', at: 'u0.5' }],
    setup(W) { W.props.lamp.setOn(0); const m = W.chars.mia; W.put(m, [0.3, 0, -1.9], PI); m.setFace('scared'); },
    update(W, t, u) {
      const m = W.chars.mia; m.setPose({ ...W.Poses.idle(t), waist: [0.3, 0, 0] });
      const k = Math.min(1, u / 0.5);
      W.reach(m, 'R', [SWITCH[0], SWITCH[1] + 0.25 * (1 - k) + 0.035, SWITCH[2] + 0.05]);
      const on = u >= 0.5 ? Math.min(1, (u - 0.5) / 0.08) : 0;
      W.props.lamp.setOn(on * (1 + 0.3 * Math.max(0, 1 - (u - 0.5) / 0.3))); W.bloom.strength = 0.45;
      W.grade.uniforms.flash.value = u >= 0.5 ? 0.16 * Math.max(0, 1 - (u - 0.5) / 0.35) : 0;
      if (on > 0) { W.hemi.intensity = 0.38 + 0.4 * on; }
    },
    cam: { from: { pos: [1.75, 1.0, -1.35], look: [0.62, 0.72, -2.55], fov: 40 }, to: { pos: [1.9, 1.1, -1.2], look: [0.62, 0.74, -2.55], fov: 42 }, sway: 0.8 },
  },
  // 24
  { vo: 'The room glowed gold.', set: 'bedroom', light: 'interiorNight',
    setup(W) { const m = W.chars.mia; W.put(m, [0.3, 0, -1.6], 0.5); m.setFace('worried'); W.props.lamp.power = 2.6; W.hemi.intensity = 0.45; },
    update(W, t) { W.chars.mia.setPose(W.Poses.idle(t)); },
    cam: { from: { pos: [-1.5, 2.6, 0.9], look: [0.6, 0.6, -2.0], fov: 46 }, to: { pos: [-3.15, 3.05, 2.75], look: [0.6, 0.6, -2.0], fov: 48 }, ease: 'out', sway: 0.3 },
  },
  // 25
  { vo: 'Outside, the footsteps stopped.', whisper: true, set: 'bedroom', light: 'interiorNight', fog: ['#3a5cc4', 3, 34], sfx: [{ type: 'steps', at: 0.0, n: 2, every: 0.45, fade: true }],
    setup(W) { W.put(W.chars.mailman, [5.5, -0.3, -4.1], -PI / 2); W.props.lamp.power = 1.6; },
    update(W, t, u) {
      const m = W.chars.mailman; m.group.position.x = 5.2 - 5.4 * u; m.setPose(W.Poses.walk(t * 2.2, 0.25));
    },
    cam: { from: { pos: [2.4, 1.85, 0.3], look: [2.45, 2.0, -5.0], fov: 40 }, to: { pos: [2.42, 1.87, -0.2], look: [2.45, 2.02, -5.0], fov: 38 }, sway: 0.3 },
  },
  // 26
  { vo: 'By morning, he was home.', set: 'bedroom', light: 'morning', moonDir: [0.35, 0.8, -1],
    setup(W) {
      const th = W.chars.theo; W.put(th, [2.45, 0.78, -1.15], 0); th.group.rotation.set(-PI / 2, 0, 0); th.setFace('sleep');
      W.props.blanket.position.set(0, 0.88, 0.38); W.props.blanket.scale.set(1, 1, 0.85); W.props.lamp.power = 0.6;
      W.props.clock.setTime('7:02', 'AM');
    },
    update(W, t) { W.chars.theo.setPose({ shoulderL: [0, 0, 0.1], shoulderR: [0, 0, -0.1] }); },
    cam: { from: { pos: [0.7, 2.35, 0.6], look: [2.45, 0.8, -2.0], fov: 40 }, to: { pos: [1.0, 2.15, 0.1], look: [2.45, 0.8, -2.1], fov: 38 }, sway: 0.3 },
  },
  // 27
  { vo: 'But he just smiles now.', whisper: true, set: 'bedroom', light: 'morning', moonDir: [0.35, 0.8, -1], extra: 0.7,
    setup(W) {
      const th = W.chars.theo; W.put(th, [2.45, -0.02, -2.25], 0); th.setFace('creepy');
      W.props.blanket.position.set(0, 0.74, 0.5); W.props.lamp.power = 0.6; W.props.clock.setTime('7:03', 'AM');
    },
    update(W, t) { W.chars.theo.setPose({ hipL: [-1.55, 0, 0], hipR: [-1.55, 0, 0], shoulderL: [-0.3, 0, 0], shoulderR: [-0.3, 0, 0], elbowL: [-0.3, 0, 0], elbowR: [-0.3, 0, 0] }); },
    cam: { from: { pos: [2.45, 1.3, -0.6], look: [2.45, 1.26, -2.25], fov: 36 }, to: { pos: [2.45, 1.3, -0.8], look: [2.45, 1.26, -2.25], fov: 35 }, sway: 0.0 },
  },
  // 28
  { vo: 'Every night at 11:59, he asks to turn off the lamp.', tts: 'Every night at eleven fifty-nine, he asks to turn off the lamp.', whisper: true, set: 'bedroom', light: 'interiorNight',
    sfx: [{ type: 'tick', at: 0.2, n: 3, every: 0.9, soft: true }],
    setup(W) { const th = W.chars.theo; W.put(th, [-0.05, 0, -2.45], 0.15); th.setFace('creepy'); },
    update(W, t) {
      const th = W.chars.theo; th.setPose(W.Poses.idle(t));
      W.reach(th, 'L', [SWITCH[0] - 0.12, SWITCH[1] + 0.1, SWITCH[2] + 0.12]);
    },
    cam: { from: { pos: [0.55, 1.2, 0.9], look: [0.3, 0.98, -2.4], fov: 38 }, to: { pos: [0.42, 1.1, -0.6], look: [0.3, 0.98, -2.4], fov: 36 }, ease: 'linear', sway: 0.2 },
  },
  // 29
  { vo: 'I never let him.', set: 'bedroom', light: 'interiorNight',
    setup(W) {
      const m = W.chars.mia; W.put(m, [0.6, 0, -1.95], PI + 0.1); W.bloom.strength = 0.45;
    },
    update(W, t, u) {
      const m = W.chars.mia; m.setPose({ ...W.Poses.idle(t), waist: [0.42, 0, 0] });
      W.reach(m, 'R', [SWITCH[0] - 0.05, SWITCH[1] + 0.035 + 0.15 * Math.max(0, 1 - u * 2.2), SWITCH[2] + 0.0]);
    },
    cam: { from: { pos: [-0.35, 1.05, -2.3], look: [0.7, 0.78, -2.55], fov: 42 }, to: { pos: [-0.2, 1.0, -2.35], look: [0.7, 0.78, -2.55], fov: 40 }, sway: 0.4 },
  },
  // 30
  { vo: 'Keep your light on.', whisper: true, set: 'street', light: 'townFinal', dur: 3.4, sfx: [{ type: 'whoosh', at: 0.2, low: true }],
    setup(W) {
      for (const h of W.houses) h.windows.forEach((win, i) => win.setLit(!(h === W.figureHouse && i === 2)));
      W.farDarkGlass.material = W.GLASS_LIT;
      W.put(W.chars.figure, [8.25, 3.92, -11.89], -PI / 2);
    },
    update(W, t, u) {
      W.chars.figure.setPose({ shoulderR: [0, 0, -2.6 - 0.35 * Math.sin(t * 7)], elbowR: [0, 0, -0.3 * Math.sin(t * 7 + 1)] });
      W.grade.uniforms.dark.value = Math.max(0, (u - 0.88) / 0.12);
    },
    cam: { from: { pos: [3.7, 4.45, -11.6], look: [8.1, 4.45, -11.89], fov: 34 }, to: { pos: [-24, 52, 40], look: [0, 0, -40], fov: 44 }, ease: 'in', sway: 0.25 },
  },
];
