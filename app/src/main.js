// Wires the Vice Cover Studio editor: photos in, layout/size/grade/caption controls, a live
// preview canvas you can click and drag, and a full-resolution PNG export. A `?shot=` query
// sets up a fixed scene for a screenshot instead (see ./shots.js).
import { SIZES, LAYOUTS, GRADES, blankPanel, panelRects, drawCover } from './cover.js';
import { runShot } from './shots.js';

const SAMPLES = [
  { name: 'boulevard', label: 'Boulevard' },
  { name: 'pier', label: 'Pier' },
  { name: 'neon', label: 'Neon street' },
  { name: 'skyline', label: 'Sunset road' },
];

const state = {
  layout: 'poster',
  size: 'square',
  grade: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'Ocean Drive',
  panels: [blankPanel(0), blankPanel(0), blankPanel(0)],
  selected: 0,
};
let photos = []; // { img, name, sample } in load order
let fontsReady = false;

const canvas = document.getElementById('cover');
const tray = document.getElementById('tray');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Keeps the panel list the length the current layout needs, preserving crops. */
function resizePanels() {
  const count = panelRects(state.layout, 100, 100).length;
  while (state.panels.length < count) state.panels.push(blankPanel(photos.length ? 0 : -1));
  state.panels.length = count;
  state.selected = Math.min(state.selected, count - 1);
}

/** Repaints the preview at the export size; the CSS scales it down to fit the stage. */
function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  drawCover(canvas, state, photos.map((p) => p.img));
  syncZoom();
}

function syncZoom() {
  const panel = state.panels[state.selected];
  if (panel) zoomInput.value = String(panel.zoom);
}

/** Adds a photo to the tray and, when it is the first, fills every panel with it. */
function addPhoto(img, name, sample = false) {
  photos.push({ img, name, sample });
  if (photos.length === 1) state.panels.forEach((p) => { p.photo = 0; });
  renderTray();
  redraw();
}

function renderTray() {
  tray.replaceChildren();
  photos.forEach((photo, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = photo.sample ? `${photo.name} (sample)` : photo.name;
    if (photo.sample) button.classList.add('sample');
    if (state.panels.some((p) => p.photo === i)) button.classList.add('used');
    const thumb = document.createElement('img');
    thumb.src = photo.img.src;
    thumb.alt = photo.name;
    button.appendChild(thumb);
    button.addEventListener('click', () => assignPhoto(i));
    tray.appendChild(button);
  });
}

/** Puts photo `i` in the selected panel, or in every panel when "same photo" is on. */
function assignPhoto(i) {
  if (document.getElementById('samePhoto').checked) {
    state.panels.forEach((p) => { p.photo = i; });
  } else {
    state.panels[state.selected].photo = i;
  }
  renderTray();
  redraw();
}

function fillAll(i) {
  state.panels.forEach((p) => { p.photo = i; });
  renderTray();
  redraw();
}

/** Deals the loaded photos across the panels in a new random order. */
function shufflePhotos() {
  if (!photos.length) return;
  state.panels.forEach((p) => { p.photo = Math.floor(Math.random() * photos.length); });
  renderTray();
  redraw();
}

/** Builds a row of toggle buttons for one option group. `attr` names the data attribute. */
function buildChoices(element, entries, current, onPick, attr = 'choice') {
  element.replaceChildren();
  for (const [key, entry] of Object.entries(entries)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = entry.label;
    button.dataset[attr] = key;
    button.setAttribute('aria-pressed', String(key === current));
    button.addEventListener('click', () => {
      onPick(key);
      element.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
    });
    element.appendChild(button);
  }
}

function buildControls() {
  buildChoices(document.getElementById('layouts'), LAYOUTS, state.layout, (key) => {
    state.layout = key;
    resizePanels();
    redraw();
  });
  buildChoices(document.getElementById('sizes'), SIZES, state.size, (key) => {
    state.size = key;
    redraw();
  });
  buildChoices(document.getElementById('grades'), GRADES, state.grade, (key) => {
    state.grade = key;
    redraw();
  }, 'grade');
}

/** Which panel, if any, holds the point (in canvas pixels). */
function panelAt(x, y) {
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  return rects.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}

/** Converts a pointer event to canvas pixels. */
function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - box.left) * (canvas.width / box.width),
    y: (event.clientY - box.top) * (canvas.height / box.height),
  };
}

let dragging = null;
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const index = panelAt(point.x, point.y);
  if (index < 0) return;
  state.selected = index;
  syncZoom();
  canvas.setPointerCapture(event.pointerId);
  dragging = { x: point.x, y: point.y, index };
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const point = canvasPoint(event);
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const rect = rects[dragging.index];
  const panel = state.panels[dragging.index];
  panel.offsetX += (point.x - dragging.x) / rect.w;
  panel.offsetY += (point.y - dragging.y) / rect.h;
  dragging = { x: point.x, y: point.y, index: dragging.index };
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const panel = state.panels[state.selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * Math.exp(-event.deltaY * 0.0012)));
  redraw();
}, { passive: false });

document.getElementById('photo').addEventListener('change', async (event) => {
  for (const file of event.target.files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      addPhoto(img, file.name);
    } catch {
      status.textContent = `Could not read ${file.name}.`;
    }
  }
  event.target.value = '';
});
document.getElementById('fillAll').addEventListener('click', () => {
  const current = state.panels[state.selected].photo;
  if (current >= 0) fillAll(current);
});
document.getElementById('shuffle').addEventListener('click', shufflePhotos);
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
zoomInput.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomInput.value);
  redraw();
});
document.getElementById('resetPanel').addEventListener('click', () => {
  Object.assign(state.panels[state.selected], blankPanel(state.panels[state.selected].photo));
  redraw();
});
document.getElementById('clearPhoto').addEventListener('click', () => {
  state.panels[state.selected].photo = -1;
  renderTray();
  redraw();
});

/** Renders the cover at full export size and downloads it as a PNG. */
function exportPng() {
  const size = SIZES[state.size];
  const offscreen = document.createElement('canvas');
  offscreen.width = size.width;
  offscreen.height = size.height;
  drawCover(offscreen, state, photos.map((p) => p.img));
  offscreen.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed in this browser.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.width}x${size.height}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${size.width}x${size.height}.png`;
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
  }, 'image/png');
}
document.getElementById('export').addEventListener('click', exportPng);

/** Test hook: lets an automated check render an export and read it back. */
window.__coverApp = {
  state,
  get photos() { return photos; },
  get fontsReady() { return fontsReady; },
  exportDataURL() {
    const size = SIZES[state.size];
    const offscreen = document.createElement('canvas');
    offscreen.width = size.width;
    offscreen.height = size.height;
    drawCover(offscreen, state, photos.map((p) => p.img));
    return offscreen.toDataURL('image/png');
  },
};

/** Loads the four bundled sample photos into the tray. */
async function loadSamples() {
  for (const sample of SAMPLES) {
    try {
      const img = await loadImage(`samples/${sample.name}.jpg`);
      addPhoto(img, sample.label, true);
    } catch {
      // A missing sample never blocks the editor; the user's own photos still work.
    }
  }
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  runShot(shot, query, {
    loadSample: (name) => loadImage(`samples/${name}.jpg`),
    applyScene: async (scene) => {
      for (const name of scene.photos) {
        const img = await loadImage(`samples/${name}.jpg`);
        addPhoto(img, name, true);
      }
      state.layout = scene.layout;
      state.size = scene.size;
      state.grade = scene.grade;
      state.title = scene.title;
      state.subtitle = scene.subtitle;
      resizePanels();
      scene.photos.forEach((name, i) => {
        const index = photos.findIndex((p) => p.name === name);
        if (index >= 0 && state.panels[i]) state.panels[i].photo = index;
      });
      (scene.pans ?? []).forEach((pan, i) => {
        if (state.panels[i]) {
          state.panels[i].offsetX = pan.x;
          state.panels[i].offsetY = pan.y;
        }
      });
      document.getElementById('title').value = scene.title;
      document.getElementById('subtitle').value = scene.subtitle;
      buildControls();
      redraw();
    },
    markReady: () => {
      requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
    },
  });
} else {
  buildControls();
  loadSamples().then(redraw);
  redraw();
}

// The poster lettering needs its webfonts before the first paint looks right.
Promise.all([
  document.fonts.load('80px Anton'),
  document.fonts.load('80px "Archivo Black"'),
]).then(() => {
  fontsReady = true;
  redraw();
});
