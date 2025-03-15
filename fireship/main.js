import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new THREE.Scene();

const width = window.innerWidth;
const height = window.innerHeight;

// const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

window.cameraSettings = {
  left: width / -20, // Increased for a wider view
  right: width / 20, // Increased for a wider view
  top: height / 20, // Increased for a taller view
  bottom: height / -20, // Increased for a taller view
  near: 0, // Increased near clipping plane to avoid cutting artifacts
  far: 1000, // Keep far clipping plane as is
};

const camera = new THREE.OrthographicCamera(
  cameraSettings.left,
  cameraSettings.right,
  cameraSettings.top,
  cameraSettings.bottom,
  cameraSettings.near,
  cameraSettings.far
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('canvas'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);
camera.position.setZ(10); // Bring the camera closer
camera.position.setY(2); // Adjust vertical position for better framing

renderer.render(scene, camera);

const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({
  color: 0xff6347,
  side: THREE.DoubleSide, // Ensure both sides of the geometry are rendered
  // wireframe: true,
});
const torus = new THREE.Mesh(geometry, material);

scene.add(torus);

const pointLight = new THREE.PointLight(0xffffff, 2, 0, 0);
pointLight.position.set(20, 0, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(pointLight, ambientLight);

const pointLightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(pointLightHelper, gridHelper);

const controls = new OrbitControls(camera, renderer.domElement);

const cameraHelper = new THREE.CameraHelper(camera);
scene.add(cameraHelper);

function addSpheres() {
  const geometry = new THREE.SphereGeometry(1, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
  });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(50));

  star.position.set(x, y, z);
  scene.add(star);
}

Array(30).fill().map(addSpheres);

const spaceTexture = new THREE.TextureLoader().load('space.jpg');
scene.background = spaceTexture;

const viduTexture = new THREE.TextureLoader().load('vidu.jpg');
const vidu = new THREE.Mesh(
  new THREE.BoxGeometry(3, 3, 3),
  new THREE.MeshBasicMaterial({ map: viduTexture })
);

scene.add(vidu);
vidu.position.x = -20;

const moonTexture = new THREE.TextureLoader().load('./moon.jpg');
const normalTexture = new THREE.TextureLoader().load('./normal.jpg');
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial({
    map: moonTexture,
    normalMap: normalTexture,
  })
);

scene.add(moon);

const moonPointLight = new THREE.PointLight(0x00ff00, 2, 10, 0);
moonPointLight.position.set(-5, 0, 0);

scene.add(moonPointLight);
scene.add(new THREE.PointLightHelper(moonPointLight));

function updateCamera() {
  camera.left = window.cameraSettings.left;
  camera.right = window.cameraSettings.right;
  camera.top = window.cameraSettings.top;
  camera.bottom = window.cameraSettings.bottom;
  camera.near = window.cameraSettings.near;
  camera.far = window.cameraSettings.far;
  camera.updateProjectionMatrix();
  cameraHelper.update(); // Ensure the helper updates with the camera
}

function adjustCameraToFitObject(object, camera) {
  if (!object.geometry.boundingSphere) {
    object.geometry.computeBoundingSphere(); // Compute if not already available
  }
  const radius = object.geometry.boundingSphere.radius;
  const viewHeight = camera.top - camera.bottom;
  const viewWidth = camera.right - camera.left;
  const aspect = viewWidth / viewHeight;

  if (aspect > 1.0) {
    // Fit based on height
    camera.zoom = viewHeight / (2 * radius);
  } else {
    // Fit based on width
    camera.zoom = viewWidth / (2 * radius);
  }

  camera.updateProjectionMatrix();
}

// Adjust the camera to fit the torus
adjustCameraToFitObject(torus, camera);

function animate() {
  requestAnimationFrame(animate);

  updateCamera(); // Ensure camera updates when settings change

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  controls.update();

  renderer.render(scene, camera);
}

animate();
