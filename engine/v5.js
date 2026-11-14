// Story kit additions: Battery Town (charging station), shared by later stories.
import * as THREE from 'three';
import { std, basic, rb, box, mesh, canvasTex } from './props.js';

export function buildStation(scene, W) {
  const g = new THREE.Group(); g.name = 'station'; g.position.set(-1000, 0, 0); scene.add(g); W.sets.station = g;
  const floorTex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#3a4152'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a2f3c'; x.lineWidth = 4; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(10, 10);
  mesh(box(40, 0.2, 40), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.5, metalness: 0.3 }), 0, -0.1, 0, g, { cast: false });
  const wall = std('#262c3a', { roughness: 0.8 });
  mesh(box(40, 12, 0.4), wall, 0, 6, -20, g); mesh(box(0.4, 12, 40), wall, -20, 6, 0, g); mesh(box(0.4, 12, 40), wall, 20, 6, 0, g); mesh(box(40, 12, 0.4), wall, 0, 6, 20, g);
  mesh(box(40, 0.4, 40), std('#1d2230'), 0, 12, 0, g);
  // pods in rows
  W.pods = [];
  const glass = new THREE.MeshStandardMaterial({ color: '#9fe8ff', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    const p = new THREE.Group(); p.position.set(-10 + c * 4, 0, -4 + r * 5); g.add(p);
    mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.3, 24), std('#cfd6e6', { metalness: 0.5, roughness: 0.3 }), 0, 0.15, 0, p);
    const ringM = new THREE.MeshBasicMaterial({ color: '#38e07b' });
    mesh(new THREE.TorusGeometry(0.98, 0.05, 8, 32), ringM, 0, 0.32, 0, p, { cast: false }).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.9, 24, 1, true), glass, 0, 1.75, 0, p, { cast: false });
    mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.3, 24), std('#cfd6e6', { metalness: 0.5, roughness: 0.3 }), 0, 3.3, 0, p);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 8.5, 6), std('#111'), 0.5, 7.7, 0, p);
    const light = new THREE.PointLight('#38e07b', 0.8, 4, 1.6); light.position.set(0, 2, 0.8); p.add(light);
    W.pods.push({ group: p, ring: ringM, light, setColor(c) { ringM.color.set(c); light.color.set(c); } });
  }
  // central machine with a big screen
  mesh(rb(6, 9, 3, 0.2), std('#3a4152', { metalness: 0.4, roughness: 0.4 }), 0, 4.5, -16, g);
  const st = canvasTex(1024, 640, () => {});
  mesh(new THREE.PlaneGeometry(5.2, 3.25), new THREE.MeshBasicMaterial({ map: st }), 0, 6, -14.48, g, { cast: false });
  W.setStationScreen = (lines, col = '#38e07b') => {
    const c = st.userData.canvas, x = c.getContext('2d'); x.fillStyle = '#05080c'; x.fillRect(0, 0, 1024, 640);
    x.strokeStyle = col; x.lineWidth = 14; x.strokeRect(20, 20, 984, 600); x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((l, i) => { x.font = `700 ${i ? 76 : 110}px Fredoka`; x.fillText(l, 512, 640 * (i + 1) / (lines.length + 1)); }); st.needsUpdate = true;
  };
  W.setStationScreen(['CHARGING', 'sleep well, citizens']);
  for (const x of [-12, 12]) for (const z of [-12, 4]) { const a = mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: '#552222' }), x, 10.5, z, g, { cast: false }); (W.alarms = W.alarms || []).push(a); }
  const amb = new THREE.PointLight('#7fa8ff', 3, 0, 1.0); amb.position.set(0, 10, 2); g.add(amb); W.stationAmb = amb;
}
