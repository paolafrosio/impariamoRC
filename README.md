# Impariamo a usare RoboCompass — Quaderno di Geometria

Applicazione web interattiva multilingue (14 lingue) per imparare la geometria euclidea e i comandi `point()`, `line()`, `arc()`, `interpolate()`, `perp()`, `parallel()` e `intersect()`.

## Struttura del progetto

- `index.html` — Struttura HTML della pagina
- `css/style.css` — Stili grafici e anteprima mobile
- `js/i18n.js` — Traduzioni in 14 lingue
- `js/exercises.js` — I 14 esercizi guidati
- `js/parser.js` — Interprete dei comandi geometrici
- `js/canvas.js` — Motore di disegno sul foglio quadrettato
- `js/visual-learn.js` — Finestra "Impara guardando" e mini-video tutorial
- `js/app.js` — Gestione interfaccia, impostazioni e avvio

## Come pubblicare su GitHub Pages

1. Carica tutti questi file e cartelle nel tuo repository GitHub.
2. Vai su **Settings → Pages**.
3. Sotto **Build and deployment**, scegli **Deploy from a branch**, seleziona `main` e `/ (root)`, poi clicca **Save**.
