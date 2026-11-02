import "./style.css";
import { formatSize, isPdf, outputName } from "./format.js";

const MAX_BYTES = 300 * 1024 * 1024;

const drop = document.querySelector("#drop");
const input = document.querySelector("#file");
const list = document.querySelector("#jobs");
const engine = document.querySelector("#engine");
const template = document.querySelector("#job-template");

const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
const jobs = new Map();
let nextId = 1;
// mupdf lädt per Top-Level-Await; Nachrichten davor gehen im Worker verloren.
let markReady;
const engineReady = new Promise((resolve) => (markReady = resolve));

worker.onmessage = ({ data }) => {
  if (data.type === "ready") {
    engine.textContent = "Engine bereit";
    engine.dataset.state = "ready";
    markReady();
    return;
  }
  const job = jobs.get(data.id);
  if (!job) return;
  if (data.type === "log") addNote(job, data.log);
  if (data.type === "done") finish(job, data);
  if (data.type === "error") fail(job, data.message);
};

worker.onerror = (event) => {
  engine.textContent = "Engine konnte nicht geladen werden";
  engine.dataset.state = "error";
  for (const job of jobs.values()) {
    if (job.el.dataset.state === "working") fail(job, event.message || "WebAssembly nicht verfügbar");
  }
};

function createJob(file) {
  const el = template.content.firstElementChild.cloneNode(true);
  el.querySelector(".job-name").textContent = file.name;
  el.querySelector(".job-size").textContent = formatSize(file.size);
  list.prepend(el);
  const job = { id: nextId++, file, el };
  jobs.set(job.id, job);
  return job;
}

function setStatus(job, state, text) {
  job.el.dataset.state = state;
  job.el.querySelector(".job-status").textContent = text;
}

function addNote(job, { level, page, text }) {
  const li = document.createElement("li");
  li.dataset.level = level;
  li.textContent = `S. ${page}: ${text}`;
  job.el.querySelector(".job-notes").append(li);
}

function finish(job, { bytes, pagesIn, pagesOut }) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = job.el.querySelector(".job-download");
  link.href = url;
  link.download = outputName(job.file.name);
  link.hidden = false;
  setStatus(job, "done", `${pagesIn} → ${pagesOut} Seiten · ${formatSize(bytes.byteLength)}`);
}

function fail(job, message) {
  setStatus(job, "error", message);
}

async function process(file) {
  const job = createJob(file);
  if (!isPdf(file)) return fail(job, "Keine PDF-Datei");
  if (file.size > MAX_BYTES) return fail(job, `Zu groß (max. ${formatSize(MAX_BYTES)})`);
  setStatus(job, "working", "wird zugeschnitten …");
  try {
    const buffer = await file.arrayBuffer();
    await engineReady;
    worker.postMessage({ id: job.id, buffer }, [buffer]);
  } catch {
    fail(job, "Datei konnte nicht gelesen werden");
  }
}

function handleFiles(files) {
  for (const file of files) process(file);
}

input.addEventListener("change", () => {
  handleFiles(input.files);
  input.value = "";
});

for (const type of ["dragenter", "dragover"]) {
  drop.addEventListener(type, (e) => {
    e.preventDefault();
    drop.classList.add("over");
  });
}
for (const type of ["dragleave", "drop"]) {
  drop.addEventListener(type, () => drop.classList.remove("over"));
}
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
});
// Datei außerhalb der Fläche fallen lassen: nicht im Tab öffnen.
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());
