// Image storage in IndexedDB. Images are resized before saving so the
// browser's storage quota goes a long way.

const DB_NAME = "atelier";
const STORE = "images";
let dbPromise;

function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function tx(mode, fn) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const t = database.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result?.result);
    t.onerror = () => reject(t.error);
  });
}

const cache = new Map();

export async function saveImage(id, dataUrl) {
  await tx("readwrite", (s) => s.put(dataUrl, id));
  cache.set(id, dataUrl);
}

export async function getImage(id) {
  if (cache.has(id)) return cache.get(id);
  const value = await tx("readonly", (s) => s.get(id));
  if (value) cache.set(id, value);
  return value;
}

export async function deleteImage(id) {
  cache.delete(id);
  await tx("readwrite", (s) => s.delete(id));
}

export async function clearImages() {
  cache.clear();
  await tx("readwrite", (s) => s.clear());
}

// Read a File, scale it down to maxSize px on the long edge, return a JPEG data URL.
export function resizeFile(file, maxSize = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that image."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Pull a small palette of dominant colours from an image data URL.
export function extractPalette(dataUrl, count = 5) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      // Bucket colours into a coarse grid, then pick the most common buckets
      // that are not too similar to each other.
      const buckets = new Map();
      for (let i = 0; i < data.length; i += 4) {
        const key = [data[i] >> 4, data[i + 1] >> 4, data[i + 2] >> 4].join(",");
        const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
        b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2];
        buckets.set(key, b);
      }
      const sorted = [...buckets.values()]
        .sort((a, b) => b.n - a.n)
        .map((b) => [b.r / b.n, b.g / b.n, b.b / b.n]);
      const picked = [];
      for (const c of sorted) {
        if (picked.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 48)) picked.push(c);
        if (picked.length === count) break;
      }
      resolve(picked.map((c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")));
    };
    img.onerror = () => resolve([]);
    img.src = dataUrl;
  });
}

// Fill every <img data-img="id"> inside root from IndexedDB.
export async function hydrateImages(root = document) {
  const nodes = root.querySelectorAll("img[data-img]");
  await Promise.all(
    [...nodes].map(async (el) => {
      const src = await getImage(el.dataset.img);
      if (src) el.src = src;
      else el.closest("[data-img-wrap]")?.classList.add("is-missing");
    })
  );
}
