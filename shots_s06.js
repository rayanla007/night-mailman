// STORY 06 — PET RAIN (clip pack, stories/06_pet_rain.txt)
export const kit = ['cast4', 'weather', 'pets', 'mic'];
const PI = Math.PI;
const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const front = (p, rot, eyeY, d0, d1, fov = 40, side = 0, sway = 0.4) => {
  const dx = Math.sin(rot), dz = Math.cos(rot), sx = Math.cos(rot), sz = -Math.sin(rot);
  const at = d => [p[0] + dx * d + sx * side, eyeY, p[2] + dz * d + sz * side];
  return { from: { pos: at(d0), look: [p[0], eyeY - 0.05, p[2]], fov }, to: { pos: at(d1), look: [p[0], eyeY - 0.03, p[2]], fov }, sway };
};
const RY = W => W.chars.ivy, KAI = W => W.chars.jayden, MAY = W => W.chars.mayor, NB = W => W.chars.neighbor;
const TXT = (text, color = '#ffffff', y = 330, size = 96) => ({ type: 'text', text, y, size, color });
const Y = { set: 'yard', moonDir: [0.45, 0.8, 1], shadowSize: 18 };
const D = (o) => ({ ...Y, light: 'day', ...o });
const PK = (o) => ({ ...Y, light: 'pinkSky', ...o });
// a pet falling from the sky; lands at y=ground after (18-ground)/speed seconds
const drop = (W, p, x, z, t, start = 0, speed = 6, ground = 0, rotY = 0, h0 = 18) => {
  const y = Math.max(ground, h0 - Math.max(0, t - start) * speed), air = y > ground;
  W.put(p, [x, y, z], rotY + (air ? t * 1.3 + x : 0));
  if (air) { p.group.rotation.x = Math.sin(t * 3 + x) * 0.5; p.group.rotation.z = Math.cos(t * 2.3 + z) * 0.4; }
  if (p.setPose) p.setPose({ t, wag: air ? 0 : 1, earsBack: air ? 1 : 0, tongueOut: !air });
  if (p.setFace) p.setFace(air ? 'dogScared' : 'dog');
  return air;
};
const pk = (W, kind, i = 0) => W.pet(kind)[i];
const rain = (W, t, center = [0, 0, 0], speed = 14) => { W.activeSet.add(W.props.snow.group); W.props.snow.group.material.color.set('#9fc4ff'); W.props.snow.group.material.size = 0.07; W.props.snow.update(t, center, speed); };
const netUp = (W, who, net = W.props.bigNet) => { W.hold(who, net, 'wristR', [0, -0.1, 0.05], [PI, 0, 0]); };
const pinkClouds = W => W.yardCloudMat.color.set('#ffb3d6');
// lots of pets raining over the neighbourhood
const petStorm = (W, t, cx = 0, cz = 0, n = 14, speed = 5) => W.pets.slice(0, n).forEach((p, i) => {
  if (p.kind === 'llama' || p.kind === 'retriever') return;
  const x = cx + ((i * 7.3) % 22) - 11, z = cz + ((i * 4.1) % 12) - 6, ph = (i * 1.37) % 3.5;
  W.put(p, [x, 16 - (((t + ph) * speed) % 16), z], t * 1.4 + i); p.group.rotation.x = Math.sin(t * 3 + i) * 0.5;
  if (p.setPose) p.setPose({ t, wag: 0, earsBack: 1 }); if (p.setFace) p.setFace('dogScared');
});
const street = (W, t, n = 8, face = 'laugh', withGear = true) => W.crowd.slice(0, n).forEach((c, i) => {
  const x = -18 + i * 5 + (t * 3 % 5), z = 12.5 + (i % 2) * 2.5;
  W.put(c, [x, 0, z], PI / 2); c.setFace(face); c.setPose(W.Poses.run(t * 9 + i));
  if (withGear) { const g = i % 2 ? W.props.umbrellas[(i >> 1) % 6] : W.props.nets[(i >> 1) % 4]; if (g) W.hold(c, g, 'wristR', [0, -0.1, 0.05], i % 2 ? [0, 0, 0] : [0.3, 0, 0]); c.setPose({ ...W.Poses.run(t * 9 + i), shoulderR: [-2.6, 0, 0], elbowR: [0, 0, 0] }); }
});

export const shots = [
  // 1
  PK({ vo: 'In this town, once a year, it rains pets.', setup(W) { pinkClouds(W); }, update(W, t) { petStorm(W, t, 0, 4, 16, 4); },
    cam: { from: { pos: [0, 2.2, 15], look: [0, 6, 2], fov: 52 }, to: { pos: [0, 2.0, 13], look: [0, 6.5, 2], fov: 52 }, sway: 0.3 } }),
  // 2
  D({ vo: 'Not cats and dogs.', setup(W) { W.put(RY(W), [0, 0, 4], 0); RY(W).setFace('unimpressed'); },
    update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), neck: [0, 0.35 * Math.sin(t * 9), 0], shoulderR: [-0.6, 0, -0.2], elbowR: [-1.4, 0, 0] }); },
    hud: [TXT('NOT CATS & DOGS', '#ff4d5e', 330, 84)], cam: front([0, 0, 4], 0, 1.95, 2.7, 2.4, 40) }),
  // 3
  PK({ vo: 'Well, yes, cats and dogs.', setup(W) { pinkClouds(W); W.put(RY(W), [0, 0, 3.5], 0); RY(W).setFace('smirk'); }, update(W, t) { RY(W).setPose(W.Poses.idle(t)); drop(W, pk(W, 'kitten'), -0.9, 4.6, t, 0, 7, 0, 0.3, 10); drop(W, pk(W, 'puppy'), 0.9, 4.8, t, 0.35, 7, 0, -0.3, 10); },
    cam: { from: { pos: [0, 1.6, 9], look: [0, 1.3, 3.8], fov: 46 }, to: { pos: [0, 1.5, 8.4], look: [0, 1.1, 3.8], fov: 46 }, sway: 0.4 } }),
  // 4
  PK({ vo: 'But also hamsters. Parrots. Goldfish.', setup(W) { pinkClouds(W); W.pet('bunny')[1].group.scale.setScalar(0.55); },
    update(W, t, u) { drop(W, W.pet('bunny')[1], -1.2, 4, t, 0, 4, 0, 0, 6); drop(W, pk(W, 'parrot'), 0, 4, t, 0.7, 4, 0, 0, 7.5); drop(W, pk(W, 'fish', 0), 1.2, 4, t, 1.3, 4, 0.1, 0, 8.5); drop(W, pk(W, 'fish', 1), 1.6, 4.3, t, 1.6, 4, 0.1, 0, 8.5); },
    hud: [(t, u) => [u > 0.05 ? { type: 'text', text: 'HAMSTERS', y: 300, size: 70, color: '#ffd23a' } : null, u > 0.4 ? { type: 'text', text: 'PARROTS', y: 390, size: 70, color: '#40c463' } : null, u > 0.7 ? { type: 'text', text: 'GOLDFISH', y: 480, size: 70, color: '#ff9b4a' } : null].filter(Boolean)],
    cam: { from: { pos: [0, 2.0, 9], look: [0, 2.6, 4], fov: 46 }, to: { pos: [0, 1.6, 8.4], look: [0, 1.6, 4], fov: 46 }, sway: 0.4 } }),
  // 5
  PK({ vo: 'One year, a llama.', sfx: [{ type: 'thuds', at: 'u0.6' }], setup(W) { pinkClouds(W); W.put(RY(W), [-1.0, 0, 5.5], 0.5); RY(W).setFace('surprised'); },
    update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderL: [0, 0, 1.6], shoulderR: [0, 0, -1.6] }); drop(W, pk(W, 'llama'), 1.2, 3.5, t, 0, 10, 0, -0.4, 14); },
    hud: [TXT('2019', '#ffd23a', 330, 90)], cam: { from: { pos: [0, 1.8, 11], look: [0, 1.8, 3.5], fov: 46 }, to: { pos: [0, 1.7, 10.4], look: [0, 1.5, 3.5], fov: 46 }, sway: 0.5 } }),
  // 6
  D({ vo: 'Everyone runs outside with nets and umbrellas.', sfx: [{ type: 'run', at: 0 }], update(W, t) { street(W, t, 8); },
    cam: { from: { pos: [8, 1.8, 22], look: [-2, 1.4, 13], fov: 48 }, to: { pos: [6, 1.8, 21], look: [-4, 1.4, 13], fov: 48 }, sway: 0.6 } }),
  // 7
  D({ vo: 'Whatever lands in your yard is yours.', setup(W) { W.put(NB(W), [-14, 0, 3.5], 0.2); NB(W).setFace('laugh'); },
    update(W, t) { NB(W).setPose({ shoulderL: [-1.0, 0, -0.1], shoulderR: [-1.0, 0, 0.1], elbowL: [-0.5, 0, 0], elbowR: [-0.5, 0, 0] }); drop(W, pk(W, 'puppy', 2), -14, 4.4, t, 0, 7, 1.0, 0.2, 9); },
    hud: [{ type: 'text', text: 'YOUR YARD = YOUR PET', y: 330, size: 70, color: '#40c463' }], cam: front([-14, 0, 3.8], 0.15, 1.7, 5.5, 5.0, 44) }),
  // 8
  D({ vo: "That's the rule.", setup(W) { W.put(RY(W), [0, 0, 4], 0); RY(W).setFace('serious'); }, update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), neck: [0.15 * Math.max(0, Math.sin(t * 8)), 0, 0], shoulderR: [-1.5, 0, 0.3], elbowR: [-1.2, 0, 0] }); },
    hud: [{ type: 'badge', text: 'THE RULE', kind: 'ok', y: 300 }], cam: front([0, 0, 4], 0, 1.95, 2.3, 2.0, 40) }),
  // 9
  D({ vo: 'This year, I was ready.', setup(W) { W.put(RY(W), [0, 0, 4], 0); RY(W).setFace('smirk'); netUp(W, RY(W)); },
    update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderR: [-2.9, 0, -0.1], elbowR: [0, 0, 0], shoulderL: [0, 0, 0.5] }); }, cam: front([0, 0, 4], 0, 1.8, 6, 3.6, 46) }),
  // 10
  D({ vo: 'Biggest net in town.', setup(W) { W.put(RY(W), [0, 0, 4], 0); RY(W).setFace('laugh'); netUp(W, RY(W)); },
    update(W, t) { RY(W).setPose({ shoulderR: [-2.9, 0, -0.1], elbowR: [0, 0, 0], shoulderL: [0, 0, 0.8] }); }, hud: [TXT('BIGGEST NET', '#ffd23a', 330, 90)],
    cam: { from: { pos: [0.3, 0.4, 6.4], look: [0, 3.5, 4], fov: 54 }, to: { pos: [0.3, 0.4, 6.0], look: [0, 4.0, 4], fov: 54 }, sway: 0.3 } }),
  // 11
  D({ vo: 'Blanket on the grass.', setup(W) { W.put(RY(W), [0, 0, 1.9], 0); RY(W).setFace('smile'); },
    update(W, t) { RY(W).setPose({ waist: [0.9, 0, 0], shoulderL: [-1.2, 0, 0.1 + 0.3 * Math.sin(t * 5)], shoulderR: [-1.2, 0, -0.1 - 0.3 * Math.sin(t * 5)], hipL: [-0.5, 0, 0], hipR: [-0.5, 0, 0], kneeL: [0.9, 0, 0], kneeR: [0.9, 0, 0], hipsY: -0.25 }); },
    cam: { from: { pos: [0.4, 4.6, 5.6], look: [0, 0, 3.0], fov: 46 }, to: { pos: [0.4, 4.2, 5.2], look: [0, 0, 3.0], fov: 46 }, sway: 0.3 } }),
  // 12
  D({ vo: 'I wanted a puppy.', setup(W) { W.put(RY(W), [0, 0, 3.2], 0); RY(W).setFace('smile'); }, update(W, t) { RY(W).setPose({ ...W.Poses.idle(t), shoulderL: [-1.0, 0, -0.4], shoulderR: [-1.0, 0, 0.4], elbowL: [-1.4, 0, 0], elbowR: [-1.4, 0, 0], neck: [-0.2, 0.15, 0] }); },
    hud: [TXT('PUPPY ♥', '#ff7ac4', 330, 100)], cam: front([0, 0, 3.2], 0, 1.9, 2.3, 2.0, 38) }),
  // 13
  PK({ vo: 'The clouds turned pink.', sfx: [{ type: 'chime', at: 0.2 }], setup(W) { W.put(RY(W), [0, 0, 4], PI); RY(W).setFace('surprised'); },
    update(W, t, u) { W.yardCloudMat.color.setRGB(1, 1 - 0.3 * u, 1 - 0.16 * u); RY(W).setPose({ ...W.Poses.idle(t), neck: [-0.5, 0, 0] }); },
    cam: { from: { pos: [0.6, 1.0, 7], look: [0, 18, -30], fov: 56 }, to: { pos: [0.6, 1.0, 7], look: [0, 22, -30], fov: 56 }, sway: 0.3 } }),
  // 14
  PK({ vo: 'The first pets started falling.', sfx: [{ type: 'whoosh', at: 0.1 }], setup(W) { pinkClouds(W); }, update(W, t) { petStorm(W, t, 0, 2, 10, 4); street(W, t, 6, 'surprised', true); W.crowd.slice(0, 6).forEach((c, i) => { c.setPose({ shoulderR: [-2.6, 0, 0], neck: [-0.5, 0, 0] }); W.put(c, [-12 + i * 4.6, 0, 11.5 + (i % 2) * 2], PI); }); },
    cam: { from: { pos: [0, 1.3, 24], look: [0, 6, 2], fov: 52 }, to: { pos: [0, 1.3, 22], look: [0, 7, 2], fov: 52 }, sway: 0.4 } }),
  // 15
  PK({ vo: 'Puppies.', setup(W) { pinkClouds(W); }, update(W, t) { W.pet('puppy').forEach((p, i) => drop(W, p, -1.6 + i * 0.8, 2.4 + (i % 2) * 0.6, t, i * 0.12, 5, 0, 0, 4.2)); },
    hud: [TXT('PUPPIES', '#ffd23a', 330, 100)], cam: { from: { pos: [0, 1.4, 7.6], look: [0, 1.4, 2.6], fov: 46 }, to: { pos: [0, 1.1, 6.8], look: [0, 0.5, 2.6], fov: 46 }, sway: 0.4 } }),
  // 16
  PK({ vo: 'Kittens.', setup(W) { pinkClouds(W); }, update(W, t) { W.pet('kitten').forEach((p, i) => drop(W, p, -1.2 + i * 0.8, 2.4 + (i % 2) * 0.6, t, i * 0.12, 5, 0, 0, 4.2)); },
    hud: [TXT('KITTENS', '#ff9bd2', 330, 100)], cam: { from: { pos: [0.4, 1.4, 7.4], look: [0, 1.4, 2.6], fov: 44 }, to: { pos: [0.4, 1.1, 6.6], look: [0, 0.5, 2.6], fov: 44 }, sway: 0.4 } }),
  // 17
  PK({ vo: 'A very confused turtle.', setup(W) { pinkClouds(W); }, update(W, t) { const p = pk(W, 'turtle'); W.put(p, [0, 1.6 - 0.12 * t, 4], t * 0.8); p.group.rotation.z = Math.sin(t * 1.5) * 0.6; p.group.rotation.x = 0.3; },
    hud: [TXT('???', '#7fd3ff', 330, 110)], cam: { from: { pos: [0, 1.8, 6.6], look: [0, 1.4, 4], fov: 40 }, to: { pos: [0, 1.7, 6.3], look: [0, 1.3, 4], fov: 40 }, sway: 0.4, noDof: true } }),
  // 18
  PK({ vo: 'My neighbor caught a golden retriever.', sfx: [{ type: 'thuds', at: 'u0.55' }], setup(W) { pinkClouds(W); W.put(NB(W), [-14, 0, 3.5], 0.15); NB(W).setFace('surprised'); },
    update(W, t, u) { const air = drop(W, pk(W, 'retriever'), -14, 4.15, t, 0, 9, 0.75, 0.15, 10); NB(W).setFace(air ? 'surprised' : 'laugh'); NB(W).setPose({ shoulderL: [-1.3, 0, -0.1], shoulderR: [-1.3, 0, 0.1], elbowL: [-0.6, 0, 0], elbowR: [-0.6, 0, 0], waist: [air ? 0 : 0.1, 0, 0] }); },
    hud: [{ type: 'tag', text: 'Mrs. Dale', char: 'neighbor', color: '#40c463' }], cam: front([-14, 0, 3.6], 0.2, 1.6, 5.6, 5.0, 44) }),
  // 19
  PK({ vo: 'My best friend caught twin bunnies.', setup(W) { pinkClouds(W); W.put(KAI(W), [14, 0, 3.5], -0.15); KAI(W).setFace('laugh'); W.hold(KAI(W), W.pet('bunny')[0], 'wristL', [0, -0.2, 0.15], [-PI / 2, 0, 0]); W.hold(KAI(W), W.pet('bunny')[1], 'wristR', [0, -0.2, 0.15], [-PI / 2, 0, 0]); },
    update(W, t) { KAI(W).setPose({ shoulderL: [-1.5, 0, 0.5 + 0.2 * Math.sin(t * 6)], shoulderR: [-1.5, 0, -0.5 - 0.2 * Math.sin(t * 6)], elbowL: [-0.3, 0, 0], elbowR: [-0.3, 0, 0] }); },
    hud: [{ type: 'tag', text: 'Kai', char: 'jayden', color: '#7fe0b0' }], cam: front([14, 0, 3.6], -0.15, 1.5, 4.2, 3.7, 42) }),
  // 20
  PK({ vo: 'I caught nothing.', sfx: [{ type: 'silence', at: 0 }], setup(W) { pinkClouds(W); W.put(RY(W), [0, 0, 4], 0); RY(W).setFace('unimpressed'); netUp(W, RY(W)); },
    update(W, t) { RY(W).setPose({ shoulderR: [-2.6, 0, -0.1], elbowR: [0, 0, 0], neck: [0.15, 0, 0] }); }, cam: front([0, 0, 4], 0, 1.8, 3.6, 3.3, 42) }),
  // 21
  PK({ vo: 'Not one single pet.', setup(W) { pinkClouds(W); W.put(RY(W), [0, 0.08, 3.0], 0); RY(W).setFace('crying'); W.put(W.props.bigNet, [1.4, 0.05, 3.4], 0); W.props.bigNet.group.rotation.z = PI / 2; },
    update(W, t) { RY(W).setPose({ ...W.Poses.sit(), hipsY: -0.55, waist: [0.25, 0, 0], neck: [0.3, 0, 0], shoulderL: [-0.5, 0, 0], shoulderR: [-0.5, 0, 0], elbowL: [-1.4, 0, 0], elbowR: [-1.4, 0, 0] }); },
    hud: [{ type: 'counter', label: 'PETS', value: '0', color: '#ff4d5e' }], cam: { from: { pos: [0, 6.5, 6.5], look: [0, 0, 3.2], fov: 44 }, to: { pos: [0, 7.5, 7.0], look: [0, 0, 3.2], fov: 44 }, sway: 0.2 } }),
  // 22
  D({ vo: 'The sky went quiet.', light: 'dusk', sfx: [{ type: 'crickets', at: 0.2 }], cam: { from: { pos: [0, 1.5, 20], look: [0, 12, -10], fov: 54 }, to: { pos: [0, 1.5, 20], look: [0, 10, -10], fov: 54 }, sway: 0.2 } }),
  // 23
  D({ vo: 'Everyone went home happy.', light: 'dusk', setup(W) { W.put(RY(W), [0, 0.08, 3.0], 0); RY(W).setFace('worried'); },
    update(W, t) { RY(W).setPose({ ...W.Poses.sit(), hipsY: -0.55, waist: [0.2, 0, 0] }); [['puppy', 0], ['kitten', 1], ['puppy', 3], ['kitten', 2]].forEach(([k, i], j) => { const c = W.crowd[j], x = 14 - t * 1.6 - j * 3.2; W.put(c, [x, 0, 12 + (j % 2) * 1.8], -PI / 2); c.setFace('laugh'); c.setPose({ ...W.Poses.walk(t * 6 + j), ...W.Poses.carry(t) }); W.hold(c, pk(W, k, i), 'wristR', [-0.2, -0.25, 0.2], [0, PI / 2, 0]); }); },
    cam: { from: { pos: [2.5, 2.0, 21], look: [0, 0.8, 6], fov: 46 }, to: { pos: [2, 2.0, 20], look: [0, 0.8, 6], fov: 46 }, sway: 0.3 } }),
  // 24
  D({ vo: 'Then I heard it.', light: 'dusk', sfx: [{ type: 'pop', at: 'u0.3' }], setup(W) { W.put(RY(W), [0, 0.08, 3.0], 0); },
    update(W, t, u) { RY(W).setFace(u > 0.3 ? 'surprised' : 'worried'); RY(W).setPose({ ...W.Poses.sit(), hipsY: -0.55, neck: [0, u > 0.3 ? 0.6 : 0, 0] }); }, cam: front([0, 0, 3.0], 0, 1.4, 2.3, 2.0, 40) }),
  // 25
  D({ vo: 'A tiny squeak.', light: 'dusk', sfx: [{ type: 'chime', at: 0.3 }], setup(W) { W.put(W.props.bigNet, [1.4, 0.05, 3.4], 0); W.props.bigNet.group.rotation.z = PI / 2; },
    update(W, t) { W.props.bigNet.group.rotation.y = 0.04 * Math.sin(t * 20) * (t > 0.3 && t < 0.9 ? 1 : 0); }, hud: [(t, u) => (u > 0.15 ? { type: 'text', text: '*squeak*', y: 360, size: 90, color: '#ffffff', rot: -0.08 } : null)],
    cam: { from: { pos: [-1.4, 0.7, 5.0], look: [-1.2, 0.25, 3.4], fov: 40 }, to: { pos: [-1.3, 0.6, 4.7], look: [-1.2, 0.25, 3.4], fov: 40 }, sway: 0.3 } }),
  // 26
  D({ vo: 'Under my net.', light: 'dusk', setup(W) { W.put(W.props.bigNet, [1.4, 0.05, 3.4], 0); W.props.bigNet.group.rotation.z = PI / 2; W.props.pebble.setGrow(0.35); const h = W.localPos(W.props.bigNet.hoop); W.put(W.props.pebble, [h[0] + 0.2, 0.02, 3.4], 0.4); },
    update(W, t, u) { W.props.bigNet.group.rotation.z = PI / 2 - 0.5 * ease(clamp01(u * 1.6)); W.props.pebble.wag(t); },
    cam: (t, u, W) => { const h = W.localPos(W.props.bigNet.hoop); return { from: { pos: [h[0] + 0.6, 0.9, 5.6], look: [h[0] + 0.3, 0.3, 3.4], fov: 42 }, to: { pos: [h[0] + 0.55, 0.8, 5.2], look: [h[0] + 0.3, 0.3, 3.4], fov: 42 }, sway: 0.3 }; } }),
  // 27
  D({ vo: 'A puppy.', light: 'dusk', setup(W) { W.put(W.props.pebble, [0, 0.02, 3.4], 0); W.props.pebble.setGrow(0.35); }, update(W, t) { W.props.pebble.wag(t); },
    cam: { from: { pos: [0, 0.35, 4.4], look: [0, 0.3, 3.4], fov: 38 }, to: { pos: [0, 0.33, 4.2], look: [0, 0.3, 3.4], fov: 38 }, sway: 0.3, noDof: true } }),
  // 28
  D({ vo: "Smallest I've ever seen.", light: 'dusk', setup(W) { W.put(RY(W), [0, 0, 3.5], 0); RY(W).setFace('surprised'); W.props.pebble.setGrow(0.3); W.hold(RY(W), W.props.pebble, 'wristR', [0, -0.12, 0.05], [0, 0, 0]); },
    update(W, t) { RY(W).setPose({ shoulderR: [-1.6, 0, 0.3], elbowR: [-0.6, 0, 0], wristR: [0, 0, 0], neck: [0.2, 0, 0] }); W.props.pebble.wag(t); W.props.pebble.group.rotation.set(-PI / 2 + 0.4, 0, 0); }, hud: [{ type: 'text', text: 'TINY', y: 330, size: 90, color: '#ffd23a' }],
    cam: front([0, 0, 3.5], 0, 1.75, 2.5, 2.2, 42) }),
  // 29
  D({ vo: 'I called him Pebble.', light: 'dusk', setup(W) { W.put(RY(W), [0, 0, 3.5], 0); RY(W).setFace('laugh'); W.props.pebble.setGrow(0.3); W.hold(RY(W), W.props.pebble, 'wristR', [0.05, -0.12, 0.08], [-PI / 2 + 0.4, 0, 0]); },
    update(W, t) { RY(W).setPose({ shoulderR: [-1.3, 0, 0.6], elbowR: [-1.2, 0, 0], shoulderL: [-1.2, 0, -0.4], elbowL: [-1.0, 0, 0] }); W.props.pebble.wag(t); },
    hud: [{ type: 'tag', text: 'Pebble', obj: null, char: 'ivy', at: 0.72, color: '#7fd3ff' }], cam: front([0, 0, 3.5], 0, 1.7, 2.8, 2.5, 42) }),
  // 30
  D({ vo: "But Pebble didn't eat dog food.", light: 'dusk', setup(W) { W.put(W.props.pebble, [0, 0, 3.4], 0); W.props.pebble.setGrow(0.45); W.props.pebble.setFace('o'); W.put(W.props.bowl, [0, 0, 4.0], 0); },
    update(W, t) { W.props.pebble.head.rotation.y = 0.6 * Math.sin(t * 5); }, hud: [{ type: 'badge', text: 'DOG FOOD: NO', y: 300 }],
    cam: { from: { pos: [0.6, 0.7, 5.6], look: [0, 0.35, 3.6], fov: 40 }, to: { pos: [0.5, 0.65, 5.3], look: [0, 0.35, 3.6], fov: 40 }, sway: 0.3 } }),
  // 31
  D({ vo: "Pebble didn't bark.", light: 'dusk', setup(W) { W.put(W.props.pebble, [0, 0, 3.4], 0); W.props.pebble.setGrow(0.45); W.props.pebble.setFace('o'); W.put(RY(W), [-0.9, 0, 3.0], 0.6); RY(W).setFace('worried'); },
    update(W, t) { W.props.pebble.wag(t); RY(W).setPose({ waist: [0.5, 0, 0], hipL: [-0.4, 0, 0], hipR: [-0.4, 0, 0], kneeL: [0.8, 0, 0], kneeR: [0.8, 0, 0], hipsY: -0.2 }); },
    hud: [{ type: 'text', text: '. . .', y: 340, size: 110, color: '#ffffff' }], cam: { from: { pos: [0.4, 1.0, 6.2], look: [-0.3, 0.5, 3.3], fov: 42 }, to: { pos: [0.4, 0.95, 5.9], look: [-0.3, 0.5, 3.3], fov: 42 }, sway: 0.3 } }),
  // 32
  D({ vo: 'And every night, Pebble grew.', light: 'night', sfx: [{ type: 'ticktock', at: 0 }], setup(W) { W.put(W.props.pebble, [0, 0, 2.5], 0.3); },
    update(W, t, u) { const k = Math.min(2, Math.floor(u * 3)); W.props.pebble.setGrow([0.6, 1.2, 2.2][k]); W.props.pebble.wag(t); }, hud: [(t, u) => ({ type: 'text', text: 'NIGHT ' + (1 + Math.min(2, Math.floor(u * 3))), y: 330, size: 90, color: '#ffd23a' })],
    cam: { from: { pos: [3, 2.2, 11], look: [0, 1.3, 2.5], fov: 48 }, to: { pos: [3, 2.2, 11], look: [0, 1.6, 2.5], fov: 48 }, sway: 0.2 } }),
  // 33
  D({ vo: 'One week later, Pebble was as big as the house.', sfx: [{ type: 'boom', at: 0.2 }], setup(W) { W.props.yardBlanket.visible = false; W.put(W.props.pebble, [3, 0, 1.5], -0.3); W.props.pebble.setGrow(8); W.put(RY(W), [-3.5, 0, 8.5], 0.4); RY(W).setFace('scared'); },
    update(W, t) { W.props.pebble.wag(t * 0.5); RY(W).setPose({ ...W.Poses.idle(t), neck: [-0.6, 0, 0] }); }, hud: [TXT('1 WEEK LATER', '#ffd23a', 330, 80)],
    cam: { from: { pos: [-6, 1.2, 19], look: [0, 5, 0], fov: 52 }, to: { pos: [-6, 1.2, 18], look: [0, 5.6, 0], fov: 52 }, sway: 0.3 } }),
  // 34
  { vo: 'The mayor called an emergency meeting.', set: 'square', light: 'bright', noKey: true, sfx: [{ type: 'siren', at: 0 }], setup(W) { W.put(MAY(W), [0, 0.12, -5], 0); MAY(W).setFace('shout'); W.put(W.props.mic, [0, 0.12, -4.4], 0); },
    update(W, t) { MAY(W).setPose({ shoulderR: [-1.5, 0, -0.2], elbowR: [-0.8, 0, 0], shoulderL: [-0.4, 0, 0.6 + 0.3 * Math.sin(t * 6)] }); W.crowd.slice(0, 12).forEach((c, i) => { W.put(c, [-6 + (i % 6) * 2.4, 0.12, 2 + Math.floor(i / 6) * 2.2], PI); c.setFace('worried'); c.setPose(W.Poses.idle(t + i)); }); },
    hud: [{ type: 'badge', text: 'EMERGENCY MEETING', y: 300 }], cam: { from: { pos: [2.5, 5.0, 9], look: [0, 1.8, -5], fov: 44 }, to: { pos: [2.2, 4.6, 7.5], look: [0, 1.9, -5], fov: 44 }, sway: 0.4 } },
  // 35
  { vo: "Pebble wasn't a puppy.", set: 'square', light: 'bright', noKey: true, setup(W) { W.put(MAY(W), [0, 0.12, -5], 0); MAY(W).setFace('serious'); W.put(W.props.mic, [0, 0.12, -4.4], 0); }, update(W, t) { MAY(W).setPose({ shoulderR: [-1.5, 0, -0.2], elbowR: [-0.8, 0, 0] }); },
    hud: [{ type: 'badge', text: 'NOT A PUPPY', y: 300 }], cam: front([0, 0, -5], 0, 2.15, 3.0, 2.7, 40) },
  // 36
  D({ vo: 'Pebble was a baby cloud.', light: 'rainy', sfx: [{ type: 'wind', at: 0 }], setup(W) { W.props.yardBlanket.visible = false; W.put(W.props.pebble, [2, 9, -2], -0.2); W.props.pebble.setGrow(7); },
    update(W, t) { W.props.pebble.group.position.y = 9 + 0.6 * Math.sin(t * 1.5); W.props.pebble.wag(t * 0.5); rain(W, t, [0, 0, 0], 10); }, hud: [TXT('BABY CLOUD', '#7fd3ff', 330, 96)],
    cam: { from: { pos: [-4, 1.4, 20], look: [1, 9, -2], fov: 52 }, to: { pos: [-4, 1.4, 18.5], look: [1, 10, -2], fov: 52 }, sway: 0.3 } }),
  // 37
  D({ vo: 'And somewhere up there...', light: 'rainy', sfx: [{ type: 'rumble', at: 0, dur: 2 }], setup(W) { W.put(W.props.momCloud, [0, 60, -110], 0); W.props.momCloud.setFace('sad'); }, update(W, t) { rain(W, t, [0, 0, 6], 12); },
    cam: { from: { pos: [0, 1.4, 12], look: [0, 3, -10], fov: 52 }, to: { pos: [0, 1.4, 12], look: [0, 40, -110], fov: 52 }, ease: 'inOut', sway: 0.3 } }),
  // 38
  D({ vo: 'his mom was looking for him.', light: 'rainy', setup(W) { W.put(W.props.momCloud, [0, 60, -110], 0); W.props.momCloud.setFace('sad'); },
    update(W, t) { W.props.momCloud.group.rotation.y = 0.25 * Math.sin(t * 0.9); W.props.momCloud.group.position.x = 6 * Math.sin(t * 0.6); }, hud: [{ type: 'text', text: 'PEBBLE?!', y: 330, size: 100, color: '#ffffff' }],
    cam: { from: { pos: [0, 30, -40], look: [0, 60, -110], fov: 46 }, to: { pos: [0, 31, -45], look: [0, 60, -110], fov: 46 }, sway: 0.3, noDof: true } }),
  // 39
  D({ vo: "That's why this year...", light: 'rainy', setup(W) { W.put(RY(W), [0, 0, 5], PI); RY(W).setFace('crying'); W.hold(RY(W), W.props.umbrellas[1], 'wristR', [0, -0.1, 0.05]); W.props.pebble.setGrow(6); W.props.pebble.setFace('happy'); },
    update(W, t, u) { RY(W).setPose({ shoulderR: [-1.4, 0, 0.2], elbowR: [-1.2, 0, 0], shoulderL: [-2.8 + 0.3 * Math.sin(t * 6), 0, -0.3], neck: [-0.5, 0, 0] }); W.put(W.props.pebble, [0, 12 + u * 14, -14], 0); W.props.pebble.wag(t); rain(W, t, [0, 0, 5], 12); },
    cam: { from: { pos: [1.2, 0.9, 8.5], look: [0, 8, -8], fov: 54 }, to: { pos: [1.2, 0.9, 8.5], look: [0, 12, -10], fov: 54 }, sway: 0.3 } }),
  // 40
  D({ vo: 'it rained for forty days.', light: 'rainy', sfx: [{ type: 'rumble', at: 0, dur: 2 }], setup(W) { W.props.yardBlanket.visible = false; W.put(W.props.momCloud, [0, 50, -90], 0); W.props.momCloud.setFace('happy'); },
    update(W, t) { rain(W, t, [0, 0, 10], 14); W.crowd.slice(0, 5).forEach((c, i) => { W.put(c, [-10 + i * 5, 0, 12.5], PI / 2); c.setFace('crying'); c.setPose(W.Poses.walk(t * 5 + i, 0.3)); W.hold(c, W.props.umbrellas[i], 'wristR', [0, -0.1, 0.05]); c.setPose({ ...W.Poses.walk(t * 5 + i, 0.3), shoulderR: [-1.4, 0, 0.2], elbowR: [-1.2, 0, 0] }); }); },
    hud: [(t, u) => ({ type: 'text', text: 'DAY ' + Math.max(1, Math.min(40, Math.round(1 + u * 39))), y: 330, size: 110, color: '#7fd3ff' })],
    cam: { from: { pos: [14, 9, 32], look: [0, 4, 0], fov: 50 }, to: { pos: [12, 8, 29], look: [0, 4, 0], fov: 50 }, sway: 0.3 } }),
];
