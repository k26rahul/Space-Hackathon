import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import { Item } from './components/Item.js';
import { Container } from './components/Container.js';

import { itemsData } from './data/items.js';
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

const container = new Container({ width: 100, height: 100, depth: 100 });
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
  // Calculate mouse position in normalized device coordinates (-1 to +1)
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, orthographicCamera);

  // Reset hover state for all items
  items.forEach(item => {
    item.isHovered = false;
  });

  // Find intersected objects
  const intersects = raycaster.intersectObjects(scene.children, true);

  // Set hover state for intersected items
  for (const intersect of intersects) {
    // Check if the intersected object is the solid mesh (first child) of any item's group
    const item = items.find(item => item.mesh.children[0] === intersect.object);
    if (item) {
      item.isHovered = true;
      break; // Only highlight the first intersected item
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
    setupItemControls(item);
  }
  return item;
}

// Setup item controls
function setupItemControls(item) {
  const control = new TransformControls(orthographicCamera, renderer.domElement);
  control.attach(item.mesh);

  control.addEventListener('dragging-changed', event => {
    controls.enabled = !event.value;
  });

  control.addEventListener('objectChange', () => {
    if (control.mode === 'translate') {
      item.mesh.position.x = Math.round(item.mesh.position.x / step) * step;
      item.mesh.position.y = Math.round(item.mesh.position.y / step) * step;
      item.mesh.position.z = Math.round(item.mesh.position.z / step) * step;
    }
    item.updatePositionFromMesh();
  });
  scene.add(control);
}

// Initialize items from data
itemsData.then(data => {
  data.forEach(item => createItem(item, false));

  const guiControls = setupControls({
    container,
    items,
    createItem, // Pass the createItem function to controls
  });

  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    container.checkIntersections(); // check for intersections
    guiControls.updateIntersections(); // update GUI intersections display
    items.forEach(item => item.updateVisual()); // flashing on intersection
    guiControls.updateItemProperties(); // update GUI item properties display

    renderer.render(scene, orthographicCamera);
    labelRenderer.render(scene, orthographicCamera);
  }
  animate();
});
