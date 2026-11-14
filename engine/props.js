// Props: lamp, clock, envelope, letter, door, sign, sack, lantern, curtains, houses, trees...
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const GOLD = new THREE.Color('#ffb83d');      // lamp light — the ONLY gold in night scenes
export const GOLD_GLASS = new THREE.Color('#ffc75a');
export const GLASS_LIT = new THREE.MeshBasicMaterial({ color: GOLD_GLASS });
export const CURTAIN_LIT = new THREE.MeshBasicMaterial({ color: '#b8641e' });
export const GLASS_DARK = new THREE.MeshStandardMaterial({ color: '#2b4f8f', roughness: 0.1, metalness: 0.5, emissive: '#16305e', emissiveIntensity: 0.25 });

const matCache = new Map();
export function std(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.6, metalness: 0 }, o)));
  return matCache.get(k);
}
export function basic(color, o = {}) {
  const k = 'b' + color + JSON.stringify(o);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshBasicMaterial(Object.assign({ color }, o)));
  return matCache.get(k);
}
const gCache = new Map();
export function rb(w, h, d, r = 0.04) {
  const k = [w, h, d, r].join(',');
  if (!gCache.has(k)) gCache.set(k, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.1, h / 2.1, d / 2.1)));
  return gCache.get(k);
}
export function box(w, h, d) {
  const k = 'B' + [w, h, d].join(',');
  if (!gCache.has(k)) gCache.set(k, new THREE.BoxGeometry(w, h, d));
  return gCache.get(k);
}
export function mesh(geo, mat, x = 0, y = 0, z = 0, parent, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = receive;
  if (parent) parent.add(m);
  return m;
}

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.userData.canvas = c;
  return t;
}

// ---------------- lamp ----------------
export function makeLamp({ shadow = true } = {}) {
  const g = new THREE.Group(); g.name = 'lamp';
  mesh(rb(0.3, 0.06, 0.3, 0.02), std('#1b3a8f'), 0, 0.03, 0, g);
  mesh(rb(0.16, 0.26, 0.16, 0.05), std('#2a5bd7', { roughness: 0.3 }), 0, 0.19, 0, g);
  // switch on the base (front, +z)
  const sw = mesh(rb(0.09, 0.05, 0.05, 0.012), std('#e8ecf5'), 0, 0.055, 0.15, g);
  const nub = mesh(rb(0.03, 0.03, 0.04, 0.01), std('#d22'), 0, 0.085, 0.155, g);
  mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), std('#ccd'), 0, 0.37, 0, g);
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#f4ead2', roughness: 0.8, emissive: new THREE.Color('#ffb83d'), emissiveIntensity: 1, side: THREE.DoubleSide });
  const shade = mesh(new THREE.CylinderGeometry(0.13, 0.22, 0.24, 4, 1, true), shadeMat, 0, 0.47, 0, g, { cast: false });
  shade.rotation.y = Math.PI / 4;
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#fff3c4' });
  const bulb = mesh(new THREE.SphereGeometry(0.06, 12, 8), bulbMat, 0, 0.42, 0, g, { cast: false });
  const light = new THREE.PointLight(GOLD, 6, 0, 1.6);
  light.position.set(0, 0.45, 0.0);
  light.castShadow = shadow; light.shadow.mapSize.set(512, 512); light.shadow.bias = -0.004; light.shadow.radius = 4;
  light.shadow.camera.near = 0.1;
  g.add(light);
  const fill = new THREE.PointLight(GOLD, 0, 9, 1.0); fill.position.set(0, 1.4, 0.6); g.add(fill);
  const api = {
    group: g, light, shade, bulb, nub, switchMesh: sw, level: 1, power: 1,
    setOn(level) {
      level = Math.max(0, level); api.level = level;
      light.intensity = 1.5 * level * api.power; light.visible = level > 0.001;
      fill.intensity = 1.3 * level * api.power;
      shadeMat.emissiveIntensity = 0.55 * Math.min(level, 1.3);
      shadeMat.color.set(level > 0.01 ? '#f4ead2' : '#7d8db8');
      bulbMat.color.set(level > 0.01 ? '#fff3c4' : '#556080');
      nub.position.z = level > 0.01 ? 0.155 : 0.135;
    },
  };
  api.setOn(1);
  return api;
}

// ---------------- clock ----------------
export function makeClock() {
  const g = new THREE.Group(); g.name = 'clock';
  mesh(rb(0.42, 0.22, 0.16, 0.05), std('#151a33', { roughness: 0.35 }), 0, 0.11, 0, g);
  const tex = canvasTex(512, 256, () => {});
  const scr = new THREE.MeshBasicMaterial({ map: tex });
  const screen = mesh(new THREE.PlaneGeometry(0.36, 0.17), scr, 0, 0.115, 0.081, g, { cast: false });
  const glow = new THREE.PointLight('#ff2a2a', 0.12, 0.9, 1.5); glow.position.set(0, 0.12, 0.3); g.add(glow);
  const api = {
    group: g, screen, glow,
    setTime(str, ampm = 'PM', colon = true) {
      const c = tex.userData.canvas, x = c.getContext('2d');
      x.fillStyle = '#120306'; x.fillRect(0, 0, 512, 256);
      x.font = 'bold 168px "DejaVu Sans Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const s = colon ? str : str.replace(':', ' ');
      x.shadowColor = '#ff2020'; x.shadowBlur = 26; x.fillStyle = '#ff2f2f'; x.fillText(s, 236, 136);
      x.font = 'bold 54px "DejaVu Sans Mono", monospace'; x.fillText(ampm, 455, 196);
      tex.needsUpdate = true;
    },
  };
  api.setTime('11:59');
  return api;
}

// ---------------- envelope & letter ----------------
export function makeEnvelope(name = 'THEO') {
  const g = new THREE.Group(); g.name = 'envelope';
  const tex = canvasTex(512, 340, (x, w, h) => {
    x.fillStyle = '#eef1f8'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#c9cfdf'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
    x.fillStyle = '#16131c'; x.font = '120px "Special Elite"'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.save(); x.translate(w / 2, h / 2 + 10); x.rotate(-0.06); x.fillText(name, 0, 0); x.restore();
    // no stamp: just a dashed empty box where it should be
    x.setLineDash([8, 8]); x.strokeStyle = '#9aa3bb'; x.lineWidth = 4; x.strokeRect(w - 92, 26, 64, 76); x.setLineDash([]);
  });
  const paper = std('#eef1f8', { roughness: 0.9 });
  mesh(box(0.42, 0.012, 0.28), paper, 0, 0.006, 0, g);
  const top = mesh(new THREE.PlaneGeometry(0.42, 0.28), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), 0, 0.0125, 0, g, { cast: false });
  top.rotation.x = -Math.PI / 2;
  const seal = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 16), std('#9e0f1f', { roughness: 0.4 }), 0.15, 0.015, 0.09, g);
  return { group: g, seal };
}

export function makeLetter() {
  const g = new THREE.Group(); g.name = 'letter';
  const tex = canvasTex(640, 860, (x, w, h) => {
    x.fillStyle = '#f1f3f9'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#c7cee0'; x.lineWidth = 2;
    for (let y = 150; y < h - 40; y += 70) { x.beginPath(); x.moveTo(40, y); x.lineTo(w - 40, y); x.stroke(); }
    x.fillStyle = '#121019'; x.font = '62px "Special Elite"'; x.textAlign = 'left';
    x.fillText('Your light', 60, 270); x.fillText('is off.', 60, 340);
    x.fillText('Come out and', 60, 480); x.fillText('see ours.', 60, 550);
    x.font = '44px "Special Elite"'; x.fillText('— the Mailman', 230, 720);
  });
  const p = mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide }), 0, 0, 0, g, { cast: true });
  return { group: g, paper: p };
}

// ---------------- door ----------------
export function makeDoor({ w = 1, h = 2.2, color = '#2f6bff', frame = '#e8ecf6', knobSide = 1 } = {}) {
  const g = new THREE.Group(); g.name = 'door';
  const fm = std(frame);
  mesh(box(0.1, h + 0.1, 0.26), fm, -w / 2 - 0.05, h / 2 + 0.05, 0, g);
  mesh(box(0.1, h + 0.1, 0.26), fm, w / 2 + 0.05, h / 2 + 0.05, 0, g);
  mesh(box(w + 0.2, 0.1, 0.26), fm, 0, h + 0.05, 0, g);
  const hinge = new THREE.Group(); hinge.position.set(-w / 2, 0, 0); g.add(hinge);
  const leaf = new THREE.Group(); hinge.add(leaf);
  const dm = std(color, { roughness: 0.45 });
  mesh(box(w - 0.02, h - 0.05, 0.07), dm, w / 2, h / 2 + 0.035, 0, leaf);
  for (const [px, py] of [[0.27, 0.6], [0.27, 1.45], [0.73, 0.6], [0.73, 1.45]]) mesh(rb(w * 0.34, 0.62, 0.04, 0.02), dm, px * w, py * (h / 2.2), 0.04, leaf);
  for (const sz of [1, -1]) mesh(new THREE.SphereGeometry(0.045, 12, 8), std('#c8cdd8', { metalness: 0.8, roughness: 0.25 }), w - 0.12, h * 0.46, sz * 0.07, leaf);
  return { group: g, hinge, setOpen(a) { hinge.rotation.y = a; } };
}

// ---------------- sign ----------------
export function makeSign() {
  const g = new THREE.Group(); g.name = 'sign';
  const wood = std('#3a2c5a');
  mesh(rb(0.18, 2.4, 0.18, 0.03), wood, -0.9, 1.2, 0, g);
  mesh(rb(0.18, 2.4, 0.18, 0.03), wood, 0.9, 1.2, 0, g);
  const tex = canvasTex(1024, 560, (x, w, h) => {
    x.fillStyle = '#c4122e'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#ffffff'; x.lineWidth = 22; x.strokeRect(26, 26, w - 52, h - 52);
    x.fillStyle = '#ffffff'; x.font = '900 124px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('KEEP YOUR', w / 2, 190); x.fillText('LIGHT ON', w / 2, 370);
    x.font = '900 46px Montserrat'; x.fillText('— HOLLOW CREEK TOWN RULE —', w / 2, 488);
  });
  const board = mesh(rb(2.3, 1.26, 0.12, 0.04), std('#c4122e'), 0, 2.15, 0, g);
  mesh(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }), 0, 2.15, 0.065, g, { cast: false });
  return { group: g };
}

// ---------------- lantern (Mr. Pell) ----------------
export function makeLantern() {
  const g = new THREE.Group(); g.name = 'lantern';
  const metal = std('#1d2238', { metalness: 0.6, roughness: 0.4 });
  mesh(rb(0.22, 0.04, 0.22, 0.01), metal, 0, -0.16, 0, g);
  mesh(rb(0.2, 0.05, 0.2, 0.01), metal, 0, 0.12, 0, g);
  for (const [x, z] of [[-0.09, -0.09], [0.09, -0.09], [-0.09, 0.09], [0.09, 0.09]]) mesh(box(0.02, 0.28, 0.02), metal, x, -0.02, z, g);
  mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16, Math.PI), metal, 0, 0.16, 0, g);
  const core = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 12), new THREE.MeshBasicMaterial({ color: '#f0b04a' }), 0, -0.03, 0, g, { cast: false });
  const glass = mesh(box(0.17, 0.25, 0.17), new THREE.MeshStandardMaterial({ color: '#ffcf70', emissive: '#ffb83d', emissiveIntensity: 1.2, transparent: true, opacity: 0.25 }), 0, -0.03, 0, g, { cast: false });
  const light = new THREE.PointLight(GOLD, 1.2, 0, 1.6); light.position.set(0, 0, 0.12); g.add(light);
  return { group: g, light, core };
}

// ---------------- mail sack ----------------
export function makeSack() {
  const g = new THREE.Group(); g.name = 'sack';
  const m = new THREE.MeshBasicMaterial({ color: '#07080e' });
  mesh(rb(0.75, 0.95, 0.5, 0.18), m, 0, -0.45, 0, g);
  mesh(rb(0.42, 0.25, 0.32, 0.1), m, 0, 0.08, 0, g);
  const env = new THREE.MeshBasicMaterial({ color: '#aeb8d6' });
  for (const [x, r] of [[-0.12, 0.3], [0.05, -0.15], [0.18, 0.2]]) { const e = mesh(box(0.22, 0.3, 0.015), env, x, 0.2, 0, g); e.rotation.z = r; }
  return { group: g };
}

// ---------------- cardboard box ----------------
export function makeMovingBox(label = 'THEO\'S TOYS') {
  const g = new THREE.Group();
  const tex = canvasTex(256, 192, (x, w, h) => {
    x.fillStyle = '#9b7d60'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#c7b8a6'; x.fillRect(w / 2 - 22, 0, 44, h);
    x.fillStyle = '#20202c'; x.font = '900 30px Montserrat'; x.textAlign = 'center'; x.fillText(label, w / 2, h * 0.62);
  });
  mesh(rb(0.62, 0.44, 0.46, 0.02), std('#9b7d60', { roughness: 0.9 }), 0, 0, 0, g);
  mesh(new THREE.PlaneGeometry(0.6, 0.42), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), 0, 0, 0.232, g, { cast: false });
  return { group: g };
}

// ---------------- curtains (wavy planes) ----------------
export function makeCurtain(w = 0.65, h = 1.9, color = '#5b2bd1') {
  const geo = new THREE.PlaneGeometry(w, h, 10, 16);
  geo.translate(0, -h / 2, 0); // hang from top
  const base = geo.attributes.position.array.slice();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.85, side: THREE.DoubleSide }));
  m.castShadow = true; m.receiveShadow = true;
  return {
    mesh: m,
    animate(t, wind = 0, side = 1) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) {
        const x = base[i], y = base[i + 1];
        const depth = -y / h; // 0 at top, 1 at bottom
        const folds = Math.sin(x * 22) * 0.035;
        const billow = wind * depth * (0.55 + 0.25 * Math.sin(t * 5.3 + y * 3 + x * 4) + 0.15 * Math.sin(t * 11.7 + x * 9));
        p[i] = x + side * wind * depth * 0.12 * Math.sin(t * 3.1 + y * 2);
        p[i + 1] = y;
        p[i + 2] = base[i + 2] + folds + billow;
      }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
    },
  };
}

// ---------------- houses ----------------
const HOUSE_COLORS = ['#f4e1bd', '#cfe2f7', '#f6d2dc', '#d5f0d6', '#efe6cf', '#e4d6f5', '#f9e7b3', '#d8ecf2'];
const ROOF_COLORS = ['#2e9b6c', '#3a74c9', '#7b4a39', '#2f8f8f', '#c4505a', '#4b5fbf'];

/** A two-storey blocky house. Front faces +z. Returns {group, windows:[{setLit}]} */
export function makeHouse({ w = 7, d = 7, color, roof, lit = [true, false, false, true], seed = 0, simple = false, specialWindow = -1 } = {}) {
  const g = new THREE.Group(); g.name = 'house';
  color = color || HOUSE_COLORS[seed % HOUSE_COLORS.length];
  roof = roof || ROOF_COLORS[seed % ROOF_COLORS.length];
  const H = 6;
  mesh(box(w, H, d), std(color, { roughness: 0.75 }), 0, H / 2, 0, g);
  mesh(box(w + 0.2, 0.25, d + 0.2), std('#dfe6f5'), 0, 3.05, 0, g);       // floor trim
  // gable roof: two slabs
  const rm = std(roof, { roughness: 0.7 });
  const slope = Math.atan2(2.6, w / 2);
  const slabL = Math.hypot(w / 2 + 0.5, 2.6 + 0.35);
  for (const s of [1, -1]) {
    const r = mesh(box(slabL, 0.3, d + 0.6), rm, s * (w / 4 + 0.05), H + 1.3, 0, g);
    r.rotation.z = -s * slope;
  }
  // gable triangles front/back
  const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, 2.6); tri.closePath();
  const tg = new THREE.ShapeGeometry(tri);
  for (const s of [1, -1]) { const t = mesh(tg, std(color, { roughness: 0.75, side: THREE.DoubleSide }), 0, H, s * d / 2, g); }
  if (!simple) mesh(box(0.7, 1.6, 0.7), std('#3b3f63'), w * 0.25, H + 2.1, -d * 0.15, g); // chimney
  // door
  mesh(box(1.3, 2.3, 0.1), std('#f2f4fa'), 0, 1.15, d / 2 + 0.03, g);
  mesh(box(1.05, 2.1, 0.1), std(['#1f6f8b', '#7a3b2e', '#2e7d4f', '#3b4a9c'][seed % 4], { roughness: 0.4 }), 0, 1.05, d / 2 + 0.07, g);
  if (!simple) {
    mesh(box(2.6, 0.25, 1.4), std('#cfd6e6'), 0, 0.12, d / 2 + 0.7, g);  // porch step
    mesh(box(2.8, 0.15, 1.6), std('#1f2a52'), 0, 2.75, d / 2 + 0.75, g); // porch roof
  }
  // windows: [lower-left, lower-right, upper-left, upper-right]
  const spots = [[-w * 0.3, 1.6], [w * 0.3, 1.6], [-w * 0.27, 4.5], [w * 0.27, 4.5]];
  const windows = [];
  spots.forEach(([x, y], i) => {
    const deep = i === specialWindow;
    const fz = d / 2 + (deep ? 0.25 : 0.06);
    const frame = std('#eef2fb');
    if (deep) { // hollow frame (4 bars) so a figure can stand inside the window recess
      const z0 = d / 2 + 0.25;
      mesh(box(1.5, 0.13, 0.5), frame, x, y + 0.66, z0, g); mesh(box(1.5, 0.13, 0.5), frame, x, y - 0.66, z0, g);
      mesh(box(0.13, 1.45, 0.5), frame, x - 0.69, y, z0, g); mesh(box(0.13, 1.45, 0.5), frame, x + 0.69, y, z0, g);
    } else mesh(box(1.5, 1.45, 0.12), frame, x, y, d / 2 + 0.06, g, { cast: !simple });
    const glassLit = GLASS_LIT;
    const glassDark = deep
      ? new THREE.MeshStandardMaterial({ color: '#0a1230', roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.25 })
      : GLASS_DARK;
    const glass = mesh(box(1.25, 1.2, 0.04), glassDark, x, y, fz + (deep ? 0.24 : 0.05), g, { cast: false });
    if (deep) { // hollow: cut a dark recess so a figure can stand "inside" the window
      mesh(box(1.25, 1.2, 0.02), basic('#1c2f78'), x, y, d / 2 + 0.03, g, { cast: false });
    }
    const bars = std('#eef2fb');
    mesh(box(0.08, 1.2, 0.06), bars, x, y, fz + (deep ? 0.26 : 0.08), g, { cast: false });
    mesh(box(1.25, 0.08, 0.06), bars, x, y, fz + (deep ? 0.26 : 0.08), g, { cast: false });
    const cur = [];
    if (!deep && !simple) for (const sx of [-1, 1]) { const c = mesh(box(0.3, 1.18, 0.02), CURTAIN_LIT, x + sx * 0.46, y, fz + 0.075, g, { cast: false }); c.visible = false; cur.push(c); }
    const win = {
      glass, lit: false, pos: new THREE.Vector3(x, y, fz + 0.1), deep,
      setLit(v) { win.lit = v; glass.material = v ? glassLit : glassDark; cur.forEach(c => (c.visible = v)); },
    };
    win.setLit(!!lit[i]);
    windows.push(win);
  });
  return { group: g, windows, w, d };
}

export function makeTree(seed = 0, scale = 1) {
  const g = new THREE.Group();
  mesh(box(0.45, 2.4, 0.45), std('#6b4a35'), 0, 1.2, 0, g);
  const pinks = ['#f7a8c9', '#ffbfd8', '#f48fb8', '#ffd1e3'];
  const blobs = [[0, 3.1, 0, 1.6], [0.9, 2.8, 0.3, 1.1], [-0.85, 2.9, -0.2, 1.15], [0.2, 3.9, -0.3, 1.1], [-0.3, 3.0, 0.9, 1.0], [0.4, 3.2, -0.9, 1.0]];
  blobs.forEach(([x, y, z, r], i) => mesh(new THREE.IcosahedronGeometry(r, 1), std(pinks[(i + seed) % 4], { roughness: 0.85, flatShading: true }), x, y, z, g));
  g.scale.setScalar(scale);
  return g;
}

export function makePicketFence(len = 6) {
  const g = new THREE.Group(); const m = std('#ffffff', { roughness: 0.5 });
  for (let x = -len / 2; x <= len / 2 + 1e-6; x += 0.4) { mesh(box(0.14, 0.9, 0.06), m, x, 0.45, 0, g); mesh(new THREE.ConeGeometry(0.1, 0.14, 4), m, x, 0.97, 0, g).rotation.y = Math.PI / 4; }
  mesh(box(len + 0.2, 0.08, 0.05), m, 0, 0.7, -0.04, g); mesh(box(len + 0.2, 0.08, 0.05), m, 0, 0.3, -0.04, g);
  return g;
}

export function makeCloud(seed = 0) {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false });
  const parts = [[0, 0, 0, 7], [6, -1, 1, 5], [-6, -1.2, 0, 5.5], [2.5, 2.5, -1, 4.5]];
  parts.forEach(([x, y, z, r], i) => { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (1 + 0.1 * ((seed + i) % 3)), 1), m); o.position.set(x, y, z); g.add(o); });
  return g;
}

export function makeTower(w, h, d, color, seed = 0) {
  const g = new THREE.Group();
  const tex = canvasTex(128, 256, (x, W, H) => {
    x.fillStyle = color; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(80,130,190,0.55)';
    for (let yy = 8; yy < H; yy += 16) for (let xx = 8; xx < W - 8; xx += 20) x.fillRect(xx, yy, 12, 9);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 24)));
  mesh(box(w, h, d), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.0 }), 0, h / 2, 0, g, { cast: false });
  mesh(box(w + 0.6, 1, d + 0.6), std('#e9eef6'), 0, h + 0.5, 0, g, { cast: false });
  return g;
}

export function makeMailbox() {
  const g = new THREE.Group();
  mesh(box(0.14, 1.0, 0.14), std('#2a2f4a'), 0, 0.5, 0, g);
  mesh(rb(0.36, 0.34, 0.6, 0.12), std('#e8233c', { roughness: 0.4 }), 0, 1.15, 0, g);
  mesh(box(0.05, 0.25, 0.05), std('#1d4cff'), 0.2, 1.3, 0.1, g);
  return g;
}

// ---------- town rules sheet (bottom torn off) and the torn scrap ----------
function tornEdge(x, w, y0, amp, seed) { x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w, y0); for (let i = 20; i >= 0; i--) x.lineTo(w * i / 20, y0 + ((i * 7919 + seed) % 13 - 6) * amp); x.closePath(); }
export function makeRulesPaper() {
  const g = new THREE.Group(); g.name = 'rules';
  const tex = canvasTex(640, 900, (x, w, h) => {
    x.clearRect(0, 0, w, h); tornEdge(x, w, 770, 4, 3); x.fillStyle = '#fbf6ea'; x.fill();
    x.save(); x.clip();
    x.fillStyle = '#c4122e'; x.fillRect(0, 0, w, 120);
    x.fillStyle = '#fff'; x.font = '900 52px Montserrat'; x.textAlign = 'center'; x.fillText('HOLLOW CREEK', w / 2, 62); x.font = '900 30px Montserrat'; x.fillText('TOWN RULES', w / 2, 103);
    x.textAlign = 'left'; x.fillStyle = '#1a1420'; x.font = '900 40px Montserrat';
    const rule = (n, l1, l2, y) => { x.fillStyle = '#c4122e'; x.fillText(n, 40, y); x.fillStyle = '#1a1420'; x.fillText(l1, 100, y); if (l2) x.fillText(l2, 100, y + 50); };
    rule('1.', 'Keep one light on', 'at midnight.', 220);
    rule('2.', 'Never open a letter', 'with no stamp.', 420);
    rule('3.', 'If they come', '', 620);
    x.restore();
  });
  const p = mesh(new THREE.PlaneGeometry(0.42, 0.59), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.5, roughness: 0.95, side: THREE.DoubleSide }), 0, 0, 0, g);
  return { group: g };
}
export function makeScrap() {
  const g = new THREE.Group(); g.name = 'scrap';
  const tex = canvasTex(640, 260, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.beginPath(); x.moveTo(0, 40); for (let i = 0; i <= 20; i++) x.lineTo(w * i / 20, 40 + ((i * 7919 + 3) % 13 - 6) * 4); x.lineTo(w, h); x.lineTo(0, h); x.closePath();
    x.fillStyle = '#fbf6ea'; x.fill();
    x.font = '900 40px Montserrat'; x.fillStyle = '#1a1420'; x.fillText('back...', 100, 105);
    x.fillStyle = '#c4122e'; x.font = '900 46px Montserrat'; x.fillText("they're not yours.", 60, 185);
  });
  mesh(new THREE.PlaneGeometry(0.42, 0.17), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.5, roughness: 0.95, side: THREE.DoubleSide }), 0, 0, 0, g);
  return { group: g };
}
export function makeTruck() {
  const g = new THREE.Group();
  const tex = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#2f6fe0'; x.font = '900 70px Montserrat'; x.textAlign = 'center'; x.fillText('EASY', w / 2, 110); x.fillText('MOVE', w / 2, 185); x.fillStyle = '#ff4fa3'; x.fillRect(40, 210, w - 80, 14); });
  const side = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  mesh(box(2.4, 2.6, 5), std('#ffffff'), 0, 1.75, -0.8, g);
  for (const sx of [1, -1]) { const p = mesh(new THREE.PlaneGeometry(4.6, 2.3), side, sx * 1.205, 1.8, -0.8, g, { cast: false }); p.rotation.y = sx * Math.PI / 2; }
  mesh(rb(2.4, 1.9, 1.8, 0.2), std('#2f6fe0'), 0, 1.4, 2.6, g);
  mesh(box(2.2, 0.8, 0.05), std('#bfe3ff', { metalness: 0.4, roughness: 0.1 }), 0, 1.85, 3.5, g);
  for (const [x, z] of [[1.15, 2.6], [-1.15, 2.6], [1.15, -2.2], [-1.15, -2.2]]) { const w = mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16), std('#22252e'), x, 0.45, z, g); w.rotation.z = Math.PI / 2; }
  return g;
}
export function makeFlagMailbox() {
  const g = new THREE.Group();
  mesh(box(0.14, 1.0, 0.14), std('#6b4a35'), 0, 0.5, 0, g);
  mesh(rb(0.42, 0.38, 0.7, 0.14), std('#2f6fe0', { roughness: 0.35 }), 0, 1.17, 0, g);
  const door = new THREE.Group(); door.position.set(0, 0.98, 0.36); g.add(door);
  mesh(box(0.4, 0.36, 0.03), std('#2a62d0'), 0, 0.18, 0, door);
  const flag = new THREE.Group(); flag.position.set(-0.23, 1.1, -0.1); g.add(flag);
  mesh(box(0.03, 0.4, 0.05), std('#e8233c'), 0, 0.18, 0, flag); mesh(box(0.03, 0.14, 0.18), std('#e8233c'), 0, 0.32, 0.08, flag);
  return { group: g, setFlag(a) { flag.rotation.x = -a; }, setDoor(a) { door.rotation.x = a; } };
}
