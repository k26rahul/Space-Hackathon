import { GUI } from 'lil-gui';
import { GuiTextDisplay } from './GuiTextDisplay.js';
import {
  DATASETS,
  getStoredDataset,
  setStoredDataset,
  exportDataset,
  generateRandomItemData,
} from '../data/data.js';

const gui = new GUI();

export const settings = {
  showLabelOnIntersection: true,
  currentDataset: getStoredDataset(),
  allItemsVisible: true,
};

gui.add(settings, 'showLabelOnIntersection').name('Show Label on Intersection');

// Step control variables
const ITEM_SIZE_STEP = 5;
const ITEM_POSITION_STEP = 5;

// Declare folders before usage
const itemsControlFolder = gui.addFolder('Items');
itemsControlFolder.close();

const visibilityFolder = gui.addFolder('Visibility');
visibilityFolder.close();

const visibilityControls = {};

const toggleAllControl = visibilityFolder
  .add(settings, 'allItemsVisible')
  .name('Toggle All')
  .onChange(value => {
    // Update all items and their controls
    Object.entries(visibilityControls).forEach(([name, control]) => {
      control.setValue(value);
      // No need to call updateVisual() here since setValue will trigger the control's onChange
    });
  });

export function setupControls({ containers, onDatasetChange }) {
  settings.currentContainerId = containers[0]?.id || null;
  let selectedContainer = null;

  function loadContainer(containerId) {
    cleanupItemControls(); // remove previously displayed controls
    selectedContainer = containers.find(c => c.id === containerId);
    if (!selectedContainer) return;
    selectedContainer.items.forEach(item => setupItemControls(item));
    settings.allItemsVisible = true;
    toggleAllControl?.updateDisplay();
  }

  // Overwrite existing dataset selector to use new callback
  gui
    .add(settings, 'currentDataset', DATASETS)
    .name('Dataset')
    .onChange(value => loadDatasetAndSwitch(value));

  // Container selection dropdown
  gui
    .add(
      settings,
      'currentContainerId',
      containers.map(c => c.id)
    )
    .name('Container')
    .onChange(value => loadContainer(value));

  function cleanupItemControls() {
    // Remove all item folders
    while (itemsControlFolder.children.length > 0) {
      itemsControlFolder.children[0].destroy();
    }

    // Remove all visibility controls except Toggle All
    while (visibilityFolder.children.length > 1) {
      visibilityFolder.children[1].destroy();
    }

    // Clear visibility controls cache
    Object.keys(visibilityControls).forEach(key => delete visibilityControls[key]);
  }

  const itemsControllers = [];

  function setupItemControls(item) {
    addVisibilityControl(item);

    const itemFolder = itemsControlFolder.addFolder(item.name);
    itemFolder.close();

    // Add Clone button as first control
    itemFolder
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

    const posControllers = [];

    // Items Size
    const sizeFolder = itemFolder.addFolder('Size');
    sizeFolder.open(); // Keep size folder open

    Object.keys(item.size).forEach(dim => {
      const { min, max } = item.getSizeRange(dim);
      sizeFolder.add(item.size, dim, min, max, ITEM_SIZE_STEP).onChange(value => {
        item.updateSize();
        updateItemPosRanges(item, posControllers); // update item position sliders when item size changes
      });
    });

    // Items Position
    const posFolder = itemFolder.addFolder('Position');
    posFolder.open(); // Keep position folder open

    Object.keys(item.position).forEach(axis => {
      const { min, max } = item.getPositionRange(axis);
      const ctrl = posFolder
        .add(item.position, axis, min, max, ITEM_POSITION_STEP)
        .onChange(value => {
          item.updatePosition();
        });
      posControllers.push({ axis, ctrl });
    });

    itemsControllers.push({ item, posControllers }); // store only position controllers
  }

  function loadDatasetAndSwitch(dataset) {
    cleanupItemControls();
    onDatasetChange(dataset);
  }

  // Expose a helper to switch to new containers after dataset change
  function switchContainers(newContainers) {
    containers = newContainers;
    settings.currentContainerId = newContainers[0]?.id || null;
    loadContainer(settings.currentContainerId);
  }

  // Initial load
  loadContainer(settings.currentContainerId);

  // Add Reload button
  gui
    .add(
      {
        reload: () => loadDataset(settings.currentDataset),
      },
      'reload'
    )
    .name('Reload Dataset');

  // Position controllers for each item
  // Format: [{ item, posControllers: [{ axis, ctrl }] }, ...]
  // axis: 'x', 'y', 'z'
  function updateItemPosRanges(item, posControllers) {
    posControllers.forEach(({ axis, ctrl }) => {
      const { min, max } = item.getPositionRange(axis);
      ctrl.min(min).max(max).updateDisplay();
    });
  }

  // Add Animation button
  visibilityFolder
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
          controls.forEach((control, index) => {
            setTimeout(() => {
              control.setValue(true);
            }, 200 * (index + 1));
          });
        },
      },
      'animateVisibility'
    )
    .name('Animate Visibility');

  function addVisibilityControl(item) {
    const control = visibilityFolder
      .add(item, 'visible')
      .name(item.name)
      .onChange(() => {
        item.updateVisual();
        // Update all-visible state and its display
        settings.allItemsVisible = selectedContainer.items.every(i => i.visible);
        toggleAllControl.updateDisplay();
      });
    visibilityControls[item.name] = control;
  }

  function createNewItem(itemData) {
    const newItem = selectedContainer.addItem(itemData);
    setupItemControls(newItem);
    return newItem;
  }

  // Add New Item button
  gui
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

  // Intersections
  const intersectionsFolder = gui.addFolder('Intersections');
  intersectionsFolder.close();

  const intersectionsDisplay = new GuiTextDisplay(intersectionsFolder);

  // Item Properties
  const itemPropertiesFolder = gui.addFolder('Item Properties');
  itemPropertiesFolder.close();

  const propertiesDisplay = new GuiTextDisplay(itemPropertiesFolder);

  // Add Export button to Item Properties folder
  gui
    .add(
      {
        exportItems: () => exportDataset(selectedContainer.items),
      },
      'exportItems'
    )
    .name('Export Items Data');

  // Update function for intersections display
  function updateIntersections() {
    let html = '';
    selectedContainer.items.forEach(item => {
      html += `<strong>${item.name}:</strong> `;
      html += item.intersections.length > 0 ? item.intersections.join(', ') : 'None';
      html += '<br/>';
    });
    intersectionsDisplay.update(html);
  }

  // Update function for item properties display
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

  return {
    updateIntersections,
    updateItemProperties,
    switchContainers,
  };
}
