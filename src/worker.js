// Läuft im Web Worker, damit die UI beim Zuschneiden großer PDFs nicht einfriert.
import * as mupdf from "mupdf";
import { cropHandout } from "./crop.js";

self.onmessage = ({ data: { id, buffer } }) => {
  try {
    const result = cropHandout(mupdf, new Uint8Array(buffer), (log) =>
      self.postMessage({ id, type: "log", log }),
    );
    self.postMessage({ id, type: "done", ...result }, [result.bytes.buffer]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({ id, type: "error", message });
  }
};

self.postMessage({ type: "ready" });
