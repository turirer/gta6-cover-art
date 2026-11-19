// Fixed scenes for screenshots: ?shot=editor shows the editor with a multi-panel scene;
// ?shot=cover shows the cover alone, at its export size. `layout`, `size`, `grade`, `title`,
// `subtitle`, a comma list of `photos` (sample names), and `pans` (per-panel `x,y` offsets,
// semicolon-separated, as fractions of the panel) pick the scene. window.__shotReady is
// set once the fonts are in, the photos are loaded and the cover is painted.
export async function runShot(shot, query, hooks) {
  const scene = {
    layout: query.get('layout') ?? 'poster',
    size: query.get('size') ?? 'square',
    grade: query.get('grade') ?? 'sunset',
    title: query.get('title') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'Ocean Drive',
    photos: (query.get('photos') ?? 'boulevard,pier,neon').split(',').map((s) => s.trim()).filter(Boolean),
    pans: (query.get('pans') ?? '').split(';').map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
    }),
  };
  await hooks.applyScene(scene);
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('80px "Archivo Black"'),
      document.fonts.ready,
    ]);
  } catch {
    // Fallback lettering still paints; the screenshot stays valid.
  }
  hooks.markReady();
}
