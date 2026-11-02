import { expect, test } from "@playwright/test";
import * as mupdf from "mupdf";
import { makeHandoutPdf } from "../fixtures/handout.js";

test("Startseite lädt und die WebAssembly-Engine startet", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zuschnitt");
  await expect(page.locator("#engine")).toHaveAttribute("data-state", "ready");
  expect(errors).toEqual([]);
});

test("Handout hochladen, zuschneiden und herunterladen", async ({ page }) => {
  await page.goto("/");
  await page.locator("#file").setInputFiles({
    name: "vorlesung.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(makeHandoutPdf(mupdf, ["full", "half"])),
  });
  const job = page.locator(".job").first();
  await expect(job).toHaveAttribute("data-state", "done");
  await expect(job.locator(".job-status")).toContainText("2 Seiten → 3 Folien");
  await expect(job.locator(".job-notes")).toContainText("S. 2: leerer Rahmen übersprungen");

  const [download] = await Promise.all([page.waitForEvent("download"), job.locator(".job-download").click()]);
  expect(download.suggestedFilename()).toBe("vorlesung-zugeschnitten.pdf");
  const out = mupdf.Document.openDocument(await (await download.createReadStream()).toArray().then(Buffer.concat), "application/pdf");
  expect(out.countPages()).toBe(3);
});

test("Nicht-PDFs werden abgelehnt", async ({ page }) => {
  await page.goto("/");
  await page.locator("#file").setInputFiles({ name: "bild.png", mimeType: "image/png", buffer: Buffer.from("x") });
  await expect(page.locator(".job").first()).toHaveAttribute("data-state", "error");
  await expect(page.locator(".job-status").first()).toHaveText("Keine PDF-Datei");
});

test("kaputte PDF meldet Fehler statt zu hängen", async ({ page }) => {
  await page.goto("/");
  await page.locator("#file").setInputFiles({ name: "kaputt.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7 kaputt") });
  await expect(page.locator(".job").first()).toHaveAttribute("data-state", "error");
});
