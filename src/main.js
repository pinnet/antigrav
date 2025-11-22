import './style.css';
import * as THREE from 'three';
import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls.js';
import GUI from 'lil-gui';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog = new THREE.FogExp2(0x111111, 0.02);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(4, 4, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.querySelector('#app').appendChild(renderer.domElement);

// --- Controls ---
const controls = new ArcballControls(camera, renderer.domElement, scene);
controls.enableAnimations = true;
controls.dampingFactor = 0.1;
controls.wMax = 12; // Angular velocity limit
controls.setGizmosVisible(false);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

const pointLight1 = new THREE.PointLight(0x3388ff, 2, 10);
pointLight1.position.set(-5, 2, -5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff3388, 2, 10);
pointLight2.position.set(5, -2, -5);
scene.add(pointLight2);

// --- Cube Logic ---
const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

const params = {
  gridSize: 5,
  gap: 0.05,
  roughness: 0.1,
  metalness: 0.1,
  letterSpeed: 0.1,
  edgeColor: '#000000',
};

const geometryCache = new Map();

// Store all sub-cubes
let allCubes = [];

function getRandomColor() {
  return new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
}

function createLetterTexture(letter, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#' + colorHex.getHexString();
  ctx.fillRect(0, 0, 256, 256);

  // Text
  ctx.font = 'bold 180px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000'; // Black text for contrast
  ctx.fillText(letter, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function fitCameraToSelection(camera, controls, selection, fitOffset = 1.5) {
  const box = new THREE.Box3();

  // Ensure the selection (cubeGroup) has children before calculating
  if (selection.children.length === 0) return;

  // We need to update the world matrix of the group and its children
  selection.updateMatrixWorld(true);

  box.setFromObject(selection);

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

  // Arcball specific target update
  controls.target.copy(center);

  // Adjust camera distance
  const direction = camera.position.clone().sub(controls.target).normalize().multiplyScalar(distance);
  camera.position.copy(controls.target).add(direction);

  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  controls.update();
}

function createCube() {
  // Clear existing cube
  while (cubeGroup.children.length > 0) {
    const child = cubeGroup.children[0];
    cubeGroup.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  }
  allCubes = [];

  const size = 1;
  const offset = (params.gridSize - 1) / 2;

  let geometry = geometryCache.get('box');
  if (!geometry) {
    geometry = new THREE.BoxGeometry(size, size, size);
    geometryCache.set('box', geometry);
  }

  let edgesGeometry = geometryCache.get('edges');
  if (!edgesGeometry) {
    edgesGeometry = new THREE.EdgesGeometry(geometry);
    geometryCache.set('edges', edgesGeometry);
  }

  const edgeMaterial = new THREE.LineBasicMaterial({ color: params.edgeColor });

  for (let x = 0; x < params.gridSize; x++) {
    for (let y = 0; y < params.gridSize; y++) {
      for (let z = 0; z < params.gridSize; z++) {
        const color = getRandomColor();
        const material = new THREE.MeshStandardMaterial({
          color: color,
          roughness: params.roughness,
          metalness: params.metalness,
        });

        const mesh = new THREE.Mesh(geometry, material);

        const spacing = size + params.gap;
        mesh.position.set(
          (x - offset) * spacing,
          (y - offset) * spacing,
          (z - offset) * spacing
        );

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Add edges
        const edges = new THREE.LineSegments(edgesGeometry, edgeMaterial);
        mesh.add(edges);

        // Store original color for letter generation
        mesh.userData = { hasLetter: false, originalColor: color };

        cubeGroup.add(mesh);
        allCubes.push(mesh);
      }
    }
  }

  fitCameraToSelection(camera, controls, cubeGroup);
}

createCube();

// --- GUI ---
const gui = new GUI();
gui.add(params, 'gridSize', 5, 25, 2).name('Grid Size').onChange(createCube);
gui.add(params, 'gap', 0, 0.5).name('Tile Gap').onChange(createCube);
const matFolder = gui.addFolder('Material');
matFolder.add(params, 'roughness', 0, 1).name('Roughness').onChange((val) => {
  allCubes.forEach(c => c.material.roughness = val);
});
matFolder.add(params, 'metalness', 0, 1).name('Metalness').onChange((val) => {
  allCubes.forEach(c => c.material.metalness = val);
});
matFolder.addColor(params, 'edgeColor').name('Edge Color').onChange((val) => {
  // Update all edge materials
  allCubes.forEach(c => {
    c.children.forEach(child => {
      if (child.isLineSegments) {
        child.material.color.set(val);
      }
    });
  });
});
gui.add(params, 'letterSpeed', 0, 1).name('Letter Speed');
gui.add({ regenerate: createCube }, 'regenerate').name('Regenerate Colors');

// Face definitions for rotation alignment
// 0: Right, 1: Left, 2: Top, 3: Bottom, 4: Front, 5: Back
const faceBasis = [
  { // 0: Right (+x)
    normal: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    right: new THREE.Vector3(0, 0, -1)
  },
  { // 1: Left (-x)
    normal: new THREE.Vector3(-1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    right: new THREE.Vector3(0, 0, 1)
  },
  { // 2: Top (+y)
    normal: new THREE.Vector3(0, 1, 0),
    up: new THREE.Vector3(0, 0, -1),
    right: new THREE.Vector3(1, 0, 0)
  },
  { // 3: Bottom (-y)
    normal: new THREE.Vector3(0, -1, 0),
    up: new THREE.Vector3(0, 0, 1),
    right: new THREE.Vector3(1, 0, 0)
  },
  { // 4: Front (+z)
    normal: new THREE.Vector3(0, 0, 1),
    up: new THREE.Vector3(0, 1, 0),
    right: new THREE.Vector3(1, 0, 0)
  },
  { // 5: Back (-z)
    normal: new THREE.Vector3(0, 0, -1),
    up: new THREE.Vector3(0, 1, 0),
    right: new THREE.Vector3(-1, 0, 0)
  }
];

// --- Animation ---
const clock = new THREE.Clock();
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Subtle floating animation only, NO ROTATION
  cubeGroup.position.y = Math.sin(elapsedTime * 0.5) * 0.2;

  // Random Letter Logic
  if (Math.random() < params.letterSpeed) {
    const availableCubes = allCubes.filter(c => !c.userData.hasLetter);
    if (availableCubes.length > 0) {
      const target = availableCubes[Math.floor(Math.random() * availableCubes.length)];
      const letter = letters.charAt(Math.floor(Math.random() * letters.length));

      // Use the cube's original color for the background
      const baseTexture = createLetterTexture(letter, target.userData.originalColor);

      // Create 6 independent materials/textures
      const materials = [];
      for (let i = 0; i < 6; i++) {
        const texture = baseTexture.clone();
        texture.center.set(0.5, 0.5);
        texture.needsUpdate = true; // Ensure clone is ready

        materials.push(new THREE.MeshStandardMaterial({
          map: texture,
          color: 0xffffff,
          roughness: params.roughness,
          metalness: params.metalness
        }));
      }

      // Clean up old material
      if (Array.isArray(target.material)) {
        target.material.forEach(m => m.dispose());
      } else {
        target.material.dispose();
      }

      target.material = materials;
      target.userData.hasLetter = true;
    }
  }

  // Keep letters upright relative to camera
  const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

  allCubes.forEach(cube => {
    if (cube.userData.hasLetter && Array.isArray(cube.material)) {
      // Calculate the camera's up vector in the cube's local space
      const localCameraUp = cameraUp.clone().applyQuaternion(cube.getWorldQuaternion(new THREE.Quaternion()).invert());

      cube.material.forEach((mat, i) => {
        if (!mat.map) return;

        const basis = faceBasis[i];

        // Project localCameraUp onto the face plane
        // We want the component of localCameraUp that is in the plane of the face
        // projectedUp = localCameraUp - (localCameraUp . normal) * normal
        const dot = localCameraUp.dot(basis.normal);
        const projectedUp = localCameraUp.clone().sub(basis.normal.clone().multiplyScalar(dot));

        // If projectedUp is zero (looking straight down at the face edge), keep previous rotation or zero
        if (projectedUp.lengthSq() > 0.0001) {
          projectedUp.normalize();

          // Calculate angle relative to the face's "Up" vector
          // y = projectedUp . Up
          // x = projectedUp . Right
          const y = projectedUp.dot(basis.up);
          const x = projectedUp.dot(basis.right);

          const angle = Math.atan2(x, y);

          // Snap to nearest 90 degrees
          const snapAngle = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);

          mat.map.rotation = -snapAngle;
        }
      });
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

// --- Resize Handler ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  fitCameraToSelection(camera, controls, cubeGroup);
});
