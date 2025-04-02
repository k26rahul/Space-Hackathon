import { copyToClipboard } from '../utils.js';

export const TOTAL_SETS = 6;
export const DEFAULT_SET = 2;
export const STORAGE_KEY = 'selectedSetNumber';

export function getStoredSetNumber() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored) : DEFAULT_SET;
}

export function setStoredSetNumber(setNumber) {
  localStorage.setItem(STORAGE_KEY, setNumber.toString());
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
