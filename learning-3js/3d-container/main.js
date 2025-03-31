import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { setupControls } from './controls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const aspectRatio = window.innerWidth / window.innerHeight;
const viewSize = 200;

// Create both camera types
const orthographicCamera = new THREE.OrthographicCamera(
  (-viewSize * aspectRatio) / 2,
  (viewSize * aspectRatio) / 2,
  viewSize / 2,
  -viewSize / 2,
  1,
  1000
);

const perspectiveCamera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

let activeCamera = orthographicCamera;
const setActiveCamera = camera => {
  activeCamera = camera;
};

const canvasContainer = document.getElementById('canvas-container');

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
canvasContainer.appendChild(labelRenderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const controls = new OrbitControls(activeCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const containerSize = 100;

const containerGeo = new THREE.BoxGeometry(containerSize, containerSize, containerSize);
const containerMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
});
const container = new THREE.Mesh(containerGeo, containerMat);
container.position.set(containerSize / 2, containerSize / 2, containerSize / 2);
scene.add(container);

const frontFaceGeo = new THREE.PlaneGeometry(containerSize, containerSize);
const frontFaceMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.2,
  side: THREE.DoubleSide,
});
const frontFace = new THREE.Mesh(frontFaceGeo, frontFaceMat);
frontFace.position.set(0, 0, -containerSize / 2);
container.add(frontFace);

const items = [
  {
    name: 'Item 1',
    size: [30, 30, 30],
    position: [25, 25, 25],
    color: 0xff0000,
    mesh: null,
    label: null,
  },
  {
    name: 'Item 2',
    size: [40, 40, 40],
    position: [60, 60, 60],
    color: 0x0000ff,
    mesh: null,
    label: null,
  },
];

function hexToRgb(hex) {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

function createItem(item) {
  const [width, height, depth] = item.size;
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color: item.color,
    transparent: true,
    opacity: 0.8,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...item.position);

  const labelDiv = document.createElement('div');
  labelDiv.className = 'label';
  labelDiv.textContent = item.name;
  labelDiv.style.borderColor = hexToRgb(item.color);
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, height / 2 + 5, 0);
  mesh.add(label);

  item.mesh = mesh;
  item.label = label;

  return mesh;
}

items.forEach(item => {
  const itemMesh = createItem(item);
  scene.add(itemMesh);
});

const axesHelper = new THREE.AxesHelper(150);
scene.add(axesHelper);

orthographicCamera.position.set(150, 150, 150);
perspectiveCamera.position.set(150, 150, 150);
orthographicCamera.zoom = 1;
orthographicCamera.updateProjectionMatrix();
orthographicCamera.lookAt(containerSize / 2, containerSize / 2, containerSize / 2);
perspectiveCamera.lookAt(containerSize / 2, containerSize / 2, containerSize / 2);

const gui = new GUI();

setupControls({
  gui,
  container,
  items,
  orthographicCamera,
  perspectiveCamera,
  containerSize,
  controls,
  setActiveCamera,
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, activeCamera);
  labelRenderer.render(scene, activeCamera);
}
animate();

window.addEventListener('resize', () => {
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  const aspect = width / height;

  // Update orthographic camera
  orthographicCamera.left = (-viewSize * aspect) / 2;
  orthographicCamera.right = (viewSize * aspect) / 2;
  orthographicCamera.top = viewSize / 2;
  orthographicCamera.bottom = -viewSize / 2;
  orthographicCamera.updateProjectionMatrix();

  // Update perspective camera
  perspectiveCamera.aspect = aspect;
  perspectiveCamera.updateProjectionMatrix();

  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
});
