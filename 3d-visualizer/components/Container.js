import * as THREE from 'three';
import { axisToDimension } from '../utils.js';
import { Item } from './Item.js'; // Add this import at the top

export class Container {
  constructor({ size, position }) {
    this.size = size; // { width, height, depth }
    this.position = position; // {x, y, z}

    this.items = []; // [<Item> ...]
    this.mesh = this.createContainerMesh();
    this.updatePosition();
    this.sandboxMode = false;
  }

  createContainerMesh() {
    const geometry = new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth);

    // Create an invisible mesh for the container
    const containerMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const containerMesh = new THREE.Mesh(geometry, containerMaterial);

    // Create wireframe edges without diagonal lines, slightly larger than the container
    const scale = 1.001; // Make wireframe 0.1% larger
    const wireframeGeometry = new THREE.BoxGeometry(
      this.size.width * scale,
      this.size.height * scale,
      this.size.depth * scale
    );
    const edges = new THREE.EdgesGeometry(wireframeGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const wireframe = new THREE.LineSegments(edges, edgeMaterial);
    containerMesh.add(wireframe);

    // Create a front face with a transparent material
    const faceGeometry = new THREE.PlaneGeometry(this.size.width, this.size.height);
    const faceMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false, // Add this line to make the face non-blocking
    });
    this.frontFace = new THREE.Mesh(faceGeometry, faceMaterial);
    this.frontFace.position.set(0, 0, this.size.depth / 2 + 1); // +1 to avoid z-fighting
    containerMesh.add(this.frontFace);

    return containerMesh;
  }

  updatePosition() {
    this.mesh.position.set(
      this.position.x + this.size.width / 2,
      this.position.y + this.size.height / 2,
      this.position.z - this.size.depth / 2
    );
  }

  addItem(itemData) {
    const item = new Item(itemData);
    this.items.push(item);
    this.mesh.add(item.mesh);
    item.setContainer(this);
    return item;
  }

  cleanupItems() {
    this.items.forEach(item => {
      item.destroy();
      this.mesh.remove(item.mesh);
    });
    this.items = [];
  }

  checkIntersections() {
    if (!this.sandboxMode) return; // Skip expensive checks if not in sandbox mode

    // Reset intersecting flag and intersections list for all items
    this.items.forEach(item => {
      item.intersecting = false;
      item.intersections = [];
    });

    // Custom intersection check between items
    for (let i = 0; i < this.items.length; i++) {
      const itemA = this.items[i];
      const boxA = new THREE.Box3().setFromObject(itemA.mesh);
      for (let j = i + 1; j < this.items.length; j++) {
        const itemB = this.items[j];
        const boxB = new THREE.Box3().setFromObject(itemB.mesh);
        const overlapX = Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x);
        const overlapY = Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y);
        const overlapZ = Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z);
        if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
          itemA.intersecting = true;
          itemB.intersecting = true;
          itemA.intersections.push(itemB.name);
          itemB.intersections.push(itemA.name);
        }
      }
    }

    // Check intersection with container boundaries
    const containerMin = {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z - this.size.depth,
    };
    const containerMax = {
      x: this.position.x + this.size.width,
      y: this.position.y + this.size.height,
      z: this.position.z,
    };
    const relaxation = 0.1; // minimum relaxation margin to prevent false positives
    this.items.forEach(item => {
      const box = new THREE.Box3().setFromObject(item.mesh);
      if (
        box.min.x < containerMin.x - relaxation ||
        box.max.x > containerMax.x + relaxation ||
        box.min.y < containerMin.y - relaxation ||
        box.max.y > containerMax.y + relaxation ||
        box.min.z < containerMin.z - relaxation ||
        box.max.z > containerMax.z + relaxation
      ) {
        item.intersecting = true;
        item.intersections.push('container');
      }
    });

    // Update visuals for all items
    this.items.forEach(item => item.updateVisual());
  }

  getPositionRange(axis) {
    const dimension = axisToDimension[axis];
    const val = this.size[dimension];
    return { min: -val, max: val };
  }

  setupMousePicking(camera, renderer) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('mousemove', event => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Reset hover state for all items
      this.items.forEach(item => {
        item.hovered = false;
      });

      // Find intersected objects
      const allIntersects = raycaster.intersectObjects(this.mesh.children, true);

      // Get all items that are intersected
      for (const intersect of allIntersects) {
        const item = this.items.find(item =>
          item.mesh.children.some(child => child === intersect.object)
        );
        if (item && item.visible) {
          item.hovered = true;
          break;
        }
      }
    });
  }
}
