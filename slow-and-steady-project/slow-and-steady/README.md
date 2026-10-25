# Slow & Steady

A calm, local-first task simplifier built with HTML, CSS, and JavaScript for the Hacktoberfest Open-Source AI Challenge — **Slow and Steady**.

## What it does
- Brain dump: paste a messy list of tasks.
- Local AI: uses Transformers.js with the open-weight `Xenova/LaMini-Flan-T5-248M` model to turn the list into small steps inside the browser.
- Energy check-in: choose low, okay, or good energy to tune the number and size of suggested tasks.
- Tiny-start prompt: gives a low-pressure way to begin.
- Progress tracking: check off completed steps.

## Run it
Because `app.js` uses JavaScript modules, serve the folder over localhost instead of opening `index.html` directly.

### Option A — VS Code
Install the **Live Server** extension, right-click `index.html`, then choose **Open with Live Server**.

### Option B — Python
From this folder, run:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`.

## Open-source AI and privacy
- The AI library is Transformers.js and the model is open-weight.
- The model runs in the browser; task text is passed to the model locally, not to a custom application backend.
- The first run needs an internet connection to load the library and download model files. The browser can cache model files for later use, but fully offline behavior depends on the browser cache and whether all required assets are already available.
- If the model cannot load, the app falls back to a simple local task breakdown so the interface remains usable.
- This project has no accounts, analytics, or application server.

## Notes
This is a hackathon demo, not a medical or mental-health tool. The model may produce imperfect suggestions; review and edit tasks as needed. The model's exact license and distribution terms should be checked on its model card before publishing or redistributing weights.

## Suggested submission angle
**Slow & Steady — a private AI that turns task overwhelm into tiny starts.** Instead of sending personal notes to a hosted assistant, the project uses an open-weight model that runs in the browser. That makes it easier to inspect, swap, and adapt the AI layer, and keeps everyday task lists on the user's device. It also remains useful when the model cannot load because of a small local fallback.
