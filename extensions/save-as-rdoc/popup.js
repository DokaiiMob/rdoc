const btn = document.getElementById("save");
const status = document.getElementById("status");

btn.addEventListener("click", async () => {
  btn.disabled = true;
  status.className = "";
  status.textContent = "Extracting…";
  try {
    const res = await chrome.runtime.sendMessage({ type: "save-as-rdoc" });
    if (!res?.ok) throw new Error(res?.error || "Unknown error");
    status.className = "ok";
    status.textContent = `Saved ${res.filename}`;
  } catch (err) {
    status.className = "err";
    status.textContent = err instanceof Error ? err.message : String(err);
  } finally {
    btn.disabled = false;
  }
});
