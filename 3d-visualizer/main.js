import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import { Item } from './components/Item.js';
import { Container } from './components/Container.js';

import { loadDataset, getStoredDataset } from './data/data.js';
import { setupControls } from './gui/gui.js';

const canvasContainer = document.getElementById('canvas-container');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
canvasContainer.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const aspectRatio = window.innerWidth / window.innerHeight;
const viewSize = 200;
const orthographicCamera = new THREE.OrthographicCamera(
  (-viewSize * aspectRatio) / 2,
  (viewSize * aspectRatio) / 2,
  viewSize / 2,
  -viewSize / 2,
  -1000,
  1000
);

const controls = new OrbitControls(orthographicCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
// controls.autoRotate = true;
// controls.autoRotateSpeed = 1;

{
  orthographicCamera.position.set(100, 100, 150);
  orthographicCamera.zoom = 0.9;
  controls.target.set(50, 50, 0);
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const container = new Container({
  size: { width: 100, height: 100, depth: 100 },
  position: { x: 0, y: 0, z: 0 },
});
scene.add(container.mesh);

const axesHelper = new THREE.AxesHelper(150);
scene.add(axesHelper);

const step = 1;
const items = [];
let itemCounter = 1; // Add counter for auto-incrementing names

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Add mouse move event listener
window.addEventListener('mousemove', onMouseMove);

function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, orthographicCamera);

  // Reset hover state for all items
  items.forEach(item => {
    item.isHovered = false;
  });

  // Find intersected objects, including those behind the container
  const allIntersects = raycaster.intersectObjects(scene.children, true);

  // Get all items that are intersected, not just the first one
  for (const intersect of allIntersects) {
    const item = items.find(item => item.mesh.children.some(child => child === intersect.object));
    if (item && item.visible) {
      // Only break if the item is visible
      item.isHovered = true;
      break;
    }
  }
}

// Create and add item to container
function createItem(data, enableTransformControl = true) {
  const item = new Item(`Item ${itemCounter++}`, data.size, data.position);
  container.addItem(item);
  item.setContainer(container);
  items.push(item);
  if (enableTransformControl) {
    const control = item.setupTransformControl(orthographicCamera, renderer, controls);
    scene.add(control);
  }
  return item;
}

// Cleanup items
function cleanupItems() {
  container.removeAllItems();
  items.length = 0;
  itemCounter = 1;
}

let guiControls;

// Initialize items from dataset
function initializeItems(data) {
  data.items.forEach(item => createItem(item, false));
  guiControls.initializeItemControls(items);
}

// Initialize with default dataset and setup controls
loadDataset(getStoredDataset()).then(data => {
  guiControls = setupControls({
    items,
    createItem,
    container,
    onDatasetChange: setNumber => {
      cleanupItems();
      loadDataset(setNumber).then(newData => {
        initializeItems(newData);
      });
    },
  });

  initializeItems(data);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    container.checkIntersections(); // check for intersections
    items.forEach(item => item.updateVisual()); // flashing on intersection
    guiControls.updateIntersections(); // update GUI intersections display
    guiControls.updateItemProperties(); // update GUI item properties display

    renderer.render(scene, orthographicCamera);
    labelRenderer.render(scene, orthographicCamera);
  }
  animate();
});
