import { GUI } from 'lil-gui';
import { DATASETS, getStoredDataset, setStoredDataset, exportDataset } from '../data/data.js';

export const settings = {
  showLabelOnIntersection: true,
  currentDataset: getStoredDataset(),
};

export const gui = new GUI();

export function initializeGUI({ onDatasetChange, onExport }) {
  gui.add(settings, 'showLabelOnIntersection').name('Show Label on Intersection');

  // Dataset selection
  gui
    .add(settings, 'currentDataset', DATASETS)
    .name('Dataset')
    .onChange(value => {
      setStoredDataset(value);
      onDatasetChange(value);
    });

  // Export button
  gui.add({ exportDataset: onExport }, 'exportDataset').name('Export Dataset');

  return { gui };
}
