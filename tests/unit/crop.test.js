import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as mupdf from "mupdf";
import { describe, expect, it } from "vitest";
import { cropHandout, findFrames, isSlideFrame, toPdfSpace } from "../../src/crop.js";
import { FRAME, makeHandoutPdf } from "../fixtures/handout.js";

const open = (bytes) => mupdf.Document.openDocument(bytes, "application/pdf");

function crop(pages) {
  const logs = [];
  const result = cropHandout(mupdf, makeHandoutPdf(mupdf, pages), (l) => logs.push(l));
  return { ...result, logs };
}

describe("isSlideFrame", () => {
  it("akzeptiert große 16:9-Rechtecke", () => {
    expect(isSlideFrame([34, 62, 561.58, 358.76])).toBe(true);
  });
  it("lehnt zu kleine oder falsch proportionierte Rechtecke ab", () => {
    expect(isSlideFrame([0, 0, 480, 270])).toBe(false);
    expect(isSlideFrame([0, 0, 600, 450])).toBe(false);
    expect(isSlideFrame([0, 0, 527, 1])).toBe(false);
  });
});

describe("findFrames", () => {
  it("findet beide Rahmen, oben nach unten, ohne Doppelte", () => {
    const doc = open(makeHandoutPdf(mupdf, ["full"]));
    const frames = findFrames(mupdf, doc.loadPage(0));
    expect(frames).toHaveLength(2);
    expect(frames[0][1]).toBeLessThan(frames[1][1]);
    expect(frames[0][2] - frames[0][0]).toBeCloseTo(FRAME.w, 1);
  });
});

describe("toPdfSpace", () => {
  it("rechnet Seitenkoordinaten in den PDF-Nutzerraum um", () => {
    const doc = open(makeHandoutPdf(mupdf, ["full"]));
    const r = toPdfSpace(mupdf, doc.loadPage(0), [34, 62, 561, 359]);
    expect(r[0]).toBeCloseTo(34);
    expect(r[1]).toBeCloseTo(841.89 - 359, 1);
    expect(r[3]).toBeCloseTo(841.89 - 62, 1);
  });
});

describe("cropHandout", () => {
  it("macht aus jeder befüllten Folie eine Seite in Foliengröße", () => {
    const { bytes, pagesIn, pagesOut } = crop(["full", "full"]);
    expect([pagesIn, pagesOut]).toEqual([2, 4]);
    const out = open(bytes);
    for (let i = 0; i < out.countPages(); i++) {
      const [x0, y0, x1, y1] = out.loadPage(i).getBounds();
      expect(x1 - x0).toBeCloseTo(FRAME.w, 1);
      expect(y1 - y0).toBeCloseTo(FRAME.h, 1);
    }
  });

  it("überspringt leere Rahmen und warnt bei Seiten ohne Rahmen", () => {
    const { pagesOut, logs } = crop(["half", "none", "full"]);
    expect(pagesOut).toBe(3);
    expect(logs).toEqual([
      { level: "info", page: 1, text: "leerer Rahmen übersprungen" },
      { level: "warn", page: 2, text: "kein Folienrahmen gefunden" },
    ]);
  });

  it("übernimmt den Folieninhalt (rote Fläche bleibt sichtbar)", () => {
    const out = open(crop(["full"]).bytes);
    const pix = out.loadPage(0).toPixmap(mupdf.Matrix.identity, mupdf.ColorSpace.DeviceRGB);
    const px = pix.getPixels();
    const at = (x, y) => Array.from(px.slice((y * pix.getWidth() + x) * 3, (y * pix.getWidth() + x) * 3 + 3));
    // Rotes Rechteck liegt 40/60pt vom Folienrand (unten links) entfernt.
    expect(at(100, pix.getHeight() - 100)).toEqual([255, 0, 0]);
  });

  it("wirft bei Dateien ohne Folien eine verständliche Meldung", () => {
    expect(() => crop(["none"])).toThrow(/Keine Folien gefunden/);
  });

  it("wirft bei kaputten Dateien", () => {
    expect(() => cropHandout(mupdf, new TextEncoder().encode("kein pdf"))).toThrow();
  });
});

// Abgleich mit echtem Handout, falls lokal vorhanden (nicht im Repo, urheberrechtlich geschützt).
const REAL = process.env.HANDOUT_PDF ?? path.join(os.homedir(), "Downloads", "A205-lecture-04A-handout2.pdf");
describe.skipIf(!fs.existsSync(REAL))("echtes Handout A205", () => {
  it("liefert 43 Folienseiten (22 Seiten, letzte Folie leer)", () => {
    const logs = [];
    const { pagesIn, pagesOut, bytes } = cropHandout(mupdf, fs.readFileSync(REAL), (l) => logs.push(l));
    expect([pagesIn, pagesOut]).toEqual([22, 43]);
    expect(logs).toEqual([{ level: "info", page: 22, text: "leerer Rahmen übersprungen" }]);
    const [x0, y0, x1, y1] = open(bytes).loadPage(0).getBounds();
    expect((x1 - x0) / (y1 - y0)).toBeCloseTo(16 / 9, 1);
  });
});
