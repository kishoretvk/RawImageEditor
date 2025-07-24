// IndexedDB utility for offline cache
export function saveToIndexedDB(key, value) {
  const request = window.indexedDB.open('RawConverterDB', 1);
  request.onupgradeneeded = function(e) {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('files')) {
      db.createObjectStore('files');
    }
  };
  request.onsuccess = function(e) {
    const db = e.target.result;
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(value, key);
  };
}

export function getFromIndexedDB(key, callback) {
  const request = window.indexedDB.open('RawConverterDB', 1);
  request.onsuccess = function(e) {
    const db = e.target.result;
    const tx = db.transaction('files', 'readonly');
    const getReq = tx.objectStore('files').get(key);
    getReq.onsuccess = function() {
      callback(getReq.result);
    };
  };
}
