import * as THREE from 'three';

export class Container {
  constructor(size, position = { x: 0, y: 0, z: 0 }) {
    this.size = size;
    this.position = position;

    this.mesh = this.createContainerMesh();
    this.items = [];
    this.updatePosition();
  }

  createContainerMesh() {
    const geometry = new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });
    const containerMesh = new THREE.Mesh(geometry, material);

    const faceGeometry = new THREE.PlaneGeometry(this.size.width, this.size.height);
    const faceMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
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

  updateSize() {
    // Update container mesh geometry
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth);

    // Update front face geometry
    this.frontFace.geometry.dispose();
    this.frontFace.geometry = new THREE.PlaneGeometry(this.size.width, this.size.height);
    this.frontFace.position.set(0, 0, this.size.depth / 2 + 1);
    this.updatePosition();

    // Update positions of contained items
    this.items.forEach(item => {
      item.setContainerSize(this.size);
      item.updatePosition();
    });
  }

  addItem(item) {
    this.items.push(item);
    this.mesh.add(item.mesh);
  }
}
