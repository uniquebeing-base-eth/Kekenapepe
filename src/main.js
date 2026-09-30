import * as THREE from 'three';
import './style.css';

const gameElement = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b8e8c9');
scene.fog = new THREE.Fog('#b8e8c9', 38, 135);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 220);
camera.position.set(0, 5.7, 12.8);
camera.lookAt(0, 1.1, -9);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
gameElement.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight('#eafff0', '#697d54', 2.1));
const sun = new THREE.DirectionalLight('#fff1c1', 3.2);
sun.position.set(-15, 27, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -24;
sun.shadow.camera.right = 24;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -20;
sun.shadow.bias = -0.0006;
scene.add(sun);

const colors = {
  road: '#424b48', shoulder: '#d3c5a0', line: '#f8e5a1', leaf: '#4d9660',
  roof: '#bd6650', wall: '#f2d7a1', mint: '#c5e4c9', cream: '#f4e8c9',
};
const mats = Object.fromEntries(Object.entries(colors).map(([key, color]) => [key, new THREE.MeshStandardMaterial({ color, roughness: 0.92 })]));
const roadMaterial = new THREE.MeshStandardMaterial({ color: colors.road, roughness: 0.94 });
const road = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 165), roadMaterial);
road.rotation.x = -Math.PI / 2;
road.position.set(0, -0.07, -58);
road.receiveShadow = true;
scene.add(road);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ color: '#8fc894', roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.16, -70);
ground.receiveShadow = true;
scene.add(ground);

const laneWidth = 3.35;
const lanes = [-laneWidth, 0, laneWidth];
const dashMaterial = new THREE.MeshStandardMaterial({ color: '#f8e5a1', roughness: 0.8 });
const dashes = [];
for (const x of [-laneWidth / 2, laneWidth / 2]) {
  for (let i = 0; i < 22; i += 1) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 2.1), dashMaterial);
    dash.position.set(x, -0.015, 9 - i * 7.2);
    scene.add(dash);
    dashes.push(dash);
  }
}
for (const x of [-5.58, 5.58]) {
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 165), new THREE.MeshStandardMaterial({ color: '#f2ead0' }));
  edge.position.set(x, -0.01, -58);
  scene.add(edge);
}

const random = (() => {
  let seed = 83922;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
})();

function makeBox(parent, width, height, depth, material, position, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createPalm(x, z, scale = 1) {
  const palm = new THREE.Group();
  palm.position.set(x, 0, z);
  palm.scale.setScalar(scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.29, 4, 6), new THREE.MeshStandardMaterial({ color: '#956746', roughness: 1 }));
  trunk.position.y = 2;
  trunk.rotation.z = -0.09;
  trunk.castShadow = true;
  palm.add(trunk);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#458856', roughness: 1, flatShading: true });
  for (let i = 0; i < 7; i += 1) {
    const angle = i / 7 * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.9, 4), leafMaterial);
    frond.position.set(Math.cos(angle) * 1.12, 4.05, Math.sin(angle) * 1.12);
    frond.rotation.z = -Math.cos(angle) * 0.85;
    frond.rotation.x = Math.sin(angle) * 0.85;
    frond.rotation.y = angle;
    frond.castShadow = true;
    palm.add(frond);
  }
  scene.add(palm);
  return palm;
}

function createBuilding(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const width = 5.4 + random() * 5.5;
  const height = 5 + random() * 8;
  const depth = 6 + random() * 7;
  const wallOptions = [mats.wall, mats.mint, mats.cream, new THREE.MeshStandardMaterial({ color: '#e6aa70', roughness: 1 })];
  const wall = wallOptions[Math.floor(random() * wallOptions.length)];
  makeBox(group, width, height, depth, wall, [0, height / 2, 0]);
  makeBox(group, width + 0.3, 0.28, depth + 0.3, mats.roof, [0, height + 0.12, 0]);
  const windowMaterial = new THREE.MeshStandardMaterial({ color: '#83b8a3', roughness: 0.5, metalness: 0.06 });
  const rows = Math.max(1, Math.floor(height / 2.1));
  const cols = Math.max(2, Math.floor(width / 1.8));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const wx = (col - (cols - 1) / 2) * (width / cols);
      const wy = 1.25 + row * 1.85;
      makeBox(group, 0.52, 0.72, 0.055, windowMaterial, [wx, wy, depth / 2 + 0.035], false);
    }
  }
  scene.add(group);
  return group;
}

const scenery = [];
for (let i = 0; i < 30; i += 1) {
  const z = 8 - i * 7.1;
  for (const side of [-1, 1]) {
    if (i % 3 === 0 || random() > 0.48) {
      const tree = createPalm(side * (8.4 + random() * 6), z - random() * 3, 0.72 + random() * 0.62);
      scenery.push(tree);
    } else {
      const building = createBuilding(side * (11 + random() * 5), z - random() * 2);
      scenery.push(building);
    }
  }
}

function createKeke(primary = false) {
  const group = new THREE.Group();
  const paint = primary ? '#ef713c' : ['#e1a62f', '#278c68', '#d95041', '#477eae'][Math.floor(random() * 4)];
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: paint, roughness: 0.65, metalness: 0.02, flatShading: true });
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#34413b', roughness: 0.82, flatShading: true });
  const glass = new THREE.MeshStandardMaterial({ color: '#a8d8c6', roughness: 0.3, metalness: 0.12 });
  makeBox(group, 1.38, 0.56, 2.15, bodyMaterial, [0, 0.77, 0]);
  makeBox(group, 1.28, 0.12, 2.05, new THREE.MeshStandardMaterial({ color: '#fff3dc', roughness: 0.7 }), [0, 1.09, -0.06]);
  makeBox(group, 1.26, 0.1, 1.68, darkMetal, [0, 1.78, -0.22]);
  for (const x of [-0.58, 0.58]) {
    for (const z of [-0.86, 0.42]) {
      const post = makeBox(group, 0.09, 0.7, 0.09, darkMetal, [x, 1.43, z]);
      post.castShadow = false;
    }
    makeBox(group, 0.035, 0.45, 0.035, glass, [x * 0.8, 1.45, -0.43], false);
  }
  makeBox(group, 0.92, 0.56, 0.08, glass, [0, 1.47, -0.89], false);
  makeBox(group, 0.96, 0.09, 0.12, new THREE.MeshStandardMaterial({ color: '#fff2d1', roughness: 0.4 }), [0, 0.82, -1.08], false);
  for (const x of [-0.79, 0.79]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.19, 9), darkMetal);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.39, 0.58);
    wheel.castShadow = true;
    group.add(wheel);
    makeBox(group, 0.1, 0.2, 0.16, new THREE.MeshStandardMaterial({ color: '#f6d76d' }), [x * 0.79, 0.82, -1.12], false);
  }
  const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 9), darkMetal);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.position.set(0, 0.34, -1.02);
  frontWheel.castShadow = true;
  group.add(frontWheel);
  group.userData.wheels = group.children.filter((child) => child.geometry?.type === 'CylinderGeometry');
  return group;
}

const player = createKeke(true);
player.position.set(0, 0, 3.4);
player.scale.setScalar(1.08);
scene.add(player);

const traffic = [];
function spawnTraffic(z = -92) {
  const vehicle = createKeke(false);
  const lane = Math.floor(random() * lanes.length);
  vehicle.position.set(lanes[lane], 0, z - random() * 22);
  vehicle.scale.setScalar(0.94 + random() * 0.08);
  scene.add(vehicle);
  traffic.push({ mesh: vehicle, lane, speed: 2 + random() * 2.4, collected: false });
}
spawnTraffic(-42);
spawnTraffic(-78);
spawnTraffic(-112);

const pickups = [];
function createPickup(kind, lane, z) {
  const group = new THREE.Group();
  group.position.set(lanes[lane], 0, z);
  if (kind === 'coin') {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 10), new THREE.MeshStandardMaterial({ color: '#ffd64b', metalness: 0.38, roughness: 0.28 }));
    coin.rotation.x = Math.PI / 2;
    coin.position.y = 1.15;
    coin.castShadow = true;
    group.add(coin);
  } else {
    const post = makeBox(group, 0.12, 1.35, 0.12, new THREE.MeshStandardMaterial({ color: '#477c57' }), [0, 0.68, 0]);
    post.castShadow = false;
    makeBox(group, 0.82, 0.48, 0.1, new THREE.MeshStandardMaterial({ color: '#f1e5c5' }), [0, 1.45, 0]);
    makeBox(group, 0.64, 0.09, 0.12, new THREE.MeshStandardMaterial({ color: '#e76f4c' }), [0, 1.51, 0.07]);
    const letter = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.22), new THREE.MeshBasicMaterial({ color: '#335b42' }));
    letter.position.set(0, 1.46, 0.065);
    group.add(letter);
  }
  scene.add(group);
  pickups.push({ mesh: group, kind, lane, taken: false, phase: random() * Math.PI * 2 });
}
for (let i = 0; i < 18; i += 1) createPickup(i % 5 === 4 ? 'passenger' : 'coin', Math.floor(random() * 3), -16 - i * 12.5);

const ui = {
  score: document.querySelector('#score'), best: document.querySelector('#best-score'), speed: document.querySelector('#speed'),
  meter: document.querySelector('#speed-meter-fill'), coins: document.querySelector('#coins'), street: document.querySelector('#street-name'),
  mission: document.querySelector('#mission-title'), progress: document.querySelector('#mission-progress'), detail: document.querySelector('#mission-detail'),
  passengerTitle: document.querySelector('#passenger-title'), passengerDetail: document.querySelector('#passenger-detail'), passengers: document.querySelector('#passenger-count'),
  toast: document.querySelector('#toast'), landmark: document.querySelector('#landmark-label'), crash: document.querySelector('#crash-screen'),
  crashMessage: document.querySelector('#crash-message'), finalScore: document.querySelector('#final-score'), loading: document.querySelector('#loading-screen'),
};

const streets = ['Aka Road', 'Ikot Ekpene Road', 'Abak Road', 'Oron Road', 'Wellington Bassey Way', 'Nwaniba Road'];
const crashMessages = [
  'Even the keke needs a breather.', 'My brother, the road no be yours alone!', 'This keke don collect.', 'Omo, that one pain small.',
  'Conductor! Make we try again.', 'No worry. Uyo traffic gets everybody.',
];
const state = {
  lane: 1, lanePosition: 0, speed: 48, score: 0, coins: 0, distance: 0, time: 0,
  active: true, braking: false, boosting: false, passengers: 0, dropDistance: null,
  nextPickup: 1.5, streetIndex: 0, toastTimer: null, missionStage: 0, roadTime: 0,
};
let bestScore = Number(localStorage.getItem('kekenapepe-best') || 0);
ui.best.textContent = String(bestScore).padStart(6, '0');

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 1550);
}

function changeLane(direction) {
  if (!state.active) return;
  state.lane = THREE.MathUtils.clamp(state.lane + direction, 0, 2);
}

function endRun() {
  if (!state.active) return;
  state.active = false;
  const final = Math.floor(state.score);
  if (final > bestScore) {
    bestScore = final;
    localStorage.setItem('kekenapepe-best', String(bestScore));
  }
  ui.best.textContent = String(bestScore).padStart(6, '0');
  ui.crashMessage.textContent = crashMessages[Math.floor(random() * crashMessages.length)];
  ui.finalScore.textContent = `You made it ${Math.floor(state.distance)} m · ${final} points · ₦${state.coins * 50} collected`;
  ui.crash.hidden = false;
}

function resetRun() {
  state.lane = 1;
  state.lanePosition = 0;
  state.speed = 48;
  state.score = 0;
  state.coins = 0;
  state.distance = 0;
  state.time = 0;
  state.active = true;
  state.passengers = 0;
  state.dropDistance = null;
  state.nextPickup = 1.5;
  state.streetIndex = 0;
  state.missionStage = 0;
  state.roadTime = 0;
  player.position.set(0, 0, 3.4);
  for (const item of traffic) {
    item.mesh.position.z = -42 - random() * 70;
    item.lane = Math.floor(random() * 3);
    item.mesh.position.x = lanes[item.lane];
    item.collected = false;
  }
  for (const [index, item] of pickups.entries()) {
    item.taken = false;
    item.kind = index % 5 === 4 ? 'passenger' : 'coin';
    item.lane = Math.floor(random() * 3);
    item.mesh.position.set(lanes[item.lane], 0, -16 - index * 12.5);
    item.mesh.visible = true;
  }
  ui.crash.hidden = true;
  ui.mission.textContent = 'Reach Ibom Plaza';
  ui.progress.style.width = '0%';
  ui.detail.textContent = '0 / 400 m';
  ui.passengerTitle.textContent = 'No passenger';
  ui.passengerDetail.textContent = 'Look out for a pickup';
  ui.passengers.textContent = '0';
  ui.landmark.classList.remove('visible');
  showToast('New run. Make we move!');
}

function bindHold(button, key) {
  const start = (event) => {
    event.preventDefault();
    state[key] = true;
    button.classList.add('pressed');
    button.setPointerCapture?.(event.pointerId);
  };
  const stop = () => {
    state[key] = false;
    button.classList.remove('pressed');
  };
  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('lostpointercapture', stop);
  button.addEventListener('pointerleave', stop);
}

document.querySelector('#steer-left').addEventListener('pointerdown', (event) => { event.preventDefault(); changeLane(-1); });
document.querySelector('#steer-right').addEventListener('pointerdown', (event) => { event.preventDefault(); changeLane(1); });
bindHold(document.querySelector('#brake'), 'braking');
bindHold(document.querySelector('#faster'), 'boosting');
document.querySelector('#restart-button').addEventListener('click', resetRun);

let soundEnabled = false;
let audioContext = null;
document.querySelector('#sound-toggle').addEventListener('click', (event) => {
  soundEnabled = !soundEnabled;
  event.currentTarget.classList.toggle('is-muted', !soundEnabled);
  event.currentTarget.setAttribute('aria-label', soundEnabled ? 'Mute sound' : 'Enable sound');
  if (soundEnabled) showToast('Radio on. Enjoy the ride!');
});

const keysDown = new Set();
window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.preventDefault();
  if (event.repeat) return;
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') changeLane(-1);
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') changeLane(1);
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') state.boosting = true;
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's' || event.key === ' ') state.braking = true;
  if (event.key.toLowerCase() === 'r' && !state.active) resetRun();
  keysDown.add(event.key);
});
window.addEventListener('keyup', (event) => {
  keysDown.delete(event.key);
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') state.boosting = false;
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's' || event.key === ' ') state.braking = false;
});
window.addEventListener('blur', () => {
  state.boosting = false;
  state.braking = false;
  state.braking = false;
  state.boosting = false;
  keysDown.clear();
});

let previousTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  if (state.active) {
    state.time += delta;
    const targetSpeed = state.braking ? 25 : state.boosting ? 88 : 48;
    state.speed = THREE.MathUtils.damp(state.speed, targetSpeed, 2.8, delta);
    const flow = state.speed / 48;
    const forward = 12.2 * flow * delta;
    state.distance += forward;
    state.score += forward * 1.35;
    state.lanePosition = THREE.MathUtils.damp(state.lanePosition, lanes[state.lane], 10, delta);
    player.position.x = state.lanePosition;
    player.position.y = Math.sin(state.time * 13) * 0.035;
    player.rotation.z = THREE.MathUtils.damp(player.rotation.z, (lanes[state.lane] - state.lanePosition) * -0.07, 9, delta);
    for (const wheel of player.userData.wheels) wheel.rotation.x += forward * 0.75;

    for (const dash of dashes) {
      dash.position.z += forward;
      if (dash.position.z > 12) dash.position.z -= dashes.length / 2 * 7.2;
    }
    for (const object of scenery) {
      object.position.z += forward;
      if (object.position.z > 18) object.position.z -= 30 * 7.1;
    }

    for (const item of traffic) {
      item.mesh.position.z += (forward - item.speed * delta);
      for (const wheel of item.mesh.userData.wheels) wheel.rotation.x += (forward - item.speed * delta) * 0.75;
      if (item.mesh.position.z > player.position.z - 1.1 && item.mesh.position.z < player.position.z + 1.25 && Math.abs(item.mesh.position.x - player.position.x) < 1.18) {
        endRun();
        break;
      }
      if (item.mesh.position.z > 16) {
        item.lane = Math.floor(random() * 3);
        item.mesh.position.x = lanes[item.lane];
        item.mesh.position.z = -95 - random() * 38;
        item.speed = 2 + random() * 2.4;
      }
    }

    state.nextPickup -= delta;
    if (state.nextPickup <= 0) {
      const availablePickup = pickups.find((item) => item.taken || item.mesh.position.z > 11);
      if (availablePickup) {
        availablePickup.taken = false;
        availablePickup.lane = Math.floor(random() * 3);
        availablePickup.mesh.position.set(lanes[availablePickup.lane], 0, -110 - random() * 35);
        availablePickup.mesh.visible = true;
      }
      state.nextPickup = 0.9 + random() * 0.7;
    }
    for (const item of pickups) {
      if (item.taken) continue;
      item.mesh.position.z += forward;
      if (item.kind === 'coin') {
        const coin = item.mesh.children[0];
        coin.rotation.y += delta * 2.4;
        coin.position.y = 1.14 + Math.sin(state.time * 4 + item.phase) * 0.1;
      }
      if (item.kind === 'passenger') item.mesh.children[1].rotation.y = Math.sin(state.time * 2 + item.phase) * 0.08;
      if (item.mesh.position.z > player.position.z - 1.2 && item.mesh.position.z < player.position.z + 1.25 && Math.abs(lanes[item.lane] - player.position.x) < 1.18) {
        item.taken = true;
        item.mesh.visible = false;
        if (item.kind === 'coin') {
          state.coins += 1;
          state.score += 25;
          if (soundEnabled) playChime();
          showToast('Abeg collect! +25 points');
        } else if (state.passengers === 0) {
          state.passengers = 1;
          state.dropDistance = state.distance + 160;
          showToast('Passenger onboard! Drop-off ahead.');
        }
      }
    }

    if (state.passengers && state.distance >= state.dropDistance) {
      state.passengers = 0;
      state.dropDistance = null;
      state.score += 150;
      showToast('Drop-off complete! +150 points');
    }
    const streetIndex = Math.floor(state.distance / 180) % streets.length;
    if (streetIndex !== state.streetIndex) {
      state.streetIndex = streetIndex;
      ui.street.textContent = streets[streetIndex];
      showToast(`Now riding on ${streets[streetIndex]}`);
    }
    if (state.distance >= 400 && state.missionStage === 0) {
      state.missionStage = 1;
      ui.mission.textContent = 'Survive Ikot Ekpene Road';
      showToast('Ibom Plaza reached! Next: survive Ikot Ekpene Road.');
    }
    if (state.missionStage === 0) {
      ui.progress.style.width = `${Math.min(100, state.distance / 400 * 100)}%`;
      ui.detail.textContent = `${Math.min(400, Math.floor(state.distance))} / 400 m`;
    } else if (state.missionStage === 1) {
      if (streetIndex === 1) state.roadTime += delta;
      ui.progress.style.width = `${Math.min(100, state.roadTime / 60 * 100)}%`;
      ui.detail.textContent = `${Math.min(60, Math.floor(state.roadTime))} / 60 sec on Ikot Ekpene Road`;
      if (state.roadTime >= 60) {
        state.missionStage = 2;
        state.score += 300;
        ui.mission.textContent = 'Uyo road legend';
        ui.detail.textContent = 'All missions complete';
        ui.progress.style.width = '100%';
        showToast('Uyo road legend! Mission complete +300');
      }
    }
    if (state.distance > 350 && state.distance < 450) ui.landmark.classList.add('visible');
    else ui.landmark.classList.remove('visible');
    ui.score.textContent = String(Math.floor(state.score)).padStart(6, '0');
    ui.speed.textContent = String(Math.round(state.speed));
    ui.meter.style.width = `${Math.min(100, state.speed / 88 * 100)}%`;
    ui.coins.textContent = String(state.coins);
    ui.passengers.textContent = String(state.passengers);
    ui.passengerTitle.textContent = state.passengers ? 'Passenger onboard' : 'No passenger';
    ui.passengerDetail.textContent = state.passengers ? `${Math.max(0, Math.ceil(state.dropDistance - state.distance))} m to drop-off` : 'Look out for a pickup';
  }
  renderer.render(scene, camera);
}

function playChime() {
  audioContext ||= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.08);
  gain.gain.setValueAtTime(0.09, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.19);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
});

requestAnimationFrame(animate);
setTimeout(() => ui.loading.classList.add('hidden'), 450);
setTimeout(() => ui.loading.remove(), 1000);