/**
 * IndexedDB Local GIS Storage
 * Menyimpan dataset spasial berukuran besar (misal puluhan ribu titik pokok sawit)
 * secara persisten di browser agar data tidak hilang saat halaman di-refresh,
 * tab ditutup, atau Vite melakukan hot-reload.
 */

const DB_NAME = "BUM_GIS_STORAGE";
const DB_VERSION = 1;
const STORE_NAME = "datasets";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB tidak didukung"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

/**
 * Simpan dataset ke IndexedDB secara asinkron
 */
export async function setGisDataset<T = any>(key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Gagal menyimpan '${key}':`, err);
  }
}

/**
 * Ambil dataset dari IndexedDB
 */
export async function getGisDataset<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Gagal membaca '${key}':`, err);
    return null;
  }
}

/**
 * Hapus dataset dari IndexedDB
 */
export async function clearGisDataset(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Gagal menghapus '${key}':`, err);
  }
}

// Alias singkat untuk pemanggilan fleksibel
export const dbGet = getGisDataset;
export const dbSet = setGisDataset;
export const dbClear = clearGisDataset;

