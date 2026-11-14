// v3 "Float Hour" sets: town square with clock tower, shops, crowds, cars/bus, signs; gear room; cast.
import * as THREE from 'three';
import { makeCharacter } from './character.js';
import { std, basic, rb, box, mesh, canvasTex, makeHouse, makeTree, makeCloud, makeTower, makeMailbox } from './props.js';

const BRASS = '#e0a93a';

// ---------- in-world signs ----------
export function makeSignBoard(lines, { w = 6, h = 2, bg = '#ff3b6b', fg = '#ffffff', border = '#ffffff', font = 'Montserrat', legs = 0, emissive = 0.15 } = {}) {
  const g = new THREE.Group();
  const tex = canvasTex(1024, Math.round(1024 * h / w), (x, W, H) => {
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.strokeStyle = border; x.lineWidth = Math.max(10, H * 0.05); x.strokeRect(x.lineWidth, x.lineWidth, W - 2 * x.lineWidth, H - 2 * x.lineWidth);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const n = lines.length;
    lines.forEach((l, i) => {
      const txt = typeof l === 'string' ? l : l.t; const col = typeof l === 'string' ? fg : (l.c || fg);
      let size = (typeof l === 'string' ? 1 : (l.s || 1)) * H / (n + 0.9);
      x.font = `900 ${size}px ${font}`; while (x.measureText(txt).width > W * 0.88) { size *= 0.94; x.font = `900 ${size}px ${font}`; }
      x.fillStyle = col; x.fillText(txt, W / 2, H * (i + 1) / (n + 1) + size * 0.04);
    });
  });
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: emissive });
  mesh(rb(w + 0.2, h + 0.2, 0.2, 0.06), std('#2a2a3a'), 0, legs + h / 2, -0.06, g);
  mesh(new THREE.PlaneGeometry(w, h), m, 0, legs + h / 2, 0.05, g, { cast: false });
  if (legs) for (const sx of [-1, 1]) mesh(box(0.2, legs, 0.2), std('#3a3f55'), sx * w * 0.35, legs / 2, -0.1, g);
  return { group: g, mat: m, tex };
}

// ---------- clock tower ----------
function makeKey(s = 1) {
  const g = new THREE.Group(); const m = std(BRASS, { metalness: 0.7, roughness: 0.3 });
  const ring = mesh(new THREE.TorusGeometry(0.55 * s, 0.16 * s, 10, 24), m, 0, 0, 0, g); ring.rotation.y = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.12 * s, 0.12 * s, 1.8 * s, 12), m, 0, 0, 0, g).rotation.z = Math.PI / 2;
  g.children[1].position.x = -1.2 * s;
  mesh(box(0.2 * s, 0.5 * s, 0.14 * s), m, -1.9 * s, -0.25 * s, 0, g); mesh(box(0.2 * s, 0.35 * s, 0.14 * s), m, -1.55 * s, -0.2 * s, 0, g);
  return g;
}

function clockFaceTex() {
  return canvasTex(512, 512, (x, W, H) => {
    x.fillStyle = '#fffaf0'; x.beginPath(); x.arc(256, 256, 250, 0, 7); x.fill();
    x.lineWidth = 18; x.strokeStyle = '#2a2a3a'; x.beginPath(); x.arc(256, 256, 238, 0, 7); x.stroke();
    x.fillStyle = '#2a2a3a'; x.font = '900 56px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; x.fillText(String(i), 256 + Math.cos(a) * 182, 256 + Math.sin(a) * 182 + 4); }
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; const r0 = i % 5 ? 222 : 210; x.lineWidth = i % 5 ? 3 : 7; x.beginPath(); x.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0); x.lineTo(256 + Math.cos(a) * 232, 256 + Math.sin(a) * 232); x.stroke(); }
  });
}

function makeClockTower() {
  const g = new THREE.Group(); g.name = 'clockTower';
  const cream = std('#f6e7c6', { roughness: 0.7 }), trim = std('#ffffff'), roof = std('#2fae9a', { roughness: 0.5 });
  mesh(box(7, 16, 7), cream, 0, 8, 0, g);
  for (const y of [0.4, 8, 15.8]) mesh(box(7.5, 0.5, 7.5), trim, 0, y, 0, g);
  mesh(box(7.8, 7, 7.8), std('#efd9ad'), 0, 19.5, 0, g);
  mesh(box(8.3, 0.6, 8.3), trim, 0, 23.2, 0, g);
  const r = mesh(new THREE.ConeGeometry(6.3, 6.5, 4), roof, 0, 26.7, 0, g); r.rotation.y = Math.PI / 4;
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 6), std('#555'), 0, 31, 0, g);
  const flag = mesh(box(1.4, 0.8, 0.04), std('#ff3b6b'), 0.75, 32, 0, g);
  // windows
  for (const y of [4.5, 11]) for (const x of [-1.8, 1.8]) mesh(box(1.2, 1.8, 0.1), std('#6fb6ff', { metalness: 0.4, roughness: 0.15 }), x, y, 3.53, g);
  // clock face (+z) and hands
  const face = mesh(new THREE.CircleGeometry(2.9, 48), new THREE.MeshStandardMaterial({ map: clockFaceTex(), roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.12 }), 0, 19.5, 3.92, g, { cast: false });
  mesh(new THREE.TorusGeometry(2.95, 0.18, 8, 48), std(BRASS, { metalness: 0.6, roughness: 0.35 }), 0, 19.5, 3.95, g);
  const hourP = new THREE.Group(); hourP.position.set(0, 19.5, 4.02); g.add(hourP);
  const minP = new THREE.Group(); minP.position.set(0, 19.5, 4.06); g.add(minP);
  mesh(box(0.32, 1.5, 0.06), std('#1e1e2a'), 0, 0.6, 0, hourP); mesh(box(0.2, 2.3, 0.06), std('#1e1e2a'), 0, 0.95, 0, minP);
  mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16), std(BRASS, { metalness: 0.6 }), 0, 19.5, 4.1, g).rotation.x = Math.PI / 2;
  // digital board on the base
  const dTex = canvasTex(512, 160, () => {});
  const digital = mesh(new THREE.PlaneGeometry(4.2, 1.3), new THREE.MeshBasicMaterial({ map: dTex }), 0, 6.0, 3.6, g, { cast: false });
  mesh(box(4.5, 1.6, 0.12), std('#1b1b26'), 0, 6.0, 3.5, g);
  // wind-up key on the right side (+x face) and its keyhole
  const keyhole = mesh(new THREE.CircleGeometry(0.75, 24), basic('#141018'), 3.92, 19.5, 0, g, { cast: false }); keyhole.rotation.y = Math.PI / 2;
  const key = makeKey(1.5); key.position.set(3.95 + 2.9, 19.5, 0); g.add(key);
  // clock door + balcony on the -x face
  mesh(box(0.15, 2.4, 1.5), std('#7a3b2e'), -3.95, 17.4, 0, g);
  mesh(box(1.4, 0.2, 2.6), std('#ffffff'), -4.6, 16.1, 0, g);
  // winding ledge on the +x face (Grandpa stands here)
  mesh(box(2.6, 0.3, 3.2), std('#ffffff'), 5.2, 17.25, 0, g);
  for (const z of [-1.5, 1.5]) mesh(box(2.6, 0.9, 0.08), std('#ffc928'), 5.2, 17.85, z, g);
  mesh(box(0.08, 0.9, 3.2), std('#ffc928'), 6.45, 17.85, 0, g);
  // ladder up the front-left corner
  for (let y = 0.6; y < 16; y += 0.5) mesh(box(0.9, 0.08, 0.08), std('#8a8fa8'), -2.4, y, 3.65, g);
  for (const x of [-2.85, -1.95]) mesh(box(0.08, 15.6, 0.08), std('#8a8fa8'), x, 8, 3.65, g);
  const api = {
    group: g, key, digital, hourP, minP, flag,
    setTime(h, m) { minP.rotation.z = -m / 60 * Math.PI * 2; hourP.rotation.z = -((h % 12) + m / 60) / 12 * Math.PI * 2; },
    setDigital(str, col = '#ff3b3b') {
      const c = dTex.userData.canvas, x = c.getContext('2d'); x.fillStyle = '#0d0a10'; x.fillRect(0, 0, 512, 160);
      x.font = 'bold 92px "DejaVu Sans Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = col; x.shadowBlur = 8; x.fillStyle = col; x.fillText(str, 256, 86); x.shadowBlur = 0; x.fillStyle = '#ffe0e0'; x.globalAlpha = 0.35; x.fillText(str, 256, 86); x.globalAlpha = 1; dTex.needsUpdate = true;
    },
  };
  api.setTime(11, 59); api.setDigital('11:59:00');
  return api;
}

// ---------- shops, railings, fountain, siren, vehicles ----------
function makeShop(name, color, awning, h = 9, w = 8, d = 8) {
  const g = new THREE.Group();
  mesh(box(w, h, d), std(color, { roughness: 0.75 }), 0, h / 2, 0, g);
  mesh(box(w + 0.3, 0.4, d + 0.3), std('#ffffff'), 0, h, 0, g);
  // shop window + door
  mesh(box(w * 0.7, 2.4, 0.1), std('#8fd0ff', { metalness: 0.4, roughness: 0.1 }), -0.6, 1.6, d / 2 + 0.05, g);
  mesh(box(1.2, 2.4, 0.12), std('#7a3b2e'), w * 0.36, 1.2, d / 2 + 0.06, g);
  for (let row = 0; row < Math.floor((h - 4) / 2.6); row++) for (const x of [-w * 0.28, w * 0.28]) mesh(box(1.5, 1.4, 0.1), std('#8fd0ff', { metalness: 0.4, roughness: 0.1 }), x, 4.8 + row * 2.6, d / 2 + 0.05, g);
  // striped awning
  const at = canvasTex(256, 64, (x, W, H) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : awning; x.fillRect(i * W / 8, 0, W / 8, H); } });
  const aw = mesh(box(w * 0.9, 0.12, 1.4), new THREE.MeshStandardMaterial({ map: at }), 0, 3.15, d / 2 + 0.7, g); aw.rotation.x = 0.25;
  const sign = makeSignBoard([name], { w: w * 0.7, h: 0.9, bg: awning, fg: '#ffffff' }); sign.group.position.set(0, 3.45, d / 2 + 0.12); g.add(sign.group);
  return g;
}

function makeRail(len, color = '#ffc928') {
  const g = new THREE.Group(); const m = std(color, { roughness: 0.35, metalness: 0.2 });
  for (let x = -len / 2; x <= len / 2 + 1e-6; x += 2) mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.05, 8), m, x, 0.52, 0, g);
  mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 8), m, 0, 1.05, 0, g).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 8), m, 0, 0.55, 0, g).rotation.z = Math.PI / 2;
  return g;
}

function makeFountain() {
  const g = new THREE.Group();
  const stone = std('#f4f1ea', { roughness: 0.6 });
  mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.8, 32), stone, 0, 0.4, 0, g);
  const water = mesh(new THREE.CylinderGeometry(3.05, 3.05, 0.1, 32), new THREE.MeshStandardMaterial({ color: '#4fc3ff', roughness: 0.1, metalness: 0.2, emissive: '#1d7fd0', emissiveIntensity: 0.25 }), 0, 0.72, 0, g, { cast: false });
  mesh(new THREE.CylinderGeometry(0.4, 0.55, 2.2, 16), stone, 0, 1.5, 0, g);
  mesh(new THREE.CylinderGeometry(1.4, 0.6, 0.4, 24), stone, 0, 2.6, 0, g);
  const jet = mesh(new THREE.CylinderGeometry(0.12, 0.25, 1.4, 12), new THREE.MeshStandardMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.7, emissive: '#7fd3ff', emissiveIntensity: 0.3 }), 0, 3.4, 0, g, { cast: false });
  return { group: g, water, jet };
}

function makeSiren() {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 10), std('#4b5068'), 0, 4, 0, g);
  for (let i = 0; i < 3; i++) { const h = mesh(new THREE.ConeGeometry(0.55, 1.2, 16, 1, true), std('#e8233c', { side: THREE.DoubleSide }), 0, 8.2, 0, g); h.rotation.z = Math.PI / 2; h.rotation.y = i * Math.PI * 2 / 3; h.position.x = Math.cos(i * Math.PI * 2 / 3) * 0.7; h.position.z = -Math.sin(i * Math.PI * 2 / 3) * 0.7; }
  const light = mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff3b3b' }), 0, 8.9, 0, g, { cast: false });
  return { group: g, light };
}

function makeCar(color) {
  const g = new THREE.Group();
  mesh(rb(2.0, 0.8, 4.0, 0.25), std(color, { roughness: 0.3, metalness: 0.2 }), 0, 0.75, 0, g);
  mesh(rb(1.8, 0.75, 2.2, 0.25), std(color, { roughness: 0.3, metalness: 0.2 }), 0, 1.45, -0.2, g);
  mesh(box(1.7, 0.55, 2.0), std('#9fd6ff', { metalness: 0.5, roughness: 0.1 }), 0, 1.47, -0.2, g);
  for (const [x, z] of [[0.95, 1.3], [-0.95, 1.3], [0.95, -1.3], [-0.95, -1.3]]) { const w = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 14), std('#22252e'), x, 0.38, z, g); w.rotation.z = Math.PI / 2; }
  for (const x of [0.6, -0.6]) mesh(box(0.35, 0.2, 0.05), basic('#fff6c8'), x, 0.85, 2.01, g, { cast: false });
  return g;
}

function makeBus() {
  const g = new THREE.Group();
  mesh(rb(2.5, 2.4, 8, 0.3), std('#ffc928', { roughness: 0.4 }), 0, 1.6, 0, g);
  mesh(box(2.55, 0.25, 8.05), std('#1e1e2a'), 0, 1.3, 0, g);
  for (let z = -3.2; z <= 3.2; z += 1.3) for (const x of [1.27, -1.27]) mesh(box(0.05, 0.75, 1.0), std('#9fd6ff', { metalness: 0.5, roughness: 0.1 }), x, 2.15, z, g);
  mesh(box(2.2, 0.8, 0.05), std('#9fd6ff', { metalness: 0.5, roughness: 0.1 }), 0, 2.1, 4.01, g);
  const sign = makeSignBoard(['SCHOOL BUS'], { w: 2.2, h: 0.4, bg: '#1e1e2a', fg: '#ffc928', border: '#1e1e2a' }); sign.group.position.set(0, 2.55, 4.03); sign.group.scale.setScalar(1); g.add(sign.group);
  for (const [x, z] of [[1.15, 2.6], [-1.15, 2.6], [1.15, -2.6], [-1.15, -2.6]]) { const w = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14), std('#22252e'), x, 0.5, z, g); w.rotation.z = Math.PI / 2; }
  return g;
}

function makeBalloon() {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 4), std('#ffffff'), 0, 0.6, 0, g, { cast: false });
  mesh(new THREE.SphereGeometry(0.28, 20, 14), std('#ff2f4f', { roughness: 0.25 }), 0, 1.4, 0, g).scale.set(1, 1.2, 1);
  mesh(new THREE.ConeGeometry(0.05, 0.08, 8), std('#ff2f4f'), 0, 1.06, 0, g);
  return { group: g };
}

function makeGear(r, teeth, thick, color) {
  const g = new THREE.Group(); const m = std(color, { metalness: 0.65, roughness: 0.35 });
  mesh(new THREE.CylinderGeometry(r, r, thick, 32), m, 0, 0, 0, g).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(r * 0.25, r * 0.25, thick * 1.6, 16), std('#3a2a20', { metalness: 0.5 }), 0, 0, 0, g).rotation.x = Math.PI / 2;
  for (let i = 0; i < teeth; i++) { const a = i / teeth * Math.PI * 2; const t = mesh(box(r * 0.22, r * 0.22, thick), m, Math.cos(a) * (r + r * 0.08), Math.sin(a) * (r + r * 0.08), 0, g); t.rotation.z = a; }
  for (let i = 0; i < 4; i++) { const s = mesh(box(r * 1.6, r * 0.12, thick * 1.1), std('#3a2a20', { metalness: 0.5 }), 0, 0, 0, g); s.rotation.z = i * Math.PI / 4; }
  return g;
}

// ---------- crowd ----------
const SKINS = ['#f3c39a', '#e0a77a', '#c98a5c', '#8d5a3b', '#f6d2b4', '#b07850'];
const SHIRTS = ['#ff4f6d', '#3fa9ff', '#40c463', '#ffb020', '#9b5cff', '#ff7ac4', '#21c7b5', '#ffffff', '#ff6a2b'];
const PANTS = ['#2f5fe0', '#2a2a3a', '#6b4a35', '#3fae6a', '#8a8fa8'];
const HAIRS = ['crowd1', 'crowd2', 'theo', 'mia', 'cap', 'bo'];
const HAIRC = ['#2b1a10', '#5a3220', '#f2c14e', '#c0522b', '#111111', '#7a5230'];
function makeCrowd(n, seed = 3) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = makeCharacter({
      name: 'crowd' + i, skin: SKINS[Math.floor(r() * SKINS.length)], shirt: SHIRTS[Math.floor(r() * SHIRTS.length)], pants: PANTS[Math.floor(r() * PANTS.length)],
      hair: HAIRS[Math.floor(r() * HAIRS.length)], hairColor: HAIRC[Math.floor(r() * HAIRC.length)], hatColor: SHIRTS[Math.floor(r() * SHIRTS.length)],
      print: r() < 0.3 ? 'hoodie' : null, scale: 0.75 + r() * 0.3,
    });
    c.seed = r() * 100; out.push(c);
  }
  return out;
}

// =====================================================================================
export function buildV3(scene, W) {
  // ---------------- SQUARE (x = -400) ----------------
  const sq = new THREE.Group(); sq.name = 'square'; sq.position.set(-400, 0, 0); scene.add(sq); W.sets.square = sq;
  const ground = mesh(new THREE.PlaneGeometry(500, 500), std('#5cc95a', { roughness: 0.95 }), 0, 0, 0, sq, { cast: false }); ground.rotation.x = -Math.PI / 2;
  const tileTex = canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#d9dde8' : '#c9cedc'; x.fillRect(i * 64, j * 64, 64, 64); } });
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(12, 12);
  mesh(box(46, 0.12, 46), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.8 }), 0, 0.06, 0, sq, { cast: false });
  const roadM = std('#4a505e', { roughness: 0.9 }), walkM = std('#dfe3ea', { roughness: 0.9 });
  mesh(box(9, 0.08, 160), roadM, 0, 0.04, 103, sq, { cast: false });
  for (const sx of [-1, 1]) mesh(box(3, 0.14, 160), walkM, sx * 6, 0.07, 103, sq, { cast: false });
  for (let z = 26; z < 180; z += 6) mesh(box(0.25, 0.1, 2.6), std('#ffffff'), 0, 0.09, z, sq, { cast: false });
  for (let k = -4; k <= 4; k++) mesh(box(0.8, 0.1, 3.2), std('#ffffff'), k * 1.0, 0.1, 27, sq, { cast: false });
  mesh(box(200, 0.08, 9), roadM, 0, 0.04, 33, sq, { cast: false });

  const tower = makeClockTower(); tower.group.position.set(0, 0, -14); sq.add(tower.group); W.tower = tower;
  const fountain = makeFountain(); fountain.group.position.set(0, 0.12, 7); sq.add(fountain.group); W.fountain = fountain;
  const siren = makeSiren(); siren.group.position.set(14, 0.12, -6); sq.add(siren.group); W.siren = siren;

  // railings: plaza edges (with gaps) + along the south road
  W.rails = [];
  const addRail = (len, x, z, rot) => { const r = makeRail(len); r.position.set(x, 0.12, z); r.rotation.y = rot; sq.add(r); W.rails.push({ x, z, rot, len }); return r; };
  addRail(16, -13, 22, 0); addRail(16, 13, 22, 0);
  addRail(30, -22, 5, Math.PI / 2); addRail(30, 22, 5, Math.PI / 2);
  for (const sx of [-1, 1]) for (let z = 40; z < 170; z += 22) addRail(18, sx * 7.7, z, Math.PI / 2);
  // lampposts
  W.lamps3 = [];
  for (const [x, z] of [[-10, 20], [10, 20], [-20, -5], [20, -5], [-7.6, 50], [7.6, 50], [-7.6, 80], [7.6, 80]]) {
    const lp = new THREE.Group(); lp.position.set(x, 0.12, z); sq.add(lp);
    mesh(new THREE.CylinderGeometry(0.12, 0.16, 5, 10), std('#2f4f46'), 0, 2.5, 0, lp);
    mesh(rb(0.6, 0.6, 0.6, 0.1), std('#fff3c4', { emissive: '#ffd27a', emissiveIntensity: 0.5 }), 0, 5.2, 0, lp);
    W.lamps3.push(lp);
  }
  // banner over the square
  const banner = makeSignBoard([{ t: 'FLOAT HOUR', c: '#ffffff' }, { t: '12:00 · HOLD ON!', c: '#ffe14a' }], { w: 14, h: 2.6, bg: '#2f6fe0', border: '#ffe14a' });
  banner.group.position.set(0, 6.5, 21); banner.group.rotation.y = Math.PI; sq.add(banner.group); W.banner = banner;
  for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.15, 0.15, 9, 8), std('#3a3f55'), sx * 7.4, 4.5, 21, sq);

  // shops around the square + houses along the road
  const shops = new THREE.Group(); sq.add(shops); W.shops = shops;
  const shopDefs = [['BAKERY', '#ffd6e0', '#ff4f8b'], ['TOYS', '#cfe3ff', '#2f6fe0'], ['BOOKS', '#d9f2d4', '#2fae6a'], ['PIZZA', '#ffe9c4', '#ff6a2b'], ['ICE CREAM', '#e8dcff', '#9b5cff'], ['HARDWARE', '#fdf0b8', '#e8a400']];
  shopDefs.forEach(([n, c, a], i) => { const s = makeShop(n, c, a, 8 + (i % 3) * 2.5); const left = i < 3; s.position.set(left ? -29 : 29, 0.1, -12 + (i % 3) * 13); s.rotation.y = left ? Math.PI / 2 : -Math.PI / 2; shops.add(s); });
  const hotelBoard = makeSignBoard([{ t: 'GRIMSBY', c: '#ffe14a' }, { t: 'SKY HOTEL', c: '#ffffff' }, { t: 'OPENS TOMORROW!', c: '#ff9bd2', s: 0.7 }], { w: 9, h: 4.5, bg: '#5a2bb5', border: '#ffe14a', legs: 3, emissive: 0.25 });
  hotelBoard.group.position.set(24, 10.6, 6); hotelBoard.group.rotation.y = -Math.PI / 2 + 0.35; sq.add(hotelBoard.group); W.hotelBoard = hotelBoard;
  const houses = new THREE.Group(); sq.add(houses); W.houses3 = [];
  for (let z = 42, k = 0; z < 170; z += 12, k++) for (const sx of [-1, 1]) {
    const h = makeHouse({ seed: 70 + k * 2 + (sx > 0), lit: [false, false, false, false] }); h.group.position.set(sx * 16, 0, z); h.group.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2; houses.add(h.group); W.houses3.push(h);
    if (k % 2 === 0) { const t = makeTree(k, 0.9); t.position.set(sx * 10.5, 0, z + 6); houses.add(t); }
  }
  const skyline = new THREE.Group(); sq.add(skyline);
  for (let i = 0; i < 16; i++) { const t = makeTower(14, 30 + (i * 37) % 50, 12, ['#dfe7f2', '#cfdcec', '#e8e2d6', '#d4e4e8'][i % 4]); t.position.set(-120 + i * 16, 0, -95 - (i % 3) * 12); skyline.add(t); }
  const clouds = new THREE.Group(); sq.add(clouds); W.clouds3 = clouds;
  for (let i = 0; i < 12; i++) { const c = makeCloud(i); c.position.set(-150 + (i * 83) % 300, 50 + (i * 11) % 25, -160 + (i * 57) % 220); clouds.add(c); }

  // vehicles + mailboxes (floatable)
  W.cars = [];
  [['#ff4f6d', -2.2, 46, 0], ['#3fa9ff', 2.2, 60, Math.PI], ['#40c463', -2.2, 75, 0], ['#ffffff', 2.2, 38, Math.PI]].forEach(([c, x, z, r]) => { const car = makeCar(c); car.position.set(x, 0.08, z); car.rotation.y = r; sq.add(car); W.cars.push({ obj: car, base: [x, 0.08, z], rot: r }); });
  const bus = makeBus(); bus.position.set(2.2, 0.08, 92); bus.rotation.y = Math.PI; sq.add(bus); W.bus = { obj: bus, base: [2.2, 0.08, 92], rot: Math.PI };
  W.mailboxes3 = [];
  for (const z of [44, 56, 68]) { const m = makeMailbox(); m.position.set(-8.6, 0, z); sq.add(m); W.mailboxes3.push({ obj: m, base: [-8.6, 0, z] }); }

  // ---------------- GEAR ROOM (x = -600) ----------------
  const gr = new THREE.Group(); gr.name = 'gears'; gr.position.set(-600, 0, 0); scene.add(gr); W.sets.gears = gr;
  mesh(new THREE.CylinderGeometry(7, 7, 9, 32, 1, true), std('#8a5a3c', { side: THREE.BackSide, roughness: 0.8 }), 0, 4.5, 0, gr, { cast: false });
  const plankTex = canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#a06a42' : '#8f5c38'; x.fillRect(0, i * 32, w, 32); x.fillStyle = '#5d3a25'; x.fillRect(0, i * 32, w, 2); } });
  plankTex.wrapS = plankTex.wrapT = THREE.RepeatWrapping; plankTex.repeat.set(3, 3);
  mesh(new THREE.CylinderGeometry(7, 7, 0.2, 32), new THREE.MeshStandardMaterial({ map: plankTex }), 0, -0.1, 0, gr, { cast: false });
  mesh(new THREE.CylinderGeometry(7, 7, 0.2, 32), std('#5d3a25'), 0, 9, 0, gr);
  // the clock face seen from inside (back wall, glowing)
  const inside = mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshBasicMaterial({ map: clockFaceTex(), color: '#ffe6a8' }), 0, 5.5, -6.85, gr, { cast: false }); inside.scale.x = -1;
  W.gears = [];
  for (const [x, y, z, r, t, c, sp] of [[-4.2, 6.5, -4.6, 2.2, 16, BRASS, 0.5], [-2.2, 3.4, -5.8, 1.4, 12, '#c98a2b', -0.8], [4.3, 6.0, -4.4, 2.6, 18, BRASS, -0.4], [2.6, 2.6, -5.6, 1.2, 10, '#c98a2b', 0.9], [-5.5, 2.2, -2.5, 1.6, 12, BRASS, 0.6], [5.6, 2.4, -2.0, 1.5, 12, '#c98a2b', -0.7]]) {
    const gg = makeGear(r, t, 0.4, c); gg.position.set(x, y, z); gg.lookAt(0, y, 0); gr.add(gg); W.gears.push({ obj: gg, speed: sp });
  }
  // giant keyhole plate in the middle
  const kTex = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#e0a93a'; x.fillRect(0, 0, w, h); x.fillStyle = '#b07a20'; x.fillRect(12, 12, w - 24, h - 24); x.fillStyle = '#e0a93a'; x.fillRect(24, 24, w - 48, h - 48); x.fillStyle = '#100c12'; x.beginPath(); x.arc(128, 190, 58, 0, 7); x.fill(); x.beginPath(); x.moveTo(98, 220); x.lineTo(158, 220); x.lineTo(176, 400); x.lineTo(80, 400); x.closePath(); x.fill(); });
  mesh(box(2.6, 5.2, 0.4), std(BRASS, { metalness: 0.6, roughness: 0.35 }), 0, 2.6, -3.0, gr);
  mesh(new THREE.PlaneGeometry(2.4, 4.8), new THREE.MeshStandardMaterial({ map: kTex, metalness: 0.5, roughness: 0.35 }), 0, 2.6, -2.79, gr, { cast: false });
  const bigKey = makeKey(1.6); bigKey.rotation.y = -Math.PI / 2; bigKey.position.set(0, 3.25, -2.75 + 3.1); gr.add(bigKey); W.bigKey = bigKey;
  const warm1 = new THREE.PointLight('#ffc46b', 4, 0, 1.4); warm1.position.set(0, 7, 2); gr.add(warm1);
  const warm2 = new THREE.PointLight('#ffd9a0', 2, 0, 1.4); warm2.position.set(0, 4, 5); gr.add(warm2);

  // ---------------- CAST ----------------
  // narrator: Leo (12). Kept under the key 'ivy' so the shot list did not need renaming.
  const ivy = makeCharacter({ name: 'Leo', skin: '#f1c09a', shirt: '#8a5cff', print: 'hoodie', pants: '#2f5fe0', shoes: '#ffffff', hair: 'theo', hairColor: '#6b3a1e', scale: 0.92 });
  const bo = makeCharacter({ name: 'Bo', skin: '#f6cfa6', shirt: '#ff8a1f', print: 'overalls', sleeves: '#ff8a1f', pants: '#2f6fe0', shoes: '#ff3b4e', hair: 'bo', hairColor: '#f2c14e', scale: 0.66 });
  const gus = makeCharacter({ name: 'Gus', skin: '#e9b48d', shirt: '#8b5a2b', print: 'cardigan', pants: '#4b4f72', shoes: '#2b1d16', hair: 'gus', hairColor: '#f4f4f4', scale: 1.0, faceOpts: { glasses: true } });
  const mayor = makeCharacter({ name: 'Mayor', skin: '#f0c4a0', shirt: '#6a2fb5', print: 'mayor', pants: '#3a2a60', shoes: '#1a1420', hair: 'toupee', hairColor: '#2b1a10', scale: 1.08 });
  Object.assign(W.chars, { ivy, bo, gus, mayor });
  for (const c of [ivy, bo, gus, mayor]) scene.add(c.group);
  W.crowd = makeCrowd(20);
  for (const c of W.crowd) { c.group.traverse(o => { if (o.isMesh) o.castShadow = false; }); scene.add(c.group); }
  W.props.balloon = makeBalloon();
  W.props.keyProp = makeKey(0.45);
  W.props.neckKey = makeKey(0.22);
  W.props.toupeeHome = { parent: mayor.parts.toupee.parent, pos: mayor.parts.toupee.position.clone() };
  W.v3 = true;
}

// v3 lighting presets (merged into PRESETS by the player)
export const PRESETS_V3 = {
  bright: { top: '#2f8cff', mid: '#8fd0ff', bottom: '#e6f6ff', fog: '#d6eeff', fogNear: 90, fogFar: 520, hemi: ['#ffffff', '#8fb87a', 1.7], key: ['#fff8ec', 2.6], fill: 0.7, stars: false, moon: false, clouds: true, bloom: [0.25, 0.4, 0.98] },
  storm: { top: '#5b6f9a', mid: '#9aa8c8', bottom: '#c9d3e6', fog: '#b9c4dc', fogNear: 60, fogFar: 380, hemi: ['#e6ecff', '#7f8aa0', 1.8], key: ['#f2f4ff', 2.4], fill: 0.6, stars: false, moon: false, clouds: true, bloom: [0.3, 0.4, 0.95] },
  gearroom: { top: '#2a1a10', mid: '#3a2414', bottom: '#2a1a10', fog: '#2a1a10', fogNear: 20, fogFar: 80, hemi: ['#ffd9a0', '#3a2414', 1.2], key: ['#ffe2b0', 1.6], fill: 0.3, stars: false, moon: false, bloom: [0.6, 0.5, 0.75] },
  nightTown: { top: '#0a1a50', mid: '#2546a8', bottom: '#3558b8', fog: '#2a4a9a', fogNear: 60, fogFar: 380, hemi: ['#9fb8ff', '#22305e', 1.7], key: ['#c9d8ff', 2.0], fill: 0.5, stars: true, moon: true, bloom: [0.8, 0.5, 0.6] },
};
