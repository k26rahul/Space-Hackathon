import { GUI } from 'lil-gui';
import { GuiTextDisplay } from './GuiTextDisplay.js';
import {
  DATASETS,
  getStoredDataset,
  setStoredDataset,
  exportDataset,
  generateRandomItemData,
} from '../data/data.js';

export const settings = {
  allItemsVisible: true,
  showLabelOnIntersection: true,
  currentDataset: getStoredDataset(),
  selectedContainerId: null,
};

const ITEM_SIZE_STEP = 5;
const ITEM_POSITION_STEP = 5;

const gui = new GUI();

export function setupControls({ containers, onDatasetChange }) {
  settings.selectedContainerId = containers[0]?.id || null;
  let selectedContainer = null;

  function switchContainers(newContainers) {
    containers = newContainers;
    settings.selectedContainerId = newContainers[0]?.id || null;
    loadContainer(settings.selectedContainerId);
  }

  function loadContainer(containerId) {
    cleanupItemControls();
    selectedContainer = containers.find(c => c.id === containerId);
    selectedContainer.items.forEach(item => setupItemControls(item));
    settings.allItemsVisible = true;
    toggleAllControl.updateDisplay();
  }

  function cleanupItemControls() {
    while (sizeAndPositionFolder.children.length > 0) {
      sizeAndPositionFolder.children[0].destroy();
    }
    while (visibilitySubFolder.children.length > 2) {
      visibilitySubFolder.children[2].destroy();
    }
    Object.keys(visibilityControls).forEach(key => delete visibilityControls[key]);
  }

  function createNewItem(itemData) {
    const newItem = selectedContainer.addItem(itemData);
    setupItemControls(newItem);
    return newItem;
  }

  // Format: [{ item, posControllers: [{ axis, ctrl }] }, ...]
  // axis: 'x', 'y', 'z'
  const itemsControllers = [];

  function setupItemControls(item) {
    function updateItemPosRanges(item, posControllers) {
      posControllers.forEach(({ axis, ctrl }) => {
        const { min, max } = item.getPositionRange(axis);
        ctrl.min(min).max(max).updateDisplay();
      });
    }

    // Add visibility toggle
    const control = visibilitySubFolder
      .add(item, 'visible')
      .name(item.name)
      .onChange(() => {
        item.updateVisual();
        settings.allItemsVisible = selectedContainer.items.every(i => i.visible);
        toggleAllControl.updateDisplay();
      });
    visibilityControls[item.name] = control;

    const itemFolder = sizeAndPositionFolder.addFolder(item.name);
    itemFolder.close();

    // Add Clone button
    sizeAndPositionFolder
      .add(
        {
          clone: () => {
            const newItemData = {
              size: { ...item.size },
              position: { ...item.position },
            };
            createNewItem(newItemData);
          },
        },
        'clone'
      )
      .name('Clone');

    // Items Size
    const sizeFolder = itemFolder.addFolder('Size');
    sizeFolder.open();

    Object.keys(item.size).forEach(dim => {
      const { min, max } = item.getSizeRange(dim);
      sizeFolder.add(item.size, dim, min, max, ITEM_SIZE_STEP).onChange(value => {
        item.updateSize();
        updateItemPosRanges(item, posControllers); // update item position sliders when item size changes
      });
    });

    // Items Position
    const posFolder = itemFolder.addFolder('Position');
    posFolder.open();

    const posControllers = [];
    Object.keys(item.position).forEach(axis => {
      const { min, max } = item.getPositionRange(axis);
      const ctrl = posFolder
        .add(item.position, axis, min, max, ITEM_POSITION_STEP)
        .onChange(value => {
          item.updatePosition();
        });
      posControllers.push({ axis, ctrl });
    });

    itemsControllers.push({ item, posControllers });
  }

  gui.add(settings, 'showLabelOnIntersection').name('Show Label on Intersection');

  const itemsFolder = gui.addFolder('Items');
  itemsFolder.close();

  // Add New Item button
  itemsFolder
    .add(
      {
        addItem: () => {
          const newItemData = generateRandomItemData();
          createNewItem(newItemData);
        },
      },
      'addItem'
    )
    .name('Add New Item');

  const sizeAndPositionFolder = itemsFolder.addFolder('Size and Position');
  sizeAndPositionFolder.close();

  const visibilitySubFolder = itemsFolder.addFolder('Visibility');
  visibilitySubFolder.close();

  // Add Animate Visibility button
  visibilitySubFolder
    .add(
      {
        animateVisibility: () => {
          // Get all visibility controls
          const controls = Object.values(visibilityControls);
          if (controls.length === 0) return;

          // First, hide all items
          controls.forEach(control => {
            control.setValue(false);
          });

          // Then show them one by one with delay
          const DELAY = 200;
          controls.forEach((control, index) => {
            setTimeout(() => {
              control.setValue(true);
            }, DELAY * (index + 1));
          });
        },
      },
      'animateVisibility'
    )
    .name('Animate Visibility');

  const visibilityControls = {};
  const toggleAllControl = visibilitySubFolder
    .add(settings, 'allItemsVisible')
    .name('Toggle All')
    .onChange(value => {
      Object.entries(visibilityControls).forEach(([name, control]) => {
        control.setValue(value);
      });
    });

  // Dataset selection dropdown
  gui
    .add(settings, 'currentDataset', DATASETS)
    .name('Dataset')
    .onChange(value => {
      setStoredDataset(value);
      onDatasetChange(value).then(newContainers => {
        switchContainers(newContainers);
      });
    });

  // Container selection dropdown
  gui
    .add(
      settings,
      'selectedContainerId',
      containers.map(c => c.id)
    )
    .name('Container')
    .onChange(value => loadContainer(value));

  // Intersections
  const intersectionsFolder = itemsFolder.addFolder('Intersections');
  const intersectionsDisplay = new GuiTextDisplay(intersectionsFolder);
  intersectionsFolder.close();

  // Item Properties
  const itemPropertiesFolder = itemsFolder.addFolder('Item Properties');
  const propertiesDisplay = new GuiTextDisplay(itemPropertiesFolder);
  itemPropertiesFolder.close();

  // Add Export Items Data button
  gui
    .add(
      {
        exportItems: () => exportDataset(selectedContainer.items),
      },
      'exportItems'
    )
    .name('Export Items Data');

  function updateIntersections() {
    let html = '';
    selectedContainer.items.forEach(item => {
      html += `<strong>${item.name}:</strong> `;
      html += item.intersections.length > 0 ? item.intersections.join(', ') : 'None';
      html += '<br/>';
    });
    intersectionsDisplay.update(html);
  }

  function updateItemProperties() {
    let html = '';
    let totalItemVolume = 0;
    const containerVolume =
      selectedContainer.size.width * selectedContainer.size.height * selectedContainer.size.depth;

    html += '<strong>Format</strong><br/>';
    html += 'Size: width, height, depth<br/>';
    html += 'Position: x, y, z<br/><br/>';

    selectedContainer.items.forEach(item => {
      const itemVolume = item.size.width * item.size.height * item.size.depth;
      totalItemVolume += itemVolume;

      html += `<strong>${item.name}</strong><br/>`;
      html += `Size: ${item.size.width}, ${item.size.height}, ${item.size.depth}<br/>`;
      html += `Position: ${item.position.x}, ${item.position.y}, ${item.position.z}<br/>`;
      html += '<br/>';
    });

    html += `<strong>Volume Statistics</strong><br/>`;
    html += `Container Volume: ${containerVolume / 1000}K cubic units<br/>`;
    html += `Total Items Volume: ${totalItemVolume / 1000}K cubic units<br/>`;
    html += `Space Utilization: ${((totalItemVolume / containerVolume) * 100).toFixed(1)}%<br/>`;

    propertiesDisplay.update(html);
  }

  loadContainer(settings.selectedContainerId);

  return {
    updateIntersections,
    updateItemProperties,
    switchContainers,
  };
}
