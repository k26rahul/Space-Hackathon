import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ColorProvider } from './utils.js';

const colorProvider = new ColorProvider();
const showLabelsAlways = false; // true: show labels always, false: show labels only during intersections

export class Item {
  constructor(name, size, position) {
    this.name = name;
    this.size = size;
    this.position = position;
    this.color = colorProvider.getNextColor();

    this.mesh = this.createItemMesh();
    this.label = this.createLabel();
    if (this.label) {
      this.mesh.add(this.label);
      // Initially hide label if we're not showing always
      if (!showLabelsAlways) {
        this.label.visible = false;
      }
    }

    this.container = null;
    this.intersecting = false; // flag to indicate intersection with other items
    this.isHovered = false;
  }

  setContainer(container) {
    this.container = container;
    this.updatePosition();
  }

  createItemMesh() {
    const geometry = new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth);

    // Create solid mesh
    const solidMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.8,
    });
    const solidMesh = new THREE.Mesh(geometry, solidMaterial);

    // Create wireframe mesh
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), wireframeMaterial);

    // Create a group to hold both meshes
    const group = new THREE.Group();
    group.add(solidMesh);
    group.add(wireframe);
    return group;
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

  updatePositionFromMesh() {
    const containerSize = this.container.size;
    const offsetX = containerSize.width / 2;
    const offsetY = containerSize.height / 2;
    const offsetZ = containerSize.depth / 2;

    this.position.x = this.mesh.position.x + offsetX - this.size.width / 2;
    this.position.y = this.mesh.position.y + offsetY - this.size.height / 2;
    this.position.z = this.mesh.position.z - offsetZ + this.size.depth / 2;
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
      if (!showLabelsAlways) {
        this.label.visible = true; // show label during intersection
      }
    } else {
      this.label.element.classList.remove('flashing'); // remove flashing animation
      if (!showLabelsAlways) {
        this.label.visible = false; // hide label when not intersecting
      }
    }

    // Show label and make less transparent on hover
    if (this.isHovered) {
      this.label.visible = true;
      // Update solid mesh opacity
      this.mesh.children[0].material.opacity = 1.0;
      // Update wireframe opacity
      this.mesh.children[1].material.opacity = 0.8;
    } else {
      // Reset solid mesh opacity
      this.mesh.children[0].material.opacity = 0.8;
      // Reset wireframe opacity
      this.mesh.children[1].material.opacity = 0.5;
    }
  }

  getPositionRange(axis) {
    const containerSize = this.container.size;
    if (axis === 'x') return { min: 0, max: containerSize.width - this.size.width };
    if (axis === 'y') return { min: 0, max: containerSize.height - this.size.height };
    if (axis === 'z') return { min: -(containerSize.depth - this.size.depth), max: 0 };
  }

  getSizeRange(dim) {
    return { min: 1, max: this.container.size[dim] };
  }
}
