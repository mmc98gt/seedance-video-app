const form = document.querySelector("#generationForm");
const submitButton = document.querySelector("#submitButton");
const formError = document.querySelector("#formError");
const jobStatus = document.querySelector("#jobStatus");
const jobLinks = document.querySelector("#jobLinks");
const historyList = document.querySelector("#historyList");
const refreshHistory = document.querySelector("#refreshHistory");

let pollTimer = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  jobLinks.innerHTML = "";

  let advanced = document.querySelector("#advanced").value.trim();
  if (!advanced) {
    advanced = "{}";
  }
  try {
    JSON.parse(advanced);
  } catch {
    showError("El JSON avanzado no es valido.");
    return;
  }

  const data = new FormData(form);
  data.set("advanced", advanced);

  submitButton.disabled = true;
  setStatus("pendiente", "Enviando solicitud local...");

  try {
    const response = await fetch("/api/generations", { method: "POST", body: data });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(readError(payload));
    }
    setStatus(payload.status, `Trabajo local: ${payload.local_id}`);
    startPolling(payload.local_id);
    await loadHistory();
  } catch (error) {
    showError(error.message);
    setStatus("error", error.message);
  } finally {
    submitButton.disabled = false;
  }
});

refreshHistory.addEventListener("click", loadHistory);

function startPolling(localId) {
  if (pollTimer) {
    window.clearInterval(pollTimer);
  }
  const poll = async () => {
    try {
      const response = await fetch(`/api/generations/${localId}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(readError(payload));
      }
      renderStatus(payload);
      if (payload.status === "completed" || payload.status === "error") {
        window.clearInterval(pollTimer);
        pollTimer = null;
        await loadHistory();
      }
    } catch (error) {
      setStatus("error", error.message);
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };
  poll();
  pollTimer = window.setInterval(poll, 3000);
}

function renderStatus(payload) {
  const lines = [
    `Estado: ${payload.status}`,
    `Trabajo local: ${payload.local_id}`,
    `Modelo: ${payload.model || "-"}`,
    `Prompt: ${payload.prompt || "-"}`,
  ];
  if (payload.upstream_id) {
    lines.push(`Trabajo Seedance: ${payload.upstream_id}`);
  }
  if (payload.error) {
    lines.push(`Error: ${payload.error}`);
  }
  jobStatus.textContent = lines.join("\n");
  jobLinks.innerHTML = "";
  for (const media of payload.videos || []) {
    const link = document.createElement("a");
    link.href = media.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = media.filename;
    jobLinks.append(link);
  }
}

function setStatus(status, message) {
  jobStatus.textContent = `Estado: ${status}\n${message}`;
}

async function loadHistory() {
  try {
    const response = await fetch("/api/generations");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(readError(payload));
    }
    renderHistory(payload.generations || []);
  } catch (error) {
    historyList.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

function renderHistory(items) {
  historyList.innerHTML = "";
  if (!items.length) {
    historyList.textContent = "No hay generaciones guardadas.";
    return;
  }
  for (const item of items) {
    const element = document.createElement("article");
    element.className = "historyItem";
    const badgeClass = item.status === "completed" ? "completed" : item.status === "error" ? "error" : "";
    const links = (item.videos || [])
      .map((media) => `<a href="${media.url}" target="_blank" rel="noreferrer">${escapeHtml(media.filename)}</a>`)
      .join(" ");
    element.innerHTML = `
      <div class="badge ${badgeClass}">${escapeHtml(item.status)}</div>
      <div><strong>${escapeHtml(item.model || "Modelo")}</strong></div>
      <div>${escapeHtml(truncate(item.prompt || "", 140))}</div>
      <div class="historyMeta">${escapeHtml(new Date(item.created_at).toLocaleString())}</div>
      <div class="links">${links}</div>
    `;
    historyList.append(element);
  }
}

function readError(payload) {
  if (typeof payload?.detail === "string") {
    return payload.detail;
  }
  if (Array.isArray(payload?.detail)) {
    return payload.detail.map((item) => item.msg || JSON.stringify(item)).join("; ");
  }
  return payload?.error || "Error inesperado.";
}

function showError(message) {
  formError.textContent = message;
}

function clearError() {
  formError.textContent = "";
}

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadHistory();
