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
};

const ITEM_SIZE_STEP = 5;
const ITEM_POSITION_STEP = 5;

const gui = new GUI();

export function setupControls({ containers, onDatasetChange }) {
  gui.add(settings, 'showLabelOnIntersection').name('Show Label on Intersection');

  const itemsFolder = gui.addFolder('Items');
  itemsFolder.close();

  const sizeAndPositionFolder = itemsFolder.addFolder('Size and Position');
  sizeAndPositionFolder.close();

  const visibilitySubFolder = itemsFolder.addFolder('Visibility');
  visibilitySubFolder.close();

  const visibilityControls = {};

  const toggleAllControl = visibilitySubFolder
    .add(settings, 'allItemsVisible')
    .name('Toggle All')
    .onChange(value => {
      Object.entries(visibilityControls).forEach(([name, control]) => {
        control.setValue(value);
      });
    });

  // Add Animation button
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

  return;

  settings.currentContainerId = containers[0]?.id || null;
  let selectedContainer = null;

  // Dataset selection dropdown
  gui
    .add(settings, 'currentDataset', DATASETS)
    .name('Dataset')
    .onChange(value => {
      setStoredDataset(value);
      onDatasetChange(value).then(newContainers => {
        containers = newContainers;
        settings.currentContainerId = newContainers[0]?.id || null;
        loadContainer(settings.currentContainerId);
      });
    });

  function loadContainer(containerId) {
    cleanupItemControls();
    selectedContainer = containers.find(c => c.id === containerId);
    if (!selectedContainer) return;
    selectedContainer.items.forEach(item => setupItemControls(item));
    settings.allItemsVisible = true;
    toggleAllControl?.updateDisplay();
  }

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
    while (itemsFolder.children.length > 0) {
      itemsFolder.children[0].destroy();
    }

    // Clear visibility controls cache
    Object.keys(visibilityControls).forEach(key => delete visibilityControls[key]);

    // Recreate the visibility subfolder
    visibilitySubFolder = itemsFolder.addFolder('Visibility');
    visibilitySubFolder.close();
  }

  const itemsControllers = [];

  function setupItemControls(item) {
    addVisibilityControl(item);

    // Add Clone button as first control
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

    const posControllers = [];

    // Items Size
    const sizeFolder = sizeAndPositionFolder.addFolder('Size');
    sizeFolder.open(); // Keep size folder open

    Object.keys(item.size).forEach(dim => {
      const { min, max } = item.getSizeRange(dim);
      sizeFolder.add(item.size, dim, min, max, ITEM_SIZE_STEP).onChange(value => {
        item.updateSize();
        updateItemPosRanges(item, posControllers); // update item position sliders when item size changes
      });
    });

    // Items Position
    const posFolder = sizeAndPositionFolder.addFolder('Position');
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

  function switchContainers(newContainers) {
    containers = newContainers;
    settings.currentContainerId = newContainers[0]?.id || null;
    loadContainer(settings.currentContainerId);
  }

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

  function addVisibilityControl(item) {
    const control = visibilitySubFolder
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
