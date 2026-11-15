// Story 08 — Name Swap: chest name tags, fireworks, library/archive, cemetery, dusty room, tower plaque + little door
import * as THREE from 'three';
import { std, rb, box, mesh, canvasTex, makeTree } from './props.js';
import { makeCharacter } from './character.js';

function tagCanvas() { const c = document.createElement('canvas'); c.width = 320; c.height = 220; return c; }
function drawTag(c, text, old = false) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  x.clearRect(0, 0, w, h);
  const red = old ? '#8a5a3a' : '#e8233c', paper = old ? '#d9c8a0' : '#ffffff';
  x.fillStyle = red; x.beginPath(); x.roundRect(0, 0, w, h, 26); x.fill();
  x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '900 34px Montserrat'; x.fillText('HELLO', w / 2, 30);
  x.font = '700 20px Montserrat'; x.fillText('my name is', w / 2, 58);
  x.fillStyle = paper; x.fillRect(12, 76, w - 24, h - 96);
  x.fillStyle = '#1a1420'; let fs = 64; x.font = `700 ${fs}px "Special Elite", Fredoka`;
  while (x.measureText(text).width > w - 40 && fs > 20) { fs -= 2; x.font = `700 ${fs}px "Special Elite", Fredoka`; }
  x.fillText(text, w / 2, 76 + (h - 96) / 2 + 4);
}
// letter-by-letter morph from a -> b, progress k in [0,1]; unsettled letters are random glyphs
export function morphName(a, b, k, t = 0) {
  const n = Math.max(a.length, b.length), out = [];
  const G = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#?';
  for (let i = 0; i < n; i++) { const d = i / n; if (k >= d + 1 / n) out.push(b[i] || ''); else if (k >= d) out.push(G[Math.floor(t * 30 + i * 7) % G.length]); else out.push(a[i] || ''); }
  return out.join('');
}

function makeFireworks() {
  const g = new THREE.Group(); const bursts = [];
  const cols = ['#ff4f8b', '#ffd23a', '#3fa9ff', '#40c463', '#ff9b4a', '#c9a0ff'];
  for (let b = 0; b < 6; b++) {
    const N = 160, pos = new Float32Array(N * 3), dir = [];
    for (let i = 0; i < N; i++) { const u = (i * 0.618) % 1, v = (i * 0.382 + b * 0.1) % 1; const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1); dir.push([Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)]); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: cols[b], size: 0.5, transparent: true, fog: false, depthWrite: false }));
    pts.frustumCulled = false; g.add(pts); bursts.push({ pts, pos, dir, geo, c: [-18 + b * 7.5, 28 + (b % 3) * 6, -30 - (b % 2) * 12], off: b * 0.37 });
  }
  return { group: g, update(t) { for (const B of bursts) { const ph = ((t + B.off) % 1.6) / 1.6, r = 9 * (1 - Math.pow(1 - ph, 3)); for (let i = 0; i < B.dir.length; i++) { const d = B.dir[i]; B.pos[i * 3] = B.c[0] + d[0] * r; B.pos[i * 3 + 1] = B.c[1] + d[1] * r - ph * ph * 4; B.pos[i * 3 + 2] = B.c[2] + d[2] * r; } B.geo.attributes.position.needsUpdate = true; B.pts.material.opacity = 1 - ph; } } };
}

function bookTex(seed) { return canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#5a3a24'; x.fillRect(0, 0, w, h); const cols = ['#8a2a2a', '#2a4a8a', '#2a7a4a', '#c9a24a', '#6a3a8a', '#3a3a3a', '#b0603a']; for (let r = 0; r < 4; r++) { let xx = 6; let k = seed + r * 5; while (xx < w - 10) { const bw = 10 + (k * 7) % 14, bh = 46 + (k * 11) % 14; x.fillStyle = cols[k % cols.length]; x.fillRect(xx, r * 64 + 62 - bh, bw, bh); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(xx + 2, r * 64 + 62 - bh + 8, bw - 4, 3); xx += bw + 2; k++; } x.fillStyle = '#3a2416'; x.fillRect(0, r * 64 + 60, w, 6); } }); }

export function buildNameKit(scene, W) {
  // ---------- name tags ----------
  W.__tags = new Map();
  W.nameTag = (char, text, { old = false, joint = 'waist', off = [0.2, 0.44, 0.236], scale = 1 } = {}) => {
    let T = W.__tags.get(char);
    if (!T) { const c = tagCanvas(); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.206), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: true })); T = { c, tex, m, text: null, old: null }; W.__tags.set(char, T); }
    if (T.text !== text || T.old !== old) { drawTag(T.c, text, old); T.tex.needsUpdate = true; T.text = text; T.old = old; }
    char.attach(T.m, joint, off); T.m.scale.setScalar(scale); T.m.visible = true; return T.m;
  };
  W.props.fireworks = makeFireworks();

  // ---------- cast ----------
  const mk = (key, o) => { if (W.chars[key]) return W.chars[key]; const c = makeCharacter(o); W.chars[key] = c; scene.add(c.group); return c; };
  mk('baker', { name: 'Baker', skin: '#f1c09a', shirt: '#ffffff', print: 'jacket', pants: '#d8d8e0', shoes: '#2b1d16', hair: 'cap', hatColor: '#ffffff', hairColor: '#4a2a17', scale: 1.02 });
  mk('firefighter', { name: 'Firefighter', skin: '#d9a07a', shirt: '#e8233c', print: 'jacket', pants: '#2a2a3a', shoes: '#111111', hair: 'cap', hatColor: '#ffd23a', hairColor: '#2a1a10', scale: 1.06 });
  mk('kid', { name: 'Thomas', skin: '#e9d2b8', shirt: '#9a8a6e', print: 'overalls', sleeves: '#d8ccb0', pants: '#6a5a44', shoes: '#3a2a1a', hair: 'theo', hairColor: '#5a4a3a', scale: 0.88, faceOpts: { freckles: true } });

  // ---------- tower plaque + little door (square set, tower front face at z = -10.5) ----------
  const sq = W.sets.square;
  const plaqueTex = canvasTex(512, 320, (x, w, h) => { x.fillStyle = '#9a9488'; x.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(0,0,0,${0.03 + (i % 5) * 0.012})`; x.fillRect((i * 53) % w, (i * 29) % h, 4, 4); } x.strokeStyle = '#6a6458'; x.lineWidth = 10; x.strokeRect(14, 14, w - 28, h - 28); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 60px "Special Elite", serif'; x.fillStyle = '#3a362e'; x.fillText('ELI MARROW', w / 2, h * 0.4, w - 60); x.font = '700 56px "Special Elite", serif'; x.fillText('1925', w / 2, h * 0.72); });
  const plaque = mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.95 }), 1.6, 2.1, -10.47, sq, { cast: false });
  const doorFrame = mesh(box(0.95, 1.15, 0.06), std('#5a4a3a'), 1.6, 0.66, -10.47, sq);
  const hinge = new THREE.Group(); hinge.position.set(1.6 - 0.4, 0.66, -10.43); sq.add(hinge);
  const door = mesh(box(0.8, 1.0, 0.06), std('#7a5a3a', { roughness: 0.8 }), 0.4, 0, 0, hinge); mesh(new THREE.SphereGeometry(0.04, 10, 8), std('#c9a24a', { metalness: 0.7 }), 0.7, 0, 0.05, hinge);
  const spill = mesh(new THREE.PlaneGeometry(0.78, 0.98), new THREE.MeshBasicMaterial({ color: '#ffcf7a' }), 1.6, 0.66, -10.49, sq, { cast: false });
  W.props.towerDoor = { plaque, hinge, setOpen(a) { hinge.rotation.y = -a; spill.visible = a > 0.05; } };
  W.props.towerDoor.setOpen(0);

  // ---------- LIBRARY / ARCHIVE (x = -1600) ----------
  const L = new THREE.Group(); L.name = 'library'; L.position.set(-1600, 0, 0); scene.add(L); W.sets.library = L;
  const fl = canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#7a4e30' : '#6a4228'; x.fillRect(0, i * 32, w, 32); } });
  fl.wrapS = fl.wrapT = THREE.RepeatWrapping; fl.repeat.set(4, 4);
  mesh(box(16, 0.1, 20), new THREE.MeshStandardMaterial({ map: fl, roughness: 0.8 }), 0, -0.05, 0, L, { cast: false });
  const wallM = std('#5a4a6a', { roughness: 0.9 });
  mesh(box(16, 6, 0.2), wallM, 0, 3, -10, L); mesh(box(0.2, 6, 20), wallM, -8, 3, 0, L); mesh(box(0.2, 6, 20), wallM, 8, 3, 0, L); mesh(box(16, 6, 0.2), wallM, 0, 3, 10, L);
  for (let r = 0; r < 4; r++) for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 2.4, 0, -6 + r * 3.2); L.add(sh);
    mesh(box(3.2, 3.4, 0.7), std('#4a3020', { roughness: 0.8 }), 0, 1.7, 0, sh);
    for (const f of [1, -1]) mesh(new THREE.PlaneGeometry(3.0, 3.2), new THREE.MeshStandardMaterial({ map: bookTex(r * 3 + s + 5 + f), roughness: 0.85 }), 0, 1.7, f * 0.36, sh, { cast: false }).rotation.y = f > 0 ? 0 : Math.PI;
  }
  W.archiveBoxes = new THREE.Group(); L.add(W.archiveBoxes);
  for (let i = 0; i < 14; i++) mesh(rb(0.7, 0.5, 0.5, 0.03), std(['#b89a6a', '#a88a5a', '#c8aa7a'][i % 3], { roughness: 0.95 }), -6 + (i % 4) * 0.8, 0.25 + Math.floor(i / 4) * 0.5, 8.6 - (i % 2) * 0.1, W.archiveBoxes);
  W.libLamp = new THREE.PointLight('#ffd9a0', 6, 14, 1.4); W.libLamp.position.set(0, 4, 0); L.add(W.libLamp);

  // ---------- CEMETERY (x = -1700) ----------
  const C = new THREE.Group(); C.name = 'cemetery'; C.position.set(-1700, 0, 0); scene.add(C); W.sets.cemetery = C;
  const cg = mesh(new THREE.PlaneGeometry(300, 300), std('#3f6a4a', { roughness: 1 }), 0, 0, 0, C, { cast: false }); cg.rotation.x = -Math.PI / 2;
  const stoneM = std('#9aa0aa', { roughness: 0.9 });
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { const x = -7.5 + c * 3 + (r % 2) * 0.6, z = -4 - r * 3.4; const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ((r * 7 + c * 3) % 5 - 2) * 0.05; C.add(s); mesh(rb(1.0, 1.2 + (c % 3) * 0.2, 0.25, 0.08), stoneM, 0, 0.6 + (c % 3) * 0.1, 0, s); if ((r + c) % 3 === 0) { mesh(box(0.15, 0.8, 0.15), stoneM, 0, 1.5, 0, s); mesh(box(0.55, 0.15, 0.15), stoneM, 0, 1.65, 0, s); } }
  for (let x = -12; x <= 12; x += 0.8) mesh(box(0.06, 1.4, 0.06), std('#1a1c24'), x, 0.7, 2.5, C);
  mesh(box(24.2, 0.08, 0.06), std('#1a1c24'), 0, 1.2, 2.5, C);
  for (const [x, z] of [[-10, -12], [9, -9], [11, -18]]) { const t = new THREE.Group(); t.position.set(x, 0, z); C.add(t); mesh(box(0.4, 4, 0.4), std('#2a2420'), 0, 2, 0, t); for (const a of [-0.7, 0.6, 1.4]) { const b = mesh(box(0.15, 1.8, 0.15), std('#2a2420'), Math.sin(a) * 0.6, 3.6, 0, t); b.rotation.z = a; } }

  // ---------- DUSTY ROOM (x = -1800) ----------
  const D = new THREE.Group(); D.name = 'dusty'; D.position.set(-1800, 0, 0); scene.add(D); W.sets.dusty = D;
  const dfl = canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#6a5a44' : '#5e5040'; x.fillRect(0, i * 32, w, 32); } for (let i = 0; i < 300; i++) { x.fillStyle = 'rgba(220,210,180,0.06)'; x.fillRect((i * 41) % w, (i * 67) % h, 6, 6); } });
  dfl.wrapS = dfl.wrapT = THREE.RepeatWrapping; dfl.repeat.set(2, 2);
  mesh(box(6, 0.1, 6), new THREE.MeshStandardMaterial({ map: dfl, roughness: 0.95 }), 0, -0.05, 0, D, { cast: false });
  const dw = std('#7a6a52', { roughness: 0.95 });
  mesh(box(6, 3, 0.2), dw, 0, 1.5, -3, D); mesh(box(0.2, 3, 6), dw, -3, 1.5, 0, D); mesh(box(0.2, 3, 6), dw, 3, 1.5, 0, D); mesh(box(6, 0.2, 6), std('#5a4a38'), 0, 3.05, 0, D);
  for (const s of [-1, 1]) mesh(box(2.5, 3, 0.2), dw, s * 1.75, 1.5, 3, D);
  mesh(box(1.0, 1.9, 0.2), dw, 0, 2.55, 3, D);
  const bedD = new THREE.Group(); bedD.position.set(-1.9, 0, -1.6); D.add(bedD);
  mesh(rb(1.3, 0.4, 2.2, 0.05), std('#6a4a30'), 0, 0.25, 0, bedD); mesh(rb(1.2, 0.15, 2.1, 0.05), std('#c8bca0'), 0, 0.52, 0, bedD); mesh(rb(0.7, 0.14, 0.4, 0.06), std('#e0d6c0'), 0, 0.64, -0.8, bedD); mesh(rb(1.3, 0.9, 0.12, 0.04), std('#6a4a30'), 0, 0.6, -1.1, bedD);
  W.dustyBed = bedD;
  const desk = new THREE.Group(); desk.position.set(1.4, 0, -2.2); D.add(desk); W.dustyDesk = desk;
  mesh(rb(1.6, 0.08, 0.8, 0.02), std('#5a3a24'), 0, 0.85, 0, desk); for (const [x, z] of [[0.72, 0.32], [-0.72, 0.32], [0.72, -0.32], [-0.72, -0.32]]) mesh(box(0.08, 0.85, 0.08), std('#5a3a24'), x, 0.42, z, desk);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 10), std('#f2ead8'), 0.5, 1.0, 0, desk); const flame = mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: '#ffcf5a' }), 0.5, 1.14, 0, desk, { cast: false });
  for (let i = 0; i < 3; i++) mesh(box(0.3, 0.02, 0.4), std('#e8dcc0'), -0.3 + i * 0.05, 0.9 + i * 0.02, 0.05, desk).rotation.y = i * 0.3;
  const chair = new THREE.Group(); chair.position.set(1.4, 0, -1.4); D.add(chair); W.dustyChair = chair;
  mesh(rb(0.5, 0.06, 0.5, 0.02), std('#5a3a24'), 0, 0.5, 0, chair); mesh(rb(0.5, 0.6, 0.06, 0.02), std('#5a3a24'), 0, 0.8, 0.24, chair); for (const [x, z] of [[0.2, 0.2], [-0.2, 0.2], [0.2, -0.2], [-0.2, -0.2]]) mesh(box(0.05, 0.5, 0.05), std('#5a3a24'), x, 0.25, z, chair);
  // cobwebs (corner triangles) + dust motes
  const web = canvasTex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(240,240,240,0.7)'; x.lineWidth = 1.5; for (let a = 0; a <= 6; a++) { x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a / 6 * Math.PI / 2) * w, Math.sin(a / 6 * Math.PI / 2) * h); x.stroke(); } for (let r = 20; r < 128; r += 18) { x.beginPath(); x.arc(0, 0, r, 0, Math.PI / 2); x.stroke(); } });
  for (const [x, ry] of [[-2.88, 0], [2.88, -Math.PI / 2]]) { const m = mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: web, transparent: true, depthWrite: false, side: THREE.DoubleSide }), x + (x < 0 ? 0.6 : -0.6), 2.35, -2.88, D, { cast: false }); m.rotation.set(0, 0, x < 0 ? Math.PI : -Math.PI / 2); }
  const candle = new THREE.PointLight('#ffb05a', 5, 7, 1.5); candle.position.set(1.9, 1.3, -2.2); D.add(candle); W.candle = candle;
  const N = 300, mp = new Float32Array(N * 3); for (let i = 0; i < N; i++) mp.set([((i * 37) % 60) / 10 - 3, ((i * 53) % 28) / 10, ((i * 71) % 60) / 10 - 3], i * 3);
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: '#ffe8b0', size: 0.025, transparent: true, opacity: 0.7 })); D.add(motes); W.motes = motes;
  W.props.book = (() => { const g = new THREE.Group(); mesh(rb(0.9, 0.12, 0.65, 0.02), std('#6a2a2a'), 0, 0.06, 0, g); mesh(box(0.84, 0.1, 0.6), std('#f2ead8'), 0, 0.07, 0.01, g); return { group: g }; })();

  W.resetHooks = W.resetHooks || [];
  W.resetHooks.push(() => {
    for (const T of W.__tags.values()) { T.m.removeFromParent(); }
    W.props.fireworks.group.removeFromParent(); W.props.book.group.removeFromParent();
    W.props.towerDoor.setOpen(0);
    for (const k of ['baker', 'firefighter', 'kid']) W.chars[k].group.scale.set(1, 1, 1);
  });
}
