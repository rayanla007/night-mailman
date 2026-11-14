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
  const eye = (x, y, k = 1, p = 1, white = false) => {
    if (white) ell(x, y, 0.085 * S * k, 0.1 * S * k, '#ffffff'), stroke(0.014), g.stroke();
    ell(x, y, 0.055 * S * k * p, 0.068 * S * k * p, ink);
    ell(x - 0.018 * S * k, y - 0.024 * S * k, 0.019 * S * k, 0.022 * S * k, '#ffffff');
    ell(x + 0.016 * S * k * p, y + 0.02 * S * k * p, 0.008 * S * k, 0.008 * S * k, 'rgba(255,255,255,0.8)');
  };
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
    case 'smile': eye(L, EY); eye(R, EY); quad(0.38 * S, 0.64 * S, 0.5 * S, 0.74 * S, 0.62 * S, 0.64 * S, 0.03); blush(0.4); break;
    case 'laugh': happyEye(L, EY); happyEye(R, EY); openMouth(0.5 * S, 0.62 * S, 0.11 * S, 0.07 * S); blush(0.6); break;
    case 'smirk': eye(L, EY); eye(R, EY); brows(-0.3); quad(0.42 * S, 0.68 * S, 0.54 * S, 0.71 * S, 0.63 * S, 0.62 * S, 0.03); break;
    case 'unimpressed': path([[L - 0.06 * S, EY - 0.02 * S], [L + 0.06 * S, EY - 0.02 * S]], 0.02); path([[R - 0.06 * S, EY - 0.02 * S], [R + 0.06 * S, EY - 0.02 * S]], 0.02);
      ell(L, EY + 0.012 * S, 0.05 * S, 0.035 * S, ink); ell(R, EY + 0.012 * S, 0.05 * S, 0.035 * S, ink); path([[0.42 * S, 0.68 * S], [0.58 * S, 0.68 * S]], 0.026); break;
    case 'worried': eye(L, EY + 4); eye(R, EY + 4); brows(-1); quad(0.4 * S, 0.7 * S, 0.5 * S, 0.64 * S, 0.6 * S, 0.7 * S, 0.026); sweat(); break;
    case 'scared': eye(L, EY, 1.05, 0.55, true); eye(R, EY, 1.05, 0.55, true); brows(-1.2, EY - 0.17 * S); ell(0.5 * S, 0.71 * S, 0.055 * S, 0.07 * S, '#5a1020'); sweat(); break;
    case 'crying': eye(L, EY, 1.1); eye(R, EY, 1.1); brows(-1); tears(); quad(0.4 * S, 0.74 * S, 0.5 * S, 0.66 * S, 0.6 * S, 0.74 * S, 0.026); break;
    case 'serious': eye(L, EY + 3, 0.9); eye(R, EY + 3, 0.9); brows(1.2, EY - 0.1 * S, 0.034); path([[0.41 * S, 0.69 * S], [0.59 * S, 0.69 * S]], 0.028); break;
    case 'shout': eye(L, EY, 0.9); eye(R, EY, 0.9); brows(1.2, EY - 0.1 * S, 0.034); openMouth(0.5 * S, 0.63 * S, 0.09 * S, 0.08 * S, false); break;
    case 'creepy': eye(L, EY - 2, 1.15, 0.4, true); eye(R, EY - 2, 1.15, 0.4, true);
      quad(0.14 * S, 0.57 * S, 0.5 * S, 0.9 * S, 0.86 * S, 0.57 * S, 0.024);
      path([[0.12 * S, 0.54 * S], [0.16 * S, 0.6 * S]], 0.02); path([[0.88 * S, 0.54 * S], [0.84 * S, 0.6 * S]], 0.02); break;
    case 'glow': ell(L + 4, EY, 0.03 * S, 0.03 * S, '#d6e6ff'); ell(R - 4, EY, 0.03 * S, 0.03 * S, '#d6e6ff'); break;
    case 'dog': eye(0.3 * S, 0.4 * S, 1.15); eye(0.7 * S, 0.4 * S, 1.15); break;
    case 'dogScared': eye(0.3 * S, 0.4 * S, 1.2, 0.5, true); eye(0.7 * S, 0.4 * S, 1.2, 0.5, true); brows(-1.2, 0.24 * S); break;
    case 'dogAngry': eye(0.3 * S, 0.42 * S, 1.0); eye(0.7 * S, 0.42 * S, 1.0); path([[0.18 * S, 0.24 * S], [0.4 * S, 0.33 * S]], 0.04); path([[0.82 * S, 0.24 * S], [0.6 * S, 0.33 * S]], 0.04); break;
    case 'none': break;
    default: eye(L, EY); eye(R, EY); quad(0.43 * S, 0.68 * S, 0.5 * S, 0.7 * S, 0.57 * S, 0.68 * S, 0.026); blush(0.25);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export { drawFace };

// Shirt decals: 'hoodie' | 'star' | 'cardigan' | 'pj' | 'heart'
function shirtPrint(kind, base) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d');
  const star = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); };
  if (kind === 'hoodie') {
    g.fillStyle = 'rgba(0,0,0,0.13)'; g.beginPath(); g.moveTo(70, 160); g.lineTo(85, 105); g.lineTo(171, 105); g.lineTo(186, 160); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(108, 6); g.lineTo(104, 62); g.moveTo(148, 6); g.lineTo(152, 62); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(104, 66, 7, 0, 7); g.arc(152, 66, 7, 0, 7); g.fill();
  } else if (kind === 'star') { star(128, 78, 46, '#ff3b4e'); }
  else if (kind === 'heart') { g.fillStyle = '#ff4f8b'; g.beginPath(); g.moveTo(128, 120); g.bezierCurveTo(60, 70, 95, 25, 128, 55); g.bezierCurveTo(161, 25, 196, 70, 128, 120); g.fill(); }
  else if (kind === 'cardigan') {
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(122, 0, 12, 160);
    g.fillStyle = '#f2e9d8'; for (const y of [30, 70, 110, 148]) { g.beginPath(); g.arc(142, y, 7, 0, 7); g.fill(); }
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(90, 0); g.lineTo(128, 50); g.lineTo(166, 0); g.fill();
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
  const uL = 0.42 * P.leg, lL = 0.38 * P.leg, fL = 0.13;
  const legTotal = uL + lL + fL;
  const ltH = 0.22 * P.torso, utH = 0.46 * P.torso;
  const aU = 0.40 * P.arm, aL = 0.34 * P.arm, aH = 0.15;
  const tw = 0.8 * W, armW = 0.34 * W, legW = 0.38 * W;

  const hips = pivot('hips', body, 0, legTotal);
  part('lowerTorso', hips, rbox(tw * 0.96, ltH, 0.4), mPants, 0, ltH / 2);
  const waist = pivot('waist', hips, 0, ltH);
  part('upperTorso', waist, rbox(tw, utH, 0.42), mShirt, 0, utH / 2);
  if (opt.print && !opt.silhouette) {
    const pm = new THREE.MeshStandardMaterial({ map: shirtPrint(opt.print, opt.shirt), transparent: true, roughness: 0.6, depthWrite: false });
    const pp = new THREE.Mesh(new THREE.PlaneGeometry(tw * 0.92, utH * 0.92), pm); pp.position.set(0, utH / 2, 0.212); pp.renderOrder = 2; waist.add(pp);
  }
  const neck = pivot('neck', waist, 0, utH);
  const headH = 0.5, headW = 0.56, headD = 0.5;
  const head = part('head', neck, rbox(headW, headH, headD, 0.07), mSkin, 0, headH / 2 + 0.02);
  // face decal
  const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(headW * 0.9, headH * 0.9),
    opt.silhouette ? new THREE.MeshBasicMaterial({ map: drawFace('glow'), transparent: true, depthWrite: false })
      : new THREE.MeshStandardMaterial({ map: drawFace(opt.face), transparent: true, depthWrite: false, roughness: 0.6 }));
  faceMesh.position.set(0, 0, headD / 2 + 0.003); faceMesh.renderOrder = 2;
  head.add(faceMesh);
  const faceCache = {};

  // arms
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? 1 : -1;
    const sh = pivot('shoulder' + s, waist, sx * (tw / 2 + armW / 2 + 0.01), utH - 0.05);
    part('upperArm' + s, sh, rbox(armW, aU, armW), mSleeve, 0, -aU / 2 + 0.03);
    const el = pivot('elbow' + s, sh, 0, -aU + 0.02);
    part('lowerArm' + s, el, rbox(armW * 0.96, aL, armW * 0.96), mSkin, 0, -aL / 2);
    const wr = pivot('wrist' + s, el, 0, -aL);
    part('hand' + s, wr, rbox(armW * 0.98, aH, armW * 0.98), mSkin, 0, -aH / 2 + 0.01);
  }
  // legs
  for (const s of ['L', 'R']) {
    const sx = s === 'L' ? 1 : -1;
    const hp = pivot('hip' + s, hips, sx * (tw / 2 - legW / 2 - 0.005), 0.02);
    part('upperLeg' + s, hp, rbox(legW, uL, 0.38), mPants, 0, -uL / 2);
    const kn = pivot('knee' + s, hp, 0, -uL);
    part('lowerLeg' + s, kn, rbox(legW * 0.97, lL, 0.36), mPants, 0, -lL / 2);
    const an = pivot('ankle' + s, kn, 0, -lL);
    part('foot' + s, an, rbox(legW, fL, 0.46), mShoes, 0, -fL / 2 + 0.02, 0.05);
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
    if (!faceCache[expr]) faceCache[expr] = drawFace(expr);
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
