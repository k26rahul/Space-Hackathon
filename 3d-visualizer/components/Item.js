import * as THREE from 'three';

import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import { ColorProvider } from '../utils.js';
import { settings } from '../gui/gui.js';

const colorProvider = new ColorProvider();

export class Item {
  constructor(name, size, position) {
    this.name = name;
    this.size = size;
    this.position = position;
    this.color = colorProvider.getNextColor();
    this.container = null;

    this.mesh = this.createItemMesh();
    this.label = this.createLabel();
    this.mesh.add(this.label);

    this.visible = true;
    this.hovered = false;
    this.intersecting = false;
    this.intersections = [];
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
    this.updateLabelText(labelDiv);
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, this.size.height / 2 + 5, 0);
    label.visible = false; // Initially hide the label
    return label;
  }

  updateLabelText(labelDiv) {
    const sizeInfo = `${this.size.width}x${this.size.height}x${this.size.depth}`;
    const posInfo = `(${this.position.x},${this.position.y},${this.position.z})`;
    labelDiv.textContent = `${this.name}\n${sizeInfo}\n${posInfo}`;
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
    // Update solid mesh
    this.mesh.children[0].geometry.dispose();
    this.mesh.children[0].geometry = new THREE.BoxGeometry(
      this.size.width,
      this.size.height,
      this.size.depth
    );

    // Update wireframe mesh
    this.mesh.children[1].geometry.dispose();
    this.mesh.children[1].geometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth)
    );

    this.label.position.set(0, this.size.height / 2 + 5, 0);
    this.updatePosition();
  }

  updateVisual() {
    this.mesh.visible = this.visible;
    this.updateLabelVisibility();
    this.updateMeshOpacity();
  }

  updateLabelVisibility() {
    let showLabel = false;
    if (this.visible) {
      // Only show label if item is visible
      if (this.intersecting && settings.showLabelOnIntersection) {
        this.label.element.classList.add('flashing'); // apply flashing animation
        showLabel = true;
      } else {
        this.label.element.classList.remove('flashing'); // remove flashing animation
      }

      if (this.hovered) {
        // Always show label when hovered
        showLabel = true;
      }

      // Update label text when visible
      this.updateLabelText(this.label.element);
    }
    this.label.visible = showLabel;
  }

  updateMeshOpacity() {
    if (this.hovered) {
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
    return { min: 5, max: this.container.size[dim] };
  }

  setupTransformControl(camera, renderer, orbitControls) {
    const control = new TransformControls(camera, renderer.domElement);
    control.attach(this.mesh);

    control.addEventListener('dragging-changed', event => {
      orbitControls.enabled = !event.value;
    });

    control.addEventListener('objectChange', () => {
      if (control.mode === 'translate') {
        const STEP = 1; // Step size for snapping
        this.mesh.position.x = Math.round(this.mesh.position.x / STEP) * STEP;
        this.mesh.position.y = Math.round(this.mesh.position.y / STEP) * STEP;
        this.mesh.position.z = Math.round(this.mesh.position.z / STEP) * STEP;
      }

      // Update the item's position based on the mesh's new position
      this.updatePositionFromMesh();
    });

    return control;
  }
}
