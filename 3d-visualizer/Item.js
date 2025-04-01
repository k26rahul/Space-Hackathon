import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const colors = [
  0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800, 0x8800ff, 0x0088ff,
  0x88ff00, 0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff, 0xffaa00, 0xaa00ff,
  0x00aaff, 0xaaff00,
];

export class Item {
  constructor(name, size, position) {
    this.name = name;
    this.size = size;
    this.position = position;
    this.color = colors[Math.floor(Math.random() * colors.length)];

    this.mesh = this.createItemMesh();
    this.label = this.createLabel();
    this.mesh.add(this.label);

    this.container = null;
    this.intersecting = false; // flag to indicate intersection with other items
  }

  setContainer(container) {
    this.container = container;
    this.updatePosition();
  }

  createItemMesh() {
    const geometry = new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.8,
    });
    return new THREE.Mesh(geometry, material);
  }

  createLabel() {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = this.name;
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, this.size.height / 2 + 5, 0);
    return label;
  }

  updatePosition() {
    const { width, height, depth } = this.size;
    const { x, y, z } = this.position;
    const containerSize = this.container.size;
    const offsetX = containerSize.width / 2;
    const offsetY = containerSize.height / 2;
    const offsetZ = containerSize.depth / 2;

    const posX = x + width / 2 - offsetX;
    const posY = y + height / 2 - offsetY;
    const posZ = z - depth / 2 + offsetZ;

    this.mesh.position.set(posX, posY, posZ);
  }

  updateSize() {
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth);
    this.label.position.set(0, this.size.height / 2 + 5, 0);
    this.updatePosition();
  }

  updateVisual() {
    if (this.intersecting) {
      this.label.element.classList.add('flashing'); // apply flashing animation
    } else {
      this.label.element.classList.remove('flashing'); // remove flashing animation
    }
  }
}
