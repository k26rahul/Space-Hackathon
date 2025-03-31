import * as THREE from 'three';

export class Container {
  constructor(size, position = { x: 0, y: 0, z: 0 }) {
    this.size = size;
    this.position = position;

    this.mesh = this.createContainerMesh();
    this.updatePosition();
  }

  createContainerMesh() {
    const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });
    const containerMesh = new THREE.Mesh(geometry, material);

    const faceGeometry = new THREE.PlaneGeometry(this.size, this.size);
    const faceMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const frontFace = new THREE.Mesh(faceGeometry, faceMaterial);
    frontFace.position.set(0, 0, this.size / 2 + 1); // +1 to avoid z-fighting
    containerMesh.add(frontFace);

    return containerMesh;
  }

  updatePosition() {
    const offset = this.size / 2;
    this.mesh.position.set(
      this.position.x + offset,
      this.position.y + offset,
      this.position.z - offset
    );
  }

  addItem(item) {
    this.mesh.add(item.mesh);
  }
}
