const DEFAULT_URL = "http://localhost:11434";
const $ = (id) => document.getElementById(id);
let toastTimer;

const state = {
  url: localStorage.getItem("ss_ollama_url") || DEFAULT_URL,
  model: localStorage.getItem("ss_model") || "qwen2.5:3b",
  connected: false
};

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function go(view) {
  document.querySelectorAll(".view").forEach(el => el.classList.remove("active"));
  const target = $(view + "View");
  if (target) target.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.view === view));
  const labels = { home: "Home", summarize: "Summarize for me", plan: "Make it manageable", write: "Write it for me" };
  $("crumb").textContent = labels[view] || "Home";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-go]").forEach(btn => btn.addEventListener("click", () => go(btn.dataset.go)));
document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => go(btn.dataset.view)));

function openSettings() {
  $("ollamaUrl").value = state.url;
  $("modelName").value = state.model;
  $("settingsModal").classList.remove("hidden");
}
$("settingsBtn").addEventListener("click", openSettings);
$("closeSettings").addEventListener("click", () => $("settingsModal").classList.add("hidden"));
$("settingsModal").addEventListener("click", e => { if (e.target === $("settingsModal")) $("settingsModal").classList.add("hidden"); });

async function checkConnection() {
  $("sidebarStatus").textContent = "Checking local AI…";
  $("statusBadge").textContent = "Checking…";
  $("statusBadge").classList.remove("online");
  try {
    const response = await fetch(`${state.url.replace(/\/$/, "")}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("Ollama is not responding");
    const data = await response.json();
    const models = (data.models || []).map(m => m.name);
    state.connected = true;
    $("sidebarStatus").textContent = "Local AI connected";
    $("sidebarStatus").previousElementSibling.classList.add("online");
    $("statusBadge").textContent = "Connected";
    $("statusBadge").classList.add("online");
    $("connectionTitle").textContent = "Your local AI is ready";
    const found = models.some(m => m === state.model || m.startsWith(state.model.split(":")[0] + ":"));
    $("connectionText").textContent = found
      ? `${state.model} is available on this computer. Your prompts can stay local.`
      : `Ollama is running, but ${state.model} wasn't found yet. Pull it using the command in Settings.`;
    return true;
  } catch (error) {
    state.connected = false;
    $("sidebarStatus").textContent = "Local AI not connected";
    $("sidebarStatus").previousElementSibling.classList.remove("online");
    $("statusBadge").textContent = "Offline";
    $("statusBadge").classList.remove("online");
    $("connectionTitle").textContent = "Connect your open model";
    $("connectionText").textContent = "Run Ollama locally to enable private AI. The app also has a lightweight fallback mode.";
    return false;
  }
}
$("retryBtn").addEventListener("click", async () => { await checkConnection(); showToast(state.connected ? "Local AI is connected." : "Couldn't reach Ollama. Check that it's running."); });
$("saveSettings").addEventListener("click", async () => {
  state.url = $("ollamaUrl").value.trim().replace(/\/$/, "") || DEFAULT_URL;
  state.model = $("modelName").value.trim() || "qwen2.5:3b";
  localStorage.setItem("ss_ollama_url", state.url);
  localStorage.setItem("ss_model", state.model);
  $("settingsModal").classList.add("hidden");
  await checkConnection();
  showToast(state.connected ? "Settings saved. Local AI is ready." : "Settings saved. Start Ollama and try again.");
});

async function askLocalAI(prompt, system) {
  const response = await fetch(`${state.url.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: state.model,
      stream: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      options: { temperature: 0.6 }
    }),
    signal: AbortSignal.timeout(120000)
  });
  if (!response.ok) throw new Error(`Ollama returned ${response.status}. Is the model installed?`);
  const data = await response.json();
  return data.message?.content?.trim() || "I couldn't generate a response. Please try again.";
}

function fallbackSummary(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
  const selected = sentences.slice(0, Math.min(3, sentences.length)).map(s => s.trim());
  return "Quick gist (basic offline fallback):\n\n" + selected.join(" ") +
    (sentences.length > 3 ? "\n\nThis is a simple extractive preview, not a full AI summary. Connect Ollama for a more useful summary." : "\n\nFor a more useful rewrite, connect a local Ollama model in Settings.");
}
function fallbackPlan(task, energy) {
  const first = task.trim().replace(/[.!?]+$/, "");
  const steps = [
    `Make the task smaller: write down what “done” would look like for ${first}.`,
    "Spend 5 minutes gathering only what you need to begin.",
    "Work on one small part for 10 minutes, then pause.",
    "Check what remains and choose just the next step."
  ];
  if (energy === "low") steps.splice(1, 1, "Set a 5-minute timer and do the easiest visible part.");
  return "A gentle plan (basic offline fallback):\n\n" + steps.map((s, i) => `${i + 1}. ${s}`).join("\n") + "\n\nYou can stop after the first step. Starting is progress.";
}
function fallbackDraft(text, tone) {
  return `Here's a starting point in a ${tone} tone:\n\n${text.trim()}\n\n[Adjust the wording and details so it sounds like you. Connect Ollama for a complete AI-written draft.]`;
}
function renderResult(boxId, outputId, text, checklist = false) {
  const output = $(outputId);
  output.innerHTML = "";
  if (checklist) {
    const lines = text.split("\n").map(s => s.trim()).filter(s => s && !/^(your gentle plan|a gentle plan.*)$/i.test(s));
    lines.forEach(line => {
      const clean = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "");
      if (!clean) return;
      const row = document.createElement("label");
      row.className = "task-line";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      const span = document.createElement("span");
      span.textContent = clean;
      row.append(checkbox, span);
      output.appendChild(row);
    });
  } else {
    output.textContent = text;
  }
  $(boxId).classList.remove("hidden");
  $(boxId).scrollIntoView({ behavior: "smooth", block: "nearest" });
}
async function runTask(buttonId, originalLabel, task) {
  const btn = $(buttonId);
  btn.disabled = true;
  btn.innerHTML = "Working on it… <span>✳</span>";
  try {
    return await task();
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalLabel;
  }
}
$("summarizeBtn").addEventListener("click", () => runTask("summarizeBtn", 'Summarize it <span>✳</span>', async () => {
  const input = $("summaryInput").value.trim();
  if (!input) return showToast("Paste some text first and I'll take it from there.");
  if (input.length < 25) return showToast("Add a little more text so I can summarize it.");
  let result;
  try {
    result = await askLocalAI(`Summarize the following text in plain language. Give 3-5 concise bullet points and a one-sentence takeaway. Preserve important facts and do not invent details.\n\nTEXT:\n${input}`, "You are Slow & Steady, a helpful concise assistant. Be accurate, calm, and practical.");
  } catch (e) {
    result = fallbackSummary(input);
    showToast("Local AI unavailable — showing a basic fallback.");
  }
  renderResult("summaryResult", "summaryOutput", result);
}));
$("planBtn").addEventListener("click", () => runTask("planBtn", 'Make a gentle plan <span>✳</span>', async () => {
  const task = $("planInput").value.trim();
  if (!task) return showToast("Tell me what task has been hanging over you.");
  const energy = $("energySelect").value;
  let result;
  try {
    result = await askLocalAI(`Turn this task into a gentle, realistic checklist. Energy level: ${energy}. Give 4-7 short numbered steps, make the first step take under 5 minutes, avoid guilt or hustle language, and end with a reassuring one-sentence reminder. Task: ${task}`, "You are a kind productivity helper for people who want to conserve energy. Be concrete and never overwhelm the user.");
  } catch (e) {
    result = fallbackPlan(task, energy);
    showToast("Local AI unavailable — showing a starter plan.");
  }
  renderResult("planResult", "planOutput", result, true);
}));
$("writeBtn").addEventListener("click", () => runTask("writeBtn", 'Draft it for me <span>↗</span>', async () => {
  const text = $("writeInput").value.trim();
  if (!text) return showToast("Tell me what you need to say first.");
  const tone = $("toneSelect").value;
  let result;
  try {
    result = await askLocalAI(`Write a ready-to-edit draft based on this request. Tone: ${tone}. Do not add facts that weren't provided. Output only the draft, without an explanation.\n\nREQUEST:\n${text}`, "You are a thoughtful writing assistant. Keep drafts natural, useful, and appropriately concise.");
  } catch (e) {
    result = fallbackDraft(text, tone);
    showToast("Local AI unavailable — showing a draft starter.");
  }
  renderResult("writeResult", "writeOutput", result);
}));
document.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", async () => {
  const text = $(btn.dataset.copy).innerText;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard.");
  } catch {
    const range = document.createRange();
    range.selectNodeContents($(btn.dataset.copy));
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    showToast("Text selected — press Ctrl+C to copy.");
  }
}));
document.addEventListener("keydown", e => { if (e.key === "Escape") $("settingsModal").classList.add("hidden"); });
checkConnection();
