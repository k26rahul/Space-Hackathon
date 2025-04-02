const EXPORT_SET = 2;

export const dataLoaded = fetch(`./data/set${EXPORT_SET}.json`)
  .then(res => res.json())
  .catch(error => {
    console.error('Error loading item set:', error);
    throw error;
  });
