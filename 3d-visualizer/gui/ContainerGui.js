import { GuiTextDisplay } from './GuiTextDisplay.js';
import { generateRandomItemData } from '../data/data.js';

const ITEM_SIZE_STEP = 5;
const ITEM_POSITION_STEP = 5;

export class ContainerGui {
  constructor(container, gui) {
    this.container = container;
    this.visibilityControls = {};
    this.posControllers = new Map();
    this.setupGui(gui);
  }

  setupGui(gui) {
    const containerFolder = gui.addFolder(`#${this.container.id}`);
    containerFolder.close();

    // Items folder
    const itemsFolder = containerFolder.addFolder('Items');
    itemsFolder.close();
    this.setupItemControls(itemsFolder);

    // Visibility folder
    const visibilityFolder = containerFolder.addFolder('Visibility');
    visibilityFolder.close();
    this.setupVisibilityControls(visibilityFolder);

    // Intersections folder
    const intersectionsFolder = containerFolder.addFolder('Intersections');
    intersectionsFolder.close();
    this.intersectionsDisplay = new GuiTextDisplay(intersectionsFolder);

    // Container Stats folder
    const statsFolder = containerFolder.addFolder('Container Stats');
    statsFolder.close();
    this.statsDisplay = new GuiTextDisplay(statsFolder);

    this.folders = [
      containerFolder,
      itemsFolder,
      visibilityFolder,
      intersectionsFolder,
      statsFolder,
    ];
  }

  setupItemControls(itemsFolder) {
    // New Item button at the top of itemsFolder
    itemsFolder
      .add(
        {
          addItem: () => {
            const newItemData = generateRandomItemData();
            const newItem = this.container.addItem(newItemData);
            this.setupItemFolder(newItem, itemsFolder);
          },
        },
        'addItem'
      )
      .name('Add New Item');

    this.container.itemsArray.forEach(item => {
      this.setupItemFolder(item, itemsFolder);
    });
  }

  setupItemFolder(item, itemsFolder) {
    const itemFolder = itemsFolder.addFolder(item.id);
    itemFolder.close();

    // Clone button at the top of itemFolder
    itemFolder
      .add(
        {
          clone: () => {
            const newItemData = {
              size: { ...item.size },
              position: { ...item.position },
            };
            const newItem = this.container.addItem(newItemData);
            this.setupItemFolder(newItem, itemsFolder);
          },
        },
        'clone'
      )
      .name('Clone');

    // Size controls
    const sizeFolder = itemFolder.addFolder('Size');
    sizeFolder.close();
    Object.keys(item.size).forEach(dim => {
      const { min, max } = item.getSizeRange(dim);
      sizeFolder.add(item.size, dim, min, max, ITEM_SIZE_STEP).onChange(() => {
        item.updateSize();
        this.updateItemPosRanges(item); // Update position ranges when size changes
      });
    });

    // Position controls
    const posFolder = itemFolder.addFolder('Position');
    posFolder.close();
    const positionControllers = [];
    Object.keys(item.position).forEach(axis => {
      const { min, max } = item.getPositionRange(axis);
      const ctrl = posFolder
        .add(item.position, axis, min, max, ITEM_POSITION_STEP)
        .onChange(() => item.updatePosition());
      positionControllers.push(ctrl);
    });
    this.posControllers.set(item, positionControllers);
  }

  updateItemPosRanges(item) {
    const controllers = this.posControllers.get(item);
    controllers.forEach((ctrl, index) => {
      const axis = ['x', 'y', 'z'][index];
      const { min, max } = item.getPositionRange(axis);
      ctrl.min(min).max(max).updateDisplay();
    });
  }

  setupVisibilityControls(visibilityFolder) {
    // Animate Visibility button at the top of visibilityFolder
    visibilityFolder
      .add(
        {
          animateVisibility: () => {
            const controls = Object.values(this.visibilityControls);
            if (controls.length === 0) return;

            // First, hide all items
            controls.forEach(control => control.setValue(false));

            // Then show them one by one with delay
            const DELAY = 200;
            controls.forEach((control, index) => {
              setTimeout(() => control.setValue(true), DELAY * (index + 1));
            });
          },
        },
        'animateVisibility'
      )
      .name('Animate Visibility');

    visibilityFolder
      .add({ allVisible: true }, 'allVisible')
      .name('Toggle All')
      .onChange(value => {
        Object.values(this.visibilityControls).forEach(ctrl => ctrl.setValue(value));
      });

    this.container.itemsArray.forEach(item => {
      const control = visibilityFolder
        .add(item, 'visible')
        .name(item.id)
        .onChange(() => item.updateVisual());
      this.visibilityControls[item.id] = control;
    });
  }

  updateDisplays() {
    this.updateIntersections();
    this.updateContainerStats();
  }

  updateIntersections() {
    let html = '';
    let hasIntersections = false;

    this.container.itemsArray.forEach(item => {
      if (item.intersections.length > 0) {
        html += `<strong>${item.id}:</strong> `;
        html += `${item.intersections.join(', ')}<br/>`;
        hasIntersections = true;
      }
    });

    if (!hasIntersections) {
      html = 'No intersections detected';
    }

    this.intersectionsDisplay.update(html);
  }

  updateContainerStats() {
    let html = '';
    const containerVolume =
      this.container.size.width * this.container.size.height * this.container.size.depth;

    const totalItemVolume = this.container.itemsArray.reduce((acc, item) => {
      return acc + item.size.width * item.size.height * item.size.depth;
    }, 0);

    html += `Total Items: ${this.container.itemsArray.length}<br/>`;
    html += `Container Volume: ${containerVolume / 1000}K cubic units<br/>`;
    html += `Total Items Volume: ${totalItemVolume / 1000}K cubic units<br/>`;
    html += `Space Utilization: ${((totalItemVolume / containerVolume) * 100).toFixed(1)}%<br/>`;

    this.statsDisplay.update(html);
  }

  destroy() {
    this.folders.forEach(folder => folder.destroy());
    this.posControllers.clear();
  }
}
