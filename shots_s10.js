// STORY 10 — LOST & FOUND (clip pack, stories/10_lost_and_found.txt)
export const kit = ['cast4', 'mirror', 'lost'];
const PI = Math.PI;
const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const front = (p, rot, eyeY, d0, d1, fov = 40, side = 0, sway = 0.4) => {
  const dx = Math.sin(rot), dz = Math.cos(rot), sx = Math.cos(rot), sz = -Math.sin(rot);
  const at = d => [p[0] + dx * d + sx * side, eyeY, p[2] + dz * d + sz * side];
  return { from: { pos: at(d0), look: [p[0], eyeY - 0.05, p[2]], fov }, to: { pos: at(d1), look: [p[0], eyeY - 0.03, p[2]], fov }, sway };
};
const RY = W => W.chars.ivy, FIN = W => W.chars.finch, BRO = W => W.chars.theoDay, BRO2 = W => W.chars.brother2;
const TXT = (text, color = '#ffffff', y = 330, size = 96) => ({ type: 'text', text, y, size, color });
const LF = { set: 'lostfound', light: 'interiorNight' };
const EXT = { set: 'lostfound', light: 'day', moonDir: [0.3, 0.8, 1] };
const aisle = (W, num, title, kind, color) => { W.setAisleSign(num, title, color); W.setAisle(kind); };
const midShelf = (side = -1, y = 1.3) => ({ from: { pos: [-side * 0.2, 1.7, 0.8], look: [side * 2.4, y, -3.4], fov: 48 }, to: { pos: [-side * 0.1, 1.65, 0.3], look: [side * 2.4, y, -3.6], fov: 48 }, sway: 0.3 });
const shelfLight = (W, x = -1.0, z = -3) => W.coolAt([x, 1.9, z], 1.1);
// a sign shot: camera in the aisle mouth looking at the hanging sign
const signCam = { from: { pos: [0, 3.0, 6.0], look: [0, 4.2, 0.3], fov: 44 }, to: { pos: [0, 3.1, 5.0], look: [0, 4.3, 0.3], fov: 44 }, sway: 0.3 };
const downAisle = (y = 1.8, z0 = 3, z1 = 1) => ({ from: { pos: [0.4, y, z0], look: [0, 1.4, -18], fov: 50 }, to: { pos: [0.4, y, z1], look: [0, 1.4, -18], fov: 50 }, sway: 0.3 });
const shelfCam = (x, y, z, side = -1, d = 1.4) => ({ from: { pos: [x - side * d, y + 0.25, z + 0.5], look: [x, y, z], fov: 42 }, to: { pos: [x - side * (d - 0.2), y + 0.22, z + 0.35], look: [x, y, z], fov: 42 }, sway: 0.3, noDof: true });
// sleeping kids lying on the shelves (head toward -z, face up)
const KIDSPOTS = [[-2.55, 0.39, -2.2], [2.55, 0.39, -2.6], [-2.55, 2.39, -2.0], [2.55, 1.39, -4.4], [-2.55, 0.39, -5.6], [2.55, 2.39, -6.0]];
const sleepers = (W, tags = true) => W.sleepKids.forEach((k, i) => { const [x, y, z] = KIDSPOTS[i]; W.put(k, [x, y + 0.2, z], 0); k.group.rotation.x = -PI / 2; k.setFace('sleep'); k.setPose({ shoulderL: [0, 0, 0.1], shoulderR: [0, 0, -0.1] }); if (tags) W.hold(k, W.props.wristTags[i], 'wristR', [0, -0.15, 0.13], [0, 0, 0]); });
const bro2Sleep = (W) => { const b = BRO2(W); W.put(b, [-2.55, 1.59, -5.2], 0); b.group.rotation.x = -PI / 2; b.setFace('sleep'); b.setPose({}); };
const peopleAisle = (W) => { aisle(W, 16, 'LOST PEOPLE', 'people', '#ff4d5e'); W.aisleLamps.forEach((l, i) => { l.color.set('#ff9a8a'); l.intensity = 3; }); };
const desk = (W, finchFace = 'smile') => { W.put(FIN(W), [0, 0, 7.4], PI); FIN(W).setFace(finchFace); };
const inBed = (W, face = 'worried') => { W.props.lamp.setOn(0); const r = RY(W); W.put(r, [2.45, 0.8, -0.8], 0); r.group.rotation.set(-PI / 2, 0, 0); r.setFace(face); W.props.blanket.position.set(0, 0.92, 0.45); W.props.blanket.scale.set(1, 1, 0.8); W.coolAt([1.6, 2.3, 0.2], 1.4); };
const flyIn = (W, t, n = 12) => W.flyers.slice(0, n).forEach((f, i) => { W.activeSet.add(f); f.visible = true; const ph = ((t * 0.35 + i * 0.13) % 1); const sx = (i % 2 ? 1 : -1) * (30 + (i * 7) % 20); f.position.set(80 + sx * (1 - ph), 30 * Math.sin(ph * PI) + 6 * (1 - ph) + 3, 25 * (1 - ph) - 2); f.rotation.set(t * 3 + i, t * 2, i); });

export const shots = [
  // 1
  { ...EXT, vo: 'In this town, nothing stays lost.', update(W, t) { flyIn(W, t); }, cam: { from: { pos: [84, 3, 40], look: [80, 10, 0], fov: 50 }, to: { pos: [83, 3, 37], look: [80, 11, 0], fov: 50 }, sway: 0.3 } },
  // 2
  { ...EXT, vo: 'Everything you lose ends up in one place.', sfx: [{ type: 'whoosh', at: 0.3 }], update(W, t) { flyIn(W, t + 1.5, 14); }, cam: { from: { pos: [60, 6, 30], look: [80, 8, 0], fov: 50 }, to: { pos: [62, 6, 28], look: [80, 8, 0], fov: 50 }, sway: 0.4 } },
  // 3
  { ...EXT, vo: 'The Lost and Found.', sfx: [{ type: 'chime', at: 0.2 }], cam: { from: { pos: [80, 10, 16], look: [80, 12, 0], fov: 46 }, to: { pos: [80, 10.5, 14], look: [80, 12, 0], fov: 46 }, sway: 0.3 } },
  // 4
  { ...EXT, vo: 'A huge building in the center of town.', update(W, t) { W.crowd.slice(0, 6).forEach((c, i) => { W.put(c, [72 + i * 3, 0.08, 10 + (i % 2) * 2], PI + 0.2); c.setPose(W.Poses.walk(t * 5 + i, 0.4)); }); }, cam: { from: { pos: [92, 1.0, 30], look: [80, 14, 0], fov: 56 }, to: { pos: [91, 1.0, 28], look: [80, 15, 0], fov: 56 }, sway: 0.3 } },
  // 5
  { ...LF, vo: 'Lost keys. Lost socks. Lost homework.', setup(W) { aisle(W, 3, 'KEYS · SOCKS · HOMEWORK', 'misc'); shelfLight(W); }, cam: midShelf(-1, 1.0),
    hud: [(t, u) => [TXT('KEYS', '#ffd23a', 300, 70), ...(u > 0.33 ? [TXT('SOCKS', '#ff9bd2', 390, 70)] : []), ...(u > 0.66 ? [TXT('HOMEWORK', '#7fd3ff', 480, 70)] : [])]] },
  // 6
  { ...LF, vo: 'Even lost dogs.', sfx: [{ type: 'bark', at: 0.4 }], setup(W) { aisle(W, 3, 'KEYS · SOCKS · HOMEWORK', 'misc'); W.put(W.lostDog, [0, 0.05, -3], 0.3); }, update(W, t) { W.lostDog.setPose({ t, wag: 1, sit: 1 }); }, hud: [TXT('LOST DOGS', '#ff9b4a', 330, 90)],
    cam: { from: { pos: [0.3, 0.8, -0.8], look: [0, 0.6, -3], fov: 44 }, to: { pos: [0.3, 0.75, -1.1], look: [0, 0.6, -3], fov: 44 }, sway: 0.3 } },
  // 7
  { ...EXT, vo: 'You just walk in, find your stuff, and walk out.', update(W, t, u) { const c = W.crowd[3]; W.put(c, [80, 0.08, 1 + u * 8], 0); c.setFace('laugh'); c.setPose({ ...W.Poses.walk(t * 6, 0.5), shoulderR: [-2.7, 0, 0.1] }); W.hold(c, W.flyers[1], 'wristR', [0, -0.2, 0], [PI / 2, 0, 0]); W.flyers[1].visible = true; },
    cam: { from: { pos: [83, 2.2, 14], look: [80, 1.8, 2], fov: 48 }, to: { pos: [83, 2.2, 13], look: [80, 1.8, 4], fov: 48 }, sway: 0.4 } },
  // 8
  { ...LF, vo: 'Mister Finch runs it.', setup(W) { desk(W); }, update(W, t) { FIN(W).setPose(W.Poses.idle(t)); }, hud: [{ type: 'tag', text: 'Mr. Finch', char: 'finch', color: '#c9a0ff' }], cam: front([0, 0, 7.4], PI, 1.9, 3.4, 3.0, 42) },
  // 9
  { ...LF, vo: 'He has worked there for sixty years.', setup(W) { desk(W, 'smirk'); }, update(W, t) { FIN(W).setPose(W.Poses.idle(t)); }, hud: [{ type: 'counter', label: 'YEARS HERE', value: '60' }], cam: front([0, 0, 7.4], PI, 2.15, 2.4, 2.1, 40) },
  // 10
  { ...LF, vo: 'He knows where everything is.', setup(W) { desk(W, 'smirk'); W.put(RY(W), [0.4, 0, 5.4], 0.2); }, update(W, t) { FIN(W).setPose({ shoulderL: [-1.6, 0, 0.5], elbowL: [0, 0, 0] }); RY(W).setPose(W.Poses.idle(t)); },
    cam: { from: { pos: [2.6, 2.4, 3.6], look: [0, 1.8, 7.4], fov: 46 }, to: { pos: [2.4, 2.35, 3.9], look: [0, 1.8, 7.4], fov: 46 }, sway: 0.3 } },
  // 11
  { vo: 'Last week, I lost my backpack.', set: 'bedroom', light: 'morning', setup(W) { W.put(RY(W), [0, 0, 0.6], 0.4); RY(W).setFace('worried'); }, update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderL: [0, 0, 1.0], shoulderR: [0, 0, -1.0], neck: [0, 0.5 * Math.sin(t * 3), 0] }); },
    hud: [{ type: 'badge', text: 'BACKPACK: MISSING', y: 300 }], cam: front([0, 0, 0.6], 0.4, 1.8, 2.8, 2.5, 44) },
  // 12
  { ...EXT, vo: 'So I went to the Lost and Found.', sfx: [{ type: 'steps', at: 0.1, n: 5, every: 0.4 }], setup(W) { RY(W).setFace('smile'); }, update(W, t, u) { W.put(RY(W), [80, 0.08, 10 - u * 8], PI); RY(W).setPose(W.Poses.walk(t * 6, 0.5)); },
    cam: { from: { pos: [82, 2.4, 18], look: [80, 4, 0], fov: 48 }, to: { pos: [81.5, 2.4, 16], look: [80, 4, 0], fov: 48 }, sway: 0.4 } },
  // 13
  { ...LF, vo: 'Aisle twelve. Backpacks.', setup(W) { aisle(W, 12, 'BACKPACKS', 'backpacks', '#7fd3ff'); }, cam: { from: { pos: [0, 3.0, 6.0], look: [0, 3.2, -6], fov: 50 }, to: { pos: [0, 2.6, 4.0], look: [0, 2.2, -8], fov: 50 }, sway: 0.3 } },
  // 14
  { ...LF, vo: 'Right next to aisle thirteen.', setup(W) { aisle(W, 13, 'LOST TIME', 'time', '#ffd23a'); W.put(RY(W), [0.4, 0, 3.4], PI); RY(W).setFace('surprised'); }, update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), neck: [-0.4, 0, 0] }); }, cam: signCam },
  // 15
  { ...LF, vo: 'Lost time.', setup(W) { aisle(W, 13, 'LOST TIME', 'time', '#ffd23a'); }, hud: [TXT('LOST TIME', '#ffd23a', 330, 100)], cam: downAisle(2.0) },
  // 16
  { ...LF, vo: 'Jars full of glowing minutes.', setup(W) { aisle(W, 13, 'LOST TIME', 'time', '#ffd23a'); shelfLight(W, -1.0, -3.6); }, cam: midShelf(-1, 1.5) },
  // 17
  { ...LF, vo: '"Lost when you were bored," the labels said.', tts: 'Lost when you were bored, the labels said.', setup(W) { aisle(W, 13, 'LOST TIME', 'time', '#ffd23a'); W.coolAt([-0.6, 2.2, -2.2], 0.35); }, cam: { from: { pos: [-1.5, 1.66, -3.3], look: [-2.4, 1.59, -3.5], fov: 34 }, to: { pos: [-1.6, 1.65, -3.32], look: [-2.4, 1.59, -3.5], fov: 34 }, sway: 0.2, noDof: true } },
  // 18
  { ...LF, vo: 'Aisle fourteen.', setup(W) { aisle(W, 14, 'LOST MEMORIES', 'memories', '#ff9bd2'); }, cam: signCam },
  // 19
  { ...LF, vo: 'Lost memories.', setup(W) { aisle(W, 14, 'LOST MEMORIES', 'memories', '#ff9bd2'); }, hud: [TXT('LOST MEMORIES', '#ff9bd2', 330, 84)], cam: downAisle(1.6) },
  // 20
  { ...LF, vo: 'Aisle fifteen.', setup(W) { aisle(W, 15, 'LOST VOICES', 'voices', '#9fd8ff'); }, cam: signCam },
  // 21
  { ...LF, vo: 'Lost voices.', sfx: [{ type: 'buzz', at: 0.2 }], setup(W) { aisle(W, 15, 'LOST VOICES', 'voices', '#9fd8ff'); shelfLight(W, 1.0, -3); }, hud: [{ type: 'text', text: '"...help..."', y: 340, size: 70, color: '#9fd8ff', rot: -0.06, alpha: 0.85 }], cam: midShelf(1, 1.2) },
  // 22
  { ...LF, light: 'interiorDark', vo: 'And at the very end...', sfx: [{ type: 'steps', at: 0.1, n: 5, every: 0.45 }], setup(W) { aisle(W, 16, '', 'none', '#ff4d5e'); W.aisleLamps.forEach(l => (l.intensity = 1.5)); RY(W).setFace('worried'); },
    update(W, t, u) { W.put(RY(W), [0, 0, -2 - u * 6], PI); RY(W).setPose(W.Poses.walk(t * 5, 0.35)); }, cam: (t, u) => ({ from: { pos: [0.6, 1.8, 2 - u * 6], look: [0, 1.4, -20], fov: 48 }, sway: 0.4 }) },
  // 23
  { ...LF, light: 'interiorDark', vo: 'aisle sixteen.', sfx: [{ type: 'buzz', at: 0.1 }], setup(W) { peopleAisle(W); }, update(W, t) { W.aisleLamps.forEach(l => (l.intensity = Math.sin(t * 23) > -0.3 ? 3 : 0.4)); }, cam: signCam },
  // 24
  { ...LF, light: 'interiorDark', vo: 'Lost people.', sfx: [{ type: 'silence', at: 0 }], setup(W) { peopleAisle(W); }, hud: [TXT('LOST PEOPLE', '#ff4d5e', 330, 96)], cam: downAisle(2.0, 6, 4) },
  // 25
  { ...LF, light: 'interiorDark', vo: 'Shelves of sleeping kids.', setup(W) { peopleAisle(W); sleepers(W, false); shelfLight(W, -0.8, -3.0); }, cam: { from: { pos: [0.2, 1.4, 0.8], look: [-2.4, 0.8, -3.4], fov: 52 }, to: { pos: [0.1, 1.35, 0.4], look: [-2.4, 0.8, -3.6], fov: 52 }, sway: 0.3 } },
  // 26
  { ...LF, light: 'interiorDark', vo: 'Hundreds of them.', setup(W) { peopleAisle(W); sleepers(W, false); }, hud: [{ type: 'counter', label: 'SLEEPING', value: '300+', color: '#ff4d5e' }], cam: { from: { pos: [0, 4.4, -1.0], look: [0, 1.2, -20], fov: 54 }, to: { pos: [0, 4.2, -3.0], look: [0, 1.2, -20], fov: 54 }, sway: 0.3 } },
  // 27
  { ...LF, light: 'interiorDark', vo: 'Each with a tag on their wrist.', setup(W) { peopleAisle(W); sleepers(W, true); shelfLight(W, -1.2, -1.6); }, cam: (t, u, W) => { const p = W.localPos(W.props.wristTags[0].group); return { noDof: true, from: { pos: [p[0] + 0.7, p[1] + 0.35, p[2] + 0.3], look: p, fov: 36 }, to: { pos: [p[0] + 0.6, p[1] + 0.3, p[2] + 0.25], look: p, fov: 36 }, sway: 0.2 }; } },
  // 28
  { ...LF, light: 'interiorDark', vo: 'One of them was my brother.', sfx: [{ type: 'boom', at: 0.3 }], setup(W) { peopleAisle(W); sleepers(W, false); bro2Sleep(W); shelfLight(W, -0.9, -4.6); W.put(RY(W), [0.7, 0, -5.4], -PI / 2); RY(W).setFace('scared'); }, update(W, t) { RY(W).setPose(W.Poses.idle(t)); },
    hud: [{ type: 'tag', text: 'MY BROTHER?', char: 'brother2', color: '#ff4d5e' }], cam: { from: { pos: [0.2, 2.2, -3.0], look: [-2.4, 1.6, -5.4], fov: 52 }, to: { pos: [0.1, 2.15, -3.3], look: [-2.4, 1.6, -5.4], fov: 52 }, sway: 0.3 } },
  // 29
  { set: 'dining', light: 'interiorNight', vo: 'Except my brother is at home.', setup(W) { W.put(BRO(W), [0, 0, -3.5], 0); BRO(W).setFace('smile'); W.hold(BRO(W), W.props.spoon, 'wristR', [0, -0.12, 0.05]); W.coolAt([0, 2.4, -0.6], 0.6); }, update(W, t) { BRO(W).setPose({ shoulderR: [-1.3 - 0.3 * Math.max(0, Math.sin(t * 4)), 0, 0.2], elbowR: [-1.0, 0, 0] }); },
    cam: { from: { pos: [0, 2.0, 3.6], look: [0, 1.2, -3], fov: 46 }, to: { pos: [0, 1.95, 3.0], look: [0, 1.2, -3], fov: 46 }, sway: 0.3 } },
  // 30
  { set: 'dining', light: 'interiorNight', vo: 'Eating dinner.', setup(W) { W.put(BRO(W), [0, 0, -3.5], 0); BRO(W).setFace('smile'); W.hold(BRO(W), W.props.spoon, 'wristR', [0, -0.12, 0.05]); W.coolAt([0, 2.4, -0.6], 0.6); }, update(W, t) { BRO(W).setPose({ shoulderR: [-1.3 - 0.5 * Math.max(0, Math.sin(t * 4)), 0, 0.2], elbowR: [-1.2, 0, 0] }); },
    cam: front([0, 0, -3.5], 0, 1.3, 2.0, 1.8, 40) },
  // 31
  { set: 'dining', light: 'interiorNight', vo: 'Right now.', sfx: [{ type: 'ticktock', at: 0 }], setup(W) { W.put(BRO(W), [0, 0, -3.5], 0); BRO(W).setFace('blankSmile'); W.coolAt([0, 2.4, -0.6], 0.6); }, update(W, t) { BRO(W).setPose({}); }, hud: [{ type: 'badge', text: 'LIVE · 7:42 PM', y: 300 }], cam: front([0, 0, -3.5], 0, 1.3, 1.5, 1.3, 38) },
  // 32
  { ...LF, vo: 'I ran to Mister Finch.', sfx: [{ type: 'run', at: 0 }], setup(W) { aisle(W, 12, 'BACKPACKS', 'none'); RY(W).setFace('scared'); }, update(W, t, u) { W.put(RY(W), [0, 0, -6 + u * 10], 0); RY(W).setPose(W.Poses.run(t * 9)); }, cam: (t, u) => ({ from: { pos: [0.5, 1.7, -6 + u * 10 + 3.2], look: [0, 1.4, -6 + u * 10], fov: 50 }, sway: 0.7 }) },
  // 33
  { ...LF, vo: '"Who\'s that at my house?" I asked.', tts: "Who's that at my house? I asked.", setup(W) { desk(W, 'smile'); W.put(RY(W), [0, 0, 5.5], 0); RY(W).setFace('shout'); }, update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderL: [-1.3, 0, 0.3], shoulderR: [-1.3, 0, -0.3] }); FIN(W).setPose(W.Poses.idle(t)); },
    cam: { from: { pos: [-2.2, 2.4, 3.6], look: [0, 1.8, 6.6], fov: 50 }, to: { pos: [-2.1, 2.35, 3.8], look: [0, 1.8, 6.6], fov: 50 }, sway: 0.4 } },
  // 34
  { ...LF, vo: 'He smiled.', setup(W) { desk(W, 'blankSmile'); }, update(W, t) { FIN(W).setPose(W.Poses.idle(t)); }, cam: front([0, 0, 7.4], PI, 2.15, 2.2, 1.9, 40) },
  // 35
  { ...LF, vo: '"Whatever the town finds..." he said.', tts: 'Whatever the town finds, he said.', setup(W) { desk(W, 'smirk'); }, update(W, t) { FIN(W).setPose({ ...W.Poses.idle(t), shoulderR: [-1.2, 0, -0.3], elbowR: [-0.8, 0, 0] }); }, cam: front([0, 0, 7.4], PI, 2.1, 2.6, 2.3, 40) },
  // 36
  { ...LF, vo: '"it gives back."', tts: 'it gives back.', setup(W) { desk(W, 'smile'); }, update(W, t) { FIN(W).setPose({ shoulderL: [-1.4, 0, 0.6], elbowL: [-0.2, 0, 0], shoulderR: [-1.4, 0, -0.6], elbowR: [-0.2, 0, 0] }); }, cam: front([0, 0, 7.4], PI, 2.0, 3.0, 2.7, 42) },
  // 37
  { ...LF, light: 'interiorDark', vo: '"Even if it isn\'t the same."', tts: "Even if it isn't the same.", sfx: [{ type: 'silence', at: 0 }], setup(W) { desk(W, 'creepy'); }, update(W, t) { FIN(W).setPose(W.Poses.idle(t)); }, cam: front([0, 0, 7.4], PI, 2.15, 1.8, 1.55, 38) },
  // 38
  { vo: "That night, my brother asked me where I'd been.", set: 'bedroom', light: 'interiorNight', setup(W) { inBed(W, 'worried'); W.put(BRO(W), [1.0, 0, -0.2], PI / 2); BRO(W).setFace('smile'); }, update(W, t) { BRO(W).setPose(W.Poses.idle(t)); },
    cam: { from: { pos: [3.4, 2.2, 2.4], look: [1.4, 1.1, -0.6], fov: 60 }, to: { pos: [3.3, 2.15, 2.2], look: [1.4, 1.1, -0.6], fov: 60 }, sway: 0.3 } },
  // 39
  { vo: 'I told him the Lost and Found.', set: 'bedroom', light: 'interiorNight', setup(W) { inBed(W, 'serious'); }, cam: { from: { pos: [1.3, 2.7, 0.6], look: [2.45, 0.9, -2.0], fov: 42 }, to: { pos: [1.5, 2.55, 0.1], look: [2.45, 0.9, -2.1], fov: 40 }, sway: 0.3 } },
  // 40
  { vo: 'He stopped smiling.', set: 'bedroom', light: 'interiorNight', setup(W) { W.put(BRO(W), [1.0, 0, -0.2], PI / 2); W.coolAt([2.4, 2.0, 0.4], 1.2); }, update(W, t, u) { BRO(W).setFace(u < 0.4 ? 'smile' : 'serious'); BRO(W).setPose(W.Poses.idle(t)); }, cam: front([1.0, 0, -0.2], PI / 2, 1.25, 1.9, 1.7, 40) },
  // 41
  { vo: '"Don\'t go back there," he whispered.', tts: "Don't go back there, he whispered.", set: 'bedroom', light: 'interiorDark', setup(W) { W.put(BRO(W), [1.0, 0, -0.2], PI / 2); BRO(W).setFace('worried'); W.coolAt([2.4, 2.0, 0.4], 1.2); }, update(W, t) { BRO(W).setPose({ ...W.Poses.idle(t), waist: [0.2, 0, 0] }); },
    hud: [{ type: 'text', text: "don't go back.", y: 330, size: 74, color: '#cfd6e6' }], cam: front([1.0, 0, -0.2], PI / 2, 1.2, 1.4, 1.25, 38) },
  // 42
  { ...LF, light: 'interiorDark', vo: '"They\'re running out of shelves."', tts: "They're running out of shelves.", sfx: [{ type: 'boom', at: 'end-0.8' }], setup(W) { peopleAisle(W); sleepers(W, false); W.ryanLabel.visible = true; shelfLight(W, -0.8, -2.8); },
    update(W, t, u) { W.grade.uniforms.dark.value = u > 0.85 ? (u - 0.85) * 6 : 0; }, cam: { from: { pos: [0.4, 1.7, -1.6], look: [-2.3, 1.5, -3.4], fov: 46 }, to: { pos: [-0.6, 1.62, -2.6], look: [-2.3, 1.5, -3.4], fov: 40 }, sway: 0.3, noDof: true } },
];
