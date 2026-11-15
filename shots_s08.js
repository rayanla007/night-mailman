// STORY 08 — NAME SWAP (clip pack, stories/08_name_swap.txt)
import { morphName } from './engine/v8.js';
export const kit = ['cast4', 'mirror', 'names', 'mic'];
const PI = Math.PI;
const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const front = (p, rot, eyeY, d0, d1, fov = 40, side = 0, sway = 0.4) => {
  const dx = Math.sin(rot), dz = Math.cos(rot), sx = Math.cos(rot), sz = -Math.sin(rot);
  const at = d => [p[0] + dx * d + sx * side, eyeY, p[2] + dz * d + sz * side];
  return { from: { pos: at(d0), look: [p[0], eyeY - 0.05, p[2]], fov }, to: { pos: at(d1), look: [p[0], eyeY - 0.03, p[2]], fov }, sway };
};
const RY = W => W.chars.ivy, MAY = W => W.chars.mayor, KID = W => W.chars.kid, BAK = W => W.chars.baker, FIRE = W => W.chars.firefighter;
const TXT = (text, color = '#ffffff', y = 330, size = 96) => ({ type: 'text', text, y, size, color });
const NEW = 'ELI MARROW', OLD = 'RYAN', HIS = 'THOMAS GREY';
const NAMES = ['OLIVE', 'MARCUS', 'PIP', 'GRETA', 'DEV', 'JUNE', 'OTTO', 'NINA', 'BRUNO', 'IVY', 'SAM', 'LOLA', 'FINN', 'ROSA'];
const NAMES2 = ['BRUNO', 'IVY', 'OTTO', 'ROSA', 'PIP', 'SAM', 'JUNE', 'FINN', 'OLIVE', 'NINA', 'GRETA', 'LOLA', 'MARCUS', 'DEV'];
// crowd in the square, each with a name tag
const plaza = (W, t, n = 12, face = 'smile', tags = NAMES, flail = false) => W.crowd.forEach((c, i) => { if (i >= n) return; const a = i * 2.39, r = 3 + (i % 5) * 2.2; W.put(c, [Math.cos(a) * r, 0.12, 4 + Math.sin(a) * r], a + PI); c.setFace(face); c.setPose(flail ? { shoulderL: [0, 0, 2.4 + 0.3 * Math.sin(t * 7 + i)], shoulderR: [0, 0, -2.4 - 0.3 * Math.sin(t * 7 + i)] } : W.Poses.idle(t + i)); W.nameTag(c, typeof tags === 'function' ? tags(i) : tags[i % tags.length]); });
// close-up on a character's chest tag (character must face +z / rotY = 0)
const tagCam = (who, d0 = 0.75, d1 = 0.6, side = 0) => tagCam0(who, d0 + 0.55, d1 + 0.5, side);
const tagCam0 = (who, d0, d1, side = 0) => (t, u, W) => { const m = W.__tags.get(who(W)).m; const p = W.localPos(m); return { noDof: true, from: { pos: [p[0] + side, p[1] + 0.05, p[2] + d0], look: p, fov: 36 }, to: { pos: [p[0] + side, p[1] + 0.04, p[2] + d1], look: p, fov: 36 }, sway: 0.3 }; };
const NY = { set: 'square', light: 'nightTown', noKey: true };
const towerDoorCam = (d0, d1, y = 1.5) => ({ from: { pos: [1.6, y, -10.47 + d0], look: [1.6, y - 0.1, -10.47], fov: 44 }, to: { pos: [1.6, y, -10.47 + d1], look: [1.6, y - 0.1, -10.47], fov: 44 }, sway: 0.3, noDof: true });
const dusty = W => { W.grade.uniforms.sat.value = 0.55; W.coolAt([0, 2.5, 1.5], 0.9); };

export const shots = [
  // 1
  { ...NY, vo: 'In this town, every year, everyone swaps names.', update(W, t) { plaza(W, t, 14, 'laugh'); }, hud: [TXT('NAME SWAP NIGHT', '#ffd23a', 330, 84)],
    cam: { from: { pos: [8, 5, 20], look: [0, 1.5, 3], fov: 46 }, to: { pos: [7, 4.4, 17], look: [0, 1.5, 3], fov: 46 }, sway: 0.3 } },
  // 2
  { ...NY, vo: "At midnight, on New Year's, your name tag changes.", sfx: [{ type: 'chime', at: 'u0.5' }, { type: 'boom', at: 'u0.55' }], update(W, t, u) { const mid = u > 0.5; W.tower.setTime(mid ? 12 : 11, mid ? 0 : 59); W.tower.setDigital(mid ? '00:00:00' : '23:59:59'); if (mid) { W.activeSet.add(W.props.fireworks.group); W.props.fireworks.update(t); } plaza(W, t, 10, mid ? 'laugh' : 'smile', mid ? NAMES2 : NAMES, mid); },
    hud: [(t, u) => (u > 0.5 ? TXT('HAPPY NEW YEAR!', '#ffd23a', 330, 84) : null)], cam: { from: { pos: [0, 2, 16], look: [0, 16, -14], fov: 52 }, to: { pos: [0, 2, 15], look: [0, 17, -14], fov: 52 }, sway: 0.3 } },
  // 3
  { ...NY, vo: 'And whatever name you get...', update(W, t, u) { const c = W.crowd[0]; W.put(c, [0, 0.12, 2], 0); c.setFace('surprised'); c.setPose(W.Poses.idle(t)); W.nameTag(c, morphName('OLIVE', 'BRUNO', clamp01(u * 1.4), t)); }, cam: tagCam(W => W.crowd[0], 1.0, 0.8) },
  // 4
  { ...NY, vo: "that's who you are now.", setup(W) { W.put(RY(W), [0, 0.12, 2], 0); RY(W).setFace('serious'); }, update(W, t) { RY(W).setPose(W.Poses.idle(t)); W.nameTag(RY(W), OLD); }, cam: front([0, 0, 2], 0, 1.95, 2.6, 2.3, 40) },
  // 5
  { set: 'street', light: 'day', vo: 'Your job. Your house. Your family.', update(W, t) { const c = W.crowd[2]; W.put(c, [2, 0.06, 4 - t * 1.2], PI); c.setPose(W.Poses.walk(t * 6, 0.5)); W.nameTag(c, 'BRUNO'); },
    hud: [(t, u) => [TXT('YOUR JOB', '#ffd23a', 300, 70), ...(u > 0.33 ? [TXT('YOUR HOUSE', '#7fd3ff', 390, 70)] : []), ...(u > 0.66 ? [TXT('YOUR FAMILY', '#ff9bd2', 480, 70)] : [])]],
    cam: { from: { pos: [-1, 2.5, 10], look: [4, 2, -6], fov: 48 }, to: { pos: [-1, 2.4, 9], look: [4, 2, -6], fov: 48 }, sway: 0.3 } },
  // 6
  { set: 'shop', light: 'bright', vo: 'Last year, the baker became a firefighter.', setup(W) { W.put(BAK(W), [0, 0, 0], 0); BAK(W).setFace('surprised'); }, update(W, t, u) { BAK(W).setPose(W.Poses.idle(t)); W.nameTag(BAK(W), morphName('PIERRE', 'BLAZE', clamp01(u * 1.6 - 0.2), t)); },
    hud: [(t, u) => TXT(u > 0.5 ? 'BAKER → FIREFIGHTER' : 'BAKER', '#ffd23a', 330, 70)], cam: front([0, 0, 0], 0, 1.8, 3.6, 3.2, 42) },
  // 7
  { ...NY, light: 'bright', vo: 'The firefighter became the mayor.', setup(W) { W.put(FIRE(W), [0, 0.12, -5], 0); FIRE(W).setFace('laugh'); W.put(W.props.mic, [0, 0.12, -4.4], 0); },
    update(W, t) { FIRE(W).setPose({ shoulderR: [-1.5, 0, -0.2], elbowR: [-0.8, 0, 0], shoulderL: [0, 0, 2.6] }); W.nameTag(FIRE(W), 'GRIMSBY'); }, hud: [TXT('FIREFIGHTER → MAYOR', '#ff4d5e', 330, 70)], cam: front([0, 0, -5], 0, 2.0, 4.2, 3.6, 42) },
  // 8
  { ...NY, light: 'bright', vo: 'The mayor became a baby.', sfx: [{ type: 'pop', at: 0.2 }], setup(W) { W.put(MAY(W), [0, 0.12, 2], 0); MAY(W).group.scale.setScalar(0.42); MAY(W).setFace('crying'); },
    update(W, t) { MAY(W).setPose({ shoulderL: [0, 0, 2.2 + 0.4 * Math.sin(t * 12)], shoulderR: [0, 0, -2.2 - 0.4 * Math.sin(t * 12)] }); W.nameTag(MAY(W), 'BABY BO'); }, hud: [TXT('MAYOR → BABY', '#ff9bd2', 330, 80)],
    cam: { from: { pos: [0, 0.9, 4.0], look: [0, 0.75, 2], fov: 42 }, to: { pos: [0, 0.85, 3.6], look: [0, 0.75, 2], fov: 42 }, sway: 0.4 } },
  // 9
  { ...NY, vo: "It's chaos. But it's tradition.", sfx: [{ type: 'boom', at: 0.3 }], update(W, t) { W.activeSet.add(W.props.fireworks.group); W.props.fireworks.update(t); plaza(W, t, 14, 'laugh', NAMES2, true); }, cam: { from: { pos: [-8, 4, 18], look: [0, 4, 0], fov: 50 }, to: { pos: [-7, 3.6, 16], look: [0, 5, 0], fov: 50 }, sway: 0.5 } },
  // 10
  { ...NY, light: 'bright', vo: 'Everyone wears their name tag at all times.', update(W, t) { W.crowd.slice(0, 5).forEach((c, i) => { W.put(c, [-2.6 + i * 1.3, 0.12, 2], 0); c.setFace('smile'); c.setPose(W.Poses.idle(t + i)); W.nameTag(c, NAMES2[i]); }); },
    cam: (t) => ({ from: { pos: [-2.6 + t * 1.4, 1.6, 4.6], look: [-2.6 + t * 1.4, 1.4, 2], fov: 44 }, sway: 0.3, noDof: true }) },
  // 11
  { ...NY, vo: 'This year, I got a name nobody had ever heard of.', sfx: [{ type: 'whoosh', at: 'u0.3' }], setup(W) { W.put(RY(W), [0, 0.12, 2], 0); RY(W).setFace('surprised'); }, update(W, t, u) { RY(W).setPose(W.Poses.idle(t)); W.nameTag(RY(W), morphName(OLD, NEW, clamp01(u * 1.5 - 0.2), t)); }, cam: tagCam(RY, 1.0, 0.75) },
  // 12
  { ...NY, light: 'bright', vo: 'Nobody in town had that name.', setup(W) { W.put(RY(W), [0, 0.12, 2], 0); RY(W).setFace('worried'); }, update(W, t) { RY(W).setPose(W.Poses.idle(t)); W.nameTag(RY(W), NEW); W.crowd.slice(0, 6).forEach((c, i) => { const a = -1.2 + i * 0.5; W.put(c, [Math.sin(a) * 3.4, 0.12, 2 - Math.cos(a) * 3.4], a + PI); c.setFace(i % 2 ? 'worried' : 'unimpressed'); c.setPose({ ...W.Poses.idle(t + i), shoulderR: i % 3 === 0 ? [-1.5, 0, 0] : [0, 0, -0.06] }); W.nameTag(c, NAMES2[i]); }); },
    cam: { from: { pos: [0, 2.6, 6.5], look: [0, 1.3, 0.5], fov: 50 }, to: { pos: [0, 2.5, 6.0], look: [0, 1.3, 0.5], fov: 50 }, sway: 0.3 } },
  // 13
  { set: 'street', light: 'night', vo: 'No house. No job. No family.', setup(W) { W.put(RY(W), [0, 0.06, -2], 0); RY(W).setFace('crying'); }, update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), neck: [0.3, 0, 0] }); W.nameTag(RY(W), NEW); },
    hud: [(t, u) => [TXT('✗ NO HOUSE', '#ff4d5e', 300, 66), ...(u > 0.33 ? [TXT('✗ NO JOB', '#ff4d5e', 390, 66)] : []), ...(u > 0.66 ? [TXT('✗ NO FAMILY', '#ff4d5e', 480, 66)] : [])]],
    cam: { from: { pos: [0, 2.4, 6], look: [0, 1.4, -2], fov: 46 }, to: { pos: [0, 2.3, 5], look: [0, 1.4, -2], fov: 46 }, sway: 0.3 } },
  // 14
  { set: 'dining', light: 'interiorNight', vo: 'The mayor checked the town records.', sfx: [{ type: 'slide', at: 0.3 }], setup(W) { W.put(W.props.book, [0, 0.98, -2.6], 0); W.put(MAY(W), [0, 0, -3.5], 0); MAY(W).setFace('serious'); W.coolAt([0.8, 2.6, -0.8], 0.8); },
    update(W, t) { MAY(W).setPose({ waist: [0.35, 0, 0], neck: [0.3, 0, 0], shoulderR: [-1.0, 0, 0.2 + 0.2 * Math.sin(t * 4)], elbowR: [-0.4, 0, 0], shoulderL: [-1.0, 0, -0.2], elbowL: [-0.4, 0, 0] }); },
    cam: { from: { pos: [1.2, 2.4, -0.6], look: [0, 1.4, -3.0], fov: 46 }, to: { pos: [1.0, 2.3, -1.0], look: [0, 1.4, -3.0], fov: 46 }, sway: 0.3 } },
  // 15
  { set: 'dining', light: 'interiorDark', vo: '"This name doesn\'t exist."', tts: "This name doesn't exist.", setup(W) { W.put(W.props.book, [0, 0.98, -2.6], 0); W.put(MAY(W), [1.6, 0, -1.0], 0); MAY(W).setFace('serious'); W.coolAt([3.8, 1.6, 1.2], 0.55); }, update(W, t) { MAY(W).setPose(W.Poses.idle(t)); },
    hud: [{ type: 'badge', text: 'NAME NOT FOUND', y: 300 }], cam: front([1.6, 0, -1.0], 0, 2.2, 3.0, 2.6, 40) },
  // 16
  { set: 'street', light: 'night', vo: 'So I went looking.', sfx: [{ type: 'steps', at: 0.1, n: 5, every: 0.4 }], setup(W) { RY(W).setFace('serious'); W.hold(RY(W), W.props.lantern, 'wristR', [0, -0.25, 0.05]); },
    update(W, t) { W.put(RY(W), [1, 0.06, -2 - t * 1.4], PI); RY(W).setPose({ ...W.Poses.walk(t * 6, 0.5), shoulderR: [-0.6, 0, 0], elbowR: [-0.6, 0, 0] }); W.nameTag(RY(W), NEW); },
    cam: (t) => ({ from: { pos: [2.6, 1.8, 2 - t * 1.4], look: [1, 1.2, -6 - t * 1.4], fov: 48 }, sway: 0.5 }) },
  // 17
  { set: 'library', light: 'interiorNight', vo: 'The old library.', setup(W) { W.archiveBoxes.visible = false; W.put(RY(W), [0, 0, -2], PI); RY(W).setFace('worried'); W.hold(RY(W), W.props.lantern, 'wristR', [0, -0.25, 0.05]); }, update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderR: [-0.6, 0, 0], neck: [0, 0.6 * Math.sin(t * 1.5), 0] }); },
    cam: { from: { pos: [0.3, 2.4, 6], look: [0, 1.4, -4], fov: 50 }, to: { pos: [0.3, 2.3, 4.5], look: [0, 1.4, -4], fov: 50 }, sway: 0.4 } },
  // 18
  { set: 'library', light: 'interiorDark', vo: 'The town archive.', setup(W) { W.archiveBoxes.visible = true; W.libLamp.intensity = 2; W.put(RY(W), [-4.5, 0, 6.6], PI); RY(W).setFace('bored'); W.hold(RY(W), W.props.lantern, 'wristR', [0, -0.25, 0.05]); },
    update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderR: [-1.2, 0, 0], elbowR: [-0.4, 0, 0] }); }, cam: { from: { pos: [-2.2, 2.2, 3.2], look: [-5, 1.0, 8.2], fov: 50 }, to: { pos: [-2.4, 2.1, 3.6], look: [-5, 1.0, 8.2], fov: 50 }, sway: 0.3 } },
  // 19
  { set: 'cemetery', light: 'night', moonDir: [0.3, 0.8, 1], vo: 'The cemetery.', sfx: [{ type: 'wind', at: 0 }, { type: 'crickets', at: 0.1 }], fog: ['#1a3478', 6, 50], setup(W) { W.put(RY(W), [0.3, 0, -1], PI); RY(W).setFace('scared'); W.hold(RY(W), W.props.lantern, 'wristR', [0, -0.25, 0.05]); },
    update(W, t) { W.put(RY(W), [0.3, 0, -1 - t * 0.6], PI); RY(W).setPose({ ...W.Poses.walk(t * 5, 0.3), shoulderR: [-0.6, 0, 0] }); }, cam: { from: { pos: [1.5, 2.2, 6], look: [0, 1.2, -8], fov: 50 }, to: { pos: [1.4, 2.1, 5], look: [0, 1.2, -8], fov: 50 }, sway: 0.4 } },
  // 20
  { set: 'cemetery', light: 'night', moonDir: [0.3, 0.8, 1], vo: 'Nothing.', fog: ['#1a3478', 6, 50], sfx: [{ type: 'silence', at: 0 }], setup(W) { W.put(RY(W), [0.6, 0, -2.2], 0); RY(W).setFace('crying'); },
    update(W, t) { RY(W).setPose({ ...W.Poses.sit(), hipsY: -0.6, waist: [0.3, 0, 0], neck: [0.35, 0, 0] }); W.nameTag(RY(W), NEW); }, hud: [{ type: 'counter', label: 'RESULTS', value: '0', color: '#ff4d5e' }], cam: front([0.6, 0, -2.2], 0, 1.3, 3.0, 2.7, 42) },
  // 21
  { ...NY, light: 'nightTown', vo: 'Then I found it.', sfx: [{ type: 'chime', at: 0.2 }], setup(W) { W.put(RY(W), [1.6, 0.12, -8.2], PI); RY(W).setFace('surprised'); W.hold(RY(W), W.props.lantern, 'wristR', [0, -0.25, 0.05]); W.coolAt([1.6, 2.5, -8], 1.6); },
    update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderR: [-1.4, 0, 0], elbowR: [-0.3, 0, 0] }); }, cam: { from: { pos: [4.5, 2.2, -3], look: [1.6, 1.6, -10.5], fov: 48 }, to: { pos: [4.2, 2.1, -4], look: [1.6, 1.6, -10.5], fov: 48 }, sway: 0.3 } },
  // 22
  { ...NY, vo: 'Carved under the town clock tower.', setup(W) { W.coolAt([1.6, 2.5, -8], 1.6); }, cam: { from: { pos: [3, 0.6, -3], look: [0, 14, -14], fov: 56 }, to: { pos: [3, 0.6, -4], look: [0, 12, -14], fov: 56 }, sway: 0.3 } },
  // 23
  { ...NY, vo: 'One name.', setup(W) { W.coolAt([1.6, 2.5, -8], 1.6); }, hud: [TXT('ONE NAME', '#ffd23a', 330, 90)], cam: { from: { pos: [1.6, 2.2, -7.6], look: [1.6, 2.2, -10.5], fov: 40 }, to: { pos: [1.6, 2.2, -8.0], look: [1.6, 2.2, -10.5], fov: 40 }, sway: 0.3, noDof: true } },
  // 24
  { ...NY, vo: 'Mine.', sfx: [{ type: 'boom', at: 0.1 }], setup(W) { W.put(RY(W), [0, 0.12, 2], 0); RY(W).setFace('scared'); }, update(W, t) { RY(W).setPose(W.Poses.idle(t)); W.nameTag(RY(W), NEW); }, cam: tagCam(RY, 0.7, 0.55) },
  // 25
  { ...NY, vo: 'And a date.', setup(W) { W.coolAt([1.6, 2.5, -8], 1.6); }, cam: { from: { pos: [1.6, 1.95, -9.6], look: [1.6, 1.9, -10.5], fov: 40 }, to: { pos: [1.6, 1.95, -9.75], look: [1.6, 1.9, -10.5], fov: 40 }, sway: 0.3, noDof: true } },
  // 26
  { ...NY, vo: 'Exactly one hundred years ago.', setup(W) { W.coolAt([1.6, 2.5, -8], 1.6); }, hud: [TXT('100 YEARS AGO', '#ff4d5e', 330, 90)], cam: { from: { pos: [1.6, 2.1, -8.4], look: [1.6, 2.1, -10.5], fov: 44 }, to: { pos: [1.6, 2.1, -8.8], look: [1.6, 2.1, -10.5], fov: 44 }, sway: 0.3, noDof: true } },
  // 27
  { ...NY, vo: 'Under it, a little door.', setup(W) { W.coolAt([1.6, 2.5, -8], 1.6); }, cam: { from: { pos: [1.6, 2.2, -8.4], look: [1.6, 2.1, -10.5], fov: 44 }, to: { pos: [1.6, 1.0, -8.6], look: [1.6, 0.7, -10.5], fov: 44 }, sway: 0.3, noDof: true } },
  // 28
  { ...NY, vo: 'I opened it.', sfx: [{ type: 'creak', at: 0.2 }], setup(W) { W.coolAt([1.6, 2.5, -8], 1.6); },
    update(W, t, u) { W.props.towerDoor.setOpen(1.4 * ease(clamp01(u * 1.3))); },
    cam: { from: { pos: [0.4, 1.3, -7.9], look: [1.6, 0.65, -10.45], fov: 46 }, to: { pos: [0.5, 1.2, -8.2], look: [1.6, 0.65, -10.45], fov: 46 }, sway: 0.3, noDof: true } },
  // 29
  { set: 'dusty', light: 'interiorDark', vo: 'Inside, there was a dusty room.', setup(W) { dusty(W); }, update(W, t) { W.motes.position.y = -0.05 * t; }, cam: { from: { pos: [0, 2.3, 2.8], look: [0, 0.9, -2], fov: 56 }, to: { pos: [0, 2.2, 2.4], look: [0, 0.9, -2], fov: 56 }, sway: 0.3 } },
  // 30
  { set: 'dusty', light: 'interiorDark', vo: 'A bed.', setup(W) { dusty(W); }, cam: { from: { pos: [-0.6, 1.4, 0.4], look: [-1.9, 0.5, -1.6], fov: 46 }, to: { pos: [-0.7, 1.35, 0.2], look: [-1.9, 0.5, -1.6], fov: 46 }, sway: 0.3 } },
  // 31
  { set: 'dusty', light: 'interiorDark', vo: 'A desk.', setup(W) { dusty(W); }, cam: { from: { pos: [0.6, 1.6, -0.6], look: [1.4, 0.9, -2.2], fov: 44 }, to: { pos: [0.7, 1.55, -0.8], look: [1.4, 0.9, -2.2], fov: 44 }, sway: 0.3 } },
  // 32
  { set: 'dusty', light: 'interiorDark', vo: 'And a kid sitting there.', setup(W) { dusty(W); W.dustyChair.rotation.y = 0; W.put(KID(W), [1.4, 0.06, -1.5], PI); KID(W).setFace('neutral'); }, update(W, t) { KID(W).setPose({ ...W.Poses.sit(), hipsY: -0.32, shoulderL: [-1.2, 0, 0], shoulderR: [-1.2, 0, 0], elbowL: [-0.5, 0, 0], elbowR: [-0.5, 0, 0] }); },
    cam: { from: { pos: [0.2, 2.0, 2.2], look: [1.4, 1.0, -1.6], fov: 48 }, to: { pos: [0.3, 1.9, 1.8], look: [1.4, 1.0, -1.6], fov: 48 }, sway: 0.3 } },
  // 33
  { set: 'dusty', light: 'interiorDark', vo: 'Waiting.', sfx: [{ type: 'ticktock', at: 0 }], setup(W) { dusty(W); W.dustyChair.rotation.y = 0; W.put(KID(W), [1.4, 0.06, -1.5], PI); }, update(W, t) { KID(W).setPose({ ...W.Poses.sit(), hipsY: -0.32, shoulderL: [-1.2, 0, 0], shoulderR: [-1.2, 0, 0], elbowL: [-0.5, 0, 0], elbowR: [-0.5, 0, 0] }); },
    cam: { from: { pos: [3.0, 2.2, 1.6], look: [1.4, 1.0, -1.6], fov: 50 }, to: { pos: [2.9, 2.15, 1.4], look: [1.4, 1.0, -1.6], fov: 50 }, sway: 0.2 } },
  // 34
  { set: 'dusty', light: 'interiorDark', vo: 'He looked up at me.', setup(W) { dusty(W); W.dustyChair.rotation.y = PI; W.put(KID(W), [1.4, 0.06, -1.5], 0); KID(W).setFace('blankSmile'); }, update(W, t, u) { KID(W).setPose({ ...W.Poses.sit(), hipsY: -0.32, neck: [0.5 - 0.8 * ease(clamp01(u * 1.5)), 0, 0] }); W.nameTag(KID(W), NEW, { old: true }); },
    cam: front([1.4, 0, -1.5], 0, 1.6, 2.4, 2.1, 42) },
  // 35
  { set: 'dusty', light: 'interiorDark', vo: '"Finally," he said.', tts: 'Finally, he said.', setup(W) { dusty(W); W.dustyChair.rotation.y = PI; W.put(KID(W), [1.4, 0.06, -1.5], 0); KID(W).setFace('smirk'); }, update(W, t) { KID(W).setPose({ ...W.Poses.sit(), hipsY: -0.32, neck: [-0.3, 0, 0] }); W.nameTag(KID(W), NEW, { old: true }); },
    cam: front([1.4, 0, -1.5], 0, 1.6, 2.0, 1.8, 40) },
  // 36
  { set: 'dusty', light: 'interiorDark', vo: '"I\'ve been wearing your name for a hundred years."', tts: "I've been wearing your name for a hundred years.", setup(W) { dusty(W); W.dustyChair.rotation.y = PI; W.put(KID(W), [1.4, 0.06, -1.5], 0); KID(W).setFace('creepy'); }, update(W, t) { KID(W).setPose({ ...W.Poses.sit(), hipsY: -0.32, neck: [-0.3, 0, 0], shoulderL: [0, 0, 0.35], shoulderR: [0, 0, -0.35] }); W.nameTag(KID(W), NEW, { old: true }); }, cam: tagCam(KID, 0.9, 0.7) },
  // 37
  { set: 'dusty', light: 'interiorDark', vo: 'He pointed at my chest.', setup(W) { dusty(W); W.put(KID(W), [0.3, 0.06, -1.0], 0.6); KID(W).setFace('creepy'); W.put(RY(W), [0.9, 0.06, 0.6], PI + 0.3); RY(W).setFace('scared'); },
    update(W, t) { KID(W).setPose({ shoulderR: [-1.5, 0, 0], elbowR: [0, 0, 0] }); W.nameTag(KID(W), NEW, { old: true }); RY(W).setPose(W.Poses.idle(t)); W.nameTag(RY(W), NEW); },
    cam: { from: { pos: [-1.4, 1.9, 2.6], look: [0.6, 1.3, -0.2], fov: 54 }, to: { pos: [-1.3, 1.85, 2.4], look: [0.6, 1.3, -0.2], fov: 54 }, sway: 0.3 } },
  // 38
  { set: 'dusty', light: 'interiorDark', vo: 'My name tag was changing.', sfx: [{ type: 'buzz', at: 0.2 }], setup(W) { dusty(W); W.put(RY(W), [0, 0.06, 0], 0); RY(W).setFace('scared'); }, update(W, t, u) { RY(W).setPose(W.Poses.idle(t)); W.nameTag(RY(W), morphName(NEW, HIS, clamp01(u * 0.25), t)); }, cam: tagCam(RY, 0.8, 0.65) },
  // 39
  { set: 'dusty', light: 'interiorDark', vo: 'Letter by letter.', sfx: [{ type: 'tick', at: 0.2 }, { type: 'tick', at: 0.6 }, { type: 'tick', at: 1.0 }, { type: 'tick', at: 1.4 }], setup(W) { dusty(W); W.put(RY(W), [0, 0.06, 0], 0); RY(W).setFace('scared'); }, update(W, t, u) { RY(W).setPose(W.Poses.idle(t)); W.nameTag(RY(W), morphName(NEW, HIS, 0.25 + 0.55 * u, t)); }, cam: tagCam(RY, 0.6, 0.5) },
  // 40
  { set: 'dusty', light: 'interiorDark', vo: 'To his name.', sfx: [{ type: 'boom', at: 'u0.4' }], setup(W) { dusty(W); W.put(RY(W), [-0.6, 0.06, 0], 0.25); RY(W).setFace('scared'); W.put(KID(W), [0.7, 0.06, -0.2], -0.25); KID(W).setFace('creepy'); },
    update(W, t, u) { RY(W).setPose(W.Poses.idle(t)); KID(W).setPose(W.Poses.idle(t)); W.nameTag(RY(W), morphName(NEW, HIS, 0.8 + 0.5 * u, t)); W.nameTag(KID(W), morphName(NEW, OLD, clamp01(u * 1.6 - 0.2), t), { old: true }); },
    cam: { from: { pos: [0, 1.5, 2.8], look: [0, 1.2, 0], fov: 58 }, to: { pos: [0, 1.45, 2.6], look: [0, 1.2, 0], fov: 58 }, sway: 0.3 } },
];
