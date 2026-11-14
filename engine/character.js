// Blocky R15-style characters: 15 body parts, dot-eye / line-mouth faces, block hair.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const geoCache = new Map();
function rbox(w, h, d, r = 0.035) {
  const k = [w, h, d, r].map(v => v.toFixed(3)).join(',');
  if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2)));
  return geoCache.get(k);
}

// ---------- faces ----------
const FACE_SIZE = 256;
// Expressive cartoon faces (glossy eyes, brows, blush, tears, sweat), one canvas per expression.
function drawFace(expr, opts = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = FACE_SIZE;
  const g = c.getContext('2d');
  const S = FACE_SIZE;
  g.lineCap = 'round'; g.lineJoin = 'round';
  const ink = '#1a1420';
  const L = 0.34 * S, R = 0.66 * S, EY = 0.44 * S;
  const ell = (x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
  const stroke = (w, col = ink) => { g.lineWidth = w * S; g.strokeStyle = col; };
  const path = (pts, w, col) => { stroke(w, col); g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };
  const quad = (x0, y0, cx, cy, x1, y1, w, col) => { stroke(w, col); g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); };
  // glossy eye: dark oval + white highlight (size k, pupil shrink p)
  const eye = (x, y, k = 1, p = 1, white = true) => {
    if (opts.dotEyes) { ell(x, y, 0.055 * S * k * p, 0.068 * S * k * p, ink); ell(x - 0.018 * S * k, y - 0.024 * S * k, 0.019 * S * k, 0.022 * S * k, '#ffffff'); return; }
    ell(x, y, 0.074 * S * k, 0.086 * S * k, '#ffffff'); stroke(0.011); g.beginPath(); g.ellipse(x, y, 0.074 * S * k, 0.086 * S * k, 0, 0, Math.PI * 2); g.stroke();
    const px = x + 0.006 * S, py = y + 0.012 * S;
    ell(px, py, 0.04 * S * k * p, 0.047 * S * k * p, ink);
    ell(px - 0.014 * S * k, py - 0.018 * S * k, 0.014 * S * k, 0.015 * S * k, '#ffffff');
  };
  const softBrows = (lift = 0, tiltIn = 0) => { for (const [x, sx] of [[L, 1], [R, -1]]) quad(x - 0.065 * S, EY - (0.13 + lift) * S + tiltIn * sx * 0, x, EY - (0.155 + lift) * S - tiltIn * 0.02 * S, x + 0.065 * S, EY - (0.13 + lift) * S, 0.016); };
  const happyEye = (x, y) => quad(x - 0.06 * S, y + 0.02 * S, x, y - 0.06 * S, x + 0.06 * S, y + 0.02 * S, 0.03);
  const closedEye = (x, y) => quad(x - 0.06 * S, y - 0.01 * S, x, y + 0.04 * S, x + 0.06 * S, y - 0.01 * S, 0.026);
  const brows = (tilt, y = EY - 0.13 * S, w = 0.028) => { // tilt>0 angry (inner down), <0 worried
    path([[L - 0.07 * S, y - tilt * 0.03 * S], [L + 0.06 * S, y + tilt * 0.03 * S]], w);
    path([[R + 0.07 * S, y - tilt * 0.03 * S], [R - 0.06 * S, y + tilt * 0.03 * S]], w);
  };
  const blush = (a = 0.55) => { ell(0.2 * S, 0.6 * S, 0.06 * S, 0.035 * S, `rgba(255,110,140,${a})`); ell(0.8 * S, 0.6 * S, 0.06 * S, 0.035 * S, `rgba(255,110,140,${a})`); };
  const openMouth = (x, y, w, h, tongue = true) => {
    g.fillStyle = '#5a1020'; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y + h * 2, x + w, y); g.closePath(); g.fill();
    if (tongue) { g.save(); g.clip(); ell(x, y + h * 1.1, w * 0.55, h * 0.55, '#ff6b8a'); g.restore(); }
    g.fillStyle = '#ffffff'; g.fillRect(x - w * 0.7, y, w * 1.4, h * 0.22);
  };
  const sweat = () => { g.fillStyle = '#7fd3ff'; g.beginPath(); g.moveTo(0.83 * S, 0.22 * S); g.quadraticCurveTo(0.88 * S, 0.33 * S, 0.83 * S, 0.35 * S); g.quadraticCurveTo(0.78 * S, 0.33 * S, 0.83 * S, 0.22 * S); g.fill(); };
  const tears = () => { g.fillStyle = 'rgba(90,180,255,0.9)'; g.fillRect(L - 0.025 * S, EY + 0.05 * S, 0.05 * S, 0.34 * S); g.fillRect(R - 0.025 * S, EY + 0.05 * S, 0.05 * S, 0.34 * S); };
  switch (expr) {
    case 'sleep': closedEye(L, EY); closedEye(R, EY); quad(0.45 * S, 0.68 * S, 0.5 * S, 0.71 * S, 0.55 * S, 0.68 * S, 0.022); blush(0.35); break;
    case 'smile': eye(L, EY); eye(R, EY); softBrows(); g.fillStyle = '#5a1020'; g.beginPath(); g.moveTo(0.4 * S, 0.65 * S); g.quadraticCurveTo(0.5 * S, 0.75 * S, 0.6 * S, 0.65 * S); g.closePath(); g.fill(); ell(0.5 * S, 0.695 * S, 0.035 * S, 0.018 * S, '#ff7a96'); blush(0.35); break;
    case 'laugh': happyEye(L, EY); happyEye(R, EY); openMouth(0.5 * S, 0.62 * S, 0.11 * S, 0.07 * S); blush(0.6); break;
    case 'smirk': eye(L, EY); eye(R, EY); brows(-0.3); quad(0.42 * S, 0.68 * S, 0.54 * S, 0.71 * S, 0.63 * S, 0.62 * S, 0.03); break;
    case 'unimpressed': path([[L - 0.06 * S, EY - 0.02 * S], [L + 0.06 * S, EY - 0.02 * S]], 0.02); path([[R - 0.06 * S, EY - 0.02 * S], [R + 0.06 * S, EY - 0.02 * S]], 0.02);
      ell(L, EY + 0.012 * S, 0.05 * S, 0.035 * S, ink); ell(R, EY + 0.012 * S, 0.05 * S, 0.035 * S, ink); path([[0.42 * S, 0.68 * S], [0.58 * S, 0.68 * S]], 0.026); break;
    case 'worried': eye(L, EY + 4); eye(R, EY + 4); brows(-1); quad(0.4 * S, 0.7 * S, 0.5 * S, 0.64 * S, 0.6 * S, 0.7 * S, 0.026); sweat(); break;
    case 'scared': eye(L, EY, 1.1, 0.7); eye(R, EY, 1.1, 0.7); brows(-1.2, EY - 0.17 * S, 0.018); ell(0.5 * S, 0.71 * S, 0.055 * S, 0.07 * S, '#5a1020'); ell(0.5 * S, 0.745 * S, 0.034 * S, 0.026 * S, '#ff7a96'); sweat(); break;
    case 'crying': eye(L, EY, 1.1); eye(R, EY, 1.1); brows(-1); tears(); quad(0.4 * S, 0.74 * S, 0.5 * S, 0.66 * S, 0.6 * S, 0.74 * S, 0.026); break;
    case 'serious': eye(L, EY + 3, 0.9); eye(R, EY + 3, 0.9); brows(1.2, EY - 0.1 * S, 0.034); path([[0.41 * S, 0.69 * S], [0.59 * S, 0.69 * S]], 0.028); break;
    case 'shout': eye(L, EY, 0.9); eye(R, EY, 0.9); brows(1.2, EY - 0.1 * S, 0.034); openMouth(0.5 * S, 0.63 * S, 0.09 * S, 0.08 * S, false); break;
    case 'creepy': eye(L, EY - 2, 1.15, 0.4, true); eye(R, EY - 2, 1.15, 0.4, true);
      quad(0.14 * S, 0.57 * S, 0.5 * S, 0.9 * S, 0.86 * S, 0.57 * S, 0.024);
      path([[0.12 * S, 0.54 * S], [0.16 * S, 0.6 * S]], 0.02); path([[0.88 * S, 0.54 * S], [0.84 * S, 0.6 * S]], 0.02); break;
    case 'blankSmile': eye(L, EY - 2, 1.12, 0.0); eye(R, EY - 2, 1.12, 0.0); quad(0.2 * S, 0.58 * S, 0.5 * S, 0.86 * S, 0.8 * S, 0.58 * S, 0.024); break;
    case 'bored': eye(L, EY + 6, 0.95, 0.9); eye(R, EY + 6, 0.95, 0.9); path([[L - 0.08 * S, EY - 0.04 * S], [L + 0.08 * S, EY - 0.04 * S]], 0.03, '#f1c09a'); path([[R - 0.08 * S, EY - 0.04 * S], [R + 0.08 * S, EY - 0.04 * S]], 0.03, '#f1c09a'); path([[0.43 * S, 0.69 * S], [0.57 * S, 0.69 * S]], 0.02); break;
    case 'glow': ell(L + 4, EY, 0.03 * S, 0.03 * S, '#d6e6ff'); ell(R - 4, EY, 0.03 * S, 0.03 * S, '#d6e6ff'); break;
    case 'dog': eye(0.3 * S, 0.4 * S, 1.15); eye(0.7 * S, 0.4 * S, 1.15); break;
    case 'dogScared': eye(0.3 * S, 0.4 * S, 1.2, 0.5, true); eye(0.7 * S, 0.4 * S, 1.2, 0.5, true); brows(-1.2, 0.24 * S); break;
    case 'dogAngry': eye(0.3 * S, 0.42 * S, 1.0); eye(0.7 * S, 0.42 * S, 1.0); path([[0.18 * S, 0.24 * S], [0.4 * S, 0.33 * S]], 0.04); path([[0.82 * S, 0.24 * S], [0.6 * S, 0.33 * S]], 0.04); break;
    case 'none': break;
    case 'surprised': eye(L, EY, 1.05); eye(R, EY, 1.05); softBrows(0.03); ell(0.5 * S, 0.7 * S, 0.04 * S, 0.05 * S, '#5a1020'); ell(0.5 * S, 0.725 * S, 0.026 * S, 0.02 * S, '#ff7a96'); break;
    default: eye(L, EY); eye(R, EY); softBrows(); quad(0.44 * S, 0.68 * S, 0.5 * S, 0.7 * S, 0.56 * S, 0.68 * S, 0.02); blush(0.2);
  }
  if (opts.glasses) { stroke(0.022, '#2a2230'); for (const x of [L, R]) { g.beginPath(); g.arc(x, EY, 0.105 * S, 0, Math.PI * 2); g.stroke(); } path([[L + 0.105 * S, EY], [R - 0.105 * S, EY]], 0.02, '#2a2230'); }
  if (opts.freckles) { g.fillStyle = 'rgba(170,90,60,0.55)'; for (const [x, y] of [[0.24, 0.56], [0.28, 0.6], [0.32, 0.565], [0.68, 0.565], [0.72, 0.6], [0.76, 0.56]]) { g.beginPath(); g.arc(x * S, y * S, 0.009 * S, 0, 7); g.fill(); } }
  if (opts.beard) { g.fillStyle = opts.beard; g.beginPath(); g.moveTo(0.3 * S, 0.6 * S); g.quadraticCurveTo(0.5 * S, 0.56 * S, 0.7 * S, 0.6 * S); g.quadraticCurveTo(0.6 * S, 0.66 * S, 0.5 * S, 0.62 * S); g.quadraticCurveTo(0.4 * S, 0.66 * S, 0.3 * S, 0.6 * S); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export { drawFace };

let _pocket = null;
function pocketMat() {
  if (_pocket) return _pocket;
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
  g.setLineDash([7, 5]); g.strokeStyle = 'rgba(255,214,120,0.9)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(14, 8); g.lineTo(14, 80); g.quadraticCurveTo(64, 118, 114, 80); g.lineTo(114, 8); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  _pocket = new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.8 }); return _pocket;
}

// subtle fabric texture (multiplies the material colour); denim adds weave + dashed seams
const _fab = {};
function fabricTex(denim) {
  const k = denim ? 'd' : 'f'; if (_fab[k]) return _fab[k];
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128);
  const img = g.getImageData(0, 0, 128, 128); let sd = denim ? 7 : 3;
  for (let i = 0; i < img.data.length; i += 4) { sd = (sd * 16807) % 2147483647; const n = (sd / 2147483647); const px = (i / 4) % 128, py = Math.floor(i / 4 / 128);
    const v = denim ? 225 + n * 30 - (((px + py) % 4) < 1 ? 14 : 0) : 238 + n * 17; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; }
  g.putImageData(img, 0, 0);
  if (denim) { g.setLineDash([5, 4]); g.strokeStyle = 'rgba(255,214,120,0.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 0); g.lineTo(8, 128); g.moveTo(120, 0); g.lineTo(120, 128); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; _fab[k] = t; return t;
}

// Shirt decals: 'hoodie' | 'star' | 'cardigan' | 'pj' | 'heart'
function shirtPrint(kind, base) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d');
  const star = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); };
  if (kind === 'hoodie') {
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 9; g.beginPath(); g.moveTo(70, 0); g.quadraticCurveTo(128, 46, 186, 0); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.moveTo(66, 160); g.lineTo(84, 100); g.lineTo(172, 100); g.lineTo(190, 160); g.fill();
    g.setLineDash([7, 6]); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(74, 158); g.lineTo(90, 106); g.lineTo(166, 106); g.lineTo(182, 158); g.stroke();
    g.beginPath(); g.moveTo(128, 30); g.lineTo(128, 96); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#f4f4f4'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(110, 18); g.lineTo(106, 70); g.moveTo(146, 18); g.lineTo(150, 70); g.stroke();
    g.fillStyle = '#c9ced8'; g.fillRect(101, 68, 10, 14); g.fillRect(145, 68, 10, 14);
  } else if (kind === 'star') { star(128, 78, 46, '#ff3b4e'); }
  else if (kind === 'heart') { g.fillStyle = '#ff4f8b'; g.beginPath(); g.moveTo(128, 120); g.bezierCurveTo(60, 70, 95, 25, 128, 55); g.bezierCurveTo(161, 25, 196, 70, 128, 120); g.fill(); }
  else if (kind === 'cardigan') {
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(122, 0, 12, 160);
    g.fillStyle = '#f2e9d8'; for (const y of [30, 70, 110, 148]) { g.beginPath(); g.arc(142, y, 7, 0, 7); g.fill(); }
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(90, 0); g.lineTo(128, 50); g.lineTo(166, 0); g.fill();
  } else if (kind === 'mayor') {
    g.strokeStyle = '#e8233c'; g.lineWidth = 34; g.beginPath(); g.moveTo(40, -10); g.lineTo(220, 170); g.stroke();
    g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(128, 70, 22, 0, 7); g.fill(); g.fillStyle = '#e0a800'; g.beginPath(); g.arc(128, 70, 12, 0, 7); g.fill();
    g.strokeStyle = '#ffd23a'; g.lineWidth = 6; g.beginPath(); g.moveTo(80, 0); g.lineTo(128, 50); g.lineTo(176, 0); g.stroke();
  } else if (kind === 'jacket') {
    g.fillStyle = '#e8233c'; g.fillRect(96, 0, 64, 160);
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.beginPath(); g.moveTo(112, 6); g.lineTo(110, 70); g.moveTo(144, 6); g.lineTo(146, 70); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.moveTo(96, 0); g.lineTo(70, 0); g.lineTo(96, 46); g.fill(); g.beginPath(); g.moveTo(160, 0); g.lineTo(186, 0); g.lineTo(160, 46); g.fill();
    g.setLineDash([6, 5]); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2.5;
    for (const [x, y] of [[28, 60], [176, 60], [28, 118], [176, 118]]) { g.strokeRect(x, y, 52, 34); }
    g.beginPath(); g.moveTo(92, 0); g.lineTo(92, 160); g.moveTo(164, 0); g.lineTo(164, 160); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#ffd23a'; for (const y of [30, 70, 110, 150]) { g.beginPath(); g.arc(86, y, 5, 0, 7); g.fill(); }
  } else if (kind === 'overalls') {
    g.fillStyle = '#2f6fe0'; g.fillRect(60, 70, 136, 90); g.fillRect(70, 0, 22, 80); g.fillRect(164, 0, 22, 80);
    g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(81, 72, 7, 0, 7); g.arc(175, 72, 7, 0, 7); g.fill();
  } else if (kind === 'pj') { for (let i = 0; i < 14; i++) star(20 + (i * 71) % 230, 18 + ((i * 47) % 130), 11, '#ffffff'); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- dog ----------
export function makeDog({ fur = '#d8994e', dark = '#8f5428', muzzle = '#f4dcb6', scale = 0.85 } = {}) {
  const root = new THREE.Group(); root.name = 'Dog';
  const body = new THREE.Group(); body.scale.setScalar(scale); root.add(body);
  const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 });
  const mF = M(fur), mD = M(dark), mM = M(muzzle), mBlack = M('#1a1420');
  const add = (geo, m, x, y, z, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
  const torso = new THREE.Group(); torso.position.y = 0.55; body.add(torso);
  add(rbox(0.5, 0.42, 0.85, 0.08), mF, 0, 0, 0, torso);
  add(rbox(0.42, 0.2, 0.6, 0.06), mM, 0, -0.14, 0.05, torso);
  const collar = add(rbox(0.46, 0.08, 0.1, 0.03), M('#e8233c'), 0, 0.14, 0.42, torso);
  add(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), M('#ffd23a'), 0, 0.06, 0.48, torso).rotation.x = Math.PI / 2;
  const neck = new THREE.Group(); neck.position.set(0, 0.18, 0.4); torso.add(neck);
  const head = new THREE.Group(); head.position.set(0, 0.2, 0.08); neck.add(head);
  add(rbox(0.52, 0.46, 0.46, 0.09), mF, 0, 0, 0, head);
  add(rbox(0.3, 0.2, 0.22, 0.06), mM, 0, -0.1, 0.28, head);
  add(rbox(0.12, 0.08, 0.06, 0.03), mBlack, 0, -0.03, 0.4, head);
  const tongue = add(rbox(0.1, 0.03, 0.16, 0.012), M('#ff6b8a'), 0, -0.21, 0.32, head);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.4), new THREE.MeshStandardMaterial({ map: drawFace('dog'), transparent: true, depthWrite: false }));
  face.position.set(0, 0.04, 0.233); face.renderOrder = 2; head.add(face);
  const ears = [];
  for (const sx of [1, -1]) { const e = new THREE.Group(); e.position.set(sx * 0.27, 0.16, -0.02); head.add(e); add(rbox(0.08, 0.36, 0.22, 0.03), mD, 0, -0.16, 0, e); ears.push(e); }
  const legs = [];
  for (const [x, z] of [[0.17, 0.3], [-0.17, 0.3], [0.17, -0.3], [-0.17, -0.3]]) {
    const l = new THREE.Group(); l.position.set(x, -0.12, z); torso.add(l);
    add(rbox(0.15, 0.36, 0.15, 0.04), mF, 0, -0.17, 0, l); add(rbox(0.16, 0.08, 0.2, 0.03), mM, 0, -0.36, 0.02, l); legs.push(l);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.12, -0.42); torso.add(tail);
  add(rbox(0.09, 0.09, 0.34, 0.035), mF, 0, 0, -0.15, tail);
  const faces = {};
  return {
    name: 'Dog', group: root, body, head, tongue,
    setFace(e) { faces[e] = faces[e] || drawFace(e); face.material.map = faces[e]; face.material.needsUpdate = true; },
    setPose({ t = 0, wag = 1, walk = 0, headTilt = 0, headPitch = 0, tongueOut = true, crouch = 0, earsBack = 0, sit = 0 } = {}) {
      tail.rotation.set(0.7 - crouch * 1.2, Math.sin(t * 18) * 0.6 * wag, 0);
      head.rotation.set(headPitch, 0, headTilt);
      neck.rotation.x = crouch * 0.35;
      tongue.visible = tongueOut;
      ears.forEach((e, i) => e.rotation.set(-earsBack * 0.9, 0, (i ? -1 : 1) * (0.1 + earsBack * 0.3)));
      torso.position.y = 0.55 - crouch * 0.12 - sit * 0.12; torso.rotation.x = -sit * 0.45 + crouch * 0.12;
      legs.forEach((l, i) => { const ph = walk ? Math.sin(t * 12 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.6 : 0; l.rotation.x = ph + (i > 1 ? sit * 1.2 : 0) - crouch * 0.15; });
    },
  };
}


// ---------- body ----------
const JOINTS = ['hips', 'waist', 'neck', 'shoulderL', 'elbowL', 'wristL', 'shoulderR', 'elbowR', 'wristR',
  'hipL', 'kneeL', 'ankleL', 'hipR', 'kneeR', 'ankleR'];

/**
 * makeCharacter(options)
 *  name, skin, shirt, pants, shoes, hair ('mia'|'theo'|'pell'|'mailman'|'none'), hairColor, hatColor,
 *  face (initial expression), scale (uniform), proportions {leg, arm, torso, width}, silhouette (unlit black)
 */
export function makeCharacter(o = {}) {
  const opt = Object.assign({
    name: 'char', skin: '#f2c79b', shirt: '#e0218a', pants: '#2456c9', shoes: '#1d1d2a', sleeves: null,
    hair: 'none', hairColor: '#4a2a17', hatColor: '#333', face: 'neutral', scale: 1,
    proportions: {}, silhouette: false,
  }, o);
  const P = Object.assign({ leg: 1, arm: 1, torso: 1, width: 1 }, opt.proportions);
  const mats = {};
  const mat = (col, key) => {
    if (mats[key]) return mats[key];
    mats[key] = opt.silhouette
      ? new THREE.MeshBasicMaterial({ color: '#04050a' })
      : new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.0 });
    return mats[key];
  };
  const mSkin = mat(opt.skin, 'skin'), mShirt = mat(opt.shirt, 'shirt'), mPants = mat(opt.pants, 'pants');
  const mShoes = mat(opt.shoes, 'shoes'), mSleeve = mat(opt.sleeves || opt.shirt, 'sleeve');
  // fabric noise + denim for a less flat, more 'clothing' look
  if (!opt.silhouette) {
    mShirt.map = fabricTex(false); mSleeve.map = mShirt.map; mShirt.needsUpdate = true;
    mPants.map = fabricTex(opt.jeans !== false); mPants.needsUpdate = true;
  }
  const longSleeves = opt.longSleeves ?? (opt.print === 'hoodie' || opt.print === 'cardigan' || opt.print === 'mayor' || opt.print === 'pj');
  const mHair = mat(opt.hairColor, 'hair'), mHat = mat(opt.hatColor, 'hat');

  const root = new THREE.Group(); root.name = opt.name;
  const body = new THREE.Group(); root.add(body); body.scale.setScalar(opt.scale);
  const J = {}; const parts = {};
  const pivot = (name, parent, x, y, z = 0) => { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); parent.add(g); J[name] = g; return g; };
  const part = (name, parent, geo, m, x, y, z = 0) => {
    const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.name = name; parent.add(mesh); parts[name] = mesh; return mesh;
  };

  const W = P.width;
  // 'chunky' body (default): wide torso as tall as the legs, thick limbs, big rounded head (jexario-style)
  const CH = opt.body !== 'classic';
  const uL = (CH ? 0.40 : 0.42) * P.leg, lL = (CH ? 0.33 : 0.38) * P.leg, fL = CH ? 0.12 : 0.13;
  const legTotal = uL + lL + fL;
  const ltH = (CH ? 0.2 : 0.22) * P.torso, utH = (CH ? 0.62 : 0.46) * P.torso;
  const aU = (CH ? 0.43 : 0.40) * P.arm, aL = (CH ? 0.33 : 0.34) * P.arm, aH = CH ? 0.14 : 0.15;
  const tw = (CH ? 0.88 : 0.8) * W, armW = (CH ? 0.41 : 0.34) * W, legW = (CH ? 0.43 : 0.38) * W;
  const TD = CH ? 0.46 : 0.42;

  const hips = pivot('hips', body, 0, legTotal);
  part('lowerTorso', hips, rbox(tw * (CH ? 1 : 0.97), ltH + (CH ? 0.03 : 0), TD - (CH ? 0.0 : 0.02), CH ? 0.015 : 0.035), mPants, 0, ltH / 2);
  const waist = pivot('waist', hips, 0, ltH);
  part('upperTorso', waist, rbox(tw, utH, TD, CH ? 0.02 : 0.035), mShirt, 0, utH / 2);
  if (!opt.silhouette && opt.print !== 'overalls') { const hem = new THREE.Mesh(rbox(tw * 1.025, 0.08, TD + 0.02, 0.02), mat(new THREE.Color(opt.shirt).multiplyScalar(0.85).getStyle(), 'hem')); hem.position.set(0, 0.04, 0); waist.add(hem); }
  if (opt.print && !opt.silhouette) {
    const pm = new THREE.MeshStandardMaterial({ map: shirtPrint(opt.print, opt.shirt), transparent: true, roughness: 0.6, depthWrite: false });
    const pp = new THREE.Mesh(new THREE.PlaneGeometry(tw * 0.92, utH * 0.92), pm); pp.position.set(0, utH / 2, TD / 2 + 0.002); pp.renderOrder = 2; waist.add(pp);
  }
  const neck = pivot('neck', waist, 0, utH);
  const headH = CH ? 0.6 : 0.5, headW = CH ? 0.66 : 0.56, headD = CH ? 0.58 : 0.5;
  const head = part('head', neck, rbox(headW, headH, headD, CH ? 0.06 : 0.07), mSkin, 0, headH / 2 + 0.015);
  // face decal
  const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(headW * 0.9, headH * 0.9),
    opt.silhouette ? new THREE.MeshBasicMaterial({ map: drawFace('glow'), transparent: true, depthWrite: false })
      : new THREE.MeshStandardMaterial({ map: drawFace(opt.face, opt.faceOpts || {}), transparent: true, depthWrite: false, roughness: 0.6 }));
  faceMesh.position.set(0, 0, headD / 2 + 0.003); faceMesh.renderOrder = 2;
  head.add(faceMesh);
  const faceCache = {};

  // arms
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? 1 : -1;
    const sh = pivot('shoulder' + s, waist, sx * (tw / 2 + armW / 2 + (CH ? 0.0 : 0.01)), utH - 0.05);
    part('upperArm' + s, sh, rbox(armW, aU + 0.05, armW, CH ? 0.015 : 0.035), mSleeve, 0, -aU / 2 + 0.04);
    const el = pivot('elbow' + s, sh, 0, -aU + 0.02);
    part('lowerArm' + s, el, rbox(armW * (CH ? 1 : 0.96), aL + (CH ? 0.08 : 0), armW * (CH ? 1 : 0.96), CH ? 0.015 : 0.035), longSleeves ? mSleeve : mSkin, 0, -aL / 2);
    if (longSleeves && !opt.silhouette) { const cuff = new THREE.Mesh(rbox(armW * 1.04, 0.07, armW * 1.04, 0.02), mat(new THREE.Color(opt.sleeves || opt.shirt).multiplyScalar(0.82).getStyle(), 'cuff')); cuff.position.set(0, -aL + 0.04, 0); el.add(cuff); }
    const wr = pivot('wrist' + s, el, 0, -aL);
    part('hand' + s, wr, rbox(armW * (CH ? 1 : 0.98), aH + (CH ? 0.03 : 0), armW * (CH ? 1 : 0.98), CH ? 0.015 : 0.035), mSkin, 0, -aH / 2 + (CH ? 0.02 : 0.01));
  }
  // legs
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? 1 : -1;
    const hp = pivot('hip' + s, hips, sx * (tw / 2 - legW / 2 - (CH ? 0.0 : 0.005)), 0.02);
    part('upperLeg' + s, hp, rbox(legW, uL + 0.06, TD - 0.02, CH ? 0.015 : 0.035), mPants, 0, -uL / 2 + 0.02);
    if (CH && !opt.silhouette && opt.jeans !== false) { const pk = new THREE.Mesh(new THREE.PlaneGeometry(legW * 0.8, uL * 0.6), pocketMat()); pk.position.set(0, -uL * 0.3, (TD - 0.02) / 2 + 0.002); pk.renderOrder = 2; hp.add(pk); }
    const kn = pivot('knee' + s, hp, 0, -uL);
    part('lowerLeg' + s, kn, rbox(legW * (CH ? 1 : 0.97), lL + (CH ? 0.08 : 0), TD - (CH ? 0.02 : 0.06), CH ? 0.015 : 0.035), mPants, 0, -lL / 2);
    const an = pivot('ankle' + s, kn, 0, -lL);
    part('foot' + s, an, rbox(legW * (CH ? 1.02 : 1), fL, CH ? 0.5 : 0.46, CH ? 0.02 : 0.035), mShoes, 0, -fL / 2 + 0.02, 0.05);
    if (CH && !opt.silhouette) { const sole = new THREE.Mesh(rbox(legW * 1.07, 0.06, 0.55, 0.025), mat('#f5f5f5', 'sole')); sole.position.set(0, -fL + 0.03, 0.05); sole.castShadow = true; an.add(sole); }
  }

  // hair / hats (blocks)
  const hb = (w, h, d, x, y, z, m = mHair, r = 0.03) => {
    const mesh = new THREE.Mesh(rbox(w, h, d, r), m); mesh.position.set(x, y, z); mesh.castShadow = true; head.add(mesh); return mesh;
  };
  const top = headH / 2;
  switch (opt.hair) {
    case 'mia':
      hb(headW + 0.06, 0.14, headD + 0.06, 0, top + 0.03, -0.0);
      hb(headW + 0.06, 0.62, 0.14, 0, top - 0.32, -headD / 2 - 0.04); // long back
      hb(0.1, 0.5, headD * 0.8, headW / 2 + 0.03, top - 0.22, -0.06);
      hb(0.1, 0.5, headD * 0.8, -headW / 2 - 0.03, top - 0.22, -0.06);
      hb(headW * 0.62, 0.12, 0.08, -0.08, top - 0.06, headD / 2 + 0.02); // side fringe
      hb(0.14, 0.14, 0.14, headW / 2 - 0.02, top + 0.02, -headD / 2 + 0.02, mat('#ff4fb0', 'clip')); // hair clip
      break;
    case 'theo':
      hb(headW + 0.05, 0.13, headD + 0.05, 0, top + 0.02, 0);
      hb(headW + 0.05, 0.12, 0.08, 0, top - 0.05, headD / 2 + 0.01);
      hb(0.3, 0.1, 0.22, -0.08, top + 0.1, 0.1, mHair);
      hb(0.16, 0.12, 0.12, 0.17, top + 0.04, headD / 2 - 0.02, mHair);
      hb(headW + 0.05, 0.28, 0.08, 0, top - 0.12, -headD / 2 - 0.01);
      break;
    case 'pell':
      hb(0.08, 0.2, headD * 0.8, headW / 2 + 0.02, top - 0.14, -0.05);
      hb(0.08, 0.2, headD * 0.8, -headW / 2 - 0.02, top - 0.14, -0.05);
      hb(headW + 0.04, 0.24, 0.07, 0, top - 0.14, -headD / 2 - 0.01);
      hb(headW + 0.08, 0.13, headD + 0.08, 0, top + 0.05, 0, mHat);            // flat cap
      hb(headW + 0.04, 0.05, 0.2, 0, top + 0.01, headD / 2 + 0.08, mHat);      // brim
      break;
    case 'ivy':
      hb(headW + 0.06, 0.14, headD + 0.06, 0, top + 0.03, 0);
      hb(headW + 0.06, 0.3, 0.12, 0, top - 0.12, -headD / 2 - 0.03);
      hb(0.1, 0.36, headD * 0.8, headW / 2 + 0.03, top - 0.15, -0.04); hb(0.1, 0.36, headD * 0.8, -headW / 2 - 0.03, top - 0.15, -0.04);
      hb(headW * 0.8, 0.11, 0.08, 0.04, top - 0.05, headD / 2 + 0.02);
      { const tail = hb(0.2, 0.5, 0.2, 0, top - 0.25, -headD / 2 - 0.16, mHair, 0.08); tail.rotation.x = 0.35; }
      hb(0.12, 0.12, 0.14, 0, top - 0.02, -headD / 2 - 0.08, mat('#ffd23a', 'tie'));
      break;
    case 'bo':
      hb(headW + 0.05, 0.12, headD + 0.05, 0, top + 0.02, 0);
      hb(0.18, 0.14, 0.18, -0.1, top + 0.12, 0.05); hb(0.16, 0.12, 0.16, 0.12, top + 0.1, -0.08);
      hb(headW + 0.05, 0.12, 0.08, 0, top - 0.04, headD / 2 + 0.01);
      break;
    case 'gus':
      hb(0.1, 0.24, headD * 0.85, headW / 2 + 0.03, top - 0.16, -0.03); hb(0.1, 0.24, headD * 0.85, -headW / 2 - 0.03, top - 0.16, -0.03);
      hb(headW + 0.04, 0.26, 0.08, 0, top - 0.15, -headD / 2 - 0.02);
      hb(0.16, 0.1, 0.12, -0.12, top + 0.02, 0.02); hb(0.12, 0.08, 0.1, 0.1, top + 0.01, -0.06);
      break;
    case 'toupee':
      hb(0.08, 0.2, headD * 0.8, headW / 2 + 0.02, top - 0.16, -0.04); hb(0.08, 0.2, headD * 0.8, -headW / 2 - 0.02, top - 0.16, -0.04);
      { const tp = new THREE.Group(); tp.position.set(0, top + 0.05, 0); head.add(tp);
        const a = new THREE.Mesh(rbox(headW + 0.06, 0.14, headD + 0.04, 0.05), mHair); a.castShadow = true; tp.add(a);
        const b = new THREE.Mesh(rbox(0.3, 0.12, 0.2, 0.05), mHair); b.position.set(0.12, 0.08, 0.12); b.rotation.z = -0.3; tp.add(b);
        parts.toupee = tp; }
      break;
    case 'crowd1': hb(headW + 0.05, 0.13, headD + 0.05, 0, top + 0.03, 0); hb(headW + 0.05, 0.2, 0.08, 0, top - 0.08, -headD / 2 - 0.01); break;
    case 'crowd2': hb(headW + 0.06, 0.14, headD + 0.06, 0, top + 0.03, 0); hb(headW + 0.06, 0.5, 0.12, 0, top - 0.26, -headD / 2 - 0.04); hb(0.1, 0.42, headD * 0.8, headW / 2 + 0.03, top - 0.18, -0.06); hb(0.1, 0.42, headD * 0.8, -headW / 2 - 0.03, top - 0.18, -0.06); break;
    case 'cap': hb(headW + 0.06, 0.14, headD + 0.06, 0, top + 0.04, 0, mHat); hb(headW * 0.9, 0.04, 0.24, 0, top - 0.0, headD / 2 + 0.1, mHat); break;
    case 'clumps': case 'spiky': {
      const hm = new THREE.MeshStandardMaterial({ color: opt.hairColor, roughness: 0.32, metalness: 0.05 });
      let sd = 0; for (const ch of opt.name) sd += ch.charCodeAt(0); const rr = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
      hb(headW + 0.04, 0.12, headD + 0.04, 0, top + 0.02, 0, hm, 0.05);
      hb(headW + 0.05, 0.3, 0.1, 0, top - 0.12, -headD / 2 - 0.02, hm, 0.05);
      for (const sx of [1, -1]) hb(0.08, 0.2, headD * 0.85, sx * (headW / 2 + 0.025), top - 0.09, -0.03, hm, 0.03);
      if (opt.hair === 'clumps') {
        const spots = [[-0.17, 0.12], [0, 0.15], [0.17, 0.12], [-0.12, -0.02], [0.12, -0.02], [0, -0.14], [-0.2, -0.15], [0.2, -0.15]];
        spots.forEach(([x, z], i) => { const c = hb(0.24 + rr() * 0.06, 0.17, 0.22 + rr() * 0.05, x, top + 0.11 + rr() * 0.04, z, hm, 0.075); c.rotation.set((rr() - 0.5) * 0.5 + (z > 0.1 ? 0.35 : 0), (rr() - 0.5) * 0.8, (rr() - 0.5) * 0.5); });
        for (const x of [-0.17, 0.02, 0.19]) { const f = hb(0.2, 0.17, 0.12, x, top - 0.03, headD / 2 + 0.02, hm, 0.06); f.rotation.set(0.5, (rr() - 0.5) * 0.4, (rr() - 0.5) * 0.4); }
      } else {
        const cone = new THREE.ConeGeometry(0.075, 0.22, 6);
        for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; const r0 = i < 6 ? 0.12 : 0.22; const sp = new THREE.Mesh(cone, hm); sp.castShadow = true;
          sp.position.set(Math.cos(a) * r0 * 0.9, top + 0.15, Math.sin(a) * r0 * 0.8 - 0.02); sp.rotation.set(-Math.sin(a) * 0.5 - 0.25, 0, Math.cos(a) * 0.5); head.add(sp); }
        for (const x of [-0.18, -0.06, 0.06, 0.18]) { const sp = new THREE.Mesh(cone, hm); sp.position.set(x, top + 0.02, headD / 2 + 0.05); sp.rotation.set(1.9, 0, (rr() - 0.5) * 0.4); sp.scale.set(1, 0.8, 1); head.add(sp); }
      }
      break; }
    case 'mailman':
      hb(headW + 0.06, 0.2, headD + 0.06, 0, top + 0.08, 0, mHat);
      hb(headW + 0.08, 0.04, 0.24, 0, top - 0.01, headD / 2 + 0.1, mHat);
      break;
  }

  function resetPose() { for (const n of JOINTS) J[n].rotation.set(0, 0, 0); J.hips.position.y = legTotal; }
  function setPose(p = {}) {
    resetPose();
    for (const [k, v] of Object.entries(p)) {
      if (k === 'hipsY') { J.hips.position.y = legTotal + v; continue; }
      if (J[k]) J[k].rotation.set(v[0] || 0, v[1] || 0, v[2] || 0);
    }
  }
  function setFace(expr) {
    if (opt.silhouette) return;
    if (!faceCache[expr]) faceCache[expr] = drawFace(expr, opt.faceOpts || {});
    faceMesh.material.map = faceCache[expr]; faceMesh.material.needsUpdate = true;
  }
  function attach(obj, joint = 'wristR', offset = [0, -0.16, 0]) {
    J[joint].add(obj); obj.position.set(...offset); return obj;
  }

  // 2-bone IK: put the hand of `side` ('L'|'R') at a world-space point.
  const _v = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);
  function reach(side, target) {
    root.updateMatrixWorld(true);
    const sh = J['shoulder' + side];
    const d = sh.parent.worldToLocal(_v.copy(target)).sub(sh.position);
    const L1 = aU - 0.02, L2 = aL + 0.09;
    const D = Math.max(0.05, Math.min(d.length(), L1 + L2 - 0.002));
    const clamp = x => Math.max(-1, Math.min(1, x));
    const A = Math.acos(clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D)));
    const E = Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2)));
    sh.quaternion.setFromUnitVectors(_down, d.normalize());
    sh.rotateX(A);
    J['elbow' + side].rotation.set(-E, 0, 0);
    J['wrist' + side].rotation.set(0, 0, 0);
  }

  return {
    reach,
    name: opt.name, group: root, body, joints: J, parts, setPose, setFace, attach, legTotal,
    height: (legTotal + ltH + utH + headH) * opt.scale, scale: opt.scale, faceMesh,
  };
}

// ---------- pose library (all angles in radians) ----------
const S = Math.sin;
export const Poses = {
  idle(t = 0) {
    const b = S(t * 2.2) * 0.02;
    return { waist: [b, 0, 0], neck: [-b, 0, 0], shoulderL: [0, 0, 0.06], shoulderR: [0, 0, -0.06], elbowL: [-0.08, 0, 0], elbowR: [-0.08, 0, 0] };
  },
  walk(phase, amp = 0.6) {
    const a = S(phase) * amp;
    return {
      hipL: [-a, 0, 0], hipR: [a, 0, 0], kneeL: [Math.max(0, S(phase + 1.6)) * amp * 1.2, 0, 0], kneeR: [Math.max(0, S(phase + 1.6 + Math.PI)) * amp * 1.2, 0, 0],
      shoulderL: [a * 0.8, 0, 0.05], shoulderR: [-a * 0.8, 0, -0.05], elbowL: [-0.25, 0, 0], elbowR: [-0.25, 0, 0],
      hipsY: -Math.abs(S(phase)) * 0.03, waist: [0.04, 0, 0],
    };
  },
  run(phase) {
    const a = S(phase) * 0.95;
    return {
      hipL: [-a, 0, 0], hipR: [a, 0, 0], kneeL: [0.3 + Math.max(0, S(phase + 1.8)) * 1.2, 0, 0], kneeR: [0.3 + Math.max(0, S(phase + 1.8 + Math.PI)) * 1.2, 0, 0],
      shoulderL: [a * 1.0, 0, 0.08], shoulderR: [-a * 1.0, 0, -0.08], elbowL: [-1.2, 0, 0], elbowR: [-1.2, 0, 0],
      hipsY: -0.05 + Math.abs(S(phase)) * 0.06, waist: [0.22, 0, 0], neck: [-0.15, 0, 0],
    };
  },
  carry(t = 0) { // holding a box in front
    return { ...Poses.idle(t), shoulderL: [-0.9, 0, -0.12], shoulderR: [-0.9, 0, 0.12], elbowL: [-0.75, 0, 0], elbowR: [-0.75, 0, 0] };
  },
  sit() {
    return { hipL: [-1.5, 0, 0.05], hipR: [-1.5, 0, -0.05], kneeL: [1.5, 0, 0], kneeR: [1.5, 0, 0], hipsY: -0.0 };
  },
};
