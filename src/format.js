// Reine Hilfsfunktionen der UI (ohne DOM, damit testbar).

export function isPdf(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function outputName(name) {
  return name.replace(/(\.pdf)?$/i, "-zugeschnitten.pdf");
}

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
