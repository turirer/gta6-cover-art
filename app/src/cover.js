// Renders a GTA-style poster cover: photo panels in a comic-book grid, a sunset or neon colour
// grade over each panel, a white poster frame, and a big bold title with a kicker line.
// Everything is drawn with the canvas 2D API, so the same code paints the live preview and the
// full-resolution PNG the user exports. No Rockstar artwork, logo or font is used anywhere:
// the lettering is Anton and Archivo Black, both shipped under the SIL Open Font License.

/** The export sizes the app offers, in pixels. */
export const SIZES = {
  square: { label: '1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: '1080 x 1350', width: 1080, height: 1350 },
  wide: { label: '1920 x 1080', width: 1920, height: 1080 },
};

/** The panel layouts, each a function of the cover size returning panel rectangles. */
export const LAYOUTS = {
  poster: {
    label: 'Poster',
    panels: (w, h, g) => [
      { x: 0, y: 0, w, h: Math.round(h * 0.6) },
      { x: 0, y: Math.round(h * 0.6) + g, w: Math.round((w - g) / 2), h: h - Math.round(h * 0.6) - g },
      { x: Math.round((w - g) / 2) + g, y: Math.round(h * 0.6) + g, w: w - Math.round((w - g) / 2) - g, h: h - Math.round(h * 0.6) - g },
    ],
  },
  triptych: {
    label: 'Triptych',
    panels: (w, h, g) => {
      const pw = Math.round((w - 2 * g) / 3);
      return [
        { x: 0, y: 0, w: pw, h },
        { x: pw + g, y: 0, w: pw, h },
        { x: 2 * (pw + g), y: 0, w: w - 2 * (pw + g), h },
      ];
    },
  },
  duo: {
    label: 'Duo',
    panels: (w, h, g) => {
      const pw = Math.round((w - g) / 2);
      return [
        { x: 0, y: 0, w: pw, h },
        { x: pw + g, y: 0, w: w - pw - g, h },
      ];
    },
  },
  solo: {
    label: 'Solo',
    panels: (w, h) => [{ x: 0, y: 0, w, h }],
  },
};

/** The colour grades: each paints translucent light over a panel after its photo. */
export const GRADES = {
  sunset: {
    label: 'Sunset',
    tint: (ctx, r) => {
      const wash = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      wash.addColorStop(0, 'rgba(255, 150, 60, 0.05)');
      wash.addColorStop(0.55, 'rgba(255, 110, 60, 0.16)');
      wash.addColorStop(1, 'rgba(205, 40, 120, 0.42)');
      ctx.fillStyle = wash;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    },
    shadow: 'rgba(255, 60, 120, 0.85)',
  },
  neon: {
    label: 'Neon',
    tint: (ctx, r) => {
      const wash = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      wash.addColorStop(0, 'rgba(0, 225, 255, 0.20)');
      wash.addColorStop(0.5, 'rgba(120, 40, 220, 0.12)');
      wash.addColorStop(1, 'rgba(255, 0, 140, 0.34)');
      ctx.fillStyle = wash;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    },
    shadow: 'rgba(0, 229, 255, 0.9)',
  },
  vice: {
    label: 'Vice',
    tint: (ctx, r) => {
      const wash = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      wash.addColorStop(0, 'rgba(0, 205, 180, 0.20)');
      wash.addColorStop(0.55, 'rgba(20, 40, 90, 0.06)');
      wash.addColorStop(1, 'rgba(255, 70, 150, 0.30)');
      ctx.fillStyle = wash;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    },
    shadow: 'rgba(255, 70, 150, 0.85)',
  },
  noir: {
    label: 'Noir',
    tint: (ctx, r) => {
      const wash = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      wash.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
      wash.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
      ctx.fillStyle = wash;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    },
    shadow: 'rgba(255, 255, 255, 0.55)',
  },
};

/** A fresh panel slot: which photo it shows, and how that photo is cropped inside it. */
export function blankPanel(photo = 0) {
  return { photo, zoom: 1, offsetX: 0, offsetY: 0 };
}

/** Panel rectangles for a layout at a cover size, with the gutter between panels. */
export function panelRects(layout, width, height) {
  const gutter = Math.max(4, Math.round(width * 0.012));
  return LAYOUTS[layout].panels(width, height, gutter);
}

/** Draws one photo into a panel rect, cover-fit, zoomed, and panned by its offsets. */
function drawPanelPhoto(ctx, photo, rect, panel, gradeName) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo) {
    const iw = photo.naturalWidth || photo.width;
    const ih = photo.naturalHeight || photo.height;
    const base = Math.max(rect.w / iw, rect.h / ih);
    const scale = base * panel.zoom;
    const dw = iw * scale;
    const dh = ih * scale;
    // Offsets are fractions of the panel; clamp them so the photo always covers the panel.
    const maxX = Math.max(0, (dw - rect.w) / 2);
    const maxY = Math.max(0, (dh - rect.h) / 2);
    const ox = Math.max(-maxX, Math.min(maxX, panel.offsetX * rect.w));
    const oy = Math.max(-maxY, Math.min(maxY, panel.offsetY * rect.h));
    if (gradeName === 'noir') ctx.filter = 'grayscale(1) contrast(1.18) brightness(1.05)';
    ctx.drawImage(photo, rect.x + (rect.w - dw) / 2 + ox, rect.y + (rect.h - dh) / 2 + oy, dw, dh);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#241534';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  GRADES[gradeName].tint(ctx, rect);
  // A vignette pulls the eye to the middle of each panel.
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Wraps `text` into at most two lines that fit `maxWidth` at `size` in the Anton face. */
function wrapTitle(ctx, text, maxWidth, size) {
  ctx.font = `${size}px Anton, sans-serif`;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !line) {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
    if (lines.length === 2) break;
  }
  if (line && lines.length < 2) lines.push(line);
  return lines;
}

/** Draws the kicker and the big title across the foot of the cover. */
function drawTitleBlock(ctx, width, height, title, subtitle, gradeName) {
  const text = title.trim().toUpperCase();
  const kick = subtitle.trim().toUpperCase();
  if (!text && !kick) return;
  // A dark scrim behind the lettering keeps it readable over any photo.
  const scrim = ctx.createLinearGradient(0, height * 0.62, 0, height);
  scrim.addColorStop(0, 'rgba(10, 4, 18, 0)');
  scrim.addColorStop(1, 'rgba(10, 4, 18, 0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, height * 0.62, width, height * 0.38);

  const margin = width * 0.045;
  const maxWidth = width - margin * 2;
  const baseline = height - height * 0.045;
  let size = height * 0.115;
  let lines = [];
  if (text) {
    while (size > 14) {
      lines = wrapTitle(ctx, text, maxWidth, size);
      const widest = Math.max(...lines.map((l) => {
        ctx.font = `${size}px Anton, sans-serif`;
        return ctx.measureText(l).width;
      }));
      if (widest <= maxWidth && lines.length <= 2) break;
      size -= 2;
    }
  }
  const shadow = GRADES[gradeName].shadow;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (kick) {
    const kickSize = Math.max(14, height * 0.026);
    ctx.font = `${Math.round(kickSize)}px "Archivo Black", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(kickSize * 0.35)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = '#ffd7ef';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = kickSize * 0.4;
    const kickY = baseline - lines.length * size * 0.98 - kickSize * 1.1;
    ctx.fillText(kick, margin, kickY);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    ctx.shadowBlur = 0;
    // A thin rule under the kicker, in the grade's accent.
    ctx.fillStyle = shadow;
    ctx.fillRect(margin, kickY + kickSize * 0.55, Math.min(maxWidth * 0.22, 220), Math.max(2, height * 0.004));
  }
  if (text) {
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(12, 4, 20, 0.9)';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.shadowColor = shadow;
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.045;
    const lineHeight = size * 0.98;
    lines.forEach((line, i) => {
      const y = baseline - (lines.length - 1 - i) * lineHeight;
      ctx.strokeText(line, margin, y);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, margin, y);
    });
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
}

/**
 * Draws the whole cover onto `canvas` at the canvas's own pixel size.
 * `state` is { layout, grade, title, subtitle, panels }, `photos` the loaded images.
 */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#12081c';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? blankPanel();
    const photo = photos[panel.photo] ?? null;
    drawPanelPhoto(ctx, photo, rect, panel, state.grade);
  });
  // Thin white seams and a poster frame, in the style of a printed cover.
  const seam = Math.max(2, Math.round(w * 0.003));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = seam;
  rects.forEach((rect) => ctx.strokeRect(rect.x + seam / 2, rect.y + seam / 2, rect.w - seam, rect.h - seam));
  const frame = Math.max(6, Math.round(w * 0.008));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = frame;
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
  drawTitleBlock(ctx, w, h, state.title, state.subtitle, state.grade);
}
