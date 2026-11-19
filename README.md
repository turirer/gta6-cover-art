[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/turirer/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/turirer/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover Studio

A web app that turns your photos and a caption into GTA-style poster cover art — the
multi-panel poster look, bold caption lettering, and a Vice City sunset or neon colour
grade — exported as a PNG to share. Built for the
[make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01).

New to make.fun? Start here: https://make.fun/r/d6btpjsv

## What it does

- **Any photo**: add your own photos from your machine (or try the four bundled samples).
  Click a photo to put it in the selected panel, or fill every panel with one photo.
- **Crop and position each panel**: click a panel in the preview to select it, drag to move
  its photo, scroll to zoom, or use the zoom slider. Reset any panel in one click.
- **Multi-panel layouts**: Poster (hero + two panels), Triptych, Duo, and Solo.
- **Colour grades**: Sunset, Neon, Vice, and Noir, each painted over the photos with a
  vignette, white panel seams and a poster frame.
- **Bold lettering**: a kicker line and a big Anton title, auto-fitted to one or two lines,
  with an outline and a grade-coloured drop shadow.
- **Post sizes**: 1080 × 1080, 1080 × 1350, and 1920 × 1080, exported as PNG in one click.

## Try it

No build step, no network. Serve `app/` with any static server — `node serve.ts` serves it
on http://localhost:8080 — and open `app/index.html` in desktop Chrome. Everything the app
loads (scripts, styles, the Anton and Archivo Black fonts under `app/fonts/`, the sample
photos) is a file under `app/`, and your photos are read on your own machine, never uploaded.

## Original design

The lettering uses Anton and Archivo Black, both shipped under the SIL Open Font License
(see `app/fonts/OFL.txt`). The sample photos were made with an image model. Nothing here
copies Rockstar Games' logos, wordmarks, official artwork, characters, or fonts.

## Files

- `app/index.html`, `app/style.css` — the editor page and its styling.
- `app/src/cover.js` — the cover renderer (layouts, grades, lettering).
- `app/src/main.js` — the editor wiring (photos, panels, export).
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `app/fonts/` — Anton and Archivo Black (OFL).
- `app/samples/` — four sample photos.
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to the output directory
  and writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — screenshots of the app and the covers it exported.
