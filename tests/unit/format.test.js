import { describe, expect, it } from "vitest";
import { formatSize, isPdf, outputName } from "../../src/format.js";

describe("format", () => {
  it("erkennt PDFs über MIME-Typ oder Endung", () => {
    expect(isPdf({ type: "application/pdf", name: "x" })).toBe(true);
    expect(isPdf({ type: "", name: "Skript.PDF" })).toBe(true);
    expect(isPdf({ type: "image/png", name: "bild.png" })).toBe(false);
  });
  it("hängt -zugeschnitten an den Dateinamen", () => {
    expect(outputName("A205.pdf")).toBe("A205-zugeschnitten.pdf");
    expect(outputName("Folien.PDF")).toBe("Folien-zugeschnitten.pdf");
    expect(outputName("ohne-endung")).toBe("ohne-endung-zugeschnitten.pdf");
  });
  it("formatiert Größen deutsch", () => {
    expect(formatSize(10)).toBe("1 KB");
    expect(formatSize(2048)).toBe("2 KB");
    expect(formatSize(6.6 * 1024 * 1024)).toBe("6,6 MB");
  });
});
