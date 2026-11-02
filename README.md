# Zuschnitt

Zerlegt Folien-Handouts (z. B. „2 Folien pro Seite") in einzelne Folienseiten – komplett im Browser.
Port von `crop.py` (PyMuPDF) auf [MuPDF.js](https://github.com/ArtifexSoftware/mupdf.js), also dieselbe
MuPDF-Engine als WebAssembly. Dateien werden nicht hochgeladen.

## Was passiert

1. Auf jeder Seite werden gezeichnete Rechtecke gesucht, die > 500 × 280 pt groß und ~16:9 sind (Toleranz 0,1).
   Pro Zeile (y ± 2 pt) zählt ein Rahmen.
2. Ein Rahmen ist leer, wenn sein Inneres (2 pt Rand abgezogen) bei 20 dpi höchstens zwei Bytewerte hat.
   Leere Rahmen werden übersprungen.
3. Jeder übrige Rahmen wird eine eigene Seite (Seite wird übernommen, MediaBox auf den Rahmen gesetzt).

Abweichung zum Python-Original: Dort wird das Pixel-Rechteck nach außen gerundet, sodass die Rahmenlinie
mitgerendert wird und leere Rahmen praktisch nie erkannt werden. Hier wird nach innen gerundet – leere
Folien fliegen tatsächlich raus. Sonst ist das Ergebnis pixelgleich (geprüft am A205-Handout: 22 → 43 Seiten,
Python: 44 inkl. leerer Schlussfolie).

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Unit-Tests (Vitest), inkl. Abgleich mit echtem Handout falls HANDOUT_PDF gesetzt bzw. in ~/Downloads
npm run test:e2e   # Build + Preview + Playwright (Startup, Upload, Download, Fehlerfälle)
npm run build      # -> dist/
```

## Aufbau

| Datei | Zweck |
|---|---|
| `src/crop.js` | Zuschneide-Logik (läuft in Node und im Browser) |
| `src/worker.js` | Web Worker, lädt MuPDF-WASM, damit die UI nicht blockiert |
| `src/main.js` | UI: Drag & Drop, Status, Download |
| `vercel.json` | Security-Header (CSP mit `wasm-unsafe-eval`), Caching |

## Deployment

Live: https://zuschnitt-pdf.vercel.app (Vercel-Projekt `zuschnitt`).

```bash
vercel deploy --prod   # Token z. B. über VERCEL_TOKEN
```

Auto-Deploy bei Push ist noch nicht aktiv: Dafür muss im Vercel-Account eine GitHub-Login-Connection
hinterlegt und das Repo im Dashboard verbunden werden.

## Lizenz

AGPL-3.0-or-later, weil MuPDF unter AGPL steht.
