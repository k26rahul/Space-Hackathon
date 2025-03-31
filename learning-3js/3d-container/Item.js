import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { hexToRgb } from './utils.js';

export class Item {
  constructor(name, size, position, color) {
    this.name = name;
    this.size = size;
    this.position = position;
    this.color = color;

    this.mesh = this.createItemMesh();
    this.label = this.createLabel();
    this.mesh.add(this.label);

    this.containerSize = null;
  }

  setContainerSize(containerSize) {
    this.containerSize = containerSize;
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
    labelDiv.style.borderColor = hexToRgb(this.color);
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, this.size.height / 2 + 5, 0);
    return label;
  }

  updatePosition() {
    const containerOffset = this.containerSize / 2;
    const { width, height, depth } = this.size;
    const { x, y, z } = this.position;

    const posX = x + width / 2 - containerOffset;
    const posY = y + height / 2 - containerOffset;
    const posZ = z - depth / 2 + containerOffset;

    this.mesh.position.set(posX, posY, posZ);
  }

  updateSize() {
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth);
    this.label.position.set(0, this.size.height / 2 + 5, 0);
    this.updatePosition();
  }
}
