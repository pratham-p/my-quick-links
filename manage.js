document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const key = params.get("key");

  const keyInput = document.getElementById("key");
  const urlInput = document.getElementById("url");
  const tableBody = document.querySelector("#linksTable tbody");

  if (key) {
    document.getElementById("title").textContent = `Add new shortcut: ${key}`;
    keyInput.value = key;
  }

  // Load and render links in table
  async function loadLinks() {
    const data = await chrome.storage.local.get("myLinks");
    const myLinks = data.myLinks || {};
    tableBody.innerHTML = "";

    for (const k in myLinks) {
      const tr = document.createElement("tr");

      const tdKey = document.createElement("td");
      tdKey.textContent = k;

      const tdUrl = document.createElement("td");
      tdUrl.textContent = myLinks[k];

      const tdAction = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "delete-btn";
      delBtn.addEventListener("click", async () => {
        delete myLinks[k];
        await chrome.storage.local.set({ myLinks });
        loadLinks();
      });
      tdAction.appendChild(delBtn);

      tr.appendChild(tdKey);
      tr.appendChild(tdUrl);
      tr.appendChild(tdAction);
      tableBody.appendChild(tr);
    }
  }
  await loadLinks();

  // Handle form submit
  document.getElementById("goForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const shortcut = keyInput.value.trim();
    const dest = urlInput.value.trim();
    if (!shortcut || !dest) return;

    const data = await chrome.storage.local.get("myLinks");
    const myLinks = data.myLinks || {};
    myLinks[shortcut] = dest;
    await chrome.storage.local.set({ myLinks });

    if (key) {
      window.location.href = dest;
    } else {
      keyInput.value = "";
      urlInput.value = "";
      await loadLinks();
    }
  });

  // Export
  document.getElementById("exportBtn").addEventListener("click", async () => {
    const data = await chrome.storage.local.get("myLinks");
    const myLinks = data.myLinks || {};
    const blob = new Blob([JSON.stringify(myLinks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-links-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import
  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
  });

  document.getElementById("importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = JSON.parse(text);
      if (typeof imported === "object" && imported !== null) {
        const data = await chrome.storage.local.get("myLinks");
        const myLinks = data.myLinks || {};
        Object.assign(myLinks, imported);
        await chrome.storage.local.set({ myLinks });
        await loadLinks();
        alert("Imported successfully!");
      } else alert("Invalid file format.");
    } catch {
      alert("Failed to parse file.");
    }
  });
});
