import { copyToClipboard } from '../utils.js';

export const TOTAL_SETS = 6;
export const DEFAULT_SET = 2;
export const STORAGE_KEY = 'selectedDatasetIndex';

export function getStoredDatasetIndex() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored) : DEFAULT_SET; // fallback to DEFAULT_SET if not found
}

export function setStoredDatasetIndex(datasetIndex) {
  localStorage.setItem(STORAGE_KEY, datasetIndex.toString());
}

export function loadDataset(setNumber) {
  return fetch(`./data/set${setNumber}.json`)
    .then(res => res.json())
    .catch(error => {
      console.error('Error loading item set:', error);
      throw error;
    });
}

export function exportDataset(items) {
  const itemsData = items.map(item => ({
    size: { ...item.size },
    position: { ...item.position },
  }));

  const jsonString = JSON.stringify({ items: itemsData });
  copyToClipboard(jsonString);
}
