# Design – Zuschnitt

Richtung: ruhig, editorial, warm (Vorbild: Galerie-/Verlagsseiten). Kein Grid-Hintergrund, keine Deko ohne Funktion.

- **Farben:** Papier `#f4f0e8`, Papier dunkel `#ebe5d9`, Tinte `#1f1b16`, Tinte weich `#6b6358`, Haarlinie `#d8d0c2`, Akzent Siegelrot `#b2432b` (nur Fokus/Hover/Unterstreichung). Dark: `#15130f` / `#ece6da` / `#e0775a`.
- **Schrift:** Newsreader (Serif, optische Größen) für Titel, Lede, Ablagefläche. Schibsted Grotesk für UI-Text. Titel `letter-spacing: -0.035em`.
- **Layout:** Asymmetrisch, Titel links, Skizze rechts. Arbeitsfläche darunter nach rechts eingerückt. Mobil einspaltig, Skizze ausgeblendet.
- **Skizze:** Handout-Seite mit zwei Folien. Bei Hover/Drag über der Ablage oder nach fertigem Zuschnitt wandern die Folien heraus (CSS `:has()`, keine JS-Animation).
- **Komponenten:** Ablage als flache Fläche (4px Radius, Outline bei Hover). Download als Pill-Button in Tinte, 48px hoch. Ergebnisse als Zeilen mit Haarlinien.
- **Textur:** feTurbulence-Grain, multiply hell / screen dunkel.
- **Copy:** knapp, sachlich. „Läuft als WebAssembly direkt im Browser.“
