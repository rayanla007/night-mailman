// Story 10 — Lost & Found: warehouse (exterior + front desk + one reusable aisle with swappable contents)
import * as THREE from 'three';
import { std, rb, box, mesh, canvasTex, makeTower } from './props.js';
import { makeCharacter, makeDog } from './character.js';

const label = (lines, { w = 512, h = 256, bg = '#1a2a5a', fg = '#ffffff', accent = '#ffd23a' } = {}) => canvasTex(w, h, (x) => {
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = accent; x.lineWidth = 12; x.strokeRect(8, 8, w - 16, h - 16);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach(([t, s, c], i) => { x.font = `900 ${s}px Montserrat`; x.fillStyle = c || fg; x.fillText(t, w / 2, h * (lines.length === 1 ? 0.5 : 0.32 + i * 0.4), w - 40); });
});

export function buildLostKit(scene, W) {
  const G = new THREE.Group(); G.name = 'lostfound'; G.position.set(-2000, 0, 0); scene.add(G); W.sets.lostfound = G;
  const ground = mesh(new THREE.PlaneGeometry(400, 400), std('#5cc95a', { roughness: 1 }), 0, 0, 0, G, { cast: false }); ground.rotation.x = -Math.PI / 2;

  // ---------- AISLE (runs from z=0 to z=-28; shelves at x=+-2.1) ----------
  const floorT = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#c9c4b8'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 3; for (let i = 0; i <= 256; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(2, 10);
  mesh(box(8, 0.1, 40), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.8 }), 0, 0.0, -14, G, { cast: false });
  mesh(box(8, 0.2, 40), std('#3a3f4e'), 0, 6.2, -14, G); // ceiling
  mesh(box(8, 6.2, 0.2), std('#4a4f5e'), 0, 3.1, -32, G); // far wall
  const shelfM = std('#6a7a9a', { metalness: 0.4, roughness: 0.5 }), postM = std('#3a4258', { metalness: 0.5 });
  const LEVELS = [0.35, 1.35, 2.35, 3.35, 4.35];
  for (const sx of [-1, 1]) {
    for (const y of LEVELS) mesh(box(1.2, 0.08, 30), shelfM, sx * 2.6, y, -15, G);
    for (let z = 0; z >= -30; z -= 3) mesh(box(0.08, 4.8, 0.08), postM, sx * 2.0, 2.4, z, G);
    mesh(box(0.1, 5, 30), std('#2a3040'), sx * 3.25, 2.5, -15, G);
  }
  const lamps = []; for (let z = -2; z >= -28; z -= 6.5) { mesh(box(0.4, 0.08, 2.4), new THREE.MeshBasicMaterial({ color: '#fff4d6' }), 0, 6.05, z, G, { cast: false }); const l = new THREE.PointLight('#ffe8c0', 5, 10, 1.5); l.position.set(0, 5.6, z); G.add(l); lamps.push(l); }
  W.aisleLamps = lamps;
  // hanging aisle sign
  const signC = document.createElement('canvas'); signC.width = 512; signC.height = 256; const signTex = new THREE.CanvasTexture(signC); signTex.colorSpace = THREE.SRGBColorSpace;
  const sign = mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: signTex }), 0, 4.6, 0.3, G, { cast: false });
  for (const sx of [-1, 1]) mesh(box(0.03, 0.9, 0.03), std('#222'), sx * 1.3, 5.75, 0.3, G);
  W.setAisleSign = (num, title, color = '#ffd23a') => { const x = signC.getContext('2d'); x.fillStyle = '#16203e'; x.fillRect(0, 0, 512, 256); x.strokeStyle = color; x.lineWidth = 12; x.strokeRect(8, 8, 496, 240); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color; x.font = '900 110px Montserrat'; x.fillText(String(num), 256, 96); x.fillStyle = '#ffffff'; x.font = '900 44px Montserrat'; x.fillText(title, 256, 196, 470); signTex.needsUpdate = true; };

  // contents: one group per aisle type; slot positions along both shelf runs
  const slots = []; for (const sx of [-1, 1]) for (const y of LEVELS.slice(0, 4)) for (let z = -1.2; z >= -22; z -= 1.15) slots.push([sx * 2.55, y + 0.04, z, sx]);
  const C = {}; const mkGroup = k => { const g = new THREE.Group(); g.visible = false; G.add(g); C[k] = g; return g; };
  // misc: keys, socks, homework, + a dog
  { const g = mkGroup('misc'); slots.forEach(([x, y, z, sx], i) => { const k = i % 3; if (k === 0) { for (let j = 0; j < 3; j++) { const r = mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 14), std(['#ffd23a', '#c8cdd8', '#ff9b4a'][j], { metalness: 0.7, roughness: 0.3 }), x - 0.2 + j * 0.2, y + 0.06, z, g, { cast: false }); r.rotation.x = Math.PI / 2; } } else if (k === 1) { for (let j = 0; j < 2; j++) { const s = new THREE.Group(); s.position.set(x - 0.15 + j * 0.3, y + 0.04, z); g.add(s); const c = ['#ff4f8b', '#3fa9ff', '#40c463', '#ffffff', '#9b5cff'][(i + j) % 5]; mesh(rb(0.12, 0.06, 0.35, 0.02), std(c), 0, 0, 0, s, { cast: false }); mesh(rb(0.12, 0.06, 0.16, 0.02), std(c), 0, 0, 0.22, s, { cast: false }).rotation.y = 0.9; } } else { for (let j = 0; j < 5; j++) mesh(box(0.4, 0.015, 0.5), std(j % 2 ? '#ffffff' : '#f2f6ff'), x, y + 0.02 + j * 0.017, z, g, { cast: false }).rotation.y = j * 0.1; } }); }
  const dog = makeDog({ fur: '#c8732e', dark: '#7a3e14', muzzle: '#f6d3a8', scale: 0.55 }); W.lostDog = dog; scene.add(dog.group);
  // backpacks
  { const g = mkGroup('backpacks'); const cols = ['#ff4f6d', '#3fa9ff', '#40c463', '#ffd23a', '#9b5cff', '#ff9b4a', '#2a2c34']; slots.forEach(([x, y, z, sx], i) => { const b = new THREE.Group(); b.position.set(x, y, z); b.rotation.y = -sx * Math.PI / 2 + ((i % 3) - 1) * 0.2; g.add(b); const c = cols[(i * 5) % cols.length]; mesh(rb(0.5, 0.6, 0.28, 0.08), std(c), 0, 0.32, 0, b, { cast: false }); mesh(rb(0.36, 0.26, 0.1, 0.05), std(new THREE.Color(c).multiplyScalar(0.8).getStyle()), 0, 0.22, 0.17, b, { cast: false }); mesh(box(0.3, 0.04, 0.02), std('#e8e8e8'), 0, 0.42, 0.15, b, { cast: false }); }); W.backpackSlots = slots; }
  // jars: time (yellow glow, labelled), memories (pink/blue orbs), voices (sound-wave labels)
  const jarLabel = (text, bg) => label([[text, 40, '#1a1420']], { w: 512, h: 128, bg, accent: '#1a1420' });
  const timeLabel = jarLabel('LOST WHEN YOU WERE BORED', '#fff2c0'), voiceLabel = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#e8f4ff'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3a5aa0'; x.lineWidth = 6; x.beginPath(); for (let i = 0; i < w; i += 4) x.lineTo(i, h / 2 + Math.sin(i * 0.15) * 30 * Math.sin(i * 0.02)); x.stroke(); });
  const glassM = new THREE.MeshStandardMaterial({ color: '#dff0ff', transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.2, depthWrite: false });
  const jars = (k, glow, lbl, orb = false) => { const g = mkGroup(k); slots.forEach(([x, y, z, sx], i) => { const j = new THREE.Group(); j.position.set(x, y, z); j.rotation.y = -sx * Math.PI / 2; g.add(j); const gc = Array.isArray(glow) ? glow[i % glow.length] : glow; if (orb) mesh(new THREE.SphereGeometry(0.12, 14, 10), new THREE.MeshBasicMaterial({ color: gc }), 0, 0.22, 0, j, { cast: false }); else for (let p = 0; p < 3; p++) mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: gc }), Math.sin(p * 2.1 + i) * 0.07, 0.1 + p * 0.09, Math.cos(p * 1.7 + i) * 0.08, j, { cast: false }); mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 16), glassM, 0, 0.21, 0, j, { cast: false }); mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16), std('#b08a4a', { metalness: 0.6 }), 0, 0.45, 0, j, { cast: false }); if (lbl) mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshStandardMaterial({ map: lbl, roughness: 0.9 }), 0, 0.2, 0.175, j, { cast: false }); }); };
  jars('time', '#ffd23a', timeLabel); jars('memories', ['#ff9bd2', '#7fd3ff', '#c9a0ff', '#ffd23a'], null, true); jars('voices', '#9fd8ff', voiceLabel);
  W.timeLabelTex = timeLabel;
  // people: sleeping kid proxies on every slot of the bottom 4 levels (cheap blocky bodies) + real kids near the camera
  { const g = mkGroup('people'); const skin = ['#f1c09a', '#d9a07a', '#a8704a', '#f6cfa6']; const sh = ['#ff4f8b', '#3fa9ff', '#40c463', '#ffd23a', '#9b5cff', '#ff9b4a'];
    slots.forEach(([x, y, z, sx], i) => { if (y > 4) return; if (Math.abs(z) < 7.5) return; const k = new THREE.Group(); k.position.set(x, y + 0.02, z); g.add(k); mesh(rb(0.5, 0.3, 0.78, 0.05), std(sh[i % 6]), 0, 0.17, 0, k, { cast: false }); mesh(rb(0.42, 0.36, 0.34, 0.07), std(skin[i % 4]), 0, 0.2, 0.58, k, { cast: false }); mesh(rb(0.44, 0.12, 0.36, 0.05), std('#3a2416'), 0, 0.4, 0.58, k, { cast: false }); mesh(rb(0.46, 0.22, 0.5, 0.05), std('#2f5fe0'), 0, 0.12, -0.62, k, { cast: false }); k.rotation.y = sx > 0 ? 0 : Math.PI; });
  }
  W.setAisle = (k) => { for (const [n, g] of Object.entries(C)) g.visible = n === k; };
  W.sleepKids = [];
  const kidCols = [['#ff4f8b', 'mia', '#5a3220'], ['#3fa9ff', 'theo', '#2a1a10'], ['#40c463', 'spiky', '#e8b33c'], ['#9b5cff', 'clumps', '#3b2416'], ['#ff9b4a', 'mia', '#2a1a10'], ['#ffd23a', 'theo', '#7a4a2a']];
  kidCols.forEach(([c, hair, hc], i) => { const k = makeCharacter({ name: 'Kid' + i, skin: ['#f1c09a', '#d9a07a', '#a8704a', '#f6cfa6'][i % 4], shirt: c, print: i % 2 ? 'star' : 'hoodie', pants: '#2f5fe0', shoes: '#ffffff', hair, hairColor: hc, scale: 0.62 }); scene.add(k.group); W.sleepKids.push(k); });
  // wrist tag
  W.props.wristTags = W.sleepKids.map(() => { const g = new THREE.Group(); mesh(box(0.2, 0.12, 0.01), std('#fff8e0'), 0, -0.06, 0, g, { cast: false }); mesh(box(0.012, 0.08, 0.012), std('#c8b07a'), 0, 0.03, 0, g, { cast: false }); return { group: g }; });
  // empty shelf slot labelled with Ryan's name (finale)
  const nameLbl = mesh(new THREE.PlaneGeometry(0.6, 0.2), new THREE.MeshStandardMaterial({ roughness: 0.8, map: label([['RYAN', 64, '#1a1420']], { w: 384, h: 128, bg: '#fff8e0', accent: '#c8b07a' }) }), -2.04, 1.55, -3.4, G, { cast: false }); nameLbl.rotation.y = Math.PI / 2; W.ryanLabel = nameLbl;

  // ---------- FRONT DESK (z = +6, facing -z into the aisle... Finch stands behind it at z=7.4 facing -z) ----------
  mesh(box(8, 0.1, 10), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.8 }), 0, 0.0, 5, G, { cast: false });
  mesh(box(8, 6.2, 0.2), std('#4a5a7a'), 0, 3.1, 10, G); mesh(box(0.2, 6.2, 10), std('#4a5a7a'), -4, 3.1, 5, G); mesh(box(0.2, 6.2, 10), std('#4a5a7a'), 4, 3.1, 5, G);
  mesh(box(8, 0.2, 10), std('#3a3f4e'), 0, 6.2, 5, G);
  mesh(rb(3.6, 1.1, 0.8, 0.05), std('#8a5a3a', { roughness: 0.7 }), 0, 0.55, 6.6, G); mesh(rb(3.8, 0.08, 1.0, 0.03), std('#b07a4f'), 0, 1.12, 6.6, G);
  mesh(new THREE.PlaneGeometry(4.6, 1.2), new THREE.MeshStandardMaterial({ map: label([['LOST & FOUND', 80, '#ffd23a'], ['since 1964', 44, '#ffffff']], { w: 768, h: 200 }), roughness: 0.7 }), 0, 4.4, 9.88, G, { cast: false }).rotation.y = Math.PI;
  const bell = mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), std('#c9a24a', { metalness: 0.8, roughness: 0.3 }), 1.0, 1.16, 6.4, G, { cast: false });
  const dl = new THREE.PointLight('#ffe8c0', 6, 12, 1.5); dl.position.set(0, 5, 5); G.add(dl);

  // ---------- EXTERIOR (x = 80): big warehouse with a sign, faces +z ----------
  const ex = new THREE.Group(); ex.position.set(80, 0, 0); G.add(ex); W.lfExterior = ex;
  mesh(box(36, 16, 24), std('#d9cfc0', { roughness: 0.8 }), 0, 8, -12, ex);
  mesh(box(37, 1, 25), std('#b04a3a'), 0, 16.5, -12, ex);
  mesh(new THREE.PlaneGeometry(26, 5), new THREE.MeshStandardMaterial({ map: label([['LOST & FOUND', 90, '#ffd23a']], { w: 1024, h: 200, bg: '#2a3a7a' }), roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.12 }), 0, 12, 0.06, ex, { cast: false });
  mesh(box(5, 6, 0.2), std('#3a2a1a'), 0, 3, 0.05, ex);
  mesh(box(4.6, 5.6, 0.1), new THREE.MeshBasicMaterial({ color: '#ffd98a' }), 0, 2.9, 0.12, ex, { cast: false });
  for (let i = 0; i < 6; i++) for (const y of [4, 9]) if (Math.abs(-15 + i * 6) > 3) mesh(box(3, 2.4, 0.1), new THREE.MeshBasicMaterial({ color: '#9fc8ff' }), -15 + i * 6, y, 0.08, ex, { cast: false });
  mesh(box(60, 0.08, 20), std('#cfd4dc'), 0, 0.04, 12, ex, { cast: false });
  for (let i = 0; i < 10; i++) { const t = makeTower(14, 24 + (i * 13) % 36, 12, ['#dfe7f2', '#cfdcec', '#e8e2d6'][i % 3], i); t.position.set(-80 + i * 18, 0, -70 - (i % 2) * 12); ex.add(t); }
  // flying lost things (keys/socks/papers) — positioned per shot
  W.flyers = []; for (let i = 0; i < 14; i++) { const f = new THREE.Group(); const k = i % 3; if (k === 0) { const r = mesh(new THREE.TorusGeometry(0.25, 0.07, 6, 14), std('#ffd23a', { metalness: 0.7 }), 0, 0, 0, f); } else if (k === 1) { mesh(rb(0.35, 0.18, 1.0, 0.05), std(['#ff4f8b', '#3fa9ff', '#40c463'][i % 3]), 0, 0, 0, f); } else mesh(box(1.0, 0.03, 1.3), std('#ffffff'), 0, 0, 0, f); f.scale.setScalar(2.5); scene.add(f); f.visible = false; W.flyers.push(f); }

  // ---------- cast ----------
  const mk = (key, o) => { if (W.chars[key]) return; const c = makeCharacter(o); W.chars[key] = c; scene.add(c.group); };
  mk('finch', { name: 'Finch', skin: '#e6b58f', shirt: '#6a5a8a', print: 'cardigan', pants: '#4a4a5a', shoes: '#2b1d16', hair: 'pell', hairColor: '#e8e8f0', hatColor: '#3a3a4a', faceOpts: { glasses: true }, scale: 0.98 });
  mk('brother2', { name: 'Brother2', skin: '#f3c39a', shirt: '#ffd23a', print: 'star', pants: '#2f5fe0', shoes: '#ff4d4d', hair: 'theo', hairColor: '#4a2a17', scale: 0.7 });
  W.props.spoon = (() => { const g = new THREE.Group(); mesh(box(0.03, 0.3, 0.02), std('#c8cdd8', { metalness: 0.8 }), 0, 0.15, 0, g); mesh(new THREE.SphereGeometry(0.05, 10, 6), std('#c8cdd8', { metalness: 0.8 }), 0, 0.31, 0, g).scale.set(1, 0.5, 1.3); return { group: g }; })();

  W.resetHooks = W.resetHooks || [];
  W.resetHooks.push(() => {
    W.setAisle('none'); W.ryanLabel.visible = false;
    for (const k of W.sleepKids) { k.group.visible = false; k.setPose({}); k.group.rotation.set(0, 0, 0); scene.add(k.group); }
    for (const t of W.props.wristTags) t.group.removeFromParent();
    W.lostDog.group.removeFromParent(); W.props.spoon.group.removeFromParent();
    W.flyers.forEach(f => { f.removeFromParent(); f.visible = false; });
    W.aisleLamps.forEach(l => { l.color.set('#ffe8c0'); l.intensity = 5; });
  });
}
