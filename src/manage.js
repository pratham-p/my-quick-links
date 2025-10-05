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
    try {
      const data = await chrome.storage.local.get("myQuickLinks");
      const myQuickLinks = data.myQuickLinks || {};
      tableBody.innerHTML = "";

      for (const k in myQuickLinks) {
      const tr = document.createElement("tr");

      const tdKey = document.createElement("td");
      tdKey.textContent = k;

      const tdUrl = document.createElement("td");
      tdUrl.textContent = myQuickLinks[k];

      const tdAction = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "delete-btn";
      delBtn.addEventListener("click", async () => {
        try {
          delete myQuickLinks[k];
          await chrome.storage.local.set({ myQuickLinks });
          await loadLinks();
        } catch (error) {
          console.error(`myQuickLinks Extension Error: Failed to delete shortcut: ${error.message}`);
        }
      });
      tdAction.appendChild(delBtn);

      tr.appendChild(tdKey);
      tr.appendChild(tdUrl);
      tr.appendChild(tdAction);
      tableBody.appendChild(tr);
    }
    } catch (error) {
      console.error('myQuickLinks Extension Error: Unable to load links:', error);
      alert('Failed to load shortcuts. Please try refreshing the page.');
    }
  }
  await loadLinks();

  // Handle form submit
  document.getElementById("myForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const shortcut = keyInput.value.trim();
    const dest = urlInput.value.trim();
    
    // Input validation
    if (!shortcut) {
      alert('Please enter a shortcut key');
      return;
    }
    if (!dest) {
      alert('Please enter a destination URL');
      return;
    }
    
    try {
      // Validate URL format
      new URL(dest);
      
      const data = await chrome.storage.local.get("myQuickLinks");
      const myQuickLinks = data.myQuickLinks || {};
      
      // Confirm if overwriting existing shortcut
      if (myQuickLinks[shortcut] && !confirm(`Shortcut "${shortcut}" already exists. Do you want to overwrite it?`)) {
        return;
      }
      
      myQuickLinks[shortcut] = dest;
      await chrome.storage.local.set({ myQuickLinks });

      if (key) {
        window.location.href = dest;
      } else {
        keyInput.value = "";
        urlInput.value = "";
        await loadLinks();
      }
    } catch (error) {
      if (error instanceof TypeError) {
        alert('Please enter a valid URL (include http:// or https://)');
      } else {
        console.error('myQuickLinks Extension Error: Unable to save shortcut:', error);
        alert(`Failed to save shortcut: ${error.message}`);
      }
    }
  });

  // Export
  document.getElementById("exportBtn").addEventListener("click", async () => {
    try {
      const data = await chrome.storage.local.get("myQuickLinks");
      const myQuickLinks = data.myQuickLinks || {};
      
      if (Object.keys(myQuickLinks).length === 0) {
        alert('No shortcuts to export');
        return;
      }
      
      const blob = new Blob([JSON.stringify(myQuickLinks, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-links-backup.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('myQuickLinks Extension Error: Unable to export shortcuts:', error);
      alert(`Failed to export shortcuts: ${error.message}`);
    }
  });

  // Import
  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
  });

  document.getElementById("importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/json') {
      alert('Please select a JSON file');
      return;
    }
    
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      
      if (typeof imported !== "object" || imported === null) {
        alert("Invalid file format. The file must contain a JSON object.");
        return;
      }
      
      // Validate URLs in imported data
      for (const [key, url] of Object.entries(imported)) {
        try {
          new URL(url);
        } catch (error) {
          alert(`Invalid URL found for shortcut "${key}". Import cancelled.`);
          return;
        }
      }
      
      const data = await chrome.storage.local.get("myQuickLinks");
      const myQuickLinks = data.myQuickLinks || {};
      
      // Check for conflicts
      const conflicts = Object.keys(imported).filter(key => myQuickLinks[key]);
      if (conflicts.length > 0) {
        if (!confirm(`${conflicts.length} existing shortcut(s) will be overwritten. Continue?`)) {
          return;
        }
      }
      
      Object.assign(myQuickLinks, imported);
      await chrome.storage.local.set({ myQuickLinks });
      await loadLinks();
      alert(`Successfully imported ${Object.keys(imported).length} shortcut(s)!`);
    } catch (error) {
      console.error('myQuickLinks Extension Error: Unable to import shortcuts:', error);
      if (error instanceof SyntaxError) {
        alert("Failed to parse file. Please make sure it's a valid JSON file.");
      } else {
        alert(`Failed to import shortcuts: ${error.message}`);
      }
    }
  });
});
