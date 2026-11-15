// Story 06 — Pet Rain: backyard set, falling pets, nets, umbrellas, Pebble the cloud puppy
import * as THREE from 'three';
import { std, rb, box, mesh, canvasTex, makeHouse, makeTree, makePicketFence } from './props.js';
import { makeDog, makeCharacter } from './character.js';

export const PRESETS_V6 = {
  pinkSky: { top: '#ff7ab8', mid: '#ffb3d6', bottom: '#ffe0ee', fog: '#ffc9e2', fogNear: 60, fogFar: 380, hemi: ['#fff0f7', '#a07a90', 1.8], key: ['#ffe6f2', 2.6], fill: 0.7, stars: false, moon: false, clouds: true, bloom: [0.35, 0.45, 0.92] },
  rainy: { top: '#4a5874', mid: '#7d8aa6', bottom: '#aab4c8', fog: '#9aa5bb', fogNear: 30, fogFar: 220, hemi: ['#d6def0', '#5a6478', 1.7], key: ['#e8eeff', 1.8], fill: 0.6, stars: false, moon: false, clouds: true, bloom: [0.3, 0.4, 0.95] },
};

const M = c => std(c, { roughness: 0.55 });

function faceTex(kind = 'happy') {
  return canvasTex(256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    const eye = (cx, cy) => { x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(cx, cy, 30, 36, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#1a1420'; x.beginPath(); x.ellipse(cx + 2, cy + 6, 17, 22, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + 8, cy - 2, 7, 0, Math.PI * 2); x.fill(); };
    eye(80, 110); eye(176, 110);
    x.strokeStyle = '#1a1420'; x.lineWidth = 10; x.lineCap = 'round';
    if (kind === 'happy') { x.beginPath(); x.arc(128, 160, 34, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke(); }
    else if (kind === 'sad') { x.beginPath(); x.arc(128, 205, 30, 1.2 * Math.PI, 1.8 * Math.PI); x.stroke(); x.fillStyle = '#6fc3ff'; x.beginPath(); x.ellipse(70, 160, 10, 16, 0, 0, Math.PI * 2); x.fill(); }
    else { x.beginPath(); x.ellipse(128, 175, 16, 20, 0, 0, Math.PI * 2); x.stroke(); }
    x.fillStyle = 'rgba(255,120,170,0.45)'; for (const cx of [48, 208]) { x.beginPath(); x.ellipse(cx, 160, 22, 13, 0, 0, Math.PI * 2); x.fill(); }
  });
}

// simple blocky critters (front = +z)
function makeCat(fur = '#9aa0ad') {
  const d = makeDog({ fur, dark: fur, muzzle: '#f2f2f2', scale: 0.55 });
  d.head.children.filter(c => c.type === 'Group').forEach(e => { e.scale.set(1, 0.45, 0.8); e.position.y = 0.32; e.rotation.set(0, 0, 0); });
  return d;
}
function makeBunny(fur = '#ffffff') {
  const g = new THREE.Group(); const m = M(fur);
  mesh(rb(0.36, 0.32, 0.42, 0.08), m, 0, 0.18, 0, g);
  mesh(rb(0.3, 0.28, 0.28, 0.07), m, 0, 0.42, 0.14, g);
  for (const s of [1, -1]) mesh(rb(0.07, 0.3, 0.05, 0.02), M('#ffc6dc'), s * 0.07, 0.68, 0.12, g);
  mesh(rb(0.12, 0.12, 0.08, 0.04), m, 0, 0.2, -0.24, g);
  const f = mesh(new THREE.PlaneGeometry(0.26, 0.24), new THREE.MeshBasicMaterial({ map: faceTex('happy'), transparent: true, depthWrite: false }), 0, 0.42, 0.285, g, { cast: false });
  f.renderOrder = 2;
  return { group: g };
}
function makeTurtle() {
  const g = new THREE.Group();
  mesh(rb(0.6, 0.26, 0.7, 0.1), M('#3f9a4f'), 0, 0.22, 0, g);
  mesh(rb(0.5, 0.08, 0.6, 0.03), M('#c8b06a'), 0, 0.1, 0, g);
  mesh(rb(0.22, 0.2, 0.24, 0.06), M('#8ccf6a'), 0, 0.2, 0.44, g);
  for (const [x, z] of [[0.24, 0.24], [-0.24, 0.24], [0.24, -0.24], [-0.24, -0.24]]) mesh(rb(0.12, 0.14, 0.12, 0.03), M('#8ccf6a'), x, 0.07, z, g);
  const f = mesh(new THREE.PlaneGeometry(0.2, 0.18), new THREE.MeshBasicMaterial({ map: faceTex('o'), transparent: true, depthWrite: false }), 0, 0.22, 0.565, g, { cast: false }); f.renderOrder = 2;
  return { group: g };
}
function makeFish() {
  const g = new THREE.Group();
  mesh(rb(0.12, 0.26, 0.4, 0.05), M('#ff8a1f'), 0, 0, 0, g);
  const t = mesh(rb(0.04, 0.24, 0.18, 0.02), M('#ffb04a'), 0, 0, -0.26, g); t.rotation.x = 0.3;
  for (const s of [1, -1]) { mesh(new THREE.CircleGeometry(0.045, 16), new THREE.MeshBasicMaterial({ color: '#ffffff' }), s * 0.062, 0.04, 0.1, g).rotation.y = s * Math.PI / 2; mesh(new THREE.CircleGeometry(0.025, 12), new THREE.MeshBasicMaterial({ color: '#1a1420' }), s * 0.064, 0.04, 0.11, g).rotation.y = s * Math.PI / 2; }
  return { group: g };
}
function makeParrot() {
  const g = new THREE.Group();
  mesh(rb(0.26, 0.4, 0.26, 0.07), M('#2fc45a'), 0, 0.2, 0, g);
  mesh(rb(0.24, 0.22, 0.22, 0.06), M('#ff3b4e'), 0, 0.5, 0.02, g);
  mesh(rb(0.08, 0.1, 0.1, 0.02), M('#ffd23a'), 0, 0.47, 0.15, g);
  for (const s of [1, -1]) { const w = mesh(rb(0.05, 0.32, 0.22, 0.02), M('#3fa9ff'), s * 0.16, 0.25, -0.02, g); w.rotation.z = s * 0.2; }
  mesh(rb(0.12, 0.05, 0.3, 0.02), M('#3fa9ff'), 0, 0.05, -0.2, g);
  const f = mesh(new THREE.PlaneGeometry(0.2, 0.16), new THREE.MeshBasicMaterial({ map: faceTex('o'), transparent: true, depthWrite: false }), 0, 0.53, 0.135, g, { cast: false }); f.renderOrder = 2;
  return { group: g };
}
function makeLlama() {
  const d = makeDog({ fur: '#f4ead8', dark: '#e0d2b8', muzzle: '#fff8ea', scale: 1.2 });
  d.body.children[0].children.forEach(c => { if (c.type === 'Group' && c.children.length && c.position.y < 0) c.scale.y = 1.7; });
  const neck = d.body.children[0].children.find(c => c.type === 'Group' && c.position.z > 0.3 && c.position.y > 0.1);
  if (neck) { neck.position.y += 0.35; neck.scale.y = 1.2; }
  return d;
}

function makeNet() { // pole along -y from the hand, hoop at the end; hoop opening faces +z
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), std('#b07a3e'), 0, 0.8, 0, g);
  const hoop = new THREE.Group(); hoop.position.y = 1.6 + 0.55; g.add(hoop);
  const ring = mesh(new THREE.TorusGeometry(0.55, 0.035, 8, 32), std('#ffd23a'), 0, 0, 0, hoop); ring.rotation.x = Math.PI / 2;
  const netTex = canvasTex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#ffffff'; x.lineWidth = 3; for (let i = 0; i <= 128; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } });
  netTex.wrapS = netTex.wrapT = THREE.RepeatWrapping; netTex.repeat.set(4, 2);
  const bag = mesh(new THREE.ConeGeometry(0.54, 0.9, 20, 1, true), new THREE.MeshStandardMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, alphaTest: 0.2 }), 0, -0.45, 0, hoop, { cast: false });
  bag.rotation.x = Math.PI;
  return { group: g, hoop };
}
function makeUmbrella(color = '#ff4f8b') {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 8), std('#333'), 0, 0.55, 0, g);
  mesh(new THREE.ConeGeometry(0.85, 0.35, 8, 1, true), std(color, { side: THREE.DoubleSide }), 0, 1.2, 0, g);
  return { group: g };
}

// Pebble: a fluffy blocky cloud puppy (front +z). setGrow(s) scales it, setFace(kind)
function makePebble() {
  const g = new THREE.Group(); const inner = new THREE.Group(); g.add(inner);
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, emissive: '#cfe0ff', emissiveIntensity: 0.15 });
  const puffs = [[0, 0.42, 0, 0.6, 0.5, 0.8], [0.25, 0.55, -0.2, 0.4, 0.4, 0.4], [-0.25, 0.55, -0.2, 0.4, 0.4, 0.4], [0, 0.4, -0.45, 0.4, 0.4, 0.35], [0, 0.5, 0.25, 0.5, 0.42, 0.4]];
  puffs.forEach(([x, y, z, w, h, d]) => mesh(rb(w, h, d, 0.12), m, x, y, z, inner));
  for (const [x, z] of [[0.18, 0.25], [-0.18, 0.25], [0.18, -0.3], [-0.18, -0.3]]) mesh(rb(0.16, 0.22, 0.16, 0.06), m, x, 0.11, z, inner);
  const head = new THREE.Group(); head.position.set(0, 0.85, 0.32); inner.add(head);
  mesh(rb(0.5, 0.44, 0.44, 0.14), m, 0, 0, 0, head);
  for (const s of [1, -1]) mesh(rb(0.18, 0.18, 0.18, 0.08), m, s * 0.24, 0.22, -0.05, head);
  mesh(rb(0.12, 0.08, 0.06, 0.03), std('#5a6a8a'), 0, -0.05, 0.23, head);
  const faces = { happy: faceTex('happy'), sad: faceTex('sad'), o: faceTex('o') };
  const face = mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: faces.happy, transparent: true, depthWrite: false }), 0, 0.03, 0.225, head, { cast: false }); face.renderOrder = 2;
  const tail = mesh(rb(0.16, 0.16, 0.3, 0.07), m, 0, 0.6, -0.6, inner);
  return { group: g, head, tail, setFace(k) { face.material.map = faces[k] || faces.happy; face.material.needsUpdate = true; }, setGrow(s) { inner.scale.setScalar(s); }, wag(t) { tail.rotation.y = Math.sin(t * 14) * 0.6; head.rotation.z = Math.sin(t * 2) * 0.08; } };
}

// Big mother cloud in the sky (front +z)
function makeMomCloud() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#e9eef8', roughness: 1, emissive: '#9aa8c8', emissiveIntensity: 0.25 });
  [[0, 0, 0, 30, 14, 14], [-16, -2, 0, 18, 11, 12], [16, -2, 0, 18, 11, 12], [-6, 7, -2, 16, 10, 10], [8, 6, -2, 14, 9, 10]].forEach(([x, y, z, w, h, d]) => mesh(rb(w, h, d, 3), m, x, y, z, g, { cast: false }));
  for (const s of [1, -1]) mesh(rb(6, 6, 6, 2), m, s * 11, 9, -1, g, { cast: false });
  const faces = { sad: faceTex('sad'), o: faceTex('o'), happy: faceTex('happy') };
  const face = mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: faces.sad, transparent: true, depthWrite: false, fog: false }), 0, 0, 7.05, g, { cast: false }); face.renderOrder = 2;
  return { group: g, setFace(k) { face.material.map = faces[k]; face.material.needsUpdate = true; } };
}

export function buildPetKit(scene, W) {
  // ---------- YARD (x = -1400): Ryan's house faces +z at z=-12, lawn in front, neighbors left/right ----------
  const y = new THREE.Group(); y.name = 'yard'; y.position.set(-1400, 0, 0); scene.add(y); W.sets.yard = y;
  const ground = mesh(new THREE.PlaneGeometry(400, 400), std('#62cc5c', { roughness: 0.95 }), 0, 0, 0, y, { cast: false }); ground.rotation.x = -Math.PI / 2;
  mesh(box(120, 0.06, 7), std('#4a505e', { roughness: 0.9 }), 0, 0.03, 14, y, { cast: false });
  mesh(box(120, 0.1, 2), std('#dfe3ea'), 0, 0.05, 9.5, y, { cast: false });
  for (let x = -58; x < 60; x += 6) mesh(box(2.6, 0.07, 0.25), std('#ffffff'), x, 0.04, 14, y, { cast: false });
  const houses = [];
  [[-14, 3], [0, 0], [14, 5], [-28, 7], [28, 9]].forEach(([x, seed], i) => {
    const h = makeHouse({ seed: 40 + seed, lit: [false, false, false, false] }); h.group.position.set(x, 0, -9); y.add(h.group); houses.push(h);
    if (i < 3) { for (const s of [-1, 1]) { const f = makePicketFence(5); f.position.set(x + s * 4.2, 0, 3); f.rotation.y = Math.PI / 2; y.add(f); } const f2 = makePicketFence(3); f2.position.set(x - 3.0, 0, 8.5); y.add(f2); const f3 = makePicketFence(3); f3.position.set(x + 3.0, 0, 8.5); y.add(f3); }
    const t = makeTree(seed, 0.9); t.position.set(x + 5.5, 0, -2); y.add(t);
  });
  W.yardHouses = houses; W.ryanHouse = houses[1];
  // blanket (picnic) on Ryan's lawn
  const blTex = canvasTex(128, 128, (x, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#ff4f6d' : '#ffffff'; x.fillRect(i * 16, j * 16, 16, 16); } });
  const blanket = mesh(box(2.4, 0.03, 2.0), new THREE.MeshStandardMaterial({ map: blTex, roughness: 0.9 }), 0, 0.02, 3.2, y, { cast: false });
  W.props.yardBlanket = blanket;
  // clouds overhead
  const cl = new THREE.Group(); y.add(cl); W.yardClouds = cl;
  for (let i = 0; i < 10; i++) { const c = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false }); [[0, 0, 0, 7], [6, -1, 1, 5], [-6, -1.2, 0, 5.5]].forEach(([x, yy, z, r]) => { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m); o.position.set(x, yy, z); c.add(o); }); c.position.set(-90 + (i * 41) % 180, 45 + (i * 7) % 15, -120 + (i * 37) % 160); cl.add(c); }
  W.yardCloudMat = cl.children[0].children[0].material;

  // ---------- pets ----------
  const pets = [];
  const add = (kind, o) => { o.kind = kind; o.group = o.group; pets.push(o); scene.add(o.group); return o; };
  const dogCols = [['#d8994e', '#8f5428', '#f4dcb6'], ['#2a2420', '#120e0c', '#d8c0a0'], ['#ffffff', '#c9c9c9', '#ffe8d6'], ['#c8732e', '#7a3e14', '#f6d3a8'], ['#f0c870', '#c08a38', '#fff0d0']];
  dogCols.forEach(([f, d, m], i) => add('puppy', makeDog({ fur: f, dark: d, muzzle: m, scale: 0.5 })));
  ['#9aa0ad', '#ff9b4a', '#2a2420', '#ffffff'].forEach(c => add('kitten', makeCat(c)));
  add('turtle', makeTurtle());
  for (let i = 0; i < 3; i++) add('fish', makeFish());
  add('parrot', makeParrot());
  add('bunny', makeBunny('#ffffff')); add('bunny', makeBunny('#e8d2b8'));
  add('retriever', makeDog({ fur: '#f0b24a', dark: '#c8862a', muzzle: '#ffe2a8', scale: 0.95 }));
  add('llama', makeLlama());
  W.pets = pets; W.pet = k => pets.filter(p => p.kind === k);
  // tiny puppy Pebble
  const pebble = makePebble(); scene.add(pebble.group); W.props.pebble = pebble;
  const mom = makeMomCloud(); scene.add(mom.group); W.props.momCloud = mom;
  W.props.nets = [makeNet(), makeNet(), makeNet(), makeNet()];
  W.props.bigNet = makeNet(); W.props.bigNet.group.scale.setScalar(1.5);
  W.props.umbrellas = ['#ff4f8b', '#3fa9ff', '#ffd23a', '#40c463', '#9b5cff', '#ff9b4a'].map(makeUmbrella);
  // a big dog bowl
  const bowl = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.12, 20), std('#e8233c'), 0, 0.06, 0, bowl); mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 20), std('#8a5a2a'), 0, 0.11, 0, bowl); W.props.bowl = { group: bowl };

  // extra cast: neighbor (adult) — "Mrs. Dale"
  const mk = (key, o) => { if (W.chars[key]) return; const c = makeCharacter(o); W.chars[key] = c; scene.add(c.group); };
  mk('neighbor', { name: 'Neighbor', skin: '#e6b58f', shirt: '#40c463', print: 'cardigan', pants: '#565a7d', shoes: '#2b1d16', hair: 'mia', hairColor: '#b8b8c8', scale: 1.02 });

  W.resetPets = () => {
    for (const p of pets) { p.group.removeFromParent(); p.group.visible = true; p.group.rotation.set(0, 0, 0); p.group.scale.setScalar(1); if (p.setPose) p.setPose({}); if (p.setFace) p.setFace('dog'); }
    pebble.group.removeFromParent(); pebble.setGrow(1); pebble.setFace('happy'); pebble.group.scale.setScalar(1); pebble.group.rotation.set(0, 0, 0);
    mom.group.removeFromParent(); mom.setFace('sad');
    for (const n of [...W.props.nets, W.props.bigNet, ...W.props.umbrellas, W.props.bowl]) { n.group.removeFromParent(); n.group.rotation.set(0, 0, 0); }
    W.props.bigNet.group.scale.setScalar(1.5);
    W.yardCloudMat.color.set('#ffffff');
    blanket.visible = true;
  };
}
