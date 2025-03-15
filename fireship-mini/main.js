import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new THREE.Scene();

const width = window.innerWidth;
const height = window.innerHeight;

const camera = new THREE.OrthographicCamera(
  width / -20,
  width / 20,
  height / 20,
  height / -20,
  0,
  1000
);
camera.position.setZ(10);
camera.position.setY(2);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('canvas'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);

renderer.render(scene, camera);

const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xff6347, side: THREE.DoubleSide });
const torus = new THREE.Mesh(geometry, material);
scene.add(torus);

const pointLight = new THREE.PointLight(0xffffff, 2, 0, 0);
pointLight.position.set(20, 0, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(pointLight, ambientLight);

const pointLightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);
const cameraHelper = new THREE.CameraHelper(camera);
scene.add(pointLightHelper, gridHelper, cameraHelper);

const controls = new OrbitControls(camera, renderer.domElement);

function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;

  controls.update();
  renderer.render(scene, camera);
}

animate();
