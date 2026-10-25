// Slow & Steady — browser-local task simplifier using an open-weight model.
// First AI use downloads model files to the browser cache. After caching, inference can work offline.
// No task text is sent to a project server.
const $ = (id) => document.getElementById(id);
const input = $("taskInput");
const simplifyBtn = $("simplifyBtn");
const modelStatus = $("modelStatus");
const taskList = $("taskList");
const planSummary = $("planSummary");
const planFooter = $("planFooter");
let energy = "medium";
let tasks = [];
let generatorPromise = null;

const energyCopy = {
  low: "Protect your energy. One tiny step is enough for today.",
  medium: "A little progress is still progress.",
  high: "Use the momentum gently — breaks still count."
};
const tinyStarts = [
  "Open the document or app. That's the whole first step.",
  "Set a five-minute timer and do only the easiest part.",
  "Write down the very next action. Ignore the rest for now.",
  "Put everything you need in one place, then take a short break.",
  "Do a two-minute version of the task. You can stop after that."
];

function setStatus(message, state = "") {
  modelStatus.className = `model-status ${state}`.trim();
  modelStatus.querySelector("span:last-child").textContent = message;
}

function parseLines(text) {
  return text.split(/\n|,(?=\s*[A-Z0-9])/).map(s => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
}

function fallbackPlan(raw) {
  const lines = parseLines(raw);
  const limit = energy === "low" ? 3 : 6;
  return lines.slice(0, limit).map((item, index) => {
    const cleaned = item.replace(/[.!?]+$/, "");
    const short = cleaned.length > 70 ? cleaned.slice(0, 67).trimEnd() + "…" : cleaned;
    const starter = energy === "low"
      ? `Spend just two minutes on “${short}”. Make the smallest possible start.`
      : `Start with the easiest visible action for “${short}”. Keep it to one short session.`;
    return { title: short, step: starter, time: energy === "low" ? "2 min" : (index === 0 ? "5 min" : "10 min") };
  });
}

async function getGenerator() {
  if (!generatorPromise) {
    generatorPromise = (async () => {
      setStatus("Loading open model into your browser… first use may take a little while.", "loading");
      const { pipeline, env } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2");
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      // LaMini-Flan-T5 is an open-weight, compact instruction model suitable for a lightweight demo.
      return await pipeline("text2text-generation", "Xenova/LaMini-Flan-T5-248M", {
        progress_callback: (progress) => {
          if (progress.status === "progress" && progress.total) {
            const pct = Math.round(progress.loaded / progress.total * 100);
            setStatus(`Preparing local AI model… ${pct}%`, "loading");
          } else if (progress.status === "download") {
            setStatus("Downloading model files to browser cache…", "loading");
          }
        }
      });
    })();
  }
  return generatorPromise;
}

async function makePlan(raw) {
  const lines = parseLines(raw);
  if (!lines.length) return [];
  try {
    const generator = await getGenerator();
    setStatus("Thinking locally… your task list stays in this browser.", "loading");
    const prompt = `Turn this list into up to ${energy === "low" ? 3 : 5} gentle, practical micro-tasks. Use plain language. For each item write one short action that takes 2 to 10 minutes. Keep the original meaning. Avoid motivational speeches. Input: ${lines.join("; ")}. Output as a numbered list.`;
    const result = await generator(prompt, { max_new_tokens: 160, temperature: 0.3 });
    const generated = result?.[0]?.generated_text || "";
    const generatedLines = parseLines(generated).map(s => s.replace(/^\d+\s*/, "").trim()).filter(s => s.length > 3);
    if (!generatedLines.length) throw new Error("Model returned no useful steps");
    setStatus("Open-weight AI ready · generated in your browser.", "");
    return generatedLines.slice(0, energy === "low" ? 3 : 5).map((item, i) => ({
      title: item.length > 75 ? item.slice(0, 72) + "…" : item,
      step: `Only focus on this step. When you're done, pause and decide whether you want to continue.`,
      time: energy === "low" ? "2 min" : (i === 0 ? "5 min" : "10 min")
    }));
  } catch (error) {
    console.warn("Local model unavailable; using private fallback plan.", error);
    setStatus("Using instant offline-style task breakdown · AI model couldn't load.", "error");
    return fallbackPlan(raw);
  }
}

function renderTasks() {
  taskList.innerHTML = "";
  if (!tasks.length) {
    planSummary.hidden = false;
    planFooter.hidden = true;
    return;
  }
  planSummary.hidden = true;
  planFooter.hidden = false;
  tasks.forEach((task, index) => {
    const item = document.createElement("div");
    item.className = `task-item ${task.done ? "done" : ""}`;
    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "task-check";
    check.checked = !!task.done;
    check.setAttribute("aria-label", `Mark ${task.title} complete`);
    check.addEventListener("change", () => {
      tasks[index].done = check.checked;
      renderTasks();
    });
    const content = document.createElement("div");
    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;
    const step = document.createElement("div");
    step.className = "task-step";
    step.textContent = task.step;
    content.append(title, step);
    const time = document.createElement("span");
    time.className = "task-time";
    time.textContent = task.time;
    item.append(check, content, time);
    taskList.append(item);
  });
  const done = tasks.filter(t => t.done).length;
  $("progressText").textContent = `${done} of ${tasks.length} complete`;
  $("progressBar").style.width = `${tasks.length ? done / tasks.length * 100 : 0}%`;
}

simplifyBtn.addEventListener("click", async () => {
  const raw = input.value.trim();
  if (!raw) {
    input.focus();
    setStatus("Add one or two things first — messy notes are welcome.", "");
    return;
  }
  simplifyBtn.disabled = true;
  simplifyBtn.innerHTML = "<span>◌</span> Making things lighter…";
  try {
    tasks = await makePlan(raw);
    renderTasks();
  } finally {
    simplifyBtn.disabled = false;
    simplifyBtn.innerHTML = "<span>✦</span> Make it manageable <span class=\"button-arrow\">↗</span>";
  }
});

document.querySelectorAll(".energy-option").forEach(button => {
  button.addEventListener("click", () => {
    energy = button.dataset.energy;
    document.querySelectorAll(".energy-option").forEach(b => b.classList.toggle("selected", b === button));
    $("energyMessage").textContent = energyCopy[energy];
  });
});

$("ritualBtn").addEventListener("click", () => {
  const message = tinyStarts[Math.floor(Math.random() * tinyStarts.length)];
  const result = $("ritualResult");
  result.hidden = false;
  result.textContent = message;
});

$("clearCompletedBtn").addEventListener("click", () => {
  tasks = tasks.filter(t => !t.done);
  renderTasks();
});

$("resetBtn").addEventListener("click", () => {
  input.value = "";
  tasks = [];
  renderTasks();
  setStatus("Fresh start. Nothing to catch up on.", "");
  $("ritualResult").hidden = true;
});

renderTasks();
