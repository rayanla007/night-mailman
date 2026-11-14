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
function drawFace(expr, opts = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = FACE_SIZE;
  const g = c.getContext('2d');
  const S = FACE_SIZE;
  const ink = opts.ink || '#111';
  g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
  const ex = 0.3 * S, ey = 0.42 * S, er = (opts.eyeR || 0.065) * S;
  const eye = (x, y, r = er) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const line = (pts, w = 0.045 * S) => { g.lineWidth = w; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };
  const curve = (x0, y0, cx, cy, x1, y1, w = 0.045 * S) => { g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); };
  const L = S / 2 - ex * 0.55, R = S / 2 + ex * 0.55;
  switch (expr) {
    case 'sleep':
      line([[L - er, ey], [L + er, ey]], 0.035 * S); line([[R - er, ey], [R + er, ey]], 0.035 * S);
      curve(0.42 * S, 0.68 * S, 0.5 * S, 0.72 * S, 0.58 * S, 0.68 * S, 0.03 * S);
      break;
    case 'smile':
      eye(L, ey); eye(R, ey);
      curve(0.36 * S, 0.64 * S, 0.5 * S, 0.76 * S, 0.64 * S, 0.64 * S);
      break;
    case 'creepy': // too-wide, thin, fixed smile with small pupils
      eye(L, ey - 2, er * 0.55); eye(R, ey - 2, er * 0.55);
      curve(0.14 * S, 0.56 * S, 0.5 * S, 0.9 * S, 0.86 * S, 0.56 * S, 0.026 * S);
      line([[0.12 * S, 0.53 * S], [0.16 * S, 0.59 * S]], 0.022 * S); line([[0.88 * S, 0.53 * S], [0.84 * S, 0.59 * S]], 0.022 * S);
      break;
    case 'worried':
      eye(L, ey + 4, er); eye(R, ey + 4, er);
      line([[L - er * 1.4, ey - er * 1.9], [L + er * 1.2, ey - er * 2.6]], 0.03 * S);
      line([[R + er * 1.4, ey - er * 1.9], [R - er * 1.2, ey - er * 2.6]], 0.03 * S);
      curve(0.4 * S, 0.7 * S, 0.5 * S, 0.64 * S, 0.6 * S, 0.7 * S);
      break;
    case 'scared':
      eye(L, ey, er * 1.1); eye(R, ey, er * 1.1);
      line([[L - er * 1.4, ey - er * 2.0], [L + er * 1.2, ey - er * 2.7]], 0.03 * S);
      line([[R + er * 1.4, ey - er * 2.0], [R - er * 1.2, ey - er * 2.7]], 0.03 * S);
      g.beginPath(); g.ellipse(0.5 * S, 0.7 * S, 0.06 * S, 0.08 * S, 0, 0, Math.PI * 2); g.fill();
      break;
    case 'serious':
      eye(L, ey + 3); eye(R, ey + 3);
      line([[L - er * 1.5, ey - er * 2.4], [L + er * 1.3, ey - er * 1.7]], 0.04 * S);
      line([[R + er * 1.5, ey - er * 2.4], [R - er * 1.3, ey - er * 1.7]], 0.04 * S);
      line([[0.4 * S, 0.69 * S], [0.6 * S, 0.69 * S]]);
      break;
    case 'smirk':
      eye(L, ey); eye(R, ey);
      curve(0.4 * S, 0.68 * S, 0.53 * S, 0.72 * S, 0.63 * S, 0.63 * S);
      break;
    case 'glow': // the Night Mailman: two pale dots, no mouth
      g.fillStyle = '#cfe0ff'; eye(L + 4, ey, er * 0.55); eye(R - 4, ey, er * 0.55);
      break;
    case 'none': break;
    default: // neutral
      eye(L, ey); eye(R, ey);
      line([[0.41 * S, 0.68 * S], [0.59 * S, 0.68 * S]]);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
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
