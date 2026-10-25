# Slow & Steady 🦥

**A low-effort helper powered by open-weight AI.** Paste a long text to summarize, turn an overwhelming task into a gentle checklist, or get a first draft of a message.

Built with plain **HTML, CSS, and JavaScript**. No framework, API key, database, or paid AI API required.

## Why open AI matters

Slow & Steady is designed to work with **Ollama** and a local open-weight model such as `qwen2.5:3b`. Prompts can be processed on the user's own computer rather than sent to a hosted AI service. You can change the model, inspect the app's code, and adapt its behavior. After the model is downloaded, inference can work without internet; the first download needs an internet connection. Ollama and model hardware requirements still apply.

## Features

- Summarize long text into concise points and a takeaway.
- Break a task into small, energy-aware checklist steps.
- Draft messages in different tones.
- Check local Ollama connection and choose a model.
- Copy results and tick off completed steps.
- Lightweight fallback behavior when local AI is unavailable (fallbacks are not model-generated).

## Run locally

1. Install [Ollama](https://ollama.com/).
2. Open Windows Terminal / PowerShell and download a model:

   ```powershell
   ollama pull qwen2.5:3b
   ```

3. Ollama normally runs as a background service. If it isn't running, start:

   ```powershell
   ollama serve
   ```

4. In this folder, start a simple local web server. If Python is installed:

   ```powershell
   py -m http.server 8000
   ```

5. Open `http://localhost:8000` in your browser.
6. Click the gear icon if you need to change the Ollama address or model.

### Windows browser connection note

A browser may block requests to Ollama because of CORS or local-network access restrictions. If that happens, configure Ollama's `OLLAMA_ORIGINS` environment variable to allow your local app origin (for example `http://localhost:8000`) and restart Ollama. Avoid exposing Ollama to public networks. Keep it bound to localhost unless you understand the security implications.

## Try a different model

Pull another model using Ollama, then change the model name in Settings. For example:

```powershell
ollama pull llama3.2:3b
```

Choose a model that fits your device's memory and speed. Model names and availability can change, so check Ollama's model library.

## Project structure

```text
slow_and_steady/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Important limitations

- This is a frontend demo, not a background agent: it only processes text when you click a tool.
- It does not automatically read chats, files, or inboxes.
- The fallback summary is a simple sentence extract, not a substitute for an AI model.
- Google Fonts are loaded from the internet; for a fully offline visual experience, remove the font imports and use system fonts.
- Don't paste secrets or sensitive personal data into any AI tool unless you understand how it handles that data.

## Suggested hackathon post

### Slow & Steady: an open AI helper for the things we keep putting off

I built Slow & Steady, a lightweight browser app that makes small tasks easier: summarizing long text, breaking a daunting task into tiny steps, and drafting messages. It's made with plain HTML, CSS, and JavaScript, and can connect to Ollama running a local open-weight model.

Open innovation matters here because the user can run inference on their own machine, keep prompts local, swap models, and inspect or modify the code instead of depending on a closed API. Once the model is downloaded, the AI features can run without an internet connection (subject to local setup and model requirements). The goal isn't to do more work faster; it's to make everyday work take less effort.

**Stack:** HTML · CSS · JavaScript · Ollama · Qwen 2.5 (open-weight model)

**Run it:** Install Ollama, run `ollama pull qwen2.5:3b`, then serve this folder locally.
